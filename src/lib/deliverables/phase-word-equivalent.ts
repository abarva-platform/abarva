import "server-only";

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { DeliverableKey } from "@/lib/deliverables/profiles/types";
import type { SolutionContext } from "@/lib/programs/solution-context";
import {
  getPhaseDeliverablePackageContract,
  type PhaseDeliverablePackageContract,
} from "@/lib/programs/phase-deliverable-package-contract";

const INK = "1A1A18";
const MUTED = "5A6472";
const ACCENT = "1B2B5C";
const RULE = "D5DAE2";
const HEAD_BG = "F4F5F7";

type DocChild = Paragraph | Table;

export interface PhaseWordEquivalentInput {
  artifact: DeliverableKey;
  phase: number;
  moveName: string;
  title: string;
  html: string;
  context?: SolutionContext;
  generationMode?: string;
  reviewStatus?: string;
  qualityStatus?: string;
  goldenBarStatus?: string;
  contract?: PhaseDeliverablePackageContract;
  feedbackSummary?: string[];
}

function text(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(?:p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 30)
    .join("\n");
}

function safeFileStem(title: string, artifact: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || artifact
  );
}

export function phaseWordEquivalentFileName(args: {
  title: string;
  artifact: string;
  version?: number;
}): string {
  const suffix = args.version && args.version > 1 ? `-v${args.version}` : "";
  return `${safeFileStem(args.title, args.artifact)}-editable-phase-deliverable${suffix}.docx`;
}

function paragraph(
  value: string,
  opts: {
    bold?: boolean;
    italics?: boolean;
    color?: string;
    size?: number;
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    spacingAfter?: number;
    pageBreakBefore?: boolean;
  } = {},
): Paragraph {
  return new Paragraph({
    heading: opts.heading,
    alignment: opts.alignment,
    pageBreakBefore: opts.pageBreakBefore,
    spacing: { after: opts.spacingAfter ?? 120, line: 276 },
    children: [
      new TextRun({
        text: value,
        bold: opts.bold,
        italics: opts.italics,
        color: opts.color ?? INK,
        size: opts.size ?? 22,
      }),
    ],
  });
}

function heading(value: string, level: 1 | 2 | 3 = 2): Paragraph {
  return new Paragraph({
    heading:
      level === 1
        ? HeadingLevel.HEADING_1
        : level === 2
          ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3,
    spacing: { before: level === 1 ? 300 : 220, after: 110 },
    children: [
      new TextRun({
        text: value,
        bold: true,
        color: level === 3 ? INK : ACCENT,
        size: level === 1 ? 34 : level === 2 ? 28 : 24,
        font: level === 3 ? "Calibri" : "Georgia",
      }),
    ],
  });
}

function bullet(value: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 70, line: 264 },
    children: [new TextRun({ text: value, size: 21, color: INK })],
  });
}

function tableCell(value: string, header = false): TableCell {
  return new TableCell({
    margins: { top: 70, bottom: 70, left: 90, right: 90 },
    shading: header ? { fill: HEAD_BG } : undefined,
    children: [
      new Paragraph({
        spacing: { line: 240 },
        children: [
          new TextRun({
            text: value,
            bold: header,
            color: header ? ACCENT : INK,
            size: header ? 18 : 19,
          }),
        ],
      }),
    ],
  });
}

function simpleTable(rows: string[][]): Table {
  const [head, ...body] = rows;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: RULE },
    },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((c) => tableCell(c, true)) }),
      ...body.map(
        (row) =>
          new TableRow({
            children: head.map((_, index) => tableCell(row[index] ?? "")),
          }),
      ),
    ],
  });
}

function sectionList(title: string, values: string[], empty: string): DocChild[] {
  return [
    heading(title),
    ...(values.length ? values.map(bullet) : [paragraph(empty, { italics: true, color: MUTED })]),
  ];
}

function contextSummary(ctx: SolutionContext | undefined): string {
  const candidates = [
    text(ctx?.currentState),
    text(ctx?.useCase),
    text(ctx?.useCaseCandidate),
    text(ctx?.problemSeed),
    text(ctx?.valueHypothesis),
  ].filter(Boolean);
  return candidates[0] || "This Word-equivalent record is generated from the governed Move context and requires client review before final use.";
}

function metricsRows(ctx: SolutionContext | undefined): string[][] {
  const rows: string[][] = [];
  for (const metric of ctx?.metricsThatMatter ?? []) {
    rows.push([
      metric.label,
      metric.value,
      metric.source ?? "Client-loaded evidence",
      metric.caveat ?? "Use for phase diagnosis and review",
    ]);
  }
  for (const kpi of ctx?.kpis ?? []) {
    rows.push([
      kpi.name,
      [kpi.baseline, kpi.target].filter(Boolean).join(" -> ") || "To confirm",
      kpi.domain,
      "KPI captured in Move context",
    ]);
  }
  return rows.slice(0, 12);
}

function evidenceRows(ctx: SolutionContext | undefined): string[][] {
  return (ctx?.evidenceMap ?? [])
    .slice(0, 14)
    .map((item) => [item.claim, item.source, "Evidence cited in Move context"]);
}

function missingInputRows(ctx: SolutionContext | undefined): string[][] {
  return (ctx?.clientActionableMissingInputs ?? [])
    .slice(0, 12)
    .map((item) => [
      item.needed,
      item.whyItMatters,
      item.owner,
      item.gateImpact,
    ]);
}

export async function buildPhaseWordEquivalentDocx(
  input: PhaseWordEquivalentInput,
): Promise<Buffer> {
  const contract =
    input.contract ??
    getPhaseDeliverablePackageContract({
      artifact: input.artifact,
      phase: input.phase,
    });
  const isP1Charter =
    input.phase === 1 ||
    String(input.artifact) === "program_charter" ||
    String(input.artifact) === "charter";
  const status =
    input.reviewStatus ??
    (input.generationMode === "draft"
      ? "Pre-gate draft - sponsor review required"
      : "Draft - client review required");
  const extracted = stripHtml(input.html);
  const coverChildren: DocChild[] = [
    paragraph(input.moveName, {
      alignment: AlignmentType.CENTER,
      size: 26,
      bold: true,
      spacingAfter: 180,
    }),
    paragraph(contract.primaryEditableRecordLabel, {
      alignment: AlignmentType.CENTER,
      size: 36,
      color: ACCENT,
      bold: true,
      spacingAfter: 160,
    }),
    paragraph(input.title, {
      alignment: AlignmentType.CENTER,
      size: 26,
      italics: true,
      spacingAfter: 500,
    }),
    paragraph(`Phase ${input.phase} | ${status}`, {
      alignment: AlignmentType.CENTER,
      size: 20,
      color: MUTED,
      spacingAfter: 80,
    }),
    paragraph("Prepared by AbarVa | Client owner: [CLIENT TO COMPLETE]", {
      alignment: AlignmentType.CENTER,
      size: 20,
      color: MUTED,
      spacingAfter: isP1Charter ? 360 : 800,
    }),
  ];

  const compactP1Children: DocChild[] = [
    ...coverChildren,
    heading("Charter Summary", 1),
    paragraph(contextSummary(input.context)),
    paragraph(
      "This P1 Charter Brief records the approved P0 bet and authorizes P2 Discovery only. Current-state process, technology, organization, metrics, architecture, roadmap, operating model, and estimates remain to validate in P2 unless explicitly evidenced.",
      { color: MUTED },
    ),
    heading("P1 Source of Truth", 1),
    simpleTable([
      ["Field", "Value"],
      ["Status", status],
      ["Primary editable record", contract.primaryEditableRecordLabel],
      ["Visual companion", "Optional HTML review companion"],
      ["Decision boundary", "Approve P2 Discovery only"],
    ]),
    ...sectionList(
      "Required Charter Sections",
      contract.wordDocumentSections,
      "No P1 charter section list was captured.",
    ),
    ...sectionList(
      "P2 Evidence Plan",
      contract.requiredWorkshopEvidence,
      "P2 evidence plan has not been captured yet.",
    ),
    heading("Client-to-Complete / Validate in P2", 1),
    paragraph(
      "Client to complete: sponsor approval, scope confirmation, completed P2 workshop outputs, evidence uploads, and current-state validation before design, roadmap, estimate, or Tower claims are generated.",
      { italics: true, color: MUTED },
    ),
    heading("Extracted Review Text", 1),
    paragraph(
      extracted ||
        "No HTML review text was available. Use the approved P0 brief and evidence plan as the P1 record.",
    ),
  ];

  const children: DocChild[] = isP1Charter ? compactP1Children : [
    ...coverChildren,
    paragraph("Contents", {
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      bold: true,
      color: ACCENT,
      size: 30,
    }),
    new TableOfContents("Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    heading("Executive Summary", 1),
    paragraph(contextSummary(input.context)),
    paragraph(
      "This is the editable Word-equivalent phase record. The HTML artifact remains available as the visual review companion for diagrams, charts, and browser review.",
      { color: MUTED },
    ),
    heading("Storyline and Narrative Arc", 1),
    paragraph(
      text(input.context?.approach) ||
        text(input.context?.roadmap) ||
        "The document moves from current-state evidence, to what the evidence means, to what must be reviewed before the next phase proceeds.",
    ),
    heading("Evidence Basis and Review Status", 1),
    simpleTable([
      ["Field", "Value"],
      ["Status", status],
      ["Quality", input.qualityStatus ?? "Review required"],
      ["Golden-bar", input.goldenBarStatus ?? "Not recorded"],
      ["Primary editable record", contract.primaryEditableRecordLabel],
      ["Visual companion", "HTML visual review companion"],
    ]),
    ...sectionList(
      "Required Word-Equivalent Sections",
      contract.wordDocumentSections,
      "No required section list was captured.",
    ),
    ...sectionList(
      "Workshop and Session Evidence Required",
      contract.requiredWorkshopEvidence,
      "Workshop/session evidence has not been captured yet.",
    ),
    ...sectionList(
      "What Works / Should Be Preserved",
      (input.context?.constraints ?? []).slice(0, 8),
      "Client to complete: confirm what current-state capabilities should be preserved.",
    ),
    ...sectionList(
      "Current Gaps and Root Causes",
      [...(input.context?.gaps ?? []), ...(input.context?.rootCauses ?? [])].slice(0, 12),
      "No approved current-state gaps or root causes are captured yet.",
    ),
  ];

  const metricRows = metricsRows(input.context);
  if (metricRows.length) {
    children.push(
      heading("Metrics, KPIs, and Baseline Signals", 1),
      simpleTable([["Metric", "Value", "Source/domain", "Use or caveat"], ...metricRows]),
    );
  }

  const evidence = evidenceRows(input.context);
  if (evidence.length) {
    children.push(
      heading("Evidence Register", 1),
      simpleTable([["Claim", "Source", "Notes"], ...evidence]),
    );
  }

  const missingRows = missingInputRows(input.context);
  children.push(heading("Client-to-Complete Fields", 1));
  if (missingRows.length) {
    children.push(
      simpleTable([["Needed", "Why it matters", "Owner", "Gate impact"], ...missingRows]),
    );
  } else {
    children.push(
      paragraph(
        "Client to complete: sponsor approval, workshop notes, client corrections, and final phase signoff before this record becomes final.",
        { italics: true, color: MUTED },
      ),
    );
  }

  children.push(
    heading("Derived Visualization Inventory", 1),
    paragraph(
      "Process flows, handoff maps, architecture diagrams, charts, and tables in the HTML companion are AbarVa-generated visualizations derived from client-loaded evidence unless separately labeled as client-provided.",
    ),
    heading("HTML Visual Companion Extract", 1),
    paragraph(
      extracted ||
        "The HTML visual companion did not expose extractable text. Review the companion artifact for visual diagrams and charts.",
    ),
  );

  if (input.feedbackSummary?.length) {
    children.push(
      ...sectionList(
        "Review Feedback Applied",
        input.feedbackSummary,
        "No review feedback was supplied.",
      ),
    );
  }

  children.push(
    heading("Appendix: Provenance Rules", 1),
    ...contract.provenanceRules.map(bullet),
  );

  const doc = new Document({
    creator: "AbarVa",
    title: input.title,
    description: contract.primaryEditableRecordLabel,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22, color: INK } } },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1150, bottom: 1150, left: 1150, right: 1150 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${input.title} | Editable phase deliverable`,
                    size: 16,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Draft for sponsor review | Page ", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                  new TextRun({ text: " of ", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
