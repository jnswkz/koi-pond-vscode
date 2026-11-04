# Koi Pond - one-shot installer / uninstaller for VS Code on Windows.
#   Install:    powershell -ExecutionPolicy Bypass -File .\install-koi-pond.ps1
#   Uninstall:  powershell -ExecutionPolicy Bypass -File .\install-koi-pond.ps1 -Uninstall
param([switch]$Uninstall)
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$custom = Join-Path $env:USERPROFILE '.vscode\custom'
$settingsPath = Join-Path $env:APPDATA 'Code\User\settings.json'
$keys = @('vscode_custom_css.imports', 'workbench.colorCustomizations', 'editor.tokenColorCustomizations',
  'git.blame.editorDecoration.enabled', 'git.blame.statusBarItem.enabled')

# Return a local path to a support file: use the copy next to this script, else download it.
$RepoRaw = 'https://raw.githubusercontent.com/jnswkz/koi-pond-vscode/master'
function Get-Asset($name) {
  $local = Join-Path $src $name
  if (Test-Path $local) { return $local }
  $tmp = Join-Path $env:TEMP $name
  Invoke-WebRequest "$RepoRaw/$name" -OutFile $tmp -UseBasicParsing
  return $tmp
}

if (-not (Get-Command code -ErrorAction SilentlyContinue)) {
  Write-Host "Khong tim thay 'code' CLI tren PATH. Mo VS Code > Ctrl+Shift+P > 'Shell Command: Install code command in PATH' roi chay lai." -Foreground Red
  exit 1
}

if ($Uninstall) {
  Remove-Item (Join-Path $custom 'koi-pond.js') -Force -ErrorAction SilentlyContinue
  if (Test-Path $settingsPath) {
    Copy-Item $settingsPath "$settingsPath.koi-bak" -Force
    try {
      $s = Get-Content $settingsPath -Raw | ConvertFrom-Json
      foreach ($k in $keys) { $s.PSObject.Properties.Remove($k) | Out-Null }
      $s | ConvertTo-Json -Depth 50 | Set-Content $settingsPath -Encoding UTF8
      Write-Host "Da go cac key Koi Pond khoi settings.json (backup: settings.json.koi-bak)." -Foreground Green
    } catch {
      Write-Host "settings.json co comment nen khong tu go duoc. Xoa thu cong cac key: $($keys -join ', ')" -Foreground Yellow
    }
  }
  code --uninstall-extension be5invis.vscode-custom-css | Out-Null
  Write-Host ""
  Write-Host "Da go Koi Pond. Neu con banner 'corrupt': Ctrl+Shift+P -> 'Disable Custom CSS and JS' roi Restart." -Foreground Cyan
  exit 0
}

# ---- install ----
New-Item -ItemType Directory -Force $custom | Out-Null
Copy-Item (Get-Asset 'koi-pond.js') (Join-Path $custom 'koi-pond.js') -Force
Write-Host "[1/3] Copied koi-pond.js -> $custom" -Foreground Green

Write-Host "[2/3] Installing be5invis.vscode-custom-css ..." -Foreground Green
code --install-extension be5invis.vscode-custom-css | Out-Null

New-Item -ItemType Directory -Force (Split-Path $settingsPath) | Out-Null
if (-not (Test-Path $settingsPath)) { '{}' | Set-Content $settingsPath -Encoding UTF8 }
Copy-Item $settingsPath "$settingsPath.koi-bak" -Force
try { $s = Get-Content $settingsPath -Raw | ConvertFrom-Json }
catch {
  Write-Host "settings.json co comment/trailing comma nen khong parse duoc. Da sao luu .koi-bak." -Foreground Yellow
  $imp = 'file:///' + ($custom -replace '\\', '/') + '/koi-pond.js'
  Write-Host "Dan thu cong cac key trong koi-pond.theme.json, va: `"vscode_custom_css.imports`": [`"$imp`"]" -Foreground Yellow
  exit 1
}
$theme = Get-Content (Get-Asset 'koi-pond.theme.json') -Raw | ConvertFrom-Json
foreach ($p in $theme.PSObject.Properties) { $s | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force }
$imp = 'file:///' + ($custom -replace '\\', '/') + '/koi-pond.js'
$s | Add-Member -NotePropertyName 'vscode_custom_css.imports' -NotePropertyValue @($imp) -Force
$s | ConvertTo-Json -Depth 50 | Set-Content $settingsPath -Encoding UTF8
Write-Host "[3/3] Merged theme + import into settings.json (backup: settings.json.koi-bak)" -Foreground Green

Write-Host ""
Write-Host "Gan xong. Buoc cuoi (lam 1 lan, khong the script hoa):" -Foreground Cyan
Write-Host "  1. Mo VS Code, Ctrl+Shift+P -> 'Enable Custom CSS and JS'" -Foreground Cyan
Write-Host "  2. Restart khi duoc hoi" -Foreground Cyan
Write-Host "  3. Tat banner 'installation corrupt' (banh rang -> Don't Show Again)" -Foreground Cyan
Write-Host "  * Sau moi lan VS Code update: chay lai 'Enable Custom CSS and JS'." -Foreground DarkCyan
Write-Host "Go cai: install-koi-pond.ps1 -Uninstall" -Foreground DarkCyan
