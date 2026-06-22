/**
 * Source intake intent shapes.
 *
 * Iteration-2 punch-list (design-partner IT sourcing VP): the mid-stream entry
 * buttons on the Decision Queue link to `/source/new?intent=...`. Each intent
 * must *reshape* the intake — a prefilled prompt, a tailored set of intake
 * facts, the questions relevant to that intent, and a routing hint toward the
 * downstream surface that intent expects (Renewal Cockpit, proposal
 * normalization, category classifier, savings analysis).
 *
 * When no `intent` param is present the originate page falls back to the
 * generic intake (see `GENERIC_INTAKE_FIELDS` consumers); this module only
 * describes the *shaped* variants so the behaviour stays backward compatible.
 */

export type SourceIntakeIntent =
  | 'vendor'
  | 'renewal'
  | 'rfp-response'
  | 'business-request'
  | 'cut-spend'
  | 'compare-vendors';

export const SOURCE_INTAKE_INTENTS: readonly SourceIntakeIntent[] = [
  'vendor',
  'renewal',
  'rfp-response',
  'business-request',
  'cut-spend',
  'compare-vendors',
] as const;

/**
 * The five generic intake facts. Shaped intents re-label / re-prompt these
 * same field ids so the downstream `/api/v1/source/events` contract is
 * unchanged — only the *intake experience* differs.
 */
export type IntakeFieldId =
  | 'trigger'
  | 'decisionOwner'
  | 'scopeBoundary'
  | 'valueTarget'
  | 'baselineOwner';

export interface IntakeFieldShape {
  id: IntakeFieldId;
  /** Field label, re-worded for the intent. */
  label: string;
  /** The question Ava asks for this field, re-worded for the intent. */
  prompt: string;
  placeholder: string;
}

/**
 * A downstream surface the intent steers toward. Rendered as a routing hint
 * in the intake header so the practitioner sees where this path ends up.
 */
export interface IntakeRoutingHint {
  /** Short label, e.g. "Renewal Cockpit". */
  label: string;
  /** Plain-language description of what happens after the event opens. */
  description: string;
}

export interface SourceIntakeShape {
  intent: SourceIntakeIntent;
  /** Eyebrow above the intake heading, e.g. "Renewal intake". */
  eyebrow: string;
  /** Intake heading. */
  heading: string;
  /** One-sentence framing under the heading. */
  subhead: string;
  /**
   * Prompt pre-loaded into the Ava chat composer so the conversation
   * starts already shaped toward the intent.
   */
  prefilledPrompt: string;
  /** Ava's opening line, re-worded for the intent. */
  initialQuote: string;
  /** The intake facts, re-labelled / re-prompted for the intent. */
  fields: IntakeFieldShape[];
  /** Where this intake path is heading downstream. */
  routingHint: IntakeRoutingHint;
}

/** Parse a raw query-param value into a known intent, or `null`. */
export function parseSourceIntakeIntent(
  raw: string | string[] | null | undefined,
): SourceIntakeIntent | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return (SOURCE_INTAKE_INTENTS as readonly string[]).includes(normalized)
    ? (normalized as SourceIntakeIntent)
    : null;
}

const INTAKE_SHAPES: Record<SourceIntakeIntent, SourceIntakeShape> = {
  vendor: {
    intent: 'vendor',
    eyebrow: 'Vendor intake',
    heading: 'Source around a vendor',
    subhead:
      'You already have a vendor in mind. Tell Ava who they are and what they would deliver — the brief shapes around evaluating and standing up that vendor.',
    prefilledPrompt:
      'I have a specific vendor I want to source around. Help me scope the event.',
    initialQuote:
      'You have a vendor in mind. Tell me who they are and the work in scope — I will help you scope a fair event so the choice holds up.',
    fields: [
      {
        id: 'trigger',
        label: 'The vendor & why now',
        prompt: 'Which vendor, and what makes sourcing around them necessary now?',
        placeholder: 'e.g. Incumbent SI proposed an AMS expansion; we need a defensible event before committing.',
      },
      {
        id: 'decisionOwner',
        label: 'Decision owner',
        prompt: 'Who sponsors or signs off on engaging this vendor?',
        placeholder: 'CIO, VP Infrastructure, app owner, procurement sponsor...',
      },
      {
        id: 'scopeBoundary',
        label: 'Work in scope for the vendor',
        prompt: 'What would this vendor actually deliver — and what stays out?',
        placeholder: 'In: AMS for SAP and eCommerce. Out: security operations and deskside support.',
      },
      {
        id: 'valueTarget',
        label: 'Commercial expectation',
        prompt: 'What commercial outcome justifies engaging this vendor?',
        placeholder: '$4M run-rate savings, SLA uplift, faster delivery, risk reduction...',
      },
      {
        id: 'baselineOwner',
        label: 'Baseline owner',
        prompt: 'Who owns the baseline that proves the vendor is the right call?',
        placeholder: 'Finance owns spend baseline; ServiceNow owner owns ticket volume extract.',
      },
    ],
    routingHint: {
      label: 'Vendor evaluation event',
      description:
        'Opens a sourcing event scoped to the vendor so the choice is evidenced, not assumed.',
    },
  },
  renewal: {
    intent: 'renewal',
    eyebrow: 'Renewal intake',
    heading: 'Stand up a renewal',
    subhead:
      'A contract is up for renewal. Tell Ava which contract — the brief shapes toward the Renewal Cockpit so the renewal decision is evidenced before the clock runs out.',
    prefilledPrompt:
      'I have a contract coming up for renewal. Help me scope the renewal decision.',
    initialQuote:
      'A renewal is on the clock. Tell me which contract and when it expires — I will route you toward the Renewal Cockpit with the baseline pre-loaded.',
    fields: [
      {
        id: 'trigger',
        label: 'Which contract & renewal date',
        prompt: 'Which contract is renewing, and what is the renewal or notice deadline?',
        placeholder: 'e.g. FIS Profile AMS — auto-renews Aug 31; 90-day notice window opens Jun 2.',
      },
      {
        id: 'decisionOwner',
        label: 'Renewal decision owner',
        prompt: 'Who decides whether to renew, renegotiate, or run a competitive event?',
        placeholder: 'CIO, VP Infrastructure, contract owner, procurement sponsor...',
      },
      {
        id: 'scopeBoundary',
        label: 'Renewal scope',
        prompt: 'What is in the renewal — and what should be carved out or re-scoped?',
        placeholder: 'In: current AMS towers at flat scope. Carve out: analytics support, now insourced.',
      },
      {
        id: 'valueTarget',
        label: 'Renewal value target',
        prompt: 'What commercial outcome would make a renewal — or a switch — worth it?',
        placeholder: '12% price reduction, removal of shelfware, improved SLA credits...',
      },
      {
        id: 'baselineOwner',
        label: 'Renewal baseline owner',
        prompt: 'Who owns the current-state baseline the Renewal Cockpit needs?',
        placeholder: 'Finance owns current contract spend; vendor manager owns the SLA scorecard.',
      },
    ],
    routingHint: {
      label: 'Renewal Cockpit',
      description:
        'Routes the event toward the Renewal Cockpit, pre-loaded with the contract baseline and the renewal clock.',
    },
  },
  'rfp-response': {
    intent: 'rfp-response',
    eyebrow: 'RFP response intake',
    heading: 'Normalize an RFP response',
    subhead:
      'You have a vendor proposal or RFP response in hand. Tell Ava what came in — the brief shapes toward proposal normalization so responses become comparable.',
    prefilledPrompt:
      'I have an RFP response / vendor proposal to work through. Help me normalize it.',
    initialQuote:
      'You have a proposal in hand. Tell me which RFP it answers and who submitted — I will steer toward proposal normalization so it can be compared apples-to-apples.',
    fields: [
      {
        id: 'trigger',
        label: 'Which RFP & whose response',
        prompt: 'Which RFP does this response answer, and who submitted it?',
        placeholder: 'e.g. AMS RFP 2026-Q2 — responses in from FIS, Accenture, and a regional SI.',
      },
      {
        id: 'decisionOwner',
        label: 'Evaluation owner',
        prompt: 'Who owns scoring and the award recommendation?',
        placeholder: 'CIO, sourcing lead, evaluation committee chair...',
      },
      {
        id: 'scopeBoundary',
        label: 'Response scope to normalize',
        prompt: 'Which sections or lots of the response need to be made comparable?',
        placeholder: 'Pricing schedule, SLA commitments, transition plan, assumptions / exclusions.',
      },
      {
        id: 'valueTarget',
        label: 'Evaluation value basis',
        prompt: 'What commercial basis decides the award?',
        placeholder: 'Lowest normalized TCO, best value score, risk-adjusted price...',
      },
      {
        id: 'baselineOwner',
        label: 'Normalization baseline owner',
        prompt: 'Who owns the price and assumption baseline normalization runs against?',
        placeholder: 'Sourcing analyst owns the should-cost model; Finance owns the spend baseline.',
      },
    ],
    routingHint: {
      label: 'Proposal normalization',
      description:
        'Routes toward proposal normalization so vendor responses are reconciled to a common pricing and assumption basis.',
    },
  },
  'business-request': {
    intent: 'business-request',
    eyebrow: 'Business request intake',
    heading: 'Triage a business request',
    subhead:
      'A business stakeholder asked for something. Tell Ava what they want — the brief shapes toward the category classifier so the request lands in the right sourcing path.',
    prefilledPrompt:
      'A business team raised a request and I need to turn it into a sourcing event. Help me triage it.',
    initialQuote:
      'A business team has a request. Tell me what they asked for and who asked — I will help classify the category and shape the right event.',
    fields: [
      {
        id: 'trigger',
        label: 'The request & who raised it',
        prompt: 'What did the business ask for, and which team or sponsor raised it?',
        placeholder: 'e.g. Merchandising wants a new demand-forecasting tool before peak season.',
      },
      {
        id: 'decisionOwner',
        label: 'Decision owner',
        prompt: 'Who can sponsor or approve sourcing against this request?',
        placeholder: 'Business sponsor, CIO, category owner, procurement sponsor...',
      },
      {
        id: 'scopeBoundary',
        label: 'Request scope to classify',
        prompt: 'What capability or service is being asked for — so it can be categorized?',
        placeholder: 'SaaS analytics tool, managed service, staff augmentation, infrastructure...',
      },
      {
        id: 'valueTarget',
        label: 'Business outcome sought',
        prompt: 'What outcome does the business expect this to deliver?',
        placeholder: 'Faster forecasting cycle, reduced stockouts, headcount avoidance...',
      },
      {
        id: 'baselineOwner',
        label: 'Requirements owner',
        prompt: 'Who owns the requirements and current-state baseline for this request?',
        placeholder: 'Requesting team lead owns requirements; Finance owns any existing spend.',
      },
    ],
    routingHint: {
      label: 'Category classifier',
      description:
        'Routes toward the category classifier so the business request is matched to the correct sourcing category and artifact pack.',
    },
  },
  'cut-spend': {
    intent: 'cut-spend',
    eyebrow: 'Cut-spend intake',
    heading: 'Find spend to cut',
    subhead:
      'You need to take cost out. Tell Ava where the pressure is — the brief shapes toward savings and shelfware analysis to surface defensible cuts.',
    prefilledPrompt:
      'I need to cut IT spend. Help me find where the savings are.',
    initialQuote:
      'You need to take cost out. Tell me where the spend pressure is and the target — I will steer toward shelfware and savings analysis.',
    fields: [
      {
        id: 'trigger',
        label: 'Spend pressure & why now',
        prompt: 'What is driving the need to cut, and over what timeframe?',
        placeholder: 'e.g. CFO mandate: 15% IT run-rate reduction by end of FY.',
      },
      {
        id: 'decisionOwner',
        label: 'Savings decision owner',
        prompt: 'Who owns the savings target and signs off on what gets cut?',
        placeholder: 'CIO, CFO, VP Infrastructure, category owner...',
      },
      {
        id: 'scopeBoundary',
        label: 'Spend area in scope',
        prompt: 'Which categories, contracts, or towers are in scope for cuts?',
        placeholder: 'In: SaaS licenses, AMS contracts. Out: security tooling, regulatory systems.',
      },
      {
        id: 'valueTarget',
        label: 'Savings target',
        prompt: 'How much needs to come out, and by when?',
        placeholder: '$4M run-rate savings, 15% unit-cost reduction within two quarters...',
      },
      {
        id: 'baselineOwner',
        label: 'Spend baseline owner',
        prompt: 'Who owns the spend and utilization baseline the savings analysis runs against?',
        placeholder: 'Finance owns the spend baseline; SaaS admin owns license utilization data.',
      },
    ],
    routingHint: {
      label: 'Savings & shelfware analysis',
      description:
        'Routes toward savings and shelfware analysis to surface unused licenses, over-scoped contracts, and defensible cuts.',
    },
  },
  'compare-vendors': {
    intent: 'compare-vendors',
    eyebrow: 'Vendor comparison intake',
    heading: 'Compare vendors head-to-head',
    subhead:
      'You have more than one vendor on the table. Tell Ava who is in the running — the brief shapes toward a normalized scorecard so the comparison is fair.',
    prefilledPrompt:
      'I need to compare several vendors for the same need. Help me set up a fair comparison.',
    initialQuote:
      'You have vendors to compare. Tell me who is in the running and the need they all answer — I will shape a normalized, defensible comparison.',
    fields: [
      {
        id: 'trigger',
        label: 'Vendors in the running & why now',
        prompt: 'Which vendors are being compared, and what decision forces the comparison?',
        placeholder: 'e.g. FIS vs. Accenture vs. regional SI for AMS — board wants a recommendation in Q3.',
      },
      {
        id: 'decisionOwner',
        label: 'Comparison decision owner',
        prompt: 'Who owns the recommendation coming out of the comparison?',
        placeholder: 'CIO, sourcing lead, evaluation committee chair...',
      },
      {
        id: 'scopeBoundary',
        label: 'Common scope across vendors',
        prompt: 'What identical scope must every vendor be compared against?',
        placeholder: 'In: AMS for SAP and eCommerce at equal volumes. Out: items not common to all bids.',
      },
      {
        id: 'valueTarget',
        label: 'Comparison value basis',
        prompt: 'What weighted basis decides the winner?',
        placeholder: 'Normalized TCO, weighted scorecard, risk-adjusted value...',
      },
      {
        id: 'baselineOwner',
        label: 'Scorecard baseline owner',
        prompt: 'Who owns the criteria weights and baseline the scorecard normalizes against?',
        placeholder: 'Sourcing lead owns scorecard weights; Finance owns the spend baseline.',
      },
    ],
    routingHint: {
      label: 'Normalized vendor scorecard',
      description:
        'Routes toward a normalized scorecard so vendors are compared on identical scope and a common value basis.',
    },
  },
};

/** Return the shaped intake for an intent, or `null` for an unknown intent. */
export function getSourceIntakeShape(
  intent: SourceIntakeIntent | null | undefined,
): SourceIntakeShape | null {
  if (!intent) return null;
  return INTAKE_SHAPES[intent] ?? null;
}

/** Resolve a raw query-param straight to a shape (parse + lookup). */
export function resolveSourceIntakeShape(
  raw: string | string[] | null | undefined,
): SourceIntakeShape | null {
  return getSourceIntakeShape(parseSourceIntakeIntent(raw));
}
