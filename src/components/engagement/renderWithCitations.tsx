import { Fragment, type ReactNode } from 'react';
import { CitationPill } from './CitationPill';
import { MicroBar, MicroGauge, MicroBarbell, MicroSparkline } from '@/components/viz/MicroViz';

// Citation: [source_key], [source_key § section], [source_key, page 42]
const CITATION_RE = /\[([a-z][a-z0-9_]{2,})(?:\s+§\s+([^\]]+?)|,\s+page\s+(\d+))?\]/g;

// Micro-viz markup (Pack D Principle 5):
//   <viz type="bar"      value="82" max="100"/>
//   <viz type="gauge"    value="67" max="100"/>
//   <viz type="compare"  value="15.2" benchmark="21.8" better="lower"/>
//   <viz type="sparkline" data="42,44,41,46,45,48"/>
const VIZ_RE = /<viz\s+([^/]+?)\/>/g;

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /(\w+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(raw)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function renderViz(raw: string, key: string): ReactNode {
  const attrs = parseAttrs(raw);
  const type = attrs.type;
  if (type === 'bar') {
    return <MicroBar key={key} value={parseFloat(attrs.value)} max={attrs.max ? parseFloat(attrs.max) : undefined} />;
  }
  if (type === 'gauge') {
    return <MicroGauge key={key} value={parseFloat(attrs.value)} max={attrs.max ? parseFloat(attrs.max) : undefined} />;
  }
  if (type === 'compare') {
    return (
      <MicroBarbell
        key={key}
        client={parseFloat(attrs.value)}
        benchmark={parseFloat(attrs.benchmark)}
        min={attrs.min ? parseFloat(attrs.min) : undefined}
        max={attrs.max ? parseFloat(attrs.max) : undefined}
        betterDirection={attrs.better === 'lower' ? 'lower' : 'higher'}
      />
    );
  }
  if (type === 'sparkline') {
    const data = (attrs.data ?? '').split(',').map((s) => parseFloat(s.trim())).filter((v) => Number.isFinite(v));
    return <MicroSparkline key={key} data={data} />;
  }
  return null;
}

type Token =
  | { kind: 'citation'; match: RegExpExecArray }
  | { kind: 'viz'; match: RegExpExecArray };

export function renderWithCitations(text: string): ReactNode {
  if (!text) return text;

  const tokens: Token[] = [];
  CITATION_RE.lastIndex = 0;
  VIZ_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CITATION_RE.exec(text)) !== null) tokens.push({ kind: 'citation', match: m });
  while ((m = VIZ_RE.exec(text)) !== null) tokens.push({ kind: 'viz', match: m });

  if (tokens.length === 0) return text;

  tokens.sort((a, b) => (a.match.index - b.match.index));

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let n = 0;
  for (const tok of tokens) {
    const start = tok.match.index;
    const end = start + tok.match[0].length;
    if (start < lastIndex) continue; // overlap — skip
    if (start > lastIndex) {
      parts.push(<Fragment key={`t-${n}`}>{text.slice(lastIndex, start)}</Fragment>);
      n += 1;
    }
    if (tok.kind === 'citation') {
      parts.push(
        <CitationPill
          key={`c-${n}`}
          sourceKey={tok.match[1]}
          section={tok.match[2]?.trim()}
          page={tok.match[3]}
        />,
      );
    } else if (tok.kind === 'viz') {
      parts.push(renderViz(tok.match[1], `v-${n}`));
    }
    n += 1;
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={`t-${n}`}>{text.slice(lastIndex)}</Fragment>);
  }
  return parts;
}
