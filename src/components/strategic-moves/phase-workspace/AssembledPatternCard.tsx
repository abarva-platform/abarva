// Moves phase workspace — Claude-assembled pattern, AbarVa-validated (increment 12).
// Presentational: renders the VALIDATED assembly output. AbarVa builds the
// governed packet, Claude assembles options/tradeoffs/risks, and AbarVa labels
// each item — so the client sees what is evidence-backed vs. an assumption vs.
// needs-confirmation vs. not-recommended. Claude never sources numbers; those
// stay deterministic. Pure component — the packet→Claude→validate loop is server-side.

import * as React from 'react';
import type { ValidatedPatternItem, ValidationLabel } from '../../../lib/programs/phase-templates/types';
import { Card, Chip, type ChipTone } from './primitives';

const LABEL_META: Record<ValidationLabel, { text: string; tone: ChipTone }> = {
  evidence_backed: { text: 'Evidence-backed', tone: 'green' },
  needs_confirmation: { text: 'Needs confirmation', tone: 'amber' },
  not_allowed: { text: 'Not recommended', tone: 'red' },
  assumption: { text: 'Assumption', tone: 'blue' },
  draft_artifact: { text: 'Draft', tone: 'neutral' },
  promote_candidate: { text: 'Candidate', tone: 'blue' },
};

export function AssembledPatternCard({
  items,
}: {
  items: ValidatedPatternItem[];
}): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <Card
      kicker="Assembled options"
      title="AbarVa assembled these — and labeled each one"
      note="AbarVa composed options, tradeoffs, and risks from your evidence. Numbers stay from your evidence; each line is labeled for how far to trust it."
    >
      <ul className="pw-list">
        {items.map((it, i) => {
          const meta = LABEL_META[it.label];
          return (
            <li className="pw-li" key={i} style={{ alignItems: 'flex-start' }}>
              <span
                className="dot"
                style={{ background: `var(--${meta.tone === 'neutral' ? 'muted' : meta.tone})` }}
              />
              <span>
                {it.statement} <Chip tone={meta.tone}>{meta.text}</Chip>
                {it.reason ? <span className="pw-row-s"> — {it.reason}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="pw-foot">
        Assembled by AbarVa with Claude. Baselines, value, evidence, readiness, and approvals are
        never invented — they come from your Move. Move-scoped; not added to enterprise context.
      </p>
    </Card>
  );
}
