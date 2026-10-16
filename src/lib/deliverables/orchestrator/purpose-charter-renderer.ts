import "server-only";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { RootContent, PhrasingContent } from "mdast";
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  ImageRun,
  PageNumber,
  WidthType,
  HeadingLevel,
  BorderStyle,
} from "docx";
import type { RenderableDeliverable } from "./types";
import {
  PurposePageError,
  purposeCitations,
  purposeSourceGroups,
} from "./purpose-page-plan";
import { purposeBrand } from "./purpose-page-brand";

const FONT = "Arial",
  INK = "1C2428",
  MUTED = "536267",
  LINE = "CCD6D4",
  PALE = "EFF4F3";
const order = [
  "charter_decision",
  "opportunity_context",
  "scope",
  "success_measures",
  "evidence_plan",
  "sponsorship_governance",
  "known_constraints_dependencies",
  "authorization_conditions",
];
const run = (text: string, bold = false) =>
  new TextRun({ text, font: FONT, size: 22, color: INK, bold });
const para = (text: string) =>
  new Paragraph({ children: [run(text)], spacing: { after: 140, line: 260 } });
const heading = (text: string, level: 1 | 2 = 1, pageBreakBefore = false) =>
  new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    keepNext: true,
    pageBreakBefore,
    spacing: { before: 220, after: 120 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: level === 1 ? 34 : 24,
        bold: true,
        color: INK,
      }),
    ],
  });

function table(
  columns: string[],
  rows: string[][],
  columnWeights?: number[],
): Table {
  if (!columns.length || rows.some((row) => row.length !== columns.length))
    throw new PurposePageError("table_shape", "charter");
  const weights =
    columnWeights ||
    (columns.length === 2
      ? [1.6, 5.4]
      : columns.length === 3
        ? [1.5, 3.5, 2]
        : columns.map(() => 7 / columns.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: weights.map((w) => Math.round(w * 1440)),
    rows: [columns, ...rows].map(
      (row, i) =>
        new TableRow({
          tableHeader: i === 0,
          cantSplit: true,
          children: row.map(
            (text, col) =>
              new TableCell({
                width: {
                  size: Math.round(weights[col]! * 1440),
                  type: WidthType.DXA,
                },
                shading: { fill: i === 0 ? PALE : "FFFFFF" },
                margins: { top: 90, bottom: 90, left: 110, right: 110 },
                borders: {
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
                  top: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    spacing: { after: 30, line: 240 },
                    children: [
                      new TextRun({
                        text,
                        font: FONT,
                        size: 20,
                        bold: i === 0,
                        color: INK,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function inline(nodes: PhrasingContent[], bold = false): TextRun[] {
  return nodes.flatMap((node): TextRun[] => {
    if ("children" in node)
      return inline(
        node.children as PhrasingContent[],
        bold || node.type === "strong",
      );
    if (node.type === "break") return [run("\n")];
    if ("value" in node) return [run(node.value, bold)];
    throw new PurposePageError("unsupported_inline", "charter");
  });
}
function plain(nodes: PhrasingContent[]): string {
  return nodes
    .map((node): string =>
      "children" in node
        ? plain(node.children as PhrasingContent[])
        : "value" in node
          ? node.value
          : "\n",
    )
    .join("");
}
function blocks(node: RootContent): (Paragraph | Table)[] {
  switch (node.type) {
    case "heading":
      return [heading(plain(node.children), 2)];
    case "paragraph":
      return [
        new Paragraph({
          children: inline(node.children),
          spacing: { after: 140, line: 260 },
        }),
      ];
    case "table": {
      const rows = node.children.map((row) =>
        row.children.map((cell) => plain(cell.children)),
      );
      return [table(rows[0]!, rows.slice(1)), para("")];
    }
    case "list":
      return node.children.flatMap((item, i) =>
        item.children.flatMap((child) => {
          if (child.type !== "paragraph") return blocks(child as RootContent);
          return [
            new Paragraph({
              children: [
                run(node.ordered ? `${(node.start ?? 1) + i}. ` : "- "),
                ...inline(child.children),
              ],
              spacing: { after: 100, line: 260 },
            }),
          ];
        }),
      );
    case "blockquote":
      return node.children.flatMap(blocks);
    case "code":
      return [para(node.value)];
    default:
      throw new PurposePageError(
        "unsupported_markdown",
        `charter/${node.type}`,
      );
  }
}

export function renderPurposeCharter(doc: RenderableDeliverable): Document {
  const brand = purposeBrand();
  if (doc.exhibits.some((exhibit) => exhibit.data) || doc.publicSources?.length)
    throw new PurposePageError("charter_visual_needs_adapter", "charter");
  const labels = Object.fromEntries(
    doc.sourceRegister.map((s) => [
      s.citationNumber,
      s.referenceId || String(s.citationNumber),
    ]),
  );
  const cite = (text: string) => purposeCitations(text, labels);
  const sections = [...doc.generatedSections].sort((a, b) => {
    const rank = (key: string) =>
      order.includes(key) ? order.indexOf(key) : order.length;
    return rank(a.key) - rank(b.key);
  });
  const long =
    sections
      .map((s) => s.bodyMarkdown)
      .join(" ")
      .split(/\s+/).length > 900;
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text:
            doc.presentationCover?.eyebrow ||
            `P1 CHARTER / ${doc.clientDisplayName.toUpperCase()}`,
          font: FONT,
          size: 20,
          color: MUTED,
        }),
      ],
      spacing: { after: 120 },
      keepNext: true,
    }),
    new Paragraph({
      children: cite(doc.presentationCover?.displayTitle || doc.title)
        .split("\n")
        .map(
          (text, i) =>
            new TextRun({
              text,
              break: i ? 1 : undefined,
              font: "Georgia",
              size: 54,
              color: INK,
            }),
        ),
      heading: HeadingLevel.TITLE,
      spacing: { after: 180 },
    }),
    para(cite(doc.subtitle || "Discovery charter and decision record")),
    new Paragraph({
      children: [
        new TextRun({
          text: [
            doc.presentationCover?.edition,
            doc.presentationCover?.date,
            doc.presentationCover?.status || "Approval pending",
          ]
            .filter(Boolean)
            .join(" / "),
          font: FONT,
          size: 18,
          color: MUTED,
        }),
      ],
      spacing: { after: 140 },
    }),
    para(
      "Reading guide: decision and scope; outcomes and measures; evidence and owners; controls; authorization and sources.",
    ),
  ];
  const used = new Set<string>();
  for (const section of sections) {
    children.push(
      heading(
        section.title,
        1,
        long &&
          ["scope", "evidence_plan", "sponsorship_governance"].includes(
            section.key,
          ),
      ),
    );
    const tree = fromMarkdown(cite(section.bodyMarkdown), {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    });
    children.push(...tree.children.flatMap(blocks));
    for (const item of doc.tables.filter(
      (t) =>
        t.targetFormat !== "xlsx" &&
        [section.key, `${section.key}_table`].includes(t.key),
    )) {
      children.push(
        table(
          item.columns,
          item.rows.map((row) => row.map(cite)),
        ),
        para(""),
      );
      used.add(item.key);
    }
  }
  for (const item of doc.tables.filter(
    (t) => t.targetFormat !== "xlsx" && !used.has(t.key),
  ))
    children.push(
      heading(item.title, 2),
      table(
        item.columns,
        item.rows.map((row) => row.map(cite)),
      ),
    );
  if (doc.assumptions.length)
    children.push(
      heading("Assumptions", 2),
      table(
        ["Assumption", "Basis and review"],
        doc.assumptions.map((a) => [
          cite(a.statement),
          `${cite(a.basis)}${a.mustValidate ? " / Validation required" : ""}`,
        ]),
      ),
    );
  if (doc.clientCompleteChecklist.length)
    children.push(
      heading("Open inputs", 2),
      table(
        ["Input", "Owner and reason"],
        doc.clientCompleteChecklist.map((c) => [
          c.label,
          `${c.owner}: ${c.reason}`,
        ]),
      ),
    );
  children.push(
    heading("Review and authorization", 1, long),
    para(cite(doc.recommendation)),
  );
  if (doc.nextActions.length)
    children.push(
      heading("Next actions", 2),
      ...doc.nextActions.map((a) => para(cite(a))),
    );
  children.push(
    para(
      "This draft does not authorize Discovery, funding or implementation. Only the authorized reviewer can record the decision, its scope and any conditions below.",
    ),
    table(
      ["Decision record", "Guidance (not a recorded decision)"],
      [
        ["Decision", "Authorize with conditions / Request revision / Hold"],
        ["Approver and role", "Record the authorized reviewer and their role."],
        ["Date", "Record the date of the decision."],
        [
          "Scope and resources",
          "State the boundary and resources authorized; do not imply build funding.",
        ],
        [
          "Conditions or exclusions",
          "Name any condition to close, accountable role and excluded work.",
        ],
      ],
    ),
    heading("Source register", 2),
  );
  for (const { family, entries } of purposeSourceGroups(doc.sourceRegister))
    children.push(
      heading(family, 2),
      table(
        ["ID", "Source and review", "Use in this document"],
        entries.map((s) => [
          `[${s.referenceId || s.citationNumber}]`,
          `${s.label}\n${s.reviewStatus || `${s.confidence} confidence`}${s.asOf ? ` / ${s.asOf}` : ""}`,
          s.useAndLimitation ||
            "Use and limitations not recorded; confirm before relying on this source.",
        ]),
        [0.6, 2.0, 4.4],
      ),
    );
  return new Document({
    creator: "Abarva",
    title: doc.title,
    description: doc.subtitle,
    styles: {
      default: { document: { run: { font: FONT, size: 22, color: INK } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: 1008,
              bottom: 936,
              left: 1037,
              right: 1037,
              header: 360,
              footer: 432,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    type: "png",
                    data: brand.png,
                    transformation: { width: 150, height: 150 / brand.aspect },
                  }),
                  new TextRun({
                    text: "   MOVES / P1 CHARTER",
                    font: FONT,
                    size: 18,
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
                children: [
                  new TextRun({
                    text: `${doc.presentationCover?.classification || doc.clientDisplayName} / AI-generated working draft. Human approval required. / `,
                    font: FONT,
                    size: 17,
                    color: MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT,
                    size: 17,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}
