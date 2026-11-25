# Checklist: keeping the main session small

**Task.** In one measured session the main conversation grew from 94K to 829K
tokens with no reset: the conductor read, wrote and built everything itself,
and the session was resumed after a 94-minute break at 453K. Add rules that
keep the session small, and a hook that warns when it is large or when a long
session is resumed after a break.

**Baseline.** Commit `1c9a81e`, clean working tree. The one change before
this task's first edit is a rename: the previous checklist is kept as
[2026-11-25-model-check-checklist.md](2026-11-25-model-check-checklist.md).

**Spec review.** One cold review on 2026-11-25: seven findings. Six are
folded in below; one was contested and accepted by the user (see the end).

## Repo changes

- [x] Edit [profile/CLAUDE.md](../../profile/CLAUDE.md):
  - `# How to work`: the "give tasks to workers" line now also covers reading
    or building that would fill the conversation, so it no longer contradicts
    the new section (spec review finding).
  - `# Subagents`: start one for parallel work or for reading or building
    that would fill the conversation; not for a lookup or one-step change.
  - New `# Keeping the session small` after it, with the approved wording,
    plus one line on the hook's "Context check" note.
- [x] Create `profile/scripts/context-check.mjs`, a `UserPromptSubmit` hook
  script.
  - Input: the hook's JSON on standard input; uses `transcript_path` only.
  - It reads the last 2 MB of that file. If the read did not start at the
    beginning of the file, the first (cut-off) line is dropped. It scans the
    lines backwards for the newest usable entry. If there is none and the
    file is bigger, it reads the last 32 MB once and scans again.
  - Usable entry: `type` is `assistant`, not `isSidechain`, `message.model`
    is not `<synthetic>`, and the usage sum is above 0.
  - Context size = `input_tokens` + `cache_creation_input_tokens` +
    `cache_read_input_tokens`. Idle time = whole minutes since the entry's
    `timestamp`; a missing or unreadable time, or one in the future, counts
    as 0, which suppresses only the resume line.
  - Threshold: `CONTEXT_WARN_TOKENS`, default 250000; a value that is not a
    positive number falls back to the default.
  - Output, at most one line starting `Context check:`:
    - size at or above 60% of the threshold and idle for more than 60
      minutes: the "resume" line (it wins when the size is also over the
      threshold);
    - else size at or above the threshold: the "large" line;
    - otherwise nothing.
  - Always exits 0. Any fault prints nothing.
- [x] Edit [profile/settings.hooks.json](../../profile/settings.hooks.json):
  a `UserPromptSubmit` entry (no matcher) running the script, timeout 10.
- [x] Edit [build-prompt.mjs](../../build-prompt.mjs): the script is File 6
  (skills 7 and 8, hooks File 9); five scripts; the hooks step covers three
  lists and four commands; one piped check of the new script.
- [x] Run `node build-prompt.mjs`: `SETUP-PROMPT.md` now holds 9 files.
- [x] Edit [README.md](../../README.md): "What you get" row; a rule bullet
  and the section "Keeping the session small"; "five scripts" in two places;
  the `CONTEXT_WARN_TOKENS` row; the file table; "Verified" row 16; "Not
  verified" rows 6 to 8; a "By design" line; a second 2026-11-25 change log
  entry that states "9 files (five scripts)".

## Tests in the repo

- [x] `node --check profile/scripts/context-check.mjs` passes.
- [x] Pipe tests: 34 cases, all pass, all exit 0. They cover:
  - sizes: 300K, 100K, exactly 250000, 249999
  - resume: 200K at 2 hours, at 1 minute, at exactly 60 minutes (nothing),
    at 62 minutes; exactly 150000 and 149999 at 2 hours; 300K at 2 hours
    and 453K at 94 minutes (the measured case) give the "resume" line; 300K
    at exactly 60 minutes gives the "large" line
  - times: missing, unreadable, in the future (no resume line); 300K with no
    time still gives the "large" line
  - entries: a newer sidechain entry, a newer `<synthetic>` entry and a
    newer zero-usage entry are skipped; an invalid last line is skipped; no
    assistant entry gives nothing
  - big lines: a 3 MB line after the entry (second read), a tail that starts
    mid-line, and a transcript that is only a 3 MB line
  - threshold: `100000`, `abc` and `-5`
  - input: `transcript_path` missing, not a string, pointing to no file;
    empty input, invalid JSON, `null`
- [x] One run against a real 15 MB transcript: 0.3 seconds, 834K tokens,
  which matches that session's measured peak.
- [x] `profile/settings.hooks.json` parses.
- [x] `SETUP-PROMPT.md` holds the new script (File 6) and the
  `UserPromptSubmit` entry (File 9).

## Install on this machine (approved by the user, 2026-11-25)

- [x] Backups: `settings.json.bak-20261125-0917`, `CLAUDE.md.bak-20261125-0917`.
- [x] Script copied to `~/.claude/scripts/`; identical to the repo copy.
- [x] `UserPromptSubmit` entry added to `~/.claude/settings.json` as its own
  entry after the existing one. That is the only difference from the backup,
  and the file parses.
- [x] `~/.claude/CLAUDE.md`: the sections from `# How to work` to
  `# Keeping the session small` are identical to the repo.
- [x] The installed script, run against this session's own transcript,
  printed the "large" line (about 293K tokens).

## Diff review fixes (cold review, 2026-11-25: three findings, all fixed)

- [x] Script: when a conversation is both large and idle for over an hour,
  the resume note wins. Before, the measured case (453K after 94 minutes)
  got the "at the next approval point" note.
- [x] Rule: the hook bullet names both cases. The large note waits for the
  next approval point; the idle note is mentioned straight away.
- [x] Rule: a phase ends where Claude already stops for the user. It does
  not stop anywhere else for this, the suggestion is a remark and not a
  question, and it is made only once a "Context check" note has appeared.
- [x] Applied to the repo and to this machine (script and rules identical),
  tests re-run, `SETUP-PROMPT.md` rebuilt, README updated.

## Deferred empirical tests

- [x] Text the hook prints reaches Claude as context, and the hook input
  carries a usable `transcript_path`. Seen on 2026-11-25 in the working
  session that installed it: the note arrived as `UserPromptSubmit hook
  success` output on each following message, at about 303K, 308K and 311K
  tokens. No temporary setting was needed, and the hook was picked up
  without a new session. README "Verified" row 17.
- [ ] `[⏳ ACK]` The resume line in a real session. Not tested live; see the
  contest below. README "Not verified" row 6.
- [ ] `[⏳ ACK]` Whether Claude acts on the note and the rules as written
  can only be seen over real use. README "Not verified" row 7.

## Risks

- The note is added on every message while the context is over the
  threshold. Accepted: it is one short line, and the rule says to mention it
  once. Tracking "already said" would need stored state.
- The hook cannot know the real cache lifetime. It uses 60 minutes. Accepted.
- The size comes from the last reply, so it lags by one turn. Accepted.
- Rules about delegating can cost quality if overdone, because a worker's
  report drops detail. The wording limits delegation to surveys and approved
  builds and keeps files about to be edited with the conductor.

## Accepted CONTEST rationales

- A live test of the resume line, or a test-only switch to fake the idle
  time (spec review finding). Not added. The resume line uses the same
  output path as the "large" line, its logic is covered by the pipe tests,
  and a test-only switch is extra code in a hook that should stay small.
  Accepted by the user on 2026-11-25; README "Not verified" row 7 records it.

## Out of scope (agreed)

- Blocking large or repeated reads with a hook: it would also block
  legitimate reads.
- Changing when Claude Code compacts by itself.
- The other cost suggestions (fewer review rounds, the main model, trimming
  connectors).
- Committing. The user commits when they choose.

---

### 🔍 Assumption Lifecycle Legend:

- `[⚠️ UNVERIFIED]`: Siloed external contract. Requires indisputable evidence
  to verify.
- `[⏳ ACK]`: Acknowledged assumption. Factual evidence unavailable; risk
  accepted and opaque-box empirical test strictly scheduled.
