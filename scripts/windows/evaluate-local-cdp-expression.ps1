param()

$ErrorActionPreference = "Stop"

function Write-JsonAndExit($Payload, [int]$Code) {
  $Payload | ConvertTo-Json -Depth 100 -Compress | Write-Output
  exit $Code
}

function Write-BlockedAndExit([string]$Reason) {
  Write-JsonAndExit @{
    status = "blocked"
    blockedReason = $Reason
  } 1
}

function Test-LocalHttpEndpoint([string]$Endpoint) {
  try {
    $uri = [Uri]$Endpoint
  } catch {
    return $null
  }

  $localHosts = @("localhost", "127.0.0.1", "[::1]", "::1")
  if ($uri.Scheme -ne "http") { return $null }
  if ($uri.UserInfo -and $uri.UserInfo.Length -gt 0) { return $null }
  if (-not ($localHosts -contains $uri.Host)) { return $null }
  if ($uri.Port -lt 1 -or $uri.Port -gt 65535) { return $null }
  return $uri
}

function Test-LocalWebSocketEndpoint([string]$Endpoint) {
  try {
    $uri = [Uri]$Endpoint
  } catch {
    return $null
  }

  $localHosts = @("localhost", "127.0.0.1", "[::1]", "::1")
  if ($uri.Scheme -ne "ws") { return $null }
  if ($uri.UserInfo -and $uri.UserInfo.Length -gt 0) { return $null }
  if (-not ($localHosts -contains $uri.Host)) { return $null }
  if ($uri.Port -lt 1 -or $uri.Port -gt 65535) { return $null }
  return $uri
}

function Get-ConfiguredHost([string]$TargetUrl) {
  if (-not $TargetUrl) { return $null }
  try {
    $uri = [Uri]$TargetUrl
  } catch {
    return $null
  }
  if ($uri.Scheme -ne "https") { return $null }
  if ($uri.UserInfo -and $uri.UserInfo.Length -gt 0) { return $null }
  return $uri.Host.ToLowerInvariant()
}

function Get-DecodedTargetLocation([string]$Value) {
  $current = $Value
  for ($i = 0; $i -lt 4; $i += 1) {
    if (-not $current.Contains("%")) { break }
    try {
      $decoded = [System.Uri]::UnescapeDataString($current)
      if ($decoded -eq $current) { break }
      $current = $decoded
    } catch {
      break
    }
  }
  return $current
}

function Test-PageTargetHost($Target, [string]$Host) {
  if (-not $Host) { return $false }
  if (-not $Target.url) { return $false }
  try {
    $uri = [Uri]([string]$Target.url)
  } catch {
    return $false
  }
  if ($uri.Scheme -ne "https") { return $false }
  if ($uri.UserInfo -and $uri.UserInfo.Length -gt 0) { return $false }
  return $uri.Host.ToLowerInvariant() -eq $Host.ToLowerInvariant()
}

function Test-LikelyIncidentPageTarget($Target) {
  if (-not $Target.url) { return $false }
  try {
    $uri = [Uri]([string]$Target.url)
  } catch {
    return $false
  }
  $location = Get-DecodedTargetLocation ($uri.AbsolutePath + $uri.Query)
  return $location.ToLowerInvariant().Contains("incident.do")
}

function Select-PageTarget($Pages, [string]$TargetUrl) {
  $configuredHost = Get-ConfiguredHost $TargetUrl
  if (-not $configuredHost) { return $null }

  $pageTargets = @($Pages | Where-Object { $_.type -eq "page" -and $_.webSocketDebuggerUrl })
  $configuredHostTargets = @($pageTargets | Where-Object { Test-PageTargetHost $_ $configuredHost })
  $incidentTargets = @($configuredHostTargets | Where-Object { Test-LikelyIncidentPageTarget $_ })

  if ($incidentTargets.Count -eq 1) { return $incidentTargets[0] }
  if ($configuredHostTargets.Count -eq 1) { return $configuredHostTargets[0] }
  return $null
}

function Receive-WebSocketText([System.Net.WebSockets.ClientWebSocket]$Client) {
  $buffer = New-Object byte[] 65536
  $stream = New-Object System.IO.MemoryStream
  try {
    do {
      $segment = [ArraySegment[byte]]::new($buffer)
      $result = $Client.ReceiveAsync($segment, [System.Threading.CancellationToken]::None).GetAwaiter().GetResult()
      if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
        throw "websocket-closed"
      }
      if ($result.Count -gt 0) {
        $stream.Write($buffer, 0, $result.Count)
      }
    } while (-not $result.EndOfMessage)

    return [System.Text.Encoding]::UTF8.GetString($stream.ToArray())
  } finally {
    $stream.Dispose()
  }
}

try {
  $inputText = [Console]::In.ReadToEnd()
  if (-not $inputText.Trim()) {
    Write-BlockedAndExit "browser-runtime-error"
  }

  $request = $inputText | ConvertFrom-Json
  $endpoint = [string]$request.endpoint
  $targetUrl = [string]$request.targetUrl
  $expressionBase64 = [string]$request.expressionBase64

  $endpointUri = Test-LocalHttpEndpoint $endpoint
  if (-not $endpointUri) {
    Write-BlockedAndExit "cdp-endpoint-denied"
  }

  $expression = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($expressionBase64))
  if (-not $expression) {
    Write-BlockedAndExit "browser-runtime-error"
  }

  $listUri = "http://127.0.0.1:$($endpointUri.Port)/json/list"
  try {
    $pages = Invoke-RestMethod -TimeoutSec 5 -Uri $listUri
  } catch {
    Write-BlockedAndExit "cdp-endpoint-denied"
  }

  $selectedTarget = Select-PageTarget $pages $targetUrl
  if (-not $selectedTarget) {
    Write-BlockedAndExit "cdp-page-selection-denied"
  }

  $webSocketUri = Test-LocalWebSocketEndpoint ([string]$selectedTarget.webSocketDebuggerUrl)
  if (-not $webSocketUri) {
    Write-BlockedAndExit "cdp-endpoint-denied"
  }

  $client = [System.Net.WebSockets.ClientWebSocket]::new()
  try {
    try {
      $client.ConnectAsync($webSocketUri, [System.Threading.CancellationToken]::None).GetAwaiter().GetResult()
    } catch {
      Write-BlockedAndExit "cdp-endpoint-denied"
    }
    $payload = @{
      id = 1
      method = "Runtime.evaluate"
      params = @{
        expression = $expression
        awaitPromise = $true
        returnByValue = $true
      }
    } | ConvertTo-Json -Depth 100 -Compress

    $payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $payloadSegment = [ArraySegment[byte]]::new($payloadBytes)
    $client.SendAsync($payloadSegment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [System.Threading.CancellationToken]::None).GetAwaiter().GetResult()

    $responseText = Receive-WebSocketText $client
    $response = $responseText | ConvertFrom-Json
    if ($response.error -or $response.result.exceptionDetails) {
      Write-BlockedAndExit "browser-runtime-error"
    }

    Write-JsonAndExit @{
      status = "completed"
      value = $response.result.result.value
    } 0
  } finally {
    if ($client.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
      $client.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "done", [System.Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
    }
    $client.Dispose()
  }
} catch {
  Write-BlockedAndExit "browser-runtime-error"
}
