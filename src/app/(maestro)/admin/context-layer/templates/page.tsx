import { NORTHSTAR_CONTEXT_TEMPLATES } from '@/lib/context-ingestion/template-registry';

export const metadata = { title: 'Context Templates | AbarVa Setup' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ContextTemplatesPage() {
  return (
    <main style={{ background: '#F8F7F4', minHeight: '100vh', padding: 32 }}>
      <section style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42 }}>Context template explorer</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fffdf8', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr>
              {['Dimension', 'Formats', 'Required fields', 'Owner', 'Refresh', 'Surfaces unlocked'].map((head) => (
                <th key={head} style={{ textAlign: 'left', borderBottom: '1px solid #d8d2c4', padding: 10 }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NORTHSTAR_CONTEXT_TEMPLATES.map((template) => (
              <tr key={template.id}>
                <td style={{ borderBottom: '1px solid #eee7d8', padding: 10 }}>{template.label}</td>
                <td style={{ borderBottom: '1px solid #eee7d8', padding: 10 }}>{template.acceptedFormats.join(', ')}</td>
                <td style={{ borderBottom: '1px solid #eee7d8', padding: 10 }}>{template.requiredFields.join(', ')}</td>
                <td style={{ borderBottom: '1px solid #eee7d8', padding: 10 }}>{template.ownerRole}</td>
                <td style={{ borderBottom: '1px solid #eee7d8', padding: 10 }}>{template.refreshCadence}</td>
                <td style={{ borderBottom: '1px solid #eee7d8', padding: 10 }}>{template.unlocks.join('; ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
