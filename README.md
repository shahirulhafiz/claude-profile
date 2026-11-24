# claude-profile

My Claude Code profile, kept in one place so every machine has the same setup.

## What is in it

| File | Goes to | What it does |
| --- | --- | --- |
| `profile/CLAUDE.md` | `~/.claude/CLAUDE.md` | Global rules: the app wins over notes and plans, ticket status lines, memory in Open Knowledge Format (OKF v0.3), how to use subagents. |
| `profile/scripts/project-scaffold.mjs` | `~/.claude/scripts/` | Sets up a project root: `CLAUDE.md`, `specs/`, an OKF `memory/` folder and an `archive/` folder Claude cannot read. Only creates what is missing. |
| `profile/scripts/session-brief.mjs` | `~/.claude/scripts/` | Start-of-session briefing: latest `memory/log.md` entries, tickets in progress, last commits, and whether a dream is due or proposals are waiting. |
| `profile/scripts/session-digest.mjs` | `~/.claude/scripts/` | Shortens a project's saved session transcripts into one digest for a dream. Output stays in `~/.claude/dream/`, outside the project. |
| `profile/settings.hooks.json` | merged into `~/.claude/settings.json` | Session-start hooks that run the scaffold and the briefing. |
| `profile/skills/sweep/SKILL.md` | `~/.claude/skills/sweep/` | The `/sweep` skill: finds outdated TODOs, plans, rules and memories, proves each one, and changes nothing before a yes. |
| `profile/skills/dream/SKILL.md` | `~/.claude/skills/dream/` | The `/dream` skill: reviews past sessions in a background subagent and proposes memory changes with the sessions as evidence. Starts automatically after 3 new sessions and 24 hours; applies nothing before a yes. |

## Set up a machine

Needs Claude Code and Node.js. No clone is needed.

1. Open [SETUP-PROMPT.md](SETUP-PROMPT.md) and copy the whole file. It holds the complete profile: the rules, the script, the skill and the hook.
2. Paste it into Claude Code on that machine.
3. Start a new session.

Paste the latest version of the same prompt again to update a machine.

## Change the profile

`profile/` is the source. `SETUP-PROMPT.md` is generated from it.

1. Edit the files in `profile/`. Or ask Claude: "copy my current `~/.claude/CLAUDE.md`, `scripts/project-scaffold.mjs` and `skills/sweep/SKILL.md` into `profile/` and show me the diff".
2. Run `node build-prompt.mjs` to rebuild the prompt.
3. Commit both.

Keep secrets out: no tokens, no `settings.json` from a real machine, no memory files.

## Per project

- Opt a project out of the automatic setup: create an empty `.claude/no-scaffold` file in it.
- Set up a project that already has `CLAUDE.md` or `AGENTS.md`: `node ~/.claude/scripts/project-scaffold.mjs --update-claude-md <folder>`.
