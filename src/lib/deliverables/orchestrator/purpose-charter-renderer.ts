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
  purposeUpstreamReferences,
} from "./purpose-page-plan";
import { purposeBrand } from "./purpose-page-brand";
import { purposeCitationIds } from "./purpose-citations";
import { purposeTypedTableRows } from "./purpose-number-display";
import {
  layoutReferenceTable,
  referenceCellTextHeight,
} from "./reference-deck-layout";

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
const para = (text: string, keepNext = false) =>
  new Paragraph({
    children: [run(text)],
    keepLines: true,
    keepNext,
    spacing: { after: 140, line: 260 },
  });
const heading = (text: string, level: 1 | 2 = 1, pageBreakBefore = false) =>
  new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    keepNext: true,
    pageBreakBefore,
    spacing: { before: 160, after: 100 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: level === 1 ? 30 : 24,
        bold: true,
        color: INK,
      }),
    ],
  });

function table(
  columns: string[],
  rows: string[][],
  columnWeights?: number[],
  keepNext = false,
  keepFollowingParagraph = false,
): Table {
  if (!columns.length || rows.some((row) => row.length !== columns.length))
    throw new PurposePageError("table_shape", "charter");
  const independentScope =
    columns.length === 2 &&
    /^in scope\b/i.test(columns[0]!) &&
    /^(?:out of scope|excluded)\b/i.test(columns[1]!);
  if (independentScope && rows.length <= 4)
    rows = [
      columns.map((_, col) =>
        rows
          .map((row) => row[col]!)
          .filter(Boolean)
          .join("\n\n"),
      ),
    ];
  let weights =
    columnWeights ||
    (independentScope
      ? [3.5, 3.5]
      : columns.length === 2
        ? [1.6, 5.4]
        : columns.length === 3
          ? [1.5, 3.5, 2]
          : columns.map(() => 7 / columns.length));
  if (!columnWeights && columns.length >= 3) {
    const adaptive = layoutReferenceTable(
      { kind: "table", columns, rows },
      7,
    ).columnWidths;
    const height = (widths: number[]) =>
      [columns, ...rows].reduce(
        (sum, row) =>
          sum +
          Math.max(
            ...row.map((cell, i) =>
              referenceCellTextHeight(cell, widths[i]! - 0.16, 10),
            ),
          ),
        0,
      );
    if (height(adaptive) < height(weights)) weights = adaptive;
  }
  // Keep a short table together; for long tables retain at least a two-row tail.
  const estimatedLines = rows.reduce(
    (sum, row) =>
      sum +
      Math.max(
        ...row.map((cell, col) =>
          Math.ceil(cell.length / Math.max(12, weights[col]! * 13)),
        ),
      ),
    0,
  );
  const compactTable = rows.length <= 8 && estimatedLines <= 14;
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
                margins: { top: 55, bottom: 55, left: 110, right: 110 },
                borders: {
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
                  top: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                children: [
                  new Paragraph({
                    spacing: { after: 10, line: 220 },
                    keepNext:
                      keepNext ||
                      (keepFollowingParagraph && i === rows.length) ||
                      (i < rows.length &&
                        (compactTable || i < 2 || i === rows.length - 1)),
                    children: text.split("\n").map(
                      (line, lineIndex) =>
                        new TextRun({
                          text: line,
                          break: lineIndex ? 1 : undefined,
                          font: FONT,
                          size: 20,
                          bold: i === 0,
                          color: INK,
                        }),
                    ),
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
function blocks(
  node: RootContent,
  keepWithTable = false,
  keepFollowingParagraph = false,
): (Paragraph | Table)[] {
  switch (node.type) {
    case "heading":
      return [heading(plain(node.children), 2)];
    case "paragraph":
      return [
        new Paragraph({
          children: inline(node.children),
          keepLines: true,
          keepNext: keepWithTable,
          spacing: { after: 140, line: 260 },
        }),
      ];
    case "table": {
      const rows = node.children.map((row) =>
        row.children.map((cell) => plain(cell.children)),
      );
      return [
        table(
          rows[0]!,
          rows.slice(1),
          undefined,
          false,
          keepFollowingParagraph,
        ),
        new Paragraph({
          children: [new TextRun({ text: "", size: 2 })],
          keepNext: keepFollowingParagraph,
          spacing: { line: 20, after: 80 },
        }),
      ];
    }
    case "list": {
      const shortList =
        node.children.length <= 3 &&
        node.children.reduce(
          (sum, item) =>
            sum +
            item.children.reduce(
              (lines, child) =>
                lines +
                (child.type === "paragraph"
                  ? Math.ceil(plain(child.children).length / 85)
                  : 20),
              0,
            ),
          0,
        ) <= 8;
      return node.children.flatMap((item, i) =>
        item.children.flatMap((child, childIndex) => {
          if (child.type !== "paragraph") return blocks(child as RootContent);
          return [
            new Paragraph({
              children: node.ordered
                ? [run(`${(node.start ?? 1) + i}. `), ...inline(child.children)]
                : inline(child.children),
              bullet: node.ordered ? undefined : { level: 0 },
              indent: { left: 240, hanging: 180 },
              keepLines: true,
              keepNext:
                (shortList || i === 0 || i === node.children.length - 2) &&
                (i < node.children.length - 1 ||
                  childIndex < item.children.length - 1),
              spacing: { after: 100, line: 260 },
            }),
          ];
        }),
      );
    }
    case "blockquote":
      return node.children.flatMap((child, index) =>
        blocks(child, node.children[index + 1]?.type === "table"),
      );
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
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [
        new TextRun({
          text:
            doc.presentationCover?.eyebrow ||
            doc.clientDisplayName.toUpperCase(),
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
      "Reading guide: proposed decision and scope; success measures; governance; planned inputs and acceptance tests; conditions; next decision, actions and sources.",
    ),
  ];
  const used = new Set<string>();
  for (const [index, section] of sections.entries()) {
    children.push(
      heading(`${index + 1}. ${section.title.replace(/^\d+[.)]\s*/, "")}`, 1),
    );
    const tree = fromMarkdown(cite(section.bodyMarkdown), {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    });
    children.push(
      ...tree.children.flatMap((node, index) =>
        blocks(
          node,
          tree.children[index + 1]?.type === "table" ||
            tree.children[index + 1]?.type === "list",
          node.type === "table" &&
            tree.children[index + 1]?.type === "paragraph" &&
            plain(
              (
                tree.children[index + 1] as Extract<
                  RootContent,
                  { type: "paragraph" }
                >
              ).children,
            ).length <= 140 &&
            tree.children[index + 2]?.type !== "table",
        ),
      ),
    );
    for (const item of doc.tables.filter(
      (t) =>
        t.targetFormat !== "xlsx" &&
        [section.key, `${section.key}_table`].includes(t.key),
    )) {
      children.push(
        table(
          item.columns,
          purposeTypedTableRows(item).map((row) => row.map(cite)),
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
        purposeTypedTableRows(item).map((row) => row.map(cite)),
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
    heading(`${sections.length + 1}. Next decision and review`),
    ...fromMarkdown(cite(doc.recommendation), {
      extensions: [gfm()],
      mdastExtensions: [gfmFromMarkdown()],
    }).children.flatMap((node) =>
      blocks(
        node,
        node.type === "paragraph" &&
          Boolean(doc.actionRegister?.length || doc.nextActions.length),
      ),
    ),
  );
  if (doc.actionRegister?.length)
    children.push(
      heading("Next actions", 2),
      table(
        ["Proposed owner", "Next action", "Proposed completion evidence"],
        doc.actionRegister.map((a) => [
          a.owner,
          cite(a.action),
          cite(a.evidence),
        ]),
      ),
    );
  else if (doc.nextActions.length)
    children.push(
      heading("Next actions", 2),
      ...doc.nextActions.map((a) => para(cite(a))),
    );
  children.push(
    heading(`${sections.length + 2}. Decision record`),
    para(
      "This draft does not authorize Discovery, funding or implementation. The authorized reviewer records the decision and its limits below.",
      true,
    ),
    table(
      ["Decision record", "Guidance (not a recorded decision)"],
      [
        ["Decision", "Authorize with conditions / Request revision / Hold"],
        ["Approver and role", "Record the authorized reviewer and their role."],
        ["Date", "Record the decision date."],
        [
          "Scope and resources",
          "State the authorized boundary and resources, excluding unapproved build funding.",
        ],
        [
          "Conditions or exclusions",
          "Name any condition to close, accountable role and excluded work.",
        ],
      ],
    ),
    heading(`${sections.length + 3}. Source register`),
  );
  const commonReview =
    new Set(doc.sourceRegister.map((s) => s.reviewStatus)).size === 1
      ? doc.sourceRegister[0]?.reviewStatus
      : undefined;
  if (commonReview)
    children.push(
      para(
        `${commonReview}. Source presence is not approval.${doc.sourceRegister.every((s) => !s.asOf) ? " Snapshot date not recorded." : ""}`,
        true,
      ),
    );
  const sourceUse = (value: string | undefined) =>
    value?.replace(/;?\s*human approval remains separate\.?/gi, "") ||
    "Use and limitations not recorded; confirm before relying on this source.";
  const sourceGroups = purposeSourceGroups(doc.sourceRegister);
  const usedFor = (citation: number) => {
    const sectionNumbers = sections.flatMap((section, index) =>
      purposeCitationIds(
        [
          section.bodyMarkdown,
          ...doc.tables
            .filter((t) =>
              [section.key, `${section.key}_table`].includes(t.key),
            )
            .flatMap((t) => purposeTypedTableRows(t).flat()),
        ].join(" "),
      ).includes(citation)
        ? [index + 1]
        : [],
    );
    const titles = sectionNumbers.length
      ? [
          `${sectionNumbers.length === 1 ? "section" : "sections"} ${sectionNumbers.join(", ")}`,
        ]
      : [];
    if (purposeCitationIds(doc.recommendation).includes(citation))
      titles.push("Next decision");
    if (
      doc.actionRegister?.some((action) =>
        purposeCitationIds(
          `${action.owner} ${action.action} ${action.evidence}`,
        ).includes(citation),
      )
    )
      titles.push("Next actions");
    return titles.length ? `Used in: ${titles.join("; ")}. ` : "";
  };
  for (const { family, entries } of sourceGroups) {
    children.push(
      ...(sourceGroups.length > 1 ? [heading(family, 2)] : []),
      table(
        [
          "ID",
          commonReview ? "Source" : "Source and review",
          "Use in this document",
        ],
        entries.map((s) => [
          `[${s.referenceId || s.citationNumber}]`,
          `${s.label}${commonReview ? "" : `\n${s.reviewStatus || `${s.confidence} confidence`}`}${s.asOf ? ` / ${s.asOf}` : ""}`,
          `${usedFor(s.citationNumber)}${sourceUse(s.useAndLimitation)}${purposeUpstreamReferences(s, "\n")}`,
        ]),
        [0.6, 2.0, 4.4],
      ),
    );
  }
  const footer = () =>
    new Footer({
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
    });
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
          titlePage: true,
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: 1008,
              bottom: 1008,
              left: 1037,
              right: 1037,
              header: 360,
              footer: 432,
            },
          },
        },
        headers: {
          first: new Header({
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
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "MOVES / P1 CHARTER",
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
          first: footer(),
          default: footer(),
        },
        children,
      },
    ],
  });
}
