/**
 * Freeze both decks before the blind review.
 *
 * Recorded, not asserted. Once a reviewer has seen a deck, every further edit
 * makes the comparison less informative — so the state under review is hashed,
 * and any later change to those files is detectable rather than a matter of
 * recollection.
 */
import fs from "node:fs";
import path from "node:path";
import { sha256 } from "@/lib/deliverables/composer/presentation-packet";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");

const artifacts = [
  "deck-baseline.pptx",
  "deck-composed-A.pptx",
  "deck-composed-B.pptx",
  "document-baseline.docx",
  "composer-A.py",
  "composer-B.py",
  "slide-story-plan-A.json",
  "packet.json",
  "number-ledger.json",
  "forbidden-claims.json",
  "governed-document.json",
];

const record: Record<string, { sha256: string; bytes: number }> = {};
for (const name of artifacts) {
  const p = path.join(OUT, name);
  if (!fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);
  record[name] = { sha256: sha256(buf), bytes: buf.length };
}

const pngDirs = ["png-baseline", "png-A", "png-B"].filter((d) => fs.existsSync(path.join(OUT, d)));
const images: Record<string, number> = {};
for (const d of pngDirs) images[d] = fs.readdirSync(path.join(OUT, d)).filter((f) => f.endsWith(".png")).length;

const frozen = { frozenAt: new Date().toISOString(), artifacts: record, images };
fs.writeFileSync(path.join(OUT, "FROZEN.json"), JSON.stringify(frozen, null, 2));

for (const [name, v] of Object.entries(record)) {
  console.log(`  ${name.padEnd(28)} ${v.sha256.slice(0, 16)}  ${v.bytes.toLocaleString()} bytes`);
}
console.log(`\nimages: ${Object.entries(images).map(([d, n]) => `${d} ${n}`).join(", ")}`);
console.log(`frozen at ${frozen.frozenAt}`);
