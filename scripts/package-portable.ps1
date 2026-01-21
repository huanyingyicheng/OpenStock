param(
    [string]$ZipPath = (Join-Path $PSScriptRoot '..\dist\OpenStock-portable.zip'),
    [switch]$IncludeNodeRuntime = $true
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $RepoRoot

npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }

$stageDir = Join-Path $RepoRoot ("dist\\openstock-portable-stage-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $stageDir | Out-Null

Copy-Item -Recurse -Force (Join-Path $RepoRoot '.next') $stageDir
Copy-Item -Recurse -Force (Join-Path $RepoRoot 'public') $stageDir
Copy-Item -Force (Join-Path $RepoRoot '.env.example') (Join-Path $stageDir '.env.example') -ErrorAction SilentlyContinue
Copy-Item -Force (Join-Path $RepoRoot 'package.json') (Join-Path $stageDir 'package.json')
Copy-Item -Force (Join-Path $RepoRoot 'package-lock.json') (Join-Path $stageDir 'package-lock.json')

if ($IncludeNodeRuntime) {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    $nodePath = $null
    if ($nodeCmd) { $nodePath = $nodeCmd.Source }
    if ($nodePath -and (Test-Path $nodePath)) {
        $nodeDir = Join-Path $stageDir 'node'
        New-Item -ItemType Directory -Force -Path $nodeDir | Out-Null
        Copy-Item -Force $nodePath (Join-Path $nodeDir 'node.exe')
    } else {
        Write-Warning "IncludeNodeRuntime requested, but 'node' was not found. Portable package will require Node.js in PATH."
    }
}

Push-Location $stageDir
try {
    npm ci --omit=dev
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE (files may be locked by antivirus; try again)" }
} finally {
    Pop-Location
}

@"
@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" echo .env not found (optional).
if not exist ".env" echo To enable accounts: copy .env.example to .env, set MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL.

set "NODE_EXE="
for /f "delims=" %%I in ('where.exe node 2^>nul') do (
  set "NODE_EXE=%%I"
  goto :node_found
)
:node_found

if not defined NODE_EXE if exist "%~dp0node\node.exe" set "NODE_EXE=%~dp0node\node.exe"
if not defined NODE_EXE goto :no_node

if "%PORT%"=="" set "PORT=3000"
if "%HOSTNAME%"=="" set "HOSTNAME=127.0.0.1"
echo Open: http://%HOSTNAME%:%PORT%  (NOT https)
echo Using Node: %NODE_EXE%

set "NODE_ENV=production"
set "NEXT_TELEMETRY_DISABLED=1"
set "DOTENV_CONFIG_PATH=%~dp0.env"
start "" /b cmd /c "timeout /t 2 >nul & start \"\" \"http://%HOSTNAME%:%PORT%/flows\""
"%NODE_EXE%" -r dotenv/config node_modules/next/dist/bin/next start -H "%HOSTNAME%" -p "%PORT%"
set "EXITCODE=%ERRORLEVEL%"
echo.
echo Server exited (code %EXITCODE%).
pause
exit /b %EXITCODE%

:no_node
echo ERROR: Node.js not found.
echo Install Node.js (LTS) from https://nodejs.org
echo Or rebuild portable package with bundled node.exe.
pause
exit /b 1
"@ | Set-Content -Encoding Ascii (Join-Path $stageDir 'run.cmd')

@'
Set-Location $PSScriptRoot
if (-not (Test-Path .env)) {
  Write-Host '.env not found (optional).'
  Write-Host 'To enable accounts: copy .env.example to .env, set MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL.'
}
if (-not $env:PORT) { $env:PORT = '3000' }
if (-not $env:HOSTNAME) { $env:HOSTNAME = '127.0.0.1' }
Write-Host "Open: http://${env:HOSTNAME}:${env:PORT}  (NOT https)"
$env:NODE_ENV = 'production'
$env:NEXT_TELEMETRY_DISABLED = '1'
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$node = $null
if ($nodeCmd) { $node = $nodeCmd.Source }
if (-not $node) {
  $bundled = Join-Path $PSScriptRoot 'node\node.exe'
  if (Test-Path $bundled) { $node = $bundled }
}
if (-not $node) {
  Write-Host 'ERROR: Node.js not found.'
  Write-Host 'Install Node.js from https://nodejs.org (LTS), or rebuild portable package with bundled node.exe.'
  Read-Host 'Press Enter to exit'
  exit 1
}
$env:DOTENV_CONFIG_PATH = (Join-Path $PSScriptRoot '.env')
Start-Process "http://${env:HOSTNAME}:${env:PORT}/flows" | Out-Null
& $node -r dotenv/config node_modules/next/dist/bin/next start -H $env:HOSTNAME -p $env:PORT
'@ | Set-Content -Encoding UTF8 (Join-Path $stageDir 'run.ps1')

New-Item -ItemType Directory -Force -Path (Split-Path $ZipPath) | Out-Null
Remove-Item -Force $ZipPath -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $stageDir '*') -DestinationPath $ZipPath -Force

Write-Host "Created: $ZipPath"

try {
    Remove-Item -Recurse -Force $stageDir -ErrorAction SilentlyContinue
} catch {
    # Best-effort cleanup only; ignore Windows file locking issues.
}
