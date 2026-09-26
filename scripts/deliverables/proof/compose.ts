/**
 * Proof driver — the permanent composer architecture, three model jobs:
 *
 *   1. STORY PLAN   full governed packet in, structured plan out, no Python
 *      → deterministic plan gate
 *   2. CODE         the accepted plan plus ONLY the facts it allocated,
 *                   emitted as one function per slide, in batches
 *      → deterministic assembly, static gate, sandbox
 *   3. (visual-review.ts) critique and one bounded revision
 *
 * The separation is not a workaround for a token ceiling. It is what lets the
 * plan be validated before any code is paid for, keeps the code call from
 * re-deciding the story, and makes a revision able to touch three slides instead
 * of two thousand lines.
 *
 * Every intermediate is written with its hash: the audit unit is
 * (packet, plan, composer source, runtime, PPTX), not the model call.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/deliverables/orchestrator/orchestrator";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import { judgeRenderedDeck } from "@/lib/deliverables/orchestrator/deck-quality";
import {
  freezePresentationPacket,
  sha256,
  type SlideStoryPlanEntry,
} from "@/lib/deliverables/composer/presentation-packet";
import { validateDeckLineage, type DerivedFigure, type LedgerEntry } from "@/lib/deliverables/composer/number-ledger";
import { validateSlideStoryPlan, narrowPacketForCode } from "@/lib/deliverables/composer/plan-gate";
import { assembleComposerModule, type SlideFunction } from "@/lib/deliverables/composer/assemble-module";
import { deliverableModel } from "@/lib/deliverables/model-policy";
import { COMPOSER_SYSTEM, buildComposerUser, buildCodeBatchUser } from "./composer-prompt";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const LABEL = process.argv[3] ?? "A";
const REUSE_PLAN = process.argv.includes("--reuse-plan");
const BATCH = Number(process.env.COMPOSER_BATCH ?? 5);
const REPO = path.resolve(__dirname, "../../..");
const COMPOSER_DIR = path.join(REPO, "scripts/deliverables/composer");
const PYTHON = process.env.COMPOSER_PYTHON ?? "python3";

const doc = JSON.parse(fs.readFileSync(path.join(OUT, "governed-document.json"), "utf8"));
const ledger: LedgerEntry[] = JSON.parse(fs.readFileSync(path.join(OUT, "number-ledger.json"), "utf8"));
const request = JSON.parse(fs.readFileSync(path.join(OUT, "request.json"), "utf8"));

const apiKey =
  process.env.ANTHROPIC_API_KEY ??
  fs.readFileSync("/Users/anand/Projects/nexus/.env.local", "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m)![1].trim();

const client = new Anthropic({ apiKey });
const model = deliverableModel();
let totalIn = 0;
let totalOut = 0;

async function call(label: string, system: string, userText: string, maxTokens: number) {
  const started = Date.now();
  const response = await client.messages
    .stream({ model, system, messages: [{ role: "user", content: userText }], max_tokens: maxTokens })
    .finalMessage();
  const body = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  totalIn += response.usage.input_tokens;
  totalOut += response.usage.output_tokens;
  console.log(
    `  ${label.padEnd(10)} in ${response.usage.input_tokens.toLocaleString().padStart(7)} ` +
      `out ${response.usage.output_tokens.toLocaleString().padStart(6)} ` +
      `${((Date.now() - started) / 1000).toFixed(0)}s stop=${response.stop_reason}`,
  );
  // Opus 5 charges thinking against max_tokens. A silent truncation here becomes
  // a missing slide three steps later, so it is named at the point it happens.
  if (response.stop_reason === "max_tokens") {
    console.error(`  ${label}: HIT THE OUTPUT CEILING — the artifact is truncated, not short`);
  }
  return { body, response };
}

async function main() {
  // ── 1 · freeze ────────────────────────────────────────────────────────────
  const frozen = freezePresentationPacket({
    document: doc,
    ledger,
    artifactVersionId: `proof-${sha256(JSON.stringify(doc)).slice(0, 12)}`,
    artifactType: request.deliverableType,
    moveId: "proof-move",
    tenantKey: request.clientDisplayName,
    audience: request.audience,
    decisionSupported: request.decisionContext,
    slideGuidance: { min: 12, max: 18, purpose: "the design and its control points" },
    themeVersion: "abarva-v3",
  });
  fs.writeFileSync(path.join(OUT, "packet.json"), frozen.canonicalJson);
  console.log(`packet:        ${frozen.packetHash.slice(0, 16)}  ${frozen.canonicalJson.length.toLocaleString()} chars`);

  const sdkSource = fs.readFileSync(path.join(COMPOSER_DIR, "sdk.py"), "utf8");
  const planUser = buildComposerUser(frozen.packet, sdkSource);

  // ── 2 · story plan ────────────────────────────────────────────────────────
  const planPath = path.join(OUT, `slide-story-plan-${LABEL}.json`);
  let plan: { slideStoryPlan: SlideStoryPlanEntry[]; derivedFigures: DerivedFigure[] };
  if (REUSE_PLAN && fs.existsSync(planPath)) {
    plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
    console.log(`plan:          reused from disk — ${plan.slideStoryPlan.length} slides`);
  } else {
    const planCall = await call(
      "plan",
      COMPOSER_SYSTEM,
      `${planUser}\n\nFOR THIS CALL: return ONLY {"slideStoryPlan": [...], "derivedFigures": [...]}. No Python.`,
      24_000,
    );
    const parsed = extractJson<typeof plan>(planCall.body);
    if (!parsed?.slideStoryPlan?.length) {
      fs.writeFileSync(path.join(OUT, `plan-raw-${LABEL}.txt`), planCall.body);
      console.error("no parseable slide story plan");
      process.exit(1);
    }
    plan = { slideStoryPlan: parsed.slideStoryPlan, derivedFigures: parsed.derivedFigures ?? [] };
    fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
  }

  // ── 3 · plan gate, before a single code token is paid for ─────────────────
  const planVerdict = validateSlideStoryPlan(plan.slideStoryPlan, plan.derivedFigures, {
    packet: frozen.packet,
    ledger,
  });
  fs.writeFileSync(path.join(OUT, `plan-gate-${LABEL}.json`), JSON.stringify(planVerdict, null, 2));
  console.log(
    `plan gate:     ${planVerdict.ok ? "pass" : "FAIL"} — ${planVerdict.slideCount} slides ` +
      `(${planVerdict.coreSlides} core, ${planVerdict.appendixSlides} appendix), ${planVerdict.findings.length} findings`,
  );
  for (const f of planVerdict.findings.slice(0, 12)) console.log(`   ${f.kind}: ${f.message}`);
  if (!planVerdict.ok) {
    console.error("plan rejected; not proceeding to the code call");
    process.exit(3);
  }

  // ── 4 · narrow the code context ───────────────────────────────────────────
  const narrowed = narrowPacketForCode(plan.slideStoryPlan, frozen.packet, ledger);
  console.log(
    `narrowed:      ${narrowed.sections.length} sections, ${narrowed.figures.length} figures ` +
      `(dropped ${narrowed.droppedSections} sections, ${narrowed.droppedFigures} figures the plan never allocated)`,
  );

  // ── 5 · code, one function per slide, in batches ──────────────────────────
  const functions: SlideFunction[] = [];
  for (let i = 0; i < plan.slideStoryPlan.length; i += BATCH) {
    const batch = plan.slideStoryPlan.slice(i, i + BATCH);
    const label = `code ${i + 1}-${Math.min(i + BATCH, plan.slideStoryPlan.length)}`;
    const res = await call(
      label,
      COMPOSER_SYSTEM,
      buildCodeBatchUser(frozen.packet, narrowed, sdkSource, plan.slideStoryPlan, batch),
      28_000,
    );
    const parsed = extractJson<{ functions: SlideFunction[] }>(res.body);
    if (!parsed?.functions?.length) {
      fs.writeFileSync(path.join(OUT, `code-raw-${LABEL}-${i}.txt`), res.body);
      console.error(`  ${label}: no parseable functions`);
      continue;
    }
    functions.push(...parsed.functions);
  }

  // ── 6 · deterministic assembly ────────────────────────────────────────────
  const assembled = assembleComposerModule(plan.slideStoryPlan, functions, frozen.packet.theme.version);
  if (assembled.missing.length || assembled.malformed.length || assembled.extra.length) {
    console.log(
      `assembly:      missing ${assembled.missing.join(", ") || "none"} | ` +
        `malformed ${assembled.malformed.join(", ") || "none"} | extra ${assembled.extra.join(", ") || "none"}`,
    );
  }
  fs.writeFileSync(path.join(OUT, `composer-${LABEL}.py`), assembled.source);
  console.log(
    `python:        ${assembled.source.split("\n").length} lines from ${functions.length} slide functions, ` +
      `sha ${sha256(assembled.source).slice(0, 16)}`,
  );

  // ── 7 · sandbox ───────────────────────────────────────────────────────────
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "composer-run-"));
  const sourcePath = path.join(scratch, "composer.py");
  fs.writeFileSync(sourcePath, assembled.source);
  let sandboxReport: Record<string, unknown>;
  try {
    const stdout = execFileSync(
      PYTHON,
      ["-I", path.join(COMPOSER_DIR, "bootstrap.py"), scratch, sourcePath, COMPOSER_DIR],
      { encoding: "utf8", timeout: 180_000, env: { PATH: "/usr/bin:/bin", HOME: scratch, COMPOSER_CPU_SECONDS: "90" } },
    );
    sandboxReport = JSON.parse(stdout.trim().split("\n").pop() ?? "{}");
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    try {
      sandboxReport = JSON.parse((e.stdout ?? "").trim().split("\n").pop()!);
    } catch {
      sandboxReport = { ok: false, stage: "spawn", error: (e.stderr ?? "").slice(-800) };
    }
  }
  fs.writeFileSync(path.join(OUT, `sandbox-${LABEL}.json`), JSON.stringify(sandboxReport, null, 2));
  console.log(`sandbox:       ${sandboxReport.ok ? "ok" : `FAILED at ${sandboxReport.stage} — ${sandboxReport.error}`}`);
  if (!sandboxReport.ok) process.exit(2);

  const buffer = fs.readFileSync(path.join(scratch, "deck.pptx"));
  fs.writeFileSync(path.join(OUT, `deck-composed-${LABEL}.pptx`), buffer);

  // ── 8 · gates over the rendered file ──────────────────────────────────────
  const inspection = await inspectDeck(buffer);
  const verdict = judgeRenderedDeck(inspection, {
    minSlides: 10,
    maxSlides: 24,
    rolesByIndex: Object.fromEntries(plan.slideStoryPlan.map((s, i) => [i + 1, s.slideType])),
  });
  const lineage = validateDeckLineage(inspection, {
    ledger,
    derived: plan.derivedFigures,
    calendarYears: new Set(frozen.packet.calendarYears),
  });

  console.log(
    `rendered:      ${inspection.slideCount} slides at ${inspection.canvasWidthIn}x${inspection.canvasHeightIn}in, ` +
      `${inspection.slides.reduce((s, x) => s + x.visibleChars, 0).toLocaleString()} visible chars`,
  );
  console.log(`integrity:     ${verdict.ok ? "pass" : "FAIL"} — ${verdict.findings.length} findings`);
  for (const f of verdict.findings.slice(0, 10)) console.log(`   ${f.kind}: ${f.message}`);
  console.log(
    `lineage:       ${lineage.ok ? "pass" : "FAIL"} — ${lineage.claimsChecked} claims / ` +
      `${lineage.matchedToLedger} ledger / ${lineage.matchedToDerived} derived / ` +
      `${lineage.exemptStructural} structural / ${lineage.findings.length} unsupported`,
  );
  for (const f of lineage.findings.slice(0, 15)) console.log(`   ${f.message}`);

  // ── 9 · manifest ──────────────────────────────────────────────────────────
  fs.writeFileSync(
    path.join(OUT, `manifest-${LABEL}.json`),
    JSON.stringify(
      {
        generation: LABEL,
        artifactVersionId: frozen.packet.artifactVersionId,
        composer: { model, provider: "anthropic", promptVersion: "composer-v2-split", batchSize: BATCH },
        packetHash: frozen.packetHash,
        planSha: sha256(JSON.stringify(plan)),
        planGate: planVerdict,
        composerSourceSha: sha256(assembled.source),
        assembly: { missing: assembled.missing, malformed: assembled.malformed, extra: assembled.extra },
        sdkSha: sha256(sdkSource),
        themeVersion: frozen.packet.theme.version,
        pptxSha: sha256(buffer),
        pptxBytes: buffer.length,
        runtime: {
          python: execFileSync(PYTHON, ["-c", "import sys,pptx;print(sys.version.split()[0]+' python-pptx '+pptx.__version__)"], { encoding: "utf8" }).trim(),
        },
        sandbox: sandboxReport,
        integrity: verdict,
        lineage,
        usage: { inputTokens: totalIn, outputTokens: totalOut },
      },
      null,
      2,
    ),
  );
  console.log(`\ntokens:        in ${totalIn.toLocaleString()} out ${totalOut.toLocaleString()}`);
  console.log(`pptx:          deck-composed-${LABEL}.pptx  (sha ${sha256(buffer).slice(0, 16)})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
