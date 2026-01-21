param(
    [string]$ZipPath = (Join-Path $PSScriptRoot '..\dist\OpenStock-portable.zip'),
    [string]$ExePath = (Join-Path $PSScriptRoot '..\dist\OpenStock-portable.exe')
)

$ErrorActionPreference = 'Stop'

$ZipPath = (Resolve-Path $ZipPath).Path
New-Item -ItemType Directory -Force -Path (Split-Path $ExePath) | Out-Null

$tempDir = Join-Path $env:TEMP ("openstock-singlefile-" + [guid]::NewGuid().ToString('N'))
$toolsDir = Join-Path $tempDir 'tools'
$sevenZipInstallDir = Join-Path $toolsDir '7zip'
$lzmaSdkDir = Join-Path $toolsDir 'lzma-sdk'
New-Item -ItemType Directory -Force -Path $sevenZipInstallDir | Out-Null
New-Item -ItemType Directory -Force -Path $lzmaSdkDir | Out-Null

function Download-File([string]$Url, [string]$OutFile) {
    Write-Host "Downloading: $Url"
    Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $OutFile
}

try {
    $installerUrl = 'https://www.7-zip.org/a/7z2408-x64.exe'
    $lzmaSdkUrl = 'https://www.7-zip.org/a/lzma2408.7z'

    $installerPath = Join-Path $toolsDir '7z-installer.exe'
    $lzmaSdkPath = Join-Path $toolsDir 'lzma-sdk.7z'

    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    Download-File $installerUrl $installerPath
    Download-File $lzmaSdkUrl $lzmaSdkPath

    # Install 7-Zip to a temp folder (no admin), to get 7z.exe.
    Write-Host "Installing 7-Zip to: $sevenZipInstallDir"
    & $installerPath /S "/D=$sevenZipInstallDir" | Out-Null

    $sevenZipExe = Join-Path $sevenZipInstallDir '7z.exe'
    if (-not (Test-Path $sevenZipExe)) {
        throw "7z.exe not found after install: $sevenZipExe"
    }

    # Extract the SFX module (7zSD.sfx) from the LZMA SDK.
    Write-Host "Extracting LZMA SDK to: $lzmaSdkDir"
    & $sevenZipExe x "-o$lzmaSdkDir" $lzmaSdkPath | Out-Null

    $sfxPath = Join-Path $lzmaSdkDir 'bin\\7zSD.sfx'
    if (-not (Test-Path $sfxPath)) {
        throw "7zSD.sfx not found in extracted LZMA SDK: $sfxPath"
    }

    # Create payload: just the portable zip + a launcher script.
    Copy-Item -Force $ZipPath (Join-Path $tempDir 'OpenStock-portable.zip')

    @"
@echo off
setlocal
set "ZIP=%~dp0OpenStock-portable.zip"
set "TARGET=%~dp0OpenStock-portable"

echo Extracting to: %TARGET%
if not exist "%TARGET%" mkdir "%TARGET%" >nul 2>nul

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Expand-Archive -Path '%ZIP%' -DestinationPath '%TARGET%' -Force" || (
  echo ERROR: Failed to extract portable package.
  pause
  exit /b 1
)

echo Starting OpenStock...
call "%TARGET%\run.cmd"
echo.
echo OpenStock has stopped.
echo To start again: open "%TARGET%\run.cmd"
pause
"@ | Set-Content -Encoding Ascii (Join-Path $tempDir 'OpenStock-Launcher.cmd')

    $payload7z = Join-Path $tempDir 'payload.7z'
    & $sevenZipExe a -t7z $payload7z (Join-Path $tempDir 'OpenStock-portable.zip') (Join-Path $tempDir 'OpenStock-Launcher.cmd') | Out-Null
    if (-not (Test-Path $payload7z)) { throw "Failed to create payload.7z" }

    $configPath = Join-Path $tempDir 'config.txt'
    @"
;!@Install@!UTF-8!
Title="OpenStock Portable"
BeginPrompt="This will extract OpenStock Portable to a folder named OpenStock-portable next to this EXE."
ExtractTitle="Extracting OpenStock Portable..."
RunProgram="OpenStock-Launcher.cmd"
;!@InstallEnd@!
"@ | Set-Content -Encoding UTF8 $configPath

    $outExeTemp = Join-Path $tempDir 'OpenStock-portable.exe'
    cmd /c "copy /b `"$sfxPath`" + `"$configPath`" + `"$payload7z`" `"$outExeTemp`"" | Out-Null

    if (-not (Test-Path $outExeTemp)) { throw "Failed to produce single-file EXE" }

    Copy-Item -Force $outExeTemp $ExePath
    Write-Host "Created: $ExePath"
} finally {
    try { Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue } catch {}
}
