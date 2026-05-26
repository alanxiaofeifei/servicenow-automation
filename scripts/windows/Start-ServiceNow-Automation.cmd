@echo off
setlocal

set "WSL_DISTRO=Ubuntu"
set "PROJECT_DIR_WINDOWS=%~dp0..\.."
set "PROJECT_DIR="
set "APP_TITLE=ServiceNow Automation"

rem Resolve the WSL project root from this launcher's UNC path without embedding a developer-local path.
set "PROJECT_DIR_UNC=%PROJECT_DIR_WINDOWS%"
set "WSL_UNC_HOST=wsl.localhost"
set "WSL_UNC_PREFIX=\\%WSL_UNC_HOST%\%WSL_DISTRO%\"
call set "PROJECT_DIR_UNC=%%PROJECT_DIR_UNC:%WSL_UNC_PREFIX%=%%"
if not "%PROJECT_DIR_UNC%"=="%PROJECT_DIR_WINDOWS%" set "PROJECT_DIR=/%PROJECT_DIR_UNC%"
if defined PROJECT_DIR goto PROJECT_DIR_RESOLVED
set "PROJECT_DIR_UNC=%PROJECT_DIR_WINDOWS%"
set "WSL_SHARE_HOST=wsl$"
set "WSL_UNC_PREFIX=\\%WSL_SHARE_HOST%\%WSL_DISTRO%\"
call set "PROJECT_DIR_UNC=%%PROJECT_DIR_UNC:%WSL_UNC_PREFIX%=%%"
if not "%PROJECT_DIR_UNC%"=="%PROJECT_DIR_WINDOWS%" set "PROJECT_DIR=/%PROJECT_DIR_UNC%"
:PROJECT_DIR_RESOLVED
if defined PROJECT_DIR set "PROJECT_DIR=%PROJECT_DIR:\=/%"

title %APP_TITLE%
echo Starting %APP_TITLE% from WSL...
if not defined PROJECT_DIR (
  echo ERROR: Could not resolve this project path inside WSL.
  echo Check that WSL distro %WSL_DISTRO% is installed and this launcher lives under scripts\windows in the WSL project.
  echo.
  pause
  exit /b 1
)
echo Project: resolved from launcher location.
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
