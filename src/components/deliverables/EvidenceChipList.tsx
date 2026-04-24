'use client';

// Evidence-as-drawer wiring. Replaces the static Evidence Citations list
// with click-to-open drawer affordances. Each chip is clickable; click
// opens the DrawerProvider with the evidence detail rendered in-drawer.
// User can promote drawer to full-page if they want to deep-link.

import { useDrawer } from '@/components/drawer/DrawerProvider';

interface EvidenceItem {
  id: string;
  label: string;
  kind: string;
  href?: string;
  source?: string;
  reference?: string;
  confidence?: string | null;
}

export function EvidenceChipList({
  items,
  programCode,
  deliverableCode,
}: {
  items: EvidenceItem[];
  programCode: string;
  deliverableCode: string;
}) {
  const drawer = useDrawer();

  function openEvidence(ref: EvidenceItem) {
    const href = ref.href ?? `/evidence/${encodeURIComponent(ref.id)}?program=${encodeURIComponent(programCode)}&deliverable=${encodeURIComponent(deliverableCode)}`;
    drawer.openDrawer({
      kind: 'evidence',
      id: ref.id,
      href,
      title: `${ref.id} · ${ref.kind}`,
      eyebrow: 'Evidence detail',
      body: (
        <article style={{ fontFamily: 'DM Sans, -apple-system, sans-serif' }}>
          <header style={{ marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(26,22,18,0.08)' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#9B6DFF', fontWeight: 700, marginBottom: 8,
            }}>
              {ref.id} · {ref.kind}
            </div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, letterSpacing: '-0.02em', margin: 0, fontWeight: 700, lineHeight: 1.15 }}>
              {ref.label}
            </h2>
          </header>
          <section style={{ fontSize: 14, lineHeight: 1.65, color: '#3d342d' }}>
            <p>
              Source: <strong>{ref.source ?? ref.label}</strong>
            </p>
            {ref.reference ? (
              <p style={{ marginTop: 12 }}>
                Reference: {ref.reference}
              </p>
            ) : null}
            <p style={{ marginTop: 12 }}>
              Cited in <strong>{deliverableCode}</strong> · program <strong>{programCode}</strong>.
            </p>
            {ref.confidence ? (
              <p style={{ marginTop: 12 }}>
                Confidence: <strong>{ref.confidence}</strong>
              </p>
            ) : null}
            <p style={{ marginTop: 12, fontSize: 12, color: '#6d625a', fontStyle: 'italic' }}>
              Evidence details resolve against the program&rsquo;s authored <code>_evidence-base.json</code>.
              Use the canonical route if you want a durable deep link.
            </p>
          </section>
          <footer style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid rgba(26,22,18,0.08)', fontSize: 12, color: '#8a7e72', lineHeight: 1.7 }}>
            Composite organization built from real-world data.
          </footer>
        </article>
      ),
    });
  }

  return (
    <div className="del-link-list">
      {items.map((ref) => (
        <button
          key={ref.id}
          type="button"
          onClick={() => openEvidence(ref)}
          className="del-status-item evidence-chip"
          id={`evidence-${ref.id.toLowerCase()}`}
          style={{
            textAlign: 'left',
            background: 'rgba(255,253,248,.72)',
            border: '1px solid var(--del-line)',
            borderRadius: 18,
            padding: 14,
            cursor: 'pointer',
            fontFamily: 'DM Sans, -apple-system, sans-serif',
            width: '100%',
            display: 'block',
          }}
          aria-label={`Open evidence ${ref.id}`}
        >
          <div className="del-eyebrow">{ref.id} · {ref.kind}</div>
          <strong style={{ display: 'block', marginTop: 4 }}>{ref.label}</strong>
          <span style={{
            display: 'inline-block', marginTop: 8,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            letterSpacing: '0.12em', color: '#9B6DFF', fontWeight: 700,
          }}>
            Open evidence →
          </span>
        </button>
      ))}
    </div>
  );
}
