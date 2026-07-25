import "server-only";

// PR6 — the editable Roadmap Detail DOCX renderer.
//
// Renders the shared RoadmapPresentationContract (PR4) into a comprehensive,
// EDITABLE Word document: a concise executive summary up front, then the
// detailed workstream/gate/milestone/dependency/KPI/risk/governance/evidence
// content in appendices — so the executive artifact stays tight while the detail
// is preserved. Native Word paragraphs + tables (via the shared docx-base
// helpers); never composed of screenshots. In-house `docx`; no data egress.

import { Document, Packer } from "docx";

import {
  bodyParagraph,
  bodyRun,
  boldRun,
  coverTitleParagraph,
  coverSubtitleParagraph,
  eyebrowParagraph,
  governanceNoticeParagraph,
  heading1,
  heading2,
  pageBreak,
  ORDERED_NUMBERING_CONFIG,
  DOCX_CONTENT_TYPE,
} from "@/lib/exports-shared/docx-base";
import { buildMultiColumnTable } from "@/lib/exports-shared/structured-docx-base";

import {
  roadmapContractStamp,
  type RoadmapEvidenceStatus,
  type RoadmapPresentationContract,
} from "./roadmap-presentation-contract";
import {
  roadmapLifecycleSentence,
  roadmapLifecycleTag,
  type RoadmapLifecycle,
} from "./roadmap-lifecycle";

export { DOCX_CONTENT_TYPE as ROADMAP_DOCX_CONTENT_TYPE };

const EVIDENCE_TEXT: Record<RoadmapEvidenceStatus, string> = {
  approved: "Approved",
  recommended: "Recommended",
  illustrative: "Illustrative",
  client_decision_required: "Client decision required",
  evidence_required: "Evidence required",
};

function lifecycleFromContract(
  contract: RoadmapPresentationContract,
): RoadmapLifecycle {
  const state = contract.lifecycleState;
  return {
    state,
    isEntered: true,
    isFinal: state === "exit_approved_final",
    isReviewDraft: state === "review_draft",
  };
}

/** Build the Roadmap Detail Document. Pure (contract → Document). */
export function buildRoadmapDetailDocument(
  contract: RoadmapPresentationContract,
): Document {
  const lifecycle = lifecycleFromContract(contract);
  const children = [
    eyebrowParagraph(
      `${contract.lineage.tenantKey} · Move ${contract.lineage.moveId} · Phase ${contract.phase} · Executive Roadmap (detail)`,
    ),
    coverTitleParagraph(contract.executiveConclusion),
    coverSubtitleParagraph(`Sponsor decision: ${contract.sponsorDecision}`),
    governanceNoticeParagraph(
      `${roadmapLifecycleTag(lifecycle)} —`,
      `${roadmapLifecycleSentence(lifecycle, contract.phase)} (${roadmapContractStamp(contract)})`,
    ),

    // ── Executive summary (concise — the exec-readable part) ──
    heading1("1. Executive summary"),
    bodyParagraph([bodyRun(contract.executiveConclusion)]),
    heading2("Horizons and the outcome each achieves"),
    buildMultiColumnTable({
      columns: [
        { header: "Horizon", widthPercent: 30, extract: (h) => h.name },
        {
          header: "Outcome achieved",
          widthPercent: 70,
          extract: (h) => h.outcome,
        },
      ],
      rows: contract.horizons,
    }),
    heading2("Decision required"),
    bodyParagraph([
      boldRun("Sponsor decision: "),
      bodyRun(contract.sponsorDecision),
    ]),

    // ── Detail appendices ──
    pageBreak(),
    heading1("Appendix A — Workstream detail by horizon"),
    contract.workstreamItems.length
      ? buildMultiColumnTable({
          columns: [
            {
              header: "Workstream",
              widthPercent: 25,
              extract: (w) => w.workstream,
            },
            { header: "Horizon", widthPercent: 25, extract: (w) => w.horizon },
            { header: "Outcome", widthPercent: 35, extract: (w) => w.outcome },
            {
              header: "Evidence",
              widthPercent: 15,
              extract: (w) => EVIDENCE_TEXT[w.evidenceStatus],
            },
          ],
          rows: contract.workstreamItems,
        })
      : bodyParagraph([
          bodyRun(
            "Workstream detail is captured in the executive summary horizons.",
          ),
        ]),

    heading1("Appendix B — Decision gates"),
    ...(contract.decisionGates.length
      ? contract.decisionGates.map((g) =>
          bodyParagraph([
            boldRun(`${g.name}`),
            bodyRun(
              `${g.betweenHorizons ? ` (${g.betweenHorizons})` : ""}${g.criteria ? ` — ${g.criteria}` : ""}`,
            ),
          ]),
        )
      : [bodyParagraph([bodyRun("No decision gates recorded.")])]),

    heading1("Appendix C — Value milestones"),
    ...(contract.valueMilestones.length
      ? contract.valueMilestones.map((m) =>
          bodyParagraph([
            boldRun(m.name),
            bodyRun(m.horizon ? ` — ${m.horizon}` : ""),
          ]),
        )
      : [bodyParagraph([bodyRun("No value milestones recorded.")])]),

    heading1("Appendix D — Dependencies and evidence status"),
    contract.dependencies.length
      ? buildMultiColumnTable({
          columns: [
            { header: "Dependency", widthPercent: 55, extract: (d) => d.item },
            {
              header: "Evidence status",
              widthPercent: 25,
              extract: (d) => EVIDENCE_TEXT[d.evidenceStatus],
            },
            { header: "Note", widthPercent: 20, extract: (d) => d.note ?? "" },
          ],
          rows: contract.dependencies,
        })
      : bodyParagraph([bodyRun("No dependencies recorded.")]),

    heading1("Appendix E — Risks"),
    ...(contract.risks.length
      ? contract.risks.map((r) => bodyParagraph([bodyRun(`• ${r}`)]))
      : [bodyParagraph([bodyRun("No risks recorded.")])]),

    heading1("Appendix F — Caveats"),
    ...(contract.caveats.length
      ? contract.caveats.map((c) => bodyParagraph([bodyRun(`• ${c}`)]))
      : [bodyParagraph([bodyRun("No caveats recorded.")])]),

    heading1("Appendix G — Supporting detail"),
    ...(contract.appendix.length
      ? contract.appendix.map((a) => bodyParagraph([bodyRun(a)]))
      : [bodyParagraph([bodyRun("No additional supporting detail.")])]),

    heading1("Appendix H — Lineage and provenance"),
    bodyParagraph([
      boldRun("Move: "),
      bodyRun(contract.lineage.moveId),
      boldRun("   Tenant: "),
      bodyRun(contract.lineage.tenantKey),
    ]),
    ...(contract.lineage.architectureRef
      ? [
          bodyParagraph([
            boldRun("Architecture lineage: "),
            bodyRun(
              `accepted P3 architecture (audit ref ${contract.lineage.architectureRef})`,
            ),
          ]),
        ]
      : []),
    bodyParagraph([
      boldRun("Contract: "),
      bodyRun(roadmapContractStamp(contract)),
    ]),
  ];

  return new Document({
    creator: "AbarVa · Moves",
    title: `Executive Roadmap (detail) · Move ${contract.lineage.moveId}`,
    description: `Roadmap detail · contract ${contract.contentHash}`,
    numbering: ORDERED_NUMBERING_CONFIG,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });
}

/** Render the Roadmap Detail DOCX as an editable Word Buffer. */
export function renderRoadmapDetailDocx(
  contract: RoadmapPresentationContract,
): Promise<Buffer> {
  return Packer.toBuffer(
    buildRoadmapDetailDocument(contract),
  ) as unknown as Promise<Buffer>;
}
