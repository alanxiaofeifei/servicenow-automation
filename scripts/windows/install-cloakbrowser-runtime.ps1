param(
  [string]$Version = "146.0.7680.177.5",
  [switch]$AcceptBinaryLicense,
  [switch]$Force,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$archiveName = "cloakbrowser-windows-x64.zip"
$releaseTag = "chromium-v$Version"
$downloadUrl = "https://github.com/CloakHQ/cloakbrowser/releases/download/$releaseTag/$archiveName"
$checksumsUrl = "https://github.com/CloakHQ/cloakbrowser/releases/download/$releaseTag/SHA256SUMS"
$licenseUrl = "https://github.com/CloakHQ/CloakBrowser/blob/main/BINARY-LICENSE.md"
$runtimeRelativeRoot = "%LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser"
$executableRelativePath = "$runtimeRelativeRoot\chrome.exe"

function Write-JsonAndExit($Payload, [int]$Code) {
  $Payload | ConvertTo-Json -Depth 8 -Compress | Write-Output
  exit $Code
}

function New-BlockedPayload([string]$Reason) {
  return @{
    status = "blocked"
    blockedReason = $Reason
    runtime = @{
      flavor = "cloakbrowser"
      toolOwned = $true
      installRoot = $runtimeRelativeRoot
      executable = $executableRelativePath
    }
    source = @{
      release = $releaseTag
      archive = $archiveName
      downloadUrl = $downloadUrl
      checksumsUrl = $checksumsUrl
      binaryLicense = $licenseUrl
    }
    safety = @{
      officialDownloadOnly = $true
      checksumVerificationRequired = $true
      binaryRedistributionAllowed = $false
      serviceNowWritePerformed = $false
      browserProcessLaunched = $false
    }
  }
}

if (-not $AcceptBinaryLicense -and -not $DryRun) {
  Write-JsonAndExit (New-BlockedPayload "accept-cloakbrowser-binary-license-required") 1
}

if (-not $env:LOCALAPPDATA) {
  Write-JsonAndExit (New-BlockedPayload "windows-localappdata-unavailable") 1
}

$runtimeRoot = Join-Path $env:LOCALAPPDATA "ServiceNowAutomation\Runtime\CloakBrowser"
$runtimeParent = Join-Path $env:LOCALAPPDATA "ServiceNowAutomation\Runtime"
$expectedRootPrefix = (Join-Path $env:LOCALAPPDATA "ServiceNowAutomation\Runtime").TrimEnd("\") + "\"
if (-not $runtimeRoot.StartsWith($expectedRootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  Write-JsonAndExit (New-BlockedPayload "runtime-root-outside-tool-owned-directory") 1
}

if ($DryRun) {
  Write-JsonAndExit @{
    status = "dry-run"
    version = $Version
    runtime = @{
      flavor = "cloakbrowser"
      toolOwned = $true
      installRoot = $runtimeRelativeRoot
      executable = $executableRelativePath
    }
    source = @{
      release = $releaseTag
      archive = $archiveName
      downloadUrl = $downloadUrl
      checksumsUrl = $checksumsUrl
      binaryLicense = $licenseUrl
    }
    requiredFlagForInstall = "-AcceptBinaryLicense"
    safety = @{
      officialDownloadOnly = $true
      checksumVerificationRequired = $true
      binaryRedistributionAllowed = $false
      serviceNowWritePerformed = $false
      browserProcessLaunched = $false
    }
  } 0
}

if ((Test-Path $runtimeRoot) -and -not $Force) {
  Write-JsonAndExit (New-BlockedPayload "runtime-already-exists-use-force-to-replace") 1
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("sda-cloakbrowser-" + [Guid]::NewGuid().ToString("N"))
$archivePath = Join-Path $tempRoot $archiveName
$extractRoot = Join-Path $tempRoot "extract"

try {
  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
  New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null

  $checksumText = (Invoke-WebRequest -Uri $checksumsUrl -UseBasicParsing -TimeoutSec 60).Content
  $escapedArchiveName = [regex]::Escape($archiveName)
  $expectedHash = $null
  foreach ($line in ($checksumText -split "`n")) {
    $trimmed = $line.Trim()
    $match = [regex]::Match($trimmed, "^([a-fA-F0-9]{64})\s+\*?$escapedArchiveName$")
    if ($match.Success) {
      $expectedHash = $match.Groups[1].Value.ToLowerInvariant()
      break
    }
  }
  if (-not $expectedHash) {
    Write-JsonAndExit (New-BlockedPayload "checksum-entry-not-found") 1
  }

  Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath -UseBasicParsing -TimeoutSec 600
  $actualHash = (Get-FileHash -Algorithm SHA256 -Path $archivePath).Hash.ToLowerInvariant()
  if ($actualHash -ne $expectedHash) {
    Write-JsonAndExit (New-BlockedPayload "checksum-verification-failed") 1
  }

  Expand-Archive -Path $archivePath -DestinationPath $extractRoot -Force
  $chrome = Get-ChildItem -Path $extractRoot -Filter "chrome.exe" -Recurse -File | Select-Object -First 1
  if (-not $chrome) {
    Write-JsonAndExit (New-BlockedPayload "chrome-executable-not-found-in-archive") 1
  }

  $binaryDir = $chrome.Directory.FullName
  New-Item -ItemType Directory -Force -Path $runtimeParent | Out-Null
  if (Test-Path $runtimeRoot) {
    Remove-Item -Path $runtimeRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
  Copy-Item -Path (Join-Path $binaryDir "*") -Destination $runtimeRoot -Recurse -Force

  $sourceNotice = @"
CloakBrowser runtime installed by ServiceNow Automation.

Source release: https://github.com/CloakHQ/CloakBrowser/releases/tag/$releaseTag
Archive: $archiveName
SHA256: $actualHash
Binary license: $licenseUrl

Do not redistribute, repackage, or embed this binary into third-party artifacts without a separate CloakHQ license.
"@
  Set-Content -Path (Join-Path $runtimeRoot "SDA-CLOAKBROWSER-SOURCE.txt") -Value $sourceNotice -Encoding UTF8

  if (-not (Test-Path (Join-Path $runtimeRoot "chrome.exe"))) {
    Write-JsonAndExit (New-BlockedPayload "installed-chrome-executable-missing") 1
  }

  Write-JsonAndExit @{
    status = "installed"
    version = $Version
    runtime = @{
      flavor = "cloakbrowser"
      toolOwned = $true
      installRoot = $runtimeRelativeRoot
      executable = $executableRelativePath
    }
    source = @{
      release = $releaseTag
      archive = $archiveName
      downloadUrl = $downloadUrl
      checksumsUrl = $checksumsUrl
      binaryLicense = $licenseUrl
      sha256 = $actualHash
    }
    safety = @{
      officialDownloadOnly = $true
      checksumVerified = $true
      binaryRedistributionAllowed = $false
      serviceNowWritePerformed = $false
      browserProcessLaunched = $false
    }
  } 0
} finally {
  if (Test-Path $tempRoot) {
    Remove-Item -Path $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
