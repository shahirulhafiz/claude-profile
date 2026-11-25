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
Give workers (subagents) the tasks that can run at the same time, and the reading or building that would fill this conversation (see "Keeping the session small"); do the rest yourself.

- Brief each worker fully: the goal, the files or area, and what done looks like. It knows only what you tell it.
- Run independent tasks in parallel.
- Check each worker's result before you report it as done.
- A quick question or a one-step change needs no worker: do it yourself.

# Models

Every worker call names a model. A call with no model runs on the session's model, which is usually the most expensive one. Pick the model by the task:

- Simple, clear tasks -> sonnet
- Harder tasks -> opus
- File search, logs -> haiku

This covers every kind of worker:

- Agents that come from plugins need a model too. Many are set to inherit the session's model.
- When a worker starts workers of its own, say in its brief which model to give them.
- A hook (`~/.claude/scripts/require-agent-model.mjs`) blocks a worker call that names no model. Forks are exempt: they always run on the session's model.

# Subagents

- Start one for work that can run at the same time, or for reading or building that would otherwise fill this conversation.
- Not for a lookup or a one-step change: each subagent has a start-up cost.
- Use the leanest agent type that can do the job: `reader` to find and read files (it has no shell); `reviewer` to check a change, or when a read-only job needs git or another command; `builder` when the job changes files or runs commands that write. Use `general-purpose` only when the task needs what those lack (the web, a connector, a skill, or workers of its own): it starts with about six times as much context.
- The model on the call still follows the Models rule. The model in an agent type's own definition is only a fallback.

# Keeping the session small

Every turn re-reads the whole conversation, so a long session costs more on every turn.

- One session per ticket or phase. A phase ends where you already stop for the user: an approval point or the end of the request. Do not stop anywhere else for this. When a "Context check" note has appeared, add one line there saying this is a good point to continue in a new session, and make sure the plan or spec is on disk and the log line is written. It is a remark, not a question: carry on if the user does.
- Read to decide, not to survey. Read yourself the files you are about to edit and the lines you need. To learn how an area works, or to go through more than about three files, give it to a worker and ask for conclusions with file and line.
- Build through workers once a spec or checklist is approved. Check their work from the diff and the tests, not by reading the whole files again.
- Do not read a file again that is already in this conversation, unless it changed. When you know which part you need, read that part.
- Look at an image once and write down what you saw.
- A hook (`~/.claude/scripts/context-check.mjs`) adds the "Context check" note. When it says the conversation is large, act on it at the next approval point. When it says the conversation has been idle, tell the user straight away, then do what they asked. Mention either once, not on every turn.

# Finishing work

Please avoid stopping while you still owe work the user asked for. Be persistent and do not stop unless needed.

# Communicating clearly

Write for an intelligent but low-context reader. The person reading has not seen your tool calls, your reasoning or the files you opened, and may be switching in from other work.

# Making changes: route first (Elephant-Goldfish)

This is my default for every project.

- When I ask in plain text for a change to a project's code (a feature, a fix, a refactor, a UI change), a design, or a design review, route it before editing: call the `Skill` tool with skill `route` and my request as the args, then follow the route it picks. I do not type slash commands; do not ask me to.
- A question, a lookup or a one-line edit needs no route.
- My plain-text request is my standing instruction to run the Elephant-Goldfish (EGM) steps its route lists. The `Skill` tool refuses `/egm:*` skills, so run a step by reading that skill's `SKILL.md` in the plugin folder and following it, as the `route` command describes.
- Stop at every approval point and tell me in plain words what comes next. Nothing is built from a spec or checklist I have not approved.
- The session that drafts a spec does not review it. Reviews run in fresh subagents.
- Every EGM agent inherits the session's model, so name a model on every EGM call: sonnet for `egm:egm-style`, `egm:egm-structural` and `egm:egm-comprehension`; opus for `egm:egm-synthesizer`, `egm:egm-bootstrap-orchestrator` and the other reviewers. When you start `egm:egm-synthesizer` or `egm:egm-bootstrap-orchestrator`, tell it in its brief which model to give each worker it starts: the model from this list for a reviewer, sonnet for any other worker.
- Review panel. Where an EGM skill lists its reviewers, use this smaller panel instead. It comes from an audit of two reviewed designs on 2026-11-25: the reviewers left out raised nothing the others did not.
  - Brainstorm review: `egm:egm-zoom-out`, `egm:egm-inventive-catalyst`, `egm:egm-codebase-details`.
  - Stage 5 (zoom out): `egm:egm-zoom-out`, `egm:egm-inventive-catalyst`.
  - Stage 6 (comprehension): `egm:egm-comprehension`, called directly.
  - Stage 7 (critic): `egm:egm-design`, `egm:egm-style`. No structural reviewer. Check yourself that the draft has a Risks section and that each rejected option says who rejected it.
  - Stage 8 (second zoom out): skip it. Go from stage 7 to stage 9.
  - Stage 9 (readiness): `egm:egm-implementation-readiness`, `egm:egm-codebase-details`. No second style run.
  - A re-audit uses that stage's reviewers from this list, without style.
  - One synthesizer per round. For a single reviewer, call it directly.
  - If I ask for the full panel, use the skill's own list.
- EGM artifact directory: `docs/designs`, unless the project names another.
- If a project's own instructions name a different workflow, follow the project.
