// /strategic-moves/living — the living Move.
//
// The §6 reference surface of the Apple-grade experience spec
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md): "the model alive under
// your finger". The function-aware decision home (§4) proved that AbarVa can
// open already understanding the user and lead with the answer. This surface
// proves Move 3 — direct manipulation of the decision.
//
// It renders the Apex "Contact Center AI Routing" Costed Business-Case Pack
// as a LIVE, manipulable surface. The board-grade pack is the static render
// of this same case; the living Move is its interactive form. A CXO touches
// the highest-leverage assumptions and the Expert Kernel recompiles the case
// — verdict, investment, net value, payback and the board-grade exhibits all
// move, instantly.
//
// The recompute runs entirely client-side (see `LivingMoveView`): every
// module on the kernel compile path is pure TypeScript with no `server-only`
// import, so the real kernel runs in the browser for true instant feedback —
// no server round-trip. This page is a thin server shell that mounts the
// client surface inside the AppShell.

import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { LivingMoveView } from '@/components/moves/living/LivingMoveView';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { APEX_CONTACT_CENTER_TENANT_KEY } from '@/lib/programs/expert-kernel/apex-contact-center-case';

export const metadata: Metadata = {
  title: 'The Living Move · AbarVa',
};
export const dynamic = 'force-dynamic';

/**
 * The living Move — the interactive Apex Contact Center costed business case.
 *
 * The case is bound to the Apex Retail tenant. The display name resolves from
 * the active client where it is the Apex tenant; otherwise the canonical Apex
 * name is used so the reference surface is always judgeable.
 */
export default async function LivingMovePage() {
  const activeClient = await getActiveClientRow().catch(() => null);

  // The living Move is bound to the Apex × Contact Center AI Routing case.
  // The app ClientKey is `apexretail` (no dash); the kernel tenant key is
  // `apex-retail`. Match on either so the canonical name resolves whichever
  // form the active client carries.
  const isApex =
    activeClient?.key === APEX_CONTACT_CENTER_TENANT_KEY ||
    activeClient?.key === 'apexretail';
  const tenantName =
    (isApex
      ? canonicalClientDisplayName({
          key: activeClient?.key,
          name: activeClient?.name,
        })
      : null) ?? 'Apex Retail';

  return (
    <AppShell
      surface="programs"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: 'The Living Move · Contact Center AI Routing',
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
        <LivingMoveView />
      </div>
    </AppShell>
  );
}
