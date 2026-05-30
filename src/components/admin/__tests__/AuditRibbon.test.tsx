/**
 * AuditRibbon · Wave 1 PR-6 · tests
 *
 * Covers:
 *  - Renders 6 rows when given 6+ mixed-source events (snapshot-ish).
 *  - Each row carries the broker source on `data-source` so the
 *    client-side filter handoff to /admin/audit?source=… is wired.
 *  - Source label chips render the verdict's required tones.
 *  - Empty-state shows the muted "No activity" line.
 *  - The footer link points at the full audit page.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { AuditRibbon } from '../AuditRibbon';
import type { TrustAuditEvent } from '@/lib/admin/broker/trust-spine-broker';

// Stub the client island — its onClick PostHog integration is
// covered by manual QA. Tests assert that the wrapper anchor renders
// with the expected href and source attribute.
jest.mock('../AuditRibbonRow', () => ({
  AuditRibbonRow: ({
    source,
    href,
    children,
  }: {
    source: string;
    href: string;
    children: React.ReactNode;
  }) => (
    <a data-testid="audit-ribbon-row" data-source={source} href={href}>
      {children}
    </a>
  ),
}));

function makeEvents(): TrustAuditEvent[] {
  // Six mixed-source events, freshest first, matching what the
  // broker emits (already sorted by ts desc).
  return [
    {
      ts: '2026-05-29T09:00:00Z',
      source: 'substrate',
      actor: 'Import pipeline',
      action: 'Imported segment kpi_dictionary',
    },
    {
      ts: '2026-05-29T08:00:00Z',
      source: 'approval',
      actor: 'Program owner',
      action: 'Opened program approval request',
      target: 'prog-apex-cdp',
    },
    {
      ts: '2026-05-28T22:00:00Z',
      source: 'policy',
      actor: 'David Chen',
      action: 'Updated policy egress_audit_v2',
    },
    {
      ts: '2026-05-28T14:00:00Z',
      source: 'auth',
      actor: 'Clerk',
      action: 'SSO login succeeded',
    },
    {
      ts: '2026-05-28T10:00:00Z',
      source: 'connector',
      actor: 'ServiceNow',
      action: 'Reconnected after OAuth refresh',
    },
    {
      ts: '2026-05-27T16:00:00Z',
      source: 'invite',
      actor: 'Priya Sharma',
      action: 'Invite sent to mark@apexretail.com',
    },
  ];
}

describe('AuditRibbon', () => {
  it('renders 6 mixed-source rows with broker source on each row', () => {
    const html = renderToStaticMarkup(<AuditRibbon events={makeEvents()} />);

    // 6 rows.
    const matches = html.match(/data-testid="audit-ribbon-row"/g) ?? [];
    expect(matches).toHaveLength(6);

    // Each source is present.
    expect(html).toContain('data-source="substrate"');
    expect(html).toContain('data-source="approval"');
    expect(html).toContain('data-source="policy"');
    expect(html).toContain('data-source="auth"');
    expect(html).toContain('data-source="connector"');
    expect(html).toContain('data-source="invite"');

    // Each row's href carries the source filter so the audit page
    // can scope the rendered list.
    expect(html).toContain('href="/admin/audit?source=substrate"');
    expect(html).toContain('href="/admin/audit?source=approval"');

    // Source chip labels honor the verdict's display strings.
    expect(html).toContain('Substrate');
    expect(html).toContain('Approval');
    expect(html).toContain('Policy');
    expect(html).toContain('Auth');
    expect(html).toContain('Connector');
    expect(html).toContain('Invite');

    // Footer link is present.
    expect(html).toContain('href="/admin/audit"');
    expect(html).toContain('See all in audit');
  });

  it('caps rendered rows at 6 even with a larger feed', () => {
    const events = [
      ...makeEvents(),
      ...makeEvents(),
      ...makeEvents(),
    ]; // 18 events
    const html = renderToStaticMarkup(<AuditRibbon events={events} />);
    const matches = html.match(/data-testid="audit-ribbon-row"/g) ?? [];
    expect(matches).toHaveLength(6);
  });

  it('shows the muted empty-state line when there are zero events', () => {
    const html = renderToStaticMarkup(<AuditRibbon events={[]} />);
    expect(html).toContain('audit-ribbon-empty');
    expect(html).toContain('No activity in the last 24 hours');
    // No rows rendered.
    expect(html).not.toContain('data-testid="audit-ribbon-row"');
    // Footer "See all" link still renders so the surface stays
    // navigable to the audit page.
    expect(html).toContain('href="/admin/audit"');
  });

  it('renders the optional target as mono detail', () => {
    const html = renderToStaticMarkup(
      <AuditRibbon
        events={[
          {
            ts: '2026-05-29T08:00:00Z',
            source: 'approval',
            actor: 'Program owner',
            action: 'Opened program approval request',
            target: 'prog-apex-cdp-uniq-target',
          },
        ]}
      />,
    );
    expect(html).toContain('prog-apex-cdp-uniq-target');
  });
});
