#!/usr/bin/env bash
set -euo pipefail

# Lightweight helper to install and activate Emscripten SDK locally under .deps/
# Usage: source scripts/setup_emsdk.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPS_DIR="$ROOT_DIR/.deps"
EMSDK_DIR="$DEPS_DIR/emsdk"

mkdir -p "$DEPS_DIR"

if command -v emcc >/dev/null 2>&1; then
  echo "emsdk: emcc already on PATH ($(command -v emcc))"
  return 0 2>/dev/null || exit 0
fi

if [[ ! -d "$EMSDK_DIR" ]]; then
  echo "emsdk: cloning..."
  git clone https://github.com/emscripten-core/emsdk.git "$EMSDK_DIR"
fi

cd "$EMSDK_DIR"
echo "emsdk: installing latest (via python3 emsdk.py)..."
python3 ./emsdk.py install latest
echo "emsdk: activating (via python3 emsdk.py)..."
python3 ./emsdk.py activate latest

# shellcheck disable=SC1091
source ./emsdk_env.sh || true

echo "emsdk: ready (emcc=$(command -v emcc || echo not-found))"
