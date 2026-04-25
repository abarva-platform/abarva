// ADM2 · Steward Setup / Admin control-center component.
//
// Apple-like landing surface for the Setup / Admin control plane.
// Renders the deterministic ADM2 read model as the five canonical
// zones from ADM1 §F:
//   A · Admin header / setup health
//   B · Steward Brief
//   C · Readiness cards (datasets · evidence · users · connectors · agents)
//   D · Recommended actions / explorer rail
//   E · Detail placeholder / object inspector slot
//
// No live Steward runtime, no model call, no Date.now(). Component
// imports are restricted to next/link and the ADM2 read-model module.

import Link from 'next/link';
import {
  buildStewardSetupReadinessView,
  type AdminModuleReadiness,
  type AdminRecommendedAction,
  type AgentReadiness,
  type DatasetDomainReadiness,
  type EvidenceReadinessAggregate,
  type StewardBrief,
  type StewardSetupReadinessView,
} from '@/lib/admin/steward-setup-readiness';

interface StewardSetupControlCenterProps {
  view?: StewardSetupReadinessView;
}

const COLORS = {
  ink: '#0F0E0D',
  body: '#3D3B38',
  muted: '#706D66',
  mutedSoft: '#9A958E',
  border: '#E8E6E3',
  borderSoft: '#F2F1F0',
  surface: '#FAFAF9',
  card: '#FFFFFF',
  surface2: '#F7F6F3',
  accent: '#0E9F8C',
  accentSoft: 'rgba(14,159,140,0.10)',
  amber: '#B45309',
  amberSoft: 'rgba(180,83,9,0.10)',
  red: '#C53030',
  redSoft: 'rgba(197,48,48,0.10)',
  teal: '#1f7a8c',
  tealSoft: 'rgba(31,122,140,0.10)',
} as const;

const MONO = "'JetBrains Mono', 'Courier New', monospace";

export function StewardSetupControlCenter({ view }: StewardSetupControlCenterProps) {
  const resolvedView = view ?? buildStewardSetupReadinessView();
  const { brief, domains, evidenceAggregate, agents, modules, recommendedActions } =
    resolvedView;
  const accent = healthAccent(resolvedView.setupHealth);
  const accentBg = healthAccentBg(resolvedView.setupHealth);

  return (
    <section
      aria-label="Steward setup control center"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Zone A · Admin header / setup health */}
      <header
        style={{
          paddingBottom: 16,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.mutedSoft,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {resolvedView.workspaceLabel} · Setup · seed-only
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 26,
                fontWeight: 600,
                lineHeight: 1.2,
                color: COLORS.ink,
              }}
            >
              Setup home
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 14,
                color: COLORS.body,
                lineHeight: 1.55,
                maxWidth: 760,
              }}
            >
              {resolvedView.setupHealthRationale}
            </p>
          </div>
          <Chip
            label={`setup · ${resolvedView.setupHealth}`}
            color={accent}
            background={accentBg}
            tooltip={resolvedView.setupHealthRationale}
          />
        </div>
      </header>

      {/* Zone B · Steward Brief */}
      <StewardBriefPanel brief={brief} />

      {/* Zone C · Readiness cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14,
        }}
      >
        <DatasetDomainsCard domains={domains} />
        <EvidenceReadinessCard evidence={evidenceAggregate} />
        <UsersAccessCard userSecurityRisk={brief.userSecurityRisk} />
        <ConnectorsCard connectorRisk={brief.connectorRisk} />
        <AgentReadinessCard agents={agents} />
      </div>

      {/* Zone D · Recommended actions / explorer rail */}
      <RecommendedActionsBlock actions={recommendedActions} modules={modules} />

      {/* Zone E · Detail placeholder / object inspector slot */}
      <ObjectInspectorPlaceholder />
    </section>
  );
}

// --- Zone B ----------------------------------------------------------

function StewardBriefPanel({ brief }: { brief: StewardBrief }) {
  const accent = healthAccent(brief.tenantSetupHealth.label);
  const accentBg = healthAccentBg(brief.tenantSetupHealth.label);
  return (
    <article
      aria-label="Steward brief"
      style={{
        padding: '20px 22px',
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: accent,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Steward brief · {brief.sourceLabel.replace(/_/g, ' ')}
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.3,
              color: COLORS.ink,
            }}
          >
            {brief.title}
          </h2>
        </div>
        <Chip
          label={`health · ${brief.tenantSetupHealth.label}`}
          color={accent}
          background={accentBg}
          tooltip={brief.interpretationBasis}
        />
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <BriefLine label="Setup health" value={brief.tenantSetupHealth.rationale} tone={accent} />
        <BriefLine label="Data + evidence" value={brief.dataEvidenceReadiness} />
        <BriefLine label="User / security" value={brief.userSecurityRisk} />
        <BriefLine label="Connectors" value={brief.connectorRisk} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SectionLabel>Top admin gaps · {brief.topAdminGaps.length}</SectionLabel>
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {brief.topAdminGaps.map((gap) => (
            <li key={gap.id}>
              <Link
                href={gap.routeHref}
                style={{ fontSize: 13, color: COLORS.ink, textDecoration: 'none' }}
              >
                <span style={{ color: COLORS.accent, fontWeight: 600 }}>→</span>{' '}
                {gap.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SectionLabel>Agent readiness</SectionLabel>
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {brief.agentReadiness.map((line) => (
            <li
              key={line.agent}
              style={{
                fontSize: 12,
                color: COLORS.body,
                lineHeight: 1.55,
              }}
            >
              {line.sentence}
            </li>
          ))}
        </ul>
      </div>

      <div
        style={{
          padding: '12px 14px',
          background: COLORS.surface2,
          border: `1px dashed ${COLORS.border}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <SectionLabel>Recommended next action</SectionLabel>
        <Link
          href={brief.recommendedNextAction.routeHref}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.ink,
            textDecoration: 'none',
            lineHeight: 1.5,
          }}
        >
          {brief.recommendedNextAction.label} →
        </Link>
        <span style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>
          {brief.recommendedNextAction.reason}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: `1px dashed ${COLORS.border}` }}>
        <SectionLabel>Ask Steward · suggested follow-ups · {brief.suggestedFollowUps.length}</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {brief.suggestedFollowUps.map((followUp) => (
            <button
              key={followUp.id}
              type="button"
              disabled
              aria-disabled="true"
              data-steward-followup-id={followUp.id}
              title={`${followUp.reason} · live Steward runtime is deferred`}
              style={{
                padding: '8px 12px',
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                color: COLORS.muted,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'not-allowed',
                opacity: 0.85,
                fontFamily: 'inherit',
                textAlign: 'left',
                display: 'inline-flex',
                flexDirection: 'column',
                gap: 2,
                maxWidth: 320,
              }}
            >
              <span style={{ color: COLORS.ink }}>{followUp.label}</span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLORS.mutedSoft,
                  fontWeight: 700,
                }}
              >
                deferred · live steward runtime
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          color: COLORS.mutedSoft,
          fontStyle: 'italic',
          paddingTop: 4,
        }}
      >
        {brief.interpretationBasis}
      </div>
    </article>
  );
}

// --- Zone C cards ----------------------------------------------------

function DatasetDomainsCard({ domains }: { domains: ReadonlyArray<DatasetDomainReadiness> }) {
  const ready = domains.filter((d) => d.status === 'ready').length;
  const partial = domains.filter((d) => d.status === 'partial').length;
  const notStarted = domains.filter((d) => d.status === 'not_started').length;
  const blocked = domains.filter((d) => d.status === 'blocked').length;
  return (
    <Card title="Dataset domains" eyebrow={`${domains.length} canonical`} routeHref="/platform/admin/data">
      <CardStat label="ready" value={String(ready)} />
      <CardStat label="partial" value={String(partial)} />
      <CardStat label="not started" value={String(notStarted)} />
      {blocked > 0 ? <CardStat label="blocked" value={String(blocked)} tone={COLORS.red} /> : null}
      <DomainList domains={domains.slice(0, 4)} />
    </Card>
  );
}

function DomainList({ domains }: { domains: ReadonlyArray<DatasetDomainReadiness> }) {
  return (
    <ul
      style={{
        margin: '6px 0 0',
        paddingLeft: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {domains.map((d) => (
        <li
          key={d.key}
          style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}
        >
          <span style={{ color: COLORS.body }}>
            {d.ordinal}. {d.name}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: domainStatusColor(d.status),
              fontWeight: 700,
            }}
          >
            {d.status.replace(/_/g, ' ')}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EvidenceReadinessCard({ evidence }: { evidence: EvidenceReadinessAggregate }) {
  const states: Array<{ key: keyof EvidenceReadinessAggregate['byState']; label: string }> = [
    { key: 'loaded', label: 'loaded' },
    { key: 'parsed', label: 'parsed' },
    { key: 'indexed', label: 'indexed' },
    { key: 'classified', label: 'classified' },
    { key: 'scoped', label: 'scoped' },
    { key: 'cited', label: 'cited' },
    { key: 'quality_checked', label: 'quality checked' },
    { key: 'usable_as_evidence', label: 'usable' },
    { key: 'blocked', label: 'blocked' },
  ];
  return (
    <Card title="Evidence readiness" eyebrow="loaded → usable" routeHref="/platform/admin/quality">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <CardStat label="loaded" value={String(evidence.totalLoaded)} />
        <CardStat label="available" value={String(evidence.totalAvailable)} />
        <CardStat label="usable" value={String(evidence.totalUsable)} tone={COLORS.accent} />
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {states.map((s) => (
          <li
            key={s.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: MONO,
              fontSize: 11,
              color: s.key === 'blocked' ? COLORS.red : COLORS.muted,
            }}
          >
            <span>{s.label}</span>
            <span style={{ fontWeight: 700 }}>{evidence.byState[s.key]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function UsersAccessCard({ userSecurityRisk }: { userSecurityRisk: string }) {
  return (
    <Card title="Users & access" eyebrow="posture" routeHref="/platform/admin/users">
      <p style={{ margin: 0, fontSize: 13, color: COLORS.body, lineHeight: 1.55 }}>
        {userSecurityRisk}
      </p>
    </Card>
  );
}

function ConnectorsCard({ connectorRisk }: { connectorRisk: string }) {
  return (
    <Card title="Connectors" eyebrow="sync health" routeHref="/platform/admin/connectors">
      <p style={{ margin: 0, fontSize: 13, color: COLORS.body, lineHeight: 1.55 }}>
        {connectorRisk}
      </p>
    </Card>
  );
}

function AgentReadinessCard({ agents }: { agents: ReadonlyArray<AgentReadiness> }) {
  return (
    <Card title="Agent readiness" eyebrow="nexus · sentinel · atlas · steward" routeHref="/platform/admin">
      <ul
        style={{
          margin: 0,
          paddingLeft: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {agents.map((a) => (
          <li
            key={a.agent}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(72px, 96px) 1fr',
              gap: 8,
              alignItems: 'baseline',
              fontSize: 12,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: agentStatusColor(a.status),
              }}
            >
              {a.agent} · {a.status}
            </span>
            <span style={{ color: COLORS.body, lineHeight: 1.5 }}>
              {a.nextAdminAction}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// --- Zone D ----------------------------------------------------------

function RecommendedActionsBlock({
  actions,
  modules,
}: {
  actions: ReadonlyArray<AdminRecommendedAction>;
  modules: ReadonlyArray<AdminModuleReadiness>;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.2fr)',
        gap: 14,
      }}
    >
      <Card title="Recommended actions" eyebrow={`${actions.length} ranked`}>
        <ol
          style={{
            margin: 0,
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {actions.map((a) => (
            <li key={a.id} style={{ fontSize: 13, lineHeight: 1.55 }}>
              <Link
                href={a.routeHref}
                style={{ color: COLORS.ink, fontWeight: 600, textDecoration: 'none' }}
              >
                {a.label} →
              </Link>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{a.reason}</div>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Admin modules" eyebrow={`${modules.length} canonical`}>
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {modules.map((m) => (
            <li
              key={m.key}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(64px, 80px) 1fr',
                gap: 8,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: moduleStatusColor(m.status),
                }}
              >
                {m.status}
              </span>
              <Link
                href={m.routeHref}
                style={{ color: COLORS.ink, textDecoration: 'none' }}
              >
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <div style={{ color: COLORS.muted, fontSize: 11 }}>{m.description}</div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// --- Zone E ----------------------------------------------------------

function ObjectInspectorPlaceholder() {
  return (
    <div
      style={{
        padding: '14px 16px',
        background: COLORS.surface2,
        border: `1px dashed ${COLORS.border}`,
        borderRadius: 10,
        fontSize: 12,
        color: COLORS.muted,
        lineHeight: 1.55,
      }}
    >
      Object inspector slot · selecting a dataset, user, connector, or agent will open
      a deterministic detail drawer here once the per-object slices land (ADM4 +
      ADM5 + ADM7 + ADM9). Today the slot is honest and empty.
    </div>
  );
}

// --- Shared atoms ----------------------------------------------------

function Card({
  title,
  eyebrow,
  routeHref,
  children,
}: {
  title: string;
  eyebrow?: string;
  routeHref?: string;
  children: React.ReactNode;
}) {
  const head = (
    <header
      style={{
        marginBottom: 10,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <div>
        {eyebrow ? (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.mutedSoft,
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.ink,
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
      </div>
      {routeHref ? (
        <Link
          href={routeHref}
          style={{
            fontSize: 11,
            color: COLORS.accent,
            fontFamily: MONO,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          open →
        </Link>
      ) : null}
    </header>
  );
  return (
    <article
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {head}
      {children}
    </article>
  );
}

function CardStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: tone ?? COLORS.ink,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function BriefLine({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 160px) 1fr',
        gap: 12,
        alignItems: 'baseline',
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: COLORS.mutedSoft,
          fontWeight: 700,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: tone ?? COLORS.ink, lineHeight: 1.55 }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLORS.mutedSoft,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function Chip({
  label,
  color,
  background,
  tooltip,
}: {
  label: string;
  color: string;
  background: string;
  tooltip?: string;
}) {
  return (
    <span
      title={tooltip}
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 999,
        background,
        color,
      }}
    >
      {label}
    </span>
  );
}

// --- Color helpers ---------------------------------------------------

function healthAccent(label: string): string {
  switch (label) {
    case 'ready':
      return COLORS.accent;
    case 'partial':
      return COLORS.amber;
    case 'blocked':
      return COLORS.red;
    default:
      return COLORS.mutedSoft;
  }
}

function healthAccentBg(label: string): string {
  switch (label) {
    case 'ready':
      return COLORS.accentSoft;
    case 'partial':
      return COLORS.amberSoft;
    case 'blocked':
      return COLORS.redSoft;
    default:
      return 'rgba(26,22,18,0.06)';
  }
}

function domainStatusColor(status: string): string {
  switch (status) {
    case 'ready':
      return COLORS.accent;
    case 'partial':
      return COLORS.amber;
    case 'not_started':
      return COLORS.mutedSoft;
    case 'blocked':
      return COLORS.red;
    default:
      return COLORS.mutedSoft;
  }
}

function agentStatusColor(status: string): string {
  switch (status) {
    case 'ready':
      return COLORS.accent;
    case 'partial':
      return COLORS.amber;
    case 'blocked':
      return COLORS.red;
    default:
      return COLORS.mutedSoft;
  }
}

function moduleStatusColor(status: string): string {
  switch (status) {
    case 'live':
      return COLORS.accent;
    case 'partial':
      return COLORS.amber;
    case 'planned':
      return COLORS.mutedSoft;
    case 'deferred':
      return COLORS.muted;
    default:
      return COLORS.mutedSoft;
  }
}
