import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { SourceSubNav } from '@/components/source/SourceSubNav';
import { SourceWorkingPane } from '@/components/source/SourceWorkingPane';
import { RenewalCockpitView } from '@/components/source/RenewalCockpitView';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { SHELL } from '@/lib/shell/shell-tokens';
import { loadRenewalCockpitWithEvidence } from '@/lib/source/decision-queue/load';

export const metadata = { title: 'Source · Renewal Cockpit · AbarVa' };
export const dynamic = 'force-dynamic';

/**
 * The Renewal Cockpit — the per-renewal decision surface (Practitioner-Fit
 * §2). The headline is the recommended posture; the sections below are the
 * evidence. Reached mid-stream from Source portfolio actions, pre-loaded.
 */
export default async function RenewalCockpitPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientKey = activeClient?.key ?? 'apexretail';
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';
  const { cockpit, evidenceContext } = await loadRenewalCockpitWithEvidence(
    clientKey,
    decodeURIComponent(contractId),
  );

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: 'Source · Renewal Cockpit',
      }}
      subNav={<SourceSubNav />}
    >
      <SourceWorkingPane>
        {cockpit ? (
          <RenewalCockpitView cockpit={cockpit} evidenceContext={evidenceContext} />
        ) : (
          <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontWeight: 'normal',
                fontSize: 24,
                color: SHELL.INK,
                margin: 0,
              }}
            >
              Contract not found
            </h1>
            <p style={{ fontFamily: SHELL.SANS, fontSize: 14, color: SHELL.INK_SOFT, margin: 0 }}>
              No vendor contract matches this id in the loaded tenant data. The
              Renewal Cockpit only renders for a real contract — it never
              fabricates a renewal.
            </p>
            <Link
              href="/source/preview/workspace"
              style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MID }}
            >
              ← Back to the sourcing book
            </Link>
          </div>
        )}
      </SourceWorkingPane>
    </AppShell>
  );
}
