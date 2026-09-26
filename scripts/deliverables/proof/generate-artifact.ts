/**
 * Generate the governed artifact for the model-composed PPTX proof.
 *
 * Runs the REAL multi-pass orchestration (architect → per-section → synthesis)
 * over a governed evidence bundle assembled from one lab tenant's intake CSVs.
 * The output is a genuine RenderableDeliverable, not a fixture — §15 of the
 * increment brief requires the proof to run on substantive governed content.
 *
 * The ModelCaller here talks to Anthropic directly rather than through
 * createAuditedModelCaller: the audited path writes to the AI egress ledger,
 * which is inside the private VNet and unreachable from a workstation. Production
 * generation keeps the audited caller. This is a lab proof driver, and it says so.
 */
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { runDeliverableOrchestration } from "@/lib/deliverables/orchestrator/orchestrator";
import { assertPromptHygiene } from "@/lib/deliverables/composer/prompt-hygiene";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { deliverableModel, DELIVERABLE_MAX_TOKENS } from "@/lib/deliverables/model-policy";
import type {
  DeliverableIntelligenceRequest,
  FormattingProfile,
} from "@/lib/deliverables/orchestrator/types";

const outDir = path.resolve(process.argv[2] ?? "./proof-out");
const raw = JSON.parse(fs.readFileSync(path.join(outDir, "request.json"), "utf8"));

const formattingProfile: FormattingProfile = {
  bodyPointSize: 11,
  headingStyle: "numbered",
  tableStyle: "banded",
  wideDataToExcelCompanion: true,
  includeCoverPage: true,
  includeTableOfContents: true,
  includeSourceRegisterSection: true,
};

const req: DeliverableIntelligenceRequest = {
  ...raw,
  formattingProfile,
  qualityBar: resolveQualityBar(raw.module, raw.deliverableType),
};

const apiKey = (() => {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const env = fs.readFileSync(
    path.resolve("/Users/anand/Projects/nexus/.env.local"),
    "utf8",
  );
  const m = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
  if (!m) throw new Error("ANTHROPIC_API_KEY not found");
  return m[1].trim();
})();

const client = new Anthropic({ apiKey });
const model = deliverableModel();
let calls = 0;
let inTokens = 0;
let outTokens = 0;

async function main() {
  const started = Date.now();
  const result = await runDeliverableOrchestration(
    req,
    async (prompt) => {
      const n = ++calls;
      // Before the spend, not after. A missing field once put "undefined:" into
      // the required-signals block; the model copied it into the document and
      // the quality gate blocked the artifact three steps later.
      assertPromptHygiene(`${prompt.system}\n\n${prompt.user}`, prompt.pass);
      const t0 = Date.now();
      const response = await client.messages
        .stream({
          model,
          system: prompt.system,
          messages: [{ role: "user", content: prompt.user }],
          max_tokens: prompt.maxTokens,
        })
        .finalMessage();
      inTokens += response.usage.input_tokens;
      outTokens += response.usage.output_tokens;
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      console.log(
        `  call ${String(n).padStart(2)} ${prompt.pass.padEnd(16)} ` +
          `in ${String(response.usage.input_tokens).padStart(6)} ` +
          `out ${String(response.usage.output_tokens).padStart(5)} ` +
          `${((Date.now() - t0) / 1000).toFixed(1)}s`,
      );
      fs.writeFileSync(
        path.join(outDir, `pass-${String(n).padStart(2, "0")}-${prompt.pass}.txt`),
        `=== SYSTEM ===\n${prompt.system}\n\n=== USER ===\n${prompt.user}\n\n=== RESPONSE ===\n${text}`,
      );
      return { text, responseId: response.id };
    },
    {
      enforcePlanGate: true,
      enforceQualityGate: false, // capture the document either way; report the verdict
      onProgress: (p) => process.stdout.write(`\r  ${p.pct}% ${p.label}          `),
    },
  );
  process.stdout.write("\n");

  fs.writeFileSync(
    path.join(outDir, "orchestration-result.json"),
    JSON.stringify(result, null, 2),
  );
  const doc = result.document;
  console.log(`\nok: ${result.ok}${result.blockedReason ? ` — ${result.blockedReason}` : ""}`);
  console.log(`model: ${model}  calls: ${calls}  in: ${inTokens.toLocaleString()}  out: ${outTokens.toLocaleString()}`);
  console.log(`elapsed: ${((Date.now() - started) / 1000).toFixed(0)}s`);
  if (!doc) {
    console.error("no document produced");
    process.exit(1);
  }
  fs.writeFileSync(path.join(outDir, "governed-document.json"), JSON.stringify(doc, null, 2));
  const words = doc.generatedSections.reduce(
    (s, x) => s + x.bodyMarkdown.split(/\s+/).filter(Boolean).length,
    0,
  );
  console.log(
    `document: ${doc.generatedSections.length} sections, ${words.toLocaleString()} words, ` +
      `${doc.tables.length} tables, ${doc.exhibits.length} exhibits ` +
      `(${doc.exhibits.filter((e) => e.data).length} with data), ` +
      `${doc.deckSlides?.length ?? 0} authored slides`,
  );
  if (result.quality) {
    console.log(
      `quality: ${result.quality.pass ? "pass" : "FAIL"} ` +
        `blockers=${result.quality.blockers?.length ?? 0} warnings=${result.quality.warnings?.length ?? 0}`,
    );
    for (const b of result.quality.blockers ?? []) console.log(`   blocker: ${b}`);
  }
  void DELIVERABLE_MAX_TOKENS;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
