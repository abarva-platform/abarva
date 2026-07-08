// Moves phase workspace — feed-forward card ("a phase never starts blank").
// Presentational: renders a deterministic, transition-aware FeedForwardPack
// (buildFeedForwardPack) derived from real move state. No model, no fabrication —
// unpopulated sections show "Needs confirmation", never invented content.

import * as React from 'react';
import type { FeedForwardPack } from '../../../lib/programs/phase-templates/feed-forward';
import { Card, Chip } from './primitives';

export function NextPhaseFeedForwardCard({
  pack,
}: {
  pack: FeedForwardPack;
}): React.ReactElement {
  return (
    <Card
      kicker="Feed forward"
      title={pack.headline}
      note="The next phase never starts blank — this is what your current-state work carries forward."
    >
      <div>
        <span className="pw-kicker" style={{ color: 'var(--muted)' }}>
          AbarVa will carry forward
        </span>
        <ul className="pw-list" style={{ marginTop: 8 }}>
          {pack.carriesForward.map((c, i) => (
            <li className="pw-li" key={i}>
              <span className="dot" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pw-grid-2">
        {pack.sections.map((sec, i) => (
          <div className="pw-kv" key={i}>
            <span className="pw-kv-k">{sec.title}</span>
            {sec.status === 'ready' ? (
              <span className="pw-kv-v">{sec.items.join('  ·  ')}</span>
            ) : (
              <span style={{ marginTop: 2 }}>
                <Chip tone="amber">{sec.emptyLabel}</Chip>
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
