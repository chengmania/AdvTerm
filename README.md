# AdvTerm

A cross-platform terminal emulator built specifically for AI coding-agent CLIs — Claude Code, Antigravity, OpenCode, Codex, Aider, Plandex, and Goose.

AdvTerm is not a general-purpose terminal replacement. Its value is a focused control surface for the repetitive actions heavy AI-coding-agent users perform constantly: inserting slash-commands, watching usage/rate-limit status, switching AI profiles per tab, and copying output — without leaving the terminal.

---

## Features

- **Tabbed PTY sessions** — each tab is an independent shell process; switch with Ctrl+1–9
- **AI profile system** — assign Claude Code, Antigravity, OpenCode, Codex, Aider, Plandex, or Goose to any tab with one click
- **Slash-command palette** — filterable sidebar palette per AI profile; hover any command for a description
- **Usage meter** — live rate-limit display parsed from the active AI tool (Claude Code supported)
- **Scrollback search** — Ctrl+F floating search bar with next/prev navigation
- **Syntax-aware input badge** — classifies what you're typing: slash command, shell escape, or AI prompt
- **Copy/paste helpers** — copy last output block, copy visible viewport, paste to PTY
- **Session save/restore** — tabs and profiles persist across launches
- **OS notifications + tab badge** — background tab activity triggers a notification when the window is unfocused
- **Keyboard shortcuts** — Ctrl+T new tab, Ctrl+W close, Ctrl+Tab cycle, Ctrl+F search
- **Adjustable transparency** — full window opacity control via Settings
- **Color themes** — Dark, Light, Dracula, Solarized Dark, Monokai, Retro CRT (phosphor green + scanlines), **Futurist** (animated static snow + cyan + scanlines)
- **Font customization** — size slider, family picker including VT323 retro font
- **Config import/export** — share AI tool profiles as JSON between machines
- **Install helper** — detect uninstalled AI tools and run their install scripts in a dedicated tab
- **Update checker** — version display with GitHub releases check in the Help modal
- **KDE Dolphin integration** — "Open in AdvTerm" right-click menu entry (opens in the current directory)

---

## Supported AI Tools

| Tool | Install |
|------|---------|
| [Claude Code](https://claude.ai/code) | `npm install -g @anthropic-ai/claude-code` |
| [Antigravity](https://antigravity.dev) | `npm install -g @antigravity/cli` |
| [OpenCode](https://opencode.ai) | `curl -fsSL https://opencode.ai/install \| sh` |
| [Codex CLI](https://github.com/openai/codex) | `npm install -g @openai/codex` |
| [Aider](https://aider.chat) | `pip install aider-chat` |
| [Plandex](https://plandex.ai) | `curl -sL https://plandex.ai/install.sh \| bash` |
| [Goose](https://block.github.io/goose/) | `curl -fsSL https://github.com/block/goose/releases/latest/download/install.sh \| bash` |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) stable
- Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Run in dev mode

```bash
source "$HOME/.cargo/env"   # if Rust isn't in your PATH yet
npm install
npm run tauri dev
```

### Build a release binary

```bash
npm run tauri build
# Output: src-tauri/target/release/advterm  (Linux binary)
#         src-tauri/target/release/bundle/  (deb, AppImage)
```

### GitHub Actions releases

Push a version tag to trigger automated Linux + Windows + macOS builds:

```bash
git tag v1.0.0
git push origin v1.0.0
```

A draft release appears at [github.com/chengmania/AdvTerm/releases](https://github.com/chengmania/AdvTerm/releases) with all platform installers attached.

---

## KDE Dolphin right-click integration

To add "Open in AdvTerm" to Dolphin's context menu:

1. Copy the binary to `~/.local/bin/advterm`
2. Create `~/.local/share/kservices5/ServiceMenus/advterm.desktop`:

```ini
[Desktop Entry]
Type=Service
ServiceTypes=KonqPopupMenu/Plugin
MimeType=inode/directory;
Actions=OpenInAdvTerm;
X-KDE-Priority=TopLevel

[Desktop Action OpenInAdvTerm]
Name=Open in AdvTerm
Icon=utilities-terminal
Exec=bash -c 'DIR=$(echo "%f" | sed "s|^file://||"); /home/YOUR_USERNAME/.local/bin/advterm --cwd "$DIR"'
```

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Window / PTY | Tauri 2 (Rust) + portable-pty |
| Terminal rendering | xterm.js (@xterm/xterm) |
| UI framework | React + TypeScript + Vite |
| State | Zustand (with persist) |
| AI tool definitions | `src/profiles.ts` — add a new tool here, no code changes elsewhere |

Adding support for a new AI tool means adding one entry to `src/profiles.ts`. No Rust changes required.

---

## License

MIT — see [LICENSE](LICENSE)

---

*Author: chengmania KC3SMW*
