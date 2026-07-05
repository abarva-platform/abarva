// Source · Stage-1 Sourcing Approach payload binder.
//
// Stage 1 picks the solicitation lane (RFI vs RFP vs RFQ), commercial
// model (fixed / T&M / outcome / consumption), vendor posture (single
// vs multi), and SI delivery lane. Grounded against the same demand
// substrate the Stage-0 challenge uses — and the event's archetype /
// rigor that the buyer set at intake.
//
// Same narrative-payload shape as scope-memo / RFP / decision brief.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import { sanitizeArtifactBodyForExport } from '@/lib/source/agent-generation/context-binder';
import type { NarrativeDocxPayload } from '../renderers/narrative-docx';
import {
  buildSourcingApproachBody,
  loadDemandChallengeSubstrate,
} from './lifecycle-substrate';

export async function buildSourcingApproachPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): Promise<NarrativeDocxPayload> {
  const authored = ctx.artifactStates.find(
    (a) => a.artifactCode === 'dx1_sourcing_approach',
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
    body: buildSourcingApproachBody(ctx, substrate),
    bodyIsAuthored: false,
  };
}
