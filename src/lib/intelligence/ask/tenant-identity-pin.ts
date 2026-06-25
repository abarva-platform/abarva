/**
 * Tenant-identity pin for the aVa Intelligence synthesizer system prompt.
 *
 * Background
 * ----------
 * The aVa Intelligence synthesizer system prompt previously contained a hardcoded
 * pin that read, verbatim:
 *
 *     "If TENANT or GRAPH sources say the active tenant is Apex Retail,
 *      never use healthcare, Epic, IDN, clinical, CMIO, HIPAA, or Meridian
 *      facts unless the user explicitly asks for a cross-industry comparison."
 *
 * That pin assumed the active tenant was always Apex Retail. The 2026-05-24
 * full-module stress test (defect STRESS-P0-001) found that a Meridian Health
 * CDIO asking "What do you know about us?" on /intelligence/ask CROSS-CORPUS
 * mode received a confident response asserting "you're Apex Retail, a
 * multi-banner specialty retailer" — including Apex's FY2026 capital plan and
 * funding-authority matrix surfaced TO the Meridian session.
 *
 * Root cause: the hardcoded pin overrode the actual session tenant identity
 * carried by the request. The model trusted the pin over its retrieved
 * Meridian sources.
 *
 * Fix
 * ---
 * The pin is now built dynamically from the authenticated session's tenantId
 * (a ClientKey from `@/lib/client-config`). Each vertical (retail, healthcare,
 * financial-services) gets its own off-limits-vocabulary list, derived from
 * the OTHER two verticals' terminology, so a Meridian session correctly
 * refuses to use retail/finserv terminology unless the user explicitly asks
 * for a cross-industry comparison.
 *
 * The pin is prefixed with an AUTHORITATIVE marker so the model treats it as
 * higher-priority than any conflicting retrieval. The text also includes an
 * explicit "never assert a different tenant identity to the user" rule —
 * structurally enforced honesty discipline.
 */

import { getClientOption, isClientKey, type ClientKey } from '@/lib/client-config';

interface VerticalProfile {
  /** Human-readable vertical name used in the pin prose */
  verticalLabel: string;
  /** Terminology that is OFF-LIMITS for this vertical's tenant (from OTHER verticals) */
  offLimitsTerms: string[];
  /** Recognized tenant display names that this vertical might be confused with (also off-limits) */
  offLimitsTenantNames: string[];
}

// Per-vertical guardrails. Each profile lists the terminology that should NOT
// surface to a tenant of THIS vertical (drawn from the other verticals). The
// lists are intentionally generous — false-positives ("regulatory" referring
// to retail compliance vs healthcare HIPAA) are tolerable; cross-vertical
// content bleed is not.
const VERTICAL_PROFILES: Record<string, VerticalProfile> = {
  Retail: {
    verticalLabel: 'Retail',
    offLimitsTerms: [
      'healthcare', 'Epic', 'IDN', 'integrated delivery network', 'clinical',
      'clinician', 'CMIO', 'CDIO of a health system', 'HIPAA', 'BAA',
      'population risk model', 'ambient documentation', 'Abridge', 'clinical AI',
      'banking', 'core banking', 'FedNow', 'BSA', 'AML', 'SR 11-7',
      'commercial deposit', 'real-time payments rail',
    ],
    offLimitsTenantNames: ['Meridian', 'Meridian Health', 'Meridian Health System', 'Heliara', 'Heliara Health', 'First Capital', 'First Capital Financial', 'Arcturus'],
  },
  Healthcare: {
    verticalLabel: 'Healthcare',
    offLimitsTerms: [
      'retail', 'multi-banner', 'store ops', 'NCR POS', 'POS', 'merchandising',
      'assortment', 'demand forecasting at SKU level', 'pricing AI',
      'Commerce Cloud', 'Salesforce Commerce Cloud',
      'banking', 'core banking', 'FedNow', 'BSA', 'AML', 'SR 11-7',
      'commercial deposit', 'real-time payments rail', 'BAFO on a banking platform',
    ],
    offLimitsTenantNames: ['Apex', 'Apex Retail', 'Apex Retail Group', 'First Capital', 'First Capital Financial', 'Arcturus'],
  },
  'Financial Services': {
    verticalLabel: 'Financial Services',
    offLimitsTerms: [
      'retail', 'multi-banner', 'store ops', 'NCR POS', 'POS', 'merchandising',
      'assortment', 'demand forecasting at SKU level', 'pricing AI',
      'Commerce Cloud', 'Salesforce Commerce Cloud',
      'healthcare', 'Epic', 'IDN', 'integrated delivery network', 'clinical',
      'clinician', 'CMIO', 'HIPAA', 'BAA',
      'population risk model', 'ambient documentation', 'Abridge', 'clinical AI',
    ],
    offLimitsTenantNames: ['Apex', 'Apex Retail', 'Apex Retail Group', 'Meridian', 'Meridian Health', 'Meridian Health System', 'Heliara', 'Heliara Health'],
  },
  'Clinical Technology': {
    verticalLabel: 'Clinical Technology',
    offLimitsTerms: [
      'retail', 'multi-banner', 'store ops', 'NCR POS', 'POS', 'merchandising',
      'assortment', 'Commerce Cloud', 'Salesforce Commerce Cloud',
      'hospital system', 'integrated delivery network', 'IDN', 'Epic EHR',
      'banking', 'core banking', 'FedNow', 'BSA', 'AML', 'SR 11-7',
      'commercial deposit', 'real-time payments rail',
    ],
    offLimitsTenantNames: ['Apex', 'Apex Retail', 'Apex Retail Group', 'Meridian', 'Meridian Health', 'Meridian Health System', 'First Capital', 'First Capital Financial', 'Arcturus'],
  },
  'Global Airline': {
    verticalLabel: 'Global Airline',
    offLimitsTerms: [
      'retail', 'multi-banner', 'store ops', 'NCR POS', 'POS', 'merchandising',
      'assortment', 'Commerce Cloud', 'Salesforce Commerce Cloud',
      'healthcare', 'Epic', 'IDN', 'integrated delivery network', 'clinical',
      'clinician', 'CMIO', 'HIPAA', 'BAA',
      'banking', 'core banking', 'FedNow', 'BSA', 'AML', 'SR 11-7',
      'commercial deposit', 'real-time payments rail',
    ],
    offLimitsTenantNames: ['Apex', 'Apex Retail', 'Apex Retail Group', 'Meridian', 'Meridian Health', 'Meridian Health System', 'First Capital', 'First Capital Financial', 'Arcturus', 'Northstar', 'Northstar Clinical Technologies'],
  },
};

/**
 * Builds the authoritative tenant-identity pin block prepended to the aVa
 * synthesizer system prompt for every ask call.
 *
 * The block instructs the model to:
 *   1. Treat the named tenant as the authoritative session identity
 *   2. Refuse to assert a different tenant identity to the user
 *   3. Avoid surfacing other verticals' terminology unless the user explicitly
 *      asks for a cross-industry comparison
 *   4. Surface honestly if retrieval contains another tenant's data
 *
 * If no tenant is known (e.g., unauthenticated context, malformed call), the
 * block instead instructs the model to decline tenant-specific questions
 * rather than fabricating an identity.
 *
 * @param clientKey - The authenticated session's client key (e.g. 'apexretail',
 *                    'meridian', 'arcturus'). Pass null/undefined when no
 *                    tenant context is available.
 */
export function buildTenantIdentityPin(clientKey: string | null | undefined): string {
  const normalizedClientKey = normalizeTenantPinClientKey(clientKey);
  if (!normalizedClientKey) {
    return [
      'TENANT IDENTITY (authoritative): No active tenant has been resolved for this session.',
      'Rules:',
      '  • Decline tenant-specific questions ("what do you know about us", "who are our top vendors") with a brief, direct refusal — do not fabricate a tenant identity.',
      '  • Generic AI-strategy questions are still in-scope and may be answered from domain expertise.',
      '  • Never assert a tenant identity to the user when none is set.',
    ].join('\n');
  }

  const client = getClientOption(normalizedClientKey);
  const profile = VERTICAL_PROFILES[client.vertical] ?? null;

  const offLimitsTermLine = profile && profile.offLimitsTerms.length > 0
    ? `  • Off-limits terminology (other verticals): ${profile.offLimitsTerms.join(', ')}. Do not use unless the user explicitly asks for a cross-industry comparison.`
    : '';

  const offLimitsTenantLine = profile && profile.offLimitsTenantNames.length > 0
    ? `  • Off-limits tenant names: ${profile.offLimitsTenantNames.join(', ')}. NEVER assert any of these is the user's organization.`
    : '';

  const lines = [
    'TENANT IDENTITY (authoritative — overrides any conflicting retrieval / session memory):',
    `  • The active tenant for this session is "${client.name}" (vertical: ${client.vertical}; client_id: ${client.id}).`,
    '  • Never assert a different tenant identity to the user. If asked "what do you know about us" or "who am I", the answer must be grounded in this tenant.',
    offLimitsTermLine,
    offLimitsTenantLine,
    '  • If retrieved sources, session memory, or any other context claims a different tenant is active, that context is WRONG. Discard it and either (a) answer from the correct tenant context, or (b) surface the discrepancy honestly to the user ("I noticed mixed context — let me re-ground in your organization") and proceed.',
    '  • Cross-industry comparisons (e.g., "how do healthcare peers handle X?") are allowed only when the user EXPLICITLY asks for one.',
  ].filter((line) => line.length > 0);

  return lines.join('\n');
}

/**
 * Detects whether an aVa response asserts a different tenant identity than
 * the authenticated session expects. Used by the post-response guard + the
 * audit-runner scorer.
 *
 * Returns the offending tenant name if a leak is detected; null otherwise.
 *
 * Detection rules:
 *   - Looks for phrases like "you're <other tenant>", "your organization is <other>"
 *   - Cross-checks against the authenticated tenant's off-limits-tenant-names list
 *   - Conservative: only fires on explicit identity assertions, not casual mentions
 *     in cross-industry comparison contexts
 */
export function detectCrossTenantIdentityLeak(args: {
  clientKey: string | null | undefined;
  response: string;
}): { leaked: true; assertedTenant: string } | { leaked: false } {
  if (!args.clientKey || !args.response) return { leaked: false };

  const normalizedClientKey = normalizeTenantPinClientKey(args.clientKey);
  if (!normalizedClientKey) return { leaked: false };

  const client = getClientOption(normalizedClientKey);
  const profile = VERTICAL_PROFILES[client.vertical];
  if (!profile) return { leaked: false };

  // Identity-assertion patterns. Conservative — must be a confident assertion,
  // not a casual mention. We look for the OTHER tenant's name within an
  // assertion frame.
  //
  // All frames are case-insensitive ('i' flag): "Your organization is" and
  // "your organization is" are both real model outputs to catch.
  const assertionFrames = [
    /\byou(?:'?re|\s+are)\s+([A-Z][A-Za-z0-9\s&-]{2,40})\b/gi,
    /\byour\s+organization\s+is\s+([A-Z][A-Za-z0-9\s&-]{2,40})\b/gi,
    /\bthe\s+active\s+tenant\s+(?:is|for\s+this\s+session\s+is)\s+([A-Z][A-Za-z0-9\s&-]{2,40})\b/gi,
  ];

  // Sort off-limits names by length DESCENDING so "Apex Retail Group" wins
  // before "Apex" when the asserted span starts with a longer brand name.
  // Without this, the detector reports the shorter substring match and
  // loses precision in audit reports.
  const sortedOffLimits = [...profile.offLimitsTenantNames].sort(
    (a, b) => b.length - a.length,
  );

  for (const frame of assertionFrames) {
    let match: RegExpExecArray | null;
    while ((match = frame.exec(args.response)) !== null) {
      const asserted = (match[1] ?? '').trim();
      for (const offLimits of sortedOffLimits) {
        if (asserted.toLowerCase().startsWith(offLimits.toLowerCase())) {
          return { leaked: true, assertedTenant: offLimits };
        }
      }
    }
  }

  return { leaked: false };
}

export function detectOffTenantMention(args: {
  clientKey: string | null | undefined;
  response: string;
  query?: string | null;
}): { detected: true; term: string } | { detected: false } {
  if (!args.clientKey || !args.response) return { detected: false };

  const normalizedClientKey = normalizeTenantPinClientKey(args.clientKey);
  if (!normalizedClientKey) return { detected: false };

  if (/\bcross[-\s]?industry|peer comparison|compare (?:us|this|skyharbor|apex|meridian|first capital|northstar)\b/i.test(args.query ?? '')) {
    return { detected: false };
  }

  const client = getClientOption(normalizedClientKey);
  const profile = VERTICAL_PROFILES[client.vertical];
  if (!profile) return { detected: false };

  const offLimits = [...profile.offLimitsTenantNames].sort((a, b) => b.length - a.length);
  for (const term of offLimits) {
    if (hasTenantSpecificOffLimitMention(args.response, term)) {
      return { detected: true, term };
    }
  }

  return { detected: false };
}

function hasTenantSpecificOffLimitMention(
  response: string,
  offLimitTenantName: string,
): boolean {
  const escaped = offLimitTenantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mention = new RegExp(escaped, "gi");
  let match: RegExpExecArray | null;
  while ((match = mention.exec(response)) !== null) {
    const before = response.slice(Math.max(0, match.index - 90), match.index);
    const after = response.slice(
      match.index + match[0].length,
      match.index + match[0].length + 120,
    );
    const window = `${before}${match[0]}${after}`;
    if (
      /\b(importing|avoid|avoids?|not\s+(?:using|grounded|based|loaded|retrieved)|without\s+(?:using|importing)|unlike|compared with|comparison|peer|pattern|assumption)\b/i.test(
        window,
      )
    ) {
      continue;
    }
    if (
      /\b(active tenant|your organization|you(?:'re|\s+are)|session|authenticated|client)\b/i.test(
        before,
      )
    ) {
      return true;
    }
    if (
      /\b(facts?|sources?|context|budget|capital plan|portfolio|initiatives?|applications?|vendors?|contracts?|roadmap|loaded|retrieved)\b/i.test(
        after,
      )
    ) {
      return true;
    }
    if (
      /\b(use|using|from|based on|grounded in|loaded from|retrieved from)\b/i.test(
        before,
      ) &&
      /\b(facts?|sources?|context|data|rows?|records?)\b/i.test(after)
    ) {
      return true;
    }
  }
  return false;
}

function normalizeTenantPinClientKey(value: string | null | undefined): ClientKey | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (isClientKey(normalized)) return normalized;
  if (normalized === 'apex-retail') return 'apexretail';
  if (normalized === 'meridian-health') return 'meridian';
  if (normalized === 'firstcapital' || normalized === 'first-capital' || normalized === 'first-capital-financial') return 'arcturus';
  return null;
}
