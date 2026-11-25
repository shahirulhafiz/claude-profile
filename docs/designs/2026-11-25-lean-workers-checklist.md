# Checklist: lean worker agent types

**Task.** Every worker pays its own starting context. Measured on this
machine over the sessions since 2026-11-20: a `general-purpose` worker starts
at about 66K tokens (52 runs), `Explore` at 49K, while workers defined with a
short tool list start at 5 to 11K (about 160 reviewer runs and 4
project-defined workers). Add three lean worker types to the profile and a
rule to prefer them.

**Baseline.** Commit `62d5694`, clean working tree. The one change before
this task's first edit is a rename: the previous checklist is kept as
[2026-11-25-review-panel-checklist.md](2026-11-25-review-panel-checklist.md).

## Repo changes

- [x] Create `profile/agents/reader.md`. Frontmatter: `name: reader`; a
  description that says it finds and reads code or documents and reports
  conclusions with file and line; `tools: Read, Grep, Glob`; `model: haiku`.
  Body, a few lines: answer the question asked, cite file and line, report
  conclusions not file dumps, say what was not found, change nothing.
- [x] Create `profile/agents/builder.md`. `name: builder`; description: makes
  a scoped change to files from a brief or an approved checklist and runs
  the tests; `tools: Read, Edit, Write, Bash, Grep, Glob`; `model: sonnet`.
  Body: stay inside the files and scope in the brief, run the named tests,
  do not commit or push, report what changed, the test result and anything
  left undone.
- [x] Create `profile/agents/reviewer.md`. `name: reviewer`; description:
  checks a finished change or a draft with no knowledge of how it was made;
  `tools: Read, Grep, Glob, Bash`; `disallowedTools: Edit, Write`;
  `model: opus`. Body: read-only, use the shell only to inspect and to run
  tests, report findings by severity with file and line, say plainly when
  there are none.
- [x] Edit `# Subagents` in [profile/CLAUDE.md](../../profile/CLAUDE.md). Add:
  use the leanest agent type that can do the job: `reader` to find and read,
  `builder` to change files, `reviewer` to check a change. Use
  `general-purpose` only when the task needs what those lack (the web, a
  connector, or workers of its own): it starts with about six times as much
  context. The model on the call still follows the Models rule; the type's
  own model is only a fallback.
- [x] Edit [build-prompt.mjs](../../build-prompt.mjs). Add the three files to
  `parts` after the scripts, with destinations `<CLAUDE>/agents/<name>.md`
  (12 files in all; skills and hooks renumbered). Add an install step:
  write them to `<CLAUDE>/agents/`, creating the folder; if an agent file of
  the same name exists and differs, back it up first as the general rule
  says, and tell the user. Update the file numbers in the other steps.
- [x] Run `node build-prompt.mjs` to regenerate `SETUP-PROMPT.md`.
- [x] Edit [README.md](../../README.md): a "What you get" row; a rule bullet
  and a short section "Lean workers" in "How it works" with the measured
  figures; the file table (three rows); "Change the profile" and the setup
  step mention the agents; "Not verified" rows for the live tests below; a
  change log entry (fourth change of 2026-11-25) stating "12 files".

## Tests in the repo

- [x] Each agent file has frontmatter with `name`, `description`, `tools` and
  `model`, and the `name` matches the file name.
- [x] `SETUP-PROMPT.md` embeds all three files and the current
  `profile/CLAUDE.md`; file numbers in the steps match the headings.

## Install on this machine (approved by the user, 2026-11-25)

- [x] Create `~/.claude/agents/` (it does not exist today) and copy the three
  files. No existing file is overwritten.
- [x] Backup `CLAUDE.md.bak-20261125-1013`; the `# Subagents` section now
  matches the repo, and the two new bullets are the only difference from
  the backup.
- [x] The installed files are identical to the repo copies.

## Diff review fixes (cold review by the `reviewer` type, 2026-11-25)

- [x] Rule: the bullet now says what each type lacks. `reader` has no
  shell; `reviewer` also takes read-only jobs that need git or a command;
  `builder` takes jobs that change files or run commands that write; a
  skill is added to the cases for `general-purpose`. Before, the rule would
  have sent the `/sweep` checker (which needs git) to `reader`, and left
  the `/dream` worker (which runs a script and writes a file) with no type.
- [x] Setup prompt: its closing line now names the worker types among the
  things that load at session start.
- [x] Applied to the repo and to this machine; `SETUP-PROMPT.md` rebuilt.

## Deferred empirical tests

Tried first in the session that installed them, on 2026-11-25: all three
calls were refused with "Agent type not found". That session was offered the
types some minutes later, so they do load into a running session, with a
delay. The tests were then run in a new session.

- [x] The three types are available as `reader`, `builder` and
  `reviewer`. A new session listed all three and started each one.
- [x] Each starts with far less context. First request, read from each
  worker's transcript: `reader` 9,302 tokens, `reviewer` 11,120,
  `builder` 11,622. The ten `general-purpose` workers run the same day
  started at 66,318 to 69,941.
- [x] Each did its task: the reader found `DEFAULT_WARN_TOKENS = 250000`
  at `context-check.mjs:16`; the builder created and printed a file in the
  temp folder (deleted afterwards); the reviewer checked a file and ran
  `git status` (7 lines, which matches the working tree at that time).
- [ ] `[⚠️ UNVERIFIED]` `disallowedTools` keeps the reviewer from editing.
  It reported the tools Read, Grep, Glob and Bash and no Edit or Write, but
  it also said other tools could be loaded on demand, and it was not asked
  to try an edit. README "Not verified" row 8.
- [ ] `[⏳ ACK]` Whether the lean types can do every job the general-purpose
  worker did, and whether sessions choose them, shows only over real use.
  README "Not verified" row 9.

## Risks

- A lean worker cannot use the web, connectors, skills or start its own
  workers. Accepted; the rule keeps `general-purpose` for those cases.
- The reviewer has a shell, so "read-only" rests on its instructions plus
  `disallowedTools` for the edit tools. Accepted.
- The model hook still requires a model on every call, although each type
  names one. Accepted, as in the model-check change.
- A project may define its own agent with the same name; the project's
  definition is then expected to win. Not tested.

## Out of scope (agreed)

- Moving the Hyperframes and media-use skills out of the global folder.
- Turning connectors off per project.
- Changing the `dream` and `sweep` skills to name these types.
- Committing. The user commits when they choose.

---

### 🔍 Assumption Lifecycle Legend:

- `[⚠️ UNVERIFIED]`: Siloed external contract. Requires indisputable evidence
  to verify.
- `[⏳ ACK]`: Acknowledged assumption. Factual evidence unavailable; risk
  accepted and opaque-box empirical test strictly scheduled.
