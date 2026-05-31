import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireTenancy } from '@/lib/auth/tenancy';
import {
  attestValueLayer,
  errorCode,
  getMoveValueDetail,
  type ValueLayerState,
  type ValueStateCell,
  type ValueStateLayer,
} from '@/lib/tower/value-states';

export const metadata = { title: 'Tower Value · AbarVa' };
export const dynamic = 'force-dynamic';

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCell(cell: ValueStateCell): string {
  if (cell.value === null || cell.value === undefined || cell.value === '') return 'Blank';
  if (typeof cell.value === 'string') return cell.value.replaceAll('_', ' ');
  const number = cell.value;
  if (cell.unit === 'usd') return formatUsd(number);
  if (cell.unit === 'percent') return `${number}%`;
  if (cell.unit === 'hours') return `${number.toLocaleString()}h`;
  return number.toLocaleString();
}

function formatVariance(layer: ValueLayerState): string {
  const value = layer.variance.trackedVsProjected;
  if (value === null) return 'n/a';
  const prefix = value > 0 ? '+' : '';
  if (layer.variance.unit === 'usd') return `${prefix}${formatUsd(value)}`;
  if (layer.variance.unit === 'percent') return `${prefix}${value}%`;
  if (layer.variance.unit === 'hours') return `${prefix}${value.toLocaleString()}h`;
  return `${prefix}${value.toLocaleString()}`;
}

function formatOpsEvidence(value: string): string {
  return value.replaceAll('_', ' ');
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid #d7d2c6',
        borderRadius: 999,
        padding: '4px 9px',
        color: '#4b5563',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'capitalize',
      }}
    >
      {children}
    </span>
  );
}

function EvidenceList({ cell }: { cell: ValueStateCell }) {
  if (cell.evidence.length === 0) return <p style={{ margin: 0, color: '#6b7280' }}>No evidence linked yet.</p>;
  return (
    <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#374151', fontSize: 13 }}>
      {cell.evidence.map((item) => (
        <li key={`${cell.kind}-${item.id}`} style={{ marginBottom: 5 }}>
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          <span style={{ color: '#6b7280' }}> · {item.source} · {item.confidence}</span>
        </li>
      ))}
    </ul>
  );
}

function ValueCell({ cell }: { cell: ValueStateCell }) {
  return (
    <div>
      <div style={{ fontWeight: 760, color: '#111827' }}>{formatCell(cell)}</div>
      <div style={{ marginTop: 4, color: '#4b5563', fontSize: 13 }}>{cell.label}</div>
      <div style={{ marginTop: 6 }}>
        <StatusPill>{cell.confidence}</StatusPill>
      </div>
      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', color: '#0f1f4d', fontSize: 13, fontWeight: 760 }}>
          Evidence
        </summary>
        <p style={{ margin: '8px 0 0', color: '#4b5563', fontSize: 13 }}>{cell.basis}</p>
        <EvidenceList cell={cell} />
      </details>
    </div>
  );
}

async function attestLayerAction(formData: FormData) {
  'use server';

  const ctx = await requireTenancy();
  const moveId = String(formData.get('moveId') ?? '');
  const layer = String(formData.get('layer') ?? '') as ValueStateLayer;
  const note = String(formData.get('note') ?? '').trim();
  await attestValueLayer(ctx, { moveId, layer, note: note || null });
  revalidatePath(`/tower/programs/${moveId}/value`);
  revalidatePath('/tower/portfolio');
}

function AttestationControl({
  moveId,
  layer,
  canAttest,
}: {
  moveId: string;
  layer: ValueStateLayer;
  canAttest: boolean;
}) {
  return (
    <form action={attestLayerAction} style={{ marginTop: 10, display: 'grid', gap: 8 }}>
      <input type="hidden" name="moveId" value={moveId} />
      <input type="hidden" name="layer" value={layer} />
      <input
        name="note"
        placeholder="Attestation note"
        disabled={!canAttest}
        style={{
          width: '100%',
          border: '1px solid #d7d2c6',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 13,
          background: canAttest ? '#fff' : '#f4f1ea',
        }}
      />
      <button
        type="submit"
        disabled={!canAttest}
        style={{
          justifySelf: 'start',
          border: '1px solid #111827',
          borderRadius: 6,
          background: canAttest ? '#111827' : '#d7d2c6',
          color: canAttest ? '#fff' : '#6b7280',
          padding: '8px 11px',
          fontSize: 13,
          fontWeight: 780,
          cursor: canAttest ? 'pointer' : 'not-allowed',
        }}
      >
        Verify
      </button>
    </form>
  );
}

export default async function TowerMoveValuePage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const moveId = programId;
  const ctx = await requireTenancy();
  const detail = await getMoveValueDetail(ctx, moveId).catch((error) => {
    const mapped = errorCode(error);
    if (mapped.code === 'not_found') return null;
    throw error;
  });
  if (!detail) notFound();

  return (
    <main style={{ minHeight: '100vh', background: '#F8F7F4', color: '#111827', padding: '32px 28px 54px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <Link href="/tower/portfolio" style={{ color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' }}>
              Tower portfolio
            </Link>
            <h1 style={{ margin: '10px 0 8px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 40, lineHeight: 1.05 }}>
              {detail.move.name}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusPill>{detail.move.templateKind ?? 'Move'}</StatusPill>
              <StatusPill>{detail.move.currentGate ?? `P${detail.move.currentPhase ?? 0}`}</StatusPill>
              <StatusPill>{detail.p10.source === 'move_dependencies' ? 'P10 DAG' : 'DAG fallback'}</StatusPill>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 10, minWidth: 390 }}>
            {[
              ['Projected', detail.totals.projectedUsd],
              ['Tracked', detail.totals.trackedUsd],
              ['Verified', detail.totals.verifiedUsd],
            ].map(([label, value]) => (
              <div key={label} style={{ border: '1px solid #d7d2c6', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 760 }}>{label}</div>
                <div style={{ marginTop: 5, fontWeight: 820, fontSize: 20 }}>{formatUsd(Number(value))}</div>
              </div>
            ))}
          </div>
        </div>

        <section style={{ border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', padding: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 24 }}>
                AI Ops Cost Ledger
              </h2>
              <p style={{ margin: '6px 0 0', color: '#4b5563', fontSize: 13, maxWidth: 760, lineHeight: 1.45 }}>
                Parallel run-cost ledger for projected AI operating cost, realized cost to date, pricing-tier pressure, and model-tier drift.
              </p>
            </div>
            <StatusPill>{formatOpsEvidence(detail.aiOpsCost.entry.evidence)}</StatusPill>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
            {[
              ['Projected 3Y', formatUsd(detail.aiOpsCost.entry.projectedThreeYearUsd)],
              ['Realized to date', formatUsd(detail.aiOpsCost.entry.realizedToDateUsd)],
              ['Realized as of', detail.aiOpsCost.entry.realizedAsOf.slice(0, 10)],
              ['Reason code', detail.aiOpsCost.entry.varianceReasonCode ?? 'None on file'],
            ].map(([label, value]) => (
              <div key={label} style={{ border: '1px solid #eee9df', borderRadius: 8, padding: 12, background: '#fbfaf7' }}>
                <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 760 }}>{label}</div>
                <div style={{ marginTop: 5, color: '#111827', fontSize: 16, fontWeight: 820 }}>{value}</div>
              </div>
            ))}
          </div>
          {detail.aiOpsCost.alert ? (
            <div style={{ marginTop: 12, border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 720 }}>
              {detail.aiOpsCost.alert.message}
            </div>
          ) : null}
          {detail.aiOpsCost.entry.tierBreachAlert || detail.aiOpsCost.entry.modelTierDriftAlert ? (
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {detail.aiOpsCost.entry.tierBreachAlert ? (
                <div style={{ border: '1px solid #f59e0b', background: '#fffbeb', color: '#92400e', borderRadius: 8, padding: 12, fontSize: 13 }}>
                  Pricing tier breach projected at {detail.aiOpsCost.entry.tierBreachAlert.threshold.toLocaleString()} calls per month on {detail.aiOpsCost.entry.tierBreachAlert.projectedDate}.
                </div>
              ) : null}
              {detail.aiOpsCost.entry.modelTierDriftAlert ? (
                <div style={{ border: '1px solid #dc2626', background: '#fef2f2', color: '#991b1b', borderRadius: 8, padding: 12, fontSize: 13 }}>
                  Model tier drift from {formatOpsEvidence(detail.aiOpsCost.entry.modelTierDriftAlert.fromTier)} to {formatOpsEvidence(detail.aiOpsCost.entry.modelTierDriftAlert.toTier)} adds {formatUsd(detail.aiOpsCost.entry.modelTierDriftAlert.deltaUsd)}.
                </div>
              ) : null}
            </div>
          ) : null}
          <p style={{ margin: '12px 0 0', color: '#6b7280', fontSize: 12, lineHeight: 1.4 }}>
            Source: {detail.aiOpsCost.entry.source}
          </p>
        </section>

        <section style={{ border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(190px, 0.9fr) repeat(3, minmax(190px, 1fr)) minmax(115px, 0.55fr)',
              background: '#f0ede6',
              borderBottom: '1px solid #d7d2c6',
              color: '#4b5563',
              fontSize: 12,
              fontWeight: 820,
              textTransform: 'uppercase',
            }}
          >
            {['Layer', 'Projected', 'Tracked', 'Verified', 'Variance'].map((heading) => (
              <div key={heading} style={{ padding: '12px 14px' }}>{heading}</div>
            ))}
          </div>
          {detail.layers.map((layer) => (
            <div
              key={layer.layer}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(190px, 0.9fr) repeat(3, minmax(190px, 1fr)) minmax(115px, 0.55fr)',
                borderBottom: '1px solid #eee9df',
              }}
            >
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 820 }}>{layer.definition.label}</div>
                <p style={{ margin: '7px 0 0', color: '#6b7280', fontSize: 13, lineHeight: 1.35 }}>
                  {layer.definition.description}
                </p>
              </div>
              <div style={{ padding: 14 }}><ValueCell cell={layer.projected} /></div>
              <div style={{ padding: 14 }}><ValueCell cell={layer.tracked} /></div>
              <div style={{ padding: 14 }}>
                <ValueCell cell={layer.verified} />
                <AttestationControl moveId={detail.move.id} layer={layer.layer} canAttest={detail.canAttest} />
              </div>
              <div style={{ padding: 14, fontWeight: 820, color: '#0f1f4d' }}>{formatVariance(layer)}</div>
            </div>
          ))}
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ margin: '0 0 10px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 24 }}>
            Dependency Arrows
          </h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {detail.p10.arrows.length === 0 ? (
              <p style={{ margin: 0, color: '#6b7280' }}>No dependency arrows are linked yet.</p>
            ) : detail.p10.arrows.map((arrow) => (
              <div key={arrow.id} style={{ border: '1px solid #d7d2c6', borderRadius: 8, padding: 14, background: '#fff' }}>
                <strong>{arrow.fromMoveName}</strong>
                <span style={{ color: '#0f1f4d', fontWeight: 900 }}> → </span>
                <strong>{arrow.toMoveName}</strong>
                <span style={{ color: '#6b7280' }}> · {arrow.relationType}</span>
                {arrow.note ? <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{arrow.note}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
