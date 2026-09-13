# VERIDIAN MEDICAL - simple static file server for local preview.
# No Node.js / Python required. Usage:  powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8080]
param([int]$Port = 8099)

Add-Type -AssemblyName System.Net.HttpListener -ErrorAction SilentlyContinue
$root = $PSScriptRoot

$realGatewayIfIndexes = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
  Where-Object { $_.IPv4DefaultGateway } | Select-Object -ExpandProperty InterfaceIndex

$lanIP = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $realGatewayIfIndexes -contains $_.InterfaceIndex } |
  Select-Object -First 1 -ExpandProperty IPAddress)

$listener = New-Object System.Net.HttpListener
$boundLan = $false
try {
  $listener.Prefixes.Add("http://+:$Port/")
  $listener.Start()
  $boundLan = $true
} catch {
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://localhost:$Port/")
  if ($lanIP) {
    try { $listener.Prefixes.Add("http://$($lanIP):$Port/") } catch {}
  }
  try {
    $listener.Start()
    $boundLan = $listener.Prefixes.Count -gt 1
  } catch {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
    $boundLan = $false
  }
}

Write-Host "Local link:   http://localhost:$Port/"
if ($lanIP -and $boundLan) {
  Write-Host "Hotspot link: http://$($lanIP):$Port/   <-- open this on other devices on the same Wi-Fi/hotspot"
} elseif ($lanIP) {
  Write-Host ""
  Write-Host "Could not bind the network link automatically (needs admin rights once)." -ForegroundColor Yellow
  Write-Host "Run this ONCE in an admin PowerShell, then restart this script:"
  Write-Host "  netsh http add urlacl url=http://+:$Port/ user=$env:USERDOMAIN\$env:USERNAME"
  Write-Host "Also allow it through the firewall (admin PowerShell):"
  Write-Host "  New-NetFirewallRule -DisplayName 'Mondo Medical dev server' -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow"
}
Write-Host "Serving from: $root"
Write-Host "(Ctrl+C to stop)"

$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="application/javascript";
  ".json"="application/json"; ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg";
  ".jpeg"="image/jpeg"; ".webp"="image/webp"; ".ico"="image/x-icon"; ".woff2"="font/woff2";
  ".pdf"="application/pdf"; ".txt"="text/plain"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    try {
      $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
      if ($path -eq "/") { $path = "/en/index.html" }
      $fsPath = Join-Path $root ($path.TrimStart("/") -replace "/", "\")
      if (Test-Path $fsPath -PathType Container) { $fsPath = Join-Path $fsPath "index.html" }
      if (-not (Test-Path $fsPath -PathType Leaf)) {
        $notFound = Join-Path $root "404.html"
        if (Test-Path $notFound) { $fsPath = $notFound; $res.StatusCode = 404 } else {
          $res.StatusCode = 404
          $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
          $res.OutputStream.Write($bytes,0,$bytes.Length); $res.OutputStream.Close(); continue
        }
      }
      $ext = [System.IO.Path]::GetExtension($fsPath).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $res.ContentType = $ct
      $res.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
      $bytes = [System.IO.File]::ReadAllBytes($fsPath)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      $res.StatusCode = 500
    } finally {
      $res.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
}
