"use client";

import { useMemo } from "react";

import { createFixtureRuntime } from "@/lib/knowledge/consumption-client";
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
 * PR B scope note: this mount binds to the FIXTURE runtime
 * (`fixture-airline-demo-new`), not the real HTTP consumption path. The
 * point of PR B is proving the assembler/provider plumbing swap works
 * end-to-end against the real KnowledgeConsumptionProvider *shape* -- the
 * fixture provider is a full, real implementation of that same interface, so
 * this validates the migration completely without reaching production
 * tenant data for airline-demo-new. Activating this route against the real
 * HTTP consumption path (i.e. binding it to `createHttpRuntime` and the
 * server-enforced admin-canary channel other Knowledge routes already use)
 * is explicitly PR C's job, not this one -- see
 * reports/airline-knowledge-provider-reconciliation-2026-07-30/ for why that
 * boundary matters. The `tenantKey` prop below is therefore currently
 * decorative (kept for signature continuity with the route); the runtime
 * always binds to the synthetic fixture namespace.
 */
export function KnowledgeAppMount({
  tenantKey,
}: {
  readonly tenantKey: string;
  /** Retained for route-signature continuity; unused while this mount is
   * fixture-bound (see PR-scope note above). */
  readonly knowledgeBaselineRef?: string;
}) {
  void tenantKey;
  const runtime = useMemo(
    () => createFixtureRuntime("fixture-airline-demo-new", "normal"),
    [],
  );

  return (
    <KnowledgeAppProvider
      runtime={runtime}
      tenantKey="fixture-airline-demo-new"
    >
      <KnowledgeShell />
    </KnowledgeAppProvider>
  );
}
