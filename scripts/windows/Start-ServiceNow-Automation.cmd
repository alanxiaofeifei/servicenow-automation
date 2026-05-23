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
echo Startup details are written to .local/startup-logs inside the project.
echo.

wsl.exe -d %WSL_DISTRO% --cd %PROJECT_DIR% -- bash "./scripts/wsl/start-desktop.sh"

set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo ServiceNow Automation exited with code %EXIT_CODE%.
if not "%EXIT_CODE%"=="0" (
  echo If the app did not open, copy the error text above and the startup log path.
)
pause
exit /b %EXIT_CODE%
