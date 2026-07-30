"use client";

import { useMemo } from "react";

import { createUnreconciledGovernedKnowledgeProvider } from "@/lib/knowledge/providers/governed-knowledge-provider";
import { KnowledgeAppProvider } from "./knowledge-app-context";
import { KnowledgeShell } from "./shell/KnowledgeShell";

/**
 * Client mount point for the Knowledge UI. Kept separate from the route's
 * page.tsx (a Server Component) because a GovernedKnowledgeProvider is a
 * bundle of async functions -- functions are not serializable across the
 * Server->Client Component boundary, so the provider must be constructed
 * client-side, not passed down as a prop. Only plain strings cross that
 * boundary here.
 *
 * This mount ALWAYS uses createUnreconciledGovernedKnowledgeProvider --
 * never the design-harness (illustrative) provider. That is not a
 * placeholder choice to swap later; per feedback_governed_ui_provider_render_gate
 * and design-harness-provider.ts's own assertDesignHarnessAllowed guard,
 * airline-demo-new must never reach illustrative data from a production
 * route, in any environment.
 */
export function KnowledgeAppMount({
  tenantKey,
  knowledgeBaselineRef,
}: {
  readonly tenantKey: string;
  readonly knowledgeBaselineRef: string;
}) {
  const provider = useMemo(
    () => createUnreconciledGovernedKnowledgeProvider(),
    [],
  );
  const providerCtx = useMemo(
    () => ({ tenantKey, knowledgeBaselineRef }),
    [tenantKey, knowledgeBaselineRef],
  );

  return (
    <KnowledgeAppProvider provider={provider} providerCtx={providerCtx}>
      <KnowledgeShell />
    </KnowledgeAppProvider>
  );
}
