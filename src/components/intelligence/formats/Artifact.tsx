'use client';

import type { NexusTurnPayload } from '@/lib/intelligence/types';

function artifactMeta(payload: NexusTurnPayload) {
  const metadata = payload.artifact_metadata ?? {};
  const governanceState = metadata.governance_state === 'persistent' ? 'persistent' : 'ephemeral';
  const promotionEligible = metadata.promotion_eligible !== false;
  const partOfProgram =
    typeof metadata.part_of_program === 'string' ? metadata.part_of_program : null;
  const version = typeof metadata.version === 'string' ? metadata.version : null;

  return { governanceState, promotionEligible, partOfProgram, version };
}

export function Artifact({
  payload,
  onAction,
}: {
  payload: NexusTurnPayload;
  onAction?: (action: 'download_pdf' | 'download_html' | 'copy' | 'promote') => void;
}) {
  const meta = artifactMeta(payload);

  return (
    <div className="intel-format-block">
      <div className="intel-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="intel-chip mono amber">{payload.artifact_type ?? 'artifact'}</div>
        <div className="intel-chip mono">{meta.governanceState}</div>
      </div>
      {payload.hero ? <div className="intel-title" style={{ fontSize: 30 }}>{payload.hero}</div> : null}
      <div className="intel-artifact-paper">
        {payload.artifact_html ? (
          <div dangerouslySetInnerHTML={{ __html: payload.artifact_html }} />
        ) : (
          <div>{payload.answer ?? 'Artifact body unavailable.'}</div>
        )}
      </div>
      <div className="intel-inline-list" style={{ marginTop: 12 }}>
        <button type="button" className="intel-button-outline" onClick={() => onAction?.('download_pdf')}>
          Download PDF
        </button>
        <button type="button" className="intel-button-outline" onClick={() => onAction?.('download_html')}>
          Download HTML
        </button>
        <button type="button" className="intel-button-outline" onClick={() => onAction?.('copy')}>
          Copy
        </button>
        <button
          type="button"
          className="intel-button"
          onClick={() => onAction?.('promote')}
          disabled={!meta.promotionEligible}
        >
          Attach to Program
        </button>
      </div>
      <div className="intel-subtle" style={{ marginTop: 12, fontSize: 12, lineHeight: 1.6 }}>
        {meta.governanceState === 'persistent'
          ? `PART OF${meta.partOfProgram ? ` · ${meta.partOfProgram}` : ''}${meta.version ? ` · ${meta.version}` : ''}`
          : 'EPHEMERAL · NOT CATALOGUED · auto-deletes unless attached to a program.'}
      </div>
    </div>
  );
}
