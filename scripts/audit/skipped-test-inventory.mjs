#!/usr/bin/env node
/**
 * Skipped-test inventory — backlog item T-038.
 *
 * A skipped suite that nobody named is indistinguishable from a suite that
 * does not exist. Wiring a directory into CI proves a command runs; it does
 * not prove the assertions inside it execute, and a run reporting
 * `1 skipped` names nothing.
 *
 * This names them. Every skip under the source and test trees, with the
 * reason it states, so a skip is a recorded decision rather than a number in
 * a summary line.
 *
 * Two kinds, reported separately because they rot differently:
 *
 *   unconditional — `it.skip` / `describe.skip` / `xit`. Someone turned this
 *                   off. The reason is whatever the title says, and the
 *                   danger is that the reason expires without anyone
 *                   re-reading it.
 *   conditional   — `hasCreds ? describe : describe.skip`. It runs
 *                   somewhere and not in CI. The danger is different: CI
 *                   reports the suite as passing while it asserted nothing.
 *
 * It reports; it does not gate. A skip is a legitimate thing to have, and a
 * check that fails on the existence of one gets switched off. What should
 * not be legitimate is a skip nobody can find, and this makes that
 * impossible.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'tests'];
const EXT = /\.(test|spec)\.[cm]?[jt]sx?$/;

const UNCONDITIONAL =
  /\b(?:it|test|describe)\.skip\s*\(\s*(['"`])([\s\S]*?)\1|\bx(?:it|describe)\s*\(\s*(['"`])([\s\S]*?)\3/g;

// `const describeIfDb = hasDbCreds ? describe : describe.skip;`
const CONDITIONAL = /\b(?:const|let)\s+(\w+)\s*=\s*([^;]*?)\?\s*(?:describe|it|test)\s*:\s*(?:describe|it|test)\.skip/g;

/**
 * Blank the contents of every comment, keeping the text's length and line
 * breaks so byte offsets still map to the original.
 *
 * Without this the inventory counts a skip that somebody *wrote about*. It
 * happened immediately: removing a skip and explaining the removal in a
 * comment that quoted its title left the inventory still reporting it. A
 * scanner that cannot tell code from prose about code reports the prose.
 *
 * Line breaks survive so line numbers stay right; everything else inside a
 * comment becomes a space.
 */
export function blankComments(text) {
  let out = '';
  let i = 0;
  let mode = 'code';
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (mode === 'code') {
      if (two === '//') {
        mode = 'line';
        out += '  ';
        i += 2;
        continue;
      }
      if (two === '/*') {
        mode = 'block';
        out += '  ';
        i += 2;
        continue;
      }
      out += text[i];
      i += 1;
      continue;
    }
    if (mode === 'line') {
      if (text[i] === '\n') {
        mode = 'code';
        out += '\n';
      } else {
        out += ' ';
      }
      i += 1;
      continue;
    }
    // block
    if (two === '*/') {
      mode = 'code';
      out += '  ';
      i += 2;
      continue;
    }
    out += text[i] === '\n' ? '\n' : ' ';
    i += 1;
  }
  return out;
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (['node_modules', '.git', '.next'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.test(entry.name)) out.push(full);
  }
  return out;
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

/**
 * Is this file working on the inventory rather than being surveyed by it?
 *
 * A suite that tests a skip-detector contains examples of skips, written as
 * string literals so they survive comment-blanking. Counting those would
 * make the inventory's own test the largest source of skips in the
 * repository — which is how a number stops meaning anything.
 *
 * Derived from a reference to this script's path, the same way the enum
 * sweep excludes its own demonstrations, so the next suite written for it
 * excludes itself without anyone maintaining a list.
 */
export function demonstratesTheInventory(text) {
  return /skipped-test-inventory\.mjs/.test(text);
}

/**
 * `files` exists so the scanner can be exercised on a string without staging
 * a directory. Without it the only way to test the parsing is to write
 * fixture files to disk, and a scanner tested only against the real tree is
 * tested only against what happens to be there today.
 *
 * @param {string[]} [roots]
 * @param {(file: string) => string} [readFile]
 * @param {string[] | null} [files]
 */
export function collectSkips(
  roots = ROOTS,
  readFile = (f) => readFileSync(f, 'utf8'),
  files = null,
) {
  const unconditional = [];
  const conditional = [];

  const roots_ = files ? ['<injected>'] : roots;
  for (const root of roots_) {
    if (!files) {
      let exists = true;
      try {
        statSync(root);
      } catch {
        exists = false;
      }
      if (!exists) continue;
    }

    for (const file of files ?? walk(root)) {
      const text = readFile(file);
      if (demonstratesTheInventory(text)) continue;
      // Skips are found in code; reasons are read from the original, which
      // still has its comments.
      const code = blankComments(text);

      UNCONDITIONAL.lastIndex = 0;
      let m;
      while ((m = UNCONDITIONAL.exec(code)) !== null) {
        unconditional.push({
          file,
          line: lineAt(code, m.index),
          title: (m[2] ?? m[4] ?? '').trim(),
          precedingComment: commentAbove(text, m.index),
        });
      }

      CONDITIONAL.lastIndex = 0;
      while ((m = CONDITIONAL.exec(code)) !== null) {
        conditional.push({
          file,
          line: lineAt(text, m.index),
          binding: m[1],
          condition: m[2].trim(),
        });
      }
    }
  }

  return { unconditional, conditional };
}

const REASON_WORDS =
  /\b(?:until|after|once|because|pending|waiting|enable|re-?enable|blocked|see|flake|flaky|deprecat|requires?|needs?)\b/i;

/**
 * Does this skip say why, anywhere a reader would look?
 *
 * The title is the first place, but not the only one. The first version of
 * this read titles alone and flagged a skip whose reason sat in the comment
 * directly above it — "wired once Jest gets a DB fixture", which is a better
 * reason than most titles carry. A checker that flags a well-documented skip
 * teaches people to ignore it, which is the opposite of the point.
 *
 * So the comment block immediately preceding the skip counts too. Only the
 * contiguous one: a reason three functions away is not attached to this.
 */
export function statesNoReason(title, precedingComment = '') {
  return !REASON_WORDS.test(title) && !REASON_WORDS.test(precedingComment);
}

/** The contiguous comment lines immediately above `index`, if any. */
export function commentAbove(text, index) {
  const before = text.slice(0, index).split('\n');
  // Drop the partial line the match sits on.
  before.pop();
  const lines = [];
  for (let i = before.length - 1; i >= 0; i -= 1) {
    const line = before[i].trim();
    if (line === '') {
      if (lines.length > 0) break;
      continue;
    }
    if (/^(?:\/\/|\*|\/\*)/.test(line)) lines.unshift(line);
    else break;
  }
  return lines.join(' ');
}

function main() {
  const { unconditional, conditional } = collectSkips();

  console.log(
    `skipped-test-inventory: ${unconditional.length} unconditional skip(s), ` +
      `${conditional.length} conditional skip binding(s).`,
  );

  if (unconditional.length > 0) {
    console.log('\nUNCONDITIONAL — someone turned these off:');
    for (const s of unconditional) {
      const flag = statesNoReason(s.title, s.precedingComment)
        ? '  [states no reason]'
        : '';
      console.log(`  ${s.file}:${s.line}${flag}`);
      console.log(`    ${s.title}`);
    }
  }

  if (conditional.length > 0) {
    console.log(
      '\nCONDITIONAL — these run somewhere and report as passing where they do not:',
    );
    for (const s of conditional) {
      console.log(`  ${s.file}:${s.line}  ${s.binding} when ${s.condition}`);
    }
  }

  const unreasoned = unconditional.filter((s) =>
    statesNoReason(s.title, s.precedingComment),
  );
  if (unreasoned.length > 0) {
    console.log(
      `\n${unreasoned.length} skip(s) state no reason. A skip is a decision; ` +
        'a decision with no reason cannot be re-checked by anyone but its author.',
    );
  }
  return 0;
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  process.exit(main());
}
