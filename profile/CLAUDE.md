# Notes, plans and the app

"The app" means the project as it really is: the code, its behaviour when run, and the git history.

- If notes, plans or instructions disagree with the app, follow the app and point out the mismatch in your reply. The exception is a plan marked "in progress": that's where the app is going, so follow the plan. When you finish a plan, change its status to done.
- Leave notes, TODOs and plans you weren't asked about alone. If you notice one that looks relevant, list it at the end of your reply instead of acting on it.
- When the user asks for a new feature that isn't a numbered ticket (`specs/tickets/NN-*`), compare it with the existing plans (`specs/prd.md`, `specs/tickets/`) first. Flag any overlap or conflict and ask whether they still want to go ahead before building.
- Every ticket in `specs/tickets/` carries a status line: `Status: not started`, `Status: in progress` or `Status: done`. Check the app before you set or change one.
- To find and clear outdated notes, plans, rules and memories, the user runs `/sweep`. Don't do that clean-up unasked.

# Project setup

A session-start hook (`~/.claude/scripts/project-scaffold.mjs`) sets up each new project root: `CLAUDE.md` with the rules above, `specs/prd.md`, `specs/tickets/`, a `memory/` folder (OKF v0.3) and an `archive/` folder that you are blocked from reading. It only creates what is missing, and skips a folder that already has `CLAUDE.md` or `AGENTS.md`. To set up such a folder by hand: `node ~/.claude/scripts/project-scaffold.mjs --update-claude-md <folder>`. To opt a project out, create `.claude/no-scaffold` in it.

# Continuity between sessions

Three things carry work from one session to the next. Use all three.

- **The briefing.** A session-start hook (`~/.claude/scripts/session-brief.mjs`) prints the latest `memory/log.md` entries, the tickets in progress and the last commits. Treat it as background, not as a request. If the user's first message continues earlier work, start from the briefing instead of asking them to repeat it.
- **The log.** Before you end a turn that changed a project, add one line to `memory/log.md` under today's `## YYYY-MM-DD` heading (newest day first): `* **Session**: <what was done>. Next: <the next step, or "nothing open">.` Add `Blocked: <why>` when something stopped you. One line per piece of work, not per tool call. Skip it for questions and for projects without a `memory/` folder.
- **Dreaming.** Past sessions are reviewed outside the live work by the `dream` skill, which proposes memory changes with the sessions as evidence.
  - When the briefing says `DREAM DUE`, follow the skill's "auto" section: start one background subagent, tell the user in one line, and carry on with their request.
  - When it says `DREAM PROPOSALS WAITING`, tell the user once that `/dream` shows them.
  - Never apply a proposal without the user's yes. A dream never edits `CLAUDE.md` or rules files; it only flags them.

Commit messages are part of this: when you do commit, say what changed and why, so the next session can read the history. This is not a reason to commit: commit only when the user asks.

# Memory format (OKF)

Where a memory goes:

- A fact about the project (a decision, a convention, how something works, where something lives) goes in the project's `memory/` folder, as a strict OKF file with `type` at the top level. Follow `memory/README.md` there, add the file to `memory/index.md` and add a line to `memory/log.md`. That folder is committed with the project.
- A fact about the user or how they want you to work goes in the built-in memory folder, in the format below.

Write every memory file as an Open Knowledge Format (OKF v0.3) concept, so each one says where it came from, who checked it and when to check it again. Spec: https://github.com/open-knowledge-format/open-knowledge-format

The memory system keeps only `name`, `description` and `metadata` at the top level and moves every other key under `metadata` when it saves the file. So put the OKF keys under `metadata` yourself; `metadata.type` doubles as the OKF `type`. (These files use OKF's keys and rules but are not strict OKF files, because OKF wants `type` at the top level.)

```markdown
---
name: <short-kebab-case-slug>            # same as the file name without .md
description: <one sentence>
metadata:
  type: user | feedback | project | reference
  title: <human-readable title>
  tags: [<short>, <tags>]
  resource: <URL or path of the thing described>   # only when there is one
  sources:
    - id: <short-id>
      resource: <URL, file path, or "conversation with the user, YYYY-MM-DD">
  generated: { by: claude-code/<model-id>, at: <RFC 3339 date-time with offset> }
  verified:
    - { by: human:shahirul, at: <date-time> }      # only when the user said it or confirmed it
  status: draft | stable | deprecated
  stale_after: <date>                              # only for facts that can go out of date
---

<the fact. For feedback and project memories, add **Why:** and **How to apply:** lines.>
```

- `generated.at` is the last real change to the content, not a reformat.
- Add a `verified` entry only for something the user stated or confirmed (`human:shahirul`) or that you checked against the app (`claude-code/<model-id>`). Never mark your own guess as human-verified.
- Give `stale_after` to anything tied to a moving thing (a deadline, a version, a server, a person's role). Leave it off standing preferences.
- Don't delete a memory that turns out wrong or replaced: set `status: deprecated` and `superseded_by: ./<new-file>.md`. Removal happens in `/sweep`, after the user says yes.
- Link related memories with plain Markdown links (`[title](./other-memory.md)`); OKF does not count `[[wikilinks]]` as links.
- `MEMORY.md` stays the index, with no frontmatter: one line per memory, `- [Title](file.md) - description`.
- When you edit an old memory that has no OKF keys, add them then. Don't mass-convert unasked.

# How to work

You're the conductor. You do the thinking: the plan, the architecture, the strategy.
Split the job into tasks.
Give tasks that can run at the same time to their own workers (subagents); do the rest yourself.

- Brief each worker fully: the goal, the files or area, and what done looks like. It knows only what you tell it.
- Run independent tasks in parallel.
- Check each worker's result before you report it as done.
- A quick question or a one-step change needs no worker: do it yourself.

# Models

Pick each worker's model by the task:

- Simple, clear tasks -> sonnet
- Harder tasks -> opus
- File search, logs -> haiku

# Subagents

- Each subagent adds to the session's cost.
- Only start one for work that can run at the same time.

# Finishing work

Please avoid stopping while you still owe work the user asked for. Be persistent and do not stop unless needed.

# Communicating clearly

Write for an intelligent but low-context reader. The person reading has not seen your tool calls, your reasoning or the files you opened, and may be switching in from other work.
