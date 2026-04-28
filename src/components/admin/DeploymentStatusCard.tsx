// PROD5 · Deployment Status Card (Server Component).
//
// Surfaces the PROD4 deployment-status read model inside the platform Admin
// Production Readiness page. Honest unavailable display when tokens are
// absent. No external API call, no model invocation, no token value is
// read. AbarVa visual canon only — every token comes from
// @/lib/design/abarva-theme.

import type { CSSProperties } from 'react';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  TYPE,
} from '@/lib/design/abarva-theme';
import type {
  DeploymentStatusLiveStatus,
  DeploymentStatusResult,
  ProductionReadinessDeploymentSignal,
} from '@/lib/admin/deployment-status-ingestion';

interface DeploymentStatusCardProps {
  signal: ProductionReadinessDeploymentSignal;
}

const PROVIDER_LABELS: Record<DeploymentStatusResult['provider'], string> = {
  github: 'GitHub',
  vercel: 'Vercel',
};

const LIVE_STATUS_LABELS: Record<DeploymentStatusLiveStatus, string> = {
  unavailable: 'unavailable',
  configured: 'configured',
  error: 'error',
};

const cardStyle: CSSProperties = {
  background: COLORS.card,
  border: BORDER.hairline,
  borderRadius: RADIUS.md,
  boxShadow: '0 18px 45px rgba(10, 12, 18, 0.05)',
  padding: SPACING.xxl,
  display: 'grid',
  gap: SPACING.lg,
  fontFamily: FONT.body,
  color: COLORS.ink,
};

const eyebrowStyle: CSSProperties = {
  ...TYPE.eyebrow,
  color: COLORS.navy,
};

const titleStyle: CSSProperties = {
  ...TYPE.h2,
  margin: 0,
};

const summaryStyle: CSSProperties = {
  ...TYPE.body,
  color: COLORS.body,
  margin: 0,
};

const providerListStyle: CSSProperties = {
  display: 'grid',
  gap: SPACING.sm,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const providerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: SPACING.md,
  padding: `${SPACING.sm}px ${SPACING.md}px`,
  border: BORDER.hairlineSoft,
  borderRadius: RADIUS.sm,
  background: COLORS.surface2,
};

const providerNameStyle: CSSProperties = {
  ...TYPE.h3,
  margin: 0,
};

const providerMetaStyle: CSSProperties = {
  ...TYPE.caption,
  color: COLORS.muted,
};

const chipBaseStyle: CSSProperties = {
  fontFamily: FONT.mono,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: `${SPACING.xs}px ${SPACING.sm}px`,
  borderRadius: RADIUS.pill,
  border: `1px solid ${COLORS.navy}`,
};

const noteRowStyle: CSSProperties = {
  display: 'grid',
  gap: SPACING.xs,
  paddingTop: SPACING.md,
  borderTop: BORDER.hairlineSoft,
};

const labelStyle: CSSProperties = {
  ...TYPE.eyebrow,
  color: COLORS.muted,
};

const valueStyle: CSSProperties = {
  ...TYPE.caption,
  color: COLORS.body,
};

const disclaimerStyle: CSSProperties = {
  ...TYPE.caption,
  color: COLORS.muted,
  fontStyle: 'italic',
};

function chipStyleFor(): CSSProperties {
  // Single dark-blue accent for chips; no green, no fake-live coloring.
  // Intentionally not parameterized — the status difference is conveyed
  // through the chip text (unavailable / configured / error), not color.
  return {
    ...chipBaseStyle,
    color: COLORS.navy,
    background: COLORS.navySoft,
  };
}

function formatCheckedAt(checkedAt: string | null): string {
  if (!checkedAt) return '—';
  return checkedAt;
}

function describeLatestCheck(
  results: ReadonlyArray<DeploymentStatusResult>,
): string {
  for (const result of results) {
    if (result.checkedAt) return result.checkedAt;
  }
  return '—';
}

function deriveNextAction(
  signal: ProductionReadinessDeploymentSignal,
): string {
  if (signal.liveStatus === 'unavailable') {
    return 'Configure GITHUB_STATUS_TOKEN and VERCEL_STATUS_TOKEN to enable live status. Live polling is deferred to PROD6.';
  }
  if (signal.liveStatus === 'configured') {
    return 'Tokens are configured. PROD5 surfaces token presence only; live polling is deferred to PROD6.';
  }
  return 'Review provider error messages above. PROD5 does not yet poll provider APIs.';
}

function deriveLimitationNote(
  signal: ProductionReadinessDeploymentSignal,
): string {
  if (signal.liveStatus === 'unavailable') {
    return 'Tokens not configured. Live polling deferred to PROD6.';
  }
  if (signal.liveStatus === 'configured') {
    return 'Token presence detected only. No GitHub or Vercel API call is performed by PROD5.';
  }
  return 'At least one provider reports an error. PROD5 V1 does not call provider APIs.';
}

/**
 * Server Component. Renders the PROD4 deployment-status read model
 * honestly. The chip uses a single dark-blue accent for every state; the
 * card never claims real polling (PROD4 V1 does not poll providers).
 */
export function DeploymentStatusCard({ signal }: DeploymentStatusCardProps) {
  const lastCheckedLabel = describeLatestCheck(signal.results);
  const limitation = deriveLimitationNote(signal);
  const nextAction = deriveNextAction(signal);

  return (
    <section style={cardStyle} aria-label="Deployment status">
      <div style={{ display: 'grid', gap: SPACING.xs }}>
        <span style={eyebrowStyle}>DEPLOYMENT STATUS · PROD5</span>
        <h2 style={titleStyle}>GitHub / Vercel deployment signal</h2>
        <p style={summaryStyle}>{signal.message}</p>
      </div>

      <ul style={providerListStyle}>
        {signal.results.map((result) => (
          <li key={result.provider} style={providerRowStyle}>
            <div style={{ display: 'grid', gap: 2 }}>
              <span style={providerNameStyle}>{PROVIDER_LABELS[result.provider]}</span>
              <span style={providerMetaStyle}>
                Last checked {formatCheckedAt(result.checkedAt)}
              </span>
            </div>
            <span style={chipStyleFor()} aria-label={`${PROVIDER_LABELS[result.provider]} live status`}>
              {LIVE_STATUS_LABELS[result.liveStatus]}
            </span>
          </li>
        ))}
      </ul>

      <div style={noteRowStyle}>
        <div style={{ display: 'grid', gap: 2 }}>
          <span style={labelStyle}>Last checked</span>
          <span style={valueStyle}>{lastCheckedLabel}</span>
        </div>
        <div style={{ display: 'grid', gap: 2 }}>
          <span style={labelStyle}>Current limitation</span>
          <span style={valueStyle}>{limitation}</span>
        </div>
        <div style={{ display: 'grid', gap: 2 }}>
          <span style={labelStyle}>Next action</span>
          <span style={valueStyle}>{nextAction}</span>
        </div>
        <span style={disclaimerStyle}>
          No fake green. liveStatus reflects honest token presence.
        </span>
      </div>
    </section>
  );
}
