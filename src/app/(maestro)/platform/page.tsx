// Fix Spec v4 §1 · Platform page rebuild.
//
// Seven opinionated sections · Vendor Knowledge Layer design DNA
// applied to platform architecture instead of pattern content. Replaces
// the prior admin-metrics dashboard · those metrics move to
// /platform/admin (already the operator hub).
//
// Audience: investors + prospects · "structurally different from
// consulting and SaaS" is the rhetorical move. Each section must carry
// current 2026 knowledge + architectural opinion + specificity.

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { PageShell } from '@/components/shared/layout/PageShell';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { COLORS } from '@/lib/design-system';

export const dynamic = 'force-dynamic';

const INK = '#F5F5F0';
const TEAL = '#14B8A6';
const MUTE = 'rgba(245, 245, 240, 0.72)';
const BLUE = '#4DA3FF';
const AMBER = '#F59E0B';
const GREEN = '#3FB27F';
const CORAL = '#FF6B4A';
const BORDER = '0.5px solid rgba(255,255,255,0.08)';
const PANEL_BG = 'rgba(255,255,255,0.02)';
const MONO = 'JetBrains Mono, monospace';

async function loadPlatformMetrics(clientId: string | null) {
  const sb = getServerSupabase();
  const [personsRes, sourcesRes] = await Promise.all([
    sb.from('persons').select('id', { count: 'exact', head: true }),
    sb.from('knowledge_sources').select('status', { count: 'exact' }).throwOnError().then(
      (r) => r,
      () => ({ count: 0, data: null as null | Array<{ status: string }> }),
    ),
  ]);

  // Scope tech stack + domain coverage to the active client only.
  let techQ = sb.from('tech_stack_items').select('category', { count: 'exact' });
  if (clientId) techQ = techQ.eq('client_id', clientId);
  const techRes = await techQ;
  const techRows = (techRes.data as Array<{ category: string }> | null) ?? [];
  const categorySet = new Set(techRows.map((r) => r.category));

  // Single-client coverage. 6 domains: inventory, apps, data, cost, eng, tech.
  let presentCount = 0;
  if (clientId) {
    const [inv, apps, data, cost, eng, tech] = await Promise.all([
      sb.from('use_cases').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('applications').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('data_sources').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('cost_centers').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('eng_teams').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
      sb.from('tech_stack_items').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
    ]);
    presentCount = [inv, apps, data, cost, eng, tech].filter((r) => (r.count ?? 0) > 0).length;
  }

  const sourcesCount = typeof sourcesRes.count === 'number' ? sourcesRes.count : 0;

  return {
    personCount: personsRes.count ?? 0,
    techStackTotal: techRes.count ?? techRows.length,
    techCategoryCount: categorySet.size,
    knowledgeSourceCount: sourcesCount,
    present: presentCount,
    of: 6,
  };
}

function FinancialRow({ label, amount, note, bold }: { label: string; amount: string; note: string; bold?: boolean }) {
  return (
    <div
      style={{
        padding: bold ? 20 : 16,
        background: bold ? 'rgba(45,212,200,0.08)' : 'rgba(255,255,255,0.02)',
        border: `0.5px solid ${bold ? COLORS.teal : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 20,
        alignItems: 'baseline',
      }}
    >
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <Body size="sm" tone="secondary" style={{ marginTop: 6, lineHeight: 1.55, maxWidth: 640 }}>
          {note}
        </Body>
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: bold ? 32 : 24, color: bold ? COLORS.teal : COLORS.textPrimary, letterSpacing: '-0.005em', whiteSpace: 'nowrap' }}>
        {amount}
      </div>
    </div>
  );
}

function WhyColumn({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
      <EyebrowLabel tone="teal" size="xs">{title.toUpperCase()}</EyebrowLabel>
      <Body size="sm" tone="secondary" style={{ marginTop: 8, lineHeight: 1.55 }}>{body}</Body>
    </div>
  );
}

function SectionLinkTOC() {
  const links = [
    { href: '#knowledge-architecture', label: 'Knowledge architecture' },
    { href: '#methodology', label: 'Methodology' },
    { href: '#agents', label: 'Agents' },
    { href: '#compounding-assets', label: 'Compounding assets' },
    { href: '#outcome-economics', label: 'Outcome economics' },
    { href: '#composability', label: 'Composability' },
    { href: '#comparison', label: 'Comparison' },
  ];
  return (
    <nav aria-label="Platform sections" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          style={{
            display: 'inline-block',
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(45,212,200,0.2)',
            borderRadius: 999,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'rgba(245,245,240,0.75)',
            letterSpacing: '0.08em',
            textDecoration: 'none',
          }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

const headStyle: CSSProperties = {
  textAlign: 'left',
  padding: '14px 14px',
  background: 'rgba(10,10,10,0.5)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  color: 'rgba(245,245,240,0.75)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  borderBottom: '0.5px solid rgba(45,212,200,0.25)',
  whiteSpace: 'nowrap',
};

const cellStyle: CSSProperties = {
  padding: '14px 14px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 13,
  color: 'rgba(245,245,240,0.85)',
  lineHeight: 1.55,
  borderBottom: '0.5px solid rgba(255,255,255,0.05)',
  verticalAlign: 'top',
};

const rowAccent: CSSProperties = {
  background: 'rgba(245,158,11,0.04)',
  fontStyle: 'italic',
};

const mean: CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.02)',
  border: '0.5px solid rgba(45,212,200,0.12)',
  borderRadius: 6,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  color: 'rgba(245,245,240,0.9)',
  letterSpacing: '0.02em',
};
