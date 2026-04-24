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
    >
      <SourceValueLedger snapshot={snapshot} />
    </SourceFoundationShell>
  );
}
