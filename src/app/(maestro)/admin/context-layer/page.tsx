import Link from 'next/link';

import {
  NORTHSTAR_CONTEXT_SUMMARY,
  NORTHSTAR_DEMO_PERSONAS,
  NORTHSTAR_INGESTION_STAGES,
  NORTHSTAR_PROFILE,
} from '@/lib/context-ingestion/northstar-read-model';
import { NORTHSTAR_CONTEXT_TEMPLATES } from '@/lib/context-ingestion/template-registry';

export const metadata = {
  title: 'Northstar Context Layer | AbarVa Setup',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const links = [
  ['/admin/context-layer/templates', 'Templates'],
  ['/admin/context-layer/uploads', 'Uploads'],
  ['/admin/context-layer/approval-queue', 'Approval queue'],
  ['/admin/context-layer/syncs', 'Syncs'],
  ['/admin/context-layer/evidence-map', 'Evidence map'],
];

export default function ContextLayerPage() {
  return (
    <main style={{ background: '#F8F7F4', minHeight: '100vh', padding: 32, color: '#171717' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 24 }}>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 0, textTransform: 'uppercase' }}>
            Setup · Context layer pilot
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 44, lineHeight: 1.05, margin: '8px 0' }}>
            {NORTHSTAR_PROFILE.displayName}
          </h1>
          <p style={{ maxWidth: 820, fontFamily: 'DM Sans, sans-serif', fontSize: 16, lineHeight: 1.6 }}>
            A `$20B+` medtech context layer showing how uploaded files become
            approved facts, evidence rows, and reasoning-ready context for
            Sentinel, Source, Moves, and Tower.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {[
            ['Revenue', NORTHSTAR_PROFILE.revenue],
            ['Employees', NORTHSTAR_PROFILE.employees],
            ['Context dimensions', String(NORTHSTAR_CONTEXT_SUMMARY.templateCount)],
            ['Committed facts', '7,636'],
          ].map(([label, value]) => (
            <div key={label} style={{ border: '1px solid #d8d2c4', borderRadius: 8, padding: 16, background: '#fffdf8' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#6b665c' }}>{label}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28 }}>{value}</div>
            </div>
          ))}
        </div>

        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {links.map(([href, label]) => (
            <Link key={href} href={href} style={{ border: '1px solid #171717', borderRadius: 6, padding: '10px 12px', textDecoration: 'none', color: '#171717', fontFamily: 'DM Sans, sans-serif' }}>
              {label}
            </Link>
          ))}
        </nav>

        <section style={{ border: '1px solid #d8d2c4', borderRadius: 8, background: '#fffdf8', padding: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', marginTop: 0 }}>Upload → approve → reason</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            {NORTHSTAR_INGESTION_STAGES.map((stage) => (
              <div key={stage.stage} style={{ border: '1px solid #e3decf', borderRadius: 6, padding: 12 }}>
                <strong style={{ fontFamily: 'DM Sans, sans-serif' }}>{stage.stage}</strong>
                <p style={{ margin: '8px 0 0', fontFamily: 'DM Sans, sans-serif', color: '#514c43' }}>
                  {stage.files} files · {stage.facts.toLocaleString()} facts · {stage.issues} issues
                </p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ border: '1px solid #d8d2c4', borderRadius: 8, background: '#fffdf8', padding: 20 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', marginTop: 0 }}>Template catalog</h2>
            <ul style={{ columns: 2, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.8 }}>
              {NORTHSTAR_CONTEXT_TEMPLATES.map((template) => (
                <li key={template.id}>{template.label}</li>
              ))}
            </ul>
          </div>
          <div style={{ border: '1px solid #d8d2c4', borderRadius: 8, background: '#fffdf8', padding: 20 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', marginTop: 0 }}>Pilot logins</h2>
            <ul style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.8 }}>
              {NORTHSTAR_DEMO_PERSONAS.map(([role, name, email]) => (
                <li key={email}><strong>{role}</strong> · {name} · {email}</li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
