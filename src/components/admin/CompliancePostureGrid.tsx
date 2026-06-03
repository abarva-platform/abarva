/**
 * CompliancePostureGrid · Wave 3 PR-4
 *
 * Renders the five posture cards on `/admin/compliance` in a responsive
 * grid. Card shape per
 * `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §7 Wave 3 PR-4:
 *
 *   - SOC 2 posture     · status, audit date, control owner
 *   - GDPR data residency · regions, DPA status, sub-processor list
 *   - DPA template      · href, last-updated, owner
 *   - Breach SLA        · hours, incident playbook
 *   - OFAC screening    · provider, owner, cadence, evidence
 *
 * Honesty doctrine: status pills use the canon palette but never
 * claim "ready/certified" without an actual certification. The
 * status-label string from the config is authoritative; this
 * component renders it verbatim.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type { CompliancePosture } from '@/lib/admin/broker/compliance-posture-broker';
import type { ComplianceCardStatus } from '@/lib/admin/compliance-config';

export interface CompliancePostureGridProps {
  posture: CompliancePosture;
  /** Short "Reviewed YYYY-MM-DD" stamp surfaced below the grid. */
  asOfLabel: string;
}

interface StatusPillStyle {
  bg: string;
  fg: string;
  label: string;
}

function statusPill(status: ComplianceCardStatus): StatusPillStyle {
  switch (status) {
    case 'certified':
      return { bg: SETUP.mintSoft, fg: SETUP.mint, label: 'Certified' };
    case 'committed':
      return { bg: SETUP.skyPale, fg: SETUP.signal, label: 'Committed' };
    case 'in_progress':
      return { bg: SETUP.amberSoft, fg: SETUP.amber, label: 'In progress' };
    case 'scheduled':
      return { bg: SETUP.skyPale, fg: SETUP.signal, label: 'Scheduled' };
    case 'not_applicable':
      return { bg: SETUP.grayBg, fg: SETUP.inkMuted, label: 'N/A' };
  }
}

function CardShell({
  eyebrow,
  title,
  status,
  statusLabel,
  dataSource,
  children,
}: {
  eyebrow: string;
  title: string;
  status: ComplianceCardStatus;
  statusLabel: string;
  dataSource: 'config' | 'live';
  children: React.ReactNode;
}) {
  const pill = statusPill(status);
  return (
    <article
      data-compliance-card={eyebrow.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
      style={{
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '20px 22px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minHeight: 220,
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ ...SETUP_TYPE.tileLabel }}>{eyebrow}</span>
          <span
            style={{
              fontFamily: SETUP.mono,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: SETUP_RADIUS.pill,
              background: pill.bg,
              color: pill.fg,
            }}
            aria-label={`Status: ${pill.label}`}
          >
            {pill.label}
          </span>
        </div>
        <h2 style={{ ...SETUP_TYPE.cardH2 }}>{title}</h2>
        <p
          style={{
            ...SETUP_TYPE.bodySans,
            color: SETUP.inkMuted,
            margin: 0,
          }}
        >
          {statusLabel}
        </p>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          ...SETUP_TYPE.bodySans,
          color: SETUP.inkSoft,
        }}
      >
        {children}
      </div>
      <footer
        style={{
          marginTop: 'auto',
          paddingTop: 10,
          borderTop: `1px solid ${SETUP.cardLine}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: SETUP.mono,
            fontSize: '10.5px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SETUP.inkFaint,
          }}
        >
          Source · {dataSource}
        </span>
      </footer>
    </article>
  );
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: 12,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: SETUP.mono,
          fontSize: '10.5px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: SETUP.inkFaint,
        }}
      >
        {label}
      </span>
      <span style={{ color: SETUP.ink }}>{value}</span>
    </div>
  );
}

export function CompliancePostureGrid({
  posture,
  asOfLabel,
}: CompliancePostureGridProps) {
  const { soc2, gdpr, dpa, breachSla, ofacScreening } = posture;
  return (
    <section
      data-compliance-grid
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        <CardShell
          eyebrow="01 · SOC 2"
          title="SOC 2 posture"
          status={soc2.status}
          statusLabel={soc2.statusLabel}
          dataSource={soc2.dataSource}
        >
          <FieldRow label="Scope" value={soc2.scope} />
          <FieldRow
            label="Auditor"
            value={soc2.auditor ?? 'Not yet engaged'}
          />
          <FieldRow label="Control owner" value={soc2.controlOwner} />
          <FieldRow
            label="Last audit"
            value={soc2.lastAuditDate ?? '—'}
          />
          <FieldRow
            label="Next audit"
            value={soc2.nextAuditDate ?? '—'}
          />
          <p
            style={{
              margin: '4px 0 0',
              color: SETUP.inkMuted,
              fontStyle: 'italic',
            }}
          >
            {soc2.notes}
          </p>
        </CardShell>

        <CardShell
          eyebrow="02 · GDPR"
          title="Data residency & DPA"
          status={gdpr.status}
          statusLabel={gdpr.statusLabel}
          dataSource={gdpr.dataSource}
        >
          <FieldRow
            label="Regions"
            value={gdpr.dataResidencyRegions.join(' · ')}
          />
          <FieldRow label="DPA status" value={gdpr.dpaStatus} />
          <FieldRow label="Lawful basis" value={gdpr.lawfulBasis} />
          <FieldRow
            label="Sub-processors"
            value={
              <a
                href={gdpr.subProcessorListHref}
                style={{ color: SETUP.signal, textDecoration: 'none' }}
              >
                View list →
              </a>
            }
          />
          <p
            style={{
              margin: '4px 0 0',
              color: SETUP.inkMuted,
              fontStyle: 'italic',
            }}
          >
            {gdpr.notes}
          </p>
        </CardShell>

        <CardShell
          eyebrow="03 · DPA"
          title="Data Processing Addendum"
          status={dpa.status}
          statusLabel={dpa.statusLabel}
          dataSource={dpa.dataSource}
        >
          <FieldRow
            label="Template"
            value={
              <a
                href={dpa.templateHref}
                style={{ color: SETUP.signal, textDecoration: 'none' }}
              >
                Open template →
              </a>
            }
          />
          <FieldRow label="Last updated" value={dpa.lastUpdated} />
          <FieldRow label="Owner" value={dpa.owner} />
          <p
            style={{
              margin: '4px 0 0',
              color: SETUP.inkMuted,
              fontStyle: 'italic',
            }}
          >
            {dpa.notes}
          </p>
        </CardShell>

        <CardShell
          eyebrow="04 · BREACH SLA"
          title="Breach-notification SLA"
          status={breachSla.status}
          statusLabel={breachSla.statusLabel}
          dataSource={breachSla.dataSource}
        >
          <FieldRow
            label="Window"
            value={`${breachSla.notificationHours}h notification`}
          />
          <FieldRow
            label="Triggers"
            value={breachSla.triggerSeverities.join(' · ')}
          />
          <FieldRow label="Incident lead" value={breachSla.incidentLead} />
          <FieldRow
            label="Playbook"
            value={
              <a
                href={breachSla.playbookHref}
                style={{ color: SETUP.signal, textDecoration: 'none' }}
              >
                Open runbook →
              </a>
            }
          />
          <p
            style={{
              margin: '4px 0 0',
              color: SETUP.inkMuted,
              fontStyle: 'italic',
            }}
          >
            {breachSla.notes}
          </p>
        </CardShell>

        <CardShell
          eyebrow="05 · OFAC"
          title="Customer sanctions screening"
          status={ofacScreening.status}
          statusLabel={ofacScreening.statusLabel}
          dataSource={ofacScreening.dataSource}
        >
          <FieldRow
            label="Provider"
            value={ofacScreening.screeningProvider}
          />
          <FieldRow label="Owner" value={ofacScreening.reviewOwner} />
          <FieldRow label="Cadence" value={ofacScreening.cadence} />
          <FieldRow
            label="Evidence"
            value={ofacScreening.evidenceRequired.join(' · ')}
          />
          <p
            style={{
              margin: '4px 0 0',
              color: SETUP.inkMuted,
              fontStyle: 'italic',
            }}
          >
            {ofacScreening.notes}
          </p>
        </CardShell>
      </div>
      <p
        data-compliance-as-of
        style={{
          ...SETUP_TYPE.cardMeta,
          margin: '4px 0 0',
        }}
      >
        {asOfLabel}
      </p>
    </section>
  );
}
