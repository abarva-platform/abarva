import type { Metadata } from "next";

import { KnowledgeAppMount } from "@/components/knowledge/KnowledgeAppMount";

export const metadata: Metadata = {
  title: "Knowledge | AbarVa",
  description:
    "Governed enterprise context for the airline-demo-new design surface -- Brief, Explore, Relationships, and Evidence & gaps, bound to the real KnowledgeUiViewModelAssembler / ConsumptionRuntime render-gate contract.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The airline-demo-new Knowledge product surface. Every component renders
 * through the real KnowledgeUiViewModelAssembler
 * (src/lib/knowledge/view-model/), composed over the real
 * ConsumptionRuntime/KnowledgeConsumptionProvider
 * (src/lib/knowledge/consumption-client, consumption-contracts) -- see
 * reports/airline-knowledge-provider-reconciliation-2026-07-30/ for the full
 * reconciliation that replaced this route's original duplicate provider
 * binding (GovernedKnowledgeProvider, now removed).
 *
 * This route is currently bound to the FIXTURE runtime
 * (fixture-airline-demo-new), not real tenant data -- see
 * KnowledgeAppMount.tsx's own doc comment for why: proving the assembler
 * plumbing swap against the real provider *shape* is this PR's job; binding
 * this route to the real HTTP consumption path for the airline-demo-new
 * tenant is a separate, explicitly-gated activation step for a later PR.
 *
 * Tenant key is fixed here deliberately: this route is scoped to this one
 * design surface specifically, per the build's own scope. It is NOT read
 * from CANONICAL_TENANT_KEYS or any tenant-switcher, because
 * airline-demo-new is intentionally not registered there yet.
 */
export default function KnowledgePage() {
  return (
    <KnowledgeAppMount
      tenantKey="airline-demo-new"
      knowledgeBaselineRef="unreconciled"
    />
  );
}
