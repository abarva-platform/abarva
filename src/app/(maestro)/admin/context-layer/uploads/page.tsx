import { runNorthstarContextIngestion } from '@/lib/context-ingestion/sync-runner';

export const metadata = { title: 'Context Uploads | AbarVa Setup' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const sampleCsv = [
  'app_id,name,criticality,owner_role,system_of_record,time_classification,annual_value_usd',
  'NST-CMDB-001,SAP ECC Finance,P0,VP ERP,true,migrate,42000000',
  'NST-CMDB-002,JD Edwards Dental,P1,VP Dental IT,true,retire,8400000',
  'NST-CMDB-BAD,Legacy rebate engine,P1,,true,invalid-time,not-a-number',
].join('\n');

export default function ContextUploadsPage() {
  const result = runNorthstarContextIngestion({
    fileName: 'ServiceNow_CMDB_Export.csv',
    text: sampleCsv,
  });

  return (
    <main style={{ background: '#F8F7F4', minHeight: '100vh', padding: 32 }}>
      <section style={{ maxWidth: 1060, margin: '0 auto', display: 'grid', gap: 18 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42 }}>Upload classification preview</h1>
        <div style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 18, fontFamily: 'DM Sans, sans-serif' }}>
          <p><strong>File:</strong> {result.run.file.fileName}</p>
          <p><strong>Classification:</strong> {result.run.classification.templateType} · {result.run.classification.dimension}</p>
          <p><strong>Extraction:</strong> {result.run.classification.extractionStrategy} · confidence {result.run.classification.confidence}</p>
          <p><strong>Facts:</strong> {result.run.facts.length} extracted · {result.run.validationFindings.length} validation findings · {result.run.committedFactIds.length} committed after approval</p>
        </div>
        <div style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 18 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', marginTop: 0 }}>Validation findings</h2>
          <ul style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.8 }}>
            {result.run.validationFindings.map((finding) => (
              <li key={`${finding.code}-${finding.row}-${finding.field}`}>
                <strong>{finding.severity}</strong> · row {finding.row ?? '-'} · {finding.field ?? '-'} · {finding.message}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
