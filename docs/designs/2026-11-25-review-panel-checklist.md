# Checklist: a smaller EGM review panel on this machine

**Task.** One design's reviews took 7 rounds and about 20 reviewer runs. An
audit of two reviewed designs (2026-11-25) showed which reviewers repeated
the others. Cut only those, on this machine, without touching the EGM
plugin's files or the profile repo.

**Baseline.** Profile repo at commit `d9df913`, clean. The one change before
this task's first edit is a rename: the previous checklist is kept as
[2026-11-25-session-size-checklist.md](2026-11-25-session-size-checklist.md).
The files this task edits are outside the repo, in `~/.claude`.

## Evidence the cuts rest on

From the audit (counts approximate):

- Second zoom-out (stage 8): no new action item on either design.
- Structural reviewer: 27 findings, none unique. Its most useful finding was
  a missing Risks section.
- Style reviewer: 68 findings, none unique, and it ran twice per design.
- Brainstorm review: seven reviewers repeated the same headline objections.
- Re-audit: three reviewers raised the same eight findings. It also found 2
  new blockers, so the re-audit itself stays.
- Readiness and codebase found the blockers; zoom-out, inventive,
  comprehension and design each had unique accepted findings. All stay.

## Changes

- [x] Backups: `CLAUDE.md.bak-20261125-1004` and
  `commands/design.md.bak-20261125-1004`.
- [x] Edit the section `# Making changes: route first (Elephant-Goldfish)`
  in `~/.claude/CLAUDE.md`. Add one bullet with a nested list, after the
  bullet about models:

  > - Review panel. Where an EGM skill lists its reviewers, use this smaller
  >   panel instead. It comes from an audit of two reviewed designs on
  >   2026-11-25: the reviewers left out raised nothing the others did not.
  >   - Brainstorm review: `egm:egm-zoom-out`, `egm:egm-inventive-catalyst`,
  >     `egm:egm-codebase-details`.
  >   - Stage 5 (zoom out): `egm:egm-zoom-out`, `egm:egm-inventive-catalyst`.
  >   - Stage 6 (comprehension): `egm:egm-comprehension`, called directly.
  >   - Stage 7 (critic): `egm:egm-design`, `egm:egm-style`. No structural
  >     reviewer. Check yourself that the draft has a Risks section and that
  >     each rejected option says who rejected it.
  >   - Stage 8 (second zoom out): skip it. Go from stage 7 to stage 9.
  >   - Stage 9 (readiness): `egm:egm-implementation-readiness`,
  >     `egm:egm-codebase-details`. No second style run.
  >   - A re-audit uses that stage's reviewers from this list, without style.
  >   - One synthesizer per round. For a single reviewer, call it directly.
  >   - If I ask for the full panel, use the skill's own list.

- [ ] Not done, on purpose: shortening the models bullet. It still lists
  `egm:egm-structural` under sonnet, so that a review run with the full
  panel does not put that reviewer on opus. The bullet is unchanged.
- [x] Edit `~/.claude/commands/design.md`, step 3 (Review): add one sentence,
  "Use the review panel from the Elephant-Goldfish section of the global
  `CLAUDE.md`, not the skill's full list; the same goes for the brainstorm review in
  step 1."
- [x] No change to `~/.claude/commands/route.md` or `build.md`: neither lists
  reviewers. The route's "Review" row runs `egm-review` directly, which is
  why the panel lives in `CLAUDE.md`, loaded in every session.

## Checks

- [x] The diff of each edited file against its backup shows only the changes
  above.
- [x] Every agent name in the new text exists in the plugin
  (`~/.claude/plugins/cache/egm/egm/0.1.1/agents/`), with the `egm:` prefix.
- [x] The stage numbers and names match
  `skills/egm-review/SKILL.md` lines 287-303 in the installed plugin.

## Deferred empirical tests

- [ ] `[⏳ ACK]` Whether a session follows this panel over the skill's own
  reviewer list can only be seen on the next real design review. Check then
  which agents were started, and that stage 8 was skipped.
- [ ] `[⏳ ACK]` Whether quality holds. After the next two reviewed designs,
  repeat the audit: did a build or a later round find something the dropped
  reviewers would have caught?

## Risks

- A plugin update may renumber or rename stages. The text names each stage
  as well as numbering it, and the check above pins the version read.
- The audit covered two designs from one project. Accepted; the second
  deferred test is the guard.
- The skill offers "proceed to Stage 8" in its own prompts. The session must
  follow the override. Accepted; covered by the first deferred test.

## Out of scope (agreed)

- The EGM plugin's files, and the profile repo's `profile/` folder.
- Limiting what reviewers may read. Their own reading of the code is what
  found the blockers.
- Narrowing the re-audit to fixes only.
- Changing which requests take the full design route.

---

### 🔍 Assumption Lifecycle Legend:

- `[⚠️ UNVERIFIED]`: Siloed external contract. Requires indisputable evidence
  to verify.
- `[⏳ ACK]`: Acknowledged assumption. Factual evidence unavailable; risk
  accepted and opaque-box empirical test strictly scheduled.
