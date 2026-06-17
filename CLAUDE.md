# AdvTerm — Project Spec for Claude Code

Author: chengmania KC3SMW

## What this is

AdvTerm is a cross-platform (Linux/Mac/Windows) terminal emulator with a
GUI sidebar built specifically around AI coding-agent CLIs (Claude Code,
Gemini CLI, etc.), not a general-purpose terminal replacement. It does not
compete with Warp/Ghostty/iTerm2 on raw terminal features. Its value is a
focused control surface for the small set of repetitive actions a heavy
Claude Code user performs constantly: inserting slash-commands, copying
output, switching AI profiles per tab, and watching usage/rate-limit status
without typing `/usage` and reading prose.

## Stack

- **Shell/host:** Tauri (Rust backend) — window mgmt, PTY spawning per tab,
  filesystem access for session/profile persistence, OS notifications.
- **Frontend:** React + TypeScript + xterm.js for terminal rendering.
- **State:** Zustand (or equivalent) for app state — open tabs, active
  profile per tab, theme, saved sessions.
- **Profiles:** JSON config files, one per AI tool, defining its launch
  command, slash-command palette, login-detection method, and usage-output
  parsing pattern. This is the extensibility point — adding a new AI tool
  should mean "add a profile," not "write new code."

## Core principle: detect-and-delegate auth

AdvTerm never stores, manages, or proxies API keys/credentials for any AI
provider. Each CLI tool (Claude Code, Gemini CLI, etc.) handles its own
login/OAuth and persists its own auth state. AdvTerm only detects whether
a tool is authenticated (e.g. by checking for its known config file or
running a lightweight status command) and, if not, runs that tool's own
native login flow inside a terminal pane. Do not build any credential
storage, encryption, or API-key management UI.

## Feature set (target, not all-at-once — see ROADMAP.md for sequencing)

- Tabbed terminal panes, each an independent PTY, each assignable to an
  AI profile (Claude Code / Gemini CLI / plain shell / future profiles).
- GUI sidebar:
  - Slash-command palette, switchable per active tab's AI profile.
  - Usage meter — parsed from the active profile's usage-output (e.g.
    Claude Code's `/usage`), normalized to `{used, limit, resetTime}` and
    shown visually (not just raw text).
  - Copy/paste helpers (copy last AI response, copy last output block,
    paste-as-prompt).
  - One-time login flow per profile (detect-and-delegate, see above).
- Menu bar:
  - Save/restore session (transcript + workspace state: open tabs, each
    tab's working directory, each tab's assigned AI profile).
  - Terminal color/font customization.
  - GUI theme customization.
  - Config import/export (JSON profile files, shareable between users).
- Default terminal appearance is standard black-on-white/black-on-grey
  monospace (normal terminal look) — NOT retro by default. Retro CRT look
  (below) is an optional selectable theme, not the out-of-box experience.
- **Optional "Retro CRT" theme** — black background, blue pixel/bitmap-style
  monospace font (e.g. VT323 or similar), with a per-character fade-in
  effect on type to evoke old movie-computer terminals. This is a
  rendering/animation feature, not just a color palette swap — treat as
  its own build item, separate from general theme customization.
- **Syntax-aware input highlighting** (default-on, independent of theme) —
  classify what's being typed/echoed and color accordingly: e.g. shell/bash
  commands styled differently from AI slash-commands, from plain prose
  sent to the AI, from command output. This requires AdvTerm to do
  lightweight input classification itself; xterm.js alone only renders
  whatever bytes the PTY returns and doesn't classify content. This is a
  real functional feature, not a CSS tweak — needs its own design pass
  before Phase 5.
- Mode switcher for the terminal (interpretation: switching a tab's
  active AI profile / mode — confirm exact semantics before building,
  see open questions below).
- About page.
- Notifications on background-tab task completion (badge + OS notify).
- Scrollback search (find-in-buffer).
- Keyboard shortcuts for tab switching, slash-insert, etc.
- Graceful handling when a configured CLI tool isn't installed or isn't
  on PATH — show a clear "not found" state, never a silent failure.

## Explicit non-goals (v1)

- Not building a VT100/ANSI parser from scratch — use xterm.js, it already
  solves this.
- Not implementing OAuth or credential storage for any provider.
- Not trying to match Warp's full feature set (blocks, AI command
  generation, etc.) — stay focused on the agent-CLI-companion niche.

## Build sequencing

Follow ROADMAP.md phase order. Do not jump ahead to polish (theming,
session save/restore, multi-AI generalization) before Phase 0–2 are
proven working, since PTY cross-platform behavior and usage-output
scraping are the two biggest unknowns and should be de-risked early.

## Open questions to resolve before/during relevant phase

- "Mode switcher for the terminal" — confirm whether this means
  switching a tab's AI profile, switching terminal emulation mode
  (e.g. vi/normal input mode), or something else. Ask before Phase 2.
- Exact method for detecting each CLI's login state (config file
  presence vs. lightweight status command) — confirm per-profile during
  Phase 2/4.
- Whether `claude --output-format json` (headless mode) can return
  usage-equivalent data, vs. needing to scrape interactive `/usage`
  output — test early in Phase 3, this determines parser design.

## Conventions

- Author credit in code/doc headers: chengmania KC3SMW
- Update LOG.txt at the end of each working session (what was done,
  what's next, any blockers).
- Update ROADMAP.md checkboxes as phases/milestones complete.
