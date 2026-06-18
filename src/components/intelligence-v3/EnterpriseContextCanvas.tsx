import type { CSSProperties } from 'react';
import { COLORS, FONT, SPACING } from '@/lib/design/abarva-theme';
import type { EnterpriseContextOverview } from '@/lib/enterprise-context/intelligence-read-model';
import type { ContextInsight } from '@/lib/intelligence/context-insights';

interface Props {
  overview: EnterpriseContextOverview | null;
  tenantName: string;
  insights?: ContextInsight[];
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

export function EnterpriseContextCanvas({ overview, tenantName, insights = [] }: Props) {
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

      <section style={liveInsightsStyle} aria-label="Live context insights">
        <div style={sectionHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>What the context is telling you</p>
            <h2 style={sectionTitleStyle}>Live cross-domain insights</h2>
          </div>
          <div style={insightCountStyle}>
            <strong>{insights.length}</strong>
            <span>active</span>
          </div>
        </div>
        {insights.length > 0 ? (
          <div style={liveInsightGridStyle}>
            {insights.slice(0, 6).map((insight) => (
              <article key={insight.id} style={liveInsightCardStyle}>
                <div style={cardTopStyle}>
                  <p style={cardEyebrowStyle}>{insight.domain} · {insight.ruleId}</p>
                  <span style={severityBadgeStyle(insight.materiality)}>{insight.materiality}</span>
                </div>
                <h3 style={liveInsightTitleStyle}>{insight.headline}</h3>
                <p style={liveInsightSummaryStyle}>{insight.soWhat}</p>
                {insight.action && (
                  <p style={bodyStyle}><strong>What to do:</strong> {insight.action}</p>
                )}
                <div style={metaGridStyle}>
                  <MiniMeta label="Confidence" value={insight.confidence} />
                  <MiniMeta label="Freshness" value={insight.freshnessStatus} />
                  <MiniMeta label="Evidence" value={`${insight.derivedFromFactIds.length} facts`} />
                </div>
                <details style={evidenceDetailsStyle}>
                  <summary style={evidenceSummaryStyle}>Show source IDs</summary>
                  <div style={sourceIdBlockStyle}>
                    <SourceIdGroup label="Records" values={insight.derivedFromRecordIds} />
                    <SourceIdGroup label="Facts" values={insight.derivedFromFactIds} />
                  </div>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div style={emptyInsightStyle}>
            Context rows are loaded, but no materialized insight rows are active for this tenant yet.
          </div>
        )}
      </section>

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
          <h2 style={sectionTitleStyle}>What Sentinel can browse now</h2>
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

function SourceIdGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <span style={miniLabelStyle}>{label}</span>
      <div style={sourceIdListStyle}>
        {values.length > 0 ? values.slice(0, 8).map((value) => (
          <code key={value} style={sourceIdStyle}>{value}</code>
        )) : (
          <span style={sourceEmptyStyle}>None attached</span>
        )}
        {values.length > 8 && <span style={sourceEmptyStyle}>+{values.length - 8} more</span>}
      </div>
    </div>
  );
}

function severityBadgeStyle(materiality: ContextInsight['materiality']): CSSProperties {
  const palette = materiality === 'high'
    ? { background: '#fff1f0', color: '#b4232a', border: '#f3c5c1' }
    : materiality === 'medium'
      ? { background: '#fff8eb', color: '#9a6700', border: '#efd49a' }
      : { background: '#eff8f4', color: '#2d6a4f', border: '#b9decf' };
  return {
    border: `1px solid ${palette.border}`,
    borderRadius: 999,
    padding: '4px 8px',
    background: palette.background,
    color: palette.color,
    fontFamily: FONT.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
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

const liveInsightsStyle = {
  marginTop: SPACING.xl,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: COLORS.surface2,
  padding: SPACING.lg,
} satisfies CSSProperties;

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: SPACING.lg,
  alignItems: 'start',
  marginBottom: SPACING.md,
} satisfies CSSProperties;

const insightCountStyle = {
  display: 'inline-flex',
  alignItems: 'baseline',
  gap: 6,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 999,
  padding: '6px 10px',
  background: '#fff',
  color: COLORS.body,
  fontFamily: FONT.mono,
  fontSize: 11,
  whiteSpace: 'nowrap',
} satisfies CSSProperties;

const liveInsightGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: SPACING.md,
} satisfies CSSProperties;

const liveInsightCardStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: '#fff',
  padding: SPACING.md,
  minHeight: 250,
} satisfies CSSProperties;

const liveInsightTitleStyle = {
  margin: `${SPACING.sm}px 0`,
  color: COLORS.ink,
  fontSize: 17,
  lineHeight: 1.25,
  letterSpacing: 0,
  fontFamily: FONT.display,
} satisfies CSSProperties;

const liveInsightSummaryStyle = {
  margin: 0,
  color: COLORS.body,
  fontSize: 13,
  lineHeight: 1.55,
} satisfies CSSProperties;

const evidenceDetailsStyle = {
  marginTop: SPACING.md,
  borderTop: `1px solid ${COLORS.border}`,
  paddingTop: SPACING.sm,
} satisfies CSSProperties;

const evidenceSummaryStyle = {
  cursor: 'pointer',
  color: COLORS.body,
  fontFamily: FONT.mono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: 'uppercase',
} satisfies CSSProperties;

const sourceIdBlockStyle = {
  display: 'grid',
  gap: SPACING.sm,
  marginTop: SPACING.sm,
} satisfies CSSProperties;

const sourceIdListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 5,
  marginTop: 5,
} satisfies CSSProperties;

const sourceIdStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 5,
  padding: '3px 5px',
  background: COLORS.surface2,
  color: COLORS.body,
  fontSize: 10,
  lineHeight: 1.2,
} satisfies CSSProperties;

const sourceEmptyStyle = {
  color: COLORS.muted,
  fontSize: 11,
} satisfies CSSProperties;

const emptyInsightStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  background: '#fff',
  padding: SPACING.md,
  color: COLORS.body,
  fontSize: 13,
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
