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
