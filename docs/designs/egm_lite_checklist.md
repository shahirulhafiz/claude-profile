# Checklist: put the Elephant-Goldfish (EGM) setup in the profile

**Task.** The "route first" way of working exists on one machine only. A
second machine set up from this repo has neither the EGM plugin nor the rule
that uses it, so the smaller review panel cannot be applied there. Add the
whole EGM setup to the profile, so the setup prompt installs it.

The setup on the first machine is four pieces. None is in the repo today:

1. The plugin `egm@egm` (version 0.1.1 here), from the GitHub repository
   `google/elephant-goldfish-model`.
2. The section `# Making changes: route first (Elephant-Goldfish)` at the end
   of `~/.claude/CLAUDE.md` (22 lines). It holds the review panel.
3. Three commands in `~/.claude/commands/`: `route.md` (40 lines),
   `design.md` (21) and `build.md` (18).
4. The plugin switched on in `~/.claude/settings.json` (`enabledPlugins`
   and `extraKnownMarketplaces`). `[⏳ ACK]` The install commands are taken
   to write this themselves, so the profile does not carry it. The result
   is visible in the settings file here, but not which command wrote it;
   the first deferred test below settles it.

**Decision recorded.** The README change log (third change of 2026-11-25)
says the panel is "not part of the profile". The user reversed that on
2026-11-25 by asking for the EGM setup to be included in the repo.

**Baseline.** Commit `57ba9b3`, clean working tree. The one change before
this task's first edit is a rename: the previous checklist is kept as
[2026-11-25-lean-workers-checklist.md](2026-11-25-lean-workers-checklist.md).

**Spec review.** A cold review by the `reviewer` type on 2026-11-25 raised
seven points (two P1, three P2, two P3) and no blocker. All seven were
accepted and are worked into the items below. The user approved the build
on 2026-11-25 without a second spec review.

## Repo changes

- [x] Edit [profile/CLAUDE.md](../../profile/CLAUDE.md). Append the section
  `# Making changes: route first (Elephant-Goldfish)` exactly as it stands in
  `~/.claude/CLAUDE.md` (lines 120 to 141). After the edit the two files
  differ in line endings at most.
- [x] Create `profile/commands/route.md`, `profile/commands/design.md` and
  `profile/commands/build.md` as exact copies of the three files in
  `~/.claude/commands/`. Do not copy `design.md.bak-20261125-1004`.
- [x] Edit [build-prompt.mjs](../../build-prompt.mjs), list `parts`. Add the
  three commands after the two skills and before the hooks, with
  destinations `<CLAUDE>/commands/<name>.md` and language `markdown`. That
  makes 15 files: commands are Files 12 to 14, hooks become File 15.
- [x] Edit [build-prompt.mjs](../../build-prompt.mjs), the instructions.
  - Renumber the hooks step to File 15, in its heading and its one bullet
    ("File 12 has three lists").
  - Add a step "Files 12 to 14, commands": write them to
    `<CLAUDE>/commands/` as `route.md`, `design.md` and `build.md`. Create
    the folder if it is missing. If a file of the same name is there and
    differs, back it up first, write the new one, and tell the user.
  - Add a last step "The Elephant-Goldfish plugin". It runs only what is
    missing, and shows what each command printed:
    - `claude plugin list`. If it names `egm@egm` as enabled, nothing to do.
    - If it names `egm@egm` but not as enabled, run
      `claude plugin enable egm@egm`.
    - Otherwise run `claude plugin marketplace list`. If no marketplace
      `egm` is there, run
      `claude plugin marketplace add google/elephant-goldfish-model`.
      Then run `claude plugin install egm@egm`.
    - If the `claude` command is not found, or the add, install or enable
      fails, do not retry in a loop: finish the other steps, then report
      the plugin as not installed, with the two commands for the user to
      run, the note that they need git and access to github.com, and the
      note that every change request will stop at the route until the
      plugin is installed.
  - The step also says the plugin is downloaded from GitHub and is not part
    of this message, so the user knows what is fetched.
  - `[⚠️ UNVERIFIED]` That the install needs git as well as network access
    to github.com. Likely for a GitHub marketplace, not confirmed. The
    prompt does not stop when git is missing; it names git in the fallback.
- [x] Edit [build-prompt.mjs](../../build-prompt.mjs), the checks.
  - Each of the three files in `<CLAUDE>/commands/` starts with a `---`
    block that has `description`.
  - `<CLAUDE>/plugins/cache/egm/egm/` has a version folder, and its
    `skills/` holds `egm-lite`, `egm-brainstorm`, `egm-draft`,
    `egm-review`, `egm-resolve`, `egm-drift-report` and `egm-bootstrap`
    (the seven the commands call). Report the version found.
  - `claude plugin list` shows `egm@egm` as enabled. Report that status
    with the version. The folder alone proves nothing: it can be left over
    from an uninstall.
  - If the plugin step fell back, report these two plugin checks as
    skipped (plugin not installed), not as failed, and do not try to
    repair them.
  - The closing line names the commands and the plugin among the things
    that load at session start.
- [x] Run `node build-prompt.mjs` to regenerate `SETUP-PROMPT.md`.
- [x] Edit [README.md](../../README.md):
  - a "What you get" row for routed changes;
  - a short section "Routing changes" in "How it works": what the route
    does, the three commands, the plugin and where it comes from, the
    smaller panel with a link to
    [2026-11-25-review-panel-checklist.md](2026-11-25-review-panel-checklist.md);
  - three rows in the file table for the commands, and one line under it
    saying the plugin is installed by the setup prompt, not stored here;
  - "Set up a machine" and "Change the profile" mention the commands and
    the plugin; the "Needs" line of "Set up a machine" adds git and access
    to github.com, for the plugin;
  - "Not verified" rows for the two open tests below;
  - "By design": the setup prompt now downloads one thing, the plugin;
  - a change log entry (fifth change of 2026-11-25) stating "15 files" and
    that it reverses the "not part of the profile" line of the third
    change. Leave the third entry as written, with one repair: its file
    name `egm_lite_checklist.md` becomes
    `2026-11-25-review-panel-checklist.md`, because the old name now holds
    this checklist. That corrects a path, not what the entry says happened.

## Tests in the repo

- [x] `profile/CLAUDE.md` equals `~/.claude/CLAUDE.md`, and each file in
  `profile/commands/` equals its file in `~/.claude/commands/`, ignoring
  line endings.
- [x] `node build-prompt.mjs` reports 15 files, and no file contains the
  six-tilde fence (the script stops if one does).
- [x] `SETUP-PROMPT.md` has headings File 1 to File 15, and every file
  number named in the steps matches the heading of that file.
- [x] The plugin commands in the prompt are right. Their shape matches
  `claude plugin --help` and `claude plugin marketplace --help` (`list`,
  `enable`, `install`, `marketplace list`, `marketplace add`). The source
  and the plugin id match this machine's records:
  `~/.claude/plugins/known_marketplaces.json` (`egm` is GitHub
  `google/elephant-goldfish-model`) and `claude plugin list` (`egm@egm`).
  The add and install commands are the same text as at the end of
  `profile/commands/route.md`.

## Diff review fix (cold review by the `reviewer` type, 2026-11-25)

The review raised one point (P2) and confirmed the rest.

- [x] Setup prompt, plugin step: the fallback now names the command that
  failed. If the enable failed, it gives `claude plugin enable egm@egm`.
  If the add or the install failed, or `claude` was not found, it gives
  the two install commands. Before, a failed enable was answered with the
  install commands, which do not switch on an installed plugin.
  `SETUP-PROMPT.md` rebuilt.

## Install on this machine

Nothing to install. The four pieces are already here and are the source of
the repo copies. No file under `~/.claude/` is changed by this task.

## Deferred empirical tests

- [ ] `[⏳ ACK]` On the second machine, the new setup prompt installs the
  plugin by itself. Confirmed here only that both commands exist in the
  command line tool (`claude plugin --help`, 2026-11-25). Whether they run
  cleanly from inside a setup session, and without a prompt the session
  cannot answer, shows on the first real run. If they do not, the prompt's
  fallback applies: it reports the two commands for the user to run.
- [ ] `[⏳ ACK]` On the second machine, in a new session after setup, a
  plain-text change request starts the route, and the agent list holds the
  eight EGM agents the panel names: `egm:egm-zoom-out`,
  `egm:egm-inventive-catalyst`, `egm:egm-codebase-details`,
  `egm:egm-comprehension`, `egm:egm-design`, `egm:egm-style`,
  `egm:egm-implementation-readiness` and `egm:egm-synthesizer`.

## Risks

- The setup prompt now downloads third-party code. Until now it wrote only
  files it carried. Accepted by the user's request; the step says so.
- The plugin version is not pinned. A later version could rename a skill or
  an agent that the commands or the panel name. The check of the seven
  skill folders catches a renamed skill at setup; a renamed agent shows
  only in a session. Accepted, no pin.
- Without the plugin, the "route first" rule stops every change request on
  that machine. The fallback text tells the user this and how to fix it.
- A machine with no network, or no access to GitHub, cannot install the
  plugin. Same fallback.
- The commands point at `~/.claude/plugins/cache/egm/egm/<version>/`. If a
  later Claude Code version stores plugins elsewhere, the commands and the
  setup check both fail in the open, with "the plugin is not installed".

## Out of scope (agreed)

- Pinning the plugin to version 0.1.1.
- Carrying `enabledPlugins` or `extraKnownMarketplaces` in
  `profile/settings.hooks.json`. The install command writes them.
- The other plugins and skills on this machine (brag, caveman, hyperframes
  and the rest).
- Changing the wording of the route section or the three commands.
- Committing. The user commits when they choose.

---

### 🔍 Assumption Lifecycle Legend:

- `[⚠️ UNVERIFIED]`: Siloed external contract. Requires indisputable evidence
  to verify.
- `[⏳ ACK]`: Acknowledged assumption. Factual evidence unavailable; risk
  accepted and opaque-box empirical test strictly scheduled.
