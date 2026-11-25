#!/usr/bin/env node
// PreToolUse hook: blocks a worker (subagent) call that names no model.
//
// A worker started without a model runs on the session's model, which is usually the most
// expensive one. The "Models" rule in CLAUDE.md says to name a model on every call; this
// hook enforces it. Forks are exempt: they always run on the session's model.
//
// Reads the hook JSON on stdin. Exit 2 blocks the call and shows the message to the caller.
// Anything unexpected (no input, bad JSON, another tool) exits 0, so a fault here never
// blocks work.
import fs from 'node:fs';

let block = false;
try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const call = input.tool_input;
  const isWorkerCall = input.tool_name === 'Agent' || input.tool_name === 'Task';
  if (isWorkerCall && call && typeof call === 'object' && call.subagent_type !== 'fork') {
    // A model counts as named only if it is a string with something in it.
    block = !(typeof call.model === 'string' && call.model.trim());
  }
} catch { /* unreadable input: allow the call */ }

if (block) {
  process.stderr.write(
    'Blocked: this worker call names no model, so it would run on the session\'s model. ' +
    'Repeat the call with "model" set, following the Models rule in CLAUDE.md: ' +
    'sonnet for simple, clear tasks; opus for harder tasks; haiku for file search and logs.\n'
  );
  process.exit(2);
}
