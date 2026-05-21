// /intelligence/decision — the function-aware Intelligence surface.
//
// The bet-selection facet of the Apple-grade experience spec
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md §3, §6). It is a NEW route —
// it does not retrofit the existing complex IntelligenceV3Page; it is a clean
// reference surface to judge, exactly as /home/decision was for the home.
//
// For a Meridian Health population-health user it answers one question —
// "which value-based-care AI bet should we make first?" — function-aware from
// the first second. It binds the Population-Health / Value-Based-Care Domain
// Function Pack and renders, top to bottom, the three §3 blocks: the answer ·
// the ranked bets · what gates the ranking.
//
// The candidate bets ARE the Function Pack's Layer 3 AI use-case archetypes,
// ranked by what the function plus Meridian's audited substrate make most
// fundable now. Where a bet's feasibility depends on data Meridian has not
// seeded, it renders as an explicit seed gap — never a fabricated bet.
//
// Pure server-rendered read — the Function Pack is the frame, Meridian's
// audited substrate fills it, and seed gaps render honestly. No kernel logic
// changes here.

import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { BetSelectionView } from '@/components/intelligence/decision/BetSelectionView';
import {
  buildMeridianVbcBetSelection,
  MERIDIAN_TENANT_KEY,
} from '@/lib/programs/expert-kernel/domain/meridian-vbc-bet-selection';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const metadata: Metadata = {
  title: 'Which bet first · Intelligence · AbarVa',
};
export const dynamic = 'force-dynamic';

/**
 * The function-aware Intelligence bet-selection surface for a Meridian
 * population-health user.
 *
 * Binds the VBC Function Pack and Meridian's substrate server-side, then hands
 * the assembled three-block data to the pure view. The surface is function-
 * correct from the tenant + the bound pack alone — zero configuration (§3).
 */
export default async function IntelligenceDecisionPage() {
  const activeClient = await getActiveClientRow().catch(() => null);

  // The reference surface is bound to the Meridian × Population-Health / VBC
  // tenant-function. The display name resolves from the active client where it
  // is the Meridian tenant; otherwise the canonical Meridian name is used so
  // the reference surface is always judgeable.
  const isMeridian = activeClient?.key === MERIDIAN_TENANT_KEY;
  const tenantName =
    (isMeridian
      ? canonicalClientDisplayName({
          key: activeClient?.key,
          name: activeClient?.name,
        })
      : null) ?? 'Meridian Health';

  const selection = buildMeridianVbcBetSelection(tenantName);

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: 'Intelligence · Which VBC AI bet to make first',
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
        <BetSelectionView selection={selection} />
      </div>
    </AppShell>
  );
}
