import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getActiveClientRow } from '@/lib/active-client';
import {
  listInitiativesForClient,
  listVendorsForClient,
  type AIInitiative,
  type AIInitiativeVendorRow,
} from '@/lib/admin/ai-initiatives/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tower initiative detail · AbarVa' };

const INK = '#1A1A18';
const MUTED = '#525866';
const RULE = 'rgba(10,10,11,0.12)';
const RULE_STRONG = 'rgba(10,10,11,0.22)';
const GOLD = '#c9a227';
const NAVY = '#1B2B5C';
const GREEN = '#1d9e75';
const RED = '#a32d2d';
const AMBER = '#ba7517';
const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, serif';
const SANS = 'var(--font-inter), "Inter", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

function money(usd: number | null | undefined): string {
  const value = Number(usd ?? 0);
  if (!value) return '$0';
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function labelize(value: string | null | undefined): string {
  if (!value) return 'Unassigned';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: AIInitiative['statusFlag']): string {
  if (status === 'healthy') return GREEN;
  if (status === 'cost_overrun' || status === 'stalled') return RED;
  if (status === 'duplication_risk' || status === 'adoption_gap' || status === 'value_lag') return AMBER;
  return NAVY;
}

function Metric({
  label,
  value,
  note,
  tone = INK,
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div style={{ border: `1px solid ${RULE}`, borderRadius: 8, padding: '14px 16px', background: '#fafafa' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '1.4px', textTransform: 'uppercase', color: MUTED, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontFamily: SERIF, fontSize: 26, lineHeight: 1, fontWeight: 820, color: tone }}>
        {value}
      </div>
      <div style={{ marginTop: 7, color: MUTED, fontSize: 12.5, lineHeight: 1.45 }}>{note}</div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ borderTop: `1px solid ${RULE_STRONG}`, paddingTop: 22, marginTop: 26 }}>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '1.8px', textTransform: 'uppercase', color: GOLD, fontWeight: 800 }}>
        {eyebrow}
      </div>
      <h2 style={{ margin: '7px 0 14px', fontFamily: SERIF, fontSize: 24, lineHeight: 1.1, color: INK }}>{title}</h2>
      {children}
    </section>
  );
}

async function loadDetail(programId: string): Promise<{
  clientName: string;
  initiative: AIInitiative;
  vendors: ReadonlyArray<AIInitiativeVendorRow>;
} | null> {
  const activeClient = await getActiveClientRow();
  if (!activeClient) return null;

  const [initiatives, vendors] = await Promise.all([
    listInitiativesForClient(activeClient.id),
    listVendorsForClient(activeClient.id),
  ]);
  const decoded = decodeURIComponent(programId).trim().toLowerCase();
  const initiative = initiatives.find((row) => {
    return (
      row.displayId.toLowerCase() === decoded ||
      row.initiativeId.toLowerCase() === decoded
    );
  });
  if (!initiative) return null;

  return {
    clientName: activeClient.name,
    initiative,
    vendors: vendors.filter((vendor) => vendor.initiativeId === initiative.initiativeId),
  };
}

export default async function TowerProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const detail = await loadDetail(programId);
  if (!detail) notFound();

  const { clientName, initiative, vendors } = detail;
  const committed = initiative.committedAnnualUsd ?? initiative.committedTotalUsd ?? 0;
  const measured = initiative.measuredValueUsd ?? 0;
  const valueDelta = measured - committed;

  return (
    <main style={{ padding: '32px 40px 72px', color: INK, fontFamily: SANS, maxWidth: 1280, margin: '0 auto' }}>
      <Link href="/tower" style={{ fontFamily: MONO, fontSize: 10, color: NAVY, textDecoration: 'none', letterSpacing: '0.14em', fontWeight: 800 }}>
        CONTROL TOWER
      </Link>

      <header style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: '1.8px', textTransform: 'uppercase', fontWeight: 800 }}>
            {clientName} · {initiative.displayId} · {labelize(initiative.stage)}
          </div>
          <h1 style={{ margin: '8px 0 8px', fontFamily: SERIF, fontSize: 42, lineHeight: 1, letterSpacing: '-1px', color: INK }}>
            {initiative.name}
          </h1>
          <p style={{ maxWidth: '74ch', margin: 0, color: MUTED, fontSize: 14, lineHeight: 1.58 }}>
            {initiative.description}
          </p>
        </div>
        <div style={{ border: `1px solid ${RULE_STRONG}`, borderRadius: 8, padding: '12px 14px', minWidth: 220 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: MUTED, letterSpacing: '1.4px', textTransform: 'uppercase', fontWeight: 800 }}>
            Current status
          </div>
          <div style={{ marginTop: 6, color: statusTone(initiative.statusFlag), fontWeight: 800, fontSize: 14 }}>
            {labelize(initiative.statusFlag)}
          </div>
          <div style={{ marginTop: 8, color: MUTED, fontSize: 12.5, lineHeight: 1.45 }}>
            Confidence {initiative.confidenceLevel}. Source: {initiative.loadedViaTemplate}.
          </div>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginTop: 28 }}>
        <Metric label="Committed" value={money(committed)} note="Annual or total commitment from ai_initiatives." />
        <Metric label="Measured value" value={money(measured)} note="Measured value captured in the registry." tone={measured > 0 ? GREEN : MUTED} />
        <Metric label="Delta" value={money(valueDelta)} note="Measured value minus committed baseline." tone={valueDelta >= 0 ? GREEN : RED} />
        <Metric label="Vendors" value={vendors.length.toString()} note="Linked ai_initiative_vendors records." tone={vendors.length > 0 ? NAVY : MUTED} />
      </section>

      <Section eyebrow="Ownership" title="Who owns this initiative">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          <Metric label="Owner" value={initiative.ownerName} note={initiative.ownerTitle} tone={NAVY} />
          <Metric label="Function" value={initiative.ownerFunction ?? 'Unassigned'} note="Owner function from the registry." />
          <Metric label="Goal" value={initiative.primaryGoalName} note={initiative.primaryCategoryName} />
        </div>
      </Section>

      <Section eyebrow="Atlas read" title="Current status summary">
        <div style={{ border: `1px solid ${RULE}`, borderRadius: 8, padding: 18, background: '#fafafa', color: MUTED, lineHeight: 1.55, fontSize: 14 }}>
          {initiative.statusSummary}
          {initiative.alignedRationale ? (
            <p style={{ margin: '12px 0 0', color: INK }}>
              <strong>Alignment rationale:</strong> {initiative.alignedRationale}
            </p>
          ) : null}
        </div>
      </Section>

      <Section eyebrow="Dependencies" title="Vendor and renewal exposure">
        {vendors.length === 0 ? (
          <div style={{ border: `1px dashed ${RULE_STRONG}`, borderRadius: 8, padding: 18, color: MUTED, background: '#fafafa' }}>
            No vendor dependency records are loaded for this initiative. Tower is not substituting fixture dependencies.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {vendors.map((vendor) => (
              <div key={vendor.vendorId} style={{ border: `1px solid ${RULE}`, borderRadius: 8, padding: 15, background: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
                  <strong style={{ color: INK, fontSize: 15 }}>{vendor.vendorName}</strong>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    {vendor.renewalDate ?? 'No renewal date'}
                  </span>
                </div>
                <div style={{ marginTop: 7, color: MUTED, fontSize: 13, lineHeight: 1.45 }}>
                  Contract value {money(vendor.contractValueUsd)} · financial health {labelize(vendor.financialHealth)}.
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </main>
  );
}
