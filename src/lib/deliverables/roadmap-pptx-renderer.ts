import "server-only";

// PR5 — the editable Executive Roadmap PowerPoint renderer.
//
// Renders the shared RoadmapPresentationContract (PR4) into a real .pptx whose
// content is NATIVE editable PowerPoint objects — text boxes, shapes, connectors
// and tables — never a flattened full-slide image. ~4-6 message-led slides.
// Titles, conclusions, horizon outcomes, gates, milestones, labels and evidence
// status tags all remain individually editable. Generated fully in-house
// (pptxgenjs); no external presentation service, no client-data egress.

import pptxgen from "pptxgenjs";

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

export const ROADMAP_PPTX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

type PptxShapeType = Parameters<pptxgen.Slide["addShape"]>[0];
type PptxTableRows = Parameters<pptxgen.Slide["addTable"]>[0];

const C = {
  ink: "1B1A17",
  muted: "6F6A61",
  paper: "F8F7F4",
  panel: "FFFFFF",
  line: "D8D0C1",
  band: "F1EEE7",
  blue: "0B4A91",
  gate: "E8CF8A",
  gateFill: "FDF6E3",
  fresh: "2D7D46",
  warn: "BD7B12",
  white: "FFFFFF",
};

/** Evidence-status → readable label + color. Statuses stay visible on every surface. */
const EVIDENCE_LABEL: Record<
  RoadmapEvidenceStatus,
  { text: string; color: string }
> = {
  approved: { text: "Approved", color: C.fresh },
  recommended: { text: "Recommended", color: C.blue },
  illustrative: { text: "Illustrative", color: C.muted },
  client_decision_required: { text: "Client decision required", color: C.warn },
  evidence_required: { text: "Evidence required", color: C.warn },
};

function lifecycleFromContract(
  contract: RoadmapPresentationContract,
): RoadmapLifecycle {
  const state = contract.lifecycleState;
  // A contract-backed roadmap is always for an entered phase (it was generated).
  return {
    state,
    isEntered: true,
    isFinal: state === "exit_approved_final",
    isReviewDraft: state === "review_draft",
  };
}

/** Governance banner + contract stamp, shown small at the foot of every slide. */
function addFooter(
  slide: pptxgen.Slide,
  contract: RoadmapPresentationContract,
  lifecycle: RoadmapLifecycle,
): void {
  slide.addText(
    `${roadmapLifecycleTag(lifecycle)} · ${roadmapContractStamp(contract)}`,
    {
      x: 0.4,
      y: 7.05,
      w: 12.5,
      h: 0.3,
      fontSize: 8,
      color: C.muted,
      align: "left",
      fontFace: "Aptos",
    },
  );
}

function addTitle(slide: pptxgen.Slide, title: string): void {
  // Message-led title — native editable text, wrapped, never clipped.
  slide.addText(title, {
    x: 0.4,
    y: 0.35,
    w: 12.5,
    h: 1.1,
    fontSize: 22,
    bold: true,
    color: C.ink,
    align: "left",
    valign: "top",
    fontFace: "Aptos Display",
    wrap: true,
  });
}

function evidenceTag(status: RoadmapEvidenceStatus) {
  return EVIDENCE_LABEL[status] ?? EVIDENCE_LABEL.evidence_required;
}

/** Slide 1 — the executive conclusion + the sponsor decision required. */
function addConclusionSlide(
  pptx: pptxgen,
  contract: RoadmapPresentationContract,
  lifecycle: RoadmapLifecycle,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addTitle(slide, contract.executiveConclusion);

  slide.addText(
    [
      {
        text: "Decision required of the sponsor\n",
        options: { bold: true, fontSize: 13, color: C.blue },
      },
      {
        text: contract.sponsorDecision,
        options: { fontSize: 13, color: C.ink },
      },
    ],
    {
      x: 0.4,
      y: 1.7,
      w: 12.5,
      h: 1.1,
      fontFace: "Aptos",
      valign: "top",
      wrap: true,
    },
  );

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.4,
    y: 3.0,
    w: 12.5,
    h: 0.9,
    fill: { color: C.band },
    line: { color: C.line, width: 0.75 },
  });
  slide.addText(roadmapLifecycleSentence(lifecycle, contract.phase), {
    x: 0.6,
    y: 3.05,
    w: 12.1,
    h: 0.8,
    fontSize: 11,
    italic: true,
    color: C.muted,
    fontFace: "Aptos",
    valign: "middle",
    wrap: true,
  });

  addFooter(slide, contract, lifecycle);
}

/** Slide 2 — four horizons (native band shapes), leading with outcomes, plus gates. */
function addHorizonSlide(
  pptx: pptxgen,
  contract: RoadmapPresentationContract,
  lifecycle: RoadmapLifecycle,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addTitle(slide, "How the transition sequences — outcome by horizon");

  const horizons = contract.horizons.slice(0, 4);
  const top = 1.7;
  const bandH = 1.05;
  const gap = 0.2;
  horizons.forEach((h, i) => {
    const y = top + i * (bandH + gap);
    // native editable band shape
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.4,
      y,
      w: 3.0,
      h: bandH,
      fill: { color: C.band },
      line: { color: C.line, width: 0.75 },
      rectRadius: 0.06,
    });
    slide.addText(h.name, {
      x: 0.5,
      y: y + 0.08,
      w: 2.8,
      h: bandH - 0.16,
      fontSize: 12,
      bold: true,
      color: C.ink,
      fontFace: "Aptos",
      valign: "middle",
      wrap: true,
    });
    // outcome-led text (native)
    slide.addText(h.outcome, {
      x: 3.6,
      y: y + 0.08,
      w: 9.3,
      h: bandH - 0.16,
      fontSize: 12,
      color: C.ink,
      fontFace: "Aptos",
      valign: "middle",
      wrap: true,
    });
    // decision-gate diamond between horizons (native shape)
    if (i < horizons.length - 1) {
      slide.addShape(pptx.ShapeType.diamond, {
        x: 1.75,
        y: y + bandH - 0.05,
        w: 0.3,
        h: gap + 0.1,
        fill: { color: C.gateFill },
        line: { color: C.gate, width: 1 },
      });
    }
  });

  // named decision gates listed as native text (editable)
  if (contract.decisionGates.length) {
    slide.addText(
      [
        { text: "Decision gates: ", options: { bold: true, color: C.blue } },
        {
          text: contract.decisionGates.map((g) => g.name).join(" · "),
          options: { color: C.ink },
        },
      ],
      {
        x: 0.4,
        y: 6.5,
        w: 12.5,
        h: 0.4,
        fontSize: 10,
        fontFace: "Aptos",
        wrap: true,
      },
    );
  }
  addFooter(slide, contract, lifecycle);
}

/** Slide 3 — critical dependencies with evidence status (native table). */
function addDependencySlide(
  pptx: pptxgen,
  contract: RoadmapPresentationContract,
  lifecycle: RoadmapLifecycle,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addTitle(slide, "What must be true — dependencies and evidence status");

  const header = [
    {
      text: "Dependency",
      options: { bold: true, color: C.white, fill: { color: C.blue } },
    },
    {
      text: "Evidence status",
      options: { bold: true, color: C.white, fill: { color: C.blue } },
    },
    {
      text: "Note",
      options: { bold: true, color: C.white, fill: { color: C.blue } },
    },
  ];
  const body = contract.dependencies.slice(0, 8).map((d) => {
    const tag = evidenceTag(d.evidenceStatus);
    return [
      { text: d.item, options: { color: C.ink } },
      { text: tag.text, options: { color: tag.color, bold: true } },
      { text: d.note ?? "", options: { color: C.muted } },
    ];
  });
  const rows: PptxTableRows = [header, ...body];
  slide.addTable(rows, {
    x: 0.4,
    y: 1.7,
    w: 12.5,
    colW: [5.5, 3.0, 4.0],
    border: { type: "solid", color: C.line, pt: 0.5 },
    fontSize: 11,
    fontFace: "Aptos",
    valign: "middle",
    autoPage: false,
  });
  addFooter(slide, contract, lifecycle);
}

/** Slide 4 — value trajectory and success measures (native text/markers). */
function addValueSlide(
  pptx: pptxgen,
  contract: RoadmapPresentationContract,
  lifecycle: RoadmapLifecycle,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addTitle(slide, "What value looks like — milestones, not just completion");

  const milestones = contract.valueMilestones.slice(0, 6);
  milestones.forEach((m, i) => {
    const y = 1.8 + i * 0.7;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 0.5,
      y: y + 0.05,
      w: 0.22,
      h: 0.22,
      fill: { color: C.fresh },
      line: { color: C.fresh, width: 1 },
    });
    slide.addText(
      [
        { text: m.name, options: { bold: true, color: C.ink } },
        ...(m.horizon
          ? [{ text: `  (${m.horizon})`, options: { color: C.muted } }]
          : []),
      ],
      {
        x: 0.9,
        y,
        w: 12.0,
        h: 0.5,
        fontSize: 12,
        fontFace: "Aptos",
        valign: "middle",
        wrap: true,
      },
    );
  });
  addFooter(slide, contract, lifecycle);
}

/** Slide 5 — governance, decision rights and steering cadence + caveats. */
function addGovernanceSlide(
  pptx: pptxgen,
  contract: RoadmapPresentationContract,
  lifecycle: RoadmapLifecycle,
): void {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addTitle(slide, "How the plan is governed — decision rights and cadence");

  const gateBullets = contract.decisionGates.map((g) => ({
    text: g.betweenHorizons ? `${g.name} — ${g.betweenHorizons}` : g.name,
    options: { bullet: true, color: C.ink, fontSize: 12 },
  }));
  slide.addText(
    gateBullets.length
      ? gateBullets
      : [
          {
            text: "Steering committee reviews at each horizon gate.",
            options: { bullet: true, color: C.ink, fontSize: 12 },
          },
        ],
    {
      x: 0.4,
      y: 1.7,
      w: 12.5,
      h: 2.5,
      fontFace: "Aptos",
      valign: "top",
      wrap: true,
    },
  );

  if (contract.caveats.length) {
    slide.addText(
      [
        {
          text: "Caveats\n",
          options: { bold: true, color: C.warn, fontSize: 12 },
        },
        ...contract.caveats
          .slice(0, 4)
          .map((c) => ({
            text: `${c}\n`,
            options: { color: C.muted, fontSize: 11 },
          })),
      ],
      {
        x: 0.4,
        y: 4.4,
        w: 12.5,
        h: 2.0,
        fontFace: "Aptos",
        valign: "top",
        wrap: true,
      },
    );
  }
  addFooter(slide, contract, lifecycle);
}

/** Slide 6 (optional) — principal risks and conditions for scale. */
function addRiskSlide(
  pptx: pptxgen,
  contract: RoadmapPresentationContract,
  lifecycle: RoadmapLifecycle,
): void {
  if (!contract.risks.length) return;
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addTitle(slide, "What could change the plan — principal risks");
  slide.addText(
    contract.risks.slice(0, 6).map((r) => ({
      text: r,
      options: { bullet: true, color: C.ink, fontSize: 12 },
    })),
    {
      x: 0.4,
      y: 1.7,
      w: 12.5,
      h: 4.5,
      fontFace: "Aptos",
      valign: "top",
      wrap: true,
    },
  );
  addFooter(slide, contract, lifecycle);
}

/**
 * Render the executive roadmap deck as a native, editable .pptx Buffer.
 */
export async function renderExecutiveRoadmapPptx(
  contract: RoadmapPresentationContract,
): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.author = "AbarVa Moves";
  pptx.company = "AbarVa";
  pptx.subject = `Executive Roadmap — ${contract.contentHash}`;
  pptx.title = contract.executiveConclusion.slice(0, 120);
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos" };
  pptx.defineLayout({ name: "ABARVA_WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "ABARVA_WIDE";

  const lifecycle = lifecycleFromContract(contract);
  addConclusionSlide(pptx, contract, lifecycle);
  addHorizonSlide(pptx, contract, lifecycle);
  addDependencySlide(pptx, contract, lifecycle);
  addValueSlide(pptx, contract, lifecycle);
  addGovernanceSlide(pptx, contract, lifecycle);
  addRiskSlide(pptx, contract, lifecycle);

  const out = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}

// Referenced to keep the shape-type import meaningful for future micro-visuals.
export type { PptxShapeType };
