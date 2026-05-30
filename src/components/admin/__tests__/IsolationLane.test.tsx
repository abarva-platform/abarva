/**
 * IsolationLane · Wave 2 PR-2 unit tests.
 *
 * Pins:
 *   - Empty state: shows muted "No tenant-resolution events…" line.
 *   - Populated state: renders an event row per record with severity
 *     labels and policy-decision metadata.
 *   - Top-anomaly callout: renders only when posture.topAnomaly is set.
 *   - PII safety: the lane never includes prompt/response/snapshot
 *     payload data — the broker contract guarantees those columns are
 *     stripped server-side, but we still assert the rendered markup
 *     does not surface them.
 *   - Estimated evidence: surfaces "(RLS % estimated)" annotation.
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { IsolationLane } from '../IsolationLane';
import type {
  IsolationPosture,
  IsolationRecentEvent,
} from '@/lib/admin/broker/isolation-posture-broker';

function event(overrides: Partial<IsolationRecentEvent> = {}): IsolationRecentEvent {
  return {
    id: overrides.id ?? 'evt-1',
    ts: overrides.ts ?? '2026-05-30T10:00:00Z',
    tenantKey: overrides.tenantKey ?? 'apex-retail',
    userId: overrides.userId ?? 'user_clerk_1',
    intendedTenant: overrides.intendedTenant ?? null,
    resolvedTenant: overrides.resolvedTenant ?? null,
    severity: overrides.severity ?? 'low',
    anomaly: overrides.anomaly ?? false,
    reason: overrides.reason ?? null,
    workflow: overrides.workflow ?? 'intelligence.ask',
    provider: overrides.provider ?? 'anthropic',
    policyDecision: overrides.policyDecision ?? 'allow',
    dataClass: overrides.dataClass ?? 'internal',
  };
}

function posture(overrides: Partial<IsolationPosture> = {}): IsolationPosture {
  return {
    rlsCoveragePct: overrides.rlsCoveragePct ?? 100,
    tenantResolutionEvents24h: overrides.tenantResolutionEvents24h ?? 0,
    anomaliesLast24h: overrides.anomaliesLast24h ?? 0,
    topAnomaly: overrides.topAnomaly ?? null,
    recentEvents: overrides.recentEvents ?? [],
    evidence: overrides.evidence ?? 'estimated',
  };
}

const REFRESHED = '2026-05-30T12:00:00Z';

describe('IsolationLane', () => {
  it('renders empty state when there are no events', () => {
    const html = renderToStaticMarkup(
      <IsolationLane posture={posture()} refreshedAtIso={REFRESHED} />,
    );
    expect(html).toContain('No tenant-resolution events in the last 24 hours');
    expect(html).toContain('data-testid="isolation-lane-empty"');
    expect(html).not.toContain('data-testid="isolation-lane-anomaly-callout"');
    expect(html).not.toContain('data-testid="isolation-lane-table"');
  });

  it('renders the event table with severity labels when populated', () => {
    const html = renderToStaticMarkup(
      <IsolationLane
        posture={posture({
          tenantResolutionEvents24h: 2,
          anomaliesLast24h: 1,
          recentEvents: [
            event({
              id: 'high-evt',
              severity: 'high',
              anomaly: true,
              policyDecision: 'error',
              dataClass: 'restricted',
              reason: 'upstream provider returned 500',
            }),
            event({
              id: 'low-evt',
              severity: 'low',
              policyDecision: 'allow',
            }),
          ],
        })}
        refreshedAtIso={REFRESHED}
      />,
    );
    expect(html).toContain('data-testid="isolation-lane-table"');
    expect(html).toContain('id="isolation-event-high-evt"');
    expect(html).toContain('id="isolation-event-low-evt"');
    expect(html).toContain('upstream provider returned 500');
    expect(html).toContain('High');
    expect(html).toContain('Low');
    expect(html).toContain('error · restricted');
  });

  it('renders the top-anomaly callout only when posture.topAnomaly is set', () => {
    const withAnomaly = renderToStaticMarkup(
      <IsolationLane
        posture={posture({
          tenantResolutionEvents24h: 1,
          anomaliesLast24h: 1,
          topAnomaly: {
            id: 'anom-1',
            description: 'cross-tenant resolution mismatch',
            severity: 'high',
            ts: '2026-05-30T11:00:00Z',
          },
          recentEvents: [event({ id: 'anom-1', anomaly: true, severity: 'high' })],
        })}
        refreshedAtIso={REFRESHED}
      />,
    );
    expect(withAnomaly).toContain('data-testid="isolation-lane-anomaly-callout"');
    expect(withAnomaly).toContain('cross-tenant resolution mismatch');
    expect(withAnomaly).toContain('High severity anomaly');

    const withoutAnomaly = renderToStaticMarkup(
      <IsolationLane posture={posture()} refreshedAtIso={REFRESHED} />,
    );
    expect(withoutAnomaly).not.toContain('data-testid="isolation-lane-anomaly-callout"');
  });

  it('shows "(RLS % estimated)" when evidence is estimated', () => {
    const html = renderToStaticMarkup(
      <IsolationLane
        posture={posture({ evidence: 'estimated' })}
        refreshedAtIso={REFRESHED}
      />,
    );
    expect(html).toContain('(RLS % estimated)');
  });

  it('PII safety: does not render prompt/response/snapshot payload material', () => {
    // The contract: even if a malicious row tried to leak through,
    // the broker strips payload columns. The lane's render must not
    // reference any of these field names in its markup.
    const html = renderToStaticMarkup(
      <IsolationLane
        posture={posture({
          tenantResolutionEvents24h: 1,
          anomaliesLast24h: 1,
          recentEvents: [
            event({
              id: 'pii-check',
              severity: 'high',
              anomaly: true,
              reason: 'kernel-only blocked Anthropic egress',
            }),
          ],
        })}
        refreshedAtIso={REFRESHED}
      />,
    );
    expect(html).not.toMatch(/prompt_hash/);
    expect(html).not.toMatch(/response_hash/);
    expect(html).not.toMatch(/prompt_snapshot_ref/);
    expect(html).not.toMatch(/response_snapshot_ref/);
    expect(html).not.toMatch(/query_text/);
  });

  it('renders intended→resolved with mismatch styling when keys differ', () => {
    const html = renderToStaticMarkup(
      <IsolationLane
        posture={posture({
          tenantResolutionEvents24h: 1,
          anomaliesLast24h: 1,
          recentEvents: [
            event({
              id: 'mm',
              anomaly: true,
              severity: 'high',
              intendedTenant: 'apex-retail',
              resolvedTenant: 'meridian-health',
            }),
          ],
        })}
        refreshedAtIso={REFRESHED}
      />,
    );
    expect(html).toContain('apex-retail → meridian-health');
  });

  it('renders metric header strip with all four cells', () => {
    const html = renderToStaticMarkup(
      <IsolationLane
        posture={posture({
          rlsCoveragePct: 100,
          tenantResolutionEvents24h: 42,
          anomaliesLast24h: 3,
        })}
        refreshedAtIso={REFRESHED}
      />,
    );
    expect(html).toContain('data-testid="isolation-lane-header"');
    expect(html).toContain('RLS coverage');
    expect(html).toContain('Resolution events 24h');
    expect(html).toContain('Anomalies 24h');
    expect(html).toContain('Refreshed');
    expect(html).toContain('>42<');
    expect(html).toContain('>3<');
  });
});
