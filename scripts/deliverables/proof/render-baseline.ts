/**
 * Side A of the A/B: the existing deterministic renderer over the SAME governed
 * document, and the DOCX that is the consistency control.
 *
 * A is rendered with everything it is entitled to — the authored deckSlides and
 * the typed exhibit are both present in this document — so the comparison is
 * against the existing path at its best, not a crippled version of it.
 */
import fs from "node:fs";
import path from "node:path";
import { Packer } from "docx";
import { renderValidatedDeck } from "@/lib/deliverables/orchestrator/render-validated-deck";
import { renderDeliverableDocx } from "@/lib/deliverables/orchestrator/renderers";
import { validateDeckLineage, type LedgerEntry } from "@/lib/deliverables/composer/number-ledger";
import { sha256 } from "@/lib/deliverables/composer/presentation-packet";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const doc = JSON.parse(fs.readFileSync(path.join(OUT, "governed-document.json"), "utf8"));
const ledger: LedgerEntry[] = JSON.parse(fs.readFileSync(path.join(OUT, "number-ledger.json"), "utf8"));
const packet = JSON.parse(fs.readFileSync(path.join(OUT, "packet.json"), "utf8"));

async function main() {
  const rendered = await renderValidatedDeck(doc, { minSlides: 10, maxSlides: 24 });
  fs.writeFileSync(path.join(OUT, "deck-baseline.pptx"), rendered.buffer);

  const lineage = validateDeckLineage(rendered.inspection, {
    ledger,
    calendarYears: new Set<number>(packet.calendarYears ?? []),
  });

  const docxBuffer = await Packer.toBuffer(renderDeliverableDocx(doc));
  fs.writeFileSync(path.join(OUT, "document-baseline.docx"), docxBuffer);

  const report = {
    generation: "baseline",
    renderer: "pptxgenjs_section_fallback",
    pptxSha: sha256(rendered.buffer),
    docxSha: sha256(docxBuffer),
    inspection: {
      slideCount: rendered.inspection.slideCount,
      canvasWidthIn: rendered.inspection.canvasWidthIn,
      canvasHeightIn: rendered.inspection.canvasHeightIn,
      visibleChars: rendered.inspection.slides.reduce((s, x) => s + x.visibleChars, 0),
      picturesTotal: rendered.inspection.slides.reduce((s, x) => s + x.pictureCount, 0),
      tablesTotal: rendered.inspection.slides.reduce((s, x) => s + x.tableCount, 0),
    },
    physicallyIntact: rendered.physicallyIntact,
    integrity: rendered.verdict,
    lineage,
  };
  fs.writeFileSync(path.join(OUT, "manifest-baseline.json"), JSON.stringify(report, null, 2));

  console.log(`baseline pptx: ${report.inspection.slideCount} slides at ${report.inspection.canvasWidthIn}x${report.inspection.canvasHeightIn}in`);
  console.log(`               ${report.inspection.visibleChars.toLocaleString()} visible chars, ${report.inspection.picturesTotal} pictures, ${report.inspection.tablesTotal} tables`);
  console.log(`integrity:     ${rendered.verdict.ok ? "pass" : "FAIL"} (${rendered.verdict.findings.length} findings; physically intact: ${rendered.physicallyIntact})`);
  for (const f of rendered.verdict.findings.slice(0, 10)) console.log(`   ${f.kind}: ${f.message}`);
  console.log(`lineage:       ${lineage.ok ? "pass" : "FAIL"} — ${lineage.claimsChecked} claims, ${lineage.findings.length} unsupported, ${lineage.exemptStructural} structural`);
  for (const f of lineage.findings.slice(0, 10)) console.log(`   ${f.message}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
