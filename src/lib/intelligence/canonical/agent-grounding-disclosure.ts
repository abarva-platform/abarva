import type {
  CanonicalConfidenceLevel,
  CanonicalSourceBasis,
  CanonicalUnsupportedClaimFlag,
} from './industry-ai-pattern';
import type { CanonicalPatternIndexStatus } from './runtime-pattern-index';

export interface AgentGroundingDisclosurePattern {
  canonicalId: string;
  title: string;
  sourceBasis: CanonicalSourceBasis | string;
  confidenceLevel: CanonicalConfidenceLevel | string;
  confidenceRationale: string;
  sourceReferenceCount: number;
  missingRequiredFields: string[];
  missingProvenance: boolean;
  unsupportedClaimFlags: string[];
  quantitativeClaimCount?: number;
  matchReasons?: string[];
}

export interface AgentGroundingDisclosure {
  source: 'persisted_canonical_corpus' | null;
  status: CanonicalPatternIndexStatus | 'not_requested';
  retrievedPatternCount: number;
  warnings: string[];
  sourceBasis: string[];
  confidenceLevels: string[];
  missingEvidence: string[];
  unsupportedClaimFlags: string[];
  patterns: AgentGroundingDisclosurePattern[];
}

export interface BuildAgentGroundingDisclosureArgs {
  source: 'persisted_canonical_corpus' | null;
  status: CanonicalPatternIndexStatus | 'not_requested';
  warnings?: string[];
  patterns?: AgentGroundingDisclosurePattern[];
  missingEvidence?: string[];
}

export function formatUnsupportedClaimFlag(flag: CanonicalUnsupportedClaimFlag | string): string {
  if (typeof flag === 'string') return flag;
  return `${flag.claim}: ${flag.reason}`;
}

export function buildAgentGroundingDisclosure(
  args: BuildAgentGroundingDisclosureArgs,
): AgentGroundingDisclosure {
  const patterns = args.patterns ?? [];
  const missingFromPatterns = patterns.flatMap((pattern) => {
    const missing = [
      pattern.missingProvenance ? `${pattern.canonicalId}: missing provenance` : null,
      pattern.missingRequiredFields.length > 0
        ? `${pattern.canonicalId}: missing ${pattern.missingRequiredFields.join(', ')}`
        : null,
      pattern.unsupportedClaimFlags.length > 0
        ? `${pattern.canonicalId}: unsupported claims present`
        : null,
    ].filter((item): item is string => Boolean(item));
    return missing;
  });

  return {
    source: args.source,
    status: args.status,
    retrievedPatternCount: patterns.length,
    warnings: args.warnings ?? [],
    sourceBasis: Array.from(new Set(patterns.map((pattern) => pattern.sourceBasis))),
    confidenceLevels: Array.from(new Set(patterns.map((pattern) => pattern.confidenceLevel))),
    missingEvidence: args.missingEvidence ?? missingFromPatterns,
    unsupportedClaimFlags: patterns.flatMap((pattern) => pattern.unsupportedClaimFlags),
    patterns,
  };
}
