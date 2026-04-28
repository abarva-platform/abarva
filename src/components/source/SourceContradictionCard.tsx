import { SHELL } from '@/lib/shell/shell-tokens';

export interface SourceContradictionCardProps {
  contradictionId: string;
  title: string;
  claimA: { source: string; text: string; confidence: 'high' | 'medium' | 'low' };
  claimB: { source: string; text: string; confidence: 'high' | 'medium' | 'low' };
  sentinelDiagnosis: string;
  recommendedResolution: string;
  severity: 'critical' | 'high' | 'medium';
  status: 'open' | 'resolved' | 'deferred';
}

function severityPillStyle(severity: 'critical' | 'high' | 'medium') {
  if (severity === 'critical') {
    return { color: SHELL.RUST_TEXT, background: SHELL.RUST_BG };
  }
  if (severity === 'high') {
    return { color: SHELL.PEACH_TEXT, background: SHELL.PEACH_BG };
  }
  return { color: SHELL.AMBER_DOT, background: SHELL.GRAY_BG };
}

function confidenceLabel(confidence: 'high' | 'medium' | 'low') {
  if (confidence === 'high') return { label: 'High confidence', color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG };
  if (confidence === 'medium') return { label: 'Medium confidence', color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG };
  return { label: 'Low confidence', color: SHELL.RUST_TEXT, bg: SHELL.RUST_BG };
}

function statusLabel(status: 'open' | 'resolved' | 'deferred') {
  if (status === 'open') return { label: 'Open', color: SHELL.PEACH_TEXT, bg: SHELL.PEACH_BG };
  if (status === 'resolved') return { label: 'Resolved', color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG };
  return { label: 'Deferred', color: SHELL.GRAY_TEXT, bg: SHELL.GRAY_BG };
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        color: SHELL.INK_MUTED,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: 6,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

function ClaimBlock({ claim }: { claim: SourceContradictionCardProps['claimA'] }) {
  const conf = confidenceLabel(claim.confidence);
  return (
    <div
      style={{
        background: SHELL.PAPER_SOFT,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 8,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: SHELL.INK_MUTED,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {claim.source}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 13,
          color: SHELL.INK,
          lineHeight: 1.55,
        }}
      >
        {claim.text}
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          padding: '2px 8px',
          background: conf.bg,
          borderRadius: 4,
          fontFamily: SHELL.MONO,
          fontSize: 9,
          color: conf.color,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {conf.label}
      </div>
    </div>
  );
}

export function SourceContradictionCard(props: SourceContradictionCardProps) {
  const {
    title,
    claimA,
    claimB,
    sentinelDiagnosis,
    recommendedResolution,
    severity,
    status,
  } = props;

  const sevStyle = severityPillStyle(severity);
  const statStyle = statusLabel(status);

  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3
          style={{
            fontFamily: SHELL.SERIF,
            fontSize: 20,
            color: SHELL.INK,
            fontWeight: 'normal',
            margin: 0,
            flex: 1,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        <div
          style={{
            padding: '3px 10px',
            background: sevStyle.background,
            borderRadius: 5,
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: sevStyle.color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            flexShrink: 0,
          }}
        >
          {severity}
        </div>
      </div>

      {/* Sentinel diagnosis */}
      <div>
        <SectionLabel>Sentinel diagnosis</SectionLabel>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK,
            lineHeight: 1.6,
          }}
        >
          {sentinelDiagnosis}
        </div>
      </div>

      {/* Claims side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ClaimBlock claim={claimA} />
        <ClaimBlock claim={claimB} />
      </div>

      {/* Recommended resolution */}
      <div>
        <SectionLabel>Recommended resolution</SectionLabel>
        <div
          style={{
            fontFamily: SHELL.SANS,
            fontSize: 13,
            color: SHELL.INK_SOFT,
            lineHeight: 1.6,
          }}
        >
          {recommendedResolution}
        </div>
      </div>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '3px 10px',
            background: statStyle.bg,
            borderRadius: 5,
            fontFamily: SHELL.MONO,
            fontSize: 9,
            color: statStyle.color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {statStyle.label}
        </div>
      </div>
    </div>
  );
}

export const SAMPLE_CONTRADICTION: SourceContradictionCardProps = {
  contradictionId: 'CONTR-AMS-001',
  title: 'BAFO pricing vs. baseline cost model',
  claimA: {
    source: 'Vendor C BAFO submission · Stage 7',
    text: 'Annual managed services fee: $4.2M, inclusive of all SLA commitments and transition support.',
    confidence: 'high',
  },
  claimB: {
    source: 'Internal cost model · Sourcing team baseline',
    text: 'Expected annual run-rate post-transition: $3.6M based on scope letter assumptions.',
    confidence: 'medium',
  },
  sentinelDiagnosis: 'The $600K delta between Vendor C BAFO submission and internal cost model baseline exceeds the acceptable variance threshold (±5%). This contradiction must be resolved before Evaluation to BAFO gate can close.',
  recommendedResolution: 'Request clarification from Vendor C on scope assumptions that drive the $600K premium. Update internal cost model if scope assumptions are validated.',
  severity: 'high',
  status: 'open',
};
