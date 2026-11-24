# claude-profile

My Claude Code profile, kept in one place so every machine has the same setup.

## What is in it

| File | Goes to | What it does |
| --- | --- | --- |
| `profile/CLAUDE.md` | `~/.claude/CLAUDE.md` | Global rules: the app wins over notes and plans, ticket status lines, memory in Open Knowledge Format (OKF v0.3), how to use subagents. |
| `profile/scripts/project-scaffold.mjs` | `~/.claude/scripts/` | Sets up a project root: `CLAUDE.md`, `specs/`, an OKF `memory/` folder and an `archive/` folder Claude cannot read. Only creates what is missing. |
| `profile/settings.hooks.json` | merged into `~/.claude/settings.json` | Session-start hook that runs the script, so a new project is set up automatically. |
| `profile/skills/sweep/SKILL.md` | `~/.claude/skills/sweep/` | The `/sweep` skill: finds outdated TODOs, plans, rules and memories, proves each one, and changes nothing before a yes. |

## Set up a machine

Needs Claude Code, git and Node.js.

1. Clone this repository and open the folder in Claude Code.
2. Paste the prompt from [SETUP-PROMPT.md](SETUP-PROMPT.md).
3. Start a new session.

Run the same prompt again after a `git pull` to update a machine.

## Change the profile

Edit the files on one machine, then copy them back into `profile/` and commit. Or ask Claude: "copy my current `~/.claude/CLAUDE.md`, `scripts/project-scaffold.mjs` and `skills/sweep/SKILL.md` into `profile/` and show me the diff".

Keep secrets out: no tokens, no `settings.json` from a real machine, no memory files.

## Per project

- Opt a project out of the automatic setup: create an empty `.claude/no-scaffold` file in it.
- Set up a project that already has `CLAUDE.md` or `AGENTS.md`: `node ~/.claude/scripts/project-scaffold.mjs --update-claude-md <folder>`.
