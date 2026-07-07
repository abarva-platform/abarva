// /intelligence/decision — the function-aware Intelligence surface.
//
// The bet-selection facet of the Apple-grade experience spec
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md §3, §6). It is a NEW route —
// it does not retrofit the existing complex IntelligenceV3Page; it is a clean
// reference surface to judge, exactly as /home/decision was for the home.
//
// It answers one question for the ACTIVE tenant — "which AI bet should we make
// first?" — function-aware from the first second. It resolves the active
// tenant's industry, binds that industry's spine Domain Function Pack, and
// renders, top to bottom, the three §3 blocks: the answer · the ranked bets ·
// what gates the ranking.
//
// The candidate bets ARE the bound Function Pack's Layer 3 AI use-case
// archetypes, ranked by what the function plus any audited tenant substrate
// make most fundable now. Where a bet's feasibility depends on data the tenant
// has not seeded, it renders as an explicit seed gap — never a fabricated bet.
//
// HONESTY (audit 2026-05-22, hardened 2026-06-06): the route must NEVER show
// Meridian's healthcare metrics to another active tenant as its own decision
// surface. It binds the active tenant's own industry pack. If a real active
// tenant has no supported industry/function binding yet, it renders the empty
// onboarding state. The Meridian reference is allowed only when there is no
// active tenant row at all.
//
// Pure server-rendered read — the Function Pack is the frame, audited tenant
// substrate fills it, and seed gaps render honestly. No kernel logic changes.

import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { BetSelectionView } from "@/components/intelligence/decision/BetSelectionView";
import { IntelligenceEmptyState } from "@/components/intelligence/decision/IntelligenceEmptyState";
import {
  buildVbcBetSelection,
  MERIDIAN_FUNCTION_KEY,
  MERIDIAN_INDUSTRY_KEY,
} from "@/lib/programs/expert-kernel/domain/meridian-vbc-bet-selection";
// Side-effect import — registers every catalogued tenant binding (Meridian ×
// VBC, Apex × customer care, First Capital × fraud) with the generic builder
// before this route reads from it. Without this import the generic builder
// would only see the Meridian binding it ships inline.
import "@/lib/programs/expert-kernel/domain/tenant-bindings-bootstrap";
import { industryKeyForCode } from "@/lib/programs/function-identity";
import type { FunctionPackIndustryKey } from "@/lib/programs/expert-kernel/domain/function-pack-types";
import { getActiveClientRow } from "@/lib/active-client";
import {
  firstClientSearchParam,
  resolveIntelligenceDecisionRouteMode,
} from "@/lib/intelligence/decision-route-mode";
import { resolveBetSelectionBinding } from "@/lib/programs/expert-kernel/domain/tenant-binding-registry";

export const metadata: Metadata = {
  title: "Which bet first · Intelligence · AbarVa",
};
export const dynamic = "force-dynamic";

/**
 * The documented per-industry "spine" default function key. The bet-selection
 * surface needs exactly one function to bind for a tenant whose Moves have not
 * (yet) classified a function key; this is the function that best represents
 * "which AI bet first" for the vertical AND the function for which the tenant
 * has audited substrate registered with the binding registry:
 *
 *  - healthcare-provider → `population_health_value_based_care` — the VBC
 *    spine, Meridian × VBC reference binding.
 *  - retail              → `customer_care` — Apex × customer-care binding,
 *    grounded in Apex's KPI dictionary (NICE CXone + Zendesk + the Move P2
 *    Genesys baseline) and the live Contact Center AI Routing Move.
 *  - financial-services  → `fraud_financial_crime` — First Capital × fraud
 *    binding, grounded in First Capital's KPI dictionary (fc-kpi-*), the OCC
 *    MRA-2 findings, and the Fraud Detection Enhancement program baseline.
 *
 * Each key is a catalogued Function Pack (`function-pack-registry.ts`) AND a
 * registered tenant binding (`tenant-bindings-bootstrap.ts`); the spine map
 * and the substrate map agree by construction.
 */
// Intentionally the grounded production spine only — each entry has a seeded,
// audited decision-home binding. A catalogued industry without a seeded
// decision home (e.g. airline) is deliberately absent; the route then renders
// the honest empty state for it. Hence Partial, not a total Record.
const INDUSTRY_SPINE_FUNCTION_KEY: Partial<
  Record<FunctionPackIndustryKey, string>
> = {
  "healthcare-provider": MERIDIAN_FUNCTION_KEY,
  retail: "customer_care",
  "financial-services": "fraud_financial_crime",
};

/**
 * The function-aware Intelligence bet-selection surface for the active tenant.
 *
 * Resolves the active tenant's industry from its `industry_code`, binds that
 * industry's spine Function Pack, and hands the assembled three-block data to
 * the pure view. The surface is function-correct from the tenant + the bound
 * pack alone — zero configuration (§3).
 */
export default async function IntelligenceDecisionPage({
  searchParams,
}: {
  searchParams?: Promise<{ client?: string | string[] }>;
}) {
  const requestedClient = firstClientSearchParam((await searchParams)?.client);
  const activeClient = await getActiveClientRow(requestedClient).catch(
    () => null,
  );

  // Resolve the active tenant's industry from its `industry_code`. This is the
  // audit fix: a retail or financial-services tenant must bind its OWN
  // industry's pack, never Meridian's healthcare pack.
  const industryKey = industryKeyForCode(activeClient?.industry_code);

  // The display name resolves from the active client row (already canonicalised
  // by `getActiveClientRow`).
  const activeTenantName = activeClient?.name?.trim() || null;
  const activeClientKey = activeClient?.key ?? null;

  // P1-1 (synthetic pilot rehearsal, 2026-05-22): a brand-new tenant in a
  // recognised industry (Northwind in retail) resolves an `industryKey` and a
  // spine `functionKey`, and the registry returns the binding registered for
  // that `(industry, function)` pair — but that binding belongs to a
  // DIFFERENT tenant (Apex, Meridian, First Capital). Rendering its substrate
  // labelled with Northwind's name is a cross-tenant content leak.
  //
  // The honest path: when the active tenant is not the binding's
  // `expectedClientKey`, render the empty state instead. The substrate stays
  // bound to its owning tenant; the new tenant gets a real onboarding
  // signpost.
  let bindingExpectedClientKey: string | null = null;
  if (industryKey) {
    const candidateFunctionKey = INDUSTRY_SPINE_FUNCTION_KEY[industryKey];
    const binding = candidateFunctionKey
      ? resolveBetSelectionBinding(industryKey, candidateFunctionKey)
      : null;
    bindingExpectedClientKey = binding?.expectedClientKey ?? null;
  }

  const routeMode = resolveIntelligenceDecisionRouteMode({
    activeClientKey,
    industryKey,
    bindingExpectedClientKey,
  });
  const intelligenceEmptyForTenant = routeMode === "tenant-empty";

  let selection: ReturnType<typeof buildVbcBetSelection> = null;

  if (industryKey && routeMode === "tenant-selection") {
    // The active tenant's industry resolved AND the binding's
    // `expectedClientKey` matches — bind the tenant's own spine Function Pack
    // and render that industry's bet selection. No cross-tenant leak.
    const functionKey = INDUSTRY_SPINE_FUNCTION_KEY[industryKey];
    selection = functionKey
      ? buildVbcBetSelection(
          industryKey,
          functionKey,
          activeTenantName ?? "Your organisation",
        )
      : null;
  } else if (routeMode === "reference-example") {
    // No active tenant row resolved. Fall back to the Meridian reference
    // binding, but mark it honestly as a reference EXAMPLE. A real active
    // tenant with an unknown/unsupported industry renders the empty state
    // instead of seeing another tenant's decision surface.
    const reference = buildVbcBetSelection(
      MERIDIAN_INDUSTRY_KEY,
      MERIDIAN_FUNCTION_KEY,
      "Meridian Health",
    );
    selection = reference
      ? { ...reference, isReferenceExample: true }
      : reference;
  }
  // else: `intelligenceEmptyForTenant === true` — selection stays `null` and
  // the route renders the honest IntelligenceEmptyState below.

  // The chrome's tenant label is the active tenant where one resolved; the
  // reference fallback shows the Meridian reference name honestly.
  const tenantName =
    selection?.tenantName ?? activeTenantName ?? "Your organisation";

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName,
        showLocked: true,
        context: intelligenceEmptyForTenant
          ? `Intelligence · ${tenantName} substrate not yet populated`
          : selection?.isReferenceExample
            ? "Intelligence · Which AI bet to make first (reference example)"
            : "Intelligence · Which AI bet to make first",
      }}
      hasTenantKey={Boolean(activeClient?.key)}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          height: "100%",
          overflowY: "auto",
          background: "#ffffff",
          padding: "32px 40px",
        }}
      >
        {intelligenceEmptyForTenant ? (
          <IntelligenceEmptyState
            tenantName={activeTenantName ?? "this tenant"}
            industryLabel={industryKey}
          />
        ) : (
          <BetSelectionView selection={selection} />
        )}
      </div>
    </AppShell>
  );
}
