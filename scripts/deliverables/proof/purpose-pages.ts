/** Offline layout probe. No model calls, database access or tenant data. */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { Packer } from "docx";
import {
  purposeFixture,
  purposeChartFixture,
} from "@/lib/deliverables/orchestrator/__fixtures__/purpose-pages";
import { planPurposePages } from "@/lib/deliverables/orchestrator/purpose-page-plan";
import { renderPurposeDeck } from "@/lib/deliverables/orchestrator/purpose-page-renderer";
import {
  renderDeliverableDocx,
  renderDeliverablePptx,
} from "@/lib/deliverables/orchestrator/renderers";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";

async function main() {
  if (!process.argv[2])
    throw new Error("Pass an output directory outside the repository.");
  const out = resolve(process.argv[2]);
  if (out.startsWith(`${process.cwd()}/`))
    throw new Error("Proof output must remain outside the repository.");
  mkdirSync(out, { recursive: true });
  const doc = purposeFixture(),
    chart = purposeChartFixture();
  const pages = planPurposePages(doc, [chart]);
  const next = await renderPurposeDeck(doc, [chart]);
  writeFileSync(join(out, "Discovery-Layout-Probe.pptx"), next);
  writeFileSync(
    join(out, "Discovery-Legacy-Comparison.pptx"),
    await renderDeliverablePptx({ ...doc, purposePageDesign: false }),
  );
  const charter = {
    ...doc,
    deliverableType: "charter",
    title: "Service experience discovery charter",
    exhibits: [],
    tables: [],
    generatedSections: [
      {
        key: "charter_decision",
        title: "Decision requested",
        bodyMarkdown:
          "The sponsor is asked to authorize a bounded discovery study. Build funding, production access and any benefit commitment require separate approval. The study will establish the service perimeter and the evidence needed to compare options [1].",
        citationsUsed: [1],
        groundingMode: "mixed" as const,
      },
      {
        key: "opportunity_context",
        title: "Business question",
        bodyMarkdown:
          "The team wants to understand whether process redesign or agent support could improve the service experience. Current observations do not establish a financial benefit. Discovery must reconcile the measurement definitions before a business case is developed [2].",
        citationsUsed: [2],
        groundingMode: "mixed" as const,
      },
      {
        key: "scope",
        title: "Scope boundary",
        bodyMarkdown:
          "| In scope | Out of scope |\n|---|---|\n| Reviewed service workflow | Autonomous service decisions |\n| Evidence and measurement definitions | Production system write access |\n| Options for human review | Build funding or savings commitments |\n\nThe service owner must confirm the perimeter [1].",
        citationsUsed: [1],
        groundingMode: "mixed" as const,
      },
      {
        key: "success_measures",
        title: "Evidence required",
        bodyMarkdown:
          "The data owner will reconcile inclusion rules and reporting periods. The sponsor will review the resulting baseline before agreeing any target. Missing values remain open inputs rather than zero [2].",
        citationsUsed: [2],
        groundingMode: "mixed" as const,
      },
      {
        key: "sponsorship_governance",
        title: "Governance and controls",
        bodyMarkdown:
          "The service owner confirms scope. The data owner confirms definitions. An authorized sponsor records whether to proceed. Evidence review, document generation and phase approval remain separate actions [1].",
        citationsUsed: [1],
        groundingMode: "mixed" as const,
      },
      {
        key: "authorization_conditions",
        title: "Conditions for the next decision",
        bodyMarkdown:
          "The next decision requires a reconciled baseline, a confirmed service boundary and a comparison of the options. This draft does not record authorization to begin implementation [1] [2].",
        citationsUsed: [1, 2],
        groundingMode: "mixed" as const,
      },
    ],
  };
  writeFileSync(
    join(out, "Charter-Layout-Probe.docx"),
    await Packer.toBuffer(renderDeliverableDocx(charter)),
  );
  writeFileSync(
    join(out, "Charter-Legacy-Comparison.docx"),
    await Packer.toBuffer(
      renderDeliverableDocx({ ...charter, purposePageDesign: false }),
    ),
  );
  const inspection = await inspectDeck(next);
  writeFileSync(
    join(out, "layout-proof.json"),
    JSON.stringify(
      {
        basis:
          "Minimal synthetic layout fixture; not a tenant generation or golden-content benchmark",
        families: [...new Set(pages.map((page) => page.family))],
        pages: pages.map(({ id, title, family }) => ({ id, title, family })),
        physicalInspection: inspection,
        rasterReview: "required separately",
        fidelityScore: null,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      out,
      slides: pages.length,
      families: new Set(pages.map((page) => page.family)).size,
    }),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
