// markdownTokens · F0.1 of Programs Strict Completion v1.2
//
// Pure tokenization layer for agent text: regex constants, citation chip
// component, ID-link component, tokenize/replaceBareIds helpers. No
// dependency on `react-markdown` so this module is importable from Jest
// (react-markdown ships ESM that next/jest can't transpile by default).
//
// `markdownRenderer.tsx` consumes this file and adds the markdown
// rendering layer on top.

"use client";

import type { ReactNode } from "react";
import { BrandColors, BrandTypography } from "@/lib/shell/brand-tokens";

// ── Token regexes ─────────────────────────────────────────────────────────────
//
// Order of replacement matters. Citation tags are tokenized FIRST because
// they are bracketed and can wrap a PAT-… ID we'd otherwise match as a
// bare link. Bare ID regexes then run on the gaps between citation chips.

export const CITATION_TAG_REGEX =
  /\[(user-context|tenant-specific|PAT(?:-[A-Z]+)+-\d+):\s*([^\]]+)\]/g;

// Pattern IDs: PAT-A-B-…-N or T#-XYZ — handles N-segment forms like
// PAT-SRC-CAT-EHS-001 verified in commit ea487609.
export const PATTERN_ID_REGEX = /\b(PAT(?:-[A-Z]+)+-\d+|T\d+-[A-Z]+\d+)\b/g;

// Program IDs: APX-XYZ-2026
export const PROGRAM_ID_REGEX = /\bAPX-[A-Z]+-\d{4}\b/g;

// Source event IDs: SRC-XYZ-2026
export const SOURCE_ID_REGEX = /\bSRC-[A-Z]+-\d{4}\b/g;

// Layer-3 fallback preface (literal phrase, no brackets)
export const GENERAL_PRACTICE_PREFACE =
  "Drawing on general practice (not AbarVa-specific):";

export const ABARVA_ENTITY_TAG_REGEX =
  /<abv-(pattern|usecase|vendor)\s+id="([^"]+)">([^<]+)<\/abv-\1>/g;

export const ABARVA_ENTITY_TOKEN_REGEX =
  /\[abv-(pattern|usecase|vendor):([^:\]]+):([^\]]+)\]/g;

export const ABARVA_SOURCE_TAG_REGEX =
  /<abv-source\s+ref="([^"]+)"\s+reliability="(HIGH|MEDIUM|LOW)"\/>/g;

function isMarkdownTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.includes("|")) return false;
  const pipeCount = (trimmed.match(/\|/g) ?? []).length;
  return pipeCount >= 2 && (trimmed.startsWith("|") || /\s\|\s/.test(trimmed));
}

function splitMarkdownTableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function splitTabularTableCells(line: string): string[] {
  return line
    .trim()
    .split(/\t+/)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function isTabularTableLine(line: string): boolean {
  if (!line.includes("\t")) return false;
  return splitTabularTableCells(line).length >= 2;
}

function isMarkdownTableSeparatorLine(line: string): boolean {
  const cells = splitMarkdownTableCells(line).filter(Boolean);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell) || /^-+$/.test(cell))
  );
}

function normalizeMarkdownTableRow(line: string): string {
  const cells = splitMarkdownTableCells(line);
  return `| ${cells.join(" | ")} |`;
}

function normalizeTabularTableRow(line: string): string {
  const cells = splitTabularTableCells(line);
  return `| ${cells.join(" | ")} |`;
}

function separatorForMarkdownTable(headerLine: string): string {
  const count = Math.max(1, splitMarkdownTableCells(headerLine).length);
  return `| ${Array.from({ length: count }, () => "---").join(" | ")} |`;
}

function normalizeMarkdownTableBlock(lines: string[]): string[] {
  if (lines.length < 2) return lines;

  const headerIndex = lines.findIndex(
    (line) => !isMarkdownTableSeparatorLine(line),
  );
  if (headerIndex < 0) return lines;

  const header = normalizeMarkdownTableRow(lines[headerIndex]);
  const headerCellCount = splitMarkdownTableCells(header).length;
  const firstSeparator = lines.find(
    (line) =>
      isMarkdownTableSeparatorLine(line) &&
      splitMarkdownTableCells(line).filter(Boolean).length === headerCellCount,
  );
  const separator = firstSeparator
    ? normalizeMarkdownTableRow(firstSeparator)
    : separatorForMarkdownTable(header);
  const bodyRows = lines
    .slice(headerIndex + 1)
    .filter((line) => !isMarkdownTableSeparatorLine(line))
    .map(normalizeMarkdownTableRow);

  if (bodyRows.length === 0 && !firstSeparator) return lines;
  return [header, separator, ...bodyRows];
}

function expandInlineMarkdownTables(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (
        !line.includes("|") ||
        !/\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|/.test(line)
      ) {
        return line;
      }

      return line
        .replace(/\|\s+\|/g, "|\n|")
        .replace(
          /([^\n|])\s+(\|[^\n]*\|)\n(?=\|\s*:?-{3,}:?\s*\|)/g,
          "$1\n\n$2\n",
        );
    })
    .join("\n");
}

export function normalizeMarkdownTables(text: string): string {
  const lines = expandInlineMarkdownTables(text).split(/\r?\n/);
  const output: string[] = [];
  let tableBlock: string[] = [];
  let inFence = false;

  const flushTable = () => {
    if (tableBlock.length === 0) return;
    if (output.length > 0 && output[output.length - 1]?.trim()) {
      output.push("");
    }
    output.push(...normalizeMarkdownTableBlock(tableBlock));
    output.push("");
    tableBlock = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*```/.test(line)) {
      flushTable();
      inFence = !inFence;
      output.push(line);
      continue;
    }

    if (!inFence && isMarkdownTableLine(line)) {
      tableBlock.push(line);
      continue;
    }

    if (!inFence && isTabularTableLine(line)) {
      tableBlock.push(normalizeTabularTableRow(line));
      continue;
    }

    if (
      !inFence &&
      tableBlock.length > 0 &&
      !line.trim() &&
      (isMarkdownTableLine(lines[index + 1] ?? "") ||
        isTabularTableLine(lines[index + 1] ?? ""))
    ) {
      continue;
    }

    flushTable();
    output.push(line);
  }

  flushTable();
  return output.join("\n").replace(/\n+$/g, "");
}

export function normalizeAbarvaAgentMarkup(text: string): string {
  ABARVA_SOURCE_TAG_REGEX.lastIndex = 0;
  const sourceRefs = Array.from(text.matchAll(ABARVA_SOURCE_TAG_REGEX))
    .slice(0, 5)
    .map((match) => `${match[1]} (${match[2]})`);

  const withoutSources = text.replace(
    /<abv-sources>[\s\S]*?<\/abv-sources>/g,
    "",
  );
  ABARVA_ENTITY_TAG_REGEX.lastIndex = 0;
  const withEntityTokens = withoutSources.replace(
    ABARVA_ENTITY_TAG_REGEX,
    (_match, kind: string, id: string, label: string) =>
      ` [abv-${kind}:${id}:${label}] `,
  );
  const withReadableSpacing = withEntityTokens
    .replace(/<\/(p|div|h[1-6])>/gi, "\n\n")
    .replace(/<(p|div|h[1-6])(?:\s+[^>]*)?>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li(?:\s+[^>]*)?>/gi, "\n- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol)(?:\s+[^>]*)?>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<tr(?:\s+[^>]*)?>/gi, "")
    .replace(/<\/(td|th)>/gi, " | ")
    .replace(/<(td|th)(?:\s+[^>]*)?>/gi, " | ")
    .replace(/<\/?(table|thead|tbody)(?:\s+[^>]*)?>/gi, "\n")
    .replace(/<\/?(strong|b|em|i|span|cite)(?:\s+[^>]*)?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  const withNormalizedTables = normalizeMarkdownTables(withReadableSpacing);

  if (sourceRefs.length === 0) return withNormalizedTables;
  return `${withNormalizedTables}\n\nSource basis: ${sourceRefs.join("; ")}.`;
}

// ── Citation chip ─────────────────────────────────────────────────────────────

type CitationKind = "user-context" | "tenant-specific" | "pattern";
type AbarvaEntityKind = "pattern" | "usecase" | "vendor";

interface CitationChipProps {
  kind: CitationKind;
  /** The tag head — e.g. "user-context" or "PAT-PRG-CDP-001" */
  tagHead: string;
  /** The body after the colon — the actual citation prose */
  detail: string;
}

export function CitationChip({ kind, tagHead, detail }: CitationChipProps) {
  const [bg, fg, border, label, href] = (() => {
    switch (kind) {
      case "user-context":
        return [
          "rgba(12,26,58,0.08)", // navyInk @ 8%
          BrandColors.navyInk,
          "rgba(12,26,58,0.18)",
          "YOU",
          undefined,
        ] as const;
      case "tenant-specific":
        return [
          "rgba(0,102,204,0.08)", // signalBlue @ 8%
          BrandColors.signalBlue,
          "rgba(0,102,204,0.22)",
          "TENANT",
          undefined,
        ] as const;
      case "pattern":
        return [
          BrandColors.paper,
          BrandColors.navyInk,
          "rgba(12,26,58,0.22)",
          tagHead,
          `/source/patterns/${tagHead}`,
        ] as const;
    }
  })();

  const inner = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        padding: "0 8px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${border}`,
        color: fg,
        fontFamily: BrandTypography.sans,
        fontSize: 11,
        lineHeight: 1.6,
        verticalAlign: "baseline",
      }}
    >
      <span
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 700,
          opacity: 0.85,
        }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 500 }}>{detail}</span>
    </span>
  );

  return href ? (
    <a href={href} style={{ textDecoration: "none" }}>
      {inner}
    </a>
  ) : (
    inner
  );
}

// ── Inline ID link ────────────────────────────────────────────────────────────

interface IdLinkProps {
  id: string;
  href: string;
  family: "pattern" | "program" | "source";
}

export function IdLink({ id, href, family }: IdLinkProps) {
  const color =
    family === "program" ? BrandColors.signalBlue : BrandColors.navyInk;
  return (
    <a
      href={href}
      style={{
        color,
        fontFamily: BrandTypography.mono,
        fontSize: "0.92em",
        textDecoration: "underline",
        textUnderlineOffset: 2,
        textDecorationColor: "rgba(12,26,58,0.32)",
      }}
    >
      {id}
    </a>
  );
}

export function AbarvaEntityChip({
  kind,
  id,
  label,
}: {
  kind: AbarvaEntityKind;
  id: string;
  label: string;
}) {
  const href =
    kind === "pattern"
      ? `/intelligence/${encodeURIComponent(id)}`
      : kind === "usecase"
        ? `/intelligence/solutions/${encodeURIComponent(id)}`
        : `/source/vendors/${encodeURIComponent(id)}`;

  return (
    <a
      href={href}
      title={`${label} · ${id}`}
      aria-label={`${label}; ${kind}; source id ${id}`}
      style={{
        color: BrandColors.signalBlue,
        textDecoration: "underline",
        textUnderlineOffset: 2,
        textDecorationColor: "rgba(0,102,204,0.28)",
        fontWeight: 600,
      }}
    >
      {label}
    </a>
  );
}

// ── Token resolver ────────────────────────────────────────────────────────────
//
// Walks a string and replaces matches with React nodes. Citation tags
// take precedence over bare IDs so a `[PAT-…: …]` is rendered as a chip
// rather than a link + plain colon + text.
//
// `inlineNodes` lets the caller substitute arbitrary placeholder strings
// (e.g. `{{cite:program:apx-cdp-2026}}`) with pre-built React nodes
// (e.g. an <AgentCitation> pill). Substitution runs FIRST so the
// placeholder is never split by other regexes.

export function tokenize(
  text: string,
  keyPrefix: string,
  inlineNodes?: ReadonlyMap<string, ReactNode>,
): ReactNode[] {
  // Stage 0: extract caller-provided inline node substitutions.
  if (inlineNodes && inlineNodes.size > 0) {
    const escaped = Array.from(inlineNodes.keys())
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");
    const inlineRegex = new RegExp(`(${escaped})`, "g");
    const segments = text.split(inlineRegex);
    const out: ReactNode[] = [];
    let segIdx = 0;
    for (const segment of segments) {
      const node = inlineNodes.get(segment);
      if (node !== undefined) {
        out.push(<span key={`${keyPrefix}-inline-${segIdx++}`}>{node}</span>);
      } else if (segment.length > 0) {
        out.push(
          ...tokenizeWithoutInline(segment, `${keyPrefix}-seg-${segIdx++}`),
        );
      }
    }
    return out;
  }
  return tokenizeWithoutInline(text, keyPrefix);
}

export function tokenizeWithoutInline(
  text: string,
  keyPrefix: string,
): ReactNode[] {
  // Stage 1: pull out AbarVa entity tags as human-readable links. Everything
  // between entity tags continues to citation/bare-ID replacement.
  const entityOut: ReactNode[] = [];
  let entityCursor = 0;
  let entityIdx = 0;

  ABARVA_ENTITY_TOKEN_REGEX.lastIndex = 0;
  let entityMatch: RegExpExecArray | null;
  while ((entityMatch = ABARVA_ENTITY_TOKEN_REGEX.exec(text)) !== null) {
    if (entityMatch.index > entityCursor) {
      entityOut.push(
        ...tokenizeWithoutAbarvaEntity(
          text.slice(entityCursor, entityMatch.index),
          `${keyPrefix}-entity-gap-${entityIdx}`,
        ),
      );
    }
    entityOut.push(
      <AbarvaEntityChip
        key={`${keyPrefix}-abv-${entityIdx++}`}
        kind={entityMatch[1] as AbarvaEntityKind}
        id={entityMatch[2]}
        label={entityMatch[3]}
      />,
    );
    entityCursor = entityMatch.index + entityMatch[0].length;
  }

  if (entityCursor < text.length) {
    entityOut.push(
      ...tokenizeWithoutAbarvaEntity(
        text.slice(entityCursor),
        `${keyPrefix}-entity-tail`,
      ),
    );
  }

  return entityOut;
}

function tokenizeWithoutAbarvaEntity(
  text: string,
  keyPrefix: string,
): ReactNode[] {
  // Stage 2: pull out citation tags as chips. Everything between chips
  // continues to stage 2 (bare ID replacement).
  const out: ReactNode[] = [];
  let cursor = 0;
  let chipIdx = 0;

  CITATION_TAG_REGEX.lastIndex = 0;
  let citeMatch: RegExpExecArray | null;
  while ((citeMatch = CITATION_TAG_REGEX.exec(text)) !== null) {
    if (citeMatch.index > cursor) {
      out.push(
        ...replaceBareIds(
          text.slice(cursor, citeMatch.index),
          `${keyPrefix}-bare-${chipIdx}`,
        ),
      );
    }
    const tagHead = citeMatch[1];
    const detail = citeMatch[2].trim();
    const kind: CitationKind = tagHead.startsWith("PAT-")
      ? "pattern"
      : tagHead === "user-context"
        ? "user-context"
        : "tenant-specific";
    out.push(
      <CitationChip
        key={`${keyPrefix}-chip-${chipIdx++}`}
        kind={kind}
        tagHead={tagHead}
        detail={detail}
      />,
    );
    cursor = citeMatch.index + citeMatch[0].length;
  }
  if (cursor < text.length) {
    out.push(...replaceBareIds(text.slice(cursor), `${keyPrefix}-bare-tail`));
  }
  return out;
}

export function replaceBareIds(text: string, keyPrefix: string): ReactNode[] {
  // Find all matches across the three bare-ID regexes, ordered by
  // position, prefer pattern > program > source on overlap.
  type Match = { start: number; end: number; node: ReactNode };
  const matches: Match[] = [];
  let n = 0;

  for (const [regex, family] of [
    [PATTERN_ID_REGEX, "pattern"],
    [PROGRAM_ID_REGEX, "program"],
    [SOURCE_ID_REGEX, "source"],
  ] as const) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const id = m[0];
      const start = m.index;
      const end = start + id.length;
      // Skip if overlaps a higher-priority match already recorded
      if (matches.some((x) => start < x.end && end > x.start)) continue;
      const href =
        family === "pattern"
          ? `/source/patterns/${id}`
          : family === "program"
            ? `/programs/${id}`
            : `/source/${id}`;
      matches.push({
        start,
        end,
        node: (
          <IdLink
            key={`${keyPrefix}-${family}-${n++}`}
            id={id}
            href={href}
            family={family}
          />
        ),
      });
    }
  }
  matches.sort((a, b) => a.start - b.start);

  if (matches.length === 0) return [text];

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) out.push(text.slice(cursor, m.start));
    out.push(m.node);
    cursor = m.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

// ── Children walker ───────────────────────────────────────────────────────────
//
// react-markdown passes `children` to component overrides as a ReactNode.
// When it's a string we tokenize it; when it's an array we tokenize the
// string entries and leave React elements alone.

export function tokenizeChildren(
  children: ReactNode,
  keyPrefix: string,
  inlineNodes?: ReadonlyMap<string, ReactNode>,
): ReactNode {
  if (typeof children === "string") {
    return tokenize(children, keyPrefix, inlineNodes);
  }
  if (Array.isArray(children)) {
    return children.flatMap((child, idx) => {
      if (typeof child === "string") {
        return tokenize(child, `${keyPrefix}-${idx}`, inlineNodes);
      }
      return [child];
    });
  }
  return children;
}
