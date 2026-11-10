#!/bin/sh
# Store screenshots from the preview server (node tools/preview/server.mjs must be running).
set -e
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$(cd "$(dirname "$0")/../.." && pwd)/store-listing/screenshots"
BASE=http://127.0.0.1:8766
mkdir -p "$OUT"
enc() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }
shot() {
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 \
    --virtual-time-budget=5000 --screenshot="$OUT/$1.png" "$BASE$2" >/dev/null 2>&1
  echo "$1.png"
}
shot 1-intercept "/intercept/intercept.html?target=$(enc 'https://www.youtube.com/watch?v=8mQ2xJtK3vE')&s=$(enc '{"seenIntercept":true}')&fill=$(enc 'intent:one video for the launch post, then back to the draft')"
shot 2-shelf "/tools/preview/frame.html?s=$(enc '{"weekLog":[]}')"
shot 3-gate "/options/options.html?fill=cap:12&click=saveBtn"
shot 4-week "/tools/preview/frame.html?s=$(enc '{"queue":[]}')"
shot 5-cap "/welcome/welcome.html?s=$(enc '{"onboarded":false,"onboardStep":"cap"}')"
