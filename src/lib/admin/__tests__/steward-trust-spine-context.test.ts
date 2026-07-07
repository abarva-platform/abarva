/**
 * Steward Trust-Spine context tests · Wave 3 PR-3
 *
 * Verifies:
 *   • The composed system-prompt block includes the four trust
 *     dimensions (substrate, connectors, isolation, governance) with
 *     their counts.
 *   • Pattern-matched "what should I do next" questions are detected
 *     for the canonical phrasings the verdict doc calls out.
 *   • The action queue is deterministic and ordered by leverage.
 *   • PII (emails, UUIDs) is redacted from any labels we echo.
 *   • Surface gating only injects on Steward + admin/setup surfaces.
 *   • Broker failures degrade gracefully to an empty block.
 *   • Snapshot of the composed block under a representative seeded
 *     TrustSpine pins the shape so future drift is visible.
 */

import {
  buildStewardTrustSpineBlock,
  composeActionQueue,
  composeStewardTrustSpineContext,
  matchesNextPriorityQuestion,
  redactPii,
  shouldInjectStewardTrustSpine,
} from '../steward-trust-spine-context';
import * as trustSpineBroker from '../broker/trust-spine-broker';
import type { TrustSpine } from '../broker/trust-spine-broker';

jest.mock('../broker/trust-spine-broker', () => ({
  getTrustSpine: jest.fn(),
}));

const getTrustSpineMock =
  trustSpineBroker.getTrustSpine as jest.MockedFunction<
    typeof trustSpineBroker.getTrustSpine
  >;

function makeSpine(overrides: Partial<TrustSpine> = {}): TrustSpine {
  return {
    substrate: {
      segmentsTotal: 23,
      mature: 14,
      sparse: 6,
      missing: 3,
      lastIngestIso: '2026-05-01T12:00:00.000Z',
      topSparseSegment: {
        id: 'seg-vendor-contracts',
        label: 'Vendor Contracts',
        unlocks: 'Source vendor diligence and renewal-pressure surfacing',
      },
      evidence: 'live',
    },
    isolation: {
      rlsCoveragePct: 95,
      tenantResolutionEvents24h: 412,
      anomaliesLast24h: 2,
      topAnomaly: {
        id: 'evt-1',
        description: 'tenant-resolution anomaly: unknown_tenant',
        severity: 'high',
        ts: '2026-05-30T03:14:00.000Z',
      },
      evidence: 'live',
    },
    integration: {
      connectorsTotal: 8,
      connectorsLive: 5,
      connectorsDegraded: 2,
      lastPullIso: '2026-05-30T01:00:00.000Z',
      topDegraded: {
        id: 'conn-salesforce',
        name: 'Salesforce',
        reason: 'scope mismatch on opportunity_history',
      },
      evidence: 'live',
    },
    governance: {
      ssoConfigured: false,
      openApprovals: 3,
      policyDriftCount: 1,
      openInvites: 2,
      evidence: 'live',
    },
    audit: { last24hEvents: [] },
    refreshedAtIso: '2026-05-30T10:00:00.000Z',
    tenantKey: 'apex-retail',
    ...overrides,
  };
}

describe('redactPii', () => {
  it('strips email addresses', () => {
    expect(redactPii('alert from ops@apex-retail.com — degraded'))
      .toBe('alert from [redacted-email] — degraded');
  });

  it('strips UUIDs', () => {
    expect(redactPii('evt 12345678-1234-1234-1234-123456789abc fired'))
      .toBe('evt [redacted-id] fired');
  });

  it('leaves clean labels untouched', () => {
    expect(redactPii('Vendor Contracts')).toBe('Vendor Contracts');
  });
});

describe('composeStewardTrustSpineContext', () => {
  it('emits all four trust dimensions with counts', () => {
    const block = composeStewardTrustSpineContext({
      tenantName: 'Apex Retail',
      industry: 'retail',
      spine: makeSpine(),
    });

    expect(block).toContain('Tenant: Apex Retail (retail)');
    expect(block).toContain('Substrate: 14/23 segments mature.');
    expect(block).toContain('Sparsest: Vendor Contracts');
    expect(block).toContain('Connectors: 5/8 live.');
    expect(block).toContain('2 degraded — Salesforce');
    expect(block).toContain('Isolation: 2 anomalies in last 24h.');
    expect(block).toContain('RLS coverage 95%.');
    expect(block).toContain('Highest severity: high');
    expect(block).toContain('Governance: 3 approvals pending.');
    expect(block).toContain('SSO not configured');
    expect(block).toContain('2 open invites');
    expect(block).toContain('1 policy-drift events');
  });

  it('omits industry parens when industry is missing', () => {
    const block = composeStewardTrustSpineContext({
      tenantName: 'Apex Retail',
      spine: makeSpine(),
    });
    expect(block).toContain('Tenant: Apex Retail');
    expect(block).not.toContain('Tenant: Apex Retail (');
  });

  it('handles a zero-substrate tenant', () => {
    const block = composeStewardTrustSpineContext({
      tenantName: 'Cold Start Co',
      spine: makeSpine({
        substrate: {
          segmentsTotal: 0,
          mature: 0,
          sparse: 0,
          missing: 0,
          lastIngestIso: null,
          topSparseSegment: null,
          evidence: 'live',
        },
      }),
    });
    expect(block).toContain('Substrate: 0/0 segments mature.');
    expect(block).toContain('No substrate loaded yet');
  });

  it('handles a green tenant with no degraded connectors and no anomalies', () => {
    const block = composeStewardTrustSpineContext({
      tenantName: 'Green Co',
      spine: makeSpine({
        integration: {
          connectorsTotal: 8,
          connectorsLive: 8,
          connectorsDegraded: 0,
          lastPullIso: '2026-05-30T01:00:00.000Z',
          topDegraded: null,
          evidence: 'live',
        },
        isolation: {
          rlsCoveragePct: 100,
          tenantResolutionEvents24h: 200,
          anomaliesLast24h: 0,
          topAnomaly: null,
          evidence: 'live',
        },
        governance: {
          ssoConfigured: true,
          openApprovals: 0,
          policyDriftCount: 0,
          openInvites: 0,
          evidence: 'live',
        },
        substrate: {
          segmentsTotal: 23,
          mature: 23,
          sparse: 0,
          missing: 0,
          lastIngestIso: '2026-05-01T12:00:00.000Z',
          topSparseSegment: null,
          evidence: 'live',
        },
      }),
    });
    expect(block).toContain('All segments above sparse threshold.');
    expect(block).toContain('All connectors green.');
    expect(block).toContain('SSO configured');
    expect(block).toContain('No urgent actions');
  });

  it('redacts PII from echoed labels', () => {
    const block = composeStewardTrustSpineContext({
      tenantName: 'Apex Retail',
      spine: makeSpine({
        integration: {
          connectorsTotal: 4,
          connectorsLive: 3,
          connectorsDegraded: 1,
          lastPullIso: null,
          topDegraded: {
            id: 'conn-x',
            name: 'Slack',
            // Synthetic email in reason to verify redaction.
            reason: 'auth failure for service-account@apex.example.com',
          },
          evidence: 'live',
        },
      }),
    });
    expect(block).toContain('[redacted-email]');
    expect(block).not.toContain('service-account@apex.example.com');
  });

  it('matches the canonical snapshot for the seeded Apex spine', () => {
    const block = composeStewardTrustSpineContext({
      tenantName: 'Apex Retail',
      industry: 'retail',
      spine: makeSpine(),
    });
    expect(block).toMatchSnapshot();
  });
});

describe('composeActionQueue', () => {
  it('orders degraded connector → high anomaly → sparse substrate → approvals → SSO', () => {
    const queue = composeActionQueue(makeSpine());
    const lines = queue.split('\n');
    // Header
    expect(lines[0]).toBe('Action queue (priority order):');
    // First action: degraded connector
    expect(lines[1]).toMatch(/^\s+1\.\s+Repair degraded connector "Salesforce"/);
    // Second: high-severity anomaly
    expect(lines[2]).toMatch(/^\s+2\.\s+Review 2 isolation anomaly\/anomalies/);
    // Third: top sparse segment
    expect(lines[3]).toMatch(/^\s+3\.\s+Load substrate segment "Vendor Contracts"/);
    // Fourth: approvals
    expect(lines[4]).toMatch(/^\s+4\.\s+Resolve 3 pending approvals/);
    // SSO not configured
    expect(queue).toContain('Configure SSO before pilot');
  });

  it('returns the all-green sentinel when nothing is urgent', () => {
    const queue = composeActionQueue(
      makeSpine({
        integration: {
          connectorsTotal: 8,
          connectorsLive: 8,
          connectorsDegraded: 0,
          lastPullIso: '2026-05-30T01:00:00.000Z',
          topDegraded: null,
          evidence: 'live',
        },
        isolation: {
          rlsCoveragePct: 100,
          tenantResolutionEvents24h: 200,
          anomaliesLast24h: 0,
          topAnomaly: null,
          evidence: 'live',
        },
        governance: {
          ssoConfigured: true,
          openApprovals: 0,
          policyDriftCount: 0,
          openInvites: 0,
          evidence: 'live',
        },
        substrate: {
          segmentsTotal: 23,
          mature: 23,
          sparse: 0,
          missing: 0,
          lastIngestIso: '2026-05-01T12:00:00.000Z',
          topSparseSegment: null,
          evidence: 'live',
        },
      }),
    );
    expect(queue).toContain('No urgent actions');
  });
});

describe('matchesNextPriorityQuestion', () => {
  it.each([
    'What should I do next?',
    "what's stuck?",
    'What is the next priority?',
    'Where should I focus?',
    'top priority?',
    'next step?',
    'next action?',
    "what's blocking me?",
  ])('matches the canonical phrasing: %s', (msg) => {
    expect(matchesNextPriorityQuestion(msg)).toBe(true);
  });

  it.each([
    'Tell me about Salesforce.',
    'Why are we using Apex?',
    'How does the Vendor Contracts segment work?',
    '',
  ])('does NOT match unrelated phrasing: %s', (msg) => {
    expect(matchesNextPriorityQuestion(msg)).toBe(false);
  });
});

describe('shouldInjectStewardTrustSpine', () => {
  it('returns true for Steward on /admin and admin sub-routes', () => {
    expect(shouldInjectStewardTrustSpine('Steward', '/admin')).toBe(true);
    expect(shouldInjectStewardTrustSpine('Steward', '/admin/connectors')).toBe(true);
    expect(shouldInjectStewardTrustSpine('Steward', '/admin/users')).toBe(true);
  });

  it('returns false for legacy /home setup surfaces', () => {
    expect(shouldInjectStewardTrustSpine('Steward', '/home/data-trust')).toBe(false);
    expect(shouldInjectStewardTrustSpine('Steward', '/home/connectors')).toBe(false);
    expect(shouldInjectStewardTrustSpine('Steward', '/home/production-readiness')).toBe(false);
  });

  it('returns false for non-Steward agents', () => {
    expect(shouldInjectStewardTrustSpine('Sentinel', '/admin')).toBe(false);
    expect(shouldInjectStewardTrustSpine('Atlas', '/admin')).toBe(false);
    expect(shouldInjectStewardTrustSpine(null, '/admin')).toBe(false);
  });

  it('returns false for unrelated surfaces', () => {
    expect(shouldInjectStewardTrustSpine('Steward', '/intelligence')).toBe(false);
    expect(shouldInjectStewardTrustSpine('Steward', '/programs/new')).toBe(false);
    expect(shouldInjectStewardTrustSpine('Steward', '')).toBe(false);
  });
});

describe('buildStewardTrustSpineBlock', () => {
  beforeEach(() => {
    getTrustSpineMock.mockReset();
  });

  it('resolves and composes the block when the broker returns', async () => {
    getTrustSpineMock.mockResolvedValueOnce(makeSpine());
    const result = await buildStewardTrustSpineBlock({
      tenantName: 'Apex Retail',
      tenantKey: 'apex-retail',
      industry: 'retail',
    });
    expect(result.resolved).toBe(true);
    expect(result.spine).not.toBeNull();
    expect(result.block).toContain('Substrate: 14/23 segments mature.');
    expect(getTrustSpineMock).toHaveBeenCalledWith('apex-retail');
  });

  it('falls back to an empty block when the broker throws', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    getTrustSpineMock.mockRejectedValueOnce(new Error('substrate adapter pending'));
    const result = await buildStewardTrustSpineBlock({
      tenantName: 'Apex Retail',
      tenantKey: 'apex-retail',
      industry: null,
    });
    expect(result.resolved).toBe(false);
    expect(result.block).toBe('');
    expect(result.spine).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
