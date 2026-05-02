'use client';

import { Fragment, useMemo, type ReactNode } from 'react';
import type {
  Artifact,
  BafoScoreboardArtifact,
  ContractClauseArtifact,
  PricingBenchmarkArtifact,
  SourceEventCreatedArtifact,
  SourcingStageChangedArtifact,
  SourcingStageProgressArtifact,
  VendorCardArtifact,
  WalkawaySignalArtifact,
} from '@/lib/agent/artifacts';
import { BrandColors, BrandTypography } from '@/lib/shell/brand-tokens';

export interface SourcingReactivePanelProps {
  artifacts: Artifact[];
}

type SourcingArtifact =
  | VendorCardArtifact
  | PricingBenchmarkArtifact
  | ContractClauseArtifact
  | BafoScoreboardArtifact
  | WalkawaySignalArtifact
  | SourceEventCreatedArtifact
  | SourcingStageProgressArtifact
  | SourcingStageChangedArtifact;

function CardShell({ kind, children }: { kind: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1px solid rgba(12,26,58,0.12)`,
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow: '0 1px 2px rgba(12,26,58,0.04)',
        fontFamily: BrandTypography.sans,
        color: BrandColors.inkBlack,
      }}
    >
      <div
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 9.5,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: BrandColors.signalBlue,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Nexus - {kind}
      </div>
      {children}
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'green' | 'amber' | 'red' | 'neutral';
}) {
  const colors = {
    green: { bg: 'rgba(15,118,110,0.10)', fg: '#0f766e', border: 'rgba(15,118,110,0.32)' },
    amber: { bg: 'rgba(217,119,6,0.10)', fg: '#b45309', border: 'rgba(217,119,6,0.32)' },
    red: { bg: 'rgba(220,38,38,0.10)', fg: '#b91c1c', border: 'rgba(220,38,38,0.32)' },
    neutral: { bg: 'rgba(120,113,108,0.12)', fg: BrandColors.slate, border: 'rgba(120,113,108,0.28)' },
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 8px',
        borderRadius: 999,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.fg,
        fontFamily: BrandTypography.mono,
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function SmallMeta({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: BrandTypography.mono,
        fontSize: 10,
        color: BrandColors.stone,
        marginTop: 6,
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </div>
  );
}

function BodyText({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: '6px 0 0', fontSize: 12.5, color: BrandColors.slate, lineHeight: 1.55 }}>
      {children}
    </p>
  );
}

function VendorCard({ a }: { a: VendorCardArtifact }) {
  return (
    <CardShell kind="Vendor card">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.name}</span>
        <StatusPill label={a.tier} tone={a.tier === 'incumbent' ? 'amber' : 'neutral'} />
      </div>
      <SmallMeta>
        {a.vendorId}
        {a.patternId ? ` - ${a.patternId}` : ''}
      </SmallMeta>
      <BodyText>{a.positioning}</BodyText>
      {a.riskFlags && a.riskFlags.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {a.riskFlags.map((flag) => (
            <StatusPill key={flag} label={flag} tone="amber" />
          ))}
        </div>
      ) : null}
    </CardShell>
  );
}

function PricingBenchmarkCard({ a }: { a: PricingBenchmarkArtifact }) {
  const range =
    a.p25 !== undefined || a.p75 !== undefined
      ? `Range: ${a.p25 ?? '?'} - ${a.p75 ?? '?'}`
      : null;
  return (
    <CardShell kind="Pricing benchmark">
      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.category}</div>
      <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: BrandColors.inkBlack }}>
        {a.median}
      </div>
      <SmallMeta>
        Median {a.metric}
        {range ? ` - ${range}` : ''}
        {a.sampleSize !== undefined ? ` - n=${a.sampleSize}` : ''}
      </SmallMeta>
      <BodyText>Source: {a.source}</BodyText>
      {a.patternId ? <SmallMeta>{a.patternId}</SmallMeta> : null}
    </CardShell>
  );
}

function ContractClauseCard({ a }: { a: ContractClauseArtifact }) {
  return (
    <CardShell kind="Contract clause">
      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
      <SmallMeta>
        {a.clauseId}
        {a.patternId ? ` - ${a.patternId}` : ''}
      </SmallMeta>
      {a.currentLanguage ? (
        <>
          <SmallMeta>Vendor language</SmallMeta>
          <BodyText>{a.currentLanguage}</BodyText>
        </>
      ) : null}
      <SmallMeta>Recommended ask</SmallMeta>
      <BodyText>{a.recommendedLanguage}</BodyText>
      <SmallMeta>Leverage</SmallMeta>
      <BodyText>{a.leverage}</BodyText>
    </CardShell>
  );
}

function BafoScoreboardCard({ a }: { a: BafoScoreboardArtifact }) {
  return (
    <CardShell kind="BAFO scoreboard">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `minmax(96px, 1.2fr) repeat(${a.dimensions.length}, minmax(54px, 0.8fr))`,
          gap: 6,
          alignItems: 'center',
          overflowX: 'auto',
        }}
      >
        <SmallMeta>Vendor</SmallMeta>
        {a.dimensions.map((dimension) => (
          <SmallMeta key={dimension.label}>
            {dimension.label} ({dimension.weight})
          </SmallMeta>
        ))}
        {a.vendors.map((vendor, vendorIndex) => (
          <Fragment key={vendor.vendorId}>
            <div key={`${vendor.vendorId}-name`} style={{ fontSize: 12.5, fontWeight: 600 }}>
              {vendor.name}
            </div>
            {a.dimensions.map((dimension, dimensionIndex) => (
              <div
                key={`${vendor.vendorId}-${dimension.label}`}
                style={{
                  fontFamily: BrandTypography.mono,
                  fontSize: 12,
                  color: BrandColors.inkBlack,
                }}
              >
                {a.scoresMatrix[vendorIndex]?.[dimensionIndex] ?? '-'}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
      {a.notes ? <BodyText>{a.notes}</BodyText> : null}
    </CardShell>
  );
}

function WalkawaySignalCard({ a }: { a: WalkawaySignalArtifact }) {
  const tone = a.credibility === 'strong' ? 'green' : a.credibility === 'soft' ? 'amber' : 'red';
  return (
    <CardShell kind="Walkaway signal">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>Walkaway credibility</span>
        <StatusPill label={a.credibility} tone={tone} />
      </div>
      <SmallMeta>Reasoning</SmallMeta>
      <BodyText>{a.reasoning}</BodyText>
      <SmallMeta>Recommendation</SmallMeta>
      <BodyText>{a.recommendation}</BodyText>
    </CardShell>
  );
}

function SourceEventCreatedCard({ a }: { a: SourceEventCreatedArtifact }) {
  return (
    <CardShell kind="Event registered">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{a.eventName}</span>
        <StatusPill label={a.lifecycleState.replace(/_/g, ' ')} tone="amber" />
      </div>
      <SmallMeta>{a.eventCode}</SmallMeta>
      <BodyText>
        Approval authority: {a.approvalAuthority}. The event is now in the Source operating queue; admin review must approve it before S1 market motion.
      </BodyText>
      {a.approvalUrl ? (
        <a
          href={a.approvalUrl}
          style={{
            marginTop: 10,
            display: 'inline-flex',
            width: 'fit-content',
            borderRadius: 999,
            padding: '6px 10px',
            border: '1px solid rgba(12,26,58,0.16)',
            color: BrandColors.inkBlack,
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          Open approval queue
        </a>
      ) : null}
    </CardShell>
  );
}

function SourcingStageProgressCard({ a }: { a: SourcingStageProgressArtifact }) {
  const tone = a.status === 'met' ? 'green' : a.status === 'unmet' ? 'amber' : 'neutral';
  return (
    <CardShell kind={`Stage progress - ${a.severity === 'hard' ? 'hard gate' : 'soft signal'}`}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.label}</span>
        <StatusPill label={a.status} tone={tone} />
      </div>
      {a.detail ? <BodyText>{a.detail}</BodyText> : null}
      <SmallMeta>{a.evidenceItemId}</SmallMeta>
    </CardShell>
  );
}

function SourcingStageChangedCard({ a }: { a: SourcingStageChangedArtifact }) {
  return (
    <CardShell kind="Stage advanced">
      <div style={{ fontWeight: 600, fontSize: 13.5 }}>
        S{a.fromStage} to S{a.toStage}
      </div>
      <SmallMeta>
        {a.eventId}
        {a.snapshotId ? ` - ${a.snapshotId}` : ''}
      </SmallMeta>
      <BodyText>Server state can refresh in place while the conversation stays mounted.</BodyText>
    </CardShell>
  );
}

function stableSourcingArtifactKey(a: SourcingArtifact): string {
  switch (a.type) {
    case 'vendor-card':
      return `${a.type}:${a.vendorId}`;
    case 'pricing-benchmark':
      return `${a.type}:${a.patternId ?? `${a.category}:${a.metric}:${a.source}`}`;
    case 'contract-clause':
      return `${a.type}:${a.clauseId}`;
    case 'bafo-scoreboard':
      return a.type;
    case 'walkaway-signal':
      return a.type;
    case 'source-event-created':
      return `${a.type}:${a.eventId}`;
    case 'sourcing-stage-progress':
      return `${a.type}:${a.evidenceItemId}`;
    case 'sourcing-stage-changed':
      return `${a.type}:${a.eventId}`;
  }
}

function isSourcingArtifact(a: Artifact): a is SourcingArtifact {
  return (
    a.type === 'vendor-card' ||
    a.type === 'pricing-benchmark' ||
    a.type === 'contract-clause' ||
    a.type === 'bafo-scoreboard' ||
    a.type === 'walkaway-signal' ||
    a.type === 'source-event-created' ||
    a.type === 'sourcing-stage-progress' ||
    a.type === 'sourcing-stage-changed'
  );
}

export function selectVisibleSourcingArtifacts(artifacts: Artifact[]): SourcingArtifact[] {
  const byStableKey = new Map<string, SourcingArtifact>();

  for (const artifact of artifacts) {
    if (!isSourcingArtifact(artifact)) continue;
    const key = stableSourcingArtifactKey(artifact);
    if (byStableKey.has(key)) byStableKey.delete(key);
    byStableKey.set(key, artifact);
  }

  return [...byStableKey.values()].reverse();
}

export function SourcingReactivePanel({ artifacts }: SourcingReactivePanelProps) {
  const visible = useMemo(() => selectVisibleSourcingArtifacts(artifacts), [artifacts]);

  if (visible.length === 0) {
    return (
      <section
        aria-label="Sourcing reactive workbench"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '12px 14px',
          background: BrandColors.paper,
          border: `1px dashed rgba(12,26,58,0.18)`,
          borderRadius: 10,
          color: BrandColors.slate,
          fontFamily: BrandTypography.sans,
        }}
      >
        <div
          style={{
            fontFamily: BrandTypography.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: BrandColors.stone,
            fontWeight: 700,
          }}
        >
          Nexus sourcing reasoning - live
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 12.5, lineHeight: 1.45 }}>
          Ask Nexus to compare vendors, inspect clauses, benchmark pricing, or test walkaway leverage.
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 11.5,
            lineHeight: 1.4,
            color: BrandColors.stone,
            fontStyle: 'italic',
          }}
        >
          Try &ldquo;Compare vendors&rdquo;, &ldquo;Run BAFO check&rdquo;, or &ldquo;What&apos;s the walkaway?&rdquo;
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Sourcing reactive workbench"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        background: BrandColors.paper,
        border: `1px solid rgba(12,26,58,0.10)`,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <header
        style={{
          fontFamily: BrandTypography.mono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: BrandColors.stone,
          fontWeight: 700,
        }}
      >
        Nexus sourcing reasoning - live
      </header>
      {visible.map((artifact) => {
        const key = stableSourcingArtifactKey(artifact);
        switch (artifact.type) {
          case 'vendor-card':
            return <VendorCard key={key} a={artifact} />;
          case 'pricing-benchmark':
            return <PricingBenchmarkCard key={key} a={artifact} />;
          case 'contract-clause':
            return <ContractClauseCard key={key} a={artifact} />;
          case 'bafo-scoreboard':
            return <BafoScoreboardCard key={key} a={artifact} />;
          case 'walkaway-signal':
            return <WalkawaySignalCard key={key} a={artifact} />;
          case 'source-event-created':
            return <SourceEventCreatedCard key={key} a={artifact} />;
          case 'sourcing-stage-progress':
            return <SourcingStageProgressCard key={key} a={artifact} />;
          case 'sourcing-stage-changed':
            return <SourcingStageChangedCard key={key} a={artifact} />;
        }
      })}
    </section>
  );
}
