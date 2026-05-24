#!/usr/bin/env bash
# Shared WSL bootstrap helpers for the Windows desktop operator launcher.
# Keep this file free of ServiceNow URLs, ticket IDs, cookies, sessions, and field values.

sda_script_dir() {
  local source_path="${BASH_SOURCE[0]}"
  cd "$(dirname "$source_path")" && pwd
}

SDA_SCRIPT_DIR="${SDA_SCRIPT_DIR:-$(sda_script_dir)}"
SDA_PROJECT_DIR="${SDA_PROJECT_DIR:-$(cd "$SDA_SCRIPT_DIR/../.." && pwd)}"
SDA_DESKTOP_DIR="$SDA_PROJECT_DIR/apps/desktop"
SDA_PNPM_VERSION="${SDA_PNPM_VERSION:-9.15.4}"
SDA_NODE_VERSION="${SDA_NODE_VERSION:-24.15.0}"
SDA_WSL_DISTRO="${SDA_WSL_DISTRO:-${WSL_DISTRO_NAME:-Ubuntu}}"

sda_to_unc_path() {
  local path="$1"
  local windows_path="${path//\//\\}"
  printf '\\\\wsl.localhost\\%s%s' "$SDA_WSL_DISTRO" "$windows_path"
}

sda_prepend_path() {
  local dir="$1"
  if [ -d "$dir" ]; then
    case ":$PATH:" in
      *":$dir:"*) ;;
      *) export PATH="$dir:$PATH" ;;
    esac
  fi
}

sda_log_runtime_path() {
  local name="$1"
  local command_path
  if command_path="$(command -v "$name" 2>/dev/null)"; then
    printf '%s: %s\n' "$name" "$command_path"
  else
    printf '%s: not found\n' "$name"
  fi
}

sda_load_node_runtime() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
    if command -v nvm >/dev/null 2>&1; then
      if [ -f "$SDA_PROJECT_DIR/.nvmrc" ]; then
        nvm use --silent >/dev/null 2>&1 || true
      elif nvm ls "$SDA_NODE_VERSION" >/dev/null 2>&1; then
        nvm use --silent "$SDA_NODE_VERSION" >/dev/null 2>&1 || true
      else
        nvm use --silent default >/dev/null 2>&1 || true
      fi
    fi
  fi

  sda_prepend_path "$HOME/.nvm/versions/node/v$SDA_NODE_VERSION/bin"
  sda_prepend_path "$HOME/.local/share/pnpm"
  sda_prepend_path "$HOME/.npm-global/bin"
}

sda_require_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js was not found after loading NVM/PATH." >&2
    echo "Expected NVM at: $HOME/.nvm" >&2
    echo "Run the repair script from a WSL terminal if this persists: scripts/wsl/repair-env.sh" >&2
    return 1
  fi
  echo "node version: $(node --version)"
}

sda_ensure_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    echo "pnpm version: $(pnpm --version)"
    return 0
  fi

  if command -v corepack >/dev/null 2>&1; then
    echo "pnpm not found; activating pnpm@$SDA_PNPM_VERSION with corepack..."
    corepack prepare "pnpm@$SDA_PNPM_VERSION" --activate >/dev/null 2>&1 || corepack enable pnpm >/dev/null 2>&1 || true
  fi

  sda_prepend_path "$HOME/.nvm/versions/node/v$SDA_NODE_VERSION/bin"
  sda_prepend_path "$HOME/.local/share/pnpm"

  if command -v pnpm >/dev/null 2>&1; then
    echo "pnpm version: $(pnpm --version)"
    return 0
  fi

  local fallback="$HOME/.nvm/versions/node/v$SDA_NODE_VERSION/bin/pnpm"
  if [ -x "$fallback" ]; then
    export PATH="$(dirname "$fallback"):$PATH"
    echo "pnpm version: $($fallback --version)"
    return 0
  fi

  echo "ERROR: pnpm was not found after loading NVM and corepack." >&2
  echo "Expected package manager: pnpm@$SDA_PNPM_VERSION" >&2
  echo "Run the repair script from a WSL terminal if this persists: scripts/wsl/repair-env.sh" >&2
  return 1
}

sda_desktop_electron_bin() {
  printf '%s/node_modules/.bin/electron' "$SDA_DESKTOP_DIR"
}

sda_desktop_preload_file() {
  printf '%s/out/preload/preload.cjs' "$SDA_DESKTOP_DIR"
}

sda_desktop_build_outputs_exist() {
  [ -f "$SDA_DESKTOP_DIR/out/main/main.js" ] && \
    [ -f "$(sda_desktop_preload_file)" ] && \
    [ -f "$SDA_DESKTOP_DIR/out/renderer/index.html" ]
}

sda_require_desktop_build_outputs() {
  local missing=0
  local expected_outputs=(
    "$SDA_DESKTOP_DIR/out/main/main.js"
    "$(sda_desktop_preload_file)"
    "$SDA_DESKTOP_DIR/out/renderer/index.html"
  )

  for output_path in "${expected_outputs[@]}"; do
    if [ ! -f "$output_path" ]; then
      echo "ERROR: Desktop build output is missing: $output_path" >&2
      missing=1
    fi
  done

  if [ "$missing" -ne 0 ]; then
    echo "Run the repair script from a WSL terminal: scripts/wsl/repair-env.sh" >&2
    return 1
  fi
}

sda_require_gui_display() {
  if [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; then
    return 0
  fi

  echo "ERROR: No WSL GUI display is available for Electron." >&2
  echo "Expected DISPLAY or WAYLAND_DISPLAY from WSLg when launching the desktop app." >&2
  echo "Open the Windows launcher from an interactive Windows session, or repair WSLg/WSL GUI support." >&2
  echo "For a non-GUI dependency check, run: SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh" >&2
  return 1
}

sda_desktop_sources_newer_than_build() {
  local marker="$SDA_DESKTOP_DIR/out/main/main.js"
  [ -f "$marker" ] || return 0
  [ "${SDA_AUTO_BUILD:-1}" = "0" ] && return 1
  if find "$SDA_PROJECT_DIR/apps/desktop" "$SDA_PROJECT_DIR/packages" \
    -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.json' \) \
    -newer "$marker" -print -quit | grep -q .; then
    return 0
  fi
  return 1
}

sda_ensure_desktop_dependencies() {
  local electron_bin
  electron_bin="$(sda_desktop_electron_bin)"
  if [ -x "$electron_bin" ]; then
    echo "desktop electron: $electron_bin"
    return 0
  fi

  echo "Desktop Electron dependency is missing; installing workspace dependencies..."
  sda_ensure_pnpm
  (cd "$SDA_PROJECT_DIR" && pnpm install --frozen-lockfile)

  if [ ! -x "$electron_bin" ]; then
    echo "ERROR: Electron binary still missing after install: $electron_bin" >&2
    return 1
  fi
  echo "desktop electron: $electron_bin"
}

sda_ensure_desktop_build() {
  if [ "${SDA_FORCE_BUILD:-0}" = "1" ]; then
    echo "SDA_FORCE_BUILD=1; rebuilding desktop artifacts..."
    sda_ensure_pnpm
    (cd "$SDA_PROJECT_DIR" && pnpm --filter @servicenow-automation/desktop build)
    return 0
  fi

  if ! sda_desktop_build_outputs_exist; then
    echo "Desktop build output is missing; building once before launch..."
    sda_ensure_pnpm
    (cd "$SDA_PROJECT_DIR" && pnpm --filter @servicenow-automation/desktop build)
    return 0
  fi

  if sda_desktop_sources_newer_than_build; then
    echo "Desktop source files are newer than build output; rebuilding once before launch..."
    sda_ensure_pnpm
    (cd "$SDA_PROJECT_DIR" && pnpm --filter @servicenow-automation/desktop build)
    return 0
  fi

  echo "Desktop build output found; skipping build."
}

sda_print_runtime_summary() {
  echo "Runtime summary:"
  sda_log_runtime_path node
  sda_log_runtime_path corepack
  sda_log_runtime_path pnpm
  echo "Project: $SDA_PROJECT_DIR"
  echo "Desktop: $SDA_DESKTOP_DIR"
}
