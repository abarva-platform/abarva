// Moves phase workspace — "What Changed" card (client-final vs draft).
// Presentational: renders a deterministic WhatChangedResult. No model — it shows
// which sections changed and what next-phase work to review, then asks the
// client to confirm before the change is carried forward.

import * as React from 'react';
import type { WhatChangedResult } from '../../../lib/programs/phase-templates/what-changed';
import { Card, Chip, type ChipTone } from './primitives';

export function WhatChangedCard({
  result,
  onConfirm,
  confirmed = false,
}: {
  result: WhatChangedResult;
  /** Client confirmation before the change is carried forward. Optional. */
  onConfirm?: () => void;
  /** True once the client has confirmed the final version. */
  confirmed?: boolean;
}): React.ReactElement {
  if (!result.hasChanges) {
    return (
      <Card kicker="Client final review" title="What changed vs. the draft">
        <p className="pw-lead">
          No differences found between the draft and the final version.
        </p>
      </Card>
    );
  }

  const rows = (
    [
      { label: 'Sections changed', items: result.sectionsChanged, tone: 'amber' },
      { label: 'Sections added', items: result.sectionsAdded, tone: 'green' },
      { label: 'Sections removed', items: result.sectionsRemoved, tone: 'red' },
    ] as Array<{ label: string; items: string[]; tone: ChipTone }>
  ).filter((r) => r.items.length > 0);

  return (
    <Card
      kicker="Client final review"
      title="What changed vs. the draft"
      note={`${result.linesAdded} added · ${result.linesRemoved} removed`}
    >
      {rows.map((r, i) => (
        <div className="pw-kv" key={i}>
          <span className="pw-kv-k">{r.label}</span>
          <span className="pw-kv-v">
            {r.items.map((s, j) => (
              <React.Fragment key={j}>
                <Chip tone={r.tone}>{s}</Chip>{' '}
              </React.Fragment>
            ))}
          </span>
        </div>
      ))}

      {result.impactedNextPhaseInputs.length > 0 ? (
        <div className="pw-callout warn">
          <span className="pw-callout-t">Next phase to review</span>
          <ul className="pw-list">
            {result.impactedNextPhaseInputs.map((s, i) => (
              <li className="pw-li" key={i}>
                <span className="dot" style={{ background: 'var(--amber)' }} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="pw-gate">
        <div className="pw-row-main">
          <span className="pw-gate-t">
            {confirmed ? 'Final version confirmed' : 'Confirm the final version'}
          </span>
          <span className="pw-gate-s">
            {confirmed
              ? 'These changes will carry forward when you advance the phase.'
              : 'AbarVa carries the confirmed changes forward — you approve first.'}
          </span>
        </div>
        {confirmed ? (
          <span className="pw-gate-btn">✓ Confirmed</span>
        ) : onConfirm ? (
          <button type="button" className="pw-gate-btn" onClick={onConfirm}>
            Confirm changes →
          </button>
        ) : (
          <span className="pw-gate-btn">Confirm changes →</span>
        )}
      </div>
    </Card>
  );
}
