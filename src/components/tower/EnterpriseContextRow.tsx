import Link from 'next/link';
import type { EnterpriseSummary } from '@/lib/tower/enterprise-summary';

const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const AMBER = '#F59E0B';
const BLUE = '#4DA3FF';
const GREEN = '#3FB27F';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

function dollarsM(usd: number): string {
  if (Math.abs(usd) >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(usd) >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (Math.abs(usd) >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${Math.round(usd)}`;
}

function Sparkline({ data, color = TEAL }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Card({
  label,
  accent,
  href,
  heroLine,
  subLine,
  children,
}: {
  label: string;
  accent: string;
  href: string;
  heroLine: React.ReactNode;
  subLine: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '16px 18px',
        background: PANEL_BG,
        border: BORDER,
        borderRadius: 10,
        color: INK,
        textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
        <span style={{ fontFamily: MONO, fontSize: 9, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: INK, letterSpacing: '-0.01em' }}>{heroLine}</div>
      <div style={{ fontSize: 12, color: MUTE, marginTop: 4 }}>{subLine}</div>
      {children}
    </Link>
  );
}

export function EnterpriseContextRow({ summary }: { summary: EnterpriseSummary }) {
  return (
    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      <Card
        label="Tech Stack"
        accent={BLUE}
        href="/tower/tech-stack"
        heroLine={
          <>
            {summary.techStack.total} <span style={{ fontSize: 13, color: MUTE, fontWeight: 400 }}>items</span>
          </>
        }
        subLine={
          <>
            {summary.techStack.aiTouching} AI-touching · {dollarsM(summary.techStack.totalAnnualSpendUsd)}/yr spend
          </>
        }
      >
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {summary.techStack.byCategory.slice(0, 5).map((c) => (
            <div
              key={c.category}
              style={{
                fontSize: 10,
                fontFamily: MONO,
                color: MUTE,
                padding: '3px 7px',
                background: 'rgba(77,163,255,0.08)',
                borderRadius: 4,
              }}
            >
              {c.category} · {c.count}
            </div>
          ))}
        </div>
      </Card>

      <Card
        label="Projects"
        accent={AMBER}
        href="/tower/projects"
        heroLine={
          <>
            {summary.projects.total} <span style={{ fontSize: 13, color: MUTE, fontWeight: 400 }}>active</span>
          </>
        }
        subLine={
          <>
            {summary.projects.aiTouching} AI · {summary.projects.inFlight} in-flight ·{' '}
            {dollarsM(summary.projects.totalSpentUsd)} / {dollarsM(summary.projects.totalBudgetUsd)}
          </>
        }
      >
        <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'rgba(245,158,11,0.12)', overflow: 'hidden' }}>
          <div
            style={{
              width: summary.projects.totalBudgetUsd > 0
                ? `${Math.min(100, (summary.projects.totalSpentUsd / summary.projects.totalBudgetUsd) * 100)}%`
                : '0%',
              height: 4,
              background: AMBER,
            }}
          />
        </div>
      </Card>

      <Card
        label="Staff Aug"
        accent={GREEN}
        href="/tower/staff-aug"
        heroLine={
          <>
            {summary.staffAug.totalFte} <span style={{ fontSize: 13, color: MUTE, fontWeight: 400 }}>FTE</span>
          </>
        }
        subLine={
          <>
            {summary.staffAug.total} engagements · {dollarsM(summary.staffAug.totalAnnualSpendUsd)}/yr ·{' '}
            {summary.staffAug.aiTouching} AI-touching
          </>
        }
      />

      <Card
        label="Volumetrics"
        accent={TEAL}
        href="/tower/volumetrics"
        heroLine={
          <>
            {summary.volumetrics.latestApiCallsMillions.toFixed(1)}M{' '}
            <span style={{ fontSize: 13, color: MUTE, fontWeight: 400 }}>calls/day</span>
          </>
        }
        subLine={
          <>
            {summary.volumetrics.latestTokensBillions.toFixed(1)}B tokens ·{' '}
            {summary.volumetrics.activeModels} models · {summary.volumetrics.dataPipelines} pipelines
          </>
        }
      >
        <div style={{ marginTop: 12 }}>
          <Sparkline data={summary.volumetrics.apiCallsSeries} color={TEAL} />
        </div>
      </Card>
    </div>
  );
}
