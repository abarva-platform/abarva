/**
 * CompliancePostureGrid · Wave 3 PR-4 · tests
 *
 * Asserts the five cards render with their headings and that the
 * pilot-stage honesty doctrine holds — no "Certified" pill is
 * rendered for SOC 2 from the stub data. Stubs the posture shape
 * inline so the test is independent of `compliance-config.ts` edits.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { CompliancePostureGrid } from '../CompliancePostureGrid';
import type { CompliancePosture } from '@/lib/admin/broker/compliance-posture-broker';

function fixturePosture(): CompliancePosture {
  return {
    soc2: {
      status: 'in_progress',
      statusLabel: 'In progress · readiness assessment',
      scope: 'Security',
      auditor: null,
      controlOwner: 'Test Owner',
      lastAuditDate: null,
      nextAuditDate: null,
      dataSource: 'config',
      notes: 'Pre-audit readiness.',
    },
    gdpr: {
      status: 'committed',
      statusLabel: 'Committed · EU data plane',
      dataResidencyRegions: ['EU (Frankfurt)'],
      dpaStatus: 'v1 available',
      subProcessorListHref: '/admin/policies',
      lawfulBasis: 'Contract',
      dataSource: 'config',
      notes: 'Tenant rows reside in EU.',
    },
    dpa: {
      status: 'committed',
      statusLabel: 'Template v1',
      templateHref: '/docs/legal/dpa.md',
      lastUpdated: '2026-05-15',
      owner: 'Test Owner',
      dataSource: 'config',
      notes: 'Counsel-reviewed.',
    },
    breachSla: {
      status: 'committed',
      statusLabel: '72h window',
      notificationHours: 72,
      triggerSeverities: ['high', 'critical'],
      playbookHref: '/docs/runbooks/incident-response.md',
      incidentLead: 'Test Owner',
      dataSource: 'config',
      notes: 'GDPR Art. 33 aligned.',
    },
    ofacScreening: {
      status: 'committed',
      statusLabel: 'Screen before customer onboarding',
      screeningProvider: 'OFAC Sanctions List Search',
      reviewOwner: 'Test Owner',
      cadence: 'Before onboarding and quarterly',
      evidenceRequired: [
        'customer_name',
        'screened_at',
        'manual_review_disposition',
      ],
      dataSource: 'config',
      notes: 'Possible matches fail closed until reviewed.',
    },
    lastReviewedAt: '2026-05-30',
  };
}

describe('CompliancePostureGrid', () => {
  it('renders all five posture card titles', () => {
    const html = renderToStaticMarkup(
      <CompliancePostureGrid
        posture={fixturePosture()}
        asOfLabel="Reviewed 2026-05-30"
      />,
    );
    expect(html).toContain('SOC 2 posture');
    expect(html).toContain('Data residency &amp; DPA');
    expect(html).toContain('Data Processing Addendum');
    expect(html).toContain('Breach-notification SLA');
    expect(html).toContain('Customer sanctions screening');
  });

  it('renders the as-of stamp', () => {
    const html = renderToStaticMarkup(
      <CompliancePostureGrid
        posture={fixturePosture()}
        asOfLabel="Reviewed 2026-05-30"
      />,
    );
    expect(html).toContain('Reviewed 2026-05-30');
  });

  it('does NOT render a "Certified" pill for SOC 2 when in_progress', () => {
    const html = renderToStaticMarkup(
      <CompliancePostureGrid
        posture={fixturePosture()}
        asOfLabel="Reviewed 2026-05-30"
      />,
    );
    // The SOC 2 card must render the "In progress" pill, not Certified.
    expect(html).toContain('In progress');
    // No card in the fixture is certified, so "Certified" must not appear.
    expect(html).not.toContain('>Certified<');
  });

  it('surfaces the 72h breach window verbatim', () => {
    const html = renderToStaticMarkup(
      <CompliancePostureGrid
        posture={fixturePosture()}
        asOfLabel="Reviewed 2026-05-30"
      />,
    );
    expect(html).toContain('72h notification');
  });

  it('surfaces OFAC screening cadence and evidence requirements', () => {
    const html = renderToStaticMarkup(
      <CompliancePostureGrid
        posture={fixturePosture()}
        asOfLabel="Reviewed 2026-05-30"
      />,
    );
    expect(html).toContain('Before onboarding and quarterly');
    expect(html).toContain('manual_review_disposition');
  });

  it('marks every card with its dataSource', () => {
    const html = renderToStaticMarkup(
      <CompliancePostureGrid
        posture={fixturePosture()}
        asOfLabel="Reviewed 2026-05-30"
      />,
    );
    // Five cards × one "Source · config" footer each.
    const matches = html.match(/Source · config/g) ?? [];
    expect(matches.length).toBe(5);
  });
});
