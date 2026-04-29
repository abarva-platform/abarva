'use client';

// /admin/reasoning/snapshot — Auto-refreshing portfolio health dashboard.
//
// Client component that polls GET /api/reasoning/health-snapshot every 15 s.
// Designed for monitor/display use during demos — large headline numbers and
// a minimal, high-contrast layout.

import { useEffect, useState, useCallback } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthLabel = 'healthy' | 'warning' | 'critical' | 'unknown';

interface RankedInstance {
  id: string;
  label: string;
  score: number;
  healthLabel: HealthLabel;
  activeContradictions: number;
}

interface AtRiskInstance {
  id: string;
  label: string;
  healthLabel: HealthLabel;
  activeContradictions: number;
}

interface SnapshotData {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  unknown: number;
  totalContradictions: number;
  avgScore: number;
  top5: RankedInstance[];
  atRisk: AtRiskInstance[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 15_000;

// ─── Helper components ────────────────────────────────────────────────────────

function HealthBadge({ label }: { label: HealthLabel }) {
  const configs: Record<HealthLabel, { bg: string; text: string; display: string }> = {
    healthy: { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT, display: 'Healthy' },
    warning: { bg: SHELL.PEACH_BG, text: SHELL.PEACH_TEXT, display: 'Warning' },
    critical: { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT, display: 'Critical' },
    unknown: { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT, display: 'Unknown' },
  };
  const cfg = configs[label] ?? configs.unknown;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: RADIUS.pill,
        background: cfg.bg,
        color: cfg.text,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.display}
    </span>
  );
}

function MetricCard({
  value,
  label,
  color,
  muted,
}: {
  value: string;
  label: string;
  color?: string;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.xl} ${SPACING.lg}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: '1 1 0',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: 48,
          fontWeight: 700,
          fontFamily: TYPOGRAPHY.sans,
          color: muted ? COLORS.ink + '44' : color ?? COLORS.ink,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: TYPOGRAPHY.sans,
          color: COLORS.ink + '88',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function DistributionBar({
  total,
  healthy,
  warning,
  critical,
  unknown,
}: {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  unknown: number;
}) {
  if (total === 0) return null;

  const segments: Array<{ count: number; color: string; label: string }> = [
    { count: healthy, color: SHELL.MINT_TEXT, label: 'Healthy' },
    { count: warning, color: SHELL.PEACH_TEXT, label: 'Warning' },
    { count: critical, color: SHELL.RUST_TEXT, label: 'Critical' },
    { count: unknown, color: SHELL.GRAY_TEXT, label: 'Unknown' },
  ].filter((s) => s.count > 0);

  const segmentBgs: Array<{ count: number; bg: string; label: string }> = [
    { count: healthy, bg: SHELL.MINT_BG, label: 'Healthy' },
    { count: warning, bg: SHELL.PEACH_BG, label: 'Warning' },
    { count: critical, bg: SHELL.RUST_BG, label: 'Critical' },
    { count: unknown, bg: SHELL.GRAY_BG, label: 'Unknown' },
  ].filter((s) => s.count > 0);

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.lg} ${SPACING.xl}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.ink + '88',
        }}
      >
        Health distribution
      </span>

      {/* Bar */}
      <div
        style={{
          display: 'flex',
          borderRadius: RADIUS.md,
          overflow: 'hidden',
          height: 28,
          border: `1px solid ${COLORS.ink}10`,
        }}
      >
        {segmentBgs.map((seg, i) => (
          <div
            key={i}
            style={{
              flex: seg.count,
              background: seg.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'flex 0.4s ease',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: SPACING.lg, flexWrap: 'wrap' }}>
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: RADIUS.sm,
                background: segmentBgs[i]?.bg ?? SHELL.GRAY_BG,
                border: `1px solid ${COLORS.ink}20`,
              }}
            />
            <span style={{ color: seg.color, fontWeight: 600 }}>
              {seg.count} {seg.label}
            </span>
            <span style={{ color: COLORS.ink + '66', fontSize: 11 }}>
              {Math.round((seg.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HealthSnapshotPage() {
  const [data, setData] = useState<SnapshotData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reasoning/health-snapshot');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SnapshotData;
      setData(json);
      setLastRefreshed(new Date());
      setError(null);
      setCountdown(REFRESH_INTERVAL_MS / 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 15 s
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setCountdown((c: number) => {
        if (c <= 1) return REFRESH_INTERVAL_MS / 1000;
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.cream,
        padding: `${SPACING.xl} ${SPACING.xxl}`,
        maxWidth: 1000,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: SPACING.md,
          marginBottom: SPACING.xl,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: COLORS.ink + '66',
              marginBottom: 6,
            }}
          >
            Admin · Reasoning
          </div>
          <h1
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Portfolio health snapshot
          </h1>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            flexWrap: 'wrap',
          }}
        >
          {lastRefreshed && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: COLORS.ink + '66',
              }}
            >
              Last refreshed: {formatTime(lastRefreshed)}
            </span>
          )}
          <button
            onClick={() => void fetchData()}
            disabled={loading}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.navy,
              background: COLORS.skyPale,
              border: `1px solid ${COLORS.navy}33`,
              borderRadius: RADIUS.pill,
              padding: '6px 16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Refreshing…' : 'Refresh now'}
          </button>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: COLORS.ink + '55',
            }}
          >
            Refreshing in {countdown}s
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            background: SHELL.RUST_BG,
            color: SHELL.RUST_TEXT,
            borderRadius: RADIUS.md,
            padding: `${SPACING.md} ${SPACING.lg}`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            marginBottom: SPACING.lg,
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Skeleton while loading with no data yet */}
      {!data && loading && (
        <div
          style={{
            textAlign: 'center',
            padding: SPACING.xxl,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: COLORS.ink + '66',
          }}
        >
          Loading…
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
          {/* Headline metrics — 2×2 or 1×4 grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: SPACING.md,
            }}
          >
            <MetricCard value={String(data.total)} label="Instances monitored" />
            <MetricCard
              value={String(data.healthy)}
              label="Healthy instances"
              color={SHELL.MINT_TEXT}
            />
            <MetricCard
              value={String(data.totalContradictions)}
              label="Active contradictions"
              color={data.totalContradictions > 0 ? SHELL.RUST_TEXT : undefined}
              muted={data.totalContradictions === 0}
            />
            <MetricCard
              value={`${data.avgScore} / 100`}
              label="Average composite score"
            />
          </div>

          {/* Health distribution bar */}
          <DistributionBar
            total={data.total}
            healthy={data.healthy}
            warning={data.warning}
            critical={data.critical}
            unknown={data.unknown}
          />

          {/* Lower two-column detail grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: SPACING.md,
            }}
          >
            {/* Top 5 healthiest */}
            <div
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: RADIUS.lg,
                padding: `${SPACING.lg} ${SPACING.xl}`,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.md,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.ink + '88',
                }}
              >
                Top 5 healthiest
              </span>
              {data.top5.length === 0 && (
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    color: COLORS.ink + '55',
                  }}
                >
                  No instances
                </span>
              )}
              {data.top5.map((inst: RankedInstance, idx: number) => (
                <div
                  key={inst.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.md,
                    padding: `${SPACING.sm} 0`,
                    borderBottom:
                      idx < data.top5.length - 1 ? `1px solid ${COLORS.ink}0a` : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS.ink + '44',
                      minWidth: 20,
                      textAlign: 'right',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      color: COLORS.ink,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inst.label}
                  </span>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      fontWeight: 700,
                      color: SHELL.MINT_TEXT,
                      minWidth: 40,
                      textAlign: 'right',
                    }}
                  >
                    {inst.score}
                  </span>
                </div>
              ))}
            </div>

            {/* Top 5 at-risk */}
            <div
              style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: RADIUS.lg,
                padding: `${SPACING.lg} ${SPACING.xl}`,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.md,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: COLORS.ink + '88',
                }}
              >
                Top 5 at-risk
              </span>
              {data.atRisk.length === 0 && (
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    color: SHELL.MINT_TEXT,
                    fontWeight: 500,
                  }}
                >
                  All instances healthy
                </span>
              )}
              {data.atRisk.map((inst: AtRiskInstance, idx: number) => (
                <div
                  key={inst.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.md,
                    padding: `${SPACING.sm} 0`,
                    borderBottom:
                      idx < data.atRisk.length - 1 ? `1px solid ${COLORS.ink}0a` : 'none',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      color: COLORS.ink,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inst.label}
                  </span>
                  <HealthBadge label={inst.healthLabel} />
                  {inst.activeContradictions > 0 && (
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        color: SHELL.RUST_TEXT,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {inst.activeContradictions} contra.
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
