import { connection } from 'next/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSourcingEvent } from '@/lib/source/queries';
import { getValueChain, type SourceValueStateLayer, type SourceValueStateRow } from '@/lib/source/value-chain';
import { formatUsd } from '@/lib/source/value-ledger';

export const metadata = { title: 'Source Value Proof · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ eventId: string }>;
}

const LAYERS: Array<{ key: SourceValueStateLayer; label: string; description: string }> = [
  { key: 'baseline', label: 'Baseline', description: 'What the tenant was on track to pay or risk without AbarVa.' },
  { key: 'intervention', label: 'Intervention', description: 'Specific AbarVa actions: scope, leverage, hard questions, BAFO posture.' },
  { key: 'negotiated', label: 'Negotiated', description: 'Signed or committed commercial outcome.' },
  { key: 'realized', label: 'Realized', description: 'Finance-attested savings or value actually delivered.' },
];

export default async function SourceEventValueProofPage({ params }: PageProps) {
  await connection();
  const { eventId } = await params;
  const event = await getSourcingEvent(eventId);
  if (!event) notFound();
  const chainResult = await getValueChain(event.id).then(
    (chain) => ({ chain }),
    (error) => {
      console.error(
        '[SourceEventValueProofPage] value-chain load failed',
        error instanceof Error ? error.message : String(error),
      );
      return { error: true };
    },
  );

  const states = 'chain' in chainResult ? chainResult.chain.states : [];
  const cumulativeSavings = 'chain' in chainResult ? chainResult.chain.cumulativeSavingsUsd : 0;

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <nav style={crumbStyle} aria-label="Source value proof context">
          <Link href={`/source/events/${event.code}`} style={backLinkStyle}>Source event</Link>
          <span style={crumbDividerStyle}>/</span>
          <span>{event.accountName}</span>
          <span style={crumbDividerStyle}>/</span>
          <span>{event.code}</span>
        </nav>
        <div style={tenantStripStyle}>
          <span style={tenantBadgeStyle}>{event.accountName}</span>
          <span>Decision-support only - Evidence-linked - Client locked</span>
        </div>
        <div style={eyebrowStyle}>Procurement value proof loop</div>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>{event.name}</h1>
            <p style={subtitleStyle}>
              Baseline commercial exposure, AbarVa intervention, negotiated outcome, and CFO-attested realized value.
              Every dollar should resolve to Evidence Ledger proof before it reaches a board pack.
            </p>
          </div>
          <div style={summaryStyle}>
            <Metric label="Baseline exposure" value={formatUsd(event.valueAtStakeUsd)} />
            <Metric label="Cumulative savings" value={formatUsd(cumulativeSavings)} />
            <Metric label="Linked states" value={String(states.length)} />
          </div>
        </header>

        {'error' in chainResult && (
          <section style={errorStyle}>
            <strong>Value proof not loaded yet.</strong> Baseline, negotiated, and
            realized-value records are not ready for this event. Do not use this
            page as savings proof until the evidence ledger and finance
            attestation are populated.
          </section>
        )}

        <section style={waterfallStyle} aria-label="Source value proof waterfall">
          {LAYERS.map((layer, index) => {
            const state = states.find((candidate) => candidate.state_layer === layer.key) ?? null;
            return (
              <article key={layer.key} style={layerStyle}>
                <div style={layerIndexStyle}>{index + 1}</div>
                <div>
                  <div style={layerLabelStyle}>{layer.label}</div>
                  <p style={layerDescriptionStyle}>{layer.description}</p>
                  {state ? <StateDetails state={state} /> : <MissingState layer={layer.key} />}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function StateDetails({ state }: { state: SourceValueStateRow }) {
  return (
    <div style={stateStyle}>
      <div style={amountStyle}>{state.amount_usd === null ? 'No amount' : formatUsd(state.amount_usd)}</div>
      <div style={metaStyle}>{state.amount_basis} · {state.methodology}</div>
      <div style={evidenceStyle}>
        {state.evidence_ledger_ids.length} evidence citation{state.evidence_ledger_ids.length === 1 ? '' : 's'}
      </div>
      {state.state_layer === 'realized' && (
        <div style={attestationStyle}>
          {state.attested_by ? `Attested by ${state.attested_by}` : 'CFO attestation pending'}
        </div>
      )}
    </div>
  );
}

function MissingState({ layer }: { layer: SourceValueStateLayer }) {
  const copy =
    layer === 'baseline' ? 'Baseline exposure must be loaded from contract, spend, or approved intake evidence.'
      : layer === 'intervention' ? 'AbarVa intervention is recorded only after the sourcing action is confirmed.'
        : layer === 'negotiated' ? 'Negotiated outcome requires vendor pricing, terms, or contract evidence.'
          : 'CFO attestation required; realized value cannot be auto-claimed.';
  return <div style={missingStyle}>{copy}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metaStyle}>{label}</div>
    </div>
  );
}

// #F8F7F4 was the superseded v2 cream background (Georgia/DM Sans era). The
// v3 design system (locked 2026-05-07) mandates white for all product pages —
// see design_system.md. This page predates that migration.
const pageStyle = { minHeight: '100vh', background: '#FFFFFF', color: '#111827', padding: '32px 28px 56px' } as const;
const shellStyle = { maxWidth: 1120, margin: '0 auto' } as const;
const backLinkStyle = { color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' } as const;
const crumbStyle = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', color: '#667085', fontSize: 13, fontWeight: 720 } as const;
const crumbDividerStyle = { color: '#98a2b3' } as const;
const tenantStripStyle = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 14, color: '#475467', fontSize: 12, fontWeight: 760 } as const;
const tenantBadgeStyle = { border: '1px solid #c7d7fe', borderRadius: 999, background: '#eef4ff', color: '#1d4ed8', padding: '5px 10px', fontWeight: 900 } as const;
const eyebrowStyle = { marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#667085', fontWeight: 800 } as const;
const headerStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start', marginBottom: 22 } as const;
const titleStyle = { margin: '8px 0 8px', fontFamily: 'Georgia, serif', fontSize: 42, lineHeight: 1.06, fontWeight: 400 } as const;
const subtitleStyle = { margin: 0, maxWidth: 740, fontSize: 15, lineHeight: 1.55, color: '#475467' } as const;
const summaryStyle = { display: 'grid', gap: 10, background: '#fff', border: '1px solid #d7d2c6', borderRadius: 8, padding: 16 } as const;
const metricStyle = { display: 'grid', gap: 4, borderBottom: '1px solid #ece7dd', paddingBottom: 9 } as const;
const metricValueStyle = { fontSize: 20, fontWeight: 900 } as const;
const metaStyle = { color: '#667085', fontSize: 12, lineHeight: 1.4 } as const;
const errorStyle = { border: '1px solid #fecdca', background: '#fef3f2', color: '#b42318', padding: 14, borderRadius: 6, marginBottom: 18 } as const;
const waterfallStyle = { display: 'grid', gap: 12 } as const;
const layerStyle = { display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', gap: 14, border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', padding: 16 } as const;
const layerIndexStyle = { width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#111827', color: '#fff', fontWeight: 900 } as const;
const layerLabelStyle = { fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400 } as const;
const layerDescriptionStyle = { margin: '4px 0 10px', color: '#475467', fontSize: 14 } as const;
const stateStyle = { display: 'grid', gap: 5, borderTop: '1px solid #ece7dd', paddingTop: 10 } as const;
const amountStyle = { fontSize: 22, fontWeight: 900 } as const;
const evidenceStyle = { color: '#175cd3', fontSize: 12, fontWeight: 850 } as const;
const attestationStyle = { color: '#067647', fontSize: 12, fontWeight: 850 } as const;
const missingStyle = { borderTop: '1px solid #ece7dd', paddingTop: 10, color: '#667085', fontSize: 13, lineHeight: 1.45 } as const;
