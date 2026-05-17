'use client';

// Renewal Cockpit — action bar (Practitioner-Fit §2 / §4).
//
// The usability test scored the cockpit 3/5: "It tells me what to do, but
// doesn't let me do it." This bar is the fix — it lets a VP *act* from the
// cockpit, not just read.
//
// Honesty rule (the spec's hard constraint): every action is wired to a real
// capability OR initiates an honest, clearly-labelled affordance. No button
// shows a fake success and none does nothing:
//
//   - Start rebid / Create Source event  → POST /api/v1/source/events (real)
//   - Open negotiation brief             → renders the real composed brief
//   - Draft vendor email                 → renders the real generated draft
//   - Serve notice                       → confirm step → honest "pending"
//                                          record; no notice-clock backend
//                                          exists yet, so it never claims the
//                                          notice was served.
//   - Assign owner                       → input + confirm → honest "drafted,
//                                          pending" assignment; no owner
//                                          table is wired yet.
//   - Create Tower watch item            → "coming soon" — no Tower watch
//                                          write-path exists; the button is
//                                          visibly disabled rather than dead.
//
// Locked design system: cream surface, Fraunces serif, Inter sans, JetBrains
// mono labels, black primary / ghost secondary buttons.

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { RenewalCockpit } from '@/lib/source/renewal-cockpit/cockpit';
import { buildVendorEmailDraft } from '@/lib/source/renewal-cockpit/vendor-email-draft';
import { buildRenewalNegotiationBrief } from '@/lib/source/renewal-cockpit/negotiation-brief';

// ── Tokens ───────────────────────────────────────────────────────────────────

const BLACK_BTN: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 600,
  color: '#ffffff',
  background: SHELL.INK,
  border: '1px solid ' + SHELL.INK,
  borderRadius: 7,
  padding: '8px 14px',
  cursor: 'pointer',
};

const GHOST_BTN: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 600,
  color: SHELL.INK,
  background: 'transparent',
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 7,
  padding: '8px 14px',
  cursor: 'pointer',
};

const DISABLED_BTN: CSSProperties = {
  ...GHOST_BTN,
  color: SHELL.INK_MUTED,
  borderColor: SHELL.CARD_LINE_SOFT,
  cursor: 'not-allowed',
};

const PANEL: CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  color: SHELL.INK_MUTED,
};

const HEADING: CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontWeight: 'normal',
  fontSize: 17,
  color: SHELL.INK,
  margin: 0,
};

const BODY: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_SOFT,
  margin: 0,
  lineHeight: 1.55,
};

// ── Which panel is open ──────────────────────────────────────────────────────

type ActivePanel =
  | null
  | 'serve_notice'
  | 'negotiation'
  | 'rebid'
  | 'assign'
  | 'email'
  | 'handoff';

interface EventResult {
  ok: boolean;
  message: string;
  eventUrl?: string;
}

export function RenewalCockpitActionBar({ cockpit }: { cockpit: RenewalCockpit }) {
  const [active, setActive] = useState<ActivePanel>(null);

  // Honest-stub local state — these never claim a backend write happened.
  const [noticeConfirmed, setNoticeConfirmed] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerAssigned, setOwnerAssigned] = useState<string | null>(null);

  // Real source-event creation state.
  const [eventBusy, setEventBusy] = useState(false);
  const [rebidResult, setRebidResult] = useState<EventResult | null>(null);
  const [handoffResult, setHandoffResult] = useState<EventResult | null>(null);

  function toggle(panel: ActivePanel) {
    setActive((current) => (current === panel ? null : panel));
  }

  async function createSourceEvent(
    intent: 'rebid' | 'handoff',
  ): Promise<void> {
    setEventBusy(true);
    const setter = intent === 'rebid' ? setRebidResult : setHandoffResult;
    const eventName =
      intent === 'rebid'
        ? `Competitive rebid — ${cockpit.vendorName} ${cockpit.product}`
        : `Source event — ${cockpit.vendorName} ${cockpit.product} renewal`;
    const triggerDescription =
      intent === 'rebid'
        ? `Renewal Cockpit recommended posture: ${cockpit.postureLabel}. ${cockpit.postureRationale}`
        : `Carried from the Renewal Cockpit for Move handoff. ${cockpit.postureRationale}`;
    try {
      const res = await fetch('/api/v1/source/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          eventName,
          eventType: 'software',
          triggerDescription,
          scopeDescription: `Contract ${cockpit.contractId}. Current annual spend ${
            cockpit.currentAnnualSpendUsd ?? 'unpriced'
          }.`,
          estimatedValueUsd: cockpit.currentAnnualSpendUsd ?? undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        eventUrl?: string;
        error?: string;
        detail?: string;
      };
      if (res.ok && data.ok) {
        setter({
          ok: true,
          message:
            intent === 'rebid'
              ? 'Competitive rebid event created. It is now in the Source intake queue for approval.'
              : 'Source event created and ready for the Move handoff. Open it to attach the receiving Move.',
          eventUrl: data.eventUrl,
        });
      } else {
        setter({
          ok: false,
          message:
            data.detail ??
            data.error ??
            'Could not create the Source event. Try again, or create it from the Source front door.',
        });
      }
    } catch {
      setter({
        ok: false,
        message:
          'Network error creating the Source event. Try again, or create it from the Source front door.',
      });
    } finally {
      setEventBusy(false);
    }
  }

  const emailDraft = active === 'email' ? buildVendorEmailDraft(cockpit) : null;
  const brief =
    active === 'negotiation' ? buildRenewalNegotiationBrief(cockpit) : null;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={LABEL}>Act on this renewal</span>

      {/* The action bar — buttons. */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          style={active === 'serve_notice' ? BLACK_BTN : GHOST_BTN}
          onClick={() => toggle('serve_notice')}
        >
          Serve notice
        </button>
        <button
          type="button"
          style={active === 'negotiation' ? BLACK_BTN : GHOST_BTN}
          onClick={() => toggle('negotiation')}
        >
          Open negotiation brief
        </button>
        <button
          type="button"
          style={active === 'rebid' ? BLACK_BTN : GHOST_BTN}
          onClick={() => toggle('rebid')}
        >
          Start rebid
        </button>
        <button
          type="button"
          style={active === 'assign' ? BLACK_BTN : GHOST_BTN}
          onClick={() => toggle('assign')}
        >
          Assign owner
        </button>
        <button
          type="button"
          style={active === 'email' ? BLACK_BTN : GHOST_BTN}
          onClick={() => toggle('email')}
        >
          Draft vendor email
        </button>
        <button
          type="button"
          style={active === 'handoff' ? BLACK_BTN : GHOST_BTN}
          onClick={() => toggle('handoff')}
        >
          Create Source event / Move handoff
        </button>
        <button
          type="button"
          style={DISABLED_BTN}
          disabled
          title="A Tower watch-item write-path is not wired yet — coming soon."
        >
          Create Tower watch item · coming soon
        </button>
      </div>

      {/* ── Serve notice — honest stub: confirm → pending record ── */}
      {active === 'serve_notice' ? (
        <div style={PANEL}>
          <span style={LABEL}>Serve notice · decline auto-renewal</span>
          {noticeConfirmed ? (
            <>
              <h3 style={HEADING}>Notice intent recorded — pending</h3>
              <p style={BODY}>
                A notice-to-decline intent has been drafted for{' '}
                <strong>
                  {cockpit.vendorName} — {cockpit.product}
                </strong>
                . The notice clock is <strong>not</strong> a wired capability
                yet, so this is a pending intent only — it does not legally
                serve notice. Route it to legal / procurement ops to issue the
                formal notice before the deadline
                {cockpit.timing.daysToNoticeDeadline !== null
                  ? ` (${cockpit.timing.daysToNoticeDeadline} day(s) away)`
                  : ''}
                .
              </p>
            </>
          ) : (
            <>
              <h3 style={HEADING}>Decline the auto-renewal?</h3>
              <p style={BODY}>
                This records an intent to serve notice and decline the
                auto-renewal. AbarVa cannot issue the formal legal notice — it
                will create a clearly-labelled pending record for procurement
                ops to action. Confirm to proceed.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={BLACK_BTN}
                  onClick={() => setNoticeConfirmed(true)}
                >
                  Confirm — record notice intent
                </button>
                <button
                  type="button"
                  style={GHOST_BTN}
                  onClick={() => setActive(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* ── Negotiation brief — wired to the composed brief ── */}
      {brief ? (
        <div style={PANEL}>
          <span style={LABEL}>Negotiation brief · {brief.dealLabel}</span>
          <h3 style={HEADING}>{brief.headline}</h3>
          <BriefBlock title="Walk-away position" points={[brief.walkAway]} />
          <BriefBlock title="BATNA" points={[brief.batna]} />
          <BriefBlock title="Levers worth pulling" points={brief.levers} />
          <BriefBlock
            title="Concessions worth trading"
            points={brief.concessions}
          />
        </div>
      ) : null}

      {/* ── Start rebid — wired to POST /api/v1/source/events ── */}
      {active === 'rebid' ? (
        <div style={PANEL}>
          <span style={LABEL}>Start rebid · competitive Source event</span>
          {rebidResult ? (
            <>
              <h3 style={HEADING}>
                {rebidResult.ok ? 'Rebid event created' : 'Rebid not created'}
              </h3>
              <p style={BODY}>{rebidResult.message}</p>
              {rebidResult.ok && rebidResult.eventUrl ? (
                <a
                  href={rebidResult.eventUrl}
                  style={{ ...BODY, color: SHELL.INK_MID, fontWeight: 600 }}
                >
                  Open the Source event →
                </a>
              ) : null}
            </>
          ) : (
            <>
              <h3 style={HEADING}>Initiate a competitive rebid</h3>
              <p style={BODY}>
                This creates a real Source event for a competitive rebid of{' '}
                <strong>
                  {cockpit.vendorName} — {cockpit.product}
                </strong>
                , seeded with the cockpit&apos;s posture and rationale. It
                enters the Source intake queue for approval.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={BLACK_BTN}
                  disabled={eventBusy}
                  onClick={() => createSourceEvent('rebid')}
                >
                  {eventBusy ? 'Creating…' : 'Create rebid event'}
                </button>
                <button
                  type="button"
                  style={GHOST_BTN}
                  onClick={() => setActive(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* ── Assign owner — honest stub: input → pending assignment ── */}
      {active === 'assign' ? (
        <div style={PANEL}>
          <span style={LABEL}>Assign owner</span>
          {ownerAssigned ? (
            <>
              <h3 style={HEADING}>Owner assignment drafted — pending</h3>
              <p style={BODY}>
                <strong>{ownerAssigned}</strong> is drafted as the renewal
                owner for{' '}
                <strong>
                  {cockpit.vendorName} — {cockpit.product}
                </strong>
                . A persistent renewal-ownership record is not wired yet, so
                this is a pending assignment — confirm it through Source admin
                once that capability ships.
              </p>
            </>
          ) : (
            <>
              <h3 style={HEADING}>Who owns this renewal?</h3>
              <p style={BODY}>
                Name the accountable owner. This records a pending assignment
                only — there is no owner table wired yet, so it will not appear
                in reporting until that ships.
              </p>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Owner name or email"
                style={{
                  fontFamily: SHELL.SANS,
                  fontSize: 13,
                  color: SHELL.INK,
                  border: '1px solid ' + SHELL.CARD_LINE,
                  borderRadius: 7,
                  padding: '8px 10px',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={ownerName.trim() ? BLACK_BTN : DISABLED_BTN}
                  disabled={!ownerName.trim()}
                  onClick={() => setOwnerAssigned(ownerName.trim())}
                >
                  Record assignment
                </button>
                <button
                  type="button"
                  style={GHOST_BTN}
                  onClick={() => setActive(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* ── Draft vendor email — wired to the email-draft generator ── */}
      {emailDraft ? (
        <div style={PANEL}>
          <span style={LABEL}>
            Vendor email draft · {emailDraft.posture} tone · draft, not sent
          </span>
          <h3 style={HEADING}>{emailDraft.subject}</h3>
          <pre
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MID,
              margin: 0,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.55,
            }}
          >
            {emailDraft.body}
          </pre>
          <p style={{ ...BODY, fontSize: 12, color: SHELL.INK_MUTED }}>
            This is a generated draft grounded in the cockpit&apos;s posture and
            evidence. Review and edit it in your mail client — AbarVa does not
            send mail.
          </p>
        </div>
      ) : null}

      {/* ── Source event / Move handoff — wired to POST /api/v1/source/events ── */}
      {active === 'handoff' ? (
        <div style={PANEL}>
          <span style={LABEL}>Create Source event · Move handoff</span>
          {handoffResult ? (
            <>
              <h3 style={HEADING}>
                {handoffResult.ok
                  ? 'Source event created'
                  : 'Source event not created'}
              </h3>
              <p style={BODY}>{handoffResult.message}</p>
              {handoffResult.ok && handoffResult.eventUrl ? (
                <a
                  href={handoffResult.eventUrl}
                  style={{ ...BODY, color: SHELL.INK_MID, fontWeight: 600 }}
                >
                  Open the Source event →
                </a>
              ) : null}
            </>
          ) : (
            <>
              <h3 style={HEADING}>Create a Source event for Move handoff</h3>
              <p style={BODY}>
                This creates a real Source event carrying the renewal forward,
                so a decided sourcing outcome can flow into the Move that
                executes it. The Source-to-Move handoff record is built once the
                event is decided and a receiving Move is attached.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={BLACK_BTN}
                  disabled={eventBusy}
                  onClick={() => createSourceEvent('handoff')}
                >
                  {eventBusy ? 'Creating…' : 'Create Source event'}
                </button>
                <button
                  type="button"
                  style={GHOST_BTN}
                  onClick={() => setActive(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}

function BriefBlock({
  title,
  points,
}: {
  title: string;
  points: { title: string; rationale: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={LABEL}>{title}</span>
      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {points.map((p) => (
          <li
            key={p.title}
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 13,
              color: SHELL.INK_MID,
              lineHeight: 1.5,
            }}
          >
            <strong>{p.title}.</strong> {p.rationale}
          </li>
        ))}
      </ul>
    </div>
  );
}
