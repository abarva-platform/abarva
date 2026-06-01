import type { EvidenceLedger } from '@/lib/agent/evidence-ledger/composer';

interface EvidenceLedgerDrawerProps {
  ledger: EvidenceLedger;
}

export function EvidenceLedgerDrawer({ ledger }: EvidenceLedgerDrawerProps) {
  return (
    <details
      style={{
        border: '1px solid rgba(15, 23, 42, 0.12)',
        borderRadius: 8,
        padding: 12,
        background: '#fff',
      }}
    >
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Evidence ledger</summary>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div>
          <strong>Confidence:</strong> {ledger.confidence}/100 · <strong>Freshness:</strong>{' '}
          {ledger.freshness} · <strong>Owner:</strong> {ledger.owner}
        </div>
        <section aria-label="Data used">
          <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>Data used</h3>
          {ledger.dataUsed.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {ledger.dataUsed.map((row) => (
                <li key={row.substrateId}>
                  {row.label} from {row.sourceTable}, {row.rowCount} rows, as of{' '}
                  {new Date(row.asOf).toISOString().slice(0, 10)}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>No data was sufficient for this answer.</p>
          )}
        </section>
        {ledger.dataMissing.length > 0 ? (
          <section aria-label="Data missing">
            <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>Data missing</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {ledger.dataMissing.map((gap) => (
                <li key={`${gap.requiredFor}-${gap.gapDescription}`}>
                  {gap.requiredFor}: {gap.gapDescription} Next load step: {gap.nextLoadStep}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </details>
  );
}
