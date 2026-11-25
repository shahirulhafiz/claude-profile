---
description: Build route. Implements a spec the user has approved, using worker agents, then tests and reviews it.
argument-hint: <path to the approved spec>
---

Implement: $ARGUMENTS

Before anything else, confirm the user approved this spec. If you cannot tell, ask; do not build from an unapproved draft.

Before the first edit, note the starting commit and any uncommitted changes. Leave the user's existing changes as they are: no stash, reset, restore, clean or commit of them.

You are the orchestrator: you brief the workers and check their results, they do the work. Give each worker the spec path, the files or area it owns, the constraints, and what done looks like.

1. **Implement** — use the project's own developer agents in `.claude/agents/` when it has ones that fit the work; otherwise use general workers. Run workers in parallel only when they touch different files. For a change of a file or two, make it yourself.
2. **Test** — add or update tests for the change, following the project's test conventions (a `test-author` agent if the project has one). Then run the project's own checks: the ones its README, `CLAUDE.md` or package scripts name (tests, type check, lint, build). Report their real output.
3. **Review** — a fresh reviewer (the project's `code-reviewer` agent if it has one) judges the diff against the spec, without this conversation. On REVISE, fix and review again, at most 3 rounds; after that, stop and report what is still open.
4. **Drift check** — `egm-drift-report` on the designs folder, to confirm the code matches the spec. The `Skill` tool refuses EGM skills: open `~/.claude/plugins/cache/egm/egm/<version>/skills/egm-drift-report/SKILL.md` (highest version folder) and follow it. If the build had to depart from the spec, update the spec and say so.
5. **Report** — what changed, the real output of the checks, and anything not done.
