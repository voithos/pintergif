#!/usr/bin/env pwsh
# Creates a pintergif.zip package for Chrome Web Store submission.

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = $PSScriptRoot
$outFile = Join-Path $root 'pintergif.zip'

if (Test-Path $outFile) {
    Remove-Item $outFile -Force
}

$files = @(
    'manifest.json'
    'defaults.js'
    'pintergif.js'
    'popup.html'
    'popup.js'
    'images'
)

$paths = $files | ForEach-Object { Join-Path $root $_ }
Compress-Archive -Path $paths -DestinationPath $outFile

Write-Host "Created $outFile"
