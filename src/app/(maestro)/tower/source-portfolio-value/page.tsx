import { connection } from 'next/server';
import Link from 'next/link';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { computeCumulativeSavings } from '@/lib/source/value-chain';
import { formatUsd } from '@/lib/source/value-ledger';

export const metadata = { title: 'Source Portfolio Value · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SourcePortfolioValuePage() {
  await connection();
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';
  const savings = activeClient?.key
    ? await Promise.all([
        computeCumulativeSavings(activeClient.key, 90).catch(() => 0),
        computeCumulativeSavings(activeClient.key, 180).catch(() => 0),
        computeCumulativeSavings(activeClient.key, 365).catch(() => 0),
      ])
    : [0, 0, 0];

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <Link href="/tower" style={backLinkStyle}>Tower</Link>
        <div style={eyebrowStyle}>{clientName}</div>
        <h1 style={titleStyle}>Source Portfolio Value</h1>
        <p style={subtitleStyle}>
          Tenant-wide procurement value proof rollup: baseline, negotiated, and realized savings by event.
          Values only count as realized when the Source value proof loop has CFO attestation.
        </p>

        <section style={metricsStyle}>
          <Metric label="90 day realized savings" value={formatUsd(savings[0])} />
          <Metric label="180 day realized savings" value={formatUsd(savings[1])} />
          <Metric label="365 day realized savings" value={formatUsd(savings[2])} />
        </section>

        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>CFO defensibility rule</h2>
          <p style={bodyStyle}>
            Source savings are not counted from recommendation text. They enter Tower only after the Source event has
            baseline evidence, intervention record, negotiated outcome, and a realized state signed by finance.
          </p>
          <Link href="/admin/cfo-attestation" style={buttonStyle}>Open CFO attestation queue</Link>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metaStyle}>{label}</div>
    </div>
  );
}

const pageStyle = { minHeight: '100vh', background: '#F8F7F4', color: '#111827', padding: '32px 28px 56px' } as const;
const shellStyle = { maxWidth: 1080, margin: '0 auto' } as const;
const backLinkStyle = { color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' } as const;
const eyebrowStyle = { marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#667085', fontWeight: 800 } as const;
const titleStyle = { margin: '8px 0 8px', fontFamily: 'Georgia, serif', fontSize: 44, lineHeight: 1.06, fontWeight: 400 } as const;
const subtitleStyle = { margin: 0, maxWidth: 760, fontSize: 15, lineHeight: 1.55, color: '#475467' } as const;
const metricsStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 24 } as const;
const metricStyle = { border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', padding: 18 } as const;
const metricValueStyle = { fontSize: 28, fontWeight: 900 } as const;
const metaStyle = { color: '#667085', fontSize: 12, lineHeight: 1.4 } as const;
const panelStyle = { border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', padding: 18, marginTop: 14 } as const;
const sectionTitleStyle = { margin: 0, fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400 } as const;
const bodyStyle = { color: '#475467', fontSize: 14, lineHeight: 1.55 } as const;
const buttonStyle = { display: 'inline-flex', border: '1px solid #111827', borderRadius: 7, background: '#111827', color: '#fff', padding: '10px 14px', fontWeight: 850, textDecoration: 'none' } as const;
