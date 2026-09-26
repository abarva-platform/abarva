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
import { renderSlidePngs } from "./render-png";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const REPO = path.resolve(__dirname, "../../..");
const PYTHON = process.env.COMPOSER_PYTHON ?? "python3";

const doc = JSON.parse(fs.readFileSync(path.join(OUT, "governed-document.json"), "utf8"));
const ledger: LedgerEntry[] = JSON.parse(fs.readFileSync(path.join(OUT, "number-ledger.json"), "utf8"));
const packet = JSON.parse(fs.readFileSync(path.join(OUT, "packet.json"), "utf8"));

const claims = deriveMaterialClaims({ recommendation: doc.recommendation, nextActions: doc.nextActions });

async function grade(name: string, file: string) {
  const buffer = fs.readFileSync(path.join(OUT, file));
  const inspection = await inspectDeck(buffer);
  const lineage = validateDeckLineage(inspection, {
    ledger,
    calendarYears: new Set<number>(packet.calendarYears ?? []),
    calendarDates: new Set<string>(packet.calendarDates ?? []),
  });
  const cross = validateCrossProjection(inspection, claims);
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
    ["model-composed", "deck-composed-A.pptx"],
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
        `cross-projection ${r.cross.ok ? "pass" : `FAIL (${r.cross.findings.length})`}`,
    );
    for (const f of r.lineage.findings.slice(0, 6)) console.log(`     lineage: ${f.message}`);
    for (const f of r.cross.findings.slice(0, 6)) console.log(`     cross:   ${f.message}`);
  }

  fs.writeFileSync(path.join(OUT, "ab-report.json"), JSON.stringify({ claims, results }, null, 2));

  // Blind pack
  const composed = path.join(OUT, "deck-composed-A.pptx");
  if (fs.existsSync(composed)) {
    console.log("\nrendering composed deck to PNG…");
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
