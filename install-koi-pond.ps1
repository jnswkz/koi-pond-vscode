# Koi Pond — one-shot installer for VS Code on Windows.
# Run:  powershell -ExecutionPolicy Bypass -File .\install-koi-pond.ps1
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot

# code CLI check
if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
  Write-Host "Khong tim thay 'code' CLI tren PATH. Mo VS Code > Ctrl+Shift+P > 'Shell Command: Install code command in PATH' roi chay lai." -Foreground Red
  exit 1
}

# 1) animation file
$custom = Join-Path $env:USERPROFILE '.vscode\custom'
New-Item -ItemType Directory -Force $custom | Out-Null
Copy-Item (Join-Path $src 'koi-pond.js') (Join-Path $custom 'koi-pond.js') -Force
Write-Host "[1/3] Copied koi-pond.js -> $custom" -Foreground Green

# 2) custom-css loader extension
Write-Host "[2/3] Installing be5invis.vscode-custom-css ..." -Foreground Green
code --install-extension be5invis.vscode-custom-css | Out-Null

# 3) merge settings (import path + colors + git blame), with backup
$settingsPath = Join-Path $env:APPDATA 'Code\User\settings.json'
New-Item -ItemType Directory -Force (Split-Path $settingsPath) | Out-Null
if (-not (Test-Path $settingsPath)) { '{}' | Set-Content $settingsPath -Encoding UTF8 }
Copy-Item $settingsPath "$settingsPath.koi-bak" -Force

try { $s = Get-Content $settingsPath -Raw | ConvertFrom-Json }
catch {
  Write-Host "settings.json co comment/trailing comma nen khong parse duoc. Da sao luu .koi-bak." -Foreground Yellow
  Write-Host "Mo koi-pond.theme.json va dan thu cong cac key vao settings.json, va them:" -Foreground Yellow
  $imp = 'file:///' + ($custom -replace '\\','/') + '/koi-pond.js'
  Write-Host "  `"vscode_custom_css.imports`": [`"$imp`"]" -Foreground Yellow
  exit 1
}
$theme = Get-Content (Join-Path $src 'koi-pond.theme.json') -Raw | ConvertFrom-Json
foreach ($p in $theme.PSObject.Properties) { $s | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force }
$imp = 'file:///' + ($custom -replace '\\','/') + '/koi-pond.js'
$s | Add-Member -NotePropertyName 'vscode_custom_css.imports' -NotePropertyValue @($imp) -Force
$s | ConvertTo-Json -Depth 50 | Set-Content $settingsPath -Encoding UTF8
Write-Host "[3/3] Merged theme + import into settings.json (backup: settings.json.koi-bak)" -Foreground Green

Write-Host ""
Write-Host "Gan xong. Buoc cuoi (lam 1 lan, khong the script hoa):" -Foreground Cyan
Write-Host "  1. Mo VS Code, Ctrl+Shift+P -> 'Enable Custom CSS and JS'" -Foreground Cyan
Write-Host "  2. Restart khi duoc hoi" -Foreground Cyan
Write-Host "  3. Tat banner 'installation corrupt' (banh rang -> Don't Show Again)" -Foreground Cyan
Write-Host "  * Sau moi lan VS Code update: chay lai 'Enable Custom CSS and JS'." -Foreground DarkCyan
