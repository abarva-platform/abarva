'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ProductionReadinessTracker } from '@/components/admin/ProductionReadinessTracker';
import { BORDER, COLORS, FONT, RADIUS, SPACING, TYPE } from '@/lib/design/abarva-theme';
import type { ProductionReadinessApiResponse } from '@/lib/admin/production-readiness';

type RefreshStatus = 'refreshed' | 'refreshing' | 'error';

interface ProductionReadinessLivePanelProps {
  initialResponse: ProductionReadinessApiResponse;
  refreshIntervalMs?: number;
}

const DEFAULT_REFRESH_INTERVAL_MS = 60_000;

const statusShellStyle: CSSProperties = {
  background: COLORS.surface,
  borderBottom: BORDER.hairline,
  color: COLORS.ink,
  fontFamily: FONT.body,
  position: 'sticky',
  top: 0,
  zIndex: 20,
};

const statusInnerStyle: CSSProperties = {
  maxWidth: 1480,
  margin: '0 auto',
  padding: `${SPACING.sm}px ${SPACING.xxl}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: SPACING.md,
  flexWrap: 'wrap',
};

const buttonStyle: CSSProperties = {
  ...TYPE.caption,
  border: `1px solid ${COLORS.navy}`,
  borderRadius: RADIUS.sm,
  background: COLORS.navy,
  color: COLORS.card,
  cursor: 'pointer',
  fontWeight: 700,
  padding: `${SPACING.xs}px ${SPACING.md}px`,
};

const mutedLabelStyle: CSSProperties = {
  ...TYPE.caption,
  color: COLORS.muted,
};

export function ProductionReadinessLivePanel({
  initialResponse,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
}: ProductionReadinessLivePanelProps) {
  const [response, setResponse] = useState<ProductionReadinessApiResponse>(initialResponse);
  const [status, setStatus] = useState<RefreshStatus>('refreshed');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus('refreshing');
    setErrorMessage(null);

    try {
      const apiResponse = await fetch('/api/admin/production-readiness', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!apiResponse.ok) {
        throw new Error(`Refresh failed with status ${apiResponse.status}`);
      }

      const nextResponse = (await apiResponse.json()) as ProductionReadinessApiResponse;
      setResponse(nextResponse);
      setStatus('refreshed');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Refresh failed');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [refresh, refreshIntervalMs]);

  const lastRefreshedLabel = useMemo(
    () => formatRefreshTimestamp(response.generatedAt),
    [response.generatedAt],
  );
  const statusLabel =
    status === 'refreshing' ? 'Refreshing' : status === 'error' ? 'Refresh error' : 'Refreshed';

  return (
    <>
      <div style={statusShellStyle}>
        <div style={statusInnerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md, flexWrap: 'wrap' }}>
            <span style={{ ...TYPE.eyebrow, color: COLORS.navy }}>Production Readiness Control Plane</span>
            <span style={mutedLabelStyle}>Last refreshed {lastRefreshedLabel}</span>
            <span style={mutedLabelStyle}>{statusLabel}</span>
            <span style={mutedLabelStyle}>
              {response.refreshMode} - CI/Vercel status {response.liveCiStatus}
            </span>
            <span style={mutedLabelStyle}>
              {response.updateMode} - {response.freshnessStatus}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={status === 'refreshing'}
            style={{
              ...buttonStyle,
              opacity: status === 'refreshing' ? 0.68 : 1,
            }}
          >
            Refresh
          </button>
          {errorMessage ? (
            <div style={{ ...TYPE.caption, color: COLORS.red, flexBasis: '100%' }}>
              Showing the server-rendered manifest while the API refresh recovers: {errorMessage}
            </div>
          ) : (
            <div style={{ ...TYPE.caption, color: COLORS.muted, flexBasis: '100%' }}>
              {response.note}
            </div>
          )}
        </div>
      </div>
      <ProductionReadinessTracker view={response.view} />
    </>
  );
}

function formatRefreshTimestamp(isoTimestamp: string): string {
  const parsed = Date.parse(isoTimestamp);
  if (Number.isNaN(parsed)) return isoTimestamp;
  return new Date(parsed).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
