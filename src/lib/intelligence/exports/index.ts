// Intelligence · CXO brief exports · public surface
//
// Server-only entry point for the Intelligence brief export. Loads the
// real per-tenant data (corpus brief for Apex, ai_initiatives portfolio
// for all 3 tenants), assembles the brief payload, and exposes the
// DOCX / PDF renderers.
//
// Grounding: see brief-payload.ts — Apex carries corpus content;
// Meridian / First Capital export only ai_initiatives content plus an
// honest "corpus not yet seeded" disclosure. No fabrication.

import 'server-only';

import type { Document as DocxDocument } from 'docx';

import { getActiveClientRow } from '@/lib/active-client';
import { buildIntelligenceV3PageData } from '@/lib/intelligence-v3/page-data';
import {
  loadApexRetailIntelligenceData,
  loadApexRetailIntelligenceDataForDemo,
} from '@/lib/intelligence-v3/apex-retail-live';
import {
  buildIntelligenceBriefPayload,
  type IntelligenceBriefPayload,
} from './brief-payload';
import { buildIntelligenceBriefDocx } from './renderers/brief-docx';
import { buildIntelligenceBriefPdf } from './renderers/brief-pdf';

export { DOCX_CONTENT_TYPE } from '@/lib/exports-shared/docx-base';
export { PDF_CONTENT_TYPE } from '@/lib/exports-shared/pdf-base';
export { CORPUS_NOT_SEEDED_MARKER } from './brief-payload';
export type { IntelligenceBriefPayload } from './brief-payload';
export { buildIntelligenceBriefPayload } from './brief-payload';
export { buildIntelligenceBriefDocx } from './renderers/brief-docx';
export { buildIntelligenceBriefPdf } from './renderers/brief-pdf';

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
  const forceApexRetail = resolvedClientKey === 'apexretail';

  const [{ data: pageData }, apexRetailData] = await Promise.all([
    buildIntelligenceV3PageData(resolvedClientKey),
    (forceApexRetail
      ? loadApexRetailIntelligenceDataForDemo()
      : loadApexRetailIntelligenceData(client)
    ).catch(() => null),
  ]);

  return buildIntelligenceBriefPayload({
    tenantName: pageData.tenantName,
    briefData: apexRetailData?.briefData ?? null,
    pageData,
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
