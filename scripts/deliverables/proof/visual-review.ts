/**
 * The visual loop: render, critique the pixels, revise once, and let the revision
 * replace the original ONLY if it regresses nothing.
 *
 * "Later is better" is the assumption this file exists to refuse. A revision that
 * improves whitespace and invents a number is a worse deck, and the only way to
 * know is to run the same deterministic gates over both and compare.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";
import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/deliverables/orchestrator/orchestrator";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import { judgeRenderedDeck, type DeckVerdict } from "@/lib/deliverables/orchestrator/deck-quality";
import { validateDeckLineage, type LedgerEntry, type LineageVerdict } from "@/lib/deliverables/composer/number-ledger";
import { sha256 } from "@/lib/deliverables/composer/presentation-packet";
import { deliverableModel } from "@/lib/deliverables/model-policy";
import { COMPOSER_SYSTEM } from "./composer-prompt";
import { renderSlidePngs } from "./render-png";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const REPO = path.resolve(__dirname, "../../..");
const COMPOSER_DIR = path.join(REPO, "scripts/deliverables/composer");
const PYTHON = process.env.COMPOSER_PYTHON ?? "python3";

const ledger: LedgerEntry[] = JSON.parse(fs.readFileSync(path.join(OUT, "number-ledger.json"), "utf8"));
const packet = JSON.parse(fs.readFileSync(path.join(OUT, "packet.json"), "utf8"));
const plan = JSON.parse(fs.readFileSync(path.join(OUT, "slide-story-plan-A.json"), "utf8"));
const pythonA = fs.readFileSync(path.join(OUT, "composer-A.py"), "utf8");

const apiKey = (() => {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const env = fs.readFileSync("/Users/anand/Projects/nexus/.env.local", "utf8");
  return env.match(/^ANTHROPIC_API_KEY=(.+)$/m)![1].trim();
})();

const client = new Anthropic({ apiKey });
const model = deliverableModel();

const CRITIQUE_SYSTEM = `You are reviewing rendered slides as a design-literate partner about to put this deck in front of a CIO, a CFO and a COO.

You are looking at PIXELS, not at the code that made them. Judge what a reader sees.

Assess, per slide and for the deck as a whole: information hierarchy, density, legibility at projection size, alignment, balance, use of whitespace, repetitive composition across slides, diagrams that confuse rather than explain, titles that do not match what the slide shows, crowding and clipping, and whether an executive can take the point in under ten seconds.

Return ONE JSON object:

{
  "deckLevel": ["..."],
  "slides": [ { "slide": 1, "severity": "high|medium|low", "problem": "...", "instruction": "..." } ],
  "strongest": [1, 4],
  "weakest": [7]
}

"instruction" must be a bounded, specific correction the composer can act on — "move the metric row above the grid and cut the caption to one line", not "make it better". Do not ask for content that is not already on the slide. Do not ask for new figures. If a slide is good, leave it out.`;

async function critique(pngs: string[]) {
  const content: Anthropic.ContentBlockParam[] = [
    { type: "text", text: `Deck: ${packet.title}. ${pngs.length} slides follow in order.` },
  ];
  pngs.forEach((p, i) => {
    content.push({ type: "text", text: `Slide ${i + 1}:` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: fs.readFileSync(p).toString("base64") },
    });
  });
  const response = await client.messages
    .stream({ model, system: CRITIQUE_SYSTEM, messages: [{ role: "user", content }], max_tokens: 24_000 })
    .finalMessage();
  const body = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  console.log(
    `  critique in ${response.usage.input_tokens.toLocaleString()} out ${response.usage.output_tokens.toLocaleString()} stop=${response.stop_reason}`,
  );
  return { body, parsed: extractJson<{ deckLevel: string[]; slides: { slide: number; severity: string; problem: string; instruction: string }[]; strongest?: number[]; weakest?: number[] }>(body) };
}

async function revise(critiqueJson: string) {
  const response = await client.messages
    .stream({
      model,
      system: COMPOSER_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            `Here is the Python that produced the deck you just had reviewed, the plan it was drawing, and the reviewer's corrections.`,
            ``,
            `Apply the corrections. Change nothing else — every figure, every claim and every story beat stays. Do not add a number that is not already on a slide.`,
            ``,
            `=== SLIDE STORY PLAN ===`,
            JSON.stringify(plan, null, 1),
            ``,
            `=== VISUAL REVIEW ===`,
            critiqueJson,
            ``,
            `=== CURRENT PYTHON ===`,
            "```python",
            pythonA,
            "```",
            ``,
            `Return ONLY {"pythonSource": "..."} — the complete revised program as a JSON string.`,
          ].join("\n"),
        },
      ],
      max_tokens: 56_000,
    })
    .finalMessage();
  const body = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  console.log(
    `  revise   in ${response.usage.input_tokens.toLocaleString()} out ${response.usage.output_tokens.toLocaleString()} stop=${response.stop_reason}`,
  );
  return extractJson<{ pythonSource: string }>(body);
}

function runSandbox(source: string, label: string) {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), `composer-${label}-`));
  const sourcePath = path.join(scratch, "composer.py");
  fs.writeFileSync(sourcePath, source);
  try {
    const stdout = execFileSync(
      PYTHON,
      ["-I", path.join(COMPOSER_DIR, "bootstrap.py"), scratch, sourcePath, COMPOSER_DIR],
      { encoding: "utf8", timeout: 180_000, env: { PATH: "/usr/bin:/bin", HOME: scratch, COMPOSER_CPU_SECONDS: "90" } },
    );
    return { report: JSON.parse(stdout.trim().split("\n").pop()!), pptx: path.join(scratch, "deck.pptx") };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    let report: Record<string, unknown>;
    try {
      report = JSON.parse((e.stdout ?? "").trim().split("\n").pop()!);
    } catch {
      report = { ok: false, stage: "spawn", error: (e.stderr ?? "").slice(-600) };
    }
    return { report, pptx: null };
  }
}

async function gates(buffer: Buffer, roles: Record<number, string>) {
  const inspection = await inspectDeck(buffer);
  const verdict = judgeRenderedDeck(inspection, {
    minSlides: 10,
    maxSlides: 24,
    rolesByIndex: roles as never,
  });
  const lineage = validateDeckLineage(inspection, {
    ledger,
    derived: plan.derivedFigures ?? [],
    calendarYears: new Set<number>(packet.calendarYears ?? []),
    calendarDates: new Set<string>(packet.calendarDates ?? []),
  });
  return { inspection, verdict, lineage };
}

/**
 * Non-regression. B replaces A only if every hard invariant holds or improves.
 * Each check names what it compared, so a rejection can be read without rerunning.
 */
function nonRegression(
  a: { verdict: DeckVerdict; lineage: LineageVerdict },
  b: { verdict: DeckVerdict; lineage: LineageVerdict },
  planSlides: number,
  bSlides: number,
) {
  const aOff = a.verdict.findings.filter((f) => f.kind === "off_canvas" || f.kind === "canvas").length;
  const bOff = b.verdict.findings.filter((f) => f.kind === "off_canvas" || f.kind === "canvas").length;
  const aBad = new Set(a.lineage.findings.map((f) => ("claim" in f ? f.claim : f.message)));
  const newBad = b.lineage.findings.filter((f) => !aBad.has("claim" in f ? f.claim : f.message));
  const checks = [
    { name: "no new unsupported figures", pass: newBad.length === 0, detail: newBad.map((f) => f.message).join("; ") || "none" },
    { name: "no new bounds or canvas failures", pass: bOff <= aOff, detail: `A ${aOff} -> B ${bOff}` },
    { name: "no lost story beat", pass: bSlides >= planSlides, detail: `plan ${planSlides}, B ${bSlides}` },
    { name: "thin slides not worse", pass:
        b.verdict.findings.filter((f) => f.kind === "thin_slide").length <=
        a.verdict.findings.filter((f) => f.kind === "thin_slide").length,
      detail: `A ${a.verdict.findings.filter((f) => f.kind === "thin_slide").length} -> B ${b.verdict.findings.filter((f) => f.kind === "thin_slide").length}` },
  ];
  return { accepted: checks.every((c) => c.pass), checks };
}

async function main() {
  const roles = Object.fromEntries(
    (plan.slideStoryPlan ?? []).map((s: { slideType: string }, i: number) => [i + 1, s.slideType]),
  );

  console.log("rendering A to PNG…");
  const pngsA = fs.existsSync(path.join(OUT, "png-A"))
    ? fs.readdirSync(path.join(OUT, "png-A")).filter((f) => f.endsWith(".png")).sort().map((f) => path.join(OUT, "png-A", f))
    : renderSlidePngs(path.join(OUT, "deck-composed-A.pptx"), path.join(OUT, "png-A"));
  console.log(`  ${pngsA.length} slide images`);

  console.log("visual critique…");
  const { body: critiqueBody, parsed } = await critique(pngsA);
  fs.writeFileSync(path.join(OUT, "visual-critique-A.json"), critiqueBody);
  console.log(`  ${parsed?.slides?.length ?? 0} slide corrections, ${parsed?.deckLevel?.length ?? 0} deck-level notes`);
  for (const s of (parsed?.slides ?? []).slice(0, 8)) {
    console.log(`   slide ${s.slide} [${s.severity}] ${s.problem.slice(0, 90)}`);
  }

  console.log("revising…");
  const revised = await revise(critiqueBody);
  if (!revised?.pythonSource) {
    console.error("revision did not return python; A stands");
    process.exit(1);
  }
  fs.writeFileSync(path.join(OUT, "composer-B.py"), revised.pythonSource);

  const runB = runSandbox(revised.pythonSource, "B");
  fs.writeFileSync(path.join(OUT, "sandbox-B.json"), JSON.stringify(runB.report, null, 2));
  if (!runB.report.ok || !runB.pptx) {
    console.log(`revision B failed in the sandbox at ${runB.report.stage}: ${runB.report.error}`);
    console.log("A is retained. The rejected revision is recorded.");
    fs.writeFileSync(
      path.join(OUT, "revision-decision.json"),
      JSON.stringify({ accepted: false, reason: "B did not execute", sandbox: runB.report }, null, 2),
    );
    return;
  }

  const bufferB = fs.readFileSync(runB.pptx);
  fs.writeFileSync(path.join(OUT, "deck-composed-B.pptx"), bufferB);
  const bufferA = fs.readFileSync(path.join(OUT, "deck-composed-A.pptx"));
  const gA = await gates(bufferA, roles);
  const gB = await gates(bufferB, roles);

  const decision = nonRegression(gA, gB, plan.slideStoryPlan?.length ?? 0, gB.inspection.slideCount);
  console.log(`\nnon-regression: ${decision.accepted ? "B ACCEPTED" : "B REJECTED — A retained"}`);
  for (const c of decision.checks) console.log(`   ${c.pass ? "ok  " : "FAIL"} ${c.name}: ${c.detail}`);

  fs.writeFileSync(
    path.join(OUT, "revision-decision.json"),
    JSON.stringify(
      {
        accepted: decision.accepted,
        checks: decision.checks,
        a: { pptxSha: sha256(bufferA), slides: gA.inspection.slideCount, integrity: gA.verdict, lineage: gA.lineage },
        b: { pptxSha: sha256(bufferB), slides: gB.inspection.slideCount, integrity: gB.verdict, lineage: gB.lineage },
      },
      null,
      2,
    ),
  );

  if (decision.accepted) {
    console.log("rendering B to PNG…");
    renderSlidePngs(path.join(OUT, "deck-composed-B.pptx"), path.join(OUT, "png-B"));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
