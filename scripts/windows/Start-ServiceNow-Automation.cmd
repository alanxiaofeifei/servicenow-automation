@echo off
setlocal

set "APP_TITLE=ServiceNow Automation"
if not defined SDA_WSL_DISTRO set "SDA_WSL_DISTRO=Ubuntu"

REM Optional override: set SDA_WSL_PROJECT_DIR to the Linux path of the repo.
REM Default is generic and avoids embedding any user-specific local path in source.
set "DEFAULT_PROJECT_DIR=$HOME/projects/servicenow-automation"

title %APP_TITLE%
echo Starting %APP_TITLE% from WSL...
echo WSL distro: %SDA_WSL_DISTRO%
echo Project: %%SDA_WSL_PROJECT_DIR%% or %DEFAULT_PROJECT_DIR%
echo.
echo Keep this window open while the app is running.
echo Startup details are written to .local/startup-logs inside the project.
echo No ServiceNow Save, Submit, Update, Resolve, Close, upload, email, or API write is performed by this launcher.
echo.

wsl.exe -d "%SDA_WSL_DISTRO%" --cd ~ -- bash -lc "cd ${SDA_WSL_PROJECT_DIR:-$HOME/projects/servicenow-automation} && ./scripts/wsl/start-desktop.sh"

set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo ServiceNow Automation exited with code %EXIT_CODE%.
if not "%EXIT_CODE%"=="0" (
  echo If the app did not open, copy only the visible error text and the startup log path.
  echo Do not paste ServiceNow URLs, ticket data, cookies, sessions, HARs, screenshots, or real field values.
)
pause
exit /b %EXIT_CODE%
