'use client';

import type { Source } from '@/lib/intelligence/types';

export function SourcePill({ source }: { source: Source }) {
  const body = (
    <>
      <span>{source.name}</span>
      {source.detail ? <span style={{ opacity: 0.7 }}>· {source.detail}</span> : null}
    </>
  );

  if (source.url) {
    return (
      <a className="intel-chip mono" href={source.url} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }

  return <span className="intel-chip mono">{body}</span>;
}
