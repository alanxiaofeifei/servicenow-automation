#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=operator-env.sh
. "$SCRIPT_DIR/operator-env.sh"

cd "$SDA_PROJECT_DIR"
sda_load_node_runtime
sda_require_node

echo "ServiceNow Automation Windows packaging preflight"
echo "Status: current Windows double-click path is a WSL dev launcher, not a packaged Windows artifact."
echo "This guardrail fails until packaging config, dedicated browser runtime provisioning, bundled resources, and Windows manual validation are complete."
echo

missing=0

safe_path_label() {
  local path_value="$1"

  case "$path_value" in
    "$SDA_PROJECT_DIR")
      printf '.'
      ;;
    "$SDA_PROJECT_DIR"/*)
      printf '%s' "${path_value#"$SDA_PROJECT_DIR"/}"
      ;;
    *)
      printf '[path redacted]'
      ;;
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

check_executable() {
  local label="$1"
  local path_value="$2"
  local display_path
  display_path="$(safe_path_label "$path_value")"

  if [ -x "$path_value" ]; then
    echo "PASS: $label found"
  else
    echo "FAIL: $label missing or not executable ($display_path)"
    missing=1
  fi
}

check_file "desktop main build output" "$SDA_DESKTOP_DIR/out/main/main.js"
check_file "desktop preload build output" "$SDA_DESKTOP_DIR/out/preload/preload.cjs"
check_file "desktop renderer build output" "$SDA_DESKTOP_DIR/out/renderer/index.html"
check_executable "dev Electron binary for the current WSL launcher" "$SDA_DESKTOP_DIR/node_modules/.bin/electron"
check_file "Windows dedicated browser helper source script" "$SDA_PROJECT_DIR/scripts/windows/start-dedicated-chromium-cdp.ps1"

echo
set +e
node <<'NODE'
const fs = require("node:fs");

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const rootPackage = readJson("package.json");
const desktopPackage = readJson("apps/desktop/package.json");
const scripts = {
  ...(rootPackage.scripts ?? {}),
  ...(desktopPackage.scripts ?? {})
};
const dependencies = {
  ...(rootPackage.dependencies ?? {}),
  ...(rootPackage.devDependencies ?? {}),
  ...(desktopPackage.dependencies ?? {}),
  ...(desktopPackage.devDependencies ?? {})
};
const desktopBuildConfig = desktopPackage.build ?? rootPackage.build;
const hasPackagerDependency = ["electron-builder", "electron-forge", "@electron-forge/cli", "electron-packager"].some(
  (name) => Object.prototype.hasOwnProperty.call(dependencies, name)
);
const packageScriptNames = Object.keys(scripts).filter((name) => /^(package|pack|dist|make)(:|$)/.test(name));
const hasPackageScript = packageScriptNames.length > 0;
const serializedPackagingMetadata = JSON.stringify({ build: desktopBuildConfig ?? null, scripts });
const normalizedPackagingMetadata = serializedPackagingMetadata.replace(/\\\\/g, "/").toLowerCase();
const helperBundled = normalizedPackagingMetadata.includes("scripts/windows/start-dedicated-chromium-cdp.ps1");
const runtimeProvisioningDeclared = [
  "scripts/windows/install-cloakbrowser-runtime.ps1",
  "scripts/windows/prepare-chrome-for-testing.ps1",
  "runtime/chromium",
  "runtime/cloakbrowser",
  "chrome-for-testing",
  "cloakbrowser"
].some((marker) => normalizedPackagingMetadata.includes(marker));

let failed = false;

if (hasPackagerDependency) {
  console.log("PASS: Electron packaging dependency is declared.");
} else {
  console.log("FAIL: No Electron packaging dependency is declared (electron-builder/electron-forge/electron-packager).");
  failed = true;
}

if (hasPackageScript) {
  console.log(`PASS: packaging script(s) declared: ${packageScriptNames.join(", ")}`);
} else {
  console.log("FAIL: No package/pack/dist/make script is declared for a Windows artifact.");
  failed = true;
}

if (desktopBuildConfig) {
  console.log("PASS: desktop/root package contains packaging build setup.");
} else {
  console.log("FAIL: No packaging build setup found in root or desktop package.json.");
  failed = true;
}

if (helperBundled) {
  console.log("PASS: helper script appears in the packaging resource list.");
} else {
  console.log("FAIL: packaging setup does not bundle the Windows dedicated browser helper script.");
  failed = true;
}

if (runtimeProvisioningDeclared) {
  console.log("PASS: dedicated browser runtime provisioning appears in packaging setup.");
} else {
  console.log("FAIL: no pinned dedicated browser runtime bundle or verified installer step appears in packaging setup.");
  failed = true;
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

echo "Packaging preflight result: INCOMPLETE. Do not claim packaged Windows artifact support yet."
echo "Required next step: add real Windows packaging config, bundle external helper/runtime resources or a verified runtime installer, build the artifact, and validate it on Windows without WSL/dev node_modules/source dependencies."
exit 2
