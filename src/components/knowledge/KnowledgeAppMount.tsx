"use client";

import { useMemo } from "react";

import { createHttpRuntime } from "@/lib/knowledge/consumption-client";
import { KnowledgeAppProvider } from "./knowledge-app-context";
import { KnowledgeShell } from "./shell/KnowledgeShell";

/**
 * Client mount point for the Knowledge UI. Kept separate from the route's
 * page.tsx (a Server Component) because a ConsumptionRuntime is a bundle of
 * async functions -- functions are not serializable across the
 * Server->Client Component boundary, so the runtime must be constructed
 * client-side, not passed down as a prop. Only plain strings cross that
 * boundary here.
 *
 * This mount binds the client UI to the real HTTP consumption provider. The
 * browser can pass only the route-authorized tenant key; every API call still
 * resolves tenancy again server-side from Clerk metadata and refuses shared
 * foundation database fallback. Fixtures are not reachable from this product
 * route.
 */
export function KnowledgeAppMount({
  tenantKey,
}: {
  readonly tenantKey: string;
  /** Baseline is resolved per response by the HTTP provider. */
  readonly knowledgeBaselineRef?: string;
}) {
  const runtime = useMemo(() => createHttpRuntime(tenantKey), [tenantKey]);

  return (
    <KnowledgeAppProvider runtime={runtime} tenantKey={tenantKey}>
      <KnowledgeShell />
    </KnowledgeAppProvider>
  );
}
