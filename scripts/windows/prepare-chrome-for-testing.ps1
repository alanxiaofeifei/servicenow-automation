#Requires -Version 5.1
<#
.SYNOPSIS
  Prepare the ServiceNow Automation tool-owned Windows Chromium runtime.

.DESCRIPTION
  Downloads official Chrome for Testing for Windows and installs it under:

    %LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe

  This script does not open a browser, does not navigate to ServiceNow, and does not touch browser profiles.

.EXAMPLE
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\prepare-chrome-for-testing.ps1

.EXAMPLE
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\prepare-chrome-for-testing.ps1 -Json
#>
[CmdletBinding()]
param(
  [ValidateSet('Stable', 'Beta', 'Dev', 'Canary')]
  [string]$Channel = 'Stable',

  [ValidateSet('win64')]
  [string]$Platform = 'win64',

  [string]$InstallRoot,

  [switch]$Force,

  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
  throw 'LOCALAPPDATA is not set. Run this from Windows PowerShell, not WSL/Linux.'
}

if ([string]::IsNullOrWhiteSpace($InstallRoot)) {
  $InstallRoot = Join-Path $env:LOCALAPPDATA 'ServiceNowAutomation\Runtime'
}

$MetadataUri = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json'
$ForbiddenRuntimePatterns = @(
  '\\Program Files\\Google\\Chrome\\Application\\chrome\.exe$',
  '\\Program Files \(x86\)\\Google\\Chrome\\Application\\chrome\.exe$',
  '\\Program Files\\Microsoft\\Edge\\Application\\msedge\.exe$',
  '\\Program Files \(x86\)\\Microsoft\\Edge\\Application\\msedge\.exe$'
)

function Convert-ToFullWindowsPath {
  param([Parameter(Mandatory = $true)][string]$Path)
  $expanded = [Environment]::ExpandEnvironmentVariables($Path)
  return [System.IO.Path]::GetFullPath($expanded)
}

function Assert-ToolOwnedRuntimeRoot {
  param([Parameter(Mandatory = $true)][string]$Path)

  if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
    throw 'LOCALAPPDATA is not set. Run this from Windows PowerShell, not WSL/Linux.'
  }

  $fullPath = Convert-ToFullWindowsPath $Path
  $expectedRoot = Convert-ToFullWindowsPath (Join-Path $env:LOCALAPPDATA 'ServiceNowAutomation\Runtime')
  $comparison = [StringComparison]::OrdinalIgnoreCase

  if ($fullPath.Equals($expectedRoot, $comparison) -or $fullPath.StartsWith($expectedRoot + [System.IO.Path]::DirectorySeparatorChar, $comparison)) {
    return $fullPath
  }

  throw "InstallRoot must stay under the tool-owned runtime root: $expectedRoot"
}

function Assert-NotDailyBrowserRuntimePath {
  param([Parameter(Mandatory = $true)][string]$ChromeExePath)

  $fullPath = Convert-ToFullWindowsPath $ChromeExePath
  foreach ($pattern in $ForbiddenRuntimePatterns) {
    if ($fullPath -match $pattern) {
      throw "Refusing to use a daily Chrome/Edge runtime path: $fullPath"
    }
  }

  return $fullPath
}

function Get-ChromeForTestingDownload {
  param(
    [Parameter(Mandatory = $true)][string]$Channel,
    [Parameter(Mandatory = $true)][string]$Platform
  )

  $metadata = Invoke-RestMethod -Uri $MetadataUri -UseBasicParsing
  $channelInfo = $metadata.channels.$Channel
  if (-not $channelInfo) {
    throw "Chrome for Testing channel not found: $Channel"
  }

  $download = $channelInfo.downloads.chrome | Where-Object { $_.platform -eq $Platform } | Select-Object -First 1
  if (-not $download) {
    throw "Chrome for Testing download not found for channel=$Channel platform=$Platform"
  }

  $downloadUrl = [string]$download.url
  if ($downloadUrl -notmatch '^https://storage\.googleapis\.com/chrome-for-testing-public/.+/win64/chrome-win64\.zip$') {
    throw "Unexpected Chrome for Testing download URL: $downloadUrl"
  }

  [PSCustomObject]@{
    Version = [string]$channelInfo.version
    Url = $downloadUrl
  }
}

function Copy-DirectoryContents {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force
}

$installRootFull = Assert-ToolOwnedRuntimeRoot $InstallRoot
$runtimeDir = Join-Path $installRootFull 'Chromium'
$runtimeExe = Assert-NotDailyBrowserRuntimePath (Join-Path $runtimeDir 'chrome.exe')
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('sda-chrome-for-testing-' + [Guid]::NewGuid().ToString('N'))
$installed = $false
$status = 'existing'
$downloadInfo = $null

try {
  if ((Test-Path $runtimeExe) -and -not $Force) {
    $status = 'existing'
  }
  else {
    $downloadInfo = Get-ChromeForTestingDownload -Channel $Channel -Platform $Platform
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

    $zipPath = Join-Path $tempRoot 'chrome-for-testing.zip'
    $extractRoot = Join-Path $tempRoot 'extract'

    Invoke-WebRequest -Uri $downloadInfo.Url -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

    $candidate = Get-ChildItem -Path $extractRoot -Filter 'chrome.exe' -File -Recurse |
      Where-Object { $_.FullName -match '\\chrome-win64\\chrome\.exe$' } |
      Select-Object -First 1

    if (-not $candidate) {
      throw 'Downloaded Chrome for Testing archive did not contain chrome-win64\chrome.exe.'
    }

    $sourceDir = Split-Path -Parent $candidate.FullName
    $parentDir = Split-Path -Parent $runtimeDir
    New-Item -ItemType Directory -Force -Path $parentDir | Out-Null

    if (Test-Path $runtimeDir) {
      $safeRuntimeDir = Assert-ToolOwnedRuntimeRoot $runtimeDir
      Remove-Item -Path $safeRuntimeDir -Recurse -Force
    }

    Copy-DirectoryContents -Source $sourceDir -Destination $runtimeDir

    if (-not (Test-Path $runtimeExe)) {
      throw "Install completed but runtime executable was not found: $runtimeExe"
    }

    $status = 'installed'
    $installed = $true
  }
}
finally {
  if (Test-Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}

$profile = Join-Path $env:LOCALAPPDATA 'ServiceNowAutomation\Profiles\smoke\session-smoke-001'
$dryRunCommand = @(
  'pnpm --silent --filter @servicenow-automation/cli sda browser smoke `',
  ('  --browser-executable "{0}" `' -f $runtimeExe),
  ('  --profile-root "{0}" `' -f $profile),
  '  --target about:blank `',
  '  --json'
) -join [Environment]::NewLine

$result = [PSCustomObject]@{
  status = $status
  installed = $installed
  channel = $Channel
  platform = $Platform
  version = if ($downloadInfo) { $downloadInfo.Version } else { $null }
  runtime = $runtimeExe
  runtimeExists = Test-Path $runtimeExe
  profile = $profile
  nextDryRunCommand = $dryRunCommand
  safety = [PSCustomObject]@{
    opensBrowser = $false
    touchesServiceNow = $false
    modifiesProfiles = $false
    usesDailyChromeOrEdge = $false
    installRootIsToolOwned = $true
  }
}

if ($Json) {
  $result | ConvertTo-Json -Depth 6
}
else {
  Write-Host "Status: $($result.status)"
  Write-Host "Runtime: $($result.runtime)"
  Write-Host "Runtime exists: $($result.runtimeExists)"
  if ($result.version) {
    Write-Host "Chrome for Testing version: $($result.version)"
  }
  Write-Host ''
  Write-Host 'Next dry-run command:'
  Write-Host $result.nextDryRunCommand
  Write-Host ''
  Write-Host 'Safety: script did not open a browser, did not touch ServiceNow, and did not modify browser profiles.'
}
