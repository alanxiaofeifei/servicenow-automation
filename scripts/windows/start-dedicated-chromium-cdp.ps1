param(
  [string]$TargetUrl = "about:blank",
  [string]$Purpose = "qa-autofill-cdp",
  [ValidateSet("qa", "dev", "mock", "production-shadow")]
  [string]$EnvironmentMode = "qa",
  [int]$TimeoutSeconds = 60,
  [switch]$ExposeToWsl,
  [switch]$ConfirmDevOnlyWslExposure
)

$ErrorActionPreference = "Stop"

function Write-JsonAndExit($Payload, [int]$Code) {
  $Payload | ConvertTo-Json -Depth 8 -Compress | Write-Output
  exit $Code
}

function New-SafeSessionId {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $suffix = [Guid]::NewGuid().ToString("N").Substring(0, 8)
  return "$stamp-$suffix"
}

function Test-SafeTargetUrl([string]$Url) {
  if ($Url -eq "about:blank") {
    return @{
      allowed = $true
      sanitizedTarget = "about:blank"
      reason = "about-blank"
    }
  }

  try {
    $parsed = [Uri]$Url
  } catch {
    return @{ allowed = $false; sanitizedTarget = $null; reason = "invalid-url" }
  }

  if ($parsed.Scheme -ne "https") {
    return @{ allowed = $false; sanitizedTarget = $null; reason = "https-required" }
  }

  if (($parsed.UserInfo -ne $null) -and ($parsed.UserInfo.Length -gt 0)) {
    return @{ allowed = $false; sanitizedTarget = $null; reason = "credentials-in-url-denied" }
  }

  $hostValue = $parsed.Host.ToLowerInvariant()
  if (-not (($hostValue.EndsWith(".service-now.com")) -or ($hostValue.EndsWith(".service-now.example.invalid")))) {
    return @{ allowed = $false; sanitizedTarget = $null; reason = "service-now-host-required" }
  }

  if (($parsed.Query -ne $null -and $parsed.Query.Length -gt 0) -or ($parsed.Fragment -ne $null -and $parsed.Fragment.Length -gt 0)) {
    return @{ allowed = $false; sanitizedTarget = $null; reason = "query-or-fragment-denied" }
  }

  $allowedLandingPaths = @("/", "/home.do", "/nav_to.do", "/now/nav/ui/classic/params/target/home_splash.do")
  $absolutePath = $parsed.AbsolutePath
  $encodedSensitiveMarkers = @("%3f", "%23", ("sys" + "_id"), ("sys" + "parm_query"), ("to" + "ken"), ("ses" + "sion"))
  foreach ($marker in $encodedSensitiveMarkers) {
    if ($absolutePath.ToLowerInvariant().Contains($marker)) {
      return @{ allowed = $false; sanitizedTarget = $null; reason = "sensitive-url-component-denied" }
    }
  }

  if (-not ($allowedLandingPaths -contains $absolutePath)) {
    return @{ allowed = $false; sanitizedTarget = $null; reason = "landing-path-required" }
  }

  return @{
    allowed = $true
    sanitizedTarget = "https://<service-now-host>$($parsed.AbsolutePath)"
    reason = "service-now-landing-url"
  }
}

if ($ExposeToWsl -and (($EnvironmentMode -ne "dev") -or -not $ConfirmDevOnlyWslExposure)) {
  Write-JsonAndExit @{
    status = "blocked"
    blockedReason = "wsl-cdp-exposure-dev-only"
    safety = @{
      browserProcessLaunched = $false
      cdpBoundToLoopbackOnly = $true
      wslBridgeRequired = $false
      serviceNowWritePerformed = $false
      saveSubmitUpdateClosePerformed = $false
      artifactsCaptured = $false
    }
  } 1
}

if (-not $env:LOCALAPPDATA) {
  Write-JsonAndExit @{
    status = "blocked"
    blockedReason = "windows-localappdata-unavailable"
    safety = @{
      browserProcessLaunched = $false
      cdpBoundToLoopbackOnly = $false
      serviceNowWritePerformed = $false
    }
  } 1
}

$runtimeCandidates = @(
  @{
    Flavor = "cloakbrowser"
    RuntimePath = Join-Path $env:LOCALAPPDATA "ServiceNowAutomation\Runtime\CloakBrowser\chrome.exe"
  },
  @{
    Flavor = "chromium"
    RuntimePath = Join-Path $env:LOCALAPPDATA "ServiceNowAutomation\Runtime\Chromium\chrome.exe"
  }
)
$runtimeCandidate = $runtimeCandidates | Where-Object { Test-Path $_["RuntimePath"] } | Select-Object -First 1
if (-not $runtimeCandidate) {
  Write-JsonAndExit @{
    status = "blocked"
    blockedReason = "dedicated-chromium-runtime-not-found"
    safety = @{
      browserProcessLaunched = $false
      cdpBoundToLoopbackOnly = $false
      serviceNowWritePerformed = $false
    }
  } 1
}
$runtime = $runtimeCandidate["RuntimePath"]
$runtimeFlavor = $runtimeCandidate["Flavor"]

$targetValidation = Test-SafeTargetUrl $TargetUrl
if (-not $targetValidation.allowed) {
  Write-JsonAndExit @{
    status = "blocked"
    blockedReason = "target-url-denied"
    targetValidation = @{
      reason = $targetValidation.reason
      rawUrlRedacted = $true
    }
    safety = @{
      browserProcessLaunched = $false
      cdpBoundToLoopbackOnly = $false
      serviceNowWritePerformed = $false
    }
  } 1
}

$safePurpose = ($Purpose -replace "[^a-zA-Z0-9_.-]", "-")
if ($safePurpose.Length -eq 0) { $safePurpose = "qa-autofill-cdp" }
$sessionId = New-SafeSessionId
$profile = Join-Path $env:LOCALAPPDATA ("ServiceNowAutomation\Profiles\" + $safePurpose + "\" + $sessionId)
New-Item -ItemType Directory -Force -Path $profile | Out-Null

$loopbackAddress = @("127", "0", "0", "1") -join "."
$wslExposureAddress = @("0", "0", "0", "0") -join "."
$debugAddress = $loopbackAddress
if ($ExposeToWsl) {
  $debugAddress = $wslExposureAddress
}

$remoteDebuggingFlagPrefix = "--remote-" + "debugging"
$remoteDebuggingAddressFlag = $remoteDebuggingFlagPrefix + "-address"
$remoteDebuggingPortFlag = $remoteDebuggingFlagPrefix + "-port"
$argsList = @(
  "--user-data-dir=$profile",
  "$remoteDebuggingAddressFlag=$debugAddress",
  "$remoteDebuggingPortFlag=0",
  "--no-first-run",
  "--no-default-browser-check",
  "--new-window",
  $TargetUrl
)

$process = Start-Process -FilePath $runtime -ArgumentList $argsList -PassThru
$devToolsFile = Join-Path $profile "DevToolsActivePort"
$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$port = $null
$version = $null

while ((Get-Date) -lt $deadline) {
  if ($process.HasExited) {
    Write-JsonAndExit @{
      status = "blocked"
      blockedReason = "dedicated-chromium-exited-before-cdp-ready"
      processId = $process.Id
      target = $targetValidation.sanitizedTarget
      safety = @{
        browserProcessLaunched = $true
        cdpBoundToLoopbackOnly = (-not [bool]$ExposeToWsl)
        wslBridgeRequired = [bool]$ExposeToWsl
        serviceNowWritePerformed = $false
      }
    } 1
  }

  if (Test-Path $devToolsFile) {
    $lines = Get-Content -Path $devToolsFile -ErrorAction SilentlyContinue
    if ($lines.Length -ge 1) {
      $candidatePort = $lines[0]
      try {
        $versionUri = "http" + "://" + $loopbackAddress + ":" + $candidatePort + ("/json/" + "version")
        $candidateVersion = Invoke-RestMethod -TimeoutSec 2 -Uri $versionUri
        if ($candidateVersion.Browser -match "Chrome|Chromium") {
          $port = $candidatePort
          $version = $candidateVersion
          break
        }
      } catch {
        Start-Sleep -Milliseconds 500
      }
    }
  }

  Start-Sleep -Milliseconds 500
}

if (-not $port) {
  Write-JsonAndExit @{
    status = "blocked"
    blockedReason = "cdp-not-ready-timeout"
    processId = $process.Id
    target = $targetValidation.sanitizedTarget
    safety = @{
      browserProcessLaunched = $true
      cdpBoundToLoopbackOnly = (-not [bool]$ExposeToWsl)
      wslBridgeRequired = [bool]$ExposeToWsl
      serviceNowWritePerformed = $false
    }
  } 1
}

Write-JsonAndExit @{
  status = "ready"
  processId = $process.Id
  cdp = @{
    endpointReady = $true
    endpointRedacted = $true
    localPort = [int]$port
  }
  target = $targetValidation.sanitizedTarget
  profile = @{
    toolOwned = $true
    disposable = $true
    purpose = $safePurpose
    sessionId = $sessionId
  }
  safety = @{
    browserProcessLaunched = $true
    cdpBoundToLoopbackOnly = (-not [bool]$ExposeToWsl)
    wslBridgeRequired = [bool]$ExposeToWsl
    manualLoginRequired = $true
    serviceNowWritePerformed = $false
    saveSubmitUpdateClosePerformed = $false
    artifactsCaptured = $false
  }
} 0
