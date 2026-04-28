'use client';

import type { AtlasSynthesisResult } from '@/lib/intelligence/atlas-synthesis';
import { renderCitationLabel } from '@/lib/intelligence/citation-renderer';

export function SynthesisOutput({ result }: { result: AtlasSynthesisResult }) {
  return (
    <section className="intel-card" aria-label="Atlas synthesis output">
      <div className="intel-turn-header">
        <div className="intel-inline-list">
          <span className="intel-chip mono teal">Atlas synthesis</span>
          <span className="intel-chip mono">deterministic</span>
          <span className="intel-chip mono">{result.wordCount} words</span>
        </div>
        <span className="intel-subtle">{result.version}</span>
      </div>

      <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.65 }}>{result.answer}</p>

      {result.citations.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <div className="intel-eyebrow">Cited corpus primitives</div>
          <ol style={{ margin: '10px 0 0', paddingLeft: 20 }}>
            {result.citations.map((citation) => (
              <li key={citation.primitiveId} style={{ marginTop: 8 }}>
                <span className="intel-chip mono">{citation.kind}</span>{' '}
                <span>{renderCitationLabel(citation)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
