/**
 * The P2 evidence-traceability smoke.
 *
 * Question: when the evidence a current-state analysis needs is uploaded, does
 * each uploaded fact reach the rendered artifact's gap analysis — and do the
 * gaps the upload does NOT close stay open?
 *
 * The second half carries the weight. A pipeline that closes every gap when
 * handed more data is worse than one that ignores the data, because it is
 * confidently wrong. The uploaded package declares in its own gap-coverage tab
 * which gaps it partially fills and which remain deliberately open, so the
 * expected result is fixed before the run rather than judged after it.
 *
 * Usage: smoke-p2-traceability.ts <control-dir> <treatment-dir>
 */
import fs from "node:fs";
import path from "node:path";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import {
  traceFacts,
  checkCoverage,
  type InstrumentedFact,
} from "@/lib/deliverables/composer/evidence-trace";
import { checkProhibitions } from "@/lib/deliverables/composer/forbidden-claims";

const CONTROL = path.resolve(process.argv[2]);
const TREATMENT = path.resolve(process.argv[3]);
const DECK = process.env.SMOKE_DECK ?? "deck-composed-B.pptx";

const read = (dir: string, f: string) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));

/** Slides whose planned purpose is the current-state or gap analysis. */
const GAP_SLIDE = /gap|current[- ]state|what is true|evidence|baseline|diagnos|root cause|not decision-grade|readiness/i;

async function deckText(dir: string, file: string) {
  const buf = fs.readFileSync(path.join(dir, file));
  const deck = await inspectDeck(buf);
  const plan = fs.existsSync(path.join(dir, "slide-story-plan-A.json"))
    ? read(dir, "slide-story-plan-A.json").slideStoryPlan
    : [];
  const gapIndexes = new Set(
    plan
      .map((s: { title: string; purpose: string; decisionContribution: string }, i: number) =>
        GAP_SLIDE.test(`${s.title} ${s.purpose} ${s.decisionContribution}`) ? i + 1 : -1,
      )
      .filter((i: number) => i > 0),
  );
  const all = deck.slides.flatMap((s) => s.textRuns).join("\n");
  const gap = deck.slides
    .filter((s) => gapIndexes.has(s.index))
    .flatMap((s) => s.textRuns)
    .join("\n");
  return { deck, all, gap, gapSlides: [...gapIndexes] as number[] };
}

async function main() {
  const facts: InstrumentedFact[] = read(TREATMENT, "uploaded-facts.json");
  const request = read(TREATMENT, "request.json");
  const doc = read(TREATMENT, "governed-document.json");
  const orchestration = read(TREATMENT, "orchestration-result.json");

  const bundleText = request.governedEvidenceBundle
    .map((e: { label: string; statement: string }) => `${e.label}: ${e.statement}`)
    .join("\n");

  // Evidence the PLANNER assigned to a section, which is a different population
  // from evidence that was merely in the bundle.
  const assignedCitations = new Set<number>(
    (orchestration.plan?.sectionPlan ?? []).flatMap((s: { evidenceCitations?: number[] }) => s.evidenceCitations ?? []),
  );
  const assignedText = request.governedEvidenceBundle
    .filter((e: { citationNumber: number }) => assignedCitations.has(e.citationNumber))
    .map((e: { statement: string }) => e.statement)
    .join("\n");

  const citedText = doc.generatedSections.map((s: { bodyMarkdown: string }) => s.bodyMarkdown).join("\n");

  const treatment = await deckText(TREATMENT, DECK);
  const control = await deckText(CONTROL, DECK);

  const verdict = traceFacts(facts, {
    bundleText,
    assignedText,
    citedText,
    deckText: treatment.all,
    gapAnalysisText: treatment.gap,
  });

  console.log(`control:   ${path.basename(CONTROL)}  ${control.deck.slideCount} slides`);
  console.log(`treatment: ${path.basename(TREATMENT)}  ${treatment.deck.slideCount} slides`);
  console.log(`gap-analysis slides in treatment: ${treatment.gapSlides.join(", ") || "(none identified)"}\n`);

  console.log("FUNNEL — required facts reaching each stage");
  for (const s of verdict.stages) {
    const pct = s.required ? Math.round((s.reached / s.required) * 100) : 0;
    console.log(`  ${s.stage.padEnd(13)} ${String(s.reached).padStart(3)} / ${s.required}  ${String(pct).padStart(3)}%`);
  }

  if (verdict.missingFromDeck.length) {
    console.log(`\nREQUIRED FACTS ABSENT FROM THE DECK (${verdict.missingFromDeck.length})`);
    for (const f of verdict.missingFromDeck) console.log(`  ${f.label.padEnd(44)} lost at: ${f.lostAt}`);
  }
  if (verdict.missingFromGapAnalysis.length) {
    console.log(`\nIN THE DECK BUT NOT IN THE GAP ANALYSIS (${verdict.missingFromGapAnalysis.length})`);
    for (const f of verdict.missingFromGapAnalysis) console.log(`  ${f.label}`);
  }

  // ── coverage expectations, declared by the package before the run ──────────
  const coverageFacts = facts.filter((f) => f.expectation === "recharacterised" || f.expectation === "still_open");
  const checks = coverageFacts.map((f) => ({
    gap: f.label,
    expectation: f.expectation as "recharacterised" | "still_open",
    terms: f.label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 2),
  }));
  const coverage = checkCoverage(checks, control.all, treatment.all);
  console.log(`\nCOVERAGE — against the package's own declaration`);
  for (const c of coverage) {
    console.log(`  ${c.pass ? "pass" : "FAIL"}  [${c.expectation}] ${c.gap.slice(0, 52).padEnd(54)} ${c.note}`);
  }

  // ── negative controls ─────────────────────────────────────────────────────
  const prohibitions: string[] = read(TREATMENT, "forbidden-claims.json");
  const prohibited = checkProhibitions(treatment.deck, prohibitions);
  const lower = treatment.all.toLowerCase();
  const negatives = [
    {
      name: "planning figures not presented as measured",
      pass: /planning figure|not measured|synthetic|not a measured|planning-grade|not finance-confirmed|unvalidated/i.test(treatment.all),
      note: "the deck must qualify the uploaded figures somewhere on its face",
    },
    {
      name: "not framed as an opportunity case",
      pass: !/\b(opportunity case|the opportunity is|savings opportunity of)\b/i.test(lower),
      note: "the package states the capability is already production enterprise-wide",
    },
    {
      name: "no prohibited claim asserted",
      pass: prohibited.clean,
      note: `${prohibitions.length} prohibitions over ${prohibited.sentencesScanned} sentences`,
    },
  ];
  console.log(`\nNEGATIVE CONTROLS`);
  for (const n of negatives) console.log(`  ${n.pass ? "pass" : "FAIL"}  ${n.name.padEnd(46)} ${n.note}`);
  for (const f of prohibited.findings.slice(0, 4)) console.log(`      ${f.sentence.slice(0, 90)}`);

  const coveragePass = coverage.every((c) => c.pass);
  const negativesPass = negatives.every((n) => n.pass);
  const ok = verdict.ok && coveragePass && negativesPass;

  fs.writeFileSync(
    path.join(TREATMENT, "smoke-p2-traceability.json"),
    JSON.stringify({ ok, stages: verdict.stages, facts: verdict.facts, coverage, negatives, prohibited }, null, 2),
  );

  console.log(
    `\nSMOKE: ${ok ? "PASS" : "FAIL"}  (funnel ${verdict.ok ? "ok" : "FAIL"}, coverage ${coveragePass ? "ok" : "FAIL"}, negatives ${negativesPass ? "ok" : "FAIL"})`,
  );
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
