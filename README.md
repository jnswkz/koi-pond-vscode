# Koi Pond for VS Code

A live koi-pond wallpaper for VS Code — koi drifting behind your code, lily pads, ripples — plus a matching teal color theme. A homage to the [Koi Pond](https://github.com/0toshigami/claude-desktop-themes) Claude Desktop theme.

<video src="https://github.com/jnswkz/koi-pond-vscode/raw/master/koipond.mp4" controls width="100%"></video>

## Install (Windows, one shot)

```powershell
powershell -ExecutionPolicy Bypass -File .\install-koi-pond.ps1
```

The script:
1. copies `koi-pond.js` to `%USERPROFILE%\.vscode\custom\`
2. installs the `be5invis.vscode-custom-css` extension
3. merges the colors + git-blame settings into your VS Code `settings.json` (backup saved as `settings.json.koi-bak`); the wallpaper import path is set automatically for the current user

Then, once (no CLI for this):

- `Ctrl+Shift+P` → **Enable Custom CSS and JS** → **Restart**
- Dismiss the one-time *"installation appears corrupt"* banner (⚙ → Don't Show Again) — harmless; it just means the workbench was patched to inject the wallpaper.

> After each VS Code update the patch is wiped — re-run **Enable Custom CSS and JS**.

## Files

| File | What |
|------|------|
| `koi-pond.js` | The canvas wallpaper (koi, lilies, ripples). Tweak `CONFIG` at the top. |
| `koi-pond.theme.json` | Workbench colors + syntax token colors + git blame. |
| `install-koi-pond.ps1` | The installer. |

## Tuning

Edit `koi-pond.js` → `CONFIG`: `editorOpacity` / `uiOpacity` (how much pond shows through), `speed`, `cell` (grid size), `bg`. Reload with **Reload Custom CSS and JS**.

## Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\install-koi-pond.ps1 -Uninstall
```

Removes `koi-pond.js`, strips the Koi Pond keys from `settings.json` (backup saved), and uninstalls the custom-css extension. If the *"corrupt"* banner lingers: `Ctrl+Shift+P` → **Disable Custom CSS and JS** → Restart.
