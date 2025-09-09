#!/usr/bin/env bash
set -euo pipefail

# Build Toybox to WebAssembly inside the official Emscripten Docker image.
#
# Requires: Docker (or Podman with alias docker=podman)
# Usage: ./scripts/build_toybox_docker.sh [git_ref]

REF="${1:-master}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

IMG="emscripten/emsdk:latest"

echo "Pulling $IMG if needed..."
docker pull "$IMG" >/dev/null

echo "Running build inside container..."
docker run --rm -it \
  -v "$ROOT_DIR:/work" \
  -w /work \
  -e HOME=/root \
  "$IMG" \
  bash -lc "git config --global --add safe.directory /work && ./scripts/build_toybox_wasm.sh $REF"

echo "Build complete. Artifacts in wasm-shell/"

