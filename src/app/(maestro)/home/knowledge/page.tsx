import type { Metadata } from "next";

import { KnowledgeAppMount } from "@/components/knowledge/KnowledgeAppMount";

export const metadata: Metadata = {
  title: "Knowledge | AbarVa",
  description:
    "Governed enterprise context for the airline-demo-new tenant -- Brief, Explore, Relationships, and Evidence & gaps, bound to the GovernedKnowledgeProvider render-gate contract.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The airline-demo-new Knowledge product surface. This is a UI/UX-layer
 * build only: every component renders through GovernedKnowledgeProvider and
 * its ConsumptionEnvelope render-gate contract (src/lib/knowledge/providers/).
 * airline-demo-new has zero reconciled consumption projections today (see
 * reports/airline-knowledge-ui-binding-2026-07-29/KNOWLEDGE_UI_IMPLEMENTATION_PLAN.md),
 * so every section currently renders its safe empty/blocked/withheld state --
 * that is the correct, honest behavior for this build, not a bug.
 *
 * Tenant key is fixed to airline-demo-new here deliberately: this route is
 * scoped to that tenant specifically, per the build's own scope. It is NOT
 * read from CANONICAL_TENANT_KEYS or any tenant-switcher, because
 * airline-demo-new is intentionally not registered there yet (confirmed in
 * design-harness-provider.ts's RESERVED_IN_FLIGHT_TENANT_KEYS).
 */
export default function KnowledgePage() {
  return (
    <KnowledgeAppMount
      tenantKey="airline-demo-new"
      knowledgeBaselineRef="unreconciled"
    />
  );
}
