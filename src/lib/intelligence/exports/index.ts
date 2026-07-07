// Intelligence · CXO brief exports · public surface
//
// Server-only entry point for the Intelligence brief export. Loads the
// real per-tenant data (tenant corpus brief when seeded, ai_initiatives portfolio
// for all 3 tenants), assembles the brief payload, and exposes the
// DOCX / PDF renderers.
//
// Grounding: see brief-payload.ts. Corpus sections render only when a
// tenant-specific corpus payload is bound. No fabrication.

import "server-only";

import type { Document as DocxDocument } from "docx";

import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  buildIntelligenceBriefPayload,
  type IntelligenceBriefPayload,
} from "./brief-payload";
import { buildIntelligenceBriefDocx } from "./renderers/brief-docx";
import { buildIntelligenceBriefPdf } from "./renderers/brief-pdf";

export { DOCX_CONTENT_TYPE } from "@/lib/exports-shared/docx-base";
export { PDF_CONTENT_TYPE } from "@/lib/exports-shared/pdf-base";
export { CORPUS_NOT_SEEDED_MARKER } from "./brief-payload";
export type { IntelligenceBriefPayload } from "./brief-payload";
export { buildIntelligenceBriefPayload } from "./brief-payload";
export { buildIntelligenceBriefDocx } from "./renderers/brief-docx";
export { buildIntelligenceBriefPdf } from "./renderers/brief-pdf";

/**
 * Load real per-tenant data and assemble the Intelligence brief payload
 * for the currently active tenant (resolved server-side).
 *
 * `requestedClientKey` mirrors the `?client=` param the Intelligence
 * page accepts so a deep-linked export targets the right tenant.
 */
export async function buildIntelligenceBriefPayloadForActiveTenant(
  requestedClientKey: string | null,
  generatedAt: string = new Date().toISOString(),
): Promise<IntelligenceBriefPayload> {
  const client = await getActiveClientRow(requestedClientKey).catch(() => null);
  const resolvedClientKey = client?.key ?? requestedClientKey;
  const tenantName =
    (resolvedClientKey
      ? canonicalClientDisplayName({ key: resolvedClientKey })
      : null) ??
    client?.name ??
    resolvedClientKey ??
    "Unknown Tenant";

  // The v3 ai_initiatives page-data builder was removed with the legacy
  // Intelligence surface. The brief export now produces a "corpus not seeded"
  // payload using only the canonical tenant name. A full replacement wired
  // to the advisory data model can be added when needed.
  return buildIntelligenceBriefPayload({
    tenantName,
    briefData: null,
    pageData: {
      tenantName,
      industry: "Cross-industry",
      stats: { patterns: 0, contradictions: 0, syntheses: 0 },
      aiTrajectory: { headline: "", body: "" },
      pressureCards: [],
      artOfThePossible: [],
      whatWeCantSee: [],
    },
    generatedAt,
  });
}

/** Render the brief payload as a docx Document. */
export function renderIntelligenceBriefDocx(
  payload: IntelligenceBriefPayload,
): DocxDocument {
  return buildIntelligenceBriefDocx(payload);
}

/** Render the brief payload as a PDF React element. */
export function renderIntelligenceBriefPdf(
  payload: IntelligenceBriefPayload,
  options: { degraded?: boolean } = {},
) {
  return buildIntelligenceBriefPdf(payload, options);
}
