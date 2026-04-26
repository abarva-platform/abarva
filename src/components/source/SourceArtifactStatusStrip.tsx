import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import type { SourceArtifactStatusStripSeedItem } from '@/lib/source/mock-seed';
import { sourceSectionLabel } from './foundationStyles';

export function SourceArtifactStatusStrip({
  artifacts,
}: {
  artifacts: SourceArtifactStatusStripSeedItem[];
}) {
  return (
    <section style={SECTION} aria-label="Source artifact status strip">
      <div style={HEADER}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Artifacts and deliverables</div>
          <h4 style={{ margin: '4px 0 0', color: EXPERIENCE_COLORS.textPrimary }}>Deterministic artifact status strip</h4>
          <p style={{ margin: '7px 0 0', ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Metadata-only strip. No artifact drawer, generation, export/import, or approval workflow execution.
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={TABLE_HEAD}>Artifact</th>
              <th style={TABLE_HEAD}>Status</th>
              <th style={TABLE_HEAD}>Owner agent</th>
              <th style={TABLE_HEAD}>Version</th>
              <th style={TABLE_HEAD}>Evidence state</th>
              <th style={TABLE_HEAD}>Approval state</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((artifact) => (
              <tr key={artifact.artifactName}>
                <td style={TABLE_CELL}>{artifact.artifactName}</td>
                <td style={TABLE_CELL}>
                  <span style={{ ...PILL, color: statusColor(artifact.status), borderColor: statusColor(artifact.status) }}>
                    {artifact.status}
                  </span>
                </td>
                <td style={TABLE_CELL}>{artifact.ownerAgent}</td>
                <td style={TABLE_CELL}>{artifact.version}</td>
                <td style={TABLE_CELL}>{artifact.evidenceState}</td>
                <td style={TABLE_CELL}>{artifact.approvalState}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function statusColor(status: SourceArtifactStatusStripSeedItem['status']): string {
  if (status === 'approved' || status === 'locked') return EXPERIENCE_COLORS.journeyComplete;
  if (status === 'changes_requested' || status === 'needs_inputs') return EXPERIENCE_COLORS.riskAmber;
  if (status === 'not_started') return EXPERIENCE_COLORS.textSecondary;
  return EXPERIENCE_COLORS.accentBlue;
}

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surface,
  padding: 12,
};

const HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 920,
};

const TABLE_HEAD: CSSProperties = {
  ...TEXT.small,
  textAlign: 'left',
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  color: EXPERIENCE_COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '8px 10px',
};

const TABLE_CELL: CSSProperties = {
  ...TEXT.small,
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: EXPERIENCE_COLORS.textPrimary,
};

const PILL: CSSProperties = {
  border: '1px solid',
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: '11px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
};
