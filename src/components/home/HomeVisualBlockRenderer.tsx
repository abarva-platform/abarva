"use client";

// Product contract: Claude emits `visual_blocks` as structured JSON only
// (type/title/data/evidence_refs/caveats/renderer_hint) — never SVG, HTML, or
// chart markup. This module is the ONLY place `block.data` is read, and it
// only ever pulls named fields out as text content rendered through normal
// JSX (React escapes text nodes by default). No `dangerouslySetInnerHTML`
// appears anywhere in this file, and none should be added — that is what
// keeps model output from ever reaching the DOM as executable markup.

import type { KnowledgeHomeVisualBlock } from "@/lib/enterprise-knowledge/narratives/knowledge-narrative-store";
import {
  ContextStrengthGauge,
  HomeRelationshipDiagram,
  ReadinessBar,
} from "./HomeBriefVisuals";

const READINESS_SCORE: Record<string, number> = {
  Ready: 100,
  Strong: 100,
  High: 90,
  Medium: 70,
  Partial: 60,
  Limited: 45,
  "Target / Future": 35,
  "Not validated": 15,
  Gap: 10,
  Low: 10,
};

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function rowsOf(data: unknown): Array<Record<string, unknown>> {
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { rows?: unknown }).rows)
  ) {
    return (data as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

function scoreFromRow(row: Record<string, unknown>, fallback = 60): number {
  for (const key of ["score", "value", "readiness_score", "confidence_score"]) {
    const raw = row[key];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.max(0, Math.min(100, raw));
    }
    if (typeof raw === "string") {
      const parsed = Number.parseFloat(raw.replace("%", ""));
      if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, parsed));
    }
  }
  for (const key of ["readiness", "confidence", "evidence_coverage", "status"]) {
    const label = text(row[key]);
    if (label && READINESS_SCORE[label] !== undefined) return READINESS_SCORE[label];
  }
  return fallback;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function BlockHead({ block }: { block: KnowledgeHomeVisualBlock }) {
  return (
    <div className="hx3-sectionHead">
      <div>
        <h3>{block.title}</h3>
        <p>{block.executive_message}</p>
      </div>
    </div>
  );
}

function BlockCaveat({ block }: { block: KnowledgeHomeVisualBlock }) {
  if (!block.caveats.length) return null;
  return <p className="hx3-blockCaveat">{block.caveats[0]}</p>;
}

function EmptyBlock({ block }: { block: KnowledgeHomeVisualBlock }) {
  return (
    <div className="hx3-visualBlock" data-block-type={block.type}>
      <BlockHead block={block} />
      <p className="hx3-blockCaveat">
        This visual block has no approved rows to render yet.
      </p>
    </div>
  );
}

function ContextStrengthSnapshotBlock({
  block,
}: {
  block: KnowledgeHomeVisualBlock;
}) {
  const rows = rowsOf(block.data);
  if (!rows.length) return <EmptyBlock block={block} />;
  const score = rows.length
    ? Math.round(
        rows.reduce(
          (sum, row) => sum + scoreFromRow(row, 40),
          0,
        ) / rows.length,
      )
    : 0;
  const domains = rows.slice(0, 6).map((row) => ({
    label: text(row.dimension),
    tone:
      text(row.readiness) === "Strong"
        ? ("strong" as const)
        : text(row.readiness) === "Gap" ||
            text(row.readiness) === "Not validated"
          ? ("weak" as const)
          : ("partial" as const),
  }));
  return (
    <div className="hx3-visualBlock" data-block-type={block.type}>
      <BlockHead block={block} />
      <div className="hx3-briefVisualRow">
        <ContextStrengthGauge value={score} label="Context strength" />
        <div className="hx3-diagramWrap">
          <HomeRelationshipDiagram
            spineLabel="Governed context spine"
            domains={domains}
          />
        </div>
      </div>
      <BlockCaveat block={block} />
    </div>
  );
}

function TableBlock({ block }: { block: KnowledgeHomeVisualBlock }) {
  const rows = rowsOf(block.data);
  if (!rows.length) return <EmptyBlock block={block} />;
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="hx3-visualBlock" data-block-type={block.type}>
      <BlockHead block={block} />
      <div className="hx3-tableWrap">
        <table className="hx3-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{humanizeKey(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{text(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BlockCaveat block={block} />
    </div>
  );
}

function CardListBlock({ block }: { block: KnowledgeHomeVisualBlock }) {
  const rows = rowsOf(block.data);
  if (!rows.length) return <EmptyBlock block={block} />;
  return (
    <div className="hx3-visualBlock" data-block-type={block.type}>
      <BlockHead block={block} />
      <div className="hx3-grid2">
        {rows.map((row, index) => {
          const entries = Object.entries(row);
          const [, headline] = entries[0] ?? [undefined, ""];
          const [, detail] = entries[1] ?? [undefined, ""];
          return (
            <article className="hx3-storyCard" key={index}>
              <h3>{text(headline)}</h3>
              <p>{text(detail)}</p>
              {entries.slice(2, 4).map(([label, value]) => (
                <p className="hx3-blockCaveat" key={label}>
                  {humanizeKey(label)}: {text(value)}
                </p>
              ))}
            </article>
          );
        })}
      </div>
      <BlockCaveat block={block} />
    </div>
  );
}

function StripBlock({ block }: { block: KnowledgeHomeVisualBlock }) {
  const rows = rowsOf(block.data);
  if (!rows.length) return <EmptyBlock block={block} />;
  return (
    <div className="hx3-visualBlock" data-block-type={block.type}>
      <BlockHead block={block} />
      <div className="hx3-moduleStrip">
        {rows.map((row, index) => {
          const values = Object.values(row);
          const score = scoreFromRow(row, 60);
          return (
            <div className="hx3-moduleStripItem" key={index}>
              <strong>{text(values[0])}</strong>
              <ReadinessBar value={score} />
              <p>{text(values[1])}</p>
            </div>
          );
        })}
      </div>
      <BlockCaveat block={block} />
    </div>
  );
}

function GraphBlock({ block }: { block: KnowledgeHomeVisualBlock }) {
  const rows = rowsOf(block.data);
  if (!rows.length) return <EmptyBlock block={block} />;
  const domains = rows.slice(0, 6).map((row, index) => {
    const from = text(row.from) || text(row.source) || text(row.if_provided);
    const relation = text(row.relation) || text(row.unlocks) || text(row.action);
    const to = text(row.to) || text(row.target) || text(row.module);
    return {
      label: [from, relation, to].filter(Boolean).join(" -> ") || `Relationship ${index + 1}`,
      tone:
        scoreFromRow(row, 60) >= 80
          ? ("strong" as const)
          : scoreFromRow(row, 60) <= 35
            ? ("weak" as const)
            : ("partial" as const),
    };
  });
  return (
    <div className="hx3-visualBlock" data-block-type={block.type}>
      <BlockHead block={block} />
      <div className="hx3-diagramWrap">
        <HomeRelationshipDiagram
          spineLabel="Enterprise context"
          domains={domains}
        />
      </div>
      <BlockCaveat block={block} />
    </div>
  );
}

export function HomeVisualBlockRenderer({
  block,
}: {
  block: KnowledgeHomeVisualBlock;
}) {
  if (block.type === "context_strength_snapshot") {
    return <ContextStrengthSnapshotBlock block={block} />;
  }
  switch (block.renderer_hint) {
    case "table":
    case "matrix":
      return <TableBlock block={block} />;
    case "graph":
      return <GraphBlock block={block} />;
    case "card_list":
      return <CardListBlock block={block} />;
    case "strip":
      return <StripBlock block={block} />;
    default:
      return null;
  }
}

export function HomeVisualBlocks({
  blocks,
}: {
  blocks: KnowledgeHomeVisualBlock[] | undefined;
}) {
  if (!blocks || blocks.length === 0) return null;
  const sorted = [...blocks]
    .slice(0, 4)
    .sort((a, b) => a.display_priority - b.display_priority);
  return (
    <>
      {sorted.map((block) => (
        <section className="hx3-section" key={block.type}>
          <HomeVisualBlockRenderer block={block} />
        </section>
      ))}
    </>
  );
}
