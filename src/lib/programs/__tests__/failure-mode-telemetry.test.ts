// OV2-FM-TELEMETRY · failure-mode telemetry helper tests.
//
// Verifies:
//   - no-op silently when posthog is uninitialized (no throw, no capture)
//   - fires program.failure_mode_flagged with the right name + properties
//   - $insert_id is included for PostHog server-side idempotency
//   - fires program.failure_mode_cleared with the right name + properties

import type { FailureModeFlaggedArtifact } from '@/lib/agent/artifacts';

// Mock posthog-js BEFORE importing the helper so the helper picks up
// our spy. We export a mutable __loaded flag and a capture jest.fn so
// each test can toggle initialization state.
jest.mock('posthog-js', () => {
  const captureSpy = jest.fn();
  return {
    __esModule: true,
    default: {
      __loaded: true,
      capture: captureSpy,
    },
  };
});

import posthog from 'posthog-js';
import {
  FAILURE_MODE_CLEARED_EVENT,
  FAILURE_MODE_FLAGGED_EVENT,
  trackFailureModeCleared,
  trackFailureModeFlagged,
  type FailureModeContext,
} from '../failure-mode-telemetry';

// Cast to the loose shape we control via the jest.mock above.
type MockedPostHog = {
  __loaded: boolean;
  capture: jest.Mock;
};
const mockedPosthog = posthog as unknown as MockedPostHog;

const baseArtifact: FailureModeFlaggedArtifact = {
  type: 'failure-mode-flagged',
  failureModeId: 1,
  failureModeName: 'Lack of executive sponsorship and ownership',
  phase: 0,
  detectedSignal: "User said the CIO 'mentioned it' but cannot describe a calendar commitment.",
  consequence: 'Sponsor pattern looks delegated; air cover collapses at the first hard tradeoff.',
  redirect: 'Schedule a sponsor 1:1 in the next 5 days; capture calendar cadence.',
  severity: 'soft',
};

const baseContext: FailureModeContext = {
  programId: 'prog-123',
  tenantKey: 'apex-retail',
  surface: '/programs/prog-123',
  agentName: 'Nexus',
};

beforeEach(() => {
  mockedPosthog.capture.mockReset();
  mockedPosthog.__loaded = true;
});

describe('trackFailureModeFlagged', () => {
  it('no-ops silently when posthog is not initialized', () => {
    mockedPosthog.__loaded = false;
    expect(() => trackFailureModeFlagged(baseArtifact, baseContext)).not.toThrow();
    expect(mockedPosthog.capture).not.toHaveBeenCalled();
  });

  it('fires program.failure_mode_flagged with the right event name and properties', () => {
    trackFailureModeFlagged(baseArtifact, baseContext);

    expect(mockedPosthog.capture).toHaveBeenCalledTimes(1);
    const [eventName, properties] = mockedPosthog.capture.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(eventName).toBe(FAILURE_MODE_FLAGGED_EVENT);
    expect(eventName).toBe('program.failure_mode_flagged');

    // Spot-check: at least the 5 most load-bearing keys plus a few
    // context keys must be present and correctly mapped.
    expect(properties.failure_mode_id).toBe(1);
    expect(properties.failure_mode_name).toBe(
      'Lack of executive sponsorship and ownership',
    );
    expect(properties.phase).toBe(0);
    expect(properties.severity).toBe('soft');
    expect(properties.detected_signal).toBe(baseArtifact.detectedSignal);
    expect(properties.consequence).toBe(baseArtifact.consequence);
    expect(properties.redirect).toBe(baseArtifact.redirect);
    expect(properties.program_id).toBe('prog-123');
    expect(properties.tenant_key).toBe('apex-retail');
    expect(properties.surface).toBe('/programs/prog-123');
    expect(properties.agent_name).toBe('Nexus');
  });

  it('includes a $insert_id for PostHog server-side idempotency', () => {
    trackFailureModeFlagged(baseArtifact, baseContext);

    const [, properties] = mockedPosthog.capture.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(typeof properties.$insert_id).toBe('string');
    // Format documented in the helper: `${id}:${phase}:${Date.now()}`.
    expect(properties.$insert_id as string).toMatch(/^1:0:\d+$/);
  });

  it('passes through null context fields without throwing', () => {
    trackFailureModeFlagged(baseArtifact, {
      programId: null,
      tenantKey: null,
      surface: '/programs',
      agentName: 'Nexus',
    });

    const [, properties] = mockedPosthog.capture.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(properties.program_id).toBeNull();
    expect(properties.tenant_key).toBeNull();
  });
});

describe('trackFailureModeCleared', () => {
  it('no-ops silently when posthog is not initialized', () => {
    mockedPosthog.__loaded = false;
    expect(() =>
      trackFailureModeCleared(
        { failureModeId: 1, failureModeName: 'X', phase: 0 },
        baseContext,
      ),
    ).not.toThrow();
    expect(mockedPosthog.capture).not.toHaveBeenCalled();
  });

  it('fires program.failure_mode_cleared with the right event name and properties', () => {
    trackFailureModeCleared(
      {
        failureModeId: 9,
        failureModeName: 'Inability to measure outcomes and impact',
        phase: 5,
      },
      baseContext,
    );

    expect(mockedPosthog.capture).toHaveBeenCalledTimes(1);
    const [eventName, properties] = mockedPosthog.capture.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];

    expect(eventName).toBe(FAILURE_MODE_CLEARED_EVENT);
    expect(eventName).toBe('program.failure_mode_cleared');
    expect(properties.failure_mode_id).toBe(9);
    expect(properties.failure_mode_name).toBe(
      'Inability to measure outcomes and impact',
    );
    expect(properties.phase).toBe(5);
    expect(properties.program_id).toBe('prog-123');
    expect(properties.tenant_key).toBe('apex-retail');
    expect(typeof properties.$insert_id).toBe('string');
  });
});
