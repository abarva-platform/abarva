import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { CIRunRow } from '@/lib/admin/build-progress-page-view';

export interface CIMiniStripProps {
  runs: ReadonlyArray<CIRunRow>;
}

const STATUS_STYLES: Record<CIRunRow['status'], { bg: string; fg: string; label: string }> = {
  pass: { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Pass' },
  fail: { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Fail' },
  running: { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Running' },
};

/**
 * ADMIN15 — CI status mini-panel.
 *
 * Renders the deterministic CI snapshot (5 fake runs). NOT a live Vercel /
 * GitHub Actions feed. Real CI integration is deferred to Wave 27+.
 */
export function CIMiniStrip({ runs }: CIMiniStripProps) {
  return (
    <section
      data-component="CIMiniStrip"
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.lg,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: SPACING.md,
          flexWrap: 'wrap',
          gap: SPACING.sm,
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            fontWeight: 700,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          CI status
        </h2>
        <span
          data-ci-disclaimer="true"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}80`,
            fontStyle: 'italic',
          }}
        >
          Deterministic snapshot — real CI integration in Wave 27.
        </span>
      </header>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        <li
          data-ci-header="true"
          style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 100px 90px 160px',
            gap: SPACING.sm,
            padding: SPACING.sm,
            background: COLORS.cream,
            borderRadius: RADIUS.md,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: `${COLORS.ink}80`,
          }}
        >
          <span>Status</span>
          <span>Branch</span>
          <span>Commit</span>
          <span style={{ textAlign: 'right' }}>Duration</span>
          <span style={{ textAlign: 'right' }}>Completed</span>
        </li>
        {runs.map((run) => {
          const sc = STATUS_STYLES[run.status];
          return (
            <li
              key={run.id}
              data-ci-run={run.id}
              data-ci-status={run.status}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 100px 90px 160px',
                gap: SPACING.sm,
                padding: SPACING.sm,
                borderTop: `1px solid ${COLORS.ink}0a`,
                fontSize: 12,
                alignItems: 'center',
              }}
            >
              <span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: RADIUS.pill,
                    background: sc.bg,
                    color: sc.fg,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {sc.label}
                </span>
              </span>
              <span style={{ fontFamily: TYPOGRAPHY.mono, color: COLORS.ink }}>
                {run.branch}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  color: `${COLORS.ink}cc`,
                  fontSize: 11,
                }}
              >
                {run.commitSha}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  textAlign: 'right',
                  color: `${COLORS.ink}cc`,
                  fontSize: 11,
                }}
              >
                {formatDuration(run.durationSec)}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  textAlign: 'right',
                  color: `${COLORS.ink}80`,
                  fontSize: 11,
                }}
              >
                {run.completedAt}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
