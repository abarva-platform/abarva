#!/usr/bin/env npx tsx
/**
 * Typographic quality audit for the rendered Home chapters.
 *
 * Line length is the single most objective measure of whether a page is readable, and it is
 * invisible to every other gate: types pass, tests pass, CI passes, and the page still sets a
 * 220-character line. Two failures this catches, both of which shipped:
 *
 *  - `repeat(auto-fit, ...)` collapses to one full-width track when a band holds a single item, so
 *    a chapter with one question rendered that question across the whole canvas.
 *  - `ch` is the advance of the digit zero, roughly 40% wider than Inter's average glyph. A 64ch
 *    cap therefore lands near 90 characters per line, not the 65-75 that actually reads.
 *
 * Reports rather than fails: line length has legitimate exceptions (a mono id string, a label).
 * The number is what matters, and it should be looked at.
 */
import fs from "node:fs";
import path from "node:path";

const DIR = process.argv.includes("--dir") ? process.argv[process.argv.indexOf("--dir") + 1] : "/tmp/home-v4-proof";
/** Average glyph advance as a fraction of font size, measured for Inter/Fraunces at body sizes. */
const GLYPH_RATIO = 0.5;
const MIN_CPL = 40;
const MAX_CPL = 85;

interface Finding { file: string; tag: string; cpl: number; px: number; fs: number; sample: string }

const findings: Finding[] = [];
let measured = 0;

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".html") && f !== "index.html")) {
  const html = fs.readFileSync(path.join(DIR, file), "utf8");
  // max-width in ch on a text element, with its font-size -- the two numbers that decide measure.
  const re = /<(p|li|h1|h2|h3)[^>]*style="([^"]*)"[^>]*>([^<]{60,})</gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [, tag, style, text] = m;
    const fsMatch = /font-size:\s*([\d.]+)px/.exec(style);
    const mwMatch = /max-width:\s*([\d.]+)ch/.exec(style);
    if (!fsMatch || !mwMatch) continue;
    const fs2 = parseFloat(fsMatch[1]);
    const widthPx = parseFloat(mwMatch[1]) * fs2 * 0.6; // 1ch ~= 0.6em for these faces
    const cpl = Math.round(widthPx / (fs2 * GLYPH_RATIO));
    measured += 1;
    if (cpl > MAX_CPL || cpl < MIN_CPL) {
      findings.push({ file, tag, cpl, px: Math.round(widthPx), fs: fs2, sample: text.trim().slice(0, 46) });
    }
  }
}

findings.sort((a, b) => b.cpl - a.cpl);
console.log(`Measured ${measured} capped text elements across ${DIR}`);
if (findings.length === 0) {
  console.log(`All within ${MIN_CPL}-${MAX_CPL} characters per line.`);
} else {
  console.log(`${findings.length} outside ${MIN_CPL}-${MAX_CPL} cpl:\n`);
  for (const f of findings.slice(0, 12)) {
    console.log(`  ${String(f.cpl).padStart(4)} cpl  ${f.tag.padEnd(3)} ${String(f.px).padStart(4)}px @${f.fs}px  ${f.file}`);
    console.log(`            "${f.sample}..."`);
  }
}
