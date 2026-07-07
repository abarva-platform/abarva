import { NextResponse } from "next/server";

import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import type { TenancyCtx } from "@/lib/programs/types.db";

export function isContextCorpusExplorerEnabled(tenancy: TenancyCtx): boolean {
  return isFeatureEnabled(
    { clientId: tenancy.clientId, clientKey: tenancy.clientKey },
    "context_corpus_explorer_enabled",
  );
}

export function contextCorpusExplorerDisabledResponse(): NextResponse {
  return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
}
