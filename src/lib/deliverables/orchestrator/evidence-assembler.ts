// Assemble governed evidence for the orchestrator from the tenant context index.
//
// Pulls governed context chunks for a tenant (Azure AI Search, BM25), maps them to the
// orchestrator's clean evidence shape, and runs them through buildSourceRegister so
// citation numbers are assigned and internal_only evidence is excluded for vendor-facing
// audiences. The retriever is injectable so the mapping is unit-tested without Azure.

import 'server-only';

import {
  queryTenantContext as defaultQueryTenantContext,
  type TenantContextChunk,
} from '@/lib/azure-search/tenant-context-retriever';
import { buildSourceRegister, type GovernedCandidateLike } from './source-register';
import type { GovernedEvidenceItem, SourceRegisterEntry } from './types';

export interface AssembleEvidenceParams {
  tenantClientKey: string;
  query: string;
  topK?: number;
  audienceIsVendorFacing?: boolean;
  minConfidence?: number;
}

export interface AssembledEvidence {
  evidence: GovernedEvidenceItem[];
  sourceRegister: SourceRegisterEntry[];
  retrievedCount: number;
}

type QueryFn = typeof defaultQueryTenantContext;

function chunkToCandidate(chunk: TenantContextChunk): GovernedCandidateLike {
  const score = chunk.vectorScore ?? 0;
  const confidence: GovernedCandidateLike['confidence'] = score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low';
  const disclosureTier: GovernedCandidateLike['disclosureTier'] =
    chunk.classification === 'confidential' || chunk.classification === 'restricted' ? 'internal_only' : 'vendor_facing';
  return {
    label: chunk.sourceDoc ?? chunk.sourceSegmentId ?? 'Tenant context',
    statement: chunk.text,
    evidenceFamily: chunk.sourceBasis ?? chunk.sourceSegmentId ?? 'enterprise_context',
    confidence,
    disclosureTier,
    provenanceRef: chunk.chunkId,
  };
}

export async function assembleGovernedEvidence(
  params: AssembleEvidenceParams,
  deps: { queryTenantContext?: QueryFn } = {},
): Promise<AssembledEvidence> {
  const query = deps.queryTenantContext ?? defaultQueryTenantContext;
  const chunks = await query({
    tenantClientKey: params.tenantClientKey,
    query: params.query,
    topK: params.topK ?? 12,
    filters: {
      minConfidence: params.minConfidence ?? 0.5,
      // vendor-facing generation should never even retrieve restricted/confidential
      sensitivity: params.audienceIsVendorFacing ? ['public', 'internal'] : ['public', 'internal', 'confidential'],
    },
  });
  const candidates = chunks.map(chunkToCandidate);
  const { evidence, register } = buildSourceRegister(candidates, {
    audienceIsVendorFacing: params.audienceIsVendorFacing,
  });
  return { evidence, sourceRegister: register, retrievedCount: chunks.length };
}
