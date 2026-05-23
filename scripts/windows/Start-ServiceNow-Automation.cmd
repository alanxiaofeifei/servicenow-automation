@echo off
setlocal

set "WSL_DISTRO=Ubuntu"
set "PROJECT_DIR=/home/alanxwsl/projects/servicenow-automation"
set "APP_TITLE=ServiceNow Automation"

title %APP_TITLE%
echo Starting %APP_TITLE% from WSL...
echo Project: %PROJECT_DIR%
echo.
echo Keep this window open while the app is running.
echo If the app does not open, copy the error text from this window.
echo.

wsl.exe -d %WSL_DISTRO% --cd %PROJECT_DIR% bash -lc "set -e; if ! command -v pnpm >/dev/null 2>&1; then corepack enable pnpm >/dev/null 2>&1 || true; fi; pnpm --filter @servicenow-automation/desktop build && pnpm --filter @servicenow-automation/desktop start"

set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo ServiceNow Automation exited with code %EXIT_CODE%.
pause
exit /b %EXIT_CODE%
