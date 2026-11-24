---
name: sweep
description: Find outdated notes in the current project that could mislead Claude (TODOs in the code, plans and tickets in specs/, lines in CLAUDE.md and rules files, memory files), prove each one against the real app and the git history with a fresh subagent, then show a list of what to archive, update or cut and change nothing until the user says yes. Use when the user says "/sweep", "sweep the project", "clean up stale notes", "find outdated plans or TODOs", or "check the ticket statuses".
---

# Sweep

Find things in this project that are out of date and could confuse you later. Prove each one. Propose. Change nothing until the user says yes.

"The app" means the project as it really is: the code, its behaviour when run, and the git history.

## Rules

- Proof or leave it alone. An item is outdated only when the app or the git history shows it. "Looks old" is not proof. If the check is unclear, the item stays and goes in the "could not prove" list.
- A plan or ticket marked "in progress" is where the app is going. A mismatch with the app does not make it outdated. Only report it if the app shows the work is finished (status should be done) or was abandoned (git shows it reverted or replaced).
- No edits, moves, deletes or commits before the user's yes. The yes covers only the items shown in the list.
- Never read anything inside `archive/`. If a read there is refused, that is the intended block: do not work around it.

## Step 1: Collect candidates

Do this yourself. Only list; do not judge yet. Skip `archive/`, `node_modules/`, build output and vendored code.

1. Code notes: `TODO`, `FIXME`, `HACK`, `XXX` and "temporary" comments. Record file, line and text.
2. Plans: `specs/prd.md`, everything in `specs/tickets/`, and other plan files in `specs/`. For each ticket record its status line (`Status: not started | in progress | done`). A ticket with no status line is a candidate for "update".
3. Instructions: each rule or factual line in the project `CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/*.md`, and nested `CLAUDE.md` files. Include the user's global `~/.claude/CLAUDE.md` only for lines that name this project.
4. Memory: every file in the project's `memory/` folder (OKF files, listed in `memory/index.md`), and every file in the built-in memory folder, plus its `MEMORY.md`. Record the OKF keys when present (top level in `memory/`, under `metadata` in the built-in folder): `status`, `stale_after`, `generated.at`, `verified`, `superseded_by`, `sources`.

Memory candidates worth a check: `stale_after` in the past, `status: deprecated`, `status: draft` older than 30 days, no `verified` entry at or after `generated.at`, a named file, function, flag, URL or server, or an index line in `MEMORY.md` with no file behind it (and the reverse).

## Step 2: Verify with a fresh subagent

Start a separate subagent for the checking, so it starts without your assumptions. Use more than one in parallel only when there are many candidates (roughly one per source type). Model: sonnet; opus when the app is large or the claims are subtle.

Give the subagent only:

- the candidate list as neutral claims ("ticket 07 says Status: in progress", "CLAUDE.md line 14 says tests run with `npm test`"),
- the project path,
- this instruction: do not read `archive/`; change nothing; for each claim, check the code, run or read what is needed, and check `git log` / `git blame` / `git log -S`; answer with one of `still true`, `outdated`, `cannot tell`, plus the evidence (file and line, command output, or commit hash and date).

Do not tell it which items you suspect. Do not pass your own conclusions.

What counts as proof:

| Item | Outdated when |
| --- | --- |
| TODO / FIXME | The thing it asks for exists in the code, or the code it refers to is gone. Cite the commit. |
| Ticket status | The app disagrees: "not started" but the feature is built, "done" but acceptance points are missing, "in progress" but everything is built. |
| Plan or PRD section | The app took a different route and a commit shows it was deliberate, or the section is fully built. |
| CLAUDE.md / rule line | It names a file, command, path, tool or convention that the app no longer has or follows. |
| Memory | The app or git contradicts it, its replacement exists, or the thing it names is gone. A past `stale_after` alone means "check again", not "false". |

More proof rules:

- A ticket is done only when its Goal and every "Done when" point are met in the app. If the points are met but the Goal is only partly met, it is not done: propose `Status: in progress` and say what is missing.
- A line that names something that never existed (a file a scaffold mentions but nobody has written yet) is not outdated. Leave it alone.
- A candidate file that does not exist is skipped, not reported.
- Verifying means reading and running read-only commands. Do not run anything that starts a server, writes files, deploys or calls an outside service.

Read the subagent's evidence yourself before you accept it. Spot-check anything that would lead to a cut. Every `cannot tell` stays out of the table and goes in the "could not prove" list.

If you cannot start a subagent in this session, say so in your reply and do the verification yourself by the same rules.

## Step 3: Show the list and stop

Show one table, grouped by action, then stop and wait.

| # | Action | Item | Where | Why (evidence) |
| --- | --- | --- | --- | --- |

- **Archive**: a whole file that is finished or replaced but worth keeping (a done ticket, a replaced plan, a deprecated memory).
- **Update**: the item stays but a line is wrong (a ticket status, a command in CLAUDE.md, a memory fact). Show the old text and the new text.
- **Cut**: a line with no value left (a TODO that is done, a rule about a removed tool).

After the table add: "Could not prove, left alone" (short list), and the question: which numbers to apply (all, some, none).

## Step 4: Apply, only after the yes

Apply only the approved numbers.

1. Archive: first make any edit the file needs (a ticket's status line, a memory's `status: deprecated`), because you cannot read or edit it after the move. One row in the table covers both the edit and the move. Then move the file to `archive/<original path>` at the project root, with `git mv` in a git repository. Append one table row to `archive/INDEX.md` without reading the file, in exactly this form, starting on a new line: `| YYYY-MM-DD | <original path> | <one-line reason> |`.
2. Block the archive: in the project's `.claude/settings.json`, make sure `"Read(./archive/**)"` is in `permissions.deny` (create the file or the keys if missing; keep everything else). If it is already there, change nothing. Tell the user only when you added it.
   - To show what changed afterwards without reading the archive, use `git status --short` and `git diff -- . ":!archive"`.
3. Update: make the edit shown in the table. For a ticket, set the status line. For a memory, change the fact, set `generated.at` to now and add a `verified` entry for the check (`by: claude-code/<model-id>`). For a memory that is replaced, set `status: deprecated` and `superseded_by` before archiving it; when nothing replaces it, set `status: deprecated` only. Remove its line from the index (`memory/index.md` or `MEMORY.md`) if it has one.
4. Cut: remove the line. Nothing else in the file changes.
5. A file from the project's `memory/` folder is archived like any other file: remove its line from `memory/index.md` and add a `**Deprecation**` line to `memory/log.md`. The built-in memory folder is outside the repository: archive its files to an `archive/` folder inside it instead, and never read that folder either.
6. Do not commit unless the user asked. If they did, make one commit that lists the items by number.

Finish with what was archived, updated and cut, what was skipped, and anything that failed.
