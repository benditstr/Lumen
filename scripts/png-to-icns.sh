#!/usr/bin/env bash
# Convert build/icon-1024.png into build/icon.icns using macOS sips + iconutil.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=build/icon-1024.png
SET=build/icon.iconset
[ -f "$SRC" ] || { echo "missing $SRC — run: npx electron scripts/make-icon.mjs"; exit 1; }

rm -rf "$SET"
mkdir -p "$SET"

for size in 16 32 128 256 512; do
  sips -z "$size" "$size" "$SRC" --out "$SET/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  sips -z "$double" "$double" "$SRC" --out "$SET/icon_${size}x${size}@2x.png" >/dev/null
done

iconutil -c icns "$SET" -o build/icon.icns
echo "Wrote build/icon.icns"
