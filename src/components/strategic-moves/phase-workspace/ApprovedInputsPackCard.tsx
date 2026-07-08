// Moves phase workspace — the approved Inputs Pack a phase inherited.
// Presentational: when the prior phase's review was confirmed, its approved pack
// is read back here so the phase "starts pre-filled from an approved source" —
// distinct from the deterministic feed-forward fallback. Move-scoped; the card
// states plainly that it is NOT in enterprise context.

import * as React from 'react';
import type { ApprovedInputsPack } from '../../../lib/programs/phase-templates/approved-inputs-pack';
import { Card, Chip } from './primitives';

export function ApprovedInputsPackCard({
  pack,
  approvedOnLabel,
}: {
  pack: ApprovedInputsPack;
  /** Human date for approvedAt, formatted by the host (core takes no clock). */
  approvedOnLabel?: string;
}): React.ReactElement {
  return (
    <Card
      kicker="Approved for this phase"
      title="You’re starting from an approved Inputs Pack"
      note="The previous phase’s review was confirmed — this is the approved hand-off, not a draft."
    >
      <div className="pw-row-meta" style={{ justifyContent: 'flex-start' }}>
        <Chip tone="green">Approved for next phase</Chip>
        {approvedOnLabel ? <Chip>Approved {approvedOnLabel}</Chip> : null}
      </div>

      <ul className="pw-list">
        {pack.carriesForward.map((c, i) => (
          <li className="pw-li" key={i}>
            <span className="tick">✓</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>

      {pack.sections.length > 0 ? (
        <div className="pw-grid-2">
          {pack.sections.map((s, i) => (
            <div className="pw-kv" key={i}>
              <span className="pw-kv-k">{s.title}</span>
              <span className="pw-kv-v">{s.items.join('  ·  ')}</span>
            </div>
          ))}
        </div>
      ) : null}

      {pack.changeSummary ? (
        <div className="pw-callout">
          <span className="pw-callout-t">Client-confirmed changes carried forward</span>
          <span className="pw-note">
            {[
              pack.changeSummary.sectionsChanged.length
                ? `${pack.changeSummary.sectionsChanged.length} changed`
                : '',
              pack.changeSummary.sectionsAdded.length
                ? `${pack.changeSummary.sectionsAdded.length} added`
                : '',
              pack.changeSummary.sectionsRemoved.length
                ? `${pack.changeSummary.sectionsRemoved.length} removed`
                : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      ) : null}

      <p className="pw-foot">Enterprise context: Not added yet.</p>
    </Card>
  );
}
