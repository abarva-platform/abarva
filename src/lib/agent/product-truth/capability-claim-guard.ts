// Global aVa Product Truth + Scope Guard — capability overreach guard.
//
// Deterministic scan: for each registry entry whose trigger phrases appear
// in the answer text, check whether the surrounding language frames the
// capability as definitively live/automatic for the tenant asking, when its
// registry maturity says otherwise. Pattern-based, like the existing
// voice-doctrine banned-pattern lists — not full NLP entailment.

import { PRODUCT_CAPABILITY_REGISTRY, isCapabilityLiveForTenant } from "./capability-registry";
import type { ProductTruthViolation } from "./types";

// Framing that turns a mention into a claim of present, working capability.
const DEFINITIVE_FRAMING_PATTERNS: readonly RegExp[] = [
  /\b(we|abarva|this platform|the system) (automatically|already )?(does|do|runs|provides|supports|handles)\b/i,
  /\b(we|abarva|this platform|the system) (automatically|already)\b/i,
  /\byou can (already )?(use|access|run)\b/i,
  /\bis (fully )?(live|available|built|working|automatic)\b/i,
  /\bhas been (built|implemented|shipped)\b/i,
];

export function checkCapabilityClaims(
  text: string,
  tenantKey: string | null | undefined,
): ProductTruthViolation[] {
  const violations: ProductTruthViolation[] = [];
  const hasDefinitiveFraming = DEFINITIVE_FRAMING_PATTERNS.some((pattern) => pattern.test(text));

  for (const entry of PRODUCT_CAPABILITY_REGISTRY) {
    if (entry.surface === "platform") continue; // handled by third-party-replacement-guard's platform patterns
    const match = entry.triggerPhrases
      .map((pattern) => text.match(pattern))
      .find((m): m is RegExpMatchArray => m !== null);
    if (!match) continue;

    const live = isCapabilityLiveForTenant(entry.key, tenantKey);
    if (live) continue; // legitimately live for this tenant — no violation

    // Not live for this tenant/at all. Flag only if the text frames it
    // definitively (a bare mention without a live/automatic claim is fine —
    // e.g. explaining what the feature will do once available).
    if (hasDefinitiveFraming) {
      violations.push({
        category: "capability_overreach",
        id: `capability-${entry.key}`,
        matchedText: match[0],
        detail: entry.claimGuidance,
      });
    }
  }

  return violations;
}
