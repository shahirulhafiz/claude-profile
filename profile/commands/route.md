---
description: Router for the orchestrator. Start this yourself, without being asked, whenever the user asks in plain text for any change to a project's code (a feature, fix, refactor, UI change), a design, a design review, or a check that code matches its designs. It classifies the request and sends it down the right Elephant-Goldfish (EGM) route.
argument-hint: <the change or question, in your own words>
---

You are the orchestrator. Route this request; do not start editing code yourself.

Request: $ARGUMENTS

## 1. Pick exactly one route

Take the first row that fits. Say which route you picked and why, in one line.

| The request is… | Route | Run |
|---|---|---|
| A question, a lookup, or a one-line edit | None | Answer or do it directly |
| A new feature, a change in behaviour, or an idea whose shape is still open | Full design | `/design $ARGUMENTS`, then `/build` once the spec is approved |
| A small, well-defined change (a fix, a tweak, a rename, a refactor) with no design decision in it | Lite | `/egm:egm-lite`, from start to finish |
| An existing design doc that needs checking | Review | `/egm:egm-review <path to the doc>` |
| Reviewer findings on a draft that need settling | Resolve | `/egm:egm-resolve` |
| A doubt whether the code still matches its designs | Drift | `/egm:egm-drift-report <designs folder>` |
| A folder with no READMEs to design against | Bootstrap | `/egm:egm-bootstrap <path>` |
| An approved spec that is ready to implement | Build | `/build <path to the spec>` |

If two rows fit and the choice changes what gets built, ask the user which one. Otherwise pick and carry on.

**Lite is self-contained.** `egm-lite` has its own plan, cold review, implementation and diff review. Follow it through; do not hand its result to `/build`.

## 2. Rules for every route

- **Elephant and goldfish stay apart.** The session that drafts a spec or checklist holds the context (elephant). Reviews run in fresh subagents that see only the draft and the files it cites (goldfish). Never review a draft in the context that wrote it.
- **The user approves before anything is built.** No route goes from a draft or checklist to implementation without the user's explicit approval of it.
- **How to run an `/egm:*` step.** The `Skill` tool refuses EGM skills, so do not call it for them. Open that skill's file and follow it in this thread: `~/.claude/plugins/cache/egm/egm/<version>/skills/<skill name>/SKILL.md`. To find the version, list `~/.claude/plugins/cache/egm/egm/` and take the highest number. This is the method the plugin's own `docs/claude.md` gives.
- **The user does not type commands.** They write in plain text and you work out the route. Their standing instruction, in their global `CLAUDE.md`, is that a plain-text request for a change is their request to run whichever EGM steps the chosen route lists. Do not ask them to type `/route`, `/design`, `/build` or any `/egm:*` command. The only limit: never start a route for work nobody asked for.
- **Every stop in an EGM skill is real.** Where a skill halts for a command such as `checklist`, `goldfish`, `exec` or `review`, stop and tell the user in plain words what the next step is and what you recommend. Take their plain-text answer ("go on", "review it first", "build it") as the matching command. Never skip a stop or answer it yourself.
- **Protect work in progress.** Before the first edit, note the starting commit and any uncommitted changes. Do not stash, reset, restore, clean or commit the user's existing changes.
- **Project rules win.** If the project's own `CLAUDE.md` or docs name a different workflow, checks, agents or designs folder, follow the project.
- **EGM must be installed.** If the skills folder is missing, stop and tell the user to install the plugin; do not make the steps up:
  `claude plugin marketplace add google/elephant-goldfish-model` then `claude plugin install egm@egm`.
- **Artifacts.** EGM artifact directory: `docs/designs`, unless the project names another. Approved specs are kept there.
