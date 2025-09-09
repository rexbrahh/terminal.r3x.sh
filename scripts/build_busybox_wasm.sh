#!/usr/bin/env bash
set -euo pipefail

# Build BusyBox to WebAssembly using Emscripten, producing:
#   - wasm-shell/shell.js
#   - wasm-shell/shell.wasm
#
# Prereqs:
#   - Emscripten SDK active (emcc/emar/emranlib in PATH)
#   - git, make, sed
#
# Usage:
#   ./scripts/build_busybox_wasm.sh [busybox_version]
#     busybox_version defaults to 1.36.1

BB_VER="${1:-1.36.1}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT_DIR/wasm-shell"
SRC_DIR="$ROOT_DIR/.deps/busybox-$BB_VER"

mkdir -p "$ROOT_DIR/.deps" "$OUT_DIR"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Fetching BusyBox $BB_VER..."
  cd "$ROOT_DIR/.deps"
  curl -L -o "busybox-$BB_VER.tar.bz2" "https://busybox.net/downloads/busybox-$BB_VER.tar.bz2"
  tar xf "busybox-$BB_VER.tar.bz2"
fi

cd "$SRC_DIR"

echo "Preparing config..."
cp -f "$ROOT_DIR/wasm-shell/busybox.config" .config

# Emscripten toolchain
export CC=emcc
export LD=emcc
export AR=emar
export RANLIB=emranlib
export NM=llvm-nm
export STRIP=true

# Flags
COMMON_CFLAGS="-O3 -fno-exceptions -sWASMFS=1 -sFORCE_FILESYSTEM=1 -sALLOW_MEMORY_GROWTH=1 -sENVIRONMENT=web -sEXIT_RUNTIME=1"
COMMON_LDFLAGS="-O3 -sWASM=1 -sWASMFS=1 -sFORCE_FILESYSTEM=1 -sALLOW_MEMORY_GROWTH=1 -sENVIRONMENT=web -sEXIT_RUNTIME=1 -sMODULARIZE=1 -sEXPORT_NAME=ShellModule -sEXPORTED_RUNTIME_METHODS=['callMain'] -sINVOKE_RUN=0"

echo "Running oldconfig..."
# yes exits with SIGPIPE when the consumer stops reading; with pipefail this would
# fail the build. Temporarily relax pipefail around this pipeline.
set +o pipefail || true
yes "" | make oldconfig >/dev/null || true
set -o pipefail || true

echo "Building BusyBox with Emscripten... (this may take a while)"
make -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)" \
  CFLAGS+="$COMMON_CFLAGS" \
  LDFLAGS+="$COMMON_LDFLAGS" \
  || { echo 'BusyBox build failed'; exit 2; }

# BusyBox will produce an ELF-like output named 'busybox'. Re-link it via emcc to JS/WASM.
echo "Looking for emcc outputs..."
# emcc often emits a.out.js/a.out.wasm when output name lacks extension
if [[ -f a.out.js && -f a.out.wasm ]]; then
  cp -f a.out.js "$OUT_DIR/shell.js"
  cp -f a.out.wasm "$OUT_DIR/shell.wasm"
  echo "Copied a.out.js → $OUT_DIR/shell.js"
  echo "Copied a.out.wasm → $OUT_DIR/shell.wasm"
elif [[ -f busybox.js && -f busybox.wasm ]]; then
  cp -f busybox.js "$OUT_DIR/shell.js"
  cp -f busybox.wasm "$OUT_DIR/shell.wasm"
  echo "Copied busybox.js → $OUT_DIR/shell.js"
else
  echo "Attempting manual link to JS/WASM..."
  if [[ -f busybox_unstripped ]]; then
    BIN=busybox_unstripped
  elif [[ -f busybox ]]; then
    BIN=busybox
  else
    echo "Cannot find busybox or a.out outputs; build likely failed."
    exit 3
  fi
  emcc $COMMON_LDFLAGS -o "$OUT_DIR/shell.js" "$BIN" || { echo 'emcc link failed'; exit 4; }
fi

echo "Built: $OUT_DIR/shell.js (and shell.wasm if present)"
echo "Run the dev server with isolation and try 'sh' in the app."
