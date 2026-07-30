import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { KnowledgeAppMount } from "@/components/knowledge/KnowledgeAppMount";
import { resolveFoundationPreviewTenantKeyForSession } from "@/lib/auth/foundation-preview-session";
import { FOUNDATION_HOME_KNOWLEDGE_ROUTE } from "@/lib/auth/foundation-route-access";

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
 * This product route is activated only for the approved Airline Foundation
 * proof user. Tenant identity is resolved on the server from Clerk metadata
 * and must match the route-specific allowedRoutes/moduleAccess gate. The
 * browser can no longer switch tenants or select fixtures.
 */
export default async function KnowledgePage() {
  await connection();
  const tenantKey = await resolveFoundationPreviewTenantKeyForSession({
    pathname: FOUNDATION_HOME_KNOWLEDGE_ROUTE,
  });

  if (tenantKey !== "airline-demo-new") {
    notFound();
  }

  return (
    <KnowledgeAppMount
      tenantKey={tenantKey}
      knowledgeBaselineRef="resolved-per-response"
    />
  );
}
