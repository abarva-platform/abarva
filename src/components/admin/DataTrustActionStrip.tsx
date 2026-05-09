'use client';
import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface DataTrustActionStripProps {
  onSyncNow?: () => void;
  onExportLineage?: () => void;
  onAddDataset?: () => void;
  isSyncing?: boolean;
}

export function DataTrustActionStrip({
  onSyncNow,
  onExportLineage,
  onAddDataset,
  isSyncing = false,
}: DataTrustActionStripProps) {
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
        onClick={onAddDataset}
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.white,
          background: COLORS.navy,
          border: 'none',
          borderRadius: 4,
          padding: `5px ${SPACING.md}`,
          cursor: 'pointer',
        }}
      >
        Add Dataset
      </button>
      <button
        type="button"
        onClick={onSyncNow}
        disabled={isSyncing}
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.navy,
          border: `1px solid ${COLORS.navy}40`,
          borderRadius: 4,
          background: COLORS.white,
          padding: `5px ${SPACING.md}`,
          cursor: isSyncing ? 'default' : 'pointer',
          opacity: isSyncing ? 0.6 : 1,
        }}
      >
        {isSyncing ? 'Syncing…' : 'Sync Now'}
      </button>
      <button
        type="button"
        onClick={onExportLineage}
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
        Export Lineage
      </button>
    </div>
  );
}
