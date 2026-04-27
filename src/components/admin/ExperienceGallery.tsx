import type { CSSProperties } from 'react';
import { AbarVaLogo } from '@/components/brand';

const COLORS = {
  canvas: '#F7F4EE',
  surface: '#FFFFFF',
  charcoal: '#111318',
  navy: '#1B2B5C',
  skyBlue: '#2F62A3',
  teal: '#2C8F8D',
  mutedBrown: '#8A7869',
  borderSoft: '#E5DFD6',
  mutedAmber: '#B16A2C',
  mutedRed: '#A84646',
  restrainedGreen: '#2D6A4F',
  mutedText: '#4F5563',
};

const sectionStyle: CSSProperties = {
  background: COLORS.surface,
  border: `1px solid ${COLORS.borderSoft}`,
  borderRadius: 12,
  padding: 20,
};

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 20,
  color: COLORS.charcoal,
  fontWeight: 600,
  letterSpacing: '-0.01em',
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
  fontSize: 11,
  color: COLORS.mutedText,
};

const subtleStyle: CSSProperties = {
  margin: '6px 0 0 0',
  fontSize: 14,
  color: COLORS.mutedText,
  lineHeight: 1.5,
};

const colorSwatches = [
  { label: 'Warm Ivory Canvas', value: '#F7F4EE' },
  { label: 'White Surface', value: '#FFFFFF' },
  { label: 'Charcoal Text', value: '#111318' },
  { label: 'Dark Navy', value: '#1B2B5C' },
  { label: 'Dark Sky Blue', value: '#2F62A3' },
  { label: 'Teal Accent', value: '#2C8F8D' },
  { label: 'Muted Brown', value: '#8A7869' },
  { label: 'Border Soft', value: '#E5DFD6' },
  { label: 'Muted Amber', value: '#B16A2C' },
  { label: 'Muted Red', value: '#A84646' },
  { label: 'Restrained Green', value: '#2D6A4F' },
];

const pageArchetypes = [
  'Home / Executive Entry',
  'Programs Portfolio',
  'Program Journey / Nexus Workshop Mode',
  'Source Dashboard',
  'Source Event Canvas',
  'Intelligence / Sentinel Canvas',
  'Control Tower / Atlas Brief',
  'Admin / Steward Setup',
];

const journeyRows = [
  {
    label: 'Program Journey',
    flow: 'Origination → Charter → Diagnose → Design → Execute → Verify',
  },
  {
    label: 'Source Journey',
    flow: 'Strategy → Scope → RFP → Responses → Evaluation → BAFO → Selection → Transition → Value',
  },
  {
    label: 'Artifact Lifecycle',
    flow: 'Draft → Review → Changes → Approved → Locked',
  },
  {
    label: 'Approval Lifecycle',
    flow: 'Pending → In Review → Changes Requested → Approved',
  },
];

const agents = [
  {
    name: 'Nexus',
    mission: 'Guide workflow progress by stage.',
    watches: 'Stage blockers, missing context, next action viability.',
    recommends: 'Safest next action and escalation path.',
  },
  {
    name: 'Sentinel',
    mission: 'Assess evidence quality and confidence.',
    watches: 'Evidence gaps, weak assumptions, stale data.',
    recommends: 'Evidence closure actions before decision gates.',
  },
  {
    name: 'Atlas',
    mission: 'Synthesize executive tradeoffs.',
    watches: 'Cost-risk-value posture across options.',
    recommends: 'Decision posture and concise executive brief.',
  },
  {
    name: 'Steward',
    mission: 'Protect governance and release gates.',
    watches: 'Readiness blockers, policy exceptions, unresolved controls.',
    recommends: 'Gate actions required for safe progression.',
  },
];

const sourceWorkflow = [
  'Dashboard',
  'Event Canvas',
  'Scope',
  'RFP Readiness',
  'Vendor Responses',
  'Pricing Normalization',
  'BAFO',
  'Executive Decision',
];

const dataReadinessStates = [
  'Missing',
  'Requested',
  'Uploaded',
  'Connected',
  'Loaded',
  'Parsed',
  'Available',
  'Usable Evidence',
  'Low Confidence',
  'Stale',
  'Access Restricted',
  'Waived',
];

const artifactStates = [
  'Not Started',
  'Draft',
  'Needs Inputs',
  'In Review',
  'Changes Requested',
  'Approved',
  'Locked',
  'Issued',
  'Superseded',
  'Archived',
];

const checklistItems = [
  'off-white canvas',
  'table-forward',
  'journey visible',
  'agent context clear',
  'minimal icons',
  'no dark full-page dashboard',
  'no generic chatbot wrapper',
];

export function ExperienceGallery() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 16,
      }}
    >
      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Brand Lockup</p>
        <h2 style={sectionTitleStyle}>Approved AbarVa Direction</h2>
        <p style={subtleStyle}>Abar in near-black, Va in dark sky blue. The prior symbol is deferred until the final logo asset is provided.</p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
          <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px dashed ${COLORS.borderSoft}` }}>
            <div style={{ marginBottom: 8, fontSize: 12, color: COLORS.mutedText }}>Nav-size lockup</div>
            <AbarVaLogo
              size="sm"
              width={120}
              height={22}
              style={{ maxWidth: '120px', width: '120px', height: '22px' }}
              aria-hidden={false}
              label="AbarVa wordmark"
            />
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 10, border: `1px dashed ${COLORS.borderSoft}` }}>
            <div style={{ marginBottom: 8, fontSize: 12, color: COLORS.mutedText }}>Hero lockup</div>
            <AbarVaLogo
              size="lg"
              width={240}
              height={44}
              aria-hidden={false}
              label="AbarVa hero wordmark"
            />
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Color System</p>
        <h2 style={sectionTitleStyle}>Approved Palette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {colorSwatches.map((swatch) => (
            <div key={swatch.label} style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: 42, background: swatch.value }} />
              <div style={{ padding: 10, fontSize: 13, color: COLORS.charcoal }}>
                <div style={{ fontWeight: 600 }}>{swatch.label}</div>
                <div style={{ color: COLORS.mutedText, marginTop: 3 }}>{swatch.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Page Archetypes</p>
        <h2 style={sectionTitleStyle}>Surface Inventory</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {pageArchetypes.map((label) => (
            <article key={label} style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: 12, background: '#FCFCFB' }}>
              <div style={{ fontWeight: 600, color: COLORS.charcoal, marginBottom: 8 }}>{label}</div>
              <div style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 8, height: 72, background: 'linear-gradient(180deg, #FFFFFF, #F6F4EF)' }} />
            </article>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Journey Progress System</p>
        <h2 style={sectionTitleStyle}>Canonical Flows</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {journeyRows.map((row) => (
            <div key={row.label} style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 600, color: COLORS.navy }}>{row.label}</div>
              <div style={{ color: COLORS.mutedText, marginTop: 4, lineHeight: 1.5 }}>{row.flow}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Agent Patterns</p>
        <h2 style={sectionTitleStyle}>Nexus · Sentinel · Atlas · Steward</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
          {agents.map((agent) => (
            <article key={agent.name} style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: 12, background: '#FCFCFB' }}>
              <div style={{ fontSize: 12, color: COLORS.mutedText, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                {agent.name}
              </div>
              <div style={{ fontSize: 14, color: COLORS.charcoal, lineHeight: 1.45 }}>
                <strong>Mission:</strong> {agent.mission}
                <br />
                <strong>Watches:</strong> {agent.watches}
                <br />
                <strong>Recommends:</strong> {agent.recommends}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Agent Response Pattern</p>
        <h2 style={sectionTitleStyle}>Three Choices + Custom</h2>
        <div style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: 14, background: '#FCFCFB' }}>
          <div style={{ fontWeight: 600, color: COLORS.navy }}>Nexus says</div>
          <p style={{ margin: '6px 0 12px 0', color: COLORS.charcoal, lineHeight: 1.55 }}>
            “Scope is not pricing-ready because ticket history and SLA baseline are missing.”
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Show missing inputs', 'Generate data request', 'Explain RFP tier', 'Ask something else'].map((action) => (
              <span
                key={action}
                style={{
                  border: `1px solid ${COLORS.borderSoft}`,
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 12,
                  color: COLORS.charcoal,
                  background: COLORS.surface,
                }}
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Source Workflow Gallery</p>
        <h2 style={sectionTitleStyle}>Static Mini-Flow</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sourceWorkflow.map((step, index) => (
            <div key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ border: `1px solid ${COLORS.borderSoft}`, background: '#FCFCFB', padding: '6px 10px', borderRadius: 999, fontSize: 12, color: COLORS.charcoal }}>
                {step}
              </span>
              {index < sourceWorkflow.length - 1 ? <span style={{ color: COLORS.mutedText }}>→</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Data Readiness States</p>
        <h2 style={sectionTitleStyle}>Canonical Evidence State Labels</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
          {dataReadinessStates.map((state) => (
            <div key={state} style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, color: COLORS.charcoal }}>
              {state}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Artifact States</p>
        <h2 style={sectionTitleStyle}>Lifecycle Labels</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
          {artifactStates.map((state) => (
            <div key={state} style={{ border: `1px solid ${COLORS.borderSoft}`, borderRadius: 10, padding: '8px 10px', fontSize: 13, color: COLORS.charcoal }}>
              {state}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <p style={eyebrowStyle}>Visual Acceptance Checklist</p>
        <h2 style={sectionTitleStyle}>Review Gate</h2>
        <ul style={{ margin: 0, paddingLeft: 20, color: COLORS.charcoal, lineHeight: 1.65 }}>
          {checklistItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
