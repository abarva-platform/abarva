// markdownTokens · F0.1 of Programs Strict Completion v1.2
//
// Pure tokenization layer for agent text: regex constants, citation chip
// component, ID-link component, tokenize/replaceBareIds helpers. No
// dependency on `react-markdown` so this module is importable from Jest
// (react-markdown ships ESM that next/jest can't transpile by default).
//
// `markdownRenderer.tsx` consumes this file and adds the markdown
// rendering layer on top.

'use client';

import type { ReactNode } from 'react';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

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
  'Drawing on general practice (not AbarVa-specific):';

// ── Citation chip ─────────────────────────────────────────────────────────────

type CitationKind = 'user-context' | 'tenant-specific' | 'pattern';

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
      case 'user-context':
        return [
          'rgba(12,26,58,0.08)', // navyInk @ 8%
          BrandColors.navyInk,
          'rgba(12,26,58,0.18)',
          'YOU',
          undefined,
        ] as const;
      case 'tenant-specific':
        return [
          'rgba(0,102,204,0.08)', // signalBlue @ 8%
          BrandColors.signalBlue,
          'rgba(0,102,204,0.22)',
          'TENANT',
          undefined,
        ] as const;
      case 'pattern':
        return [
          BrandColors.paper,
          BrandColors.navyInk,
          'rgba(12,26,58,0.22)',
          tagHead,
          `/source/patterns/${tagHead}`,
        ] as const;
    }
  })();

  const inner = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 6,
        padding: '0 8px',
        borderRadius: 999,
        background: bg,
        border: `1px solid ${border}`,
        color: fg,
        fontFamily: BrandTypography.sans,
        fontSize: 11,
        lineHeight: 1.6,
        verticalAlign: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
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
    <a href={href} style={{ textDecoration: 'none' }}>
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
  family: 'pattern' | 'program' | 'source';
}

export function IdLink({ id, href, family }: IdLinkProps) {
  const color =
    family === 'program' ? BrandColors.signalBlue : BrandColors.navyInk;
  return (
    <a
      href={href}
      style={{
        color,
        fontFamily: BrandTypography.mono,
        fontSize: '0.92em',
        textDecoration: 'underline',
        textUnderlineOffset: 2,
        textDecorationColor: 'rgba(12,26,58,0.32)',
      }}
    >
      {id}
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
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const inlineRegex = new RegExp(`(${escaped})`, 'g');
    const segments = text.split(inlineRegex);
    const out: ReactNode[] = [];
    let segIdx = 0;
    for (const segment of segments) {
      const node = inlineNodes.get(segment);
      if (node !== undefined) {
        out.push(<span key={`${keyPrefix}-inline-${segIdx++}`}>{node}</span>);
      } else if (segment.length > 0) {
        out.push(...tokenizeWithoutInline(segment, `${keyPrefix}-seg-${segIdx++}`));
      }
    }
    return out;
  }
  return tokenizeWithoutInline(text, keyPrefix);
}

export function tokenizeWithoutInline(text: string, keyPrefix: string): ReactNode[] {
  // Stage 1: pull out citation tags as chips. Everything between chips
  // continues to stage 2 (bare ID replacement).
  const out: ReactNode[] = [];
  let cursor = 0;
  let chipIdx = 0;

  CITATION_TAG_REGEX.lastIndex = 0;
  let citeMatch: RegExpExecArray | null;
  while ((citeMatch = CITATION_TAG_REGEX.exec(text)) !== null) {
    if (citeMatch.index > cursor) {
      out.push(
        ...replaceBareIds(text.slice(cursor, citeMatch.index), `${keyPrefix}-bare-${chipIdx}`),
      );
    }
    const tagHead = citeMatch[1];
    const detail = citeMatch[2].trim();
    const kind: CitationKind = tagHead.startsWith('PAT-')
      ? 'pattern'
      : tagHead === 'user-context'
        ? 'user-context'
        : 'tenant-specific';
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
    [PATTERN_ID_REGEX, 'pattern'],
    [PROGRAM_ID_REGEX, 'program'],
    [SOURCE_ID_REGEX, 'source'],
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
        family === 'pattern'
          ? `/source/patterns/${id}`
          : family === 'program'
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
  if (typeof children === 'string') {
    return tokenize(children, keyPrefix, inlineNodes);
  }
  if (Array.isArray(children)) {
    return children.flatMap((child, idx) => {
      if (typeof child === 'string') {
        return tokenize(child, `${keyPrefix}-${idx}`, inlineNodes);
      }
      return [child];
    });
  }
  return children;
}
