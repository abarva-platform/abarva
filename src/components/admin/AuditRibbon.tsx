/**
 * AuditRibbon · Wave 1 PR-6
 *
 * The unified 24h activity ribbon on the /admin Setup landing page.
 * Renders up to 6 rows of mixed-source audit events on one temporal
 * axis — substrate ingests, approval queue activity, and (Wave 2)
 * auth / policy / connector / invite events.
 *
 * Composed from `TrustSpine.audit.last24hEvents` (see
 * `src/lib/admin/broker/trust-spine-broker.ts`). The broker returns
 * up to 50 events; this surface caps at 6 and points at the full
 * `/admin/audit` page for the rest.
 *
 * Design intent · per `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md`
 * §5.6 Zone E:
 *
 *   "A unified event feed mixing substrate-ingest events with auth
 *    events with policy edits with connector pulls. Same temporal
 *    axis. Color-keyed by source. Click any row → the full audit
 *    page filtered to that surface. This is the answer to 'what just
 *    happened' for an incident-response admin."
 *
 * Editorial register · locked palette:
 *   - Timestamp:  JetBrains Mono, faint, relative ("2h ago").
 *   - Source:     mono chip; subtle ink/teal/amber from the locked
 *                 palette. No new colors. Distinguish by *tone*, not
 *                 a wall of badges.
 *   - Actor:      DM Sans (`var(--font-inter)`).
 *   - Action:     DM Sans, body weight. Reads cleanest against the
 *                 ink palette; Georgia italic was considered and
 *                 rejected — would compete with the section serif
 *                 headings above.
 *   - Target:     mono, faint, optional.
 *
 * Empty state: a single muted line — "No activity in the last 24
 * hours" — keeps the layer honest. No skeleton, no spinner.
 *
 * Server-rendered. The row click handler is a thin client island
 * (`AuditRibbonRow`) that fires a PostHog event and navigates.
 */

import type { TrustAuditEvent } from '@/lib/admin/broker/trust-spine-broker';
import { AuditRibbonRow } from './AuditRibbonRow';

const F_BODY =
  'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
  surface3: '#F5F3EE',
  // Locked palette tones — distinguishing source by tone, not new hue.
  inkSoft: 'rgba(10,12,18,0.06)',
  inkLine: 'rgba(10,12,18,0.15)',
  teal: '#0E8A65',
  tealSoft: 'rgba(14,138,101,0.09)',
  tealLine: 'rgba(14,138,101,0.25)',
  amber: '#92400E',
  amberSoft: 'rgba(146,64,14,0.08)',
  amberLine: 'rgba(146,64,14,0.25)',
};

interface SourceTone {
  fg: string;
  bg: string;
  border: string;
  label: string;
}

/**
 * Source → tone mapping. The verdict calls for substrate=ink,
 * auth=amber, policy=teal, connector=ink, invite=teal,
 * approval=amber. We honor that exactly so the page reads as
 * intended without introducing new palette tokens.
 */
const SOURCE_TONE: Record<TrustAuditEvent['source'], SourceTone> = {
  substrate: { fg: C.ink, bg: C.inkSoft, border: C.inkLine, label: 'Substrate' },
  auth: { fg: C.amber, bg: C.amberSoft, border: C.amberLine, label: 'Auth' },
  policy: { fg: C.teal, bg: C.tealSoft, border: C.tealLine, label: 'Policy' },
  connector: { fg: C.ink, bg: C.inkSoft, border: C.inkLine, label: 'Connector' },
  invite: { fg: C.teal, bg: C.tealSoft, border: C.tealLine, label: 'Invite' },
  approval: { fg: C.amber, bg: C.amberSoft, border: C.amberLine, label: 'Approval' },
};

/** Relative-time label matching the home-overview-v2 convention. */
function relativeTimeLabel(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  const ms = Date.now() - t;
  if (ms < 0) return 'just now';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.round(d / 7)}w ago`;
}

interface Props {
  events: TrustAuditEvent[];
  /** Optional override for the max rows rendered (default 6). */
  maxRows?: number;
}

export function AuditRibbon({ events, maxRows = 6 }: Props) {
  const rows = events.slice(0, maxRows);

  return (
    <section
      data-testid="audit-ribbon"
      aria-label="Unified audit ribbon"
      style={{ marginBottom: 56 }}
    >
      <div
        style={{
          fontFamily: F_MONO,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: C.faint,
          marginBottom: 8,
        }}
      >
        06 · <span style={{ color: C.ink }}>WHAT JUST HAPPENED</span>
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-fraunces), Georgia, serif',
          fontSize: 30,
          fontWeight: 400,
          color: C.ink,
          letterSpacing: '-0.012em',
          lineHeight: 1.15,
          marginBottom: 10,
          margin: '0 0 10px 0',
        }}
      >
        Audit ribbon
      </h2>
      <p
        style={{
          fontSize: 15,
          color: C.muted,
          marginBottom: 22,
          maxWidth: '64ch',
          lineHeight: 1.6,
        }}
      >
        A unified, time-ordered feed across substrate, approvals, and (soon)
        auth, policy, connector, and invite events. Click any row to filter
        the full audit log to that source.
      </p>

      {rows.length === 0 ? (
        <div
          data-testid="audit-ribbon-empty"
          style={{
            border: `1px solid ${C.borderLight}`,
            background: C.surface,
            borderRadius: 8,
            padding: '18px 20px',
            fontFamily: F_BODY,
            fontSize: 13,
            color: C.faint,
            lineHeight: 1.5,
          }}
        >
          No activity in the last 24 hours.
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${C.borderLight}`,
            background: C.surface,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {rows.map((event, idx) => {
            const tone = SOURCE_TONE[event.source];
            return (
              <AuditRibbonRow
                key={`${event.ts}-${event.source}-${idx}`}
                source={event.source}
                href={`/admin/audit?source=${event.source}`}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '88px 96px 1fr auto',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderTop:
                      idx === 0 ? 'none' : `1px solid ${C.borderLight}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: F_MONO,
                      fontSize: 10.5,
                      color: C.faint,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {relativeTimeLabel(event.ts)}
                  </span>
                  <span
                    style={{
                      fontFamily: F_MONO,
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 3,
                      border: `1px solid ${tone.border}`,
                      color: tone.fg,
                      background: tone.bg,
                      textAlign: 'center',
                      width: 'fit-content',
                    }}
                  >
                    {tone.label}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: F_BODY,
                        fontSize: 13.5,
                        color: C.ink,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ color: C.muted, fontWeight: 500 }}>
                        {event.actor}
                      </span>
                      <span style={{ color: C.faint }}> · </span>
                      <span>{event.action}</span>
                    </div>
                    {event.target && (
                      <div
                        style={{
                          fontFamily: F_MONO,
                          fontSize: 10.5,
                          color: C.faint,
                          letterSpacing: '0.04em',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {event.target}
                      </div>
                    )}
                  </div>
                  <span
                    aria-hidden="true"
                    style={{
                      fontFamily: F_MONO,
                      fontSize: 12,
                      color: C.faint,
                    }}
                  >
                    →
                  </span>
                </div>
              </AuditRibbonRow>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <a
          href="/admin/audit"
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.ink,
            textDecoration: 'none',
            borderBottom: `1px solid ${C.inkLine}`,
            paddingBottom: 1,
          }}
        >
          See all in audit →
        </a>
      </div>
    </section>
  );
}
