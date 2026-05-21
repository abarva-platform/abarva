// /home/decision — the function-aware decision home.
//
// The v1 reference surface of the Apple-grade experience spec
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md §4). It is a NEW route — it
// does not touch the shipped /home; it is a reference surface to judge
// against the §3 bar.
//
// For a Meridian Health (healthcare-provider) population-health user it binds
// the Population-Health / Value-Based-Care Domain Function Pack and renders,
// top to bottom, the four §4 blocks: the one thing · decisions that need you ·
// the function's vitals · where you are in the cadence.
//
// Pure server-rendered read — the Function Pack is the frame, Meridian's
// audited substrate fills it, and seed gaps render honestly inline. No kernel
// logic changes here.

import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { DecisionHomeView } from '@/components/home/decision/DecisionHomeView';
import {
  buildMeridianVbcDecisionHome,
  MERIDIAN_TENANT_KEY,
} from '@/lib/programs/expert-kernel/domain/meridian-vbc-decision-home';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata: Metadata = {
  title: 'Decision Home · AbarVa',
};
export const dynamic = 'force-dynamic';

/**
 * The function-aware decision home for a Meridian population-health user.
 *
 * Binds the VBC Function Pack and Meridian's substrate server-side, then hands
 * the assembled four-block data to the pure view. The surface is function-
 * correct from the tenant + the bound pack alone — zero configuration (§3).
 */
export default async function DecisionHomePage() {
  const activeClient = await getActiveClientRow().catch(() => null);

  // The reference surface is bound to the Meridian × Population-Health / VBC
  // tenant-function. The display name resolves from the active client where
  // it is the Meridian tenant; otherwise the canonical Meridian name is used
  // so the reference surface is always judgeable.
  const isMeridian = activeClient?.key === MERIDIAN_TENANT_KEY;
  const tenantName =
    (isMeridian
      ? canonicalClientDisplayName({
          key: activeClient?.key,
          name: activeClient?.name,
        })
      : null) ?? 'Meridian Health';

  const home = buildMeridianVbcDecisionHome(tenantName);

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: 'Decision Home · Population health & VBC',
      }}
      hasTenantKey={Boolean(activeClient?.key)}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          background: '#ffffff',
          padding: '32px 40px',
        }}
      >
        <DecisionHomeView home={home} />
      </div>
    </AppShell>
  );
}
