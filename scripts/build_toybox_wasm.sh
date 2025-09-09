#!/usr/bin/env bash
set -euo pipefail

# Build Toybox (sh + coreutils) to WebAssembly using Emscripten.
# Produces wasm-shell/shell.js and wasm-shell/shell.wasm.
#
# Prerequisites:
#   - Emscripten SDK activated in this shell (emcc on PATH)
#   - git, make, sed, curl
#
# Usage:
#   ./scripts/build_toybox_wasm.sh [git_ref]
#     git_ref defaults to master

REF="${1:-master}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPS_DIR="$ROOT_DIR/.deps"
OUT_DIR="$ROOT_DIR/wasm-shell"
SRC_DIR="$DEPS_DIR/toybox"

mkdir -p "$DEPS_DIR" "$OUT_DIR"

# Ensure emsdk is available if emcc is missing
if ! command -v emcc >/dev/null 2>&1; then
  echo "No emcc found; attempting to set up emsdk locally..."
  source "$(cd "$(dirname "$0")" && pwd)/setup_emsdk.sh"
fi

if [[ ! -d "$SRC_DIR/.git" ]]; then
  echo "Cloning Toybox..."
  git clone --depth 1 https://github.com/landley/toybox.git "$SRC_DIR"
else
  echo "Updating Toybox..."
  (cd "$SRC_DIR" && git fetch --depth 1 origin "$REF" && git checkout -f "$REF")
fi

cd "$SRC_DIR"

echo "Preparing config (defconfig)..."
make defconfig >/dev/null

# Toybox tries to use Linux-only headers for some applets; enable a portable set.
# We'll force Emscripten toolchain via env, and compile a reduced feature set.

export CC="emcc"
export LD="emcc"
export AR="emar"
export RANLIB="emranlib"
# Prefer GNU sed on macOS for Toybox's sed scripts
if [[ "$(uname -s)" == "Darwin" ]]; then
  if command -v gsed >/dev/null 2>&1; then
    export SED="gsed"
  else
    export SED="sed"
  fi
fi

# Apply tiny Emscripten compatibility patch (stubs for xnotify/mount list)
if ! grep -q "__EMSCRIPTEN__ compatibility stubs" lib/portability.c 2>/dev/null; then
  bash "$ROOT_DIR/scripts/patch_toybox_for_emscripten.sh" lib/portability.c || true
fi

# Common flags for Emscripten browser builds
EM_FLAGS=(
  -O3
  -sWASMFS=1
  -sFORCE_FILESYSTEM=1
  -sALLOW_MEMORY_GROWTH=1
  -sENVIRONMENT=web
  -sEXIT_RUNTIME=1
  -sMODULARIZE=1
  -sEXPORT_NAME=ShellModule
  -sEXPORTED_RUNTIME_METHODS='["callMain"]'
  -sINVOKE_RUN=0
)

echo "Building Toybox (this may take a minute)..."
make -j"$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)" \
  V=1 \
  CFLAGS+=" ${EM_FLAGS[*]} -D__EMSCRIPTEN__ -DPORTABLE=1 -fno-exceptions" \
  LDFLAGS+=" ${EM_FLAGS[*]} " || {
    echo "Toybox build failed"; exit 2;
  }

# Emscripten commonly emits a.out.js/.wasm. Locate and copy.
echo "Looking for Emscripten outputs..."
if [[ -f a.out.js && -f a.out.wasm ]]; then
  cp -f a.out.js   "$OUT_DIR/shell.js"
  cp -f a.out.wasm "$OUT_DIR/shell.wasm"
  echo "Copied a.out.js → $OUT_DIR/shell.js"
elif [[ -f toybox.js && -f toybox.wasm ]]; then
  cp -f toybox.js   "$OUT_DIR/shell.js"
  cp -f toybox.wasm "$OUT_DIR/shell.wasm"
  echo "Copied toybox.js → $OUT_DIR/shell.js"
else
  # As a fallback, link whatever 'toybox' binary was produced via emcc
  if [[ -f toybox ]]; then
    echo "Linking toybox with emcc → JS/WASM..."
    emcc "${EM_FLAGS[@]}" \
      -o "$OUT_DIR/shell.js" toybox || { echo 'emcc link failed'; exit 4; }
  else
    echo "Could not find Emscripten outputs (a.out.js or toybox.js)."
    echo "Check the build log above for errors."
    exit 3
  fi
fi

echo "Built: $OUT_DIR/shell.js (and shell.wasm). Try: npm run dev and 'sh' in the app."
