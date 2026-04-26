'use client'

import {
  buildArchitectureCanvasView,
  type ArchitecturePlane,
  type ArchitectureFlowStep,
  type ArchitectureBuiltDeferredItem,
  type ArchitectureNextAction,
} from '../../lib/admin/architecture-canvas-view'

// ── ARCH5 design tokens (AbarVa canon) ───────────────────────────────────────
const SURFACE = '#FBFAF7'
const CARD = '#FFFFFF'
const BORDER = '#E8E6E1'
const INK = '#0A0C12'
const BODY = '#1F2433'
const MUTED = '#525866'
const NAVY = '#1B2B5C'
const NAVY_DARK = '#0F1E3F'
const NAVY_TINT = '#EEF1F8'
const NEUTRAL_TINT = '#F5F3EE'
const AMBER_TINT = '#F8F1E1'
const AMBER_TEXT = '#7A5A1F'
const SANS = 'DM Sans, sans-serif'

// ── Status chip ──────────────────────────────────────────────────────────────
function StatusChip({ kind, label }: { kind: 'built' | 'partial' | 'deferred'; label: string }) {
  const palette: Record<string, { bg: string; color: string }> = {
    built: { bg: NAVY_TINT, color: NAVY },
    partial: { bg: AMBER_TINT, color: AMBER_TEXT },
    deferred: { bg: NEUTRAL_TINT, color: MUTED },
  }
  const p = palette[kind]
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 600,
        padding: '2px 9px',
        borderRadius: '10px',
        background: p.bg,
        color: p.color,
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: SANS,
        fontSize: '24px',
        fontWeight: 600,
        color: INK,
        margin: '0 0 16px 0',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  )
}

function SectionWrap({ children }: { children: React.ReactNode }) {
  return <section style={{ marginBottom: '40px' }}>{children}</section>
}

function CardBase({ children, padding = 16 }: { children: React.ReactNode; padding?: number }) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding,
      }}
    >
      {children}
    </div>
  )
}

// ── Section 1: Executive Brief (selective dark navy hero) ────────────────────
function ExecutiveBrief({
  headline,
  summary,
  asOfDate,
}: {
  headline: string
  summary: string
  asOfDate: string
}) {
  return (
    <section
      style={{
        background: NAVY_DARK,
        color: '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        marginBottom: 40,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: 0.7,
          marginBottom: 12,
        }}
      >
        Executive architecture brief
      </div>
      <h1
        style={{
          fontFamily: SANS,
          fontSize: 24,
          fontWeight: 600,
          color: '#FFFFFF',
          margin: '0 0 16px 0',
          letterSpacing: '-0.01em',
          lineHeight: 1.35,
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 16,
          lineHeight: 1.6,
          color: '#FFFFFF',
          opacity: 0.85,
          margin: 0,
          maxWidth: 880,
        }}
      >
        {summary}
      </p>
      <div
        style={{
          marginTop: 20,
          fontSize: 12,
          color: '#FFFFFF',
          opacity: 0.6,
          letterSpacing: '0.04em',
        }}
      >
        As of {asOfDate}
      </div>
    </section>
  )
}

// ── Section 2: Planes Map ────────────────────────────────────────────────────
function PlaneCard({ plane }: { plane: ArchitecturePlane }) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: INK }}>
          {plane.name}
        </div>
        <StatusChip kind={plane.builtNow ? 'built' : 'deferred'} label={plane.builtNow ? 'Built' : 'Deferred'} />
      </div>
      <div style={{ fontFamily: SANS, fontSize: 14, color: BODY, lineHeight: 1.5 }}>
        {plane.description}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: MUTED, fontSize: 13, lineHeight: 1.55 }}>
        {plane.responsibilities.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  )
}

function PlanesMap({ planes }: { planes: ArchitecturePlane[] }) {
  return (
    <SectionWrap>
      <SectionTitle>Architecture Planes</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {planes.map((p) => (
          <PlaneCard key={p.id} plane={p} />
        ))}
      </div>
    </SectionWrap>
  )
}

// ── Section 3 & 4: Flow rows ─────────────────────────────────────────────────
function FlowStepBox({ step }: { step: ArchitectureFlowStep }) {
  return (
    <div
      style={{
        flex: '1 1 220px',
        minWidth: 220,
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: NAVY,
          marginBottom: 6,
        }}
      >
        {step.stepId}
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 16,
          fontWeight: 600,
          color: INK,
          marginBottom: 8,
        }}
      >
        {step.label}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: BODY, lineHeight: 1.55 }}>
        {step.description}
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: NAVY,
        fontSize: 22,
        fontWeight: 700,
        padding: '0 4px',
        flex: '0 0 auto',
      }}
    >
      {'▸'}
    </div>
  )
}

function FlowRow({ title, steps }: { title: string; steps: ArchitectureFlowStep[] }) {
  return (
    <SectionWrap>
      <SectionTitle>{title}</SectionTitle>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          gap: 8,
        }}
      >
        {steps.map((step, idx) => (
          <div key={step.stepId} style={{ display: 'contents' }}>
            <FlowStepBox step={step} />
            {idx < steps.length - 1 ? <FlowArrow /> : null}
          </div>
        ))}
      </div>
    </SectionWrap>
  )
}

// ── Section 5: Control Plane Model ───────────────────────────────────────────
function ControlPlanePane({
  pane,
}: {
  pane: { name: string; description: string; responsibilities: string[] }
}) {
  return (
    <CardBase padding={20}>
      <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: INK, marginBottom: 8 }}>
        {pane.name}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 14, color: BODY, lineHeight: 1.55, marginBottom: 12 }}>
        {pane.description}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: MUTED, fontSize: 13, lineHeight: 1.6 }}>
        {pane.responsibilities.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </CardBase>
  )
}

function ControlPlaneModel({
  saas,
  privateData,
  boundary,
}: {
  saas: { name: string; description: string; responsibilities: string[] }
  privateData: { name: string; description: string; responsibilities: string[] }
  boundary: string
}) {
  return (
    <SectionWrap>
      <SectionTitle>SaaS Control Plane + Private Data Plane</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <ControlPlanePane pane={saas} />
        <ControlPlanePane pane={privateData} />
      </div>
      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderLeft: `3px solid ${NAVY}`,
          background: NAVY_TINT,
          borderRadius: 6,
          fontFamily: SANS,
          fontSize: 13,
          color: BODY,
          lineHeight: 1.55,
        }}
      >
        <strong style={{ color: NAVY }}>Boundary:</strong> {boundary}
      </div>
    </SectionWrap>
  )
}

// ── Section 6: Azure Reference ───────────────────────────────────────────────
function AzureReference({
  headline,
  targetServices,
  notes,
}: {
  headline: string
  targetServices: string[]
  notes: string
}) {
  return (
    <SectionWrap>
      <SectionTitle>Azure target reference</SectionTitle>
      <CardBase padding={20}>
        <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: INK, marginBottom: 12 }}>
          {headline}
        </div>
        <ul style={{ margin: '0 0 14px 0', paddingLeft: 18, color: BODY, fontSize: 14, lineHeight: 1.65 }}>
          {targetServices.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{notes}</div>
      </CardBase>
    </SectionWrap>
  )
}

// ── Section 7: Gateway + Registry ────────────────────────────────────────────
function GatewayBlock({ name, description }: { name: string; description: string }) {
  return (
    <CardBase padding={20}>
      <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: INK, marginBottom: 8 }}>
        {name}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 14, color: BODY, lineHeight: 1.55 }}>
        {description}
      </div>
    </CardBase>
  )
}

function GatewayRegistry({
  gateway,
  toolRegistry,
  rule,
}: {
  gateway: { name: string; description: string }
  toolRegistry: { name: string; description: string }
  rule: string
}) {
  return (
    <SectionWrap>
      <SectionTitle>Model Gateway + Tool Registry</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        <GatewayBlock name={gateway.name} description={gateway.description} />
        <GatewayBlock name={toolRegistry.name} description={toolRegistry.description} />
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 600,
          color: NAVY,
          padding: '12px 14px',
          borderRadius: 8,
          background: NAVY_TINT,
        }}
      >
        {rule}
      </div>
    </SectionWrap>
  )
}

// ── Section 8: Agent Mission Runtime ─────────────────────────────────────────
function MissionRuntime({
  headline,
  description,
  components,
}: {
  headline: string
  description: string
  components: string[]
}) {
  return (
    <SectionWrap>
      <SectionTitle>{headline}</SectionTitle>
      <CardBase padding={20}>
        <div style={{ fontFamily: SANS, fontSize: 14, color: BODY, lineHeight: 1.6, marginBottom: 16 }}>
          {description}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {components.map((c) => (
            <span
              key={c}
              style={{
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 500,
                color: NAVY,
                background: NAVY_TINT,
                padding: '6px 12px',
                borderRadius: 999,
                border: `1px solid ${BORDER}`,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </CardBase>
    </SectionWrap>
  )
}

// ── Section 9: Built vs Deferred ─────────────────────────────────────────────
function BuiltDeferredRow({ item }: { item: ArchitectureBuiltDeferredItem }) {
  const labelByStatus: Record<typeof item.status, string> = {
    built: 'Built',
    partial: 'Partial',
    deferred: 'Deferred',
  }
  return (
    <CardBase padding={16}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: INK }}>{item.label}</div>
        <StatusChip kind={item.status} label={labelByStatus[item.status]} />
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{item.detail}</div>
    </CardBase>
  )
}

function BuiltVsDeferred({ items }: { items: ArchitectureBuiltDeferredItem[] }) {
  return (
    <SectionWrap>
      <SectionTitle>Built now vs deferred</SectionTitle>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 12,
        }}
      >
        {items.map((it) => (
          <BuiltDeferredRow key={it.id} item={it} />
        ))}
      </div>
    </SectionWrap>
  )
}

// ── Section 10: Next Architecture Actions ────────────────────────────────────
function NextActions({ actions }: { actions: ArchitectureNextAction[] }) {
  return (
    <SectionWrap>
      <SectionTitle>Next architecture actions</SectionTitle>
      <ol
        style={{
          listStyle: 'none',
          counterReset: 'step',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: 12,
        }}
      >
        {actions.map((action, idx) => (
          <li
            key={action.actionId}
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                flex: '0 0 auto',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: NAVY,
                color: '#FFFFFF',
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4 }}>
                {action.label}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, lineHeight: 1.55 }}>
                {action.rationale}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </SectionWrap>
  )
}

// ── Top-level component ──────────────────────────────────────────────────────
export function ArchitectureCanvas() {
  const data = buildArchitectureCanvasView()
  return (
    <div
      style={{
        background: SURFACE,
        padding: '32px clamp(16px, 4vw, 48px)',
        fontFamily: SANS,
        color: BODY,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <ExecutiveBrief
          headline={data.executiveBrief.headline}
          summary={data.executiveBrief.summary}
          asOfDate={data.executiveBrief.asOfDate}
        />
        <PlanesMap planes={data.planes} />
        <FlowRow title={data.requestFlow.title} steps={data.requestFlow.steps} />
        <FlowRow title={data.dataFlow.title} steps={data.dataFlow.steps} />
        <ControlPlaneModel
          saas={data.controlPlaneModel.saasControlPlane}
          privateData={data.controlPlaneModel.privateDataPlane}
          boundary={data.controlPlaneModel.boundary}
        />
        <AzureReference
          headline={data.azureReference.headline}
          targetServices={data.azureReference.targetServices}
          notes={data.azureReference.notes}
        />
        <GatewayRegistry
          gateway={data.modelGatewayBoundary.gateway}
          toolRegistry={data.modelGatewayBoundary.toolRegistry}
          rule={data.modelGatewayBoundary.rule}
        />
        <MissionRuntime
          headline={data.agentMissionRuntime.headline}
          description={data.agentMissionRuntime.description}
          components={data.agentMissionRuntime.components}
        />
        <BuiltVsDeferred items={data.builtVsDeferred} />
        <NextActions actions={data.nextActions} />
        <footer
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: `1px solid ${BORDER}`,
            fontFamily: SANS,
            fontSize: 12,
            color: MUTED,
            lineHeight: 1.6,
          }}
        >
          {data.caveat}
          <div style={{ marginTop: 6, opacity: 0.75 }}>Generated {data.generatedAt}</div>
        </footer>
      </div>
    </div>
  )
}

export default ArchitectureCanvas
