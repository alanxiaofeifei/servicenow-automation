#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=operator-env.sh
. "$SCRIPT_DIR/operator-env.sh"

cd "$SDA_PROJECT_DIR"
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js was not found on PATH." >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm was not found on PATH." >&2
  exit 1
fi
echo "node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"

echo "ServiceNow Automation Windows packaging preflight"
echo "Status: package/build prerequisites only; manual Windows acceptance is still required."
echo

missing=0

safe_path_label() {
  local path_value="$1"
  case "$path_value" in
    "$SDA_PROJECT_DIR") printf '.' ;;
    "$SDA_PROJECT_DIR"/*) printf '%s' "${path_value#"$SDA_PROJECT_DIR"/}" ;;
    *) printf '[path redacted]' ;;
  esac
}

check_file() {
  local label="$1"
  local path_value="$2"
  local display_path
  display_path="$(safe_path_label "$path_value")"

  if [ -f "$path_value" ]; then
    echo "PASS: $label found"
  else
    echo "FAIL: $label missing ($display_path)"
    missing=1
  fi
}

check_file "desktop main build output" "$SDA_DESKTOP_DIR/out/main/main.js"
if [ -f "$SDA_DESKTOP_DIR/out/preload/preload.mjs" ] || [ -f "$SDA_DESKTOP_DIR/out/preload/preload.cjs" ]; then
  echo "PASS: desktop preload build output found"
else
  echo "FAIL: desktop preload build output missing"
  missing=1
fi
check_file "desktop renderer build output" "$SDA_DESKTOP_DIR/out/renderer/index.html"
check_file "Windows dedicated browser helper source script" "$SDA_PROJECT_DIR/scripts/windows/start-dedicated-chromium-cdp.ps1"
check_file "Windows local CDP expression helper source script" "$SDA_PROJECT_DIR/scripts/windows/evaluate-local-cdp-expression.ps1"
check_file "local CDP bridge source script" "$SDA_PROJECT_DIR/scripts/local-cdp-bridge.py"

set +e
node <<'NODE'
const fs = require("node:fs");

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function fail(message) {
  console.log(`FAIL: ${message}`);
  failed = true;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

const rootPackage = readJson("package.json");
const desktopPackage = readJson("apps/desktop/package.json");
const scripts = { ...(rootPackage.scripts ?? {}), ...(desktopPackage.scripts ?? {}) };
const desktopBuildConfig = desktopPackage.build;
const desktopDevDependencies = desktopPackage.devDependencies ?? {};
const extraResources = desktopBuildConfig?.extraResources ?? [];
const serializedResources = JSON.stringify(extraResources).replace(/\\\\/g, "/").toLowerCase();
let failed = false;

if (desktopDevDependencies["electron-builder"]) {
  pass("Electron Builder dependency is declared in the desktop package.");
} else {
  fail("Electron Builder dependency is missing from the desktop package.");
}

if (scripts["package:windows"] === "pnpm build && electron-builder --win zip") {
  pass("desktop package:windows script builds a Windows zip artifact.");
} else {
  fail("desktop package:windows script is missing or unexpected.");
}

if (rootPackage.scripts?.["release:windows:rc"] === "bash scripts/packaging/build-windows-rc.sh") {
  pass("root release:windows:rc delegates to the RC packaging script.");
} else {
  fail("root release:windows:rc delegation is missing or unexpected.");
}

if (desktopBuildConfig?.asar === true && desktopBuildConfig?.win?.target?.includes("zip")) {
  pass("desktop Electron Builder config creates an asar-backed Windows zip.");
} else {
  fail("desktop Electron Builder config does not declare asar Windows zip packaging.");
}

if (desktopBuildConfig?.win?.signAndEditExecutable === false) {
  pass("Windows zip packaging is configured to avoid requiring Wine in WSL/Linux builds.");
} else {
  fail("Windows zip packaging may require Wine because signAndEditExecutable is not false.");
}

if (serializedResources.includes("scripts/windows") && serializedResources.includes("scripts/local-cdp-bridge.py")) {
  pass("packaging resources include Windows helpers and the local CDP bridge.");
} else {
  fail("packaging resources do not include required helper resources.");
}

if (fs.existsSync("scripts/windows/install-cloakbrowser-runtime.ps1") || fs.existsSync("scripts/windows/prepare-chrome-for-testing.ps1")) {
  pass("dedicated browser runtime provisioning scripts exist for manual setup.");
} else {
  fail("dedicated browser runtime provisioning scripts are missing.");
}

process.exit(failed ? 2 : 0);
NODE
node_status=$?
set -e
if [ "$node_status" -ne 0 ]; then
  missing=1
fi

echo
if [ "$missing" -eq 0 ]; then
  echo "Packaging preflight result: PASS for package/build prerequisites only. Windows artifact still needs manual double-click validation before packaging acceptance."
  exit 0
fi

echo "Packaging preflight result: INCOMPLETE. Do not claim packaged Windows acceptance yet."
exit 2
