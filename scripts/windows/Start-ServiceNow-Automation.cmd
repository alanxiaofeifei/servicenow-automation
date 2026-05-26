@echo off
setlocal

set "WSL_DISTRO=Ubuntu"
set "PROJECT_DIR_WINDOWS=%~dp0..\.."
set "PROJECT_DIR="
set "APP_TITLE=ServiceNow Automation"

for /f "delims=" %%I in ('wsl.exe -d "%WSL_DISTRO%" -- wslpath -a "%PROJECT_DIR_WINDOWS%" 2^>nul') do set "PROJECT_DIR=%%I"

title %APP_TITLE%
echo Starting %APP_TITLE% from WSL...
if not defined PROJECT_DIR (
  echo ERROR: Could not resolve this project path inside WSL.
  echo Check that WSL distro "%WSL_DISTRO%" is installed and this launcher lives under scripts\windows.
  echo.
  pause
  exit /b 1
)
echo Project: resolved from launcher location.
echo.
echo Keep this window open while the app is running.
echo Startup details are written to .local/startup-logs inside the project.
echo.

wsl.exe -d "%WSL_DISTRO%" --cd "%PROJECT_DIR%" -- bash "./scripts/wsl/start-desktop.sh"

set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo ServiceNow Automation exited with code %EXIT_CODE%.
if not "%EXIT_CODE%"=="0" (
  echo If the app did not open, copy the error text above and the startup log path.
)
pause
exit /b %EXIT_CODE%
