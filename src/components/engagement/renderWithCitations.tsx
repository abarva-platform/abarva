import { Fragment, type ReactNode } from 'react';
import { CitationPill } from './CitationPill';

// Matches: [source_key], [source_key § section.part], [source_key, page 42]
// source_key: lowercase letters/digits/underscores, at least 3 chars
const CITATION_RE = /\[([a-z][a-z0-9_]{2,})(?:\s+§\s+([^\]]+?)|,\s+page\s+(\d+))?\]/g;

export function renderWithCitations(text: string): ReactNode {
  if (!text) return text;
  CITATION_RE.lastIndex = 0;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let n = 0;

  while ((m = CITATION_RE.exec(text)) !== null) {
    if (m.index > lastIndex) {
      parts.push(<Fragment key={`t-${n}`}>{text.slice(lastIndex, m.index)}</Fragment>);
    }
    parts.push(
      <CitationPill
        key={`c-${n}`}
        sourceKey={m[1]}
        section={m[2]?.trim()}
        page={m[3]}
      />,
    );
    lastIndex = CITATION_RE.lastIndex;
    n += 1;
  }

  if (lastIndex < text.length) {
    parts.push(<Fragment key={`t-${n}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return parts.length > 0 ? parts : text;
}
