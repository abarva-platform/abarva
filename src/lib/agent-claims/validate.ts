// Claim & citation validation orchestrator (PR-4).

import { CANONICAL_TENANTS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  allowedCorpusIndustryScopes,
  hasAllowedCorpusIndustryScope,
} from "@/lib/corpus/industry-scope";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import type { TraceRetrievedObject } from "@/lib/agent-trace/types";
import { detectClaims, hasAssumptionMarker } from "./detect";
import {
  CLAIM_FIX_LANE,
  CRITICAL_CLAIM_TYPES,
  type ClaimType,
  type ClaimValidationResult,
  type ClaimVerdict,
  type NamespaceFinding,
  type TenantLeakageFinding,
  type UnsupportedClaim,
  type ValidateInput,
} from "./types";

/** Trace object kinds that can back each claim type. */
const REQUIRED_EVIDENCE_KINDS: Record<
  ClaimType,
  TraceRetrievedObject["kind"][]
> = {
  value_claim: [
    "kpi_baseline",
    "structured_fact",
    "tenant_context",
    "artifact",
    "evidence",
  ],
  kpi_outcome_claim: [
    "kpi_baseline",
    "structured_fact",
    "tenant_context",
    "artifact",
    "evidence",
  ],
  system_vendor_claim: [
    "tenant_context",
    "structured_fact",
    "context_record",
    "artifact",
  ],
  technology_stack_claim: [
    "tenant_context",
    "structured_fact",
    "context_record",
    "artifact",
  ],
  architecture_claim: ["tenant_context", "context_record", "artifact"],
  company_scale_claim: ["tenant_context", "structured_fact", "context_record"],
  leadership_org_claim: ["tenant_context", "structured_fact", "context_record"],
  sourcing_recommendation: [
    "corpus_pattern",
    "context_record",
    "tenant_context",
  ],
  risk_failure_mode_claim: [],
  next_action_recommendation: [],
};

const ADVISORY_TYPES: ReadonlySet<ClaimType> = new Set([
  "risk_failure_mode_claim",
  "next_action_recommendation",
]);

function allTraceObjects(
  trace: ValidateInput["trace"],
): TraceRetrievedObject[] {
  return [
    ...trace.retrieved_tenant_context,
    ...trace.retrieved_corpus_patterns,
    ...trace.retrieved_artifacts,
  ];
}

function verdictForClaim(
  claim: { text: string; type: ClaimType },
  objects: TraceRetrievedObject[],
): ClaimVerdict {
  if (ADVISORY_TYPES.has(claim.type)) {
    return {
      claim,
      supported: true,
      supportingObjectIds: [],
      supportBasis: "advisory_no_citation_required",
    };
  }
  const requiredKinds = REQUIRED_EVIDENCE_KINDS[claim.type];
  const supporting = objects.filter((o) => requiredKinds.includes(o.kind));
  if (supporting.length > 0) {
    return {
      claim,
      supported: true,
      supportingObjectIds: supporting.map((o) => o.id),
      supportBasis: "trace_evidence",
    };
  }
  if (hasAssumptionMarker(claim.text)) {
    return {
      claim,
      supported: true,
      supportingObjectIds: [],
      supportBasis: "stated_assumption",
    };
  }
  return {
    claim,
    supported: false,
    supportingObjectIds: [],
    supportBasis: null,
  };
}

/** Validate cited PATTERN ids against the tenant's grounding namespace. */
export function validatePatternNamespaces(input: {
  tenantKey: string | null;
  citedPatternIds: string[];
  tracePatterns: TraceRetrievedObject[];
  patternCatalog?: ValidateInput["patternCatalog"];
}): NamespaceFinding[] {
  const allowed = allowedCorpusIndustryScopes({
    tenantKey: input.tenantKey ?? undefined,
  });
  const findings: NamespaceFinding[] = [];
  // Case-insensitive index of patterns present in the trace.
  const traceById = new Map(
    input.tracePatterns.map((p) => [p.id.toLowerCase(), p]),
  );
  for (const rawId of input.citedPatternIds) {
    const id = rawId.toLowerCase();
    let namespaces: string[] | null = null;
    if (input.patternCatalog) {
      const entry = input.patternCatalog.lookup(id);
      if (!entry) {
        findings.push({
          patternId: rawId,
          citedNamespace: null,
          allowedNamespaces: allowed ?? [],
          kind: "phantom",
        });
        continue;
      }
      namespaces = entry.namespaces;
    } else {
      const traced = traceById.get(id);
      // Without a catalog we can only check patterns we actually retrieved.
      if (!traced) continue;
      namespaces = traced.namespace ? [traced.namespace] : [];
    }
    if (
      allowed &&
      namespaces.length > 0 &&
      !hasAllowedCorpusIndustryScope(namespaces, allowed)
    ) {
      findings.push({
        patternId: rawId,
        citedNamespace: namespaces[0] ?? null,
        allowedNamespaces: allowed,
        kind: "cross_namespace",
      });
    }
  }
  return findings;
}

// Common English words that appear as a tenant cover-name's first word
// (e.g. "First" in "First Capital"). These are NOT matched as a lone leakage
// token — the full name + canonical key still are.
const COMMON_NAME_WORDS = new Set([
  "first",
  "apex", // "apex" is a common English word (peak/summit); rely on full name "Apex Retail" + key
  "prime",
  "core",
  "united",
  "general",
  "capital",
  "national",
  "global",
  "american",
  "metro",
  "central",
]);

const TENANT_LEAKAGE_ALIASES: Record<string, string[]> = {
  "first-capital": ["First Capital Financial", "First Capital", "FS Demo"],
  "skyharbor-air": [
    "SkyHarbor Air",
    "SkyHarbor Airlines",
    "SkyHarbor",
    "skyharbor_global",
  ],
};

/** Detect references to OTHER canonical tenants in the answer. */
export function detectTenantLeakage(
  answerText: string,
  ownTenantKey: string | null,
  roster?: Array<{ key: string; name: string }>,
): TenantLeakageFinding[] {
  const own = canonicalTenantKey(ownTenantKey ?? "") || (ownTenantKey ?? "");
  const list =
    roster ?? CANONICAL_TENANTS.map((t) => ({ key: t.key, name: t.name }));
  const findings: TenantLeakageFinding[] = [];
  for (const t of list) {
    const tenantKey = canonicalTenantKey(t.key) || t.key;
    if (tenantKey === own) continue;
    // Always match the full cover name + the canonical key. The single first
    // word is matched ONLY when it is a distinctive proper noun — common
    // English words ("First" in "First Capital") would otherwise false-positive
    // on phrases like "first quarter" in any tenant's own answer.
    const firstWord = t.name.split(/\s+/)[0] ?? "";
    const distinctiveFirst =
      firstWord.length >= 4 && !COMMON_NAME_WORDS.has(firstWord.toLowerCase())
        ? firstWord
        : null;
    const tokens = [
      t.name,
      distinctiveFirst,
      tenantKey,
      ...(TENANT_LEAKAGE_ALIASES[tenantKey] ?? []),
    ].filter((x): x is string => Boolean(x));
    for (const token of tokens) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "i");
      const m = re.exec(answerText);
      if (m) {
        // Capture a short context window so a flagged leak is reviewable
        // (real cross-tenant reference vs. coincidental token).
        const start = Math.max(0, m.index - 35);
        const snippet = answerText
          .slice(start, m.index + token.length + 35)
          .replace(/\s+/g, " ")
          .trim();
        findings.push({
          detail: `referenced "${token}" — …${snippet}…`,
          offendingTenantKey: tenantKey,
        });
        break;
      }
    }
  }
  return findings;
}

export function validateClaimsAndCitations(
  input: ValidateInput,
): ClaimValidationResult {
  const objects = allTraceObjects(input.trace);
  const detected = detectClaims(input.answerText);
  const claims = detected.map((c) => verdictForClaim(c, objects));

  const unsupportedClaims: UnsupportedClaim[] = claims
    .filter((v) => !v.supported)
    .map((v) => ({
      claimText: v.claim.text,
      claimType: v.claim.type,
      critical: CRITICAL_CLAIM_TYPES.includes(v.claim.type),
      recommendedFixLane: CLAIM_FIX_LANE[v.claim.type],
    }));

  const citedPatternIds =
    input.citedPatternIds ??
    input.trace.retrieved_corpus_patterns
      .map((p) => p.id)
      .filter((id) => input.trace.citation_objects_emitted.includes(id));

  const namespaceFindings = validatePatternNamespaces({
    tenantKey: input.trace.tenant_key,
    citedPatternIds,
    tracePatterns: input.trace.retrieved_corpus_patterns,
    patternCatalog: input.patternCatalog,
  });

  const tenantLeakage = detectTenantLeakage(
    input.answerText,
    input.trace.tenant_key,
    input.tenantRoster,
  );

  const hasCriticalUnsupported = unsupportedClaims.some((c) => c.critical);
  const claimValidationStatus =
    hasCriticalUnsupported || namespaceFindings.length > 0 ? "fail" : "pass";
  const tenantIsolationStatus = tenantLeakage.length > 0 ? "fail" : "pass";

  return {
    claims,
    unsupportedClaims,
    namespaceFindings,
    tenantLeakage,
    claimValidationStatus,
    tenantIsolationStatus,
  };
}
