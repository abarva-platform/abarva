// Source · Stage-0 Demand Challenge payload binder
//
// Methodology §3 Stage 0: "Should we even source this?" The artifact is
// a verdict on whether to issue any solicitation, grounded in the
// tenant's existing vendor portfolio + IT landscape + IT financials so
// the buyer cannot ignore that 20–40% of enterprise IT spend is
// shelfware or duplicative.
//
// Strategy:
//   1. If the artifact body has been authored (matching the standard
//      narrative pattern), return it verbatim.
//   2. Otherwise, render a substrate-grounded scaffold that names the
//      tenant's existing coverage candidates by reaching into the
//      knowledge-broker tenant data — vendor_contracts, it_landscape,
//      it_financials. Lines that can't be sourced render "Not recorded
//      — seed gap" so the verdict never invents numbers.
//
// Honest recommendation: the artifact CAN return "do not source" when
// the substrate suggests coverage overlap is high. The scaffold leaves
// the verdict explicit at the top so an expert reviewer cannot miss it.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import { sanitizeArtifactBodyForExport } from '@/lib/source/agent-generation/context-binder';
import type { NarrativeDocxPayload } from '../renderers/narrative-docx';
import {
  buildDemandChallengeBody,
  loadDemandChallengeSubstrate,
} from './lifecycle-substrate';

export async function buildDemandChallengePayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<NarrativeDocxPayload> {
  const authored = ctx.artifactStates.find(
    (a) => a.artifactCode === 'dx0_demand_challenge',
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

  const substrate = await loadDemandChallengeSubstrate(ctx).catch(() => null);
  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    body: buildDemandChallengeBody(ctx, substrate),
    bodyIsAuthored: false,
  };
}
