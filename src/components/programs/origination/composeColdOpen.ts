// composeColdOpen · Surface 1 of Programs Strict Completion v1.2
//
// Server-side helper that renders the Steward greeting hydrated as the
// first turn in the workspace. Per kickoff §5: "cold-open address-by-name
// is a SEPARATE code path from response-to-input — the page render emits
// an initial Steward message keyed to user identity."
//
// Pure function: no I/O. The caller (server component) loads user context
// via @/lib/agent/userContext and passes the relevant fields here.

import type { UserContext } from '@/lib/agent/userContext';

export interface ColdOpenInput {
  /** Resolved user context, or null when the route loads unauthenticated (demo). */
  user: UserContext | null;
  /**
   * Variant for the demo route. The two routes share the same workspace UX
   * but greet differently — production warms David by name, the demo route
   * greets a generic visitor without name pretense.
   */
  variant: 'production' | 'demo';
}

export interface ColdOpenMessage {
  role: 'assistant';
  agentName: 'Steward';
  text: string;
  /** Stable id for React keys; deterministic so cold-open is idempotent. */
  id: string;
}

const PRODUCTION_GREETING_FIRST_NAME = (firstName: string, sponsorshipCount: number) => {
  const portfolioRef =
    sponsorshipCount > 0
      ? ` Given you're already sponsoring ${sponsorshipCount} program${
          sponsorshipCount === 1 ? '' : 's'
        }, I'll keep cross-program dependencies in view as we go.`
      : '';
  return `Morning, ${firstName}. Let's stand up a new program.${portfolioRef}

What are we solving? Tell me the problem in your own words — I'll classify it against the AbarVa pattern library and assemble a brief on the right as we talk. When the brief looks right, I'll register the program for you.`;
};

const PRODUCTION_GREETING_FALLBACK = `Welcome. Let's stand up a new program.

What are we solving? Tell me the problem in your own words — I'll classify it against the AbarVa pattern library and assemble a brief on the right as we talk. When the brief looks right, I'll register the program for you.`;

const DEMO_GREETING = `Welcome to Steward — AbarVa's program origination agent.

This is a demo path: tell me about a program you'd like to stand up, and I'll classify it against the AbarVa pattern library, draft a brief on the right, and walk you to registration. The flow is the same one Apex Retail uses in production.`;

export function composeColdOpen(input: ColdOpenInput): ColdOpenMessage {
  const text = (() => {
    if (input.variant === 'demo') return DEMO_GREETING;
    if (!input.user) return PRODUCTION_GREETING_FALLBACK;
    return PRODUCTION_GREETING_FIRST_NAME(
      input.user.firstName,
      input.user.sponsorshipHistory.length,
    );
  })();
  return {
    role: 'assistant',
    agentName: 'Steward',
    text,
    id: `cold-open-${input.variant}`,
  };
}
