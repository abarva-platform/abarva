// Generate-deliverable service — the in-product entry point.
//
// Ties together: governed-evidence assembly → request build → audited multi-pass
// generation → quality gate → persistence. The route is a thin wrapper over this.
// Heavy collaborators are injectable so the service is testable without Azure/Claude/DB.

import 'server-only';

import { loadTenantAiPolicyRecord as defaultLoadPolicy } from '@/lib/integrations/ai-egress/tenant-policy';
import { assembleGovernedEvidence } from './evidence-assembler';
import { buildDeliverableRequest, type BuildRequestParams } from './build-request';
import { generateDeliverable as defaultGenerate } from './model-caller';
import { persistDeliverable as defaultPersist } from './persistence';
import type { OutputFormat } from './types';

export interface GenerateDeliverableServiceInput extends Omit<BuildRequestParams, 'outputFormats'> {
  tenantClientKey: string;
  clientId: string;
  userId: string;
  /** the move / source-event id this deliverable is generated for. */
  sourceArtifactRef: string;
  /** semantic query used to retrieve governed evidence. */
  evidenceQuery?: string;
  outputFormats?: OutputFormat[];
  model?: string;
}

export interface GenerateDeliverableServiceResult {
  ok: boolean;
  artifactId?: string;
  blobUrl?: string;
  qualityPass?: boolean;
  blockers?: string[];
  warnings?: string[];
  sectionCount?: number;
  retrievedEvidence?: number;
  blockedReason?: string;
}

export interface GenerateServiceDeps {
  assemble?: typeof assembleGovernedEvidence;
  loadPolicy?: typeof defaultLoadPolicy;
  generate?: typeof defaultGenerate;
  persist?: typeof defaultPersist;
}

export async function runDeliverableForTenant(
  input: GenerateDeliverableServiceInput,
  deps: GenerateServiceDeps = {},
): Promise<GenerateDeliverableServiceResult> {
  const assemble = deps.assemble ?? assembleGovernedEvidence;
  const loadPolicy = deps.loadPolicy ?? defaultLoadPolicy;
  const generate = deps.generate ?? defaultGenerate;
  const persist = deps.persist ?? defaultPersist;

  const audienceIsVendorFacing = input.audience?.includes('vendor_facing') ?? false;

  // 1 · governed evidence (clean, citation-numbered, vendor-facing exclusion applied)
  const { evidence, sourceRegister, retrievedCount } = await assemble({
    tenantClientKey: input.tenantClientKey,
    query: input.evidenceQuery ?? `${input.deliverableType} ${input.useCaseArchetype} current state baseline`,
    audienceIsVendorFacing,
  });

  // 2 · orchestrator request
  const req = buildDeliverableRequest(
    {
      module: input.module,
      useCaseArchetype: input.useCaseArchetype,
      deliverableType: input.deliverableType,
      audience: input.audience,
      decisionContext: input.decisionContext,
      clientDisplayName: input.clientDisplayName,
      initiativeDisplayName: input.initiativeDisplayName,
      outputFormats: input.outputFormats,
    },
    evidence,
    sourceRegister,
  );

  // 3 · multi-pass generation through the audited egress (plan gate + quality gate inside)
  const result = await generate(req, {
    // Egress identity must be the client UUID: the audit sink writes tenant_id (uuid),
    // and policy resolution falls back to the raw string when a non-canonical client
    // key (e.g. 'skyharbor' vs tenant_key 'skyharbor-air') doesn't match — which then
    // fails the uuid insert ("invalid input syntax for type uuid"). Class bug, found
    // live by clicking the Generate button (2026-06-11).
    tenantId: input.clientId,
    userId: input.userId,
    ...(input.model ? { model: input.model } : {}),
  });

  if (!result.ok || !result.document) {
    return {
      ok: false,
      qualityPass: result.quality?.pass ?? false,
      blockers: result.quality?.blockers ?? [],
      blockedReason: result.blockedReason,
      sectionCount: result.document?.generatedSections.length,
      retrievedEvidence: retrievedCount,
    };
  }

  // 4 · persist through the governed artifacts repository. The persisted artifact
  // format is the document format (docx); 'xlsx' is a companion exhibit, not the
  // artifact's primary format, so it never becomes the persisted outputFormat.
  const first = input.outputFormats?.[0];
  const persistFormat: 'docx' | 'pptx' | 'pdf' | 'html' =
    first === 'pptx' || first === 'pdf' || first === 'html' ? first : 'docx';
  const { policy } = await loadPolicy(input.clientId);
  const record = await persist(result, {
    clientId: input.clientId,
    renderedBy: input.userId,
    sourceArtifactRef: input.sourceArtifactRef,
    tenantPolicy: policy,
    outputFormat: persistFormat,
    userId: input.userId,
    evidenceLedgerIds: evidence.map((e) => e.provenanceRef),
  });

  return {
    ok: true,
    artifactId: record.id,
    blobUrl: record.blobUrl,
    qualityPass: true,
    warnings: result.quality?.warnings ?? [],
    sectionCount: result.document.generatedSections.length,
    retrievedEvidence: retrievedCount,
  };
}
