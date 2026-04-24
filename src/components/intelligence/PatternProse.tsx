'use client';

// PatternProse · C2-12
//
// Dr. L flagged that in-prose peer-pattern references like
// `pattern_analytics_modernization` inside a pattern's thesis text render
// as plain text, not hyperlinks. This component scans prose for
// `pattern_xxx_yyy` tokens (snake_case, the authoring convention used
// across the seed data and overlay files) and wraps them in Next.js
// Links when they resolve to a known pattern in the manifest.
//
// Unknown tokens render as plain text — we never create dead links.

import type { ReactNode } from 'react';
import Link from 'next/link';
import manifestJson from '@/lib/intelligence/generated/pattern-manifest.json';

// Read the slug list directly from the manifest JSON rather than going
// through `pattern-manifest.ts` \u2014 that module pulls in the server-only
// evidence-registry (fs access) and would break the client bundle.
// The JSON is a build artifact; slugs are stable at runtime.
interface ManifestShape {
  patterns?: Array<{ slug?: string }>;
}
const MANIFEST_PATTERNS = (manifestJson as ManifestShape).patterns ?? [];
const SLUG_SET = new Set(
  MANIFEST_PATTERNS.map((entry) => entry.slug).filter((slug): slug is string => Boolean(slug)),
);

function patternRoute(slug: string): string {
  return `/preview/intelligence/${slug}`;
}

function snakeToSlug(token: string): string {
  // `pattern_ai_governance_operating_model` -> `ai-governance-operating-model`
  return token.replace(/^pattern_/, '').replace(/_/g, '-');
}

interface PatternProseProps {
  children: string;
  /**
   * Optional wrapper element. Defaults to <span> so the component is
   * inline by default. Callers that want a <p> pass `as="p"`.
   */
  as?: 'span' | 'p';
  style?: React.CSSProperties;
  className?: string;
}

export function PatternProse({ children, as = 'span', style, className }: PatternProseProps) {
  const slugs = SLUG_SET;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  // Keep the global regex local to the render so React immutability lint
  // never sees shared module state being mutated via `lastIndex`.
  const tokenRe = /\bpattern_[a-z][a-z0-9_]*\b/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(children)) !== null) {
    const before = children.slice(lastIndex, match.index);
    if (before) parts.push(before);

    const token = match[0];
    const slug = snakeToSlug(token);
    if (slugs.has(slug)) {
      parts.push(
        <Link
          key={`p-${key++}`}
          href={patternRoute(slug)}
          style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'rgba(155,109,255,0.5)' }}
          title={`Open pattern · ${slug}`}
        >
          {slug}
        </Link>,
      );
    } else {
      // Unknown token · render as-is to avoid dead links.
      parts.push(token);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  const Wrapper = as;
  return (
    <Wrapper style={style} className={className}>
      {parts}
    </Wrapper>
  );
}
