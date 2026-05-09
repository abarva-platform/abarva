'use client';
import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface DatasetDetail {
  id: string;
  name: string;
  description?: string;
  rung: 1 | 2 | 3;
  sourceConnector: string;
  recordCount: number;
  freshnessDays: number;
  lastSyncedAt: string;
  schema?: Array<{ field: string; type: string }>;
}

export interface DatasetDetailDrawerProps {
  dataset: DatasetDetail | null;
  onClose: () => void;
}

export function DatasetDetailDrawer({ dataset, onClose }: DatasetDetailDrawerProps) {
  if (!dataset) return null;

  return (
    <aside
      aria-label="Dataset detail"
      style={{
        width: 360,
        borderLeft: `1px solid ${COLORS.ink}14`,
        background: COLORS.white,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}14`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <p
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}60`,
              margin: 0,
            }}
          >
            Rung {dataset.rung} · Dataset
          </p>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.ink,
              margin: '4px 0 0',
            }}
          >
            {dataset.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dataset detail"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 16,
            color: `${COLORS.ink}60`,
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: SPACING.lg, overflowY: 'auto', flex: 1 }}>
        {dataset.description ? (
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}80`,
              lineHeight: 1.5,
              margin: `0 0 ${SPACING.lg}`,
            }}
          >
            {dataset.description}
          </p>
        ) : null}

        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${SPACING.md} ${SPACING.lg}` }}>
          {[
            { label: 'Source connector', value: dataset.sourceConnector },
            { label: 'Records', value: dataset.recordCount.toLocaleString() },
            { label: 'Freshness', value: `${dataset.freshnessDays}d ago` },
            { label: 'Last sync', value: dataset.lastSyncedAt },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: `${COLORS.ink}60`,
                  marginBottom: 3,
                }}
              >
                {label}
              </dt>
              <dd
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 500,
                  color: COLORS.ink,
                  margin: 0,
                }}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {dataset.schema && dataset.schema.length > 0 ? (
          <div style={{ marginTop: SPACING.lg }}>
            <p
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: `${COLORS.ink}60`,
                margin: `0 0 ${SPACING.sm}`,
              }}
            >
              Schema Fields
            </p>
            {dataset.schema.map(({ field, type }) => (
              <div
                key={field}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: `${SPACING.xs} 0`,
                  borderBottom: `1px solid ${COLORS.ink}0a`,
                }}
              >
                <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: COLORS.ink }}>
                  {field}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}60`,
                  }}
                >
                  {type}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
