#!/usr/bin/env node
// Builds SETUP-PROMPT.md: one self-contained prompt that holds the whole profile.
// Run after any change in profile/:  node build-prompt.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const FENCE = '~~~~~~';
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n').trimEnd();

const parts = [
  { src: 'profile/CLAUDE.md', dest: '<CLAUDE>/CLAUDE.md', lang: 'markdown' },
  { src: 'profile/scripts/project-scaffold.mjs', dest: '<CLAUDE>/scripts/project-scaffold.mjs', lang: 'javascript' },
  { src: 'profile/scripts/session-digest.mjs', dest: '<CLAUDE>/scripts/session-digest.mjs', lang: 'javascript' },
  { src: 'profile/scripts/session-brief.mjs', dest: '<CLAUDE>/scripts/session-brief.mjs', lang: 'javascript' },
  { src: 'profile/skills/sweep/SKILL.md', dest: '<CLAUDE>/skills/sweep/SKILL.md', lang: 'markdown' },
  { src: 'profile/skills/dream/SKILL.md', dest: '<CLAUDE>/skills/dream/SKILL.md', lang: 'markdown' },
  { src: 'profile/settings.hooks.json', dest: 'merge into <CLAUDE>/settings.json', lang: 'json' },
];

const blocks = parts.map((p, i) => {
  const body = read(p.src);
  if (body.includes(FENCE)) throw new Error(`${p.src} contains the fence ${FENCE}`);
  return `## File ${i + 1}: ${p.dest}\n\n${FENCE}${p.lang}\n${body}\n${FENCE}`;
}).join('\n\n');

// The instructions are plain text with @@ standing for a backtick, to keep this file readable.
const instructions = `# Setup prompt

Paste this whole file into Claude Code on the machine you want to set up. It needs no other file. (Generated from @@profile/@@ by @@build-prompt.mjs@@; do not edit by hand.)

---

Set up my Claude profile on this machine. Everything you need is in this message: ${parts.length} files, each inside a block fenced with six tildes (@@${FENCE}@@). The opening fence line also carries a language word (@@markdown@@, @@javascript@@ or @@json@@), which is not part of the file. Write each file's content exactly as given, without the fence lines, with no rewording and nothing left out. The safest way is a short script that cuts the blocks out of this message; File 1 contains its own triple-backtick block, so split only on the six-tilde fences.

The target is my Claude config folder, @@~/.claude@@ (on Windows @@%USERPROFILE%\\.claude@@). Call it @@<CLAUDE>@@ and my home folder @@<HOME>@@.

Before you change anything, check that @@node --version@@ works. If Node.js is missing, stop and tell me: the hooks need it.

Never overwrite an existing file without saving a copy first, as @@<name>.bak-YYYYMMDD@@ beside it. If that backup name is already taken, add the time (@@.bak-YYYYMMDD-HHMM@@) so an earlier backup is never lost.

1. **File 1, profile rules.** Compare it with @@<CLAUDE>/CLAUDE.md@@.
   - If the target does not exist, write File 1 there.
   - If it exists, merge by section (each @@# Heading@@): add sections that are missing, replace sections with the same heading by the version in File 1, and keep sections that exist only on this machine. Keep the order of File 1, with this machine's own sections at the end.
   - A section that differs only in spacing or line endings, or that is a shorter or older version saying nothing File 1 contradicts, is replaced without asking.
   - If a section on this machine says something different from File 1 (a different rule, not just different wording of the same rule), show me both versions and ask which to keep before you replace it. Until I answer, leave my version where File 1's section would go.
   - If a section I keep contradicts a section you added from File 1, tell me which two and ask.

2. **Files 2, 3 and 4, scripts.** Write them to @@<CLAUDE>/scripts/@@ as @@project-scaffold.mjs@@, @@session-digest.mjs@@ and @@session-brief.mjs@@.

3. **Files 5 and 6, skills.** Write them to @@<CLAUDE>/skills/sweep/SKILL.md@@ and @@<CLAUDE>/skills/dream/SKILL.md@@.

4. **File 7, session-start hooks.** Merge it into @@<CLAUDE>/settings.json@@.
   - Replace @@<HOME>@@ in both commands with this machine's real home folder, written with forward slashes (for example @@C:/Users/name@@ or @@/Users/name@@).
   - Keep every other key in @@settings.json@@ as it is. Create the file if it is missing.
   - Add File 7's entry (matcher @@startup@@ with its two commands) as its own entry in the @@SessionStart@@ list. Leave other @@SessionStart@@ entries as they are.
   - If a hook whose command contains @@project-scaffold.mjs@@ or @@session-brief.mjs@@ is already there, update it in place, and add whichever of the two commands is missing to that same entry. Never end up with the same command twice.

Then check your work and report:

- @@<CLAUDE>/settings.json@@ still parses as JSON.
- @@node --check@@ passes for each of the three scripts in @@<CLAUDE>/scripts/@@.
- Run the scaffold by hand on a new empty folder in the system temp folder (by hand it works there; only the automatic hook skips temp folders): @@node <CLAUDE>/scripts/project-scaffold.mjs <that folder>@@. It must create @@CLAUDE.md@@, @@specs/prd.md@@, @@specs/tickets/README.md@@, @@memory/index.md@@, @@memory/log.md@@, @@memory/README.md@@, @@archive/INDEX.md@@ and @@.claude/settings.json@@.
- Run @@node <CLAUDE>/scripts/session-brief.mjs@@ with @@{"cwd":"<that folder, forward slashes>"}@@ on standard input. It must print a project briefing. Delete the test folder afterwards.
- List what you created, what you merged, what you backed up, and anything you skipped.

Do not scaffold my existing projects on this machine, and do not commit or push anything. Tell me to start a new session afterwards, because the hooks and the skills load at session start.
`.replaceAll('@@', '`');

const prompt = `${instructions}\n${blocks}\n`;
fs.writeFileSync(path.join(root, 'SETUP-PROMPT.md'), prompt, 'utf8');
console.log(`SETUP-PROMPT.md written: ${parts.length} files, ${prompt.length} characters, ${prompt.split('\n').length} lines`);
