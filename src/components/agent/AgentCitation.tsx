'use client';

// AgentCitation · File 08 Sections 9.1-9.4, 4.7
//
// Canonical citation primitive for all agent responses. Every substantive
// claim in Nexus/Sentinel/Atlas/Steward responses carries one of these.
//
// - §9.1 six target types (pattern · observation · evidence_source ·
//   prior_turn · program · deliverable), each with a typographic treatment
//   that tells the reader what kind of thing is being cited without them
//   having to click.
// - §9.3 confidence tier (HIGH · MEDIUM · LOW) renders as a subtle mono
//   label on the pill. LOW confidence requires the renderer to have
//   surfaced honest-disclosure prose before this citation (§9.3 rule);
//   this primitive assumes that prose is already there.
// - §9.4 broken-target handling: if `broken_target` is true the citation
//   renders as plain text with a `citation-broken` class — never hidden.
// - §4.7 click behavior: valid citations link to the resolved URL per
//   `citationHref`. Clicking uses the DrawerProvider when available for
//   pattern/observation/evidence (reader stays in context); navigates
//   otherwise.
//
// Why not reuse CitationPill (engagement) or SourcePill (intelligence):
// those were authored before §9 existed. CitationPill loads source
// chunks from /api/knowledge/chunk (source-document model); SourcePill
// is a passive name+detail pill. Neither knows about §9's 6 types or
// §9.3 confidence tiers. We leave them in place for their legacy
// surfaces and introduce this as the canonical going-forward primitive.

import { useDrawer } from '@/components/drawer/DrawerProvider';
import type { Citation, ConfidenceTier } from '@/lib/agent/renderedResponse';
import { citationHref } from '@/lib/agent/renderedResponse';

interface AgentCitationProps {
  citation: Citation;
  /**
   * Accent color for the citation pill. Defaults follow File 04 per-zone
   * palette but can be overridden (e.g. when an Atlas response cites a
   * Sentinel-owned pattern, the pill renders in Atlas amber not Sentinel
   * purple so the reader's zone continuity isn't broken).
   */
  accent?: string;
  /**
   * When `compact`, renders the observation/evidence_source citations as
   * superscript numbers (e.g. `[E7]`) per §9.1 rather than full pills.
   * Use `compact` for dense inline prose, full pills for sectioned lists.
   */
  compact?: boolean;
}

const TYPE_LABEL: Record<Citation['target_type'], string> = {
  pattern: 'pattern',
  observation: 'obs',
  evidence_source: 'evidence',
  prior_turn: 'earlier',
  program: 'program',
  deliverable: 'deliverable',
};

const TIER_LABEL: Record<ConfidenceTier, string> = {
  HIGH: 'HIGH',
  MEDIUM: 'MED',
  LOW: 'LOW',
};

export function AgentCitation({ citation, accent = '#0E9F8C', compact = false }: AgentCitationProps) {
  const drawer = useDrawer();
  const href = citationHref(citation);

  // §9.4 broken-target: render as plain text, never hidden, visibly marked.
  if (citation.broken_target || (!href && citation.target_type !== 'prior_turn')) {
    return (
      <span
        className="citation-broken"
        data-target-type={citation.target_type}
        data-target-id={citation.target_id}
        title={`Citation target unreachable · ${citation.target_type}:${citation.target_id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 3,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: compact ? 10 : 11,
          padding: compact ? '0 3px' : '1px 6px',
          color: '#8a7e72',
          background: 'rgba(138,126,114,0.08)',
          border: '1px dashed rgba(138,126,114,0.35)',
          borderRadius: compact ? 3 : 999,
          lineHeight: 1.3,
          verticalAlign: 'baseline',
        }}
      >
        <span style={{ opacity: 0.7 }}>[{TYPE_LABEL[citation.target_type]}:</span>
        {citation.target_label || citation.target_id}
        <span style={{ opacity: 0.7 }}>]</span>
      </span>
    );
  }

  // §9.1 prior-turn citations render inline as prose, not pills.
  if (citation.target_type === 'prior_turn') {
    return (
      <span className="citation-prior-turn" style={{ fontStyle: 'italic', color: '#6d625a' }}>
        (earlier: {citation.target_label})
      </span>
    );
  }

  // Compact observation / evidence_source → superscript reference number.
  if (compact && (citation.target_type === 'observation' || citation.target_type === 'evidence_source')) {
    return (
      <a
        href={href ?? '#'}
        onClick={(e) => {
          if (citation.target_type === 'evidence_source' && href) {
            e.preventDefault();
            drawer.openDrawer({
              kind: 'evidence',
              id: citation.target_id,
              href,
              title: citation.target_label,
              eyebrow: 'Evidence · ' + citation.target_id,
            });
          }
        }}
        className="citation-compact"
        data-target-type={citation.target_type}
        data-confidence-tier={citation.confidence_tier}
        title={`${TYPE_LABEL[citation.target_type]}:${citation.target_id} · ${TIER_LABEL[citation.confidence_tier]} confidence`}
        style={{
          color: accent,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          fontWeight: 700,
          textDecoration: 'none',
          verticalAlign: 'super',
          lineHeight: 1,
          padding: '1px 3px',
          marginLeft: 1,
          background: `${accent}14`,
          borderRadius: 3,
        }}
      >
        [{citation.target_id}]
      </a>
    );
  }

  // Full pill for pattern / program / deliverable and any observation /
  // evidence_source rendered non-compact.
  const tierLabel = TIER_LABEL[citation.confidence_tier];
  const tierOpacity = citation.confidence_tier === 'LOW' ? 0.55 : citation.confidence_tier === 'MEDIUM' ? 0.75 : 1;

  const content = (
    <>
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.06em',
          opacity: 0.7,
          textTransform: 'uppercase',
          marginRight: 4,
        }}
      >
        {TYPE_LABEL[citation.target_type]}
      </span>
      <span>{citation.target_label}</span>
      <span
        style={{
          marginLeft: 6,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.06em',
          opacity: tierOpacity,
          padding: '1px 4px',
          background: `${accent}22`,
          borderRadius: 3,
        }}
      >
        {tierLabel}
      </span>
    </>
  );

  const commonProps = {
    className: `citation-pill citation-${citation.target_type}`,
    'data-target-type': citation.target_type,
    'data-target-id': citation.target_id,
    'data-confidence-tier': citation.confidence_tier,
    'data-provenance': citation.provenance,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      padding: '2px 8px',
      margin: '0 2px',
      background: `${accent}12`,
      border: `1px solid ${accent}55`,
      borderRadius: 999,
      color: accent,
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 12,
      fontWeight: 500,
      cursor: 'pointer',
      textDecoration: 'none',
      verticalAlign: 'baseline',
      lineHeight: 1.4,
    },
    title: `${TYPE_LABEL[citation.target_type]}:${citation.target_id} · ${tierLabel} confidence${citation.provenance ? ` · ${citation.provenance}` : ''}`,
  } as const;

  // Evidence and observation open in drawer, otherwise navigate. Observations
  // live inside patterns; the drawer kind for them is 'pattern' (the parent)
  // with the observation anchor in `href`.
  const isDrawerable = citation.target_type === 'evidence_source' || citation.target_type === 'observation';

  if (isDrawerable) {
    return (
      <a
        {...commonProps}
        href={href ?? '#'}
        onClick={(e) => {
          if (!href) return;
          e.preventDefault();
          drawer.openDrawer({
            kind: citation.target_type === 'evidence_source' ? 'evidence' : 'pattern',
            id: citation.target_id,
            href,
            title: citation.target_label,
            eyebrow: `${TYPE_LABEL[citation.target_type]} · ${citation.target_id}`,
          });
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <a {...commonProps} href={href ?? '#'}>
      {content}
    </a>
  );
}
