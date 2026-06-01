'use client';

import type { ProbabilisticValueForecast } from '@/lib/programs/expert-kernel/probabilistic';

interface ProbabilisticForecastCardProps {
  forecast: ProbabilisticValueForecast;
  title?: string;
}

function usd(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function ProbabilisticForecastCard({
  forecast,
  title = 'Probabilistic value forecast',
}: ProbabilisticForecastCardProps) {
  const topDriver = forecast.topVarianceDrivers[0];
  const min = Math.min(...forecast.yearly.map((year) => year.netDist.p10), 0);
  const max = Math.max(...forecast.yearly.map((year) => year.netDist.p90), 1);
  const span = max - min || 1;

  return (
    <section
      aria-label={title}
      className="programs-module-tile"
      style={{ display: 'grid', gap: 18 }}
    >
      <div
        className="programs-row"
        style={{ justifyContent: 'space-between', alignItems: 'start', gap: 16 }}
      >
        <div>
          <div className="programs-mono-label">P10 / P50 / P90</div>
          <h3 style={{ margin: '4px 0 0', fontSize: 24 }}>{title}</h3>
        </div>
        <span className="programs-chip teal">
          {forecast.threeYearNpv.samples.toLocaleString()} trials
        </span>
      </div>

      <div
        className="programs-row"
        style={{ gap: 10, flexWrap: 'wrap' }}
        aria-label="Three-year NPV percentile band"
      >
        <Metric label="P10 downside" value={usd(forecast.threeYearNpv.p10)} />
        <Metric label="P50 median" value={usd(forecast.threeYearNpv.p50)} strong />
        <Metric label="P90 upside" value={usd(forecast.threeYearNpv.p90)} />
        <Metric label="Net-positive odds" value={pct(forecast.probNetPositive3yr)} />
      </div>

      <div aria-label="Yearly net-value fan chart" style={{ display: 'grid', gap: 10 }}>
        {forecast.yearly.map((year) => {
          const p10 = ((year.netDist.p10 - min) / span) * 100;
          const p50 = ((year.netDist.p50 - min) / span) * 100;
          const p90 = ((year.netDist.p90 - min) / span) * 100;
          return (
            <div
              key={year.year}
              style={{
                display: 'grid',
                gridTemplateColumns: '44px minmax(0, 1fr) 72px',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <span className="programs-mono-label">Y{year.year}</span>
              <span
                aria-label={`Year ${year.year} P10 ${usd(year.netDist.p10)}, P50 ${usd(
                  year.netDist.p50,
                )}, P90 ${usd(year.netDist.p90)}`}
                style={{
                  position: 'relative',
                  height: 22,
                  borderRadius: 999,
                  background: '#f3f0e9',
                  border: '1px solid #dedacf',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: `${Math.max(0, p10)}%`,
                    width: `${Math.max(2, p90 - p10)}%`,
                    top: 4,
                    bottom: 4,
                    borderRadius: 999,
                    background: '#dbe6f3',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: `${Math.max(0, p50)}%`,
                    top: 2,
                    bottom: 2,
                    width: 3,
                    borderRadius: 999,
                    background: '#070707',
                  }}
                />
              </span>
              <strong style={{ fontFamily: 'var(--programs-mono)', textAlign: 'right' }}>
                {usd(year.netDist.p50)}
              </strong>
            </div>
          );
        })}
      </div>

      <div
        style={{
          borderTop: '1px solid #e0dbcd',
          paddingTop: 14,
          display: 'grid',
          gap: 8,
        }}
      >
        <div className="programs-mono-label">Top variance drivers</div>
        {forecast.topVarianceDrivers.map((driver) => (
          <div key={driver.input} style={{ display: 'grid', gap: 5 }}>
            <div
              className="programs-row"
              style={{ justifyContent: 'space-between', gap: 12 }}
            >
              <strong>{driver.input}</strong>
              <span className="programs-subtle">{driver.elasticity.toFixed(2)}</span>
            </div>
            <div className="programs-muted" style={{ fontSize: 13 }}>
              {driver.note}
            </div>
          </div>
        ))}
      </div>

      <div className="programs-muted" style={{ fontSize: 13 }}>
        80% probability between {usd(forecast.threeYearNpv.p10)} and{' '}
        {usd(forecast.threeYearNpv.p90)}
        {topDriver ? `; top driver: ${topDriver.input}.` : '.'}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className="programs-metric"
      style={{ flex: '1 1 150px', minWidth: 150, padding: 14 }}
    >
      <div className="programs-mono-label">{label}</div>
      <div
        className="programs-metric-value"
        style={{ fontSize: 22, color: strong ? 'var(--programs-teal)' : undefined }}
      >
        {value}
      </div>
    </div>
  );
}
