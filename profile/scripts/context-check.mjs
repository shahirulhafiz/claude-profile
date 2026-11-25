#!/usr/bin/env node
// UserPromptSubmit hook: adds one line of context when this conversation has grown large,
// or when a long conversation is picked up again after a break.
//
// Every turn re-reads the whole conversation, so a long session costs more on every turn,
// and after a break the whole of it is sent again at full price. The "Keeping the session
// small" rule in CLAUDE.md says what to do; this hook says when.
//
// Reads the hook JSON on stdin and uses its "transcript_path". The size is taken from the
// newest reply in that transcript, so it is one turn behind. Prints at most one line and
// always exits 0: it advises, it never blocks a prompt. Anything unexpected prints nothing.
//
// CONTEXT_WARN_TOKENS (default 250000) sets the size that triggers the note.
import fs from 'node:fs';

const DEFAULT_WARN_TOKENS = 250000;
const RESUME_SHARE = 0.6;      // the resume note starts at this share of the warning size
const RESUME_MINUTES = 60;     // idle for longer than this counts as a break
const MB = 1024 * 1024;
// A single transcript line can be several MB (an embedded image), so look at the last 2 MB
// first and go further back once if that holds no usable reply.
const TAIL_SIZES = [2 * MB, 32 * MB];

// The newest reply of the main conversation that carries real usage numbers.
function newestReply(file) {
  const size = fs.statSync(file).size;
  const fd = fs.openSync(file, 'r');
  try {
    for (const tail of TAIL_SIZES) {
      const start = Math.max(0, size - tail);
      const buf = Buffer.alloc(size - start);
      fs.readSync(fd, buf, 0, buf.length, start);
      const lines = buf.toString('utf8').split('\n');
      if (start > 0) lines.shift(); // the read began mid-line: that first piece is not a whole entry
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i].includes('"usage"')) continue; // skips huge image lines without parsing them
        let entry;
        try { entry = JSON.parse(lines[i]); } catch { continue; }
        if (entry?.type !== 'assistant' || entry.isSidechain) continue; // sidechain = a subagent
        const usage = entry.message?.usage;
        if (!usage || entry.message.model === '<synthetic>') continue;  // synthetic = an error reply
        const tokens = ['input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens']
          .reduce((sum, key) => sum + (Number(usage[key]) || 0), 0);
        if (tokens > 0) return { tokens, at: Date.parse(entry.timestamp) };
      }
      if (start === 0) break; // the whole file was read
    }
  } finally {
    fs.closeSync(fd);
  }
  return null;
}

let note = '';
try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const reply = typeof input?.transcript_path === 'string' ? newestReply(input.transcript_path) : null;
  if (reply) {
    const wanted = Number(process.env.CONTEXT_WARN_TOKENS);
    const warnAt = Number.isFinite(wanted) && wanted > 0 ? wanted : DEFAULT_WARN_TOKENS;
    const size = `about ${Math.round(reply.tokens / 1000)}K tokens`;
    // An unreadable time, or one in the future, counts as no break.
    const idle = Number.isFinite(reply.at) ? Math.max(0, Math.floor((Date.now() - reply.at) / 60000)) : 0;
    // The break comes first: after one, the advice is needed now, not at the next approval point.
    if (reply.tokens >= warnAt * RESUME_SHARE && idle > RESUME_MINUTES) {
      note = `Context check: this conversation is at ${size} and has been idle for ${idle} minutes, ` +
        'so continuing sends all of it again at full price. Tell the user, once, that a new session is likely cheaper, then do what they ask.';
    } else if (reply.tokens >= warnAt) {
      note = `Context check: this conversation is at ${size}, and every turn re-reads all of it. ` +
        'At the next approval point, write the log line and suggest to the user, once, to continue in a new session.';
    }
  }
} catch { /* no transcript or unreadable input: say nothing */ }

if (note) console.log(note);
