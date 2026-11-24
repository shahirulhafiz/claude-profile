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
