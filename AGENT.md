# AGENT.md — How to work this repo

This file governs *how* Claude Code (or another agent) should behave while
working on AdvTerm, separate from CLAUDE.md which defines *what* the
project is.

## Working style

- Read CLAUDE.md and ROADMAP.md before starting any session. Confirm
  which phase is currently in progress (per ROADMAP.md checkboxes) before
  writing code.
- Work one phase at a time. Do not start Phase N+1 work while Phase N is
  incomplete or unverified, even if it seems convenient (e.g. don't wire
  multi-profile support while still debugging single-PTY spawning).
- Prefer small, verifiable commits/changes over large speculative ones.
  After each meaningful change, state what was changed and what should be
  manually tested to verify it.
- If a decision point comes up that isn't resolved in CLAUDE.md's "Open
  questions" section, stop and ask rather than guessing — especially for:
  the "mode switcher" semantics, per-profile login-detection method, and
  anything that would involve storing credentials (the answer there is
  always no — flag and ask instead of building it).

## Cross-platform discipline

Since this targets Linux/Mac/Windows:
- Avoid hardcoded path separators, shell assumptions (`/bin/bash` vs
  `cmd.exe`/PowerShell), or PTY behavior assumed from only testing on
  Linux. Greg's primary dev machine is Kubuntu/Ubuntu — flag explicitly
  in LOG.txt anything that needs Mac/Windows testing he can't do locally.
- Tauri/Rust PTY libraries differ in behavior across OSes — when in
  doubt, check the library's own cross-platform caveats before assuming
  parity.

## Logging discipline

At the end of every working session, append an entry to LOG.txt with:
- Date
- Phase being worked on
- What was completed
- What's broken/incomplete
- What the next session should pick up
- Any open question that needs Greg's input

Do not overwrite previous LOG.txt entries — always append.

## Updating ROADMAP.md

When a phase's milestones are functionally complete and manually verified
(not just "code written"), check it off in ROADMAP.md. Do not mark
something complete based only on "it compiles" — terminal/PTY bugs are
often runtime-only.

## Scope discipline

This project deliberately does not try to out-feature Warp or other
full-featured AI terminals (see CLAUDE.md non-goals). If a feature idea
emerges mid-build that's clearly scope creep beyond the agreed feature
set, note it in LOG.txt under a "Future ideas" subsection rather than
building it unprompted.

## Testing expectations

- Phase 0–1 (PTY + tabs): manually verify spawn/close/switch on whatever
  OS is available locally; note explicitly which OSes were NOT tested.
- Phase 2 (Claude Code profile): verify against a real Claude Code
  install, not a mock — the slash-command palette and detection logic
  need to match actual CLI behavior.
- Phase 3 (usage meter): verify the parser against real `/usage` output
  captured from an actual session, and note in LOG.txt if output format
  seems likely to change between Claude Code versions (fragile-parsing
  risk worth flagging, not silently accepting).
