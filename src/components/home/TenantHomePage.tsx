// Tenant home page · masthead + sidebar + 5 numbered sections.
//
// Locked design from docs/training/setup-home-{apex,firstcap,meridian}.html.
// Replaces the prior shell-home (AppShell + AgentCanvas + HOME_VIEW)
// pattern that another session regressed onto. Each tenant gets its
// own theme color (Apex orange · Meridian teal · FirstCap navy) and
// the masthead surfaces tenant identity (monogram + title + tagline +
// pill metadata).

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  type ActionRow,
  type ActivityRow,
  type MastheadPill,
  type NavGroup,
  type NavItem,
  type PanelCard,
  type PanelStatus,
  type PillTone,
  type ReadinessCard,
  type ReadinessTone,
  type StewardData,
  type TenantHomeData,
} from './tenant-home-fixtures';

// ─── Tokens (matched 1:1 with the wireframe) ─────────────────────

const T = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  navy: '#1B2B5C',
  navySoft: 'rgba(27,43,92,0.06)',
  navyLine: 'rgba(27,43,92,0.15)',
  teal: '#0E8A65',
  tealSoft: 'rgba(14,138,101,0.09)',
  tealLine: 'rgba(14,138,101,0.25)',
  amber: '#92400E',
  amberSoft: 'rgba(146,64,14,0.08)',
  amberLine: 'rgba(146,64,14,0.25)',
  red: '#991B1B',
  redSoft: 'rgba(153,27,27,0.07)',
  redLine: 'rgba(153,27,27,0.25)',
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  surface: '#ffffff',
  surface2: '#FBFAF7',
  surface3: '#F5F3EE',
  fDisplay: "'Fraunces', Georgia, serif",
  fBody: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fMono: "'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace",
};

interface Props {
  data: TenantHomeData;
}

export function TenantHomePage({ data }: Props) {
  return (
    <div
      data-testid="tenant-home-page"
      data-tenant={data.key}
      style={{
        background: T.surface,
        color: T.body,
        fontFamily: T.fBody,
        fontSize: 15,
        lineHeight: 1.6,
        minHeight: '100vh',
      }}
    >
      <Masthead data={data} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
        }}
      >
        <Sidebar data={data} />
        <main style={{ padding: '40px 64px 96px', maxWidth: 1080 }}>
          <ReadinessSection cards={data.readiness} />
          <Rule />
          <StewardSection data={data.steward} tenantTitle={data.title} />
          <Rule />
          <ActionsSection actions={data.actions} />
          <Rule />
          <ActivitySection rows={data.activity} />
          <Rule />
          <PanelsSection panels={data.panels} />
        </main>
      </div>
    </div>
  );
}

// ─── Masthead ────────────────────────────────────────────────────

function Masthead({ data }: { data: TenantHomeData }) {
  return (
    <header
      style={{
        background: T.surface,
        borderBottom: `1px solid ${T.borderLight}`,
        padding: '36px 64px 28px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22 }}>
        <div
          style={{
            flexShrink: 0,
            width: 64,
            height: 64,
            borderRadius: 12,
            background: data.theme.tenant,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: T.fBody,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: '0.02em',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
          }}
        >
          {data.monogram}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: T.faint,
              marginBottom: 6,
            }}
          >
            HOME · <span style={{ color: T.ink }}>WHERE YOU STAND AND WHAT TO DO NEXT</span>
          </div>
          <h1
            style={{
              fontFamily: T.fDisplay,
              fontSize: 38,
              fontWeight: 400,
              color: T.ink,
              letterSpacing: '-0.015em',
              lineHeight: 1.05,
              margin: '0 0 4px',
            }}
          >
            {data.title}
          </h1>
          <div style={{ fontSize: 14, color: T.muted, marginBottom: 14 }}>
            {data.tagline}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.pills.map((p, i) => (
              <Pill key={i} pill={p} theme={data.theme} />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

function Pill({
  pill,
  theme,
}: {
  pill: MastheadPill;
  theme: TenantHomeData['theme'];
}) {
  const styles = pillStyles(pill.tone, theme);
  return (
    <span
      style={{
        fontFamily: T.fMono,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '4px 9px',
        borderRadius: 3,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        background: styles.bg,
      }}
    >
      {pill.label}
    </span>
  );
}

function pillStyles(tone: PillTone, theme: TenantHomeData['theme']) {
  switch (tone) {
    case 'tenant':
      return { border: theme.tenantLine, color: theme.tenant, bg: theme.tenantSoft };
    case 'teal':
      return { border: T.tealLine, color: T.teal, bg: T.tealSoft };
    case 'amber':
      return { border: T.amberLine, color: T.amber, bg: T.amberSoft };
    case 'red':
      return { border: T.redLine, color: T.red, bg: T.redSoft };
    case 'muted':
      return { border: T.borderLight, color: T.faint, bg: 'transparent' };
    case 'navy':
    default:
      return { border: T.navyLine, color: T.navy, bg: T.surface };
  }
}

// ─── Sidebar ─────────────────────────────────────────────────────

function Sidebar({ data }: { data: TenantHomeData }) {
  return (
    <aside
      style={{
        background: T.surface,
        borderRight: `1px solid ${T.borderLight}`,
        padding: '22px 14px 24px',
        position: 'sticky',
        top: 0,
        alignSelf: 'start',
        maxHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      {data.navGroups.map((group) => (
        <NavGroupView key={group.label} group={group} />
      ))}
      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: `1px solid ${T.borderLight}`,
          fontFamily: T.fMono,
          fontSize: 10,
          color: T.faint,
          letterSpacing: '0.05em',
          lineHeight: 1.7,
          paddingLeft: 12,
        }}
      >
        {data.navFootLines.map((line, i) =>
          line === '' ? <br key={i} /> : <div key={i}>{line}</div>,
        )}
      </div>
    </aside>
  );
}

function NavGroupView({ group }: { group: NavGroup }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: T.faint,
          padding: '0 12px',
          marginBottom: 6,
        }}
      >
        {group.label}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {group.items.map((item) => (
          <NavItemView key={item.label} item={item} />
        ))}
      </ul>
    </div>
  );
}

function NavItemView({ item }: { item: NavItem }) {
  const isActive = item.status === 'active';
  const isLocked = item.status === 'locked';
  const isAttn = item.status === 'attn';
  const dotBg = isAttn ? T.amber : isLocked ? T.border : T.teal;
  const dotSize = isLocked ? 6 : 7;
  const dotBorder = isLocked ? `1px solid ${T.faint}` : 'none';
  const badgeColor = isAttn ? T.amber : T.faint;
  const badgeBg = isAttn ? T.amberSoft : T.surface3;
  const liColor = isLocked ? T.faint : T.ink;
  return (
    <li>
      <Link
        href={item.href}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: 10,
          padding: '7px 12px',
          borderRadius: 5,
          fontSize: 13.5,
          fontWeight: isActive ? 700 : 500,
          color: liColor,
          textDecoration: 'none',
          lineHeight: 1.35,
          background: isActive ? T.navySoft : 'transparent',
        }}
      >
        <span
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </span>
        {item.badge && (
          <span
            style={{
              fontFamily: T.fMono,
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: badgeColor,
              padding: '1px 6px',
              borderRadius: 3,
              background: badgeBg,
            }}
          >
            {item.badge}
          </span>
        )}
        <span
          aria-hidden="true"
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: dotBg,
            border: dotBorder,
            flexShrink: 0,
          }}
        />
      </Link>
    </li>
  );
}

// ─── Section primitives ──────────────────────────────────────────

function Rule() {
  return (
    <div
      aria-hidden="true"
      style={{ height: 1, background: T.borderLight, margin: '36px 0' }}
    />
  );
}

function SectionHead({
  number,
  eyebrow,
  title,
  lead,
}: {
  number: string;
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: T.faint,
          marginBottom: 8,
        }}
      >
        {number} · <span style={{ color: T.navy }}>{eyebrow}</span>
      </div>
      <h2
        style={{
          fontFamily: T.fDisplay,
          fontSize: 30,
          fontWeight: 400,
          color: T.ink,
          letterSpacing: '-0.012em',
          lineHeight: 1.15,
          margin: '0 0 10px',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 15,
          color: T.muted,
          marginBottom: 22,
          maxWidth: '64ch',
          lineHeight: 1.6,
          margin: '0 0 22px',
        }}
      >
        {lead}
      </p>
    </>
  );
}

// ─── Section 01 · Readiness across modules ───────────────────────

function ReadinessSection({ cards }: { cards: ReadonlyArray<ReadinessCard> }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHead
        number="01"
        eyebrow="OPERATIONAL POSTURE"
        title="Readiness across modules"
        lead="Each module shows live readiness derived from substrate, programs, source events, and initiative status — not aspiration."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {cards.map((c) => (
          <ReadyCard key={c.name} card={c} />
        ))}
      </div>
    </section>
  );
}

function ReadyCard({ card }: { card: ReadinessCard }) {
  const fillColor = readinessFill(card.tone);
  return (
    <article
      style={{
        border: `1px solid ${T.borderLight}`,
        background: T.surface,
        borderRadius: 8,
        padding: 18,
      }}
    >
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: T.faint,
          marginBottom: 6,
        }}
      >
        {card.module}
      </div>
      <div
        style={{
          fontFamily: T.fDisplay,
          fontSize: 17,
          fontWeight: 500,
          color: T.ink,
          letterSpacing: '-0.005em',
          marginBottom: 14,
        }}
      >
        {card.name}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: T.fDisplay,
            fontSize: 26,
            fontWeight: 500,
            color: T.ink,
            letterSpacing: '-0.02em',
          }}
        >
          {card.pct}
        </span>
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 10,
            color: T.faint,
            letterSpacing: '0.08em',
          }}
        >
          % READY
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: T.surface3,
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            background: fillColor,
            width: `${card.pct}%`,
          }}
        />
      </div>
      <p
        style={{
          fontSize: 12,
          color: T.muted,
          lineHeight: 1.45,
          marginBottom: 10,
          margin: '0 0 10px',
        }}
      >
        {card.note}
      </p>
      <Link
        href={card.href}
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: T.navy,
          textDecoration: 'none',
          textTransform: 'uppercase',
          borderBottom: `1px solid ${T.navyLine}`,
          paddingBottom: 1,
        }}
      >
        Open {card.name} →
      </Link>
    </article>
  );
}

function readinessFill(tone: ReadinessTone): string {
  if (tone === 'teal') return T.teal;
  if (tone === 'red') return T.red;
  return T.amber;
}

// ─── Section 02 · Steward voice ──────────────────────────────────

function StewardSection({
  data,
  tenantTitle: _tenantTitle,
}: {
  data: StewardData;
  tenantTitle: string;
}) {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHead
        number="02"
        eyebrow="STEWARD VOICE"
        title="What's loaded, what's missing"
        lead="Steward watches what's been ingested, what depth it's reached, and what's still authored placeholder versus grounded fact. Read this before any module — it's the constraint on what the agents can say with confidence."
      />
      <div
        style={{
          border: `1px solid ${T.borderLight}`,
          background: T.surface,
          borderRadius: 10,
          padding: '28px 28px 22px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: T.fMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: T.navy,
            marginBottom: 12,
          }}
        >
          <span aria-hidden="true">◆</span> Steward · Tenant orientation
        </div>
        <p
          style={{
            fontFamily: T.fDisplay,
            fontSize: 22,
            fontWeight: 400,
            color: T.ink,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            marginBottom: 18,
            maxWidth: '60ch',
            margin: '0 0 18px',
          }}
        >
          {data.headline}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            paddingTop: 18,
            borderTop: `1px dashed ${T.borderLight}`,
          }}
        >
          <StewardColumn label="Loaded · grounded" entries={data.loaded} tone="loaded" />
          <StewardColumn label="Missing · authored only" entries={data.missing} tone="missing" />
        </div>
        <div
          style={{
            marginTop: 18,
            padding: '14px 16px',
            background: T.navySoft,
            borderLeft: `3px solid ${T.navy}`,
            borderRadius: '0 6px 6px 0',
          }}
        >
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: T.navy,
              marginBottom: 4,
            }}
          >
            Next load · highest leverage
          </div>
          <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.55 }}>
            {data.nextLoad}
          </div>
        </div>
      </div>
    </section>
  );
}

function StewardColumn({
  label,
  entries,
  tone,
}: {
  label: string;
  entries: StewardData['loaded'];
  tone: 'loaded' | 'missing';
}) {
  const labelColor = tone === 'loaded' ? T.teal : T.amber;
  return (
    <div>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 10,
          color: labelColor,
        }}
      >
        {label}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {entries.map((e, i) => (
          <li
            key={e.code}
            style={{
              fontSize: 13,
              color: T.body,
              padding: '6px 0',
              borderBottom: i === entries.length - 1 ? 'none' : `1px solid ${T.borderLight}`,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span>
              {e.code} · {e.label}
            </span>
            <span
              style={{
                fontFamily: T.fMono,
                fontSize: 11,
                color: T.faint,
                letterSpacing: '0.05em',
              }}
            >
              {e.qty}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Section 03 · Action queue ───────────────────────────────────

function ActionsSection({ actions }: { actions: ReadonlyArray<ActionRow> }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHead
        number="03"
        eyebrow="WHAT NEEDS YOU TODAY"
        title="Action queue"
        lead={`${actions.length} items pending. Listed in priority order — gate-blocking first, substrate-blocking next, advisory last.`}
      />
      <div style={{ display: 'grid', gap: 10 }}>
        {actions.map((a) => (
          <ActionRowView key={a.num} row={a} />
        ))}
      </div>
    </section>
  );
}

function ActionRowView({ row }: { row: ActionRow }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto auto',
        alignItems: 'center',
        gap: 16,
        padding: '14px 18px',
        border: `1px solid ${T.borderLight}`,
        background: T.surface,
        borderRadius: 8,
      }}
    >
      <span
        style={{
          fontFamily: T.fMono,
          fontSize: 11,
          fontWeight: 700,
          color: T.faint,
          letterSpacing: '0.06em',
        }}
      >
        {row.num}
      </span>
      <div>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: T.ink,
            marginBottom: 2,
            letterSpacing: '-0.005em',
          }}
        >
          {row.title}
        </div>
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 10.5,
            color: T.faint,
            letterSpacing: '0.04em',
          }}
        >
          {row.meta}
        </div>
      </div>
      <span
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          color: T.faint,
          letterSpacing: '0.06em',
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
      >
        {row.time}
      </span>
      {row.href ? (
        <Link href={row.href} style={ctaStyle(row.primary)}>
          {row.primary ? 'Review' : 'Open'}
        </Link>
      ) : (
        <span style={ctaStyle(row.primary)}>{row.primary ? 'Review' : 'Open'}</span>
      )}
    </div>
  );
}

function ctaStyle(primary?: boolean): React.CSSProperties {
  return {
    fontFamily: T.fMono,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '6px 12px',
    border: `1px solid ${T.ink}`,
    color: primary ? T.surface : T.ink,
    background: primary ? T.ink : T.surface,
    borderRadius: 4,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };
}

// ─── Section 04 · Recent activity ────────────────────────────────

function ActivitySection({ rows }: { rows: ReadonlyArray<ActivityRow> }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHead
        number="04"
        eyebrow="WHAT CHANGED"
        title="Recent activity"
        lead="Last events from the substrate audit log for this tenant."
      />
      <div
        style={{
          borderLeft: `2px solid ${T.borderLight}`,
          paddingLeft: 24,
        }}
      >
        {rows.map((r, i) => (
          <ActivityItem key={i} row={r} />
        ))}
      </div>
    </section>
  );
}

function ActivityItem({ row }: { row: ActivityRow }) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '10px 0',
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 18,
        alignItems: 'baseline',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -29,
          top: 18,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: row.isRecent ? T.tealSoft : T.surface,
          border: row.isRecent ? `2px solid ${T.teal}` : `2px solid ${T.navyLine}`,
        }}
      />
      <span
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.faint,
        }}
      >
        {row.time}
      </span>
      <span style={{ fontSize: 13.5, color: T.body, lineHeight: 1.55 }}>
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 11,
            color: T.navy,
            letterSpacing: '0.04em',
          }}
        >
          {row.actor}
        </span>{' '}
        · <strong style={{ color: T.ink, fontWeight: 600 }}>{row.verb}</strong> on{' '}
        <strong style={{ color: T.ink, fontWeight: 600 }}>{row.target}</strong> · {row.context}
      </span>
    </div>
  );
}

// ─── Section 05 · Setup panels ───────────────────────────────────

function PanelsSection({ panels }: { panels: ReadonlyArray<PanelCard> }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <SectionHead
        number="05"
        eyebrow="WHERE TO GO"
        title="Setup panels"
        lead="Eight panels for tenant administration. Status pill is derived from live substrate state."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}
      >
        {panels.map((p) => (
          <PanelCardView key={p.num} card={p} />
        ))}
      </div>
    </section>
  );
}

function PanelCardView({ card }: { card: PanelCard }) {
  return (
    <Link
      href={card.href}
      style={{
        border: `1px solid ${T.borderLight}`,
        background: T.surface,
        borderRadius: 8,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: T.faint,
          }}
        >
          {card.num}
        </span>
        <PanelStatusPill status={card.status} />
      </div>
      <div
        style={{
          fontFamily: T.fDisplay,
          fontSize: 18,
          fontWeight: 500,
          color: T.ink,
          letterSpacing: '-0.005em',
        }}
      >
        {card.name}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: T.muted,
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {card.desc}
      </div>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          letterSpacing: '0.08em',
          color: T.faint,
          paddingTop: 8,
          borderTop: `1px solid ${T.borderLight}`,
        }}
      >
        {card.foot}
      </div>
    </Link>
  );
}

function PanelStatusPill({ status }: { status: PanelStatus }) {
  const styles = panelStatusStyles(status);
  return (
    <span
      style={{
        fontFamily: T.fMono,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '2px 7px',
        borderRadius: 3,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        background: styles.bg,
      }}
    >
      {styles.label}
    </span>
  );
}

function panelStatusStyles(status: PanelStatus): {
  color: string;
  border: string;
  bg: string;
  label: string;
} {
  if (status === 'ready') return { color: T.teal, border: T.tealLine, bg: T.tealSoft, label: 'Ready' };
  if (status === 'attn') return { color: T.amber, border: T.amberLine, bg: T.amberSoft, label: 'Attn' };
  return { color: T.faint, border: T.borderLight, bg: T.surface3, label: 'Locked' };
}
