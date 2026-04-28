// origination-view.ts — PROG-E-VIEW
//
// View model for the Program Origination wizard (/programs/new).
// Deterministic: no runtime clocks, no random(), no model calls.
//
// Consumed by ProgramOriginationPage.tsx and its integration test.
// The wizard has three steps. Steward leads classification; Nexus
// activates once the program opens (i.e. on submit redirect).

export interface OriginationStep {
  n: 1 | 2 | 3;
  slug: 'opportunity' | 'success' | 'owners';
  label: string;
  stewardHint: string;
  requiredFields: string[];
}

export interface OriginationViewModel {
  steps: readonly OriginationStep[];
  totalSteps: 3;
  /** Path the wizard redirects to after "Open Program →" is confirmed. */
  submitRedirectPath: string;
  stewardOpenerCopy: string;
  stewardSubmitCopy: string;
  deterministicSeed: true;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const ORIGINATION_STEPS: readonly OriginationStep[] = [
  {
    n: 1,
    slug: 'opportunity',
    label: 'Name the opportunity',
    stewardHint:
      'Start with a clear problem statement. Steward will classify this as a known pattern or a novel initiative.',
    requiredFields: ['programName', 'problemStatement'],
  },
  {
    n: 2,
    slug: 'success',
    label: 'Define success',
    stewardHint:
      'Set a measurable outcome target. A 3–18 month horizon works best for initial scoping.',
    requiredFields: ['targetOutcome', 'timelineHorizon'],
  },
  {
    n: 3,
    slug: 'owners',
    label: 'Assign owners + confirm',
    stewardHint:
      'Sponsor and lead assignments unlock phase activation. Nexus will brief both once the program opens.',
    requiredFields: ['sponsorName', 'leadName'],
  },
] as const;

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildOriginationViewModel(): OriginationViewModel {
  return {
    steps: ORIGINATION_STEPS,
    totalSteps: 3,
    // Demo anchor: always opens the CDP flagship for Apex Retail.
    // In production this would be the newly-created program slug.
    submitRedirectPath: '/programs/apx-cdp-2026',
    stewardOpenerCopy:
      'Steward is ready to classify your program and match it to known patterns. Fill in the three sections below to open your program.',
    stewardSubmitCopy:
      'Program opening. Nexus will brief the sponsor and lead, and Discovery will activate automatically.',
    deterministicSeed: true,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return the step object by its 1-based step number. */
export function getOriginationStep(n: 1 | 2 | 3): OriginationStep {
  return ORIGINATION_STEPS[n - 1];
}

/** True if the given field slug is required on the given step number. */
export function isRequiredOnStep(fieldSlug: string, n: 1 | 2 | 3): boolean {
  return ORIGINATION_STEPS[n - 1].requiredFields.includes(fieldSlug);
}
