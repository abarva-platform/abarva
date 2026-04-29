// ReasoningHealthBadge — server component.
//
// Renders a compact health indicator for the reasoning layer on the
// `/admin/reasoning` dashboard. Calls the pure `runAllHealthChecks` helper
// (the same helper that backs `GET /api/reasoning/health`) at render time
// so the badge state is always consistent with the endpoint and a self-fetch
// loop on the same Next.js process is avoided.
//
// Visual: status dot + pass/total count, in the AbarVa palette.
//   - Green dot (mintInk) when every check passes
//   - Amber dot (a darkened cream-aware token) when any check fails
// No client JS — deterministic point-in-time render.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { runAllHealthChecks } from '@/lib/reasoning/health-checks';

const AMBER_DOT = '#B7791F'; // tonal amber that reads on the cream surface
const AMBER_TINT = '#FBEFD8';

export function ReasoningHealthBadge() {
  const report = runAllHealthChecks();
  const passing = report.checks.filter((c) => c.status === 'pass').length;
  const total = report.checks.length;
  const ok = report.ok;

  const dotColor = ok ? COLORS.mintInk : AMBER_DOT;
  const tint = ok ? COLORS.mintSoft : AMBER_TINT;
  const label = ok ? 'Reasoning healthy' : 'Reasoning attention';

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: tint,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: dotColor,
          }}
        />
      </span>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Self-test
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.15,
          }}
        >
          {label}
        </span>
      </div>

      <span
        style={{
          marginLeft: 'auto',
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: `${COLORS.ink}99`,
        }}
      >
        {passing} / {total} checks passing
      </span>
    </div>
  );
}
