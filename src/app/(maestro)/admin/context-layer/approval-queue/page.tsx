import { approveValidFacts, stageFactsForApproval } from '@/lib/context-ingestion/approval-queue';
import { runNorthstarContextIngestion } from '@/lib/context-ingestion/sync-runner';

export const metadata = { title: 'Context Approval Queue | AbarVa Setup' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ContextApprovalQueuePage() {
  const result = runNorthstarContextIngestion({
    fileName: 'ERP_Landscape_Workbook.csv',
    text: [
      'erp_object_id,platform,process_area,owner_role,business_unit,annual_value_usd',
      'ERP-001,SAP ECC,Global finance,CIO ERP Transformation,Corporate,78000000',
      'ERP-002,JD Edwards,Dental manufacturing,VP Dental IT,Dental Solutions,13000000',
      'ERP-003,AS/400,Distributor rebates,,Dental Solutions,not-a-number',
    ].join('\n'),
  });
  const staged = stageFactsForApproval(result.run.facts);
  const reviewed = approveValidFacts(staged);

  return (
    <main style={{ background: '#F8F7F4', minHeight: '100vh', padding: 32 }}>
      <section style={{ maxWidth: 1120, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42 }}>Approval queue</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fffdf8', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr>{['Fact', 'Reviewer', 'State', 'Reason'].map((head) => <th key={head} style={{ padding: 10, borderBottom: '1px solid #d8d2c4', textAlign: 'left' }}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {reviewed.slice(0, 18).map((item) => (
              <tr key={item.approvalId}>
                <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{item.fact.entityKey}.{item.fact.field}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{item.reviewerRole}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{item.state}</td>
                <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{item.reason ?? 'Ready for context commit'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
