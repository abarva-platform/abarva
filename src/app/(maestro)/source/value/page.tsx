import { SourceFoundationShell, SourceValueLedger } from '@/components/source';
import { getSourceValueLedger } from '@/lib/source/queries';

export const dynamic = 'force-dynamic';

export default async function SourceValuePage() {
  const snapshot = await getSourceValueLedger();

  return (
    <SourceFoundationShell
      activeRoute="value"
      title="Source value ledger"
      summary="Canonical projected and realized value surface for AbarVa Source. This is intentionally separate from Control Tower summaries and legacy chat-only value narratives."
      contextUsed={[
        'Seeded Source value ledger snapshot',
        'Perspective: projected, committed, measuring, realized',
        'Evidence: confidence + source marker per line item',
        'Measurement owner: Source Value Office',
      ]}
      customAskPrompt="Ask Atlas about this value ledger, gate, event, or evidence..."
    >
      <SourceValueLedger snapshot={snapshot} />
    </SourceFoundationShell>
  );
}
