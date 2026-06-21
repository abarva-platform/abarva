import type { CSSProperties } from 'react';
import { COLORS, FONT, SPACING } from '@/lib/design/abarva-theme';
import type { EnterpriseContextOverview } from '@/lib/enterprise-context/intelligence-read-model';

interface Props {
  overview: EnterpriseContextOverview | null;
  tenantName: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  org_decision_rights: 'Org & decision rights',
  facilities_business_units: 'Facilities & business units',
  cmdb_applications_services: 'Systems & services',
  ci_relationships_dependencies: 'CI relationships',
  vendors_contract_inventory: 'Vendors & contracts',
  renewal_calendar: 'Renewals',
  spend_baseline: 'Spend baseline',
  policies_procedures: 'Policies & controls',
  incidents: 'Incidents',
  problems: 'Problems',
  changes: 'Changes',
  slas: 'SLAs',
  initiative_portfolio: 'Initiatives',
  data_domains_stewardship: 'Data domains',
  risk_compliance_register: 'Risks & compliance',
};

const ACTION_HREFS: Record<string, string> = {
  'Ask Sentinel': '#enterprise-context',
  'Create Source event': '/source/new',
  'Link to Move': '/strategic-moves',
  'Add to Tower watchlist': '/tower',
  'Generate brief': '/intelligence#brief',
  'Open blocker brief': '/intelligence#brief',
};

export function EnterpriseContextCanvas({ overview, tenantName }: Props) {
  if (!overview) {
    return (
      <section style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Enterprise Context</p>
            <h1 style={titleStyle}>{tenantName} context fabric</h1>
            <p style={subtitleStyle}>
              Internal client context has not been loaded for this tenant yet. Day One templates can still be used to seed org, systems, vendors, incidents, policies, spend, and stewardship data.
            </p>
          </div>
        </header>
      </section>
    );
  }

  return (
    <section id="enterprise-context" style={shellStyle} aria-label={`${tenantName} enterprise context`}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Enterprise Context</p>
          <h1 style={titleStyle}>{tenantName} context fabric</h1>
          <p style={subtitleStyle}>
            Internal context only: org, systems, CMDB, vendors, contracts, spend, policies, incidents, changes, initiatives, risks, evidence, and stewardship.
          </p>
        </div>
        <div style={statusPanelStyle} aria-label="Enterprise context coverage">
          <Metric label="Records" value={overview.counts.records.toLocaleString()} />
          <Metric label="Facts" value={overview.counts.facts.toLocaleString()} />
          <Metric label="Evidence" value={`${overview.evidenceUsableCount}/${overview.counts.evidence}`} />
          <Metric label="Open gaps" value={overview.counts.qualityIssues.toLocaleString()} tone="risk" />
        </div>
      </header>

      <div style={scorecardStyle}>
        <Metric label="Sources" value={overview.counts.sources.toLocaleString()} />
        <Metric label="Relationships" value={overview.counts.relationships.toLocaleString()} />
        <Metric label="Chunk queue" value={overview.counts.chunkQueue.toLocaleString()} />
        <Metric label="Avg confidence" value={`${Math.round(overview.confidenceAverage * 100)}%`} />
        <Metric label="Fresh rows" value={`${overview.freshnessCounts.fresh ?? 0}`} />
      </div>

      <div style={cardGridStyle}>
        {overview.cards.map((card) => (
          <article key={card.key} style={insightCardStyle}>
            <div style={cardTopStyle}>
              <p style={cardEyebrowStyle}>{card.sourceSystems.join(' + ') || 'Internal context'}</p>
              <span style={badgeStyle}>{card.freshness}</span>
            </div>
            <h2 style={cardTitleStyle}>{card.title}</h2>
            <p style={bodyStyle}><strong>What we know:</strong> {card.whatWeKnow}</p>
            <p style={bodyStyle}><strong>Why it matters:</strong> {card.whyItMatters}</p>
            <div style={metaGridStyle}>
              <MiniMeta label="Owner" value={card.owner} />
              <MiniMeta label="Confidence" value={card.confidence} />
              <MiniMeta label="Evidence" value={String(card.evidenceCount)} />
            </div>
            <div style={actionRowStyle} aria-label={`${card.title} actions`}>
              {card.actions.map((action) => (
                <a key={action} href={ACTION_HREFS[action] ?? '#enterprise-context'} style={actionChipStyle}>{action}</a>
              ))}
            </div>
          </article>
        ))}
      </div>

      <section style={domainStyle} aria-label="Context domains">
        <div>
          <p style={eyebrowStyle}>Coverage by domain</p>
          <h2 style={sectionTitleStyle}>What Ava can browse now</h2>
        </div>
        <div style={domainGridStyle}>
          {Object.entries(overview.recordTypeCounts).map(([key, count]) => (
            <div key={key} style={domainRowStyle}>
              <span>{DOMAIN_LABELS[key] ?? key}</span>
              <strong>{count.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'risk' }) {
  return (
    <div style={metricStyle}>
      <span style={metricLabelStyle}>{label}</span>
      <strong style={{ ...metricValueStyle, color: tone === 'risk' ? '#b4232a' : COLORS.ink }}>{value}</strong>
    </div>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={miniLabelStyle}>{label}</span>
      <strong style={miniValueStyle}>{value}</strong>
    </div>
  );
}

const shellStyle = {
  padding: `${SPACING.xl}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px) ${SPACING.xxxl}px`,
  fontFamily: FONT.body,
} satisfies CSSProperties;

const headerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
  gap: SPACING.xl,
  alignItems: 'end',
  borderBottom: `1px solid ${COLORS.border}`,
  paddingBottom: SPACING.lg,
} satisfies CSSProperties;

const eyebrowStyle = {
  margin: 0,
  color: COLORS.muted,
  fontSize: 10,
  fontFamily: FONT.mono,
  letterSpacing: 1.8,
  textTransform: 'uppercase',
} satisfies CSSProperties;

const titleStyle = {
  margin: `${SPACING.xs}px 0 ${SPACING.sm}px`,
  color: COLORS.ink,
  fontSize: 36,
  lineHeight: 1.05,
  letterSpacing: 0,
  fontFamily: FONT.display,
} satisfies CSSProperties;

const subtitleStyle = {
  margin: 0,
  color: COLORS.body,
  fontSize: 15,
  lineHeight: 1.55,
  maxWidth: 780,
} satisfies CSSProperties;

const statusPanelStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
  gap: SPACING.md,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: SPACING.md,
  background: COLORS.surface2,
} satisfies CSSProperties;

const scorecardStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: SPACING.md,
  marginTop: SPACING.lg,
} satisfies CSSProperties;

const metricStyle = {
  minWidth: 0,
} satisfies CSSProperties;

const metricLabelStyle = {
  display: 'block',
  color: COLORS.muted,
  fontFamily: FONT.mono,
  fontSize: 10,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
} satisfies CSSProperties;

const metricValueStyle = {
  display: 'block',
  marginTop: 4,
  fontFamily: FONT.mono,
  fontSize: 18,
  lineHeight: 1.1,
} satisfies CSSProperties;

const cardGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
  gap: SPACING.lg,
  marginTop: SPACING.xl,
} satisfies CSSProperties;

const insightCardStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: '#fff',
  padding: SPACING.lg,
  minHeight: 300,
} satisfies CSSProperties;

const cardTopStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: SPACING.md,
  alignItems: 'center',
} satisfies CSSProperties;

const cardEyebrowStyle = {
  margin: 0,
  color: COLORS.muted,
  fontFamily: FONT.mono,
  fontSize: 10,
  letterSpacing: 1,
  textTransform: 'uppercase',
} satisfies CSSProperties;

const badgeStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 999,
  padding: '4px 8px',
  color: COLORS.body,
  fontSize: 11,
  whiteSpace: 'nowrap',
} satisfies CSSProperties;

const cardTitleStyle = {
  margin: `${SPACING.md}px 0`,
  color: COLORS.ink,
  fontSize: 18,
  lineHeight: 1.2,
  letterSpacing: 0,
} satisfies CSSProperties;

const bodyStyle = {
  margin: `${SPACING.sm}px 0 0`,
  color: COLORS.body,
  fontSize: 13,
  lineHeight: 1.55,
} satisfies CSSProperties;

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: SPACING.sm,
  marginTop: SPACING.md,
  paddingTop: SPACING.md,
  borderTop: `1px solid ${COLORS.border}`,
} satisfies CSSProperties;

const miniLabelStyle = {
  display: 'block',
  color: COLORS.muted,
  fontFamily: FONT.mono,
  fontSize: 9,
  letterSpacing: 1,
  textTransform: 'uppercase',
} satisfies CSSProperties;

const miniValueStyle = {
  display: 'block',
  color: COLORS.ink,
  fontSize: 12,
  lineHeight: 1.3,
  marginTop: 3,
} satisfies CSSProperties;

const actionRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: SPACING.md,
} satisfies CSSProperties;

const actionChipStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 999,
  padding: '4px 8px',
  color: COLORS.body,
  fontFamily: FONT.mono,
  fontSize: 9,
  textDecoration: 'none',
} satisfies CSSProperties;

const domainStyle = {
  marginTop: SPACING.xl,
  borderTop: `1px solid ${COLORS.border}`,
  paddingTop: SPACING.lg,
} satisfies CSSProperties;

const sectionTitleStyle = {
  margin: `${SPACING.xs}px 0 ${SPACING.md}px`,
  color: COLORS.ink,
  fontSize: 22,
  lineHeight: 1.15,
  letterSpacing: 0,
} satisfies CSSProperties;

const domainGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
  gap: SPACING.sm,
} satisfies CSSProperties;

const domainRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: SPACING.sm,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  padding: `${SPACING.sm}px ${SPACING.md}px`,
  background: COLORS.surface2,
  color: COLORS.body,
  fontSize: 12,
} satisfies CSSProperties;
