// AgentMarkdown · F0.1 of Programs Strict Completion v1.2
//
// Closes Crawl Obs #3, #28: agent responses currently render markdown as
// raw text (asterisks, pipe tables, hash symbols visible as literal
// characters). This component renders agent text through react-markdown +
// remark-gfm with brand-aligned styling and custom resolution of:
//   - Pattern IDs (PAT-…, T#-…) → /source/patterns/[id]
//   - Program IDs (APX-…) → /programs/[id]
//   - Source event IDs (SRC-…) → /source/[id]
//   - Citation tags ([user-context: …], [tenant-specific: …], [PAT-…: …])
//     → inline chips per the synthesis instruction layer (F0.3)
//
// Pure tokenization (regexes, citation chip, ID-link, tokenize helpers)
// lives in `markdownTokens.tsx` so it can be unit-tested without pulling
// in react-markdown's ESM (which next/jest can't transpile by default).
//
// Coexistence with `{{cite:type:id}}` placeholders in AgentResponse.tsx:
// AgentResponse builds an `inlineNodes` map keyed by placeholder string
// and passes it through. This component substitutes those placeholders
// inline before any other tokenization runs.

'use client';

import { useMemo } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';
import {
  GENERAL_PRACTICE_PREFACE,
  tokenizeChildren,
} from './markdownTokens';

// ── Component overrides ───────────────────────────────────────────────────────
//
// Each markdown element override is bound to the caller's `inlineNodes`
// map via closure. AgentMarkdown builds the components map per-call so
// that overrides see the current inline substitutions without going
// through React context (which would force hooks inside lowercase-named
// callbacks and trip rules-of-hooks lint).

type MdComponents = NonNullable<ComponentPropsWithoutRef<typeof ReactMarkdown>['components']>;

function buildComponents(
  inlineNodes: ReadonlyMap<string, ReactNode> | undefined,
): MdComponents {
  return {
    p: ({ children }) => {
      // Layer-3 fallback preface: italicize the literal preface phrase
      if (typeof children === 'string' && children.trim().startsWith(GENERAL_PRACTICE_PREFACE)) {
        const rest = children.trim().slice(GENERAL_PRACTICE_PREFACE.length);
        return (
          <p
            style={{
              margin: '0.6em 0',
              fontStyle: 'italic',
              color: BrandColors.slate,
              borderLeft: `2px solid ${BrandColors.stone}`,
              paddingLeft: 10,
            }}
          >
            <span style={{ fontWeight: 500 }}>{GENERAL_PRACTICE_PREFACE}</span>
            {rest}
          </p>
        );
      }
      return <p style={{ margin: '0.6em 0' }}>{tokenizeChildren(children, 'p', inlineNodes)}</p>;
    },

    li: ({ children }) => (
      <li style={{ margin: '0.2em 0' }}>{tokenizeChildren(children, 'li', inlineNodes)}</li>
    ),

    h1: ({ children }) => (
      <h1
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: '1.4em',
          fontWeight: 400,
          margin: '0.8em 0 0.4em',
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, 'h1', inlineNodes)}
      </h1>
    ),
    h2: ({ children }) => (
      <h2
        style={{
          fontFamily: BrandTypography.serif,
          fontSize: '1.2em',
          fontWeight: 400,
          margin: '0.7em 0 0.35em',
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, 'h2', inlineNodes)}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        style={{
          fontSize: '1.05em',
          fontWeight: 600,
          margin: '0.6em 0 0.3em',
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, 'h3', inlineNodes)}
      </h3>
    ),
    h4: ({ children }) => (
      <h4
        style={{
          fontSize: '0.95em',
          fontWeight: 600,
          margin: '0.5em 0 0.25em',
          color: BrandColors.inkBlack,
        }}
      >
        {tokenizeChildren(children, 'h4', inlineNodes)}
      </h4>
    ),

    strong: ({ children }) => (
      <strong style={{ fontWeight: 600 }}>{tokenizeChildren(children, 'strong', inlineNodes)}</strong>
    ),
    em: ({ children }) => (
      <em>{tokenizeChildren(children, 'em', inlineNodes)}</em>
    ),

    code: ({ children, className }) => {
      // Block code (fenced) gets a className like `language-…`; inline code does not.
      const isBlock = typeof className === 'string' && className.startsWith('language-');
      if (isBlock) {
        return (
          <code
            className={className}
            style={{
              fontFamily: BrandTypography.mono,
              fontSize: '0.88em',
            }}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: '0.88em',
            background: 'rgba(12,26,58,0.06)',
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre
        style={{
          background: 'rgba(12,26,58,0.04)',
          border: `1px solid rgba(12,26,58,0.12)`,
          borderRadius: 6,
          padding: '10px 12px',
          margin: '0.7em 0',
          overflowX: 'auto',
          fontFamily: BrandTypography.mono,
          fontSize: '0.85em',
          lineHeight: 1.55,
          color: BrandColors.inkBlack,
        }}
      >
        {children}
      </pre>
    ),

    a: ({ children, href }) => (
      <a
        href={href}
        style={{ color: BrandColors.signalBlue, textDecoration: 'underline', textUnderlineOffset: 2 }}
      >
        {children}
      </a>
    ),

    ul: ({ children }) => (
      <ul style={{ margin: '0.4em 0', paddingLeft: '1.4em' }}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol style={{ margin: '0.4em 0', paddingLeft: '1.4em' }}>{children}</ol>
    ),

    blockquote: ({ children }) => (
      <blockquote
        style={{
          margin: '0.6em 0',
          padding: '4px 12px',
          borderLeft: `3px solid ${BrandColors.stone}`,
          color: BrandColors.slate,
          fontStyle: 'italic',
        }}
      >
        {children}
      </blockquote>
    ),

    hr: () => (
      <hr
        style={{
          border: 0,
          borderTop: `1px solid rgba(12,26,58,0.12)`,
          margin: '1em 0',
        }}
      />
    ),

    table: ({ children }) => (
      <div style={{ overflowX: 'auto', margin: '0.8em 0' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            background: BrandColors.paper,
            border: `1px solid rgba(12,26,58,0.18)`,
            fontSize: '0.92em',
            width: '100%',
          }}
        >
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead style={{ background: 'rgba(12,26,58,0.04)' }}>{children}</thead>
    ),
    th: ({ children }) => (
      <th
        style={{
          textAlign: 'left',
          padding: '6px 10px',
          borderBottom: `1px solid rgba(12,26,58,0.18)`,
          fontWeight: 600,
          color: BrandColors.inkBlack,
          fontSize: '0.86em',
          letterSpacing: '0.02em',
        }}
      >
        {tokenizeChildren(children, 'th', inlineNodes)}
      </th>
    ),
    td: ({ children }) => (
      <td
        style={{
          padding: '6px 10px',
          borderBottom: `1px solid rgba(12,26,58,0.08)`,
          verticalAlign: 'top',
        }}
      >
        {tokenizeChildren(children, 'td', inlineNodes)}
      </td>
    ),
  };
}

// ── Public component ──────────────────────────────────────────────────────────

export interface AgentMarkdownProps {
  /** Raw text emitted by the agent. May contain markdown, IDs, citation tags. */
  text: string;
  /**
   * Optional placeholder→React-node substitutions applied before any
   * other tokenization. Use this to embed pre-built nodes (e.g.
   * <AgentCitation> pills resolved from `{{cite:type:id}}` placeholders)
   * inline in the rendered markdown.
   */
  inlineNodes?: ReadonlyMap<string, ReactNode>;
}

/**
 * Renders agent-emitted text with markdown formatting plus inline
 * resolution of pattern/program/source IDs and synthesis citation tags.
 *
 * XSS is mitigated by `rehype-sanitize` running over the parsed AST
 * before our component overrides see it.
 */
export function AgentMarkdown({ text, inlineNodes }: AgentMarkdownProps) {
  const components = useMemo(() => buildComponents(inlineNodes), [inlineNodes]);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={components}
    >
      {text}
    </ReactMarkdown>
  );
}
