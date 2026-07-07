// Surface grounding — the shared, surface-agnostic seam for binding curated
// Domain Function Pack depth into ANY agent surface (Sentinel/Source,
// Atlas/Tower, Steward/Setup), not just Nexus/Moves.
//
// Nexus/Moves already binds the function pack inside its board-grade artifact
// models (`bindMoveFunctionPack`). The other surfaces assemble their own agent
// context and had no shared way to inherit the same curated depth before
// reaching for general intelligence (spec ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md
// §1). `groundSurfaceContext` is that seam: a surface passes the tenant's
// industry/function identity and gets back the curated grounding bundle to fold
// into its context — or `null`, honestly, when no pack is catalogued (the
// surface then discloses the curated-depth gap rather than fabricating it).
//
// Pure, deterministic, typed — no I/O, no fabrication. The same registry
// (`resolveFunctionPack`) Nexus/Moves uses, so a surface grounded through this
// helper inherits exactly the depth the corpus grounding battery proves.

import { resolveFunctionPack } from '../domain/function-pack-registry';
import { resolveMoveFunctionIdentity } from '../../function-identity';
import type {
  FunctionPack,
  OperatingMetric,
} from '../domain/function-pack-types';

/** The curated grounding a surface inherits for a tenant (industry, function). */
export interface SurfaceGrounding {
  bound: true;
  industryKey: string;
  functionKey: string;
  functionLabel: string;
  summary: string;
  /** Operating metrics that define performance in this function. */
  operatingMetrics: OperatingMetric[];
  /** Canonical terms of art — so the surface speaks like an operator. */
  vocabulary: string[];
  /** Regulatory / program frames that govern the function. */
  regulatoryFrames: string[];
  /** Named failure modes the surface should look for. */
  painThemes: string[];
  /** Reference solution patterns the function recurs on. */
  referencePatterns: string[];
  /**
   * The own-it-vs-rent posture present in the pack: whether the pack carries a
   * "rented intelligence" pain theme and/or an ownership evidence anchor — the
   * discipline that an AbarVa-architected capability is one the client owns.
   */
  ownItPosture: {
    hasRentedIntelligenceTheme: boolean;
    hasOwnershipAnchor: boolean;
  };
}

/** The honest unbound result — no curated pack for this identity. */
export interface SurfaceGroundingUnbound {
  bound: false;
  fallbackNote: string;
}

export type SurfaceGroundingResult = SurfaceGrounding | SurfaceGroundingUnbound;

/**
 * Portfolio-level grounding for a CROSS-FUNCTION surface (Atlas/Tower), which
 * reasons across many functions at once rather than one. A single function-pack
 * bind would be the wrong model for such a surface; this aggregates the curated
 * depth of every function in scope — the union of metrics and regulatory
 * frames, plus the per-function grounding — so the portfolio read inherits real
 * depth without arbitrarily privileging one function.
 */
export interface TenantPortfolioGrounding {
  industryKey: string;
  /** The functions that resolved to a curated pack. */
  groundedFunctions: SurfaceGrounding[];
  /** Functions in scope with no catalogued pack — surfaced honestly. */
  unboundFunctions: { functionKey: string; fallbackNote: string }[];
  /** Union of operating metrics across the grounded functions (deduped by key). */
  allMetrics: OperatingMetric[];
  /** Union of regulatory frames across the grounded functions. */
  allRegulatoryFrames: string[];
  /** Whether the own-it discipline is present anywhere in the portfolio. */
  ownItPosture: { hasRentedIntelligenceTheme: boolean; hasOwnershipAnchor: boolean };
}

function summarize(pack: FunctionPack): SurfaceGrounding {
  return {
    bound: true,
    industryKey: pack.industryKey,
    functionKey: String(pack.functionKey),
    functionLabel: pack.functionLabel,
    summary: pack.summary,
    operatingMetrics: pack.operatingMetrics,
    vocabulary: pack.vocabulary.canonicalTerms.map((t) => t.term),
    regulatoryFrames: pack.vocabulary.regulatoryFrames.map((f) => f.name),
    painThemes: pack.painThemes.map((t) => t.name),
    referencePatterns: pack.referenceSolutionPatterns.map((r) => r.name),
    ownItPosture: {
      hasRentedIntelligenceTheme: pack.painThemes.some((t) =>
        /rent/i.test(t.key) || /rent/i.test(t.name) || /rent/i.test(t.description),
      ),
      hasOwnershipAnchor: pack.evidenceAnchors.some(
        (e) => /\bown|rent/i.test(e.claim),
      ),
    },
  };
}

/**
 * Ground a surface's context on the curated Domain Function Pack for a tenant's
 * `(industry, function)` identity. Returns the grounding bundle, or an honest
 * unbound result when the identity does not resolve to a catalogued pack.
 *
 * Pure and deterministic — same identity in, same grounding out.
 */
export function groundSurfaceContext(input: {
  industryCode?: string | null;
  functionPackKey?: string | null;
  charter?: unknown;
}): SurfaceGroundingResult {
  const identity = resolveMoveFunctionIdentity({
    industryCode: input.industryCode,
    functionPackKey: input.functionPackKey,
    charter: input.charter,
  });
  if (!identity) {
    return {
      bound: false,
      fallbackNote:
        'No (industry, function) identity resolved — the surface falls back ' +
        'to general reasoning. This is a known curated-depth gap, surfaced ' +
        'honestly, not fabricated depth.',
    };
  }
  const pack = resolveFunctionPack(identity.industryKey, identity.functionKey);
  if (!pack) {
    return {
      bound: false,
      fallbackNote:
        `No curated Domain Function Pack is catalogued for ` +
        `(${identity.industryKey}, ${identity.functionKey}). The surface ` +
        `falls back to general reasoning rather than fabricating depth.`,
    };
  }
  return summarize(pack);
}

/**
 * Ground a CROSS-FUNCTION surface (Atlas/Tower) over the set of functions
 * active in a tenant's portfolio. The correct model for a portfolio-level
 * agent: aggregate the curated depth of every function in scope rather than
 * binding one. Functions that resolve are grounded; the rest are surfaced as
 * honest unbound entries. Pure and deterministic.
 */
export function groundTenantPortfolio(input: {
  industryCode?: string | null;
  functionKeys: readonly string[];
}): TenantPortfolioGrounding {
  const grounded: SurfaceGrounding[] = [];
  const unbound: { functionKey: string; fallbackNote: string }[] = [];
  for (const functionKey of input.functionKeys) {
    const g = groundSurfaceContext({
      industryCode: input.industryCode,
      functionPackKey: functionKey,
    });
    if (g.bound) grounded.push(g);
    else unbound.push({ functionKey, fallbackNote: g.fallbackNote });
  }
  // Union metrics by key; union regulatory frames; OR the own-it posture.
  const metricByKey = new Map<string, OperatingMetric>();
  const frames = new Set<string>();
  let hasRented = false;
  let hasOwnership = false;
  for (const g of grounded) {
    for (const m of g.operatingMetrics) if (!metricByKey.has(m.key)) metricByKey.set(m.key, m);
    for (const f of g.regulatoryFrames) frames.add(f);
    hasRented = hasRented || g.ownItPosture.hasRentedIntelligenceTheme;
    hasOwnership = hasOwnership || g.ownItPosture.hasOwnershipAnchor;
  }
  return {
    industryKey: grounded[0]?.industryKey ?? '',
    groundedFunctions: grounded,
    unboundFunctions: unbound,
    allMetrics: [...metricByKey.values()],
    allRegulatoryFrames: [...frames],
    ownItPosture: { hasRentedIntelligenceTheme: hasRented, hasOwnershipAnchor: hasOwnership },
  };
}
