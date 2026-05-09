import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface QualityDimension {
  id: string;
  label: string;
  score: number; // 0–100
  trend: 'up' | 'down' | 'flat';
}

export interface DataQualityPanelProps {
  dimensions: QualityDimension[];
  overallScore?: number;
}

function scoreColor(score: number): { bg: string; fg: string } {
  if (score >= 80) return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
  if (score >= 50) return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: COLORS.coralSoft, fg: COLORS.coralInk };
}

function trendGlyph(trend: QualityDimension['trend']): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

export function DataQualityPanel({ dimensions, overallScore }: DataQualityPanelProps) {
  return (
    <div>
      {overallScore !== undefined ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            marginBottom: SPACING.lg,
            padding: SPACING.md,
            border: `1px solid ${COLORS.ink}14`,
            borderRadius: 6,
            background: COLORS.white,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 40,
              fontWeight: 700,
              color: scoreColor(overallScore).fg,
              lineHeight: 1,
            }}
          >
            {overallScore}
          </div>
          <div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.ink,
              }}
            >
              Overall Quality Score
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 10,
                color: `${COLORS.ink}60`,
                marginTop: 2,
              }}
            >
              Composite across all active datasets
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {dimensions.map((dim) => {
          const { bg, fg } = scoreColor(dim.score);
          return (
            <div
              key={dim.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.md,
                padding: `${SPACING.sm} ${SPACING.md}`,
                border: `1px solid ${COLORS.ink}0a`,
                borderRadius: 6,
                background: COLORS.white,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 500,
                    color: COLORS.ink,
                  }}
                >
                  {dim.label}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                {/* Score bar */}
                <div
                  style={{
                    width: 80,
                    height: 6,
                    borderRadius: 3,
                    background: `${COLORS.ink}14`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${dim.score}%`,
                      height: '100%',
                      background: fg,
                      borderRadius: 3,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: bg,
                    color: fg,
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {dim.score}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}60`,
                    width: 14,
                    textAlign: 'center',
                  }}
                >
                  {trendGlyph(dim.trend)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
