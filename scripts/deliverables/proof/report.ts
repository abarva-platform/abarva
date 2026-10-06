/**
 * Assemble the proof report: both decks through every gate, the cross-projection
 * check, and a blind A/B pack.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import { validateCrossProjection } from "@/lib/deliverables/composer/cross-projection";
import { deriveMaterialClaims } from "@/lib/deliverables/composer/material-claims";
import { validateDeckLineage, type LedgerEntry } from "@/lib/deliverables/composer/number-ledger";
import { checkProhibitions } from "@/lib/deliverables/composer/forbidden-claims";
import { renderSlidePngs } from "./render-png";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const REPO = path.resolve(__dirname, "../../..");
const PYTHON = process.env.COMPOSER_PYTHON ?? "python3";

const doc = JSON.parse(fs.readFileSync(path.join(OUT, "governed-document.json"), "utf8"));
/** Governed prose, so a number inside a product name reads as a name. */
const GOVERNED_TEXT = [
  ...doc.generatedSections.map((s: { bodyMarkdown: string }) => s.bodyMarkdown),
  ...doc.tables.flatMap((t: { rows: string[][] }) => t.rows.flat()),
  doc.recommendation,
].join("\n");
const ledger: LedgerEntry[] = JSON.parse(fs.readFileSync(path.join(OUT, "number-ledger.json"), "utf8"));
const packet = JSON.parse(fs.readFileSync(path.join(OUT, "packet.json"), "utf8"));

/**
 * One name for the composed deck, used by BOTH the grading loop and the blind
 * pack. They were separate: the report graded A and packed B, so the numbers
 * described one artifact and the images another, and nothing said so.
 */
const COMPOSED = process.env.COMPOSED_DECK ?? "deck-composed-A.pptx";

const claims = deriveMaterialClaims({ recommendation: doc.recommendation, nextActions: doc.nextActions });
const prohibitionsPath = path.join(OUT, "forbidden-claims.json");
const prohibitions: string[] = fs.existsSync(prohibitionsPath)
  ? JSON.parse(fs.readFileSync(prohibitionsPath, "utf8"))
  : [];

async function grade(name: string, file: string) {
  const buffer = fs.readFileSync(path.join(OUT, file));
  const inspection = await inspectDeck(buffer);
  const lineage = validateDeckLineage(inspection, {
    ledger,
    calendarYears: new Set<number>(packet.calendarYears ?? []),
    calendarDates: new Set<string>(packet.calendarDates ?? []),
    governedText: GOVERNED_TEXT,
  });
  const cross = validateCrossProjection(inspection, claims);
  const prohibited = checkProhibitions(inspection, prohibitions);
  const shapes = inspection.slides.reduce((s, x) => s + x.offCanvas.length, 0);
  return {
    name,
    file,
    slides: inspection.slideCount,
    canvas: `${inspection.canvasWidthIn.toFixed(2)}x${inspection.canvasHeightIn.toFixed(2)}`,
    visibleChars: inspection.slides.reduce((s, x) => s + x.visibleChars, 0),
    runs: inspection.slides.reduce((s, x) => s + x.textRuns.length, 0),
    pictures: inspection.slides.reduce((s, x) => s + x.pictureCount, 0),
    tables: inspection.slides.reduce((s, x) => s + x.tableCount, 0),
    offCanvas: shapes,
    lineage,
    cross,
    prohibited,
  };
}

async function main() {
  console.log("material claims the deck must preserve:");
  console.log(`  ask terms:  ${claims.askTerms.join(", ") || "(none found)"}`);
  console.log(`  options:    ${claims.selectedOptions.join(" | ") || "(none found)"}`);
  console.log(`  figures:    ${claims.headlineFigures.join(", ") || "(none found)"}`);
  console.log(`  dates:      ${claims.materialDates.join(", ") || "(none found)"}`);
  console.log(`  owners:     ${claims.owners.slice(0, 6).join(" | ") || "(none found)"}`);
  console.log("");

  const results = [];
  for (const [name, file] of [
    ["deterministic renderer", "deck-baseline.pptx"],
    ["model-composed", COMPOSED],
  ] as const) {
    if (!fs.existsSync(path.join(OUT, file))) {
      console.log(`${name}: ${file} not present, skipped`);
      continue;
    }
    const r = await grade(name, file);
    results.push(r);
    console.log(
      `${name.padEnd(24)} ${String(r.slides).padStart(2)} slides  ${r.canvas}in  ` +
        `${String(r.visibleChars).padStart(6)} chars  ${String(r.runs).padStart(4)} runs  ` +
        `${r.pictures} pics  ${r.tables} tables  ${r.offCanvas} off-canvas`,
    );
    console.log(
      `${"".padEnd(24)} lineage ${r.lineage.ok ? "pass" : `FAIL (${r.lineage.findings.length})`}  ` +
        `cross-projection ${r.cross.ok ? "pass" : `FAIL (${r.cross.findings.length})`}  ` +
        `prohibitions ${r.prohibited.clean ? "clean" : `FAIL (${r.prohibited.findings.length})`} ` +
        `(${r.prohibited.prohibitionsChecked} checked over ${r.prohibited.sentencesScanned} sentences)`,
    );
    for (const f of r.lineage.findings.slice(0, 6)) console.log(`     lineage: ${f.message}`);
    for (const f of r.cross.findings.slice(0, 6)) console.log(`     cross:   ${f.message}`);
    for (const f of r.prohibited.findings.slice(0, 6))
      console.log(`     prohibited: slide ${f.slide} "${f.sentence.slice(0, 80)}" vs "${f.prohibition.slice(0, 60)}"`);
  }

  fs.writeFileSync(path.join(OUT, "ab-report.json"), JSON.stringify({ claims, results }, null, 2));

  // Blind pack
  const composed = path.join(OUT, COMPOSED);
  const baseline = path.join(OUT, "deck-baseline.pptx");
  if (fs.existsSync(composed) && fs.existsSync(baseline)) {
    // Render BOTH. The first version rendered only the composed deck and the
    // blind pack then died on a missing directory — the baseline is half the
    // comparison, so it cannot be the half that is assumed to exist.
    console.log("\nrendering both decks to PNG…");
    renderSlidePngs(baseline, path.join(OUT, "png-baseline"));
    renderSlidePngs(composed, path.join(OUT, "png-A"));
    console.log("building blind pack…");
    const stdout = execFileSync(
      PYTHON,
      [
        path.join(REPO, "scripts/deliverables/proof/blind_pack.py"),
        path.join(OUT, "png-baseline"),
        path.join(OUT, "png-A"),
        path.join(OUT, "blind-pack"),
      ],
      { encoding: "utf8" },
    );
    console.log(stdout.trim());
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
