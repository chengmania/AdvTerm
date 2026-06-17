# ROADMAP.md — AdvTerm Phase Tracking

Check items off as they are completed AND manually verified (not just
written). See AGENT.md for what "verified" means per phase.

## Phase 0 — Skeleton
- [ ] Tauri app boots on Linux dev machine
- [ ] Single xterm.js pane fills window
- [ ] PTY spawns default shell successfully
- [ ] Basic input/output round-trip confirmed (typing works, output renders)

## Phase 1 — Tabs
- [ ] New tab creates an independent PTY
- [ ] Close tab cleanly kills its PTY
- [ ] Switch tab preserves each pane's scrollback/state
- [ ] No cross-talk between tabs' input/output

## Phase 2 — Claude Code profile (single AI)
- [ ] Resolve "mode switcher" semantics with Greg (see CLAUDE.md open Qs)
- [ ] Hardcoded profile launches `claude` in a tab
- [ ] Detect whether Claude Code is installed / on PATH; graceful
      "not found" state if missing
- [ ] Detect logged-in vs not-logged-in state
- [ ] Basic sidebar renders with slash-command palette for this profile
- [ ] Palette buttons correctly insert commands into the active pane

## Phase 3 — Usage meter
- [ ] Test whether `claude -p --output-format json` exposes
      usage-equivalent data (determines parser design)
- [ ] Build scrape-and-parse pipeline for interactive `/usage` output
      (fallback/primary depending on above finding)
- [ ] Normalize to `{used, limit, resetTime}` shape
- [ ] Sidebar usage meter widget displays parsed data visually
- [ ] Note fragile-parsing risk in LOG.txt if output format seems
      version-dependent

## Phase 4 — Generalize to multi-AI
- [ ] Refactor hardcoded Claude Code profile into JSON profile schema
- [ ] Add second profile (Gemini CLI) using only the profile system
      (no profile-specific code changes required)
- [ ] Confirm per-profile login-detection method works for both
- [ ] Sidebar correctly switches palette/usage display based on active
      tab's assigned profile

## Phase 5 — Polish layer
- [ ] Menu bar: save/restore session (transcript + workspace state)
- [ ] Menu bar: terminal color/font customization
- [ ] Menu bar: GUI theme customization
- [ ] Default terminal theme is standard black-on-white/grey (normal
      terminal look, not retro)
- [ ] Syntax-aware input highlighting (default-on): classify and color
      bash/shell commands vs AI slash-commands vs plain prose vs output
- [ ] Config import/export (shareable JSON profiles)
- [ ] Copy/paste helpers in sidebar (copy last response, copy last
      output block, paste-as-prompt)
- [ ] Detect-and-delegate login flow polished (clear UI, not just
      functional)
- [ ] About page

## Phase 5b — Retro CRT theme (optional, can slip to Phase 6/later)
- [ ] Select/bundle pixel-style monospace font (e.g. VT323)
- [ ] Black background + blue text palette as a selectable theme option
- [ ] Per-character fade-in-on-type rendering effect
- [ ] Confirm fade-in effect doesn't hurt readability/performance on
      long-output sessions (e.g. Claude Code streaming output)

## Phase 6 — Quality-of-life
- [ ] OS notification + tab badge on background-tab task completion
- [ ] Scrollback search (find-in-buffer)
- [ ] Keyboard shortcuts (tab switching, slash-insert, etc.)
- [ ] Update checker (optional/minor — only if time allows)

## Future ideas (not committed — park here, don't build unprompted)
- (empty — add items here as they come up mid-build)

---
Reminder: once AdvTerm is fully done, fork the core terminal layer
(Tauri/PTY/tabs/xterm.js/theming — no AI-profile system) into a separate
standalone general-purpose terminal emulator project named **Phosphor**.
