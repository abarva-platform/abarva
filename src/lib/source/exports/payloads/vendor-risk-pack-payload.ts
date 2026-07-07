// Source · Stage-6 Vendor Risk Pack payload binder.
//
// Risk lens applied before contract signature: security, financial
// viability, concentration risk (buyer side), fourth-party / sub-
// processor risk, MRM screen for AI-bearing vendors. Grounded against
// vendor_contracts (for concentration) and compliance (for the
// security checklist). Narrative shape so the same renderer set
// (narrative-docx + narrative-pdf) handles it.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import { sanitizeArtifactBodyForExport } from '@/lib/source/agent-generation/context-binder';
import type { NarrativeDocxPayload } from '../renderers/narrative-docx';
import {
  buildVendorRiskBody,
  loadVendorRiskSubstrate,
} from './lifecycle-substrate';

export async function buildVendorRiskPackPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<NarrativeDocxPayload> {
  const authored = ctx.artifactStates.find(
    (a) => a.artifactCode === 'dx6b_vendor_risk_pack',
  );
  if (authored?.body && authored.body.trim().length > 0) {
    return {
      tenantName: ctx.tenantName,
      eventCode: ctx.event.code,
      eventName: ctx.event.name,
      issuedBy: ctx.event.owner ?? undefined,
      generatedAt,
      body: sanitizeArtifactBodyForExport(authored.body),
      bodyIsAuthored: true,
    };
  }
  const substrate = await loadVendorRiskSubstrate(ctx).catch(() => null);
  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    body: buildVendorRiskBody(ctx, substrate),
    bodyIsAuthored: false,
  };
}
