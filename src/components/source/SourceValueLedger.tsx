import type { SourceValueLedgerSnapshot } from '@/lib/source/types';
import { formatUsd, getLedgerRollup } from '@/lib/source/value-ledger';
import { sourceCard, sourceTableCell } from './foundationStyles';

export function SourceValueLedger({ snapshot }: { snapshot: SourceValueLedgerSnapshot }) {
  const rollup = getLedgerRollup(snapshot);

  return (
    <section style={sourceCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Source value ledger</div>
          <div style={{ fontSize: 13, opacity: 0.72 }}>Updated {snapshot.updatedAt}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, minWidth: 360 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.72 }}>Projected</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{formatUsd(rollup.projectedUsd)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.72 }}>Realized</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{formatUsd(rollup.realizedUsd)}</div>
          </div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: 12, opacity: 0.72 }}>
              <th style={{ padding: '0 14px 12px' }}>Kind</th>
              <th style={{ padding: '0 14px 12px' }}>Event</th>
              <th style={{ padding: '0 14px 12px' }}>Line item</th>
              <th style={{ padding: '0 14px 12px' }}>Stage</th>
              <th style={{ padding: '0 14px 12px' }}>Amount</th>
              <th style={{ padding: '0 14px 12px' }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {[...snapshot.projected, ...snapshot.realized].map((entry) => (
              <tr key={entry.id}>
                <td style={sourceTableCell}>{entry.kind}</td>
                <td style={sourceTableCell}>{entry.eventName}</td>
                <td style={sourceTableCell}>
                  <div style={{ fontWeight: 700 }}>{entry.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{entry.note}</div>
                </td>
                <td style={sourceTableCell}>{entry.stageKey ?? 'n/a'}</td>
                <td style={sourceTableCell}>{formatUsd(entry.amountUsd)}</td>
                <td style={sourceTableCell}>{entry.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
