// HomeOverviewV2 · the canonical /home Setup page per the wireframe
// approved 2026-05-08. Renders the masthead + 5 sections inline:
//   01 Readiness across modules
//   02 Steward orientation (loaded vs missing + next-load)
//   03 Action queue
//   04 Recent activity
//   05 Setup panels
//
// Type triad: Fraunces (display) · Inter (body) · JetBrains Mono
// (eyebrows / labels). Loaded via next/font in src/app/layout.tsx
// → CSS variables --font-fraunces / --font-inter / --font-jetbrains-mono.
//
// All styles inline to match the wireframe at
// docs/training/setup-home-wireframe.html — single component, no
// CSS module needed for the first slice. Refactor into smaller
// components as the page evolves.

import type { ClientKey } from '@/lib/client-config';
import type {
  ModuleReadinessV2,
  PanelStatusCard,
  HomeOverviewV2Extras,
} from '@/lib/admin/home-overview-v2';
import type { OverviewBlocks } from '@/lib/admin/overview-composer';

const F_DISPLAY = 'var(--font-fraunces), Georgia, serif';
const F_BODY = 'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO = 'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const C = {
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
  surface: '#FFFFFF',
  surface2: '#FBFAF7',
  surface3: '#F5F3EE',
};

interface TenantBrand {
  initials: string;
  bgColor: string;
  brandSoft: string;
  brandLine: string;
  industryLabel: string;
  tagline: string;
}

const TENANT_BRAND: Record<ClientKey, TenantBrand> = {
  meridian: {
    initials: 'MH',
    bgColor: '#0F766E',
    brandSoft: 'rgba(15,118,110,0.08)',
    brandLine: 'rgba(15,118,110,0.20)',
    industryLabel: 'Industry: Healthcare IDN',
    tagline: 'Healthcare IDN · 8 hospitals · 142 clinics',
  },
  apexretail: {
    initials: 'AR',
    bgColor: '#C2410C',
    brandSoft: 'rgba(194,65,12,0.08)',
    brandLine: 'rgba(194,65,12,0.20)',
    industryLabel: 'Industry: Retail',
    tagline: 'Omnichannel retail · 412 stores · $4.2B revenue',
  },
  arcturus: {
    initials: 'FC',
    bgColor: '#1E3A8A',
    brandSoft: 'rgba(30,58,138,0.08)',
    brandLine: 'rgba(30,58,138,0.20)',
    industryLabel: 'Industry: Financial Services',
    tagline: 'Regional bank · $48B AUM · 142 branches',
  },
};

const FALLBACK_BRAND: TenantBrand = {
  initials: '·',
  bgColor: C.navy,
  brandSoft: C.navySoft,
  brandLine: C.navyLine,
  industryLabel: 'Industry: —',
  tagline: '',
};

function fallbackInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? '') + (parts[1]![0] ?? '')).toUpperCase();
}

interface Props {
  tenantName: string;
  clientKey: ClientKey | null;
  blocks: OverviewBlocks;
  extras: HomeOverviewV2Extras;
  /** Optional override tagline (defaults to brand-map tagline). */
  tagline?: string;
}

export function HomeOverviewV2({ tenantName, clientKey, blocks, extras, tagline }: Props) {
  const known = clientKey ? TENANT_BRAND[clientKey] : undefined;
  const brand: TenantBrand = known ?? {
    ...FALLBACK_BRAND,
    initials: fallbackInitials(tenantName),
  };
  const taglineText = tagline ?? brand.tagline;

  return (
    <div
      data-testid="home-overview-v2"
      style={{ background: C.surface2, fontFamily: F_BODY, color: C.body, minHeight: '100%' }}
    >
      {/* ── MASTHEAD ────────────────────────────────────────── */}
      <header
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.borderLight}`,
          padding: '36px 64px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22 }}>
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 64,
              height: 64,
              borderRadius: 12,
              background: brand.bgColor,
              color: '#FFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: F_BODY,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: '0.02em',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
            }}
          >
            {brand.initials}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: F_MONO,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: C.faint,
                marginBottom: 6,
              }}
            >
              HOME · <span style={{ color: C.ink }}>WHERE YOU STAND AND WHAT TO DO NEXT</span>
            </div>
            <h1
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 38,
                fontWeight: 400,
                color: C.ink,
                letterSpacing: '-0.015em',
                lineHeight: 1.05,
                margin: 0,
                marginBottom: 4,
              }}
            >
              {tenantName}
            </h1>
            {taglineText && (
              <div style={{ fontSize: 14, color: C.muted, marginBottom: 14 }}>{taglineText}</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Pill bg={brand.brandSoft} fg={brand.bgColor} border={brand.brandLine}>{brand.industryLabel}</Pill>
              <Pill>{extras.masthead.segmentsLoaded} segments loaded</Pill>
              <Pill>{extras.masthead.totalRecords.toLocaleString()} records</Pill>
              <Pill bg={C.tealSoft} fg={C.teal} border={C.tealLine}>Substrate live</Pill>
              {extras.masthead.panelsAttention > 0 && (
                <Pill bg={C.amberSoft} fg={C.amber} border={C.amberLine}>
                  {extras.masthead.panelsAttention} panel{extras.masthead.panelsAttention === 1 ? '' : 's'} need{extras.masthead.panelsAttention === 1 ? 's' : ''} attention
                </Pill>
              )}
              {extras.masthead.refreshedLabel && (
                <Pill muted>Refreshed {extras.masthead.refreshedLabel}</Pill>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <main style={{ padding: '40px 64px 96px', maxWidth: 1280 }}>
        {/* Section 01 — Readiness across modules */}
        <Section eyebrowNum="01" eyebrowLabel="OPERATIONAL POSTURE" title="Readiness across modules" lead="Each module shows live readiness derived from substrate, programs, source events, and initiative status — not aspiration.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            {extras.readiness.map((m) => <ReadyCard key={m.name} mod={m} />)}
          </div>
        </Section>

        <Rule />

        {/* Section 02 — Steward orientation */}
        <Section eyebrowNum="02" eyebrowLabel="STEWARD VOICE" title="What's loaded, what's missing" lead="Steward watches what's been ingested, what depth it's reached, and what's still authored placeholder versus grounded fact. Read this before any module — it's the constraint on what the agents can say with confidence.">
          <div
            style={{
              border: `1px solid ${C.borderLight}`,
              background: C.surface,
              borderRadius: 10,
              padding: '28px 28px 22px',
            }}
          >
            <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.navy, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9 }}>◆</span>
              Steward · Tenant orientation
            </div>
            <p
              style={{
                fontFamily: F_DISPLAY,
                fontSize: 22,
                fontWeight: 400,
                color: C.ink,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
                marginBottom: 18,
                maxWidth: '60ch',
                margin: '0 0 18px 0',
              }}
            >
              {blocks.orientation.industryPhrase ? `${blocks.orientation.industryPhrase}. ` : ''}
              {blocks.orientation.loadedSummary.charAt(0).toUpperCase() + blocks.orientation.loadedSummary.slice(1)}
              {'. '}
              {blocks.orientation.missingSummary && `${blocks.orientation.missingSummary.charAt(0).toUpperCase() + blocks.orientation.missingSummary.slice(1)}.`}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingTop: 18, borderTop: `1px dashed ${C.borderLight}` }}>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.teal, marginBottom: 10 }}>Loaded · grounded</div>
                <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}>{blocks.orientation.loadedSummary}</div>
              </div>
              <div>
                <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.amber, marginBottom: 10 }}>Missing · authored only</div>
                <div style={{ fontSize: 13, color: C.body, lineHeight: 1.6 }}>{blocks.orientation.missingSummary}</div>
              </div>
            </div>

            {blocks.orientation.nextLoadName && (
              <div
                style={{
                  marginTop: 18,
                  padding: '14px 16px',
                  background: C.navySoft,
                  borderLeft: `3px solid ${C.navy}`,
                  borderRadius: '0 6px 6px 0',
                }}
              >
                <div style={{ fontFamily: F_MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.navy, marginBottom: 4 }}>
                  Next load · highest leverage
                </div>
                <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55 }}>
                  <strong style={{ fontWeight: 600 }}>Strengthen &ldquo;{blocks.orientation.nextLoadName}&rdquo;.</strong>{' '}
                  {blocks.orientation.nextLoadConsequence}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Rule />

        {/* Section 03 — Action queue */}
        {blocks.actionQueue.items.length > 0 && (
          <>
            <Section eyebrowNum="03" eyebrowLabel="WHAT NEEDS YOU TODAY" title="Action queue" lead={`${blocks.actionQueue.items.length} item${blocks.actionQueue.items.length === 1 ? '' : 's'} pending. Listed in priority order — gate-blocking first, substrate-blocking next, advisory last.`}>
              <div style={{ display: 'grid', gap: 10 }}>
                {blocks.actionQueue.items.map((item, i) => {
                  const severityColor = item.severity === 'high' ? C.red : item.severity === 'medium' ? C.amber : C.faint;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr auto',
                        alignItems: 'center',
                        gap: 16,
                        padding: '14px 18px',
                        border: `1px solid ${C.borderLight}`,
                        background: C.surface,
                        borderRadius: 8,
                      }}
                    >
                      <span style={{ fontFamily: F_MONO, fontSize: 11, fontWeight: 700, color: severityColor, letterSpacing: '0.06em' }}>{String(i + 1).padStart(2, '0')}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 500, color: C.ink, marginBottom: 2, letterSpacing: '-0.005em' }}>{item.label}</div>
                        <div style={{ fontFamily: F_MONO, fontSize: 10.5, color: C.faint, letterSpacing: '0.04em' }}>{item.panelLabel.toUpperCase()} · {item.consequence}</div>
                      </div>
                      <a
                        href={item.href}
                        style={{
                          fontFamily: F_MONO,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '6px 12px',
                          border: `1px solid ${C.ink}`,
                          color: i === 0 ? C.surface : C.ink,
                          background: i === 0 ? C.ink : C.surface,
                          borderRadius: 4,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Open
                      </a>
                    </div>
                  );
                })}
              </div>
            </Section>
            <Rule />
          </>
        )}

        {/* Section 04 — Recent activity */}
        {blocks.recentActivity.items.length > 0 && (
          <>
            <Section eyebrowNum="04" eyebrowLabel="WHAT CHANGED" title="Recent activity" lead="Last events from the substrate audit log for this tenant.">
              <div style={{ borderLeft: `2px solid ${C.borderLight}`, paddingLeft: 24 }}>
                {blocks.recentActivity.items.slice(0, 6).map((e, i) => {
                  const recent = i < 2;
                  return (
                    <div
                      key={e.id}
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
                          background: recent ? C.tealSoft : C.surface,
                          border: `2px solid ${recent ? C.teal : C.navyLine}`,
                        }}
                      />
                      <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.faint }}>
                        {e.relativeTimestamp}
                      </span>
                      <span style={{ fontSize: 13.5, color: C.body, lineHeight: 1.55 }}>
                        {e.summary}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>
            <Rule />
          </>
        )}

        {/* Section 05 — Setup panels */}
        <Section eyebrowNum="05" eyebrowLabel="WHERE TO GO" title="Setup panels" lead="Eight panels for tenant administration. Status pill is derived from live substrate state.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            {extras.panels.map((p) => <PanelCard key={p.num} panel={p} />)}
          </div>
        </Section>
      </main>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Section({ eyebrowNum, eyebrowLabel, title, lead, children }: { eyebrowNum: string; eyebrowLabel: string; title: string; lead: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.faint, marginBottom: 8 }}>
        {eyebrowNum} · <span style={{ color: C.navy }}>{eyebrowLabel}</span>
      </div>
      <h2 style={{ fontFamily: F_DISPLAY, fontSize: 30, fontWeight: 400, color: C.ink, letterSpacing: '-0.012em', lineHeight: 1.15, marginBottom: 10, margin: '0 0 10px 0' }}>{title}</h2>
      <p style={{ fontSize: 15, color: C.muted, marginBottom: 22, maxWidth: '64ch', lineHeight: 1.6 }}>{lead}</p>
      {children}
    </section>
  );
}

function Rule() {
  return <div style={{ height: 1, background: C.borderLight, margin: '36px 0' }} />;
}

function Pill({ children, bg, fg, border, muted }: { children: React.ReactNode; bg?: string; fg?: string; border?: string; muted?: boolean }) {
  return (
    <span
      style={{
        fontFamily: F_MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '4px 9px',
        borderRadius: 3,
        border: `1px solid ${muted ? C.borderLight : (border ?? C.navyLine)}`,
        color: muted ? C.faint : (fg ?? C.navy),
        background: muted ? 'transparent' : (bg ?? C.surface),
      }}
    >
      {children}
    </span>
  );
}

function ReadyCard({ mod }: { mod: ModuleReadinessV2 }) {
  const fillColor = mod.bucket === 'teal' ? C.teal : mod.bucket === 'amber' ? C.amber : C.red;
  return (
    <article style={{ border: `1px solid ${C.borderLight}`, background: C.surface, borderRadius: 8, padding: 18 }}>
      <div style={{ fontFamily: F_MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.faint, marginBottom: 6 }}>{mod.modulePrefix}</div>
      <div style={{ fontFamily: F_DISPLAY, fontSize: 17, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', marginBottom: 14 }}>{mod.name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: F_DISPLAY, fontSize: 26, fontWeight: 500, color: C.ink, letterSpacing: '-0.02em' }}>{mod.pct}</span>
        <span style={{ fontFamily: F_MONO, fontSize: 10, color: C.faint, letterSpacing: '0.08em' }}>% READY</span>
      </div>
      <div style={{ height: 6, background: C.surface3, borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', borderRadius: 3, background: fillColor, width: `${mod.pct}%` }} />
      </div>
      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: 10 }}>{mod.note}</p>
      <a href={mod.href} style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: C.navy, textDecoration: 'none', textTransform: 'uppercase', borderBottom: `1px solid ${C.navyLine}`, paddingBottom: 1 }}>
        Open {mod.name} →
      </a>
    </article>
  );
}

function PanelCard({ panel }: { panel: PanelStatusCard }) {
  const statusStyle =
    panel.status === 'ready'
      ? { color: C.teal, borderColor: C.tealLine, background: C.tealSoft }
      : panel.status === 'attn'
      ? { color: C.amber, borderColor: C.amberLine, background: C.amberSoft }
      : { color: C.faint, borderColor: C.borderLight, background: C.surface3 };
  return (
    <a
      href={panel.href}
      style={{
        border: `1px solid ${C.borderLight}`,
        background: C.surface,
        borderRadius: 8,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: C.faint }}>{panel.num}</span>
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '2px 7px',
            borderRadius: 3,
            border: '1px solid',
            ...statusStyle,
          }}
        >
          {panel.status === 'ready' ? 'Ready' : panel.status === 'attn' ? 'Attn' : 'Locked'}
        </span>
      </div>
      <div style={{ fontFamily: F_DISPLAY, fontSize: 18, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em' }}>{panel.name}</div>
      <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, flex: 1 }}>{panel.desc}</div>
      <div style={{ fontFamily: F_MONO, fontSize: 10, letterSpacing: '0.08em', color: C.faint, paddingTop: 8, borderTop: `1px solid ${C.borderLight}` }}>{panel.foot}</div>
    </a>
  );
}
