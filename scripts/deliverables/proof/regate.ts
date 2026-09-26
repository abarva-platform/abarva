/** Re-run the sandbox and the non-regression comparison over an existing revision. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import { judgeRenderedDeck } from "@/lib/deliverables/orchestrator/deck-quality";
import { validateDeckLineage, type LedgerEntry } from "@/lib/deliverables/composer/number-ledger";
import { sha256 } from "@/lib/deliverables/composer/presentation-packet";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const REPO = path.resolve(__dirname, "../../..");
const COMPOSER_DIR = path.join(REPO, "scripts/deliverables/composer");
const PYTHON = process.env.COMPOSER_PYTHON ?? "python3";

const ledger: LedgerEntry[] = JSON.parse(fs.readFileSync(path.join(OUT, "number-ledger.json"), "utf8"));
const packet = JSON.parse(fs.readFileSync(path.join(OUT, "packet.json"), "utf8"));
const plan = JSON.parse(fs.readFileSync(path.join(OUT, "slide-story-plan-A.json"), "utf8"));
/** Governed prose, so a number inside a product name reads as a name. */
const governedDoc = JSON.parse(fs.readFileSync(path.join(OUT, "governed-document.json"), "utf8"));
const GOVERNED_TEXT = [
  ...governedDoc.generatedSections.map((s: { bodyMarkdown: string }) => s.bodyMarkdown),
  ...governedDoc.tables.flatMap((t: { rows: string[][] }) => t.rows.flat()),
  governedDoc.recommendation,
].join("\n");
const roles = Object.fromEntries(plan.slideStoryPlan.map((s: { slideType: string }, i: number) => [i + 1, s.slideType]));

function run(label: string) {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), `regate-${label}-`));
  const src = path.join(scratch, "composer.py");
  fs.copyFileSync(path.join(OUT, `composer-${label}.py`), src);
  try {
    const out = execFileSync(PYTHON, ["-I", path.join(COMPOSER_DIR, "bootstrap.py"), scratch, src, COMPOSER_DIR], {
      encoding: "utf8",
      timeout: 180_000,
      env: { PATH: "/usr/bin:/bin", HOME: scratch, COMPOSER_CPU_SECONDS: "90" },
    });
    return { report: JSON.parse(out.trim().split("\n").pop()!), pptx: path.join(scratch, "deck.pptx") };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    let report: Record<string, unknown>;
    try {
      report = JSON.parse((e.stdout ?? "").trim().split("\n").pop()!);
    } catch {
      report = { ok: false, stage: "spawn", error: (e.stderr ?? "").slice(-500) };
    }
    return { report, pptx: null };
  }
}

async function gates(buffer: Buffer) {
  const inspection = await inspectDeck(buffer);
  return {
    inspection,
    verdict: judgeRenderedDeck(inspection, { minSlides: 10, maxSlides: 24, rolesByIndex: roles as never }),
    lineage: validateDeckLineage(inspection, {
      ledger,
      derived: plan.derivedFigures ?? [],
      calendarYears: new Set<number>(packet.calendarYears ?? []),
      calendarDates: new Set<string>(packet.calendarDates ?? []),
      governedText: GOVERNED_TEXT,
    }),
  };
}

async function main() {
  const a = run("A");
  const b = run("B");
  console.log(`A sandbox: ${a.report.ok ? "ok" : `FAILED — ${a.report.error}`}`);
  console.log(`B sandbox: ${b.report.ok ? "ok" : `FAILED — ${b.report.error}`}`);
  if (!a.pptx || !b.pptx) {
    fs.writeFileSync(path.join(OUT, "revision-decision.json"), JSON.stringify({ accepted: false, reason: "a deck did not execute", a: a.report, b: b.report }, null, 2));
    return;
  }
  const bufA = fs.readFileSync(a.pptx);
  const bufB = fs.readFileSync(b.pptx);
  const gA = await gates(bufA);
  const gB = await gates(bufB);

  const off = (v: typeof gA.verdict) => v.findings.filter((f) => f.kind === "off_canvas" || f.kind === "canvas").length;
  const thin = (v: typeof gA.verdict) => v.findings.filter((f) => f.kind === "thin_slide").length;
  const aBad = new Set(gA.lineage.findings.map((f) => ("claim" in f ? f.claim : f.message)));
  const newBad = gB.lineage.findings.filter((f) => !aBad.has("claim" in f ? f.claim : f.message));

  const checks = [
    { name: "no new unsupported figures", pass: newBad.length === 0, detail: newBad.map((f) => f.message).join("; ") || "none" },
    { name: "no new bounds or canvas failures", pass: off(gB.verdict) <= off(gA.verdict), detail: `A ${off(gA.verdict)} → B ${off(gB.verdict)}` },
    { name: "no lost story beat", pass: gB.inspection.slideCount >= plan.slideStoryPlan.length, detail: `plan ${plan.slideStoryPlan.length}, B ${gB.inspection.slideCount}` },
    { name: "thin slides not worse", pass: thin(gB.verdict) <= thin(gA.verdict), detail: `A ${thin(gA.verdict)} → B ${thin(gB.verdict)}` },
  ];
  const accepted = checks.every((c) => c.pass);

  console.log(`\nA: ${gA.inspection.slideCount} slides, ${gA.inspection.slides.reduce((s, x) => s + x.visibleChars, 0).toLocaleString()} chars, lineage ${gA.lineage.findings.length} findings`);
  console.log(`B: ${gB.inspection.slideCount} slides, ${gB.inspection.slides.reduce((s, x) => s + x.visibleChars, 0).toLocaleString()} chars, lineage ${gB.lineage.findings.length} findings`);
  console.log(`\nnon-regression: ${accepted ? "B ACCEPTED" : "B REJECTED — A retained"}`);
  for (const c of checks) console.log(`   ${c.pass ? "ok  " : "FAIL"} ${c.name}: ${c.detail}`);

  fs.writeFileSync(
    path.join(OUT, "revision-decision.json"),
    JSON.stringify({ accepted, checks, a: { pptxSha: sha256(bufA), slides: gA.inspection.slideCount, integrity: gA.verdict, lineage: gA.lineage }, b: { pptxSha: sha256(bufB), slides: gB.inspection.slideCount, integrity: gB.verdict, lineage: gB.lineage } }, null, 2),
  );
  if (accepted) {
    fs.writeFileSync(path.join(OUT, "deck-composed-B.pptx"), bufB);
    console.log("\nB written to deck-composed-B.pptx");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
