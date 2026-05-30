/**
 * W4-PR-6 · Email template shape tests.
 *
 * Asserts contract uniformity across the 5 templates:
 *   - `subject`, `html`, `text` all return strings.
 *   - HTML contains CAN-SPAM required elements (physical address,
 *     unsubscribe link, sender brand).
 *   - No `<style>` blocks (inline-styles only — email-client safe).
 *   - Plain text is non-empty and shorter than HTML.
 *   - Snapshot per template against a representative payload.
 */

import {
  TEMPLATED_EVENT_TYPES,
  getTemplate,
  requireTemplate,
  isTemplatedEventType,
  type TemplatedEventType,
  type TenantBrand,
  type ApprovalRequestedPayload,
  type ConnectorFailedPayload,
  type IsolationAnomalyPayload,
  type AuthInviteAcceptedPayload,
  type ProgramGateDecisionPayload,
} from '../index';
import { SENDER_ADDRESS, PREFERENCES_PATH } from '../_shared/EmailShell';

const TENANT: TenantBrand = {
  name: 'Apex Retail',
  industryTag: 'Retail',
  canonicalKey: 'apex-retail',
};

/**
 * Frozen reference payloads — snapshot fidelity requires deterministic
 * input. Timestamps + ids never vary.
 */
const FIXTURES: Record<TemplatedEventType, unknown> = {
  'approval.requested': {
    eventId: 'evt_approval_demo_1',
    requestId: 'apr_demo_1',
    programName: 'Contact Center AI Acceleration',
    phase: '2 · Define',
    requesterName: 'Maria Chen',
    rationale:
      'Pilot scope expanded to two additional markets; need CIO sign-off before substrate refresh.',
    producedAtIso: '2026-05-30T14:02:00.000Z',
  } satisfies ApprovalRequestedPayload,
  'connector.failed': {
    eventId: 'evt_connector_demo_1',
    connectorId: 'conn_snowflake_sales',
    connectorName: 'Snowflake · Sales mart',
    lastSuccessIso: '2026-05-30T08:15:00.000Z',
    failureReason: 'Authentication failed: refresh token expired (HTTP 401).',
    suggestedAction:
      'Re-authorise the connector from the Source admin panel and re-run the sync.',
    producedAtIso: '2026-05-30T14:02:00.000Z',
  } satisfies ConnectorFailedPayload,
  'isolation.anomaly': {
    eventId: 'evt_isolation_demo_1',
    severity: 'critical',
    intendedTenantSlug: 'apex-retail',
    resolvedTenantSlug: 'meridian-health',
    detector: 'rls.cross_tenant_read',
    producedAtIso: '2026-05-30T14:02:00.000Z',
  } satisfies IsolationAnomalyPayload,
  'auth.invite_accepted': {
    eventId: 'evt_invite_demo_1',
    inviteeEmail: 'jordan.lee@example.com',
    role: 'Maestro',
    inviteeUserId: 'user_clerk_demo_1',
    acceptedAtIso: '2026-05-30T13:48:00.000Z',
    producedAtIso: '2026-05-30T14:02:00.000Z',
  } satisfies AuthInviteAcceptedPayload,
  'program.gate_decision': {
    eventId: 'evt_gate_demo_1',
    programId: 'prog_demand_forecast',
    programName: 'Demand Forecasting Refresh',
    decision: 'approved',
    newPhase: '3 · Build',
    rationale:
      'Reviewer noted strong substrate quality, completed CIO sign-off, and clean evidence trail. Advancing.',
    deciderName: 'Priya Patel',
    producedAtIso: '2026-05-30T14:02:00.000Z',
  } satisfies ProgramGateDecisionPayload,
};

describe('notification email template registry', () => {
  test('registry exports exactly the 5 W4-PR-6 event types', () => {
    expect(TEMPLATED_EVENT_TYPES).toEqual([
      'approval.requested',
      'connector.failed',
      'isolation.anomaly',
      'auth.invite_accepted',
      'program.gate_decision',
    ]);
  });

  test('isTemplatedEventType recognises registered + rejects unknown', () => {
    expect(isTemplatedEventType('approval.requested')).toBe(true);
    expect(isTemplatedEventType('not.real.event')).toBe(false);
  });

  test('getTemplate returns null for unknown event types', () => {
    expect(getTemplate('not.real.event')).toBeNull();
  });

  test('requireTemplate throws a helpful error for unknown event types', () => {
    expect(() => requireTemplate('not.real.event')).toThrow(
      /Notification email template missing/,
    );
  });
});

describe.each(TEMPLATED_EVENT_TYPES)('template shape · %s', (eventType) => {
  const template = requireTemplate(eventType);
  const payload = FIXTURES[eventType];

  test('subject() returns a non-empty string starting with the tenant name', () => {
    const subject = template.subject(payload, TENANT);
    expect(typeof subject).toBe('string');
    expect(subject.length).toBeGreaterThan(0);
    expect(subject.startsWith(`[${TENANT.name}]`)).toBe(true);
  });

  test('html() returns a well-formed HTML string with required CAN-SPAM elements', () => {
    const html = template.html(payload, TENANT);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(200);

    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('</html>');

    expect(html).toContain(SENDER_ADDRESS);
    expect(html).toContain(PREFERENCES_PATH);
    expect(html.toLowerCase()).toContain('unsubscribe');
    expect(html).toContain('AbarVa');
    expect(html).toContain(TENANT.name);
  });

  test('html() contains no <style> blocks (inline styles only)', () => {
    const html = template.html(payload, TENANT);
    expect(/<style[\s>]/i.test(html)).toBe(false);
    expect(/<\/style>/i.test(html)).toBe(false);
  });

  test('html() inlines styles via style="..." attributes', () => {
    const html = template.html(payload, TENANT);
    expect(html).toMatch(/style="[^"]+"/);
  });

  test('text() returns a non-empty plain string shorter than the HTML body', () => {
    const text = template.text(payload, TENANT);
    const html = template.html(payload, TENANT);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThan(html.length);

    // Plain text should also carry the CAN-SPAM footer.
    expect(text).toContain(SENDER_ADDRESS);
    expect(text).toContain(PREFERENCES_PATH);
    expect(text.toLowerCase()).toContain('unsubscribe');
  });

  test('text() contains no HTML tags', () => {
    const text = template.text(payload, TENANT);
    expect(/<[a-z][^>]*>/i.test(text)).toBe(false);
  });
});

describe('PII masking · auth.invite_accepted', () => {
  test('never echoes the full invitee email in subject or body', () => {
    const template = requireTemplate('auth.invite_accepted');
    const payload = FIXTURES['auth.invite_accepted'];
    const subject = template.subject(payload, TENANT);
    const html = template.html(payload, TENANT);
    const text = template.text(payload, TENANT);

    expect(subject).not.toContain('jordan.lee@example.com');
    expect(html).not.toContain('jordan.lee@example.com');
    expect(text).not.toContain('jordan.lee@example.com');
    // Masked form must appear.
    expect(html).toContain('j***@example.com');
    expect(text).toContain('j***@example.com');
  });
});

describe('snapshots · rendered output', () => {
  test.each(TEMPLATED_EVENT_TYPES)(
    'snapshot · %s · subject + text + html',
    (eventType) => {
      const template = requireTemplate(eventType);
      const payload = FIXTURES[eventType];
      expect({
        subject: template.subject(payload, TENANT),
        text: template.text(payload, TENANT),
        html: template.html(payload, TENANT),
      }).toMatchSnapshot();
    },
  );
});
