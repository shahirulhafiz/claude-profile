# Setup prompt

Paste this whole file into Claude Code on the machine you want to set up. It needs no other file. (Generated from `profile/` by `build-prompt.mjs`; do not edit by hand.)

---

Set up my Claude profile on this machine. Everything you need is in this message: four files, each inside a block fenced with six tildes (`~~~~~~`). Write each file's content exactly as given, without the fence lines, with no rewording and nothing left out.

The target is my Claude config folder, `~/.claude` (on Windows `%USERPROFILE%\.claude`). Call it `<CLAUDE>` and my home folder `<HOME>`.

Before you change anything, check that `node --version` works. If Node.js is missing, stop and tell me: the hook needs it.

Never overwrite an existing file without saving a copy first, as `<name>.bak-YYYYMMDD` beside it.

1. **File 1, profile rules.** Compare it with `<CLAUDE>/CLAUDE.md`.
   - If the target does not exist, write File 1 there.
   - If it exists, merge by section (each `# Heading`): add sections that are missing, replace sections with the same heading by the version in File 1, and keep sections that exist only on this machine. Keep the order of File 1, with this machine's own sections at the end.
   - If a section on this machine differs from File 1 in a way that looks deliberate, show me both versions and ask which to keep before you replace it.

2. **File 2, scaffold script.** Write it to `<CLAUDE>/scripts/project-scaffold.mjs`.

3. **File 3, sweep skill.** Write it to `<CLAUDE>/skills/sweep/SKILL.md`.

4. **File 4, session-start hook.** Merge it into `<CLAUDE>/settings.json`.
   - Replace `<HOME>` in the command with this machine's real home folder, written with forward slashes (for example `C:/Users/name` or `/Users/name`).
   - Keep every other key in `settings.json` as it is. Create the file if it is missing.
   - If a `SessionStart` hook whose command contains `project-scaffold.mjs` is already there, update that one. Do not add a second.

Then check your work and report:

- `<CLAUDE>/settings.json` still parses as JSON.
- `node --check <CLAUDE>/scripts/project-scaffold.mjs` passes.
- Run the script by hand on a new empty folder in the system temp folder: `node <CLAUDE>/scripts/project-scaffold.mjs <that folder>`. It must create `CLAUDE.md`, `specs/prd.md`, `specs/tickets/README.md`, `memory/index.md`, `memory/log.md`, `memory/README.md`, `archive/INDEX.md` and `.claude/settings.json`. Delete the test folder afterwards.
- List what you created, what you merged, what you backed up, and anything you skipped.

Do not scaffold my existing projects on this machine, and do not commit or push anything. Tell me to start a new session afterwards, because the hook and the skill load at session start.

## File 1: <CLAUDE>/CLAUDE.md

~~~~~~markdown
# Notes, plans and the app

"The app" means the project as it really is: the code, its behaviour when run, and the git history.

- If notes, plans or instructions disagree with the app, follow the app and point out the mismatch in your reply. The exception is a plan marked "in progress": that's where the app is going, so follow the plan. When you finish a plan, change its status to done.
- Leave notes, TODOs and plans you weren't asked about alone. If you notice one that looks relevant, list it at the end of your reply instead of acting on it.
- When the user asks for a new feature that isn't a numbered ticket (`specs/tickets/NN-*`), compare it with the existing plans (`specs/prd.md`, `specs/tickets/`) first. Flag any overlap or conflict and ask whether they still want to go ahead before building.
- Every ticket in `specs/tickets/` carries a status line: `Status: not started`, `Status: in progress` or `Status: done`. Check the app before you set or change one.
- To find and clear outdated notes, plans, rules and memories, the user runs `/sweep`. Don't do that clean-up unasked.

# Project setup

A session-start hook (`~/.claude/scripts/project-scaffold.mjs`) sets up each new project root: `CLAUDE.md` with the rules above, `specs/prd.md`, `specs/tickets/`, a `memory/` folder (OKF v0.3) and an `archive/` folder that you are blocked from reading. It only creates what is missing, and skips a folder that already has `CLAUDE.md` or `AGENTS.md`. To set up such a folder by hand: `node ~/.claude/scripts/project-scaffold.mjs --update-claude-md <folder>`. To opt a project out, create `.claude/no-scaffold` in it.

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
Give tasks that can run at the same time to their own workers (subagents); do the rest yourself.

- Brief each worker fully: the goal, the files or area, and what done looks like. It knows only what you tell it.
- Run independent tasks in parallel.
- Check each worker's result before you report it as done.
- A quick question or a one-step change needs no worker: do it yourself.

# Models

Pick each worker's model by the task:

- Simple, clear tasks -> sonnet
- Harder tasks -> opus
- File search, logs -> haiku

# Subagents

- Each subagent adds to the session's cost.
- Only start one for work that can run at the same time.

# Finishing work

Please avoid stopping while you still owe work the user asked for. Be persistent and do not stop unless needed.

# Communicating clearly

Write for an intelligent but low-context reader. The person reading has not seen your tool calls, your reasoning or the files you opened, and may be switching in from other work.
~~~~~~

## File 2: <CLAUDE>/scripts/project-scaffold.mjs

~~~~~~javascript
#!/usr/bin/env node
// Sets up a project root for Claude: CLAUDE.md rules, specs/, an OKF memory/ folder,
// and an archive/ folder that Claude is blocked from reading.
//
// Two ways to run:
//   1. As a SessionStart hook (no arguments): reads the hook JSON on stdin, takes its "cwd",
//      and scaffolds it only if it looks like a project root (see isProjectRoot).
//   2. By hand: node project-scaffold.mjs [--update-claude-md] <folder> [<folder> ...]
//      Scaffolds exactly those folders. --update-claude-md also inserts the rules into an
//      existing CLAUDE.md, right after its first line. The hook never edits an existing CLAUDE.md.
//
// It only creates what is missing. It never overwrites a file.
// Opt out for one project: create an empty file .claude/no-scaffold in it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MARKER = '<!-- project-scaffold:rules -->';
const DENY_RULE = 'Read(./archive/**)';
const today = new Date().toISOString().slice(0, 10);

const rulesBlock = () => `${MARKER}
"The app" means this project as it really is: the code, its behaviour when run, and the git history.

- If notes, plans or instructions disagree with the app, follow the app and point out the mismatch in your reply. The exception is a plan marked "in progress": that's where the app is going, so follow the plan. When you finish a plan, change its status to done.
- Leave notes, TODOs and plans you weren't asked about alone. If you notice one that looks relevant, list it at the end of your reply instead of acting on it.
- When the user asks for a new feature that isn't a numbered ticket (\`specs/tickets/NN-*\`), compare it with the existing plans (\`specs/prd.md\`, \`specs/tickets/\`) first. Flag any overlap or conflict and ask whether they still want to go ahead before building.
- Every ticket in \`specs/tickets/\` carries a status line: \`Status: not started\`, \`Status: in progress\` or \`Status: done\`. Check the app before you set or change one.
- Project memories live in \`memory/\` as Open Knowledge Format (OKF v0.3) files. Read \`memory/index.md\` when you need project background. When you add or change one, update \`memory/index.md\` and add a line to \`memory/log.md\`.
- Never read anything in \`archive/\`. It holds outdated material that \`/sweep\` moved out of the way.
<!-- /project-scaffold:rules -->`;

const files = (name) => ({
  'specs/prd.md': `# ${name}: product requirements

Status: not started

Nothing is written here yet. Describe what the app must do, for whom, and what is out of scope.
`,
  'specs/tickets/README.md': `# Tickets

One file per ticket, named \`NN-short-name.md\` (for example \`01-login-page.md\`). This README is not a ticket.

Each ticket starts like this:

\`\`\`markdown
# NN: <title>

Status: not started

## Goal

## Done when
\`\`\`

The status line is one of \`Status: not started\`, \`Status: in progress\` or \`Status: done\`. It must match what the app really does.
`,
  'memory/index.md': `---
okf_version: "0.3"
title: "${name} project memory"
description: "What Claude and the team have learned about ${name} that the code does not say."
---

# Memories

No memories yet. Add one line per memory file: \`* [Title](file.md) - description\`.
`,
  'memory/log.md': `## ${today}

* **Creation**: Memory bundle created.
`,
  'memory/README.md': `---
type: Reference
title: How to write a memory in this folder
description: The frontmatter and rules for memory files in this OKF v0.3 bundle.
tags: [memory, okf]
resource: https://github.com/open-knowledge-format/open-knowledge-format
generated: { by: process:project-scaffold, at: ${today}T00:00:00Z }
status: stable
---

Each memory is one Markdown file holding one fact. \`index.md\` lists them; \`log.md\` records changes, newest day first.

\`\`\`markdown
---
type: Decision | Project Fact | Convention | Reference | Feedback
title: <human-readable title>
description: <one sentence>
tags: [<short>, <tags>]
resource: <URL or path of the thing described>      # only when there is one
sources:
  - id: <short-id>
    resource: <URL, file path, commit, or "conversation with <name>, YYYY-MM-DD">
generated: { by: claude-code/<model-id>, at: <date-time with offset> }
verified:
  - { by: human:<id>, at: <date-time> }             # only when a person stated or confirmed it
status: draft | stable | deprecated
stale_after: <date>                                 # only for facts that can go out of date
---

<the fact. Cite a source with a footnote: [^short-id]>
\`\`\`

- Only \`type\` is required by OKF; fill the rest when you know it.
- \`generated.at\` is the last real change to the content.
- A replaced memory stays: set \`status: deprecated\` and \`superseded_by: ./<new-file>.md\`. \`/sweep\` moves it to \`archive/\` after approval.
- Link other memories with plain Markdown links. OKF does not count \`[[wikilinks]]\`.
- Never put secrets, passwords or tokens here. This folder is meant to be committed.
`,
  'archive/INDEX.md': `# Archive

Outdated material moved here by \`/sweep\`. Claude is blocked from reading this folder (see \`.claude/settings.json\`).

| Date | Original path | Reason |
| --- | --- | --- |
`,
});

function isProjectRoot(dir) {
  const norm = (p) => path.resolve(p).toLowerCase();
  const d = norm(dir);
  const home = norm(os.homedir());
  if (d === home || path.parse(d).root === d) return 'home or drive root';
  const blocked = [path.join(home, '.claude'), path.join(home, 'AppData'), os.tmpdir(),
    process.env.SystemRoot || 'C:\\Windows', process.env.ProgramFiles || 'C:\\Program Files'];
  for (const b of blocked) {
    if (d === norm(b) || d.startsWith(norm(b) + path.sep)) return 'system, temp or Claude folder';
  }
  if (d.split(path.sep).includes('.claude')) return 'inside a .claude folder (worktree)';
  if (fs.existsSync(path.join(dir, '.claude', 'no-scaffold'))) return 'opted out';
  // "New project" for the hook means Claude has not been set up here yet.
  if (fs.existsSync(path.join(dir, 'CLAUDE.md')) || fs.existsSync(path.join(dir, 'AGENTS.md'))) return 'already has CLAUDE.md or AGENTS.md';
  const dotGit = path.join(dir, '.git');
  if (fs.existsSync(dotGit) && fs.statSync(dotGit).isFile()) return 'git worktree';
  for (let p = path.dirname(d); p !== path.dirname(p); p = path.dirname(p)) {
    if (fs.existsSync(path.join(p, '.git'))) return 'subfolder of a git repository';
  }
  return null;
}

function scaffold(dir, { updateClaudeMd }) {
  const name = path.basename(path.resolve(dir));
  const made = [];
  const skipped = [];

  // A folder that already exists and was not made by this script belongs to the project: leave it alone.
  const sentinel = { specs: 'specs/tickets/README.md', memory: 'memory/index.md', archive: 'archive/INDEX.md' };
  const foreign = new Set();
  for (const [top, file] of Object.entries(sentinel)) {
    if (fs.existsSync(path.join(dir, top)) && !fs.existsSync(path.join(dir, file))) {
      foreign.add(top);
      skipped.push(`${top}/ already exists with other content; left as it is`);
    }
  }

  for (const [rel, content] of Object.entries(files(name))) {
    if (foreign.has(rel.split('/')[0])) continue;
    const full = path.join(dir, rel);
    if (fs.existsSync(full)) continue;
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, { encoding: 'utf8', flag: 'wx' });
    made.push(rel);
  }

  const claudeMd = path.join(dir, 'CLAUDE.md');
  if (!fs.existsSync(claudeMd)) {
    fs.writeFileSync(claudeMd, `# ${name}\n\n${rulesBlock()}\n`, { encoding: 'utf8', flag: 'wx' });
    made.push('CLAUDE.md');
  } else {
    const text = fs.readFileSync(claudeMd, 'utf8');
    if (!text.includes(MARKER)) {
      if (updateClaudeMd) {
        const eol = text.includes('\r\n') ? '\r\n' : '\n';
        const i = text.indexOf('\n');
        const first = i === -1 ? text : text.slice(0, i + 1);
        const rest = i === -1 ? '' : text.slice(i + 1);
        const block = rulesBlock().split('\n').join(eol);
        const lead = first.endsWith('\n') ? '' : eol;
        fs.writeFileSync(claudeMd, `${first}${lead}${eol}${block}${eol}${rest.startsWith(eol) || rest === '' ? '' : eol}${rest}`, 'utf8');
        made.push('CLAUDE.md (rules inserted after the first line)');
      } else {
        skipped.push('CLAUDE.md exists without the rules; left as it is');
      }
    }
  }

  const settingsPath = path.join(dir, '.claude', 'settings.json');
  if (!foreign.has('archive')) try {
    let settings = {};
    let raw = null;
    if (fs.existsSync(settingsPath)) {
      raw = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(raw.replace(/^\uFEFF/, ''));
    }
    if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) throw new Error('not a JSON object');
    settings.permissions ??= {};
    const deny = Array.isArray(settings.permissions.deny) ? settings.permissions.deny : [];
    if (!deny.includes(DENY_RULE)) {
      settings.permissions.deny = [...deny, DENY_RULE];
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
      made.push(raw === null ? '.claude/settings.json (archive read block)' : '.claude/settings.json (archive read block added)');
    }
  } catch (e) {
    skipped.push(`.claude/settings.json could not be updated (${e.message}); archive/ is NOT blocked`);
  }

  return { made, skipped };
}

function report(dir, { made, skipped }) {
  if (made.length === 0 && skipped.length === 0) return;
  const lines = [`Project scaffold in ${dir}:`];
  if (made.length) lines.push(`  created: ${made.join(', ')}`);
  for (const s of skipped) lines.push(`  note: ${s}`);
  console.log(lines.join('\n'));
}

function main() {
  const args = process.argv.slice(2);
  const updateClaudeMd = args.includes('--update-claude-md');
  const dirs = args.filter((a) => !a.startsWith('--'));

  if (dirs.length > 0) {
    for (const dir of dirs) {
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) { console.log(`Skipped ${dir}: not a folder`); continue; }
      report(dir, scaffold(dir, { updateClaudeMd }));
    }
    return;
  }

  // Hook mode.
  let cwd = process.env.CLAUDE_PROJECT_DIR || '';
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
    if (input.cwd) cwd = input.cwd;
  } catch { /* no stdin: fall back to the environment variable */ }
  if (!cwd || !fs.existsSync(cwd)) return;
  if (isProjectRoot(cwd) !== null) return;
  const result = scaffold(cwd, { updateClaudeMd: false });
  if (result.made.length) {
    report(cwd, result);
    console.log('Tell the user once that these project files were created automatically.');
  }
}

try { main(); } catch (e) { console.log(`project-scaffold: ${e.message}`); }
process.exit(0);
~~~~~~

## File 3: <CLAUDE>/skills/sweep/SKILL.md

~~~~~~markdown
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

Read the subagent's evidence yourself before you accept it. Spot-check anything that would lead to a cut. Drop every `cannot tell`.

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

1. Archive: move the file to `archive/<original path>` at the project root. Use `git mv` in a git repository. Add a line to `archive/INDEX.md`: date, original path, one-line reason. Write that line from what you already know; do not read the archive back.
2. Block the archive, the first time: in the project's `.claude/settings.json`, add `"Read(./archive/**)"` to `permissions.deny` (create the file or the keys if missing; keep everything else). Tell the user this was added.
3. Update: make the edit shown in the table. For a ticket, set the status line. For a memory, change the fact, set `generated.at` to now and add a `verified` entry for the check (`by: claude-code/<model-id>`). For a memory that is replaced, set `status: deprecated` and `superseded_by` before archiving it, and remove its line from `MEMORY.md`.
4. Cut: remove the line. Nothing else in the file changes.
5. A file from the project's `memory/` folder is archived like any other file: remove its line from `memory/index.md` and add a `**Deprecation**` line to `memory/log.md`. The built-in memory folder is outside the repository: archive its files to an `archive/` folder inside it instead, and never read that folder either.
6. Do not commit unless the user asked. If they did, make one commit that lists the items by number.

Finish with what was archived, updated and cut, what was skipped, and anything that failed.
~~~~~~

## File 4: merge into <CLAUDE>/settings.json

~~~~~~json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "node \"<HOME>/.claude/scripts/project-scaffold.mjs\"",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
~~~~~~
