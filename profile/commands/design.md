---
description: Full design route. An elephant drafts the spec, goldfish reviewers check it cold, and the user approves it before any code is written.
argument-hint: <the feature or change to design>
---

Run the Elephant-Goldfish design loop for: $ARGUMENTS

EGM artifact directory: `docs/designs`, unless the project names another.

Work through these in order. Each step is one of the `egm` plugin's skills. The `Skill` tool refuses them, so for each step open `~/.claude/plugins/cache/egm/egm/<version>/skills/<skill name>/SKILL.md` (highest version folder) and follow it in this thread. If that folder is missing, stop and say the plugin is not installed.

1. **Brief** — `egm-brainstorm`. Settle the goal, the constraints and the open trade-offs with the user. It writes `concepts_brief.md`.
2. **Draft** — `egm-draft`. You are the elephant: use everything you know about this project (its README, `CLAUDE.md`, existing plans and designs, the code and its tests) to write `design_draft.md`.
3. **Review** — `egm-review` on the draft. Goldfish reviewers read it in fresh subagents with none of this conversation. Use the review panel from the Elephant-Goldfish section of the global `CLAUDE.md`, not the skill's full list; the same goes for the brainstorm review in step 1. If fresh subagents are not available, stop here rather than reviewing in this context.
4. **Resolve** — `egm-resolve`. Settle each finding: fix the draft, or record why it stands. Put every architectural trade-off to the user; do not decide those yourself. Repeat steps 3 and 4 until no blocking finding is left.
5. **Approval gate** — show the user the final spec and ask for approval. Stop until they answer.
6. **Hand over** — once approved, save the spec in the artifact directory and continue with `/build <path to the spec>`.

Where a skill halts for a typed command, stop, say in plain words what comes next, and take the user's plain-text answer as that command.

Write no implementation code in this command.
