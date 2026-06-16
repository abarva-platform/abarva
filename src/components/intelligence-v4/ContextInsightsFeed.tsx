'use client';

// ContextInsightsFeed · Insights tab content (default tab, L2)
//
// Domain filter chips, hero insight cards, and an insight feed with
// expand/collapse derivation chain (facts → rule → significance).
// Stub data from spec; no-fabrication: clearly marked illustrative.

import { useState } from 'react';

const C = {
  bg: '#F8F7F4',
  panel: '#FFFFFF',
  ink: '#1B1A17',
  muted: '#6F6A61',
  line: '#E6E2DA',
  line2: '#EFECE5',
  chip: '#F1EEE7',
  fresh: '#3F7A5B',
  freshBg: '#3F7A5B14',
  attention: '#B5852A',
  attentionBg: '#B5852A18',
  stale: '#B4513C',
  staleBg: '#B4513C16',
  review: '#7A5BA8',
  reviewBg: '#7A5BA814',
  unknown: '#A39C90',
  unknownBg: '#A39C9016',
};

type MaterialityLevel = 'high' | 'medium' | 'low';
type FreshnessStatus = 'loaded' | 'attention' | 'stale' | 'review' | 'missing' | 'unknown';
type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

interface InsightData {
  id: string;
  headline: string;
  soWhat: string;
  materiality: MaterialityLevel;
  domain: string;
  freshnessStatus: FreshnessStatus;
  confidence: ConfidenceLevel;
  ruleId: string;
  evidence: string;
  entityName: string;
  facts?: [string, string][];
  hero?: boolean;
}

const STUB_INSIGHTS: InsightData[] = [
  {
    id: 'ams',
    headline: "You're about to auto-renew a $4.2M AMS contract with no benchmark",
    soWhat: "Kyndryl AMS auto-renews Sep 18 (94 days). Industry-context dimension isn't loaded — you'd negotiate blind.",
    materiality: 'high',
    domain: 'Vendor',
    freshnessStatus: 'attention',
    confidence: 'high',
    ruleId: 'renewal-window-no-benchmark',
    evidence: 'Vendor Contracts · row 41',
    entityName: 'Kyndryl',
    hero: true,
    facts: [['renewal_date', 'Sep 18, 2026'], ['annual_value', '$4.2M'], ['benchmark_present', 'false']],
  },
  {
    id: 'copilot',
    headline: "Your Copilot value case is at risk — 31% adoption vs 70% assumed",
    soWhat: "$0.31M/yr committed; the case assumed 70% seat adoption. Gap concentrated in backend teams.",
    materiality: 'high',
    domain: 'AI Value',
    freshnessStatus: 'attention',
    confidence: 'high',
    ruleId: 'adoption-below-value-case',
    evidence: 'Operating telemetry + AI initiative charter',
    entityName: 'GitHub Copilot',
    hero: true,
    facts: [['active_users_pct', '31%'], ['value_case_assumption', '70%'], ['annual_spend', '$0.31M']],
  },
  {
    id: 'mttr',
    headline: "Service quality is sliding — MTTR up 22% QoQ, 3 services out of SLA",
    soWhat: "Three P2 services breach SLA and the trend is worsening. Candidate for AI-assisted triage.",
    materiality: 'medium',
    domain: 'Service',
    freshnessStatus: 'stale',
    confidence: 'medium',
    ruleId: 'sla-breach-worsening',
    evidence: 'Operating telemetry · Apr 30 (stale)',
    entityName: 'ServiceNow',
    hero: true,
    facts: [['mttr_change_qoq', '+22%'], ['services_breaching', '3'], ['trend', 'worsening']],
  },
  {
    id: 'claim',
    headline: "A material strategy shift is claimed but not yet trusted",
    soWhat: "CIO memo names AMS consolidation a top-3 FY27 priority — parsed but review-required, not committed.",
    materiality: 'high',
    domain: 'Strategy',
    freshnessStatus: 'review',
    confidence: 'none',
    ruleId: 'material-claim-unapproved',
    evidence: 'AMS Board Memo (PDF)',
    entityName: 'CIO Office',
    facts: [['claim', 'AMS = top-3 FY27 priority'], ['lifecycle_state', 'review-required']],
  },
  {
    id: 'conflict',
    headline: "Two systems disagree on who owns CrewSched",
    soWhat: "App inventory and org export name different owners (Ops vs IT) for a Tier-1 app.",
    materiality: 'medium',
    domain: 'Data quality',
    freshnessStatus: 'attention',
    confidence: 'high',
    ruleId: 'conflicting-fact',
    evidence: 'App Inventory row 88 ⨯ Org Structure',
    entityName: 'CrewSched',
    facts: [['owner (App Inv)', 'Ops · M. Reyes'], ['owner (Org)', 'IT · D. Kahn']],
  },
  {
    id: 'gap',
    headline: "You can't yet judge AI spend vs realised value",
    soWhat: "6 initiatives report spend, but IT-financials is stale and most lack a value fact.",
    materiality: 'medium',
    domain: 'Cost',
    freshnessStatus: 'stale',
    confidence: 'low',
    ruleId: 'value-coverage-gap',
    evidence: 'AI Initiative Register + (stale) IT financials',
    entityName: 'Contact-Centre AI',
    facts: [['initiatives_with_spend', '6'], ['with_value_fact', '1'], ['it_financials', 'stale']],
  },
];

const ALL_DOMAINS = ['All', ...Array.from(new Set(STUB_INSIGHTS.map((i) => i.domain)))];

function freshnessColor(status: FreshnessStatus): string {
  const map: Record<FreshnessStatus, string> = {
    loaded: C.fresh,
    attention: C.attention,
    stale: C.stale,
    review: C.review,
    missing: C.unknown,
    unknown: C.unknown,
  };
  return map[status];
}

function materialityPillStyle(level: MaterialityLevel): React.CSSProperties {
  const map: Record<MaterialityLevel, { bg: string; color: string }> = {
    high: { bg: C.staleBg, color: C.stale },
    medium: { bg: C.attentionBg, color: C.attention },
    low: { bg: C.unknownBg, color: C.unknown },
  };
  const s = map[level];
  return {
    fontSize: 10.5,
    padding: '2.5px 8px',
    borderRadius: 20,
    whiteSpace: 'nowrap' as const,
    fontWeight: 500,
    background: s.bg,
    color: s.color,
  };
}

function getPrimaryAction(insight: InsightData): string {
  if (insight.freshnessStatus === 'review') return 'Review & approve';
  if (insight.domain === 'Data quality') return 'Open stewardship task';
  if (insight.id === 'gap') return 'Load missing source';
  return 'Shape into Move';
}

interface InsightCardProps {
  insight: InsightData;
  onSeeTheFacts?: (entityName: string) => void;
}

function InsightCard({ insight, onSeeTheFacts }: InsightCardProps) {
  const [open, setOpen] = useState(false);
  const freshColor = freshnessColor(insight.freshnessStatus);

  return (
    <div
      style={{
        background: insight.hero
          ? 'linear-gradient(0deg, #fff, #fffdf8)'
          : C.panel,
        border: `1px solid ${insight.hero ? '#dcd5c7' : C.line}`,
        borderRadius: 8,
        marginBottom: 11,
        overflow: 'hidden',
        transition: 'box-shadow 0.12s',
      }}
    >
      {/* Clickable head */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v); }}
        aria-expanded={open}
        style={{
          padding: '14px 16px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 13 }}>
          <div>
            <h4
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 16,
                fontWeight: 400,
                margin: '0 0 5px',
                lineHeight: 1.3,
                color: C.ink,
              }}
            >
              {insight.headline}
            </h4>
            <p style={{ color: C.muted, fontSize: 12.5, margin: 0 }}>
              {insight.soWhat}
            </p>
          </div>
          <span style={materialityPillStyle(insight.materiality)}>
            {insight.materiality}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginTop: 10 }}>
          <span
            style={{
              fontSize: 10.5,
              padding: '2.5px 8px',
              borderRadius: 5,
              background: C.chip,
              color: C.muted,
            }}
          >
            {insight.domain}
          </span>
          <span
            style={{
              fontSize: 10.5,
              borderRadius: 20,
              padding: '2px 8px',
              border: `1px solid ${freshColor}44`,
              color: freshColor,
              background: '#fff',
            }}
          >
            {insight.freshnessStatus}
          </span>
          <span
            style={{
              fontSize: 10.5,
              borderRadius: 20,
              padding: '2px 8px',
              border: `1px solid ${C.line}`,
              background: '#fff',
              color: C.muted,
            }}
          >
            conf {insight.confidence}
          </span>
          <span
            style={{
              fontSize: 10.5,
              borderRadius: 20,
              padding: '2px 8px',
              border: `1px solid ${C.line}`,
              background: '#fff',
              color: C.muted,
            }}
          >
            rule: {insight.ruleId}
          </span>
          <span
            style={{
              color: '#bdb6a8',
              fontSize: 12,
              marginLeft: 'auto',
              transition: 'transform 0.15s',
              display: 'inline-block',
              transform: open ? 'rotate(90deg)' : 'none',
            }}
          >
            › how derived
          </span>
        </div>
      </div>

      {/* Derivation chain (expanded) */}
      {open && (
        <div
          style={{
            borderTop: `1px solid ${C.line2}`,
            background: '#FCFBF7',
            padding: '13px 16px',
          }}
        >
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              color: C.muted,
              margin: '0 0 8px',
            }}
          >
            Derivation — facts → rule → significance
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 0,
              overflowX: 'auto',
              paddingBottom: 3,
            }}
          >
            {insight.facts?.map(([key, value], fi) => (
              <React.Fragment key={fi}>
                <div
                  style={{
                    minWidth: 120,
                    border: `1px solid ${C.line}`,
                    borderRadius: 7,
                    background: '#fff',
                    padding: '8px 10px',
                    fontSize: 11.5,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8.5,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.5px',
                      color: C.muted,
                      marginBottom: 3,
                    }}
                  >
                    fact
                  </div>
                  <strong>{key}</strong>
                  <br />
                  {value}
                </div>
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    minWidth: 24,
                    color: '#c8c1b3',
                    fontSize: 14,
                  }}
                >
                  →
                </div>
              </React.Fragment>
            ))}
            {/* Rule cell */}
            <div
              style={{
                minWidth: 120,
                border: `1px solid ${C.ink}`,
                borderRadius: 7,
                background: C.ink,
                color: '#fff',
                padding: '8px 10px',
                fontSize: 11.5,
              }}
            >
              <div
                style={{
                  fontSize: 8.5,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.5px',
                  color: '#ffffff99',
                  marginBottom: 3,
                }}
              >
                rule
              </div>
              <strong>{insight.ruleId}</strong>
            </div>
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                minWidth: 24,
                color: '#c8c1b3',
                fontSize: 14,
              }}
            >
              →
            </div>
            {/* Significance cell */}
            <div
              style={{
                minWidth: 120,
                border: `1px solid ${insight.materiality === 'high' ? C.stale : C.attention}`,
                borderRadius: 7,
                background: '#fff',
                padding: '8px 10px',
                fontSize: 11.5,
              }}
            >
              <div
                style={{
                  fontSize: 8.5,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.5px',
                  color: C.muted,
                  marginBottom: 3,
                }}
              >
                significance
              </div>
              <strong>{insight.materiality} materiality</strong>
            </div>
          </div>

          {/* Evidence row */}
          <div
            style={{
              marginTop: 10,
              fontSize: 11.5,
              display: 'flex',
              flexWrap: 'wrap' as const,
              gap: 5,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                borderRadius: 20,
                padding: '2px 8px',
                border: `1px solid ${C.line}`,
                background: '#fff',
                color: C.muted,
              }}
            >
              evidence
            </span>
            {insight.evidence}
            <span
              style={{
                fontSize: 10.5,
                borderRadius: 20,
                padding: '2px 8px',
                border: `1px solid ${C.line}`,
                background: '#fff',
                color: C.muted,
                marginLeft: 'auto',
              }}
            >
              entity: {insight.entityName}
            </span>
          </div>
        </div>
      )}

      {/* Action row */}
      <div
        style={{
          display: 'flex',
          gap: 7,
          flexWrap: 'wrap' as const,
          padding: '11px 16px',
          borderTop: `1px solid ${C.line2}`,
        }}
      >
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          style={{
            border: `1px solid ${C.ink}`,
            background: C.ink,
            color: '#fff',
            borderRadius: 7,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {getPrimaryAction(insight)}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeeTheFacts?.(insight.entityName);
          }}
          style={{
            border: `1px solid ${C.ink}`,
            background: 'none',
            color: C.ink,
            borderRadius: 7,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          See the facts
        </button>
      </div>
    </div>
  );
}

// Need React import for JSX fragments inside map
import React from 'react';

interface Props {
  onSeeTheFacts?: (entityName: string) => void;
}

export function ContextInsightsFeed({ onSeeTheFacts }: Props) {
  const [domainFilter, setDomainFilter] = useState('All');

  const filtered = domainFilter === 'All'
    ? STUB_INSIGHTS
    : STUB_INSIGHTS.filter((i) => i.domain === domainFilter);

  return (
    <div>
      <h2
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 21,
          fontWeight: 400,
          margin: '0 0 2px',
          color: C.ink,
        }}
      >
        What the context is telling you
      </h2>
      <p style={{ color: C.muted, fontSize: 12.5, margin: '0 0 14px', maxWidth: 720 }}>
        Derived significance — each insight is computed from facts by a named rule and traces to evidence. Nothing is authored or guessed.
      </p>

      {/* Domain filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 10.5, color: C.muted, alignSelf: 'center', marginRight: 2, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
          Domain
        </span>
        {ALL_DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDomainFilter(d)}
            style={{
              fontSize: 11.5,
              border: `1px solid ${C.line}`,
              background: domainFilter === d ? C.ink : '#fff',
              borderRadius: 20,
              padding: '4px 10px',
              color: domainFilter === d ? '#fff' : C.muted,
              cursor: 'pointer',
              fontFamily: 'inherit',
              ...(domainFilter === d ? { borderColor: C.ink } : {}),
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Insight feed */}
      <div>
        {filtered.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onSeeTheFacts={onSeeTheFacts} />
        ))}
        {filtered.length === 0 && (
          <p style={{ color: C.muted, fontSize: 13, padding: '24px 0' }}>
            No insights in this domain yet.
          </p>
        )}
      </div>
    </div>
  );
}
