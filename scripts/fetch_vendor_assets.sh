#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$ROOT_DIR/vendor/cdn"
mkdir -p "$VENDOR_DIR/xterm" "$VENDOR_DIR/xterm-addon-fit" "$VENDOR_DIR/marked" "$VENDOR_DIR/supabase" "$VENDOR_DIR/papaparse" "$VENDOR_DIR/js-yaml" "$VENDOR_DIR/jszip" "$VENDOR_DIR/dompurify"

curl -fsSL https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js -o "$VENDOR_DIR/xterm/xterm.js"
curl -fsSL https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css -o "$VENDOR_DIR/xterm/xterm.css"
curl -fsSL https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js -o "$VENDOR_DIR/xterm-addon-fit/xterm-addon-fit.js"

# Marked
curl -fsSL https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js -o "$VENDOR_DIR/marked/marked.min.js"

# Supabase UMD build (global 'supabase')
curl -fsSL https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js -o "$VENDOR_DIR/supabase/supabase.umd.js"

# PapaParse
curl -fsSL https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js -o "$VENDOR_DIR/papaparse/papaparse.min.js"

# js-yaml
curl -fsSL https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js -o "$VENDOR_DIR/js-yaml/js-yaml.min.js"

# JSZip
curl -fsSL https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js -o "$VENDOR_DIR/jszip/jszip.min.js"

# DOMPurify
curl -fsSL https://cdn.jsdelivr.net/npm/dompurify@3.0.8/dist/purify.min.js -o "$VENDOR_DIR/dompurify/purify.min.js"

echo "Vendor assets fetched into $VENDOR_DIR"

