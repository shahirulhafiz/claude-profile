#!/usr/bin/env node
// SessionStart hook. Prints a short briefing for the project the session starts in, so a new
// session knows where the last one stopped. Whatever this prints is added to Claude's context.
//
// It prints:  the latest entries of memory/log.md, tickets marked "in progress", the last commits,
// dream proposals waiting for a yes, and a DREAM DUE line when enough new sessions have piled up.
// It only reads. It prints nothing in a folder without memory/index.md (not a set-up project).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { dreamDir, readState, sessionsSince } from './session-digest.mjs';

const DREAM_MIN_HOURS = Number(process.env.DREAM_MIN_HOURS ?? 24);
const DREAM_MIN_SESSIONS = Number(process.env.DREAM_MIN_SESSIONS ?? 3);

function latestLog(dir) {
  const file = path.join(dir, 'memory', 'log.md');
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const out = [];
  let sections = 0;
  for (const line of lines) {
    if (/^## \d{4}-\d{2}-\d{2}/.test(line)) { sections += 1; if (sections > 3) break; }
    if (sections > 0 && line.trim()) out.push(line.length > 400 ? `${line.slice(0, 400)} …` : line);
    if (out.length >= 25) break;
  }
  return out;
}

function tickets(dir) {
  const t = path.join(dir, 'specs', 'tickets');
  if (!fs.existsSync(t)) return { inProgress: [], counts: {} };
  const counts = {};
  const inProgress = [];
  for (const f of fs.readdirSync(t).filter((n) => /^\d+.*\.md$/i.test(n)).sort()) {
    const head = fs.readFileSync(path.join(t, f), 'utf8').split(/\r?\n/).slice(0, 15);
    const status = (head.find((l) => /^\**status\**\s*:/i.test(l.trim())) ?? '').replace(/^.*?:\s*/, '').replace(/\*/g, '').trim().toLowerCase() || 'no status line';
    counts[status] = (counts[status] ?? 0) + 1;
    if (status === 'in progress') inProgress.push(`${f}: ${(head.find((l) => l.startsWith('#')) ?? '').replace(/^#+\s*/, '')}`);
  }
  return { inProgress, counts };
}

function commits(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'log', '-5', '--pretty=format:%h %ad %s', '--date=short'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 })
      .split('\n').filter(Boolean);
  } catch { return []; }
}

function main() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* no stdin */ }
  const dir = input.cwd || process.env.CLAUDE_PROJECT_DIR || '';
  if (!dir || !fs.existsSync(path.join(dir, 'memory', 'index.md'))) return;

  const out = [`Project briefing for ${path.basename(path.resolve(dir))} (from the session-start hook; background, not a request):`];

  const log = latestLog(dir);
  if (log.length) out.push('', 'Latest entries in memory/log.md:', ...log.map((l) => `  ${l}`));

  const t = tickets(dir);
  const countText = Object.entries(t.counts).map(([k, v]) => `${v} ${k}`).join(', ');
  if (countText) out.push('', `Tickets: ${countText}.`, ...t.inProgress.map((l) => `  in progress: ${l}`));

  const c = commits(dir);
  if (c.length) out.push('', 'Last commits:', ...c.map((l) => `  ${l}`));

  const dd = dreamDir(dir);
  const pending = path.join(dd, 'PENDING.md');
  if (fs.existsSync(pending)) {
    const n = (fs.readFileSync(pending, 'utf8').match(/^### P\d+/gm) ?? []).length;
    out.push('', `DREAM PROPOSALS WAITING: ${n} proposed memory changes in ${pending}. Tell the user once, in one line, that they can review them with /dream. Do not apply any of them yourself.`);
  } else {
    const state = readState(dir);
    const last = state.lastDreamAt ? Date.parse(state.lastDreamAt) : 0;
    const fresh = sessionsSince(dir, last, input.transcript_path).length;
    const hours = (Date.now() - last) / 36e5;
    if (fresh >= DREAM_MIN_SESSIONS && hours >= DREAM_MIN_HOURS) {
      out.push('', `DREAM DUE: ${fresh} sessions since the last dream${last ? ` (${Math.floor(hours)} hours ago)` : ' (none has run yet)'}. Follow the "auto" section of the dream skill now: start it as one background subagent, tell the user in one line, and carry on with what they ask.`);
    }
  }

  if (out.length > 1) console.log(out.join('\n'));
}

try { main(); } catch { /* a briefing must never block a session */ }
process.exit(0);
