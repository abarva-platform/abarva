// /strategic-moves/living — the living Move.
//
// The §6 reference surface of the Apple-grade experience spec
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md): "the model alive under
// your finger". The function-aware decision home (§4) proved that AbarVa can
// open already understanding the user and lead with the answer. This surface
// proves Move 3 — direct manipulation of the decision.
//
// It renders a tenant's Costed Business-Case Pack as a LIVE, manipulable
// surface. The board-grade pack is the static render of the same case; the
// living Move is its interactive form. A CXO touches the highest-leverage
// assumptions and the Expert Kernel recompiles the case — verdict, investment,
// net value, payback and the board-grade exhibits all move, instantly.
//
// The kernel is anchored on three real tenant cases — Apex Retail, Meridian
// Health System, First Capital Financial. A `?case=` searchParam (defaulting
// to Apex) selects which grounded case the living Move opens on, resolved
// through the `living-move-cases` registry — exactly as the Expert Review
// Console resolves a review case. The in-surface switcher lets a reviewer move
// between the three without leaving the page.
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
import {
  resolveLivingMoveCase,
  isLivingMoveCaseId,
  DEFAULT_LIVING_MOVE_CASE_ID,
} from '@/lib/programs/expert-kernel/living-move-cases';

export const metadata: Metadata = {
  title: 'The Living Move · AbarVa',
};
export const dynamic = 'force-dynamic';

/**
 * The living Move — the interactive costed business case for one of the three
 * kernel-anchored tenant cases.
 *
 * The `?case=` searchParam selects the case (defaults to Apex). The display
 * name resolves from the active client where it matches the resolved case's
 * tenant; otherwise the case's own tenant label is used so the reference
 * surface is always judgeable.
 */
export default async function LivingMovePage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string }>;
}) {
  const { case: caseParam } = await searchParams;
  // The typed case id — an unknown / absent selector falls back to Apex.
  const caseId = isLivingMoveCaseId(caseParam)
    ? caseParam
    : DEFAULT_LIVING_MOVE_CASE_ID;
  const caseEntry = resolveLivingMoveCase(caseId);

  const activeClient = await getActiveClientRow().catch(() => null);

  // Resolve the tenant display name. The app ClientKey may carry a dashed or
  // un-dashed alias; match the resolved case's tenant against either form so
  // the canonical name resolves whichever the active client carries. The
  // case's own tenant label is the always-correct fallback.
  const dashed = caseId === 'apexretail' ? 'apex-retail' : caseId;
  const undashed = caseId === 'apexretail' ? 'apexretail' : caseId;
  const isActiveTenant =
    activeClient?.key === dashed || activeClient?.key === undashed;
  const tenantName =
    (isActiveTenant
      ? canonicalClientDisplayName({
          key: activeClient?.key,
          name: activeClient?.name,
        })
      : null) ?? caseEntry.tenantLabel;

  return (
    <AppShell
      surface="programs"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `The Living Move · ${caseEntry.moveLabel}`,
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
        <LivingMoveView caseId={caseId} />
      </div>
    </AppShell>
  );
}
