import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import { sourceSectionLabel } from './foundationStyles';
import type { SourceVendorResponseCompleteness, SourceVendorResponseCompletenessRecord } from '@/lib/source/vendor-response-types';

function statusColor(status: SourceVendorResponseCompletenessRecord['completenessStatus']): string {
  if (status === 'complete') {
    return EXPERIENCE_COLORS.journeyComplete;
  }
  if (status === 'partially_complete') {
    return EXPERIENCE_COLORS.accentBlue;
  }
  if (status === 'not_comparable' || status === 'blocked') {
    return EXPERIENCE_COLORS.riskRed;
  }
  return EXPERIENCE_COLORS.riskAmber;
}

function comparabilityColor(status: SourceVendorResponseCompletenessRecord['comparabilityStatus']): string {
  if (status === 'comparable') {
    return EXPERIENCE_COLORS.journeyComplete;
  }
  if (status === 'partially_comparable') {
    return EXPERIENCE_COLORS.accentBlue;
  }
  return EXPERIENCE_COLORS.riskAmber;
}

function blockerText(record: SourceVendorResponseCompletenessRecord): string {
  return record.blockers.length > 0 ? record.blockers[0] : 'No blocking issue recorded.';
}

function summaryLine(readiness: SourceVendorResponseCompleteness) {
  return `${readiness.summary.complete} complete • ${readiness.summary.partiallyComplete} partial • ${readiness.summary.incomplete} incomplete • ${readiness.summary.notComparable} not comparable • ${readiness.summary.blocked} blocked`;
}

export function SourceVendorResponseCompletenessPanel({
  readiness,
}: {
  readiness: SourceVendorResponseCompleteness;
}) {
  return (
    <section style={SECTION} aria-label="Vendor response completeness panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Vendor Response Completeness</div>
          <h4 style={{ margin: '4px 0 0', color: EXPERIENCE_COLORS.textPrimary }}>
            Event vendor response readiness
          </h4>
          <p style={{ margin: '7px 0 0', ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary, textTransform: 'none' }}>
            Deterministic completeness view of vendor responses before comparative evaluation.
          </p>
        </div>
        <div style={TOP_RIBBON}>
          <div style={RIBBON_LABEL}>Comparability readiness</div>
          <div style={{ ...TEXT.small, color: STATUS_COLOR[readiness.comparabilityReadiness] }}>
            {readiness.comparabilityReadiness}
          </div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            {summaryLine(readiness)}
          </div>
        </div>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Nexus guidance">
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary }}>
            Recommended next action
          </div>
          <div style={{ fontWeight: 700, color: EXPERIENCE_COLORS.textPrimary }}>
            {readiness.recommendedNextAction}
          </div>
        </InfoCard>
        <InfoCard title="Blocking signals">
          {readiness.blockers.length > 0 ? (
            <ul style={LIST}>
              {readiness.blockers.slice(0, 6).map((blocker) => (
                <li key={blocker} style={{ marginBottom: 8, color: EXPERIENCE_COLORS.textSecondary }}>
                  {blocker}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary }}>
              No blockers are blocking comparison at this time.
            </div>
          )}
        </InfoCard>
      </div>

      <div style={GRID_FULL}>
        <InfoCard title="Vendor records">
          <div style={{ overflowX: 'auto' }}>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TABLE_CELL}>Vendor</th>
                  <th style={TABLE_CELL}>Response</th>
                  <th style={TABLE_CELL}>Completeness</th>
                  <th style={TABLE_CELL}>Comparability</th>
                  <th style={TABLE_CELL}>Pricing template</th>
                  <th style={TABLE_CELL}>Transition plan</th>
                  <th style={TABLE_CELL}>Assumptions / exclusions</th>
                  <th style={TABLE_CELL}>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {readiness.records.map((vendor) => (
                  <tr key={vendor.vendorId}>
                    <td style={TABLE_BODY_CELL}>
                      <div style={{ fontWeight: 700, color: EXPERIENCE_COLORS.textPrimary }}>
                        {vendor.vendorName}
                      </div>
                    </td>
                    <td style={TABLE_BODY_CELL}>
                      <StatusPill color={statusColor(vendor.completenessStatus)}>
                        {vendor.responseStatus}
                      </StatusPill>
                    </td>
                    <td style={TABLE_BODY_CELL}>
                      <StatusPill color={statusColor(vendor.completenessStatus)}>
                        {vendor.completenessStatus}
                      </StatusPill>
                    </td>
                    <td style={TABLE_BODY_CELL}>
                      <StatusPill color={comparabilityColor(vendor.comparabilityStatus)}>
                        {vendor.comparabilityStatus}
                      </StatusPill>
                    </td>
                    <td style={TABLE_BODY_CELL}>
                      {vendor.pricingTemplateStatus}
                    </td>
                    <td style={TABLE_BODY_CELL}>
                      {vendor.transitionPlanStatus}
                    </td>
                    <td style={TABLE_BODY_CELL}>
                      {vendor.assumptions.length}/{vendor.exclusions.length}
                    </td>
                    <td style={TABLE_BODY_CELL}>
                      <div>{vendor.evidenceStatus}</div>
                      <div style={TEXT.small}>{blockerText(vendor)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>
      </div>
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={CARD}>
      <div style={sourceSectionLabel}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatusPill({
  color,
  children,
}: {
  color: string;
  children: string;
}) {
  return (
    <span style={{ ...PILL, color, borderColor: color }}>
      {children}
    </span>
  );
}

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surface,
  padding: 12,
};

const GRID_TWO_COL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
  gap: 10,
};

const GRID_FULL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
};

const TOP_RIBBON: CSSProperties = {
  minWidth: 240,
  ...sourceSectionLabel,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 10,
  textAlign: 'right',
};

const RIBBON_LABEL: CSSProperties = {
  ...TEXT.small,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: EXPERIENCE_COLORS.textSecondary,
};

const CARD: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 12,
  minWidth: 0,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 3,
  color: EXPERIENCE_COLORS.textSecondary,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 980,
  color: EXPERIENCE_COLORS.textPrimary,
};

const TABLE_CELL: CSSProperties = {
  ...TEXT.small,
  textAlign: 'left',
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  color: EXPERIENCE_COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '8px 10px',
  whiteSpace: 'nowrap',
};

const TABLE_BODY_CELL: CSSProperties = {
  ...TEXT.small,
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: EXPERIENCE_COLORS.textPrimary,
};

const PILL: CSSProperties = {
  border: `1px solid`,
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: '11px',
  lineHeight: '1.1',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const STATUS_COLOR = {
  ready: EXPERIENCE_COLORS.journeyComplete,
  blocked: EXPERIENCE_COLORS.riskRed,
  partial: EXPERIENCE_COLORS.accentBlue,
  complete: EXPERIENCE_COLORS.journeyComplete,
  partially_complete: EXPERIENCE_COLORS.accentBlue,
  incomplete: EXPERIENCE_COLORS.riskAmber,
  not_comparable: EXPERIENCE_COLORS.riskRed,
};

