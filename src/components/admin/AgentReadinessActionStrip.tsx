'use client';
import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface AgentReadinessActionStripProps {
  onRefreshReadiness?: () => void;
  onExportReport?: () => void;
  onRunDiagnostic?: () => void;
  isRefreshing?: boolean;
}

export function AgentReadinessActionStrip({
  onRefreshReadiness,
  onExportReport,
  onRunDiagnostic,
  isRefreshing = false,
}: AgentReadinessActionStripProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: `${SPACING.sm} 0`,
      }}
    >
      <button
        type="button"
        onClick={onRefreshReadiness}
        disabled={isRefreshing}
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.navy,
          border: `1px solid ${COLORS.navy}40`,
          borderRadius: 4,
          background: COLORS.white,
          padding: `5px ${SPACING.md}`,
          cursor: isRefreshing ? 'default' : 'pointer',
          opacity: isRefreshing ? 0.6 : 1,
        }}
      >
        {isRefreshing ? 'Refreshing…' : 'Refresh Readiness'}
      </button>
      <button
        type="button"
        onClick={onRunDiagnostic}
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 500,
          color: COLORS.ink,
          border: `1px solid ${COLORS.ink}20`,
          borderRadius: 4,
          background: COLORS.white,
          padding: `5px ${SPACING.md}`,
          cursor: 'pointer',
        }}
      >
        Run Diagnostic
      </button>
      <button
        type="button"
        onClick={onExportReport}
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 500,
          color: `${COLORS.ink}80`,
          border: `1px solid ${COLORS.ink}14`,
          borderRadius: 4,
          background: 'transparent',
          padding: `5px ${SPACING.md}`,
          cursor: 'pointer',
        }}
      >
        Export Report
      </button>
    </div>
  );
}
