import { connection } from 'next/server';
import Link from 'next/link';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata = { title: 'CFO Attestation · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CfoAttestationPage() {
  await connection();
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <Link href="/admin" style={backLinkStyle}>Admin</Link>
        <div style={eyebrowStyle}>{clientName}</div>
        <h1 style={titleStyle}>CFO Attestation</h1>
        <p style={subtitleStyle}>
          Quarterly ceremony for finance to attest, dispute, or defer realized Source value. Packet 23 blocks realized
          value states unless an attestor and attestation timestamp are present.
        </p>

        <section style={panelStyle}>
          <h2 style={sectionTitleStyle}>Current queue</h2>
          <p style={bodyStyle}>
            Events appear here after baseline, intervention, and negotiated states exist. The v1 foundation lands the
            immutable state model and service guardrails; operator workflow/API actions are the next hardening slice.
          </p>
          <div style={emptyStyle}>No realized-value attestations are waiting in this tenant queue yet.</div>
        </section>
      </div>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#F8F7F4', color: '#111827', padding: '32px 28px 56px' } as const;
const shellStyle = { maxWidth: 960, margin: '0 auto' } as const;
const backLinkStyle = { color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' } as const;
const eyebrowStyle = { marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#667085', fontWeight: 800 } as const;
const titleStyle = { margin: '8px 0 8px', fontFamily: 'Georgia, serif', fontSize: 44, lineHeight: 1.06, fontWeight: 400 } as const;
const subtitleStyle = { margin: 0, maxWidth: 760, fontSize: 15, lineHeight: 1.55, color: '#475467' } as const;
const panelStyle = { border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', padding: 18, marginTop: 24 } as const;
const sectionTitleStyle = { margin: 0, fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400 } as const;
const bodyStyle = { color: '#475467', fontSize: 14, lineHeight: 1.55 } as const;
const emptyStyle = { border: '1px solid #e4e0d7', borderRadius: 7, background: '#fffdf8', color: '#667085', padding: 14, marginTop: 12 } as const;
