/** Synthetic-only comparison of the component renderer and Anthropic's pptx Skill. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import type { Module as NodeModule } from "node:module";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { parse as parseEnv } from "dotenv";
import type { EditionInputs } from "@/lib/deliverables/orchestrator/reference-deck-inputs";
import type { EditionWords } from "@/lib/deliverables/orchestrator/reference-deck-words";
import type { ReferenceArchetype, ReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-model";
import type { InspectedDeck } from "@/lib/deliverables/orchestrator/deck-inspection";

const COST_CENTS = 30_000_000;
const basis = (annualCents: number[]) => {
  const totalCents = annualCents.reduce((sum, value) => sum + value, 0);
  return { annualCents, totalCents, roi: (totalCents - COST_CENTS) / COST_CENTS };
};

/** This hard-coded fixture is the only content this script can submit to the Skill. */
function syntheticInputs(edition: ReferenceEdition): EditionInputs {
  return {
    edition,
    move: {
      id: "synthetic-skill-lab", name: "Synthetic facility performance",
      archetype: "workflow_automation", problemStatement: "Reporting handoffs need review",
      targetOutcome: "A named owner can confirm each measure",
    } as EditionInputs["move"],
    valueCase: { status: "ready", value: { ok: true, programId: "synthetic-skill-lab", figuresRedacted: false,
      case: { status: "evaluated", economics: {
        annualCashCents: { base: 120_000_000 }, costCents: { base: COST_CENTS },
        threeYearBases: { base: {
          creditedEarned: basis([100_000_000, 120_000_000, 140_000_000]),
          creditedPaid: basis([90_000_000, 110_000_000, 130_000_000]),
          programEarned: basis([120_000_000, 140_000_000, 160_000_000]),
          programPaid: basis([110_000_000, 130_000_000, 150_000_000]),
        } },
      } },
    } },
    register: { status: "ready", value: { figuresRedacted: false, assumptions: [{
      registerId: "V1", statement: "Confirm the baseline", workingFigure: "$1,200",
      source: "Synthetic assumption row", ownerRole: "Data lead", status: "open",
    }] } },
    rom: { status: "gap", detail: "No approved synthetic ROM snapshot is available." },
    citations: { status: "ready", value: [{ citationNumber: 1, url: "https://example.org",
      title: "Synthetic published source", publisher: "Example", publishedAt: null,
      retrievedAt: "2026-10-10", excerpt: "Synthetic excerpt", claim: null }] },
    capture: {
      1: { status: "ready", value: { sponsor_commitment: "Sponsor will review", scope_boundary: "Facility reporting", success_criteria: "Decision clarity" } },
      2: { status: "ready", value: { current_state_findings: "Reporting is fragmented", process_handoffs: "Handoffs need review", data_quality_governance: "Data lead reviews sources" } },
      3: { status: "ready", value: { operating_model: "Data lead owns review", controls_governance: "Council approves access", architecture_integration: "Governed intake", solution_approach: "Review evidence", workflow_delta: "Fewer manual handoffs" } },
    },
  };
}

const words = (count: number): EditionWords[] => Array.from({ length: count }, () => ({
  title: "The governed read identifies the next decision.",
  answer: "Confirm the source and owner before advancing.",
  notes: "The point: the exhibit uses a synthetic governed basis. How to read: follow the source line.",
}));

function scoreNeutral(deck: InspectedDeck, sequence: ReferenceArchetype[]) {
  const findings: string[] = [];
  if (deck.slideCount !== sequence.length) findings.push(`slide count ${deck.slideCount}, expected ${sequence.length}`);
  for (const slide of deck.slides) {
    const text = slide.textRuns.join(" ");
    const archetype = sequence[slide.index - 1];
    const content = archetype !== "cover" && archetype !== "divider";
    if (slide.offCanvas.length) findings.push(`slide ${slide.index}: off-canvas shapes`);
    if (slide.pictureCount) findings.push(`slide ${slide.index}: ${slide.pictureCount} raster picture(s)`);
    if (!slide.notesText?.includes("The point:")) findings.push(`slide ${slide.index}: missing business-case notes`);
    if (content && /\$[\d,.]+|\b\d+(?:\.\d+)?%/.test(text) && !/\bSources?\s*(?::|—|-)/i.test(text))
      findings.push(`slide ${slide.index}: figure has no source line`);
    if (content && !/\bTHE ANSWER\b|\bThe answer\b/i.test(text))
      findings.push(`slide ${slide.index}: no answer bar wording`);
  }
  return { score: Math.max(0, 100 - findings.length * 3), findings };
}

function fileIds(value: unknown, found = new Set<string>()): string[] {
  if (value && typeof value === "object") {
    const row = value as Record<string, unknown>;
    if (typeof row.file_id === "string" && row.file_id.startsWith("file_")) found.add(row.file_id);
    for (const child of Object.values(row)) fileIds(child, found);
  }
  return [...found];
}

function labKey(): string | null {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const envPath = process.env.REFERENCE_DECK_LAB_ENV ?? path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return null;
  return parseEnv(fs.readFileSync(envPath)).ANTHROPIC_API_KEY ?? null;
}

async function main() {
  const edition = process.argv.includes("--investment") ? "investment" : "validation";
  const runSkill = process.argv.includes("--run-skill");
  const rescore = process.argv.includes("--rescore");
  const output = path.join(os.tmpdir(), `reference-deck-skill-lab-${edition}`);
  fs.mkdirSync(output, { recursive: true });

  // The renderer's server-only marker is a Next.js guard. This local lab uses
  // the same server implementation without starting a web request.
  const require = createRequire(import.meta.url);
  const marker = require.resolve("server-only");
  require.cache[marker] = { id: marker, filename: marker, loaded: true, exports: {} } as NodeModule;
  const [{ buildReferenceEdition, VALIDATION_SEQUENCE, INVESTMENT_SEQUENCE },
    { renderReferenceDeck }, { inspectDeck }, { judgeRenderedDeck }] = await Promise.all([
      import("@/lib/deliverables/orchestrator/reference-deck-edition"),
      import("@/lib/deliverables/orchestrator/reference-deck-renderer"),
      import("@/lib/deliverables/orchestrator/deck-inspection"),
      import("@/lib/deliverables/orchestrator/deck-quality"),
    ]);
  const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
  const spec = buildReferenceEdition(syntheticInputs(edition), words(sequence.length));
  const productPptx = await renderReferenceDeck(spec);
  fs.writeFileSync(path.join(output, "component-deck.pptx"), productPptx);
  const productInspected = await inspectDeck(productPptx);
  const productNeutral = scoreNeutral(productInspected, sequence);
  const productStructural = judgeRenderedDeck(productInspected, { referenceDeck: spec }).fidelityScore;
  const brief = JSON.stringify({ edition, slides: spec.slides, sources: spec.sources, figureLedger: spec.figureLedger });
  const prompt = `Create a ${sequence.length}-slide editable PowerPoint deck using Anthropic's pptx Skill. This is a SYNTHETIC lab fixture with no client data. Follow the supplied edition specification exactly: slide order, figures, assumptions, source lines, answer bars, and speaker notes. Use editable shapes and text for every exhibit; no raster chart or table images. Use a warm white, charcoal, and crimson visual system. The validation edition must exclude cost, plan, and solution material. Treat any missing governed input as a visible gap, never a number. Save the final .pptx file.\n\n${brief}`;
  fs.writeFileSync(path.join(output, "synthetic-prompt.txt"), prompt);

  const report: Record<string, unknown> = {
    edition, fixture: "hard-coded synthetic fixture", targetSlides: sequence.length,
    promptSha256: createHash("sha256").update(prompt).digest("hex"),
    product: { neutral: productNeutral, structuralScore: productStructural, slideCount: productInspected.slideCount },
    skill: { status: runSkill ? "requested" : "not_run" },
  };
  if (runSkill) {
    const apiKey = labKey();
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is unavailable for the synthetic lab run");
    const client = new Anthropic({ apiKey, timeout: 900_000 });
    const request = {
      model: "claude-sonnet-4-6", max_tokens: 32_000,
      betas: ["code-execution-2025-08-25", "skills-2025-10-02"],
      container: { skills: [{ type: "anthropic", skill_id: "pptx", version: "latest" }] },
      tools: [{ type: "code_execution_20250825", name: "code_execution" }],
    } satisfies Omit<Anthropic.Beta.Messages.MessageCreateParamsNonStreaming, "messages">;
    type LabMessage = Parameters<typeof client.beta.messages.create>[0]["messages"][number];
    const messages: LabMessage[] = [{ role: "user", content: prompt }];
    let response = await client.beta.messages.create({ ...request, messages });
    for (let continuation = 0; response.stop_reason === "pause_turn" && continuation < 5; continuation++) {
      messages.push({ role: "assistant", content: response.content });
      response = await client.beta.messages.create({ ...request, messages });
    }
    const ids = fileIds(response.content);
    if (!ids.length) throw new Error(`pptx Skill returned no downloadable file (stop_reason=${response.stop_reason})`);
    let skillPptx: Buffer | null = null;
    for (const id of ids.reverse()) {
      const metadata = await client.beta.files.retrieveMetadata(id, { betas: ["files-api-2025-04-14"] });
      if (!metadata.filename.toLowerCase().endsWith(".pptx")) continue;
      const download = await client.beta.files.download(id, { betas: ["files-api-2025-04-14"] });
      skillPptx = Buffer.from(await download.arrayBuffer());
      break;
    }
    if (!skillPptx) throw new Error("pptx Skill returned files but no PowerPoint file");
    const skillInspected = await inspectDeck(skillPptx);
    fs.writeFileSync(path.join(output, "skill-deck.pptx"), skillPptx);
    report.skill = { status: "scored", neutral: scoreNeutral(skillInspected, sequence),
      slideCount: skillInspected.slideCount, model: "claude-sonnet-4-6", skillVersion: "latest" };
  } else if (rescore) {
    const skillPath = path.join(output, "skill-deck.pptx");
    const skillInspected = await inspectDeck(fs.readFileSync(skillPath));
    report.skill = { status: "scored", neutral: scoreNeutral(skillInspected, sequence),
      slideCount: skillInspected.slideCount, model: "claude-sonnet-4-6", skillVersion: "latest" };
  }
  fs.writeFileSync(path.join(output, "comparison.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ output, ...report })}\n`);
}

main().catch((error) => {
  process.stderr.write(`reference-deck-skill-lab: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
