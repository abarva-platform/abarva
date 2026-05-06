import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceVendorResponseCompleteness, SourceVendorResponseCompletenessRecord } from '@/lib/source/vendor-response-types';

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

function statusColor(status: SourceVendorResponseCompletenessRecord['completenessStatus']): string {
  if (status === 'complete') {
    return SHELL.MINT_TEXT;
  }
  if (status === 'partially_complete') {
    return SHELL.INK_MID;
  }
  if (status === 'not_comparable' || status === 'blocked') {
    return SHELL.RUST_TEXT;
  }
  return SHELL.PEACH_TEXT;
}

function comparabilityColor(status: SourceVendorResponseCompletenessRecord['comparabilityStatus']): string {
  if (status === 'comparable') {
    return SHELL.MINT_TEXT;
  }
  if (status === 'partially_comparable') {
    return SHELL.INK_MID;
  }
  return SHELL.PEACH_TEXT;
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
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Vendor Response Completeness</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>
            Event vendor response readiness
          </h4>
          <p style={{ margin: '7px 0 0', ...sourceSectionLabel, color: SHELL.INK_MUTED, textTransform: 'none' }}>
            Deterministic completeness view of vendor responses before comparative evaluation.
          </p>
        </div>
        <div style={TOP_RIBBON}>
          <div style={RIBBON_LABEL}>Comparability readiness</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: STATUS_COLOR[readiness.comparabilityReadiness] }}>
            {readiness.comparabilityReadiness}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            {summaryLine(readiness)}
          </div>
        </div>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Sentinel guidance">
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_MUTED }}>
            Recommended next action
          </div>
          <div style={{ fontWeight: 700, color: SHELL.INK }}>
            {readiness.recommendedNextAction}
          </div>
        </InfoCard>
        <InfoCard title="Blocking signals">
          {readiness.blockers.length > 0 ? (
            <ul style={LIST}>
              {readiness.blockers.slice(0, 6).map((blocker) => (
                <li key={blocker} style={{ marginBottom: 8, color: SHELL.INK_MUTED }}>
                  {blocker}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ ...sourceSectionLabel, color: SHELL.INK_MUTED }}>
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
                      <div style={{ fontWeight: 700, color: SHELL.INK }}>
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
                      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4 }}>{blockerText(vendor)}</div>
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 10,
  textAlign: 'right',
};

const RIBBON_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: SHELL.INK_MUTED,
};

const CARD: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 12,
  minWidth: 0,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 3,
  color: SHELL.INK_MUTED,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 980,
  color: SHELL.INK,
};

const TABLE_CELL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  textAlign: 'left',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  color: SHELL.INK_MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '8px 10px',
  whiteSpace: 'nowrap',
};

const TABLE_BODY_CELL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: SHELL.INK,
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
  ready: SHELL.MINT_TEXT,
  blocked: SHELL.RUST_TEXT,
  partial: SHELL.INK_MID,
  complete: SHELL.MINT_TEXT,
  partially_complete: SHELL.INK_MID,
  incomplete: SHELL.PEACH_TEXT,
  not_comparable: SHELL.RUST_TEXT,
};
