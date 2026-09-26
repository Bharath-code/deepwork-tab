#!/usr/bin/env bash
# Build the Chrome Web Store zip: dist/deepwork-tab-<version>.zip
# Allowlist, not a denylist, so nothing new at the repo root (e.g. the
# licence signing key) can end up in a store upload.
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p "require('./manifest.json').version")
if [[ -n "${1:-}" && "$1" != "v$version" ]]; then
  echo "Tag $1 does not match manifest.json version $version — bump the manifest first." >&2
  exit 1
fi

out="dist/deepwork-tab-$version.zip"
rm -rf dist && mkdir dist
zip -qr "$out" manifest.json background content icons intercept lib options popup shared -x '*.DS_Store'

if unzip -Z1 "$out" | grep -Eiq 'jwk|\.env|\.dev\.vars|private'; then
  echo "Refusing to ship: secret-looking file in $out" >&2
  exit 1
fi

echo "$out"
