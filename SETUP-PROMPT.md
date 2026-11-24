# Setup prompt

Paste everything below the line into Claude Code on the machine you want to set up, with this repository as the working folder.

---

Set up my Claude profile on this machine from this repository. The source files are in `profile/`. The target is my Claude config folder, `~/.claude` (on Windows `%USERPROFILE%\.claude`). Call the target `<CLAUDE>` and my home folder `<HOME>`.

Before you change anything, check that `node --version` works. If Node.js is missing, stop and tell me: the hook needs it.

Then do these four things. Never overwrite a file without saving a copy first, as `<name>.bak-YYYYMMDD` beside it.

1. **Profile rules.** Compare `profile/CLAUDE.md` with `<CLAUDE>/CLAUDE.md`.
   - If the target does not exist, copy the file.
   - If it exists, merge by section (each `# Heading`): add sections that are missing, replace sections that have the same heading with the version from this repository, and keep sections that exist only on this machine. Keep the order used in `profile/CLAUDE.md`, with this machine's own sections at the end.
   - If a section on this machine differs from the repository in a way that looks deliberate, show me both versions and ask which to keep before you replace it.

2. **Scaffold script.** Copy `profile/scripts/project-scaffold.mjs` to `<CLAUDE>/scripts/project-scaffold.mjs`.

3. **Sweep skill.** Copy `profile/skills/sweep/SKILL.md` to `<CLAUDE>/skills/sweep/SKILL.md`.

4. **Session-start hook.** Merge the hook in `profile/settings.hooks.json` into `<CLAUDE>/settings.json`.
   - Replace `<HOME>` in the command with this machine's real home folder, written with forward slashes (for example `C:/Users/name` or `/Users/name`).
   - Keep every other key in `settings.json` as it is. Create the file if it is missing.
   - If a `SessionStart` hook whose command contains `project-scaffold.mjs` is already there, update that one. Do not add a second.
   - Do not copy any other setting from another machine.

Then check your work and report:

- `<CLAUDE>/settings.json` still parses as JSON.
- Run the script by hand on a new empty folder in the system temp folder: `node <CLAUDE>/scripts/project-scaffold.mjs <that folder>`. It must create `CLAUDE.md`, `specs/prd.md`, `specs/tickets/README.md`, `memory/index.md`, `memory/log.md`, `memory/README.md`, `archive/INDEX.md` and `.claude/settings.json`. Delete the test folder afterwards.
- List what you created, what you merged, what you backed up, and anything you skipped.

Do not scaffold my existing projects on this machine, do not commit or push anything, and do not change this repository. Tell me to start a new session afterwards, because the hook and the skill load at session start.
