# Antigravity Environment Restoration Script
# Purpose: Re-inject shell aliases and PATH context into clean agent threads.

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ScriptDir) { $ScriptDir = Get-Location }

# 1. Define Paths
$AntigravityRoot = (Get-Item $ScriptDir).Parent.Parent.FullName
$BinDir = "$AntigravityRoot\_core\bin"
$ConfigPath = "$AntigravityRoot\_core\tools\mcp2cli\services.json"

Write-Host "`n--- Antigravity Environment Restoration ---" -ForegroundColor Cyan

# 2. Add Bin to PATH (Session only)
if ($env:PATH -notlike "*$BinDir*") {
    $env:PATH = "$BinDir;" + $env:PATH
    Write-Host "[PATH] Added $BinDir" -ForegroundColor Gray
}

# 3. Configure mcp2cli Environment
$env:MCP2CLI_CONFIG = $ConfigPath
Write-Host "[ENV] MCP2CLI_CONFIG = $ConfigPath" -ForegroundColor Gray

# 4. Set Aliases for L1 (CLI) Tools
# Force overwrite existing aliases to ensure they point to the correct binaries.
function Set-AgAlias($Name, $Target) {
    if (Test-Path "$BinDir\$Target") {
        Set-Alias -Name $Name -Value "$BinDir\$Target" -Scope Global -Force
        Write-Host "[ALIAS] $Name -> $Target" -ForegroundColor Gray
    } else {
        Write-Host "[WARN] Missing binary: $Target" -ForegroundColor Yellow
    }
}

Set-AgAlias -Name "rg_raw" -Target "rg.exe"
function global:rg { & "$BinDir\ag_search.ps1" @args } # Use safe wrapper
Set-AgAlias -Name "fd" -Target "fd.exe"
Set-AgAlias -Name "fzf" -Target "fzf.exe"
Set-AgAlias -Name "jq" -Target "jq.exe"

# 5. Specialized Script Aliases
if (Test-Path "$BinDir\obs.ps1") {
    function global:obs { & "$BinDir\obs.ps1" @args }
    Write-Host "[FN] obs -> obs.ps1 (Wrapped)" -ForegroundColor Gray
}

# 6. Verification
Write-Host "--- Restoration Complete ---`n" -ForegroundColor Green

Write-Host "Status Check:"
Write-Host "  rg: $(Get-Command rg -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)"
Write-Host "  fd: $(Get-Command fd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)"
Write-Host "  MCP Config: $env:MCP2CLI_CONFIG"
