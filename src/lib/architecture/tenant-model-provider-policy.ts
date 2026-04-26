// MG4 - Tenant Model Provider Policy Matrix.
//
// Pure deterministic, file-pure read model that names the per-tenant
// approved / blocked / deferred / requires_review decisions for every
// canonical model provider kind, together with the policy basis that
// produced each decision (data classification, tenant admin decision,
// security review, governance review, cost constraint).
//
// MG4 is a *shape* contract. The live model gateway runtime is still
// deferred (see MG2 stub and MG3 integration contract). This module
// describes what the live gateway must consult when a tenant request
// proposes to invoke a particular provider for a particular purpose.
// The matrix is consumed by the future runtime tool dispatcher and
// the live Model Gateway; nothing in this module dispatches a call
// or imports a provider SDK.
//
// Hard rules (also asserted by the test):
//   - No live model invocation. No provider SDK import (no
//     `openai`, no `anthropic`, no `@anthropic-ai/sdk`,
//     no `@openai/sdk`).
//   - No `Date.now`, `Math.random`, `new Date(`, `fetch(`.
//   - No imports from `@/lib/auth/**`, `@/lib/source/**`,
//     `@/lib/sentinel/**`, `@/lib/atlas/**`, `@/lib/nexus/**`,
//     `@/lib/agent/**`, or any supabase client.
//   - No `useState` / `useEffect`. No `Coming soon` / `TBD` /
//     `Lorem ipsum` placeholder copy.
//   - Generic provider placeholders only: `provider_alpha`,
//     `provider_beta`, `provider_gamma`, `on_prem_open_weight`,
//     `azure_oai`, `vertex_ai`, `bedrock`. No real model id.
//
// Every entry carries `createdFrom:
// 'deterministic_tenant_model_provider_policy_seed'` so a static
// scan can confirm the matrix is seed data, never a live readout.

// ---------------------------------------------------------------------
// Canonical vocabularies
// ---------------------------------------------------------------------

// Generic placeholders only. The live gateway translates a canonical
// kind into a provider model id inside the gateway boundary; this
// module never names a real model.
export const MODEL_PROVIDER_KINDS = [
  'provider_alpha',
  'provider_beta',
  'provider_gamma',
  'on_prem_open_weight',
  'azure_oai',
  'vertex_ai',
  'bedrock',
] as const;
export type ModelProviderKind = (typeof MODEL_PROVIDER_KINDS)[number];

export const TENANT_MODEL_POLICY_DECISIONS = [
  'approved',
  'blocked',
  'deferred',
  'requires_review',
] as const;
export type TenantModelPolicyDecision =
  (typeof TENANT_MODEL_POLICY_DECISIONS)[number];

export const TENANT_MODEL_POLICY_BASES = [
  'data_classification',
  'tenant_admin_decision',
  'security_review',
  'governance_review',
  'cost_constraint',
] as const;
export type TenantModelPolicyBasis =
  (typeof TENANT_MODEL_POLICY_BASES)[number];

export const TENANT_MODEL_POLICY_PURPOSES = [
  'recommendation',
  'synthesis',
  'classification',
  'extraction',
  'evidence_check',
  'audit',
  'evaluation',
] as const;
export type TenantModelPolicyPurpose =
  (typeof TENANT_MODEL_POLICY_PURPOSES)[number];

// ---------------------------------------------------------------------
// Policy entry shape
// ---------------------------------------------------------------------

export interface TenantModelPolicyEntry {
  /** Stable id; format `tmpp-{tenantKey}-{provider}`. */
  id: string;
  /** Tenant scope. Empty tenantKey is rejected by the evaluator. */
  tenantKey: string;
  /** Provider kind under decision. */
  provider: ModelProviderKind;
  /** Decision for this (tenant, provider) pair. */
  decision: TenantModelPolicyDecision;
  /**
   * One or more bases for the decision. Approved decisions require
   * at least one basis; blocked / deferred / requires_review entries
   * also name the basis that produced the decision.
   */
  basis: readonly TenantModelPolicyBasis[];
  /** Canonical purposes this policy entry covers. */
  purposes: readonly TenantModelPolicyPurpose[];
  /** Honest rationale (no marketing language). */
  rationale: string;
  /**
   * If decision !== 'approved', names the next reviewer / step the
   * tenant admin or governance lead must complete to revisit the
   * decision. Approved entries carry an empty string.
   */
  nextReviewStep: string;
  /** Stable provenance flag. */
  createdFrom: 'deterministic_tenant_model_provider_policy_seed';
}

export interface TenantModelPolicyMatrixSummary {
  totalTenants: number;
  totalProviders: number;
  totalEntries: number;
  byDecision: Record<TenantModelPolicyDecision, number>;
  byBasis: Record<TenantModelPolicyBasis, number>;
  byProvider: Record<ModelProviderKind, number>;
  uniqueTenants: readonly string[];
  approvedCount: number;
  blockedCount: number;
  deferredCount: number;
  requiresReviewCount: number;
}

export interface TenantModelAccessEvaluation {
  tenantKey: string;
  provider: ModelProviderKind;
  purpose: TenantModelPolicyPurpose;
  decision: TenantModelPolicyDecision;
  basis: readonly TenantModelPolicyBasis[];
  rationale: string;
  matchedEntryId: string | null;
}

// ---------------------------------------------------------------------
// Canonical tenants seeded in the matrix
// ---------------------------------------------------------------------

const TENANT_KEYS = [
  'apexretail',
  'meridianhealth',
  'arcturuslogistics',
] as const;

// ---------------------------------------------------------------------
// Seed entries (dense - 3 tenants x 7 providers = 21 entries).
// ---------------------------------------------------------------------

const SEED_ENTRIES: readonly TenantModelPolicyEntry[] = [
  // ---------------- apexretail (retail) ----------------
  {
    id: 'tmpp-apexretail-provider_alpha',
    tenantKey: 'apexretail',
    provider: 'provider_alpha',
    decision: 'approved',
    basis: ['tenant_admin_decision', 'security_review'],
    purposes: ['recommendation', 'synthesis', 'extraction', 'evidence_check'],
    rationale:
      'Tenant admin approved provider_alpha for recommendation and ' +
      'synthesis after security review of vendor data handling and ' +
      'tenant-scoped retention.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-apexretail-provider_beta',
    tenantKey: 'apexretail',
    provider: 'provider_beta',
    decision: 'approved',
    basis: ['tenant_admin_decision'],
    purposes: ['classification', 'extraction', 'audit'],
    rationale:
      'Tenant admin approved provider_beta for closed-vocabulary ' +
      'classification and extraction; cheap-tier balanced choice.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-apexretail-provider_gamma',
    tenantKey: 'apexretail',
    provider: 'provider_gamma',
    decision: 'requires_review',
    basis: ['security_review'],
    purposes: ['recommendation', 'synthesis'],
    rationale:
      'Provider_gamma data residency posture not yet reviewed for ' +
      'apexretail tenant; pending security review before approval.',
    nextReviewStep:
      'Security lead to review provider_gamma residency and sub-processor list.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-apexretail-on_prem_open_weight',
    tenantKey: 'apexretail',
    provider: 'on_prem_open_weight',
    decision: 'approved',
    basis: ['data_classification', 'tenant_admin_decision'],
    purposes: ['evaluation', 'classification', 'extraction'],
    rationale:
      'On-prem open-weight model approved for evaluation runs and ' +
      'L4-sensitive classification that must never leave tenant scope.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-apexretail-azure_oai',
    tenantKey: 'apexretail',
    provider: 'azure_oai',
    decision: 'deferred',
    basis: ['cost_constraint'],
    purposes: ['recommendation', 'synthesis'],
    rationale:
      'Azure OAI per-call cost exceeds apexretail per-tenant daily ' +
      'cap; deferred until cost envelope is renegotiated.',
    nextReviewStep:
      'Tenant admin to renegotiate per-tenant daily budget cap or wait for tier price drop.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-apexretail-vertex_ai',
    tenantKey: 'apexretail',
    provider: 'vertex_ai',
    decision: 'requires_review',
    basis: ['governance_review'],
    purposes: ['classification', 'extraction'],
    rationale:
      'Governance lead must confirm vertex_ai contractual terms ' +
      'before apexretail data is allowed off-platform.',
    nextReviewStep:
      'Governance lead to record contractual review and sign-off in audit ledger.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-apexretail-bedrock',
    tenantKey: 'apexretail',
    provider: 'bedrock',
    decision: 'blocked',
    basis: ['data_classification', 'security_review'],
    purposes: ['recommendation', 'synthesis', 'evidence_check'],
    rationale:
      'Bedrock blocked for apexretail until L4 PII handling is ' +
      'reviewed; security review concluded current contract does not ' +
      'meet tenant data classification policy.',
    nextReviewStep:
      'Security lead to schedule full vendor review and update data classification mapping.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },

  // ---------------- meridianhealth (healthcare) ----------------
  {
    id: 'tmpp-meridianhealth-provider_alpha',
    tenantKey: 'meridianhealth',
    provider: 'provider_alpha',
    decision: 'requires_review',
    basis: ['governance_review', 'security_review'],
    purposes: ['recommendation', 'synthesis'],
    rationale:
      'Healthcare tenant; provider_alpha BAA and PHI handling require ' +
      'governance and security review before any approval.',
    nextReviewStep:
      'Governance lead and security lead to jointly review BAA, PHI handling, and audit export.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-meridianhealth-provider_beta',
    tenantKey: 'meridianhealth',
    provider: 'provider_beta',
    decision: 'blocked',
    basis: ['data_classification'],
    purposes: ['classification', 'extraction'],
    rationale:
      'Provider_beta lacks PHI-grade data classification commitments; ' +
      'blocked for meridianhealth tenant data.',
    nextReviewStep:
      'Vendor must provide PHI-grade DPA before reconsideration.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-meridianhealth-provider_gamma',
    tenantKey: 'meridianhealth',
    provider: 'provider_gamma',
    decision: 'blocked',
    basis: ['data_classification', 'security_review'],
    purposes: ['recommendation', 'synthesis', 'evidence_check'],
    rationale:
      'Provider_gamma residency does not meet meridianhealth ' +
      'requirements; security review explicitly blocks.',
    nextReviewStep:
      'Vendor residency change required; revisit only after security re-review.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-meridianhealth-on_prem_open_weight',
    tenantKey: 'meridianhealth',
    provider: 'on_prem_open_weight',
    decision: 'approved',
    basis: ['data_classification', 'tenant_admin_decision', 'governance_review'],
    purposes: ['evaluation', 'classification', 'extraction', 'evidence_check'],
    rationale:
      'On-prem open-weight model approved by tenant admin and ' +
      'governance lead as the only path that keeps PHI inside the ' +
      'tenant data plane.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-meridianhealth-azure_oai',
    tenantKey: 'meridianhealth',
    provider: 'azure_oai',
    decision: 'requires_review',
    basis: ['governance_review'],
    purposes: ['recommendation', 'synthesis', 'extraction'],
    rationale:
      'Azure OAI BAA available but tenant has not yet signed; ' +
      'governance review pending.',
    nextReviewStep:
      'Tenant admin to sign BAA addendum; governance lead to log approval.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-meridianhealth-vertex_ai',
    tenantKey: 'meridianhealth',
    provider: 'vertex_ai',
    decision: 'deferred',
    basis: ['cost_constraint', 'governance_review'],
    purposes: ['recommendation', 'synthesis'],
    rationale:
      'Vertex AI deferred for meridianhealth pending both cost ' +
      'envelope renegotiation and governance contractual review.',
    nextReviewStep:
      'Tenant admin to confirm budget envelope; governance lead to confirm contractual review.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-meridianhealth-bedrock',
    tenantKey: 'meridianhealth',
    provider: 'bedrock',
    decision: 'requires_review',
    basis: ['security_review'],
    purposes: ['classification', 'extraction', 'audit'],
    rationale:
      'Bedrock contractual posture acceptable in principle; ' +
      'meridianhealth security review pending before tenant rollout.',
    nextReviewStep: 'Security lead to complete vendor review checklist.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },

  // ---------------- arcturuslogistics (logistics) ----------------
  {
    id: 'tmpp-arcturuslogistics-provider_alpha',
    tenantKey: 'arcturuslogistics',
    provider: 'provider_alpha',
    decision: 'approved',
    basis: ['tenant_admin_decision'],
    purposes: ['recommendation', 'synthesis', 'classification', 'extraction'],
    rationale:
      'Tenant admin approved provider_alpha as the default tier_a ' +
      'recommendation provider for arcturuslogistics surfaces.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-arcturuslogistics-provider_beta',
    tenantKey: 'arcturuslogistics',
    provider: 'provider_beta',
    decision: 'approved',
    basis: ['tenant_admin_decision', 'cost_constraint'],
    purposes: ['classification', 'extraction', 'audit'],
    rationale:
      'Approved as the cost-efficient tier_b classification and ' +
      'extraction provider; explicit cost-constraint basis recorded.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-arcturuslogistics-provider_gamma',
    tenantKey: 'arcturuslogistics',
    provider: 'provider_gamma',
    decision: 'deferred',
    basis: ['cost_constraint'],
    purposes: ['recommendation', 'synthesis'],
    rationale:
      'Provider_gamma deferred; per-tenant daily cap consumed by ' +
      'higher-tier providers under current usage pattern.',
    nextReviewStep:
      'Revisit once tenant daily cap is renegotiated or usage shifts.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-arcturuslogistics-on_prem_open_weight',
    tenantKey: 'arcturuslogistics',
    provider: 'on_prem_open_weight',
    decision: 'approved',
    basis: ['data_classification'],
    purposes: ['evaluation', 'extraction'],
    rationale:
      'On-prem open-weight model approved for evaluation and ' +
      'extraction over L3-sensitive shipment data.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-arcturuslogistics-azure_oai',
    tenantKey: 'arcturuslogistics',
    provider: 'azure_oai',
    decision: 'approved',
    basis: ['security_review', 'tenant_admin_decision'],
    purposes: ['synthesis', 'extraction', 'audit'],
    rationale:
      'Azure OAI approved for synthesis and extraction after ' +
      'security review of regional posture and tenant key handling.',
    nextReviewStep: '',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-arcturuslogistics-vertex_ai',
    tenantKey: 'arcturuslogistics',
    provider: 'vertex_ai',
    decision: 'requires_review',
    basis: ['governance_review'],
    purposes: ['classification', 'extraction'],
    rationale:
      'Governance review of vertex_ai contractual terms pending ' +
      'before approval for arcturuslogistics tenant.',
    nextReviewStep:
      'Governance lead to confirm contractual review and log decision.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
  {
    id: 'tmpp-arcturuslogistics-bedrock',
    tenantKey: 'arcturuslogistics',
    provider: 'bedrock',
    decision: 'blocked',
    basis: ['cost_constraint', 'tenant_admin_decision'],
    purposes: ['recommendation', 'synthesis'],
    rationale:
      'Tenant admin blocked bedrock for arcturuslogistics; current ' +
      'cost envelope and contractual posture do not support adoption.',
    nextReviewStep:
      'Tenant admin to revisit if pricing or contract changes materially.',
    createdFrom: 'deterministic_tenant_model_provider_policy_seed',
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

function sortedAscUnique(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  for (const v of values) {
    seen.add(v);
  }
  return Array.from(seen).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
}

export function buildTenantModelPolicyMatrix(): readonly TenantModelPolicyEntry[] {
  return SEED_ENTRIES;
}

export function evaluateTenantModelAccess(
  tenantKey: string,
  provider: ModelProviderKind,
  purpose: TenantModelPolicyPurpose,
): TenantModelAccessEvaluation {
  // Empty tenant scope is treated as a hard block via blocked decision
  // with a tenant_admin_decision basis so the evaluator never reports
  // approved without scope.
  if (typeof tenantKey !== 'string' || tenantKey.length === 0) {
    return {
      tenantKey: '',
      provider,
      purpose,
      decision: 'blocked',
      basis: ['tenant_admin_decision'],
      rationale:
        'Empty tenantKey; tenant scope is required for any model ' +
        'provider decision. Evaluation refused.',
      matchedEntryId: null,
    };
  }
  const entry = SEED_ENTRIES.find(
    (e) => e.tenantKey === tenantKey && e.provider === provider,
  );
  if (entry === undefined) {
    return {
      tenantKey,
      provider,
      purpose,
      decision: 'requires_review',
      basis: ['governance_review'],
      rationale:
        'No policy entry exists for this (tenant, provider) pair; ' +
        'governance review is required before any access is granted.',
      matchedEntryId: null,
    };
  }
  // If the policy entry exists but does not cover the requested
  // purpose, downgrade the decision to requires_review and surface
  // the entry id for the reviewer.
  if (!entry.purposes.includes(purpose)) {
    return {
      tenantKey,
      provider,
      purpose,
      decision: 'requires_review',
      basis: ['governance_review'],
      rationale:
        'Policy entry exists for this (tenant, provider) pair but ' +
        'does not cover the requested purpose; governance review ' +
        'required to extend the policy entry.',
      matchedEntryId: entry.id,
    };
  }
  return {
    tenantKey,
    provider,
    purpose,
    decision: entry.decision,
    basis: entry.basis,
    rationale: entry.rationale,
    matchedEntryId: entry.id,
  };
}

function emptyDecisionCounter(): Record<TenantModelPolicyDecision, number> {
  const counter = {
    approved: 0,
    blocked: 0,
    deferred: 0,
    requires_review: 0,
  } as Record<TenantModelPolicyDecision, number>;
  return counter;
}

function emptyBasisCounter(): Record<TenantModelPolicyBasis, number> {
  const counter = {
    data_classification: 0,
    tenant_admin_decision: 0,
    security_review: 0,
    governance_review: 0,
    cost_constraint: 0,
  } as Record<TenantModelPolicyBasis, number>;
  return counter;
}

function emptyProviderCounter(): Record<ModelProviderKind, number> {
  const counter = {
    provider_alpha: 0,
    provider_beta: 0,
    provider_gamma: 0,
    on_prem_open_weight: 0,
    azure_oai: 0,
    vertex_ai: 0,
    bedrock: 0,
  } as Record<ModelProviderKind, number>;
  return counter;
}

export function summarizeTenantModelPolicyMatrix(
  entries: readonly TenantModelPolicyEntry[] = SEED_ENTRIES,
): TenantModelPolicyMatrixSummary {
  const byDecision = emptyDecisionCounter();
  const byBasis = emptyBasisCounter();
  const byProvider = emptyProviderCounter();
  const tenantSet: string[] = [];
  for (const entry of entries) {
    byDecision[entry.decision] += 1;
    byProvider[entry.provider] += 1;
    for (const b of entry.basis) {
      byBasis[b] += 1;
    }
    tenantSet.push(entry.tenantKey);
  }
  const uniqueTenants = sortedAscUnique(tenantSet);
  return {
    totalTenants: uniqueTenants.length,
    totalProviders: MODEL_PROVIDER_KINDS.length,
    totalEntries: entries.length,
    byDecision,
    byBasis,
    byProvider,
    uniqueTenants,
    approvedCount: byDecision.approved,
    blockedCount: byDecision.blocked,
    deferredCount: byDecision.deferred,
    requiresReviewCount: byDecision.requires_review,
  };
}

// Exported for test / readiness surfaces that want to reconcile the
// canonical tenant set without parsing the seed.
export const TENANT_MODEL_POLICY_TENANT_KEYS: readonly string[] = TENANT_KEYS;
