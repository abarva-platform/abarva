import { COLORS, RADIUS, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  DataLoadGateStatus,
  SetupDataLoadCenterModel,
} from '@/lib/admin/setup-data-load-center';

interface SetupDataLoadCenterProps {
  model: SetupDataLoadCenterModel;
}

const statusCopy: Record<DataLoadGateStatus, string> = {
  ready: 'Ready',
  monitored: 'Monitor',
  needs_configuration: 'Configure',
};

const statusColors: Record<DataLoadGateStatus, { bg: string; fg: string }> = {
  ready: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
  monitored: { bg: COLORS.skyPale, fg: COLORS.navy },
  needs_configuration: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
};

const cardStyle = {
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.md,
  background: COLORS.white,
} as const;

function statusPill(status: DataLoadGateStatus) {
  const colors = statusColors[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        borderRadius: RADIUS.pill,
        padding: '4px 8px',
        background: colors.bg,
        color: colors.fg,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      {statusCopy[status]}
    </span>
  );
}

function metric(label: string, value: string | number, detail: string) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: 15,
        minHeight: 104,
        display: 'grid',
        alignContent: 'start',
        gap: 8,
      }}
    >
      <span
        style={{
          color: COLORS.amberInk,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <strong style={{ color: COLORS.ink, fontSize: 30, lineHeight: 1 }}>{value}</strong>
      <span style={{ color: `${COLORS.ink}aa`, fontSize: 13, lineHeight: 1.35 }}>{detail}</span>
    </div>
  );
}

export function SetupDataLoadCenter({ model }: SetupDataLoadCenterProps) {
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 330px',
          gap: 18,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            ...cardStyle,
            padding: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
          }}
          aria-label="Data load center summary"
        >
          {metric('Rehearsal gates', model.metrics.rehearsalGates, 'SSO through data availability')}
          {metric('Setup segments', model.metrics.setupSegments, 'Azure landing-zone segment keys')}
          {metric('Context templates', model.metrics.contextRegistryTemplates, 'Registry-backed dimensions')}
          {metric('Day One workbooks', model.metrics.dayOneWorkbooks, 'Tenant template manifest')}
        </div>

        <aside
          style={{
            ...cardStyle,
            padding: 18,
            display: 'grid',
            gap: 11,
            alignContent: 'start',
          }}
        >
          <span
            style={{
              color: COLORS.amberInk,
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Current tenant
          </span>
          <strong style={{ fontFamily: TYPOGRAPHY.serif, fontSize: 24, lineHeight: 1.1 }}>
            {model.tenant.tenantName}
          </strong>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '104px minmax(0, 1fr)',
              gap: '8px 10px',
              margin: 0,
              color: `${COLORS.ink}cc`,
              fontSize: 13,
            }}
          >
            <dt style={{ fontWeight: 800 }}>Vertical</dt>
            <dd style={{ margin: 0 }}>{model.tenant.vertical}</dd>
            <dt style={{ fontWeight: 800 }}>Client key</dt>
            <dd style={{ margin: 0 }}>{model.tenant.clientKey}</dd>
            <dt style={{ fontWeight: 800 }}>Manifest</dt>
            <dd style={{ margin: 0 }}>
              {model.tenantManifest
                ? `${model.tenantManifest.workbookCount} workbooks`
                : 'No Day One manifest yet'}
            </dd>
          </dl>
        </aside>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.ink}14` }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Pilot private data-plane rehearsal</h2>
            <p style={{ margin: '5px 0 0', color: `${COLORS.ink}aa`, fontSize: 13, lineHeight: 1.45 }}>
              The rehearsal path proves the operator journey from access through upload, quarantine,
              validation, approval, and agent availability without exposing another client&apos;s data.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {model.rehearsalGates.map((gate, index) => (
              <div
                key={gate.id}
                style={{
                  padding: 14,
                  borderTop: index < 2 ? 'none' : `1px solid ${COLORS.ink}14`,
                  borderLeft: index % 2 === 0 ? 'none' : `1px solid ${COLORS.ink}14`,
                  display: 'grid',
                  gap: 8,
                }}
              >
                {statusPill(gate.status)}
                <strong style={{ fontSize: 14 }}>{gate.label}</strong>
                <p style={{ margin: 0, color: `${COLORS.ink}cc`, fontSize: 13, lineHeight: 1.42 }}>
                  {gate.objective}
                </p>
                <span style={{ color: `${COLORS.ink}99`, fontSize: 12, lineHeight: 1.35 }}>
                  {gate.proof}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.ink}14` }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Rehearsal diagnostics</h2>
            <p style={{ margin: '5px 0 0', color: `${COLORS.ink}aa`, fontSize: 13, lineHeight: 1.45 }}>
              Deterministic checks reuse the queue parser, upload guard, and validation engine.
            </p>
          </div>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '150px minmax(0, 1fr)',
              gap: '12px 14px',
              margin: 0,
              padding: 16,
              fontSize: 13,
            }}
          >
            <dt style={{ fontWeight: 800 }}>Queue schema</dt>
            <dd style={{ margin: 0 }}>{model.privateDataPlane.queueSchema}</dd>
            <dt style={{ fontWeight: 800 }}>Sample segment</dt>
            <dd style={{ margin: 0 }}>{model.privateDataPlane.sampleSegment}</dd>
            <dt style={{ fontWeight: 800 }}>Message probe</dt>
            <dd style={{ margin: 0 }}>{model.privateDataPlane.sampleMessageAccepted ? 'Accepted' : 'Rejected'}</dd>
            <dt style={{ fontWeight: 800 }}>Upload guard</dt>
            <dd style={{ margin: 0 }}>{model.privateDataPlane.uploadGuardDecision}</dd>
            <dt style={{ fontWeight: 800 }}>Validation findings</dt>
            <dd style={{ margin: 0 }}>{model.privateDataPlane.validationProbeFindings}</dd>
          </dl>
        </div>
      </section>

      <section style={cardStyle}>
        <div
          style={{
            padding: '14px 16px',
            borderBottom: `1px solid ${COLORS.ink}14`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18 }}>Dimension and template explorer</h2>
            <p style={{ margin: '5px 0 0', color: `${COLORS.ink}aa`, fontSize: 13, lineHeight: 1.45 }}>
              Shows registry templates and Day One workbook manifests using existing template sources.
            </p>
          </div>
          <span
            style={{
              alignSelf: 'start',
              borderRadius: RADIUS.pill,
              padding: '5px 9px',
              color: COLORS.navy,
              background: COLORS.skyPale,
              fontSize: 12,
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
          >
            {model.templateRows.length} templates
          </span>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, fontSize: 13 }}>
            <thead>
              <tr style={{ color: `${COLORS.ink}aa`, textAlign: 'left' }}>
                {['Template', 'Family', 'Dimension', 'Formats', 'Required fields', 'Owner/source', 'Unlocks'].map((head) => (
                  <th
                    key={head}
                    style={{
                      padding: '10px 12px',
                      borderBottom: `1px solid ${COLORS.ink}14`,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.templateRows.map((template) => (
                <tr key={template.id}>
                  <td style={{ padding: '11px 12px', borderBottom: `1px solid ${COLORS.ink}10`, fontWeight: 800 }}>
                    {template.title}
                  </td>
                  <td style={{ padding: '11px 12px', borderBottom: `1px solid ${COLORS.ink}10` }}>{template.family}</td>
                  <td style={{ padding: '11px 12px', borderBottom: `1px solid ${COLORS.ink}10` }}>{template.dimension}</td>
                  <td style={{ padding: '11px 12px', borderBottom: `1px solid ${COLORS.ink}10` }}>{template.formats}</td>
                  <td style={{ padding: '11px 12px', borderBottom: `1px solid ${COLORS.ink}10` }}>{template.requiredFields}</td>
                  <td style={{ padding: '11px 12px', borderBottom: `1px solid ${COLORS.ink}10` }}>{template.ownerOrSource}</td>
                  <td style={{ padding: '11px 12px', borderBottom: `1px solid ${COLORS.ink}10`, color: `${COLORS.ink}cc` }}>
                    {template.unlocks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...cardStyle, padding: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Manifest coverage</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 12 }}>
          {model.manifestCoverage.map((tenant) => (
            <div
              key={tenant.tenantKey}
              style={{
                border: `1px solid ${COLORS.ink}14`,
                borderRadius: RADIUS.md,
                padding: 12,
                display: 'grid',
                gap: 5,
              }}
            >
              <strong style={{ fontSize: 14 }}>{tenant.displayName}</strong>
              <span style={{ color: `${COLORS.ink}aa`, fontSize: 12 }}>
                {tenant.workbookCount} workbooks · {tenant.version}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
