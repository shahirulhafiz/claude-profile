# Checklist: every worker call names a model

**Task.** Workers (subagents) ran on the session's model whenever a call named
no model. Make the rule explicit and enforce it with a hook.

**Baseline.** Commit `7725e26`, clean working tree. Every change since then
belongs to this task.

**Spec review.** One cold review on 2026-11-25: six findings. Five are folded
in below; one part was contested and accepted by the user (see the end).

## Repo changes

- [x] Create `profile/scripts/require-agent-model.mjs`. A `PreToolUse` hook
  script. It reads the hook's JSON from standard input. If `tool_name` is
  `Agent` or `Task`, `tool_input` is an object, and
  `tool_input.subagent_type` is not `fork`, the call is blocked unless
  `tool_input.model` is a string with non-space characters. A blocked call
  prints one line to standard error and exits with code 2. Every other case,
  including a missing `tool_input`, unreadable input and any error inside the
  script, exits 0, so a fault in the hook never blocks work.
- [x] Edit [profile/settings.hooks.json](../../profile/settings.hooks.json).
  Add a `PreToolUse` entry with matcher `Agent|Task` that runs
  `node "<HOME>/.claude/scripts/require-agent-model.mjs"`, timeout 10.
- [x] Edit the `# Models` section of
  [profile/CLAUDE.md](../../profile/CLAUDE.md). Keep the three model lines.
  Add: every worker call names a model, including plugin agents; a call with
  no model runs on the session's model; tell a worker that starts its own
  workers which model to give them; a hook blocks calls that name none.
- [x] Edit [build-prompt.mjs](../../build-prompt.mjs). Add the script to
  `parts` (File 5; skills become 6 and 7, hooks File 8). Update the
  instruction text: scripts step, skills step, hooks step (two lists, three
  commands, update in place), four scripts in `node --check`, and one piped
  check of the installed script.
- [x] Run `node build-prompt.mjs` to regenerate `SETUP-PROMPT.md`.
- [x] Edit [README.md](../../README.md): "What you get" row, "four scripts"
  in the setup steps and in "Change the profile", the file table (new script
  row, new hooks wording), "Verified" row 13 for the piped tests, "Not
  verified" rows 6 and 7 for the two live tests, and a "By design" line on
  what the hook does and does not enforce.

## Tests in the repo

- [x] `node --check profile/scripts/require-agent-model.mjs` passes.
- [x] Pipe test, 11 cases, all pass:
  - blocked (exit 2): `Agent` with no model; blank model; `model: null`;
    `subagent_type: "Explore"` with no model; `Task` with no model
  - allowed (exit 0): `Agent` with `model: "sonnet"`; fork with no model;
    `Read`; `Agent` with no `tool_input`; empty input; invalid JSON
- [x] `profile/settings.hooks.json` parses as JSON.
- [x] `SETUP-PROMPT.md` holds the new script (File 5) and the `PreToolUse`
  entry (File 8).

## Install on this machine (approved by the user, 2026-11-25)

- [x] Back up `~/.claude/settings.json` and `~/.claude/CLAUDE.md` as
  `<name>.bak-20261125`.
- [x] Copy the script to `~/.claude/scripts/`; identical to the repo copy.
- [x] Add the `PreToolUse` entry to `~/.claude/settings.json` as its own
  entry. The only difference from the backup is that entry.
- [x] Replace the `# Models` section in `~/.claude/CLAUDE.md` with the repo
  version.
- [x] Add the EGM model line to this machine's own "Making changes: route
  first" section (not in the repo): sonnet for `egm:egm-style`,
  `egm:egm-structural`, `egm:egm-comprehension`; opus for
  `egm:egm-synthesizer` and the other reviewers; tell the synthesizer which
  model to give each reviewer.
- [x] `~/.claude/settings.json` still parses.
- [x] Run the exact installed command with a model-less `Agent` call piped
  in: exit 2 with the message.

## Diff review fixes (cold review, 2026-11-25: two findings, both fixed)

- [x] README: the "What you get" row and the "By design" line no longer state
  the hook's live behaviour as proven; they point to "Not verified" rows 6
  and 7.
- [x] This machine's EGM line names `egm:egm-bootstrap-orchestrator` (opus)
  and tells both it and the synthesizer which model to give their workers.

## Deferred empirical tests

Run on 2026-11-25 in a new session with the hook loaded. All pass.

- [x] A worker call with no model was blocked before any worker started,
  with the hook's message shown once. A call with `model: "haiku"` ran.
- [x] Claude Code reports the tool as `Agent`: the message was prefixed
  `PreToolUse:Agent hook error`, so the `Agent|Task` matcher fires.
- [x] The hook also fires for a call made by a worker: a worker started with
  a model tried to start its own worker with no model and was blocked with
  the same message.
- [x] README "Not verified" rows 6 and 7 moved to "Verified" rows 14 and 15,
  and the plain wording restored in "What you get" and "By design".

## Risks

- A blocked call costs one retried turn. Accepted.
- Agent types whose own definition names a model must also name one on the
  call. Accepted, to keep the script simple.
- `[⏳ ACK]` A hook that hangs is assumed to let the call through when its
  10-second timeout ends. Not tested; see the contest below.

## Accepted CONTEST rationales

- A timer that stops the script waiting for input (spec review finding).
  Not added. Claude Code closes the hook's input, the hook timeout bounds the
  worst case at 10 seconds, and a timer would mean asynchronous reading for a
  case that is not expected. Accepted by the user on 2026-11-25.

## Out of scope (agreed)

- Changing the EGM plugin's own files; they are overwritten on update.
- A default-subagent-model setting; it would force one model for all workers.
- The other cost suggestions (shorter sessions, fewer review rounds, main
  model, trimming connectors).
- Committing. The user commits when they choose.

---

### 🔍 Assumption Lifecycle Legend:

- `[⚠️ UNVERIFIED]`: Siloed external contract. Requires indisputable evidence
  to verify.
- `[⏳ ACK]`: Acknowledged assumption. Factual evidence unavailable; risk
  accepted and opaque-box empirical test strictly scheduled.
