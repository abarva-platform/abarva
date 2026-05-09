import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface RungDataset {
  id: string;
  name: string;
  rung: 1 | 2 | 3;
  recordCount: number;
  freshnessDays: number;
  status: 'active' | 'stale' | 'error';
}

export interface RungDatasetListProps {
  datasets: RungDataset[];
  onSelectDataset?: (id: string) => void;
  selectedId?: string;
}

const STATUS_STYLES: Record<RungDataset['status'], { bg: string; color: string; label: string }> = {
  active: { bg: COLORS.mintSoft, color: COLORS.mintInk, label: 'Active' },
  stale: { bg: COLORS.amberSoft, color: COLORS.amberInk, label: 'Stale' },
  error: { bg: COLORS.coralSoft, color: COLORS.coralInk, label: 'Error' },
};

export function RungDatasetList({ datasets, onSelectDataset, selectedId }: RungDatasetListProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: 6,
        overflow: 'hidden',
        background: COLORS.white,
      }}
    >
      {datasets.length === 0 ? (
        <div
          style={{
            padding: SPACING.xl,
            textAlign: 'center',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}60`,
          }}
        >
          No datasets configured
        </div>
      ) : (
        datasets.map((ds, i) => {
          const ss = STATUS_STYLES[ds.status];
          const isSelected = ds.id === selectedId;
          return (
            <button
              key={ds.id}
              type="button"
              onClick={() => onSelectDataset?.(ds.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${SPACING.sm} ${SPACING.lg}`,
                background: isSelected ? `${COLORS.navy}08` : i % 2 === 0 ? COLORS.white : `${COLORS.ink}02`,
                border: 'none',
                borderBottom: i < datasets.length - 1 ? `1px solid ${COLORS.ink}0a` : 'none',
                borderLeft: isSelected ? `3px solid ${COLORS.navy}` : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORS.ink,
                  }}
                >
                  {ds.name}
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: `${COLORS.ink}60`,
                    marginTop: 2,
                  }}
                >
                  Rung {ds.rung} · {ds.recordCount.toLocaleString()} records · {ds.freshnessDays}d ago
                </div>
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 3,
                  background: ss.bg,
                  color: ss.color,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {ss.label}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
