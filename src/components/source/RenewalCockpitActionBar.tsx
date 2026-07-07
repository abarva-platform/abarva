'use client';

// Renewal Cockpit — action bar (Practitioner-Fit §2 / §4).
//
// The usability test scored the cockpit 3/5: "It tells me what to do, but
// doesn't let me do it." This bar is the fix — it lets a VP *act* from the
// cockpit, not just read.
//
// Honesty rule (the spec's hard constraint): every action is wired to a real
// capability. No button shows a fake success and none does nothing:
//
//   - Start rebid / Create Source event  → POST /api/v1/source/events (real)
//   - Open negotiation brief             → renders the real composed brief
//   - Draft vendor email                 → renders the real generated draft
//   - Serve notice                       → POST /api/v1/source/work-items
//                                          creates a real `serve_notice`
//                                          sourcing work item with a due
//                                          date + legal/procurement status.
//                                          AbarVa still does not issue the
//                                          formal legal notice — it persists
//                                          the task that drives that hand-off.
//   - Assign owner                       → POST /api/v1/source/work-items
//                                          creates a real `owner_assignment`
//                                          work item with the named owner.
//   - Create Tower watch item            → POST /api/v1/source/work-items
//                                          creates a real `tower_watch` work
//                                          item, readable by the Tower
//                                          portfolio.
//
// The work item carries an owner, a due date (SLA), a status, and an audit
// trail (created_by / created_at) — the action layer the VP usability test
// said the console needed to be relied on as an operating system.
//
// Locked design system: cream surface, Fraunces serif, Inter sans, JetBrains
// mono labels, black primary / ghost secondary buttons.

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS } from '@/lib/source/external-action-gate';
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
  | 'handoff'
  | 'tower_watch';

interface EventResult {
  ok: boolean;
  message: string;
  eventUrl?: string;
}

/** A persisted-work-item kind the cockpit can create. */
type WorkItemKind = 'serve_notice' | 'owner_assignment' | 'tower_watch';

interface WorkItemResult {
  ok: boolean;
  message: string;
}

export function RenewalCockpitActionBar({ cockpit }: { cockpit: RenewalCockpit }) {
  const [active, setActive] = useState<ActivePanel>(null);

  // Owner-assignment input.
  const [ownerName, setOwnerName] = useState('');
  const [serveNoticeJustification, setServeNoticeJustification] =
    useState('');

  // Persisted work-item state — keyed by kind. Each result reflects a real
  // POST /api/v1/source/work-items round-trip; no fake success.
  const [workItemBusy, setWorkItemBusy] = useState<WorkItemKind | null>(null);
  const [noticeResult, setNoticeResult] = useState<WorkItemResult | null>(null);
  const [ownerResult, setOwnerResult] = useState<WorkItemResult | null>(null);
  const [towerWatchResult, setTowerWatchResult] =
    useState<WorkItemResult | null>(null);

  // Real source-event creation state.
  const [eventBusy, setEventBusy] = useState(false);
  const [rebidResult, setRebidResult] = useState<EventResult | null>(null);
  const [handoffResult, setHandoffResult] = useState<EventResult | null>(null);

  function toggle(panel: ActivePanel) {
    setActive((current) => (current === panel ? null : panel));
  }

  /**
   * Create a persisted sourcing work item for this renewal. The subject is
   * always the cockpit's contract; the server stamps the tenant + acting
   * user. Returns a real result — the panels never claim success without it.
   */
  async function createWorkItem(
    kind: WorkItemKind,
    fields: {
      title: string;
      owner?: string;
      dueDate?: string;
      legalStatus?: string;
      procurementStatus?: string;
      note?: string;
      humanConfirmed?: boolean;
      humanJustification?: string;
      evidenceRefs?: string[];
    },
  ): Promise<void> {
    setWorkItemBusy(kind);
    const setter =
      kind === 'serve_notice'
        ? setNoticeResult
        : kind === 'owner_assignment'
          ? setOwnerResult
          : setTowerWatchResult;
    try {
      const res = await fetch('/api/v1/source/work-items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind,
          subjectKind: 'contract',
          subjectRef: cockpit.contractId,
          subjectLabel: `${cockpit.vendorName} — ${cockpit.product}`,
          ...fields,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; detail?: string; error?: string };
      if (res.ok && data.ok) {
        setter({
          ok: true,
          message:
            kind === 'serve_notice'
              ? 'Serve-notice work item created. It is persisted with its due date and legal / procurement status, and shows on the Decision Queue card with its owner and SLA.'
              : kind === 'owner_assignment'
                ? 'Owner assignment persisted. The owner and SLA now surface on the Decision Queue card for this contract.'
                : 'Tower watch item created. It is persisted and readable by the Tower portfolio.',
        });
      } else {
        setter({
          ok: false,
          message:
            data.detail ??
            data.error ??
            'Could not create the work item. Try again.',
        });
      }
    } catch {
      setter({
        ok: false,
        message: 'Network error creating the work item. Try again.',
      });
    } finally {
      setWorkItemBusy(null);
    }
  }

  // The notice SLA — the last date to serve notice, derived from the cockpit
  // timing (term end minus the notice period). Persisted as the work item's
  // `due_date`. Falls back to the term-end date when no notice period is set.
  const noticeDueDate = computeNoticeDueDate(
    cockpit.timing.termEndDate,
    cockpit.timing.noticePeriodDays,
  );
  const serveNoticeEvidenceRefs = [
    `contract:${cockpit.contractId}`,
    `vendor:${cockpit.vendorName}`,
    `posture:${cockpit.postureLabel}`,
  ];
  const serveNoticeRationaleReady =
    serveNoticeJustification.trim().length >=
    SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS;

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
          style={active === 'tower_watch' ? BLACK_BTN : GHOST_BTN}
          onClick={() => toggle('tower_watch')}
        >
          Create Tower watch item
        </button>
      </div>

      {/* ── Serve notice — persisted serve_notice work item ── */}
      {active === 'serve_notice' ? (
        <div style={PANEL}>
          <span style={LABEL}>Serve notice · decline auto-renewal</span>
          {noticeResult ? (
            <>
              <h3 style={HEADING}>
                {noticeResult.ok
                  ? 'Serve-notice work item created'
                  : 'Work item not created'}
              </h3>
              <p style={BODY}>{noticeResult.message}</p>
            </>
          ) : (
            <>
              <h3 style={HEADING}>Decline the auto-renewal?</h3>
              <p style={BODY}>
                This creates a persisted <strong>serve-notice</strong> work
                item for{' '}
                <strong>
                  {cockpit.vendorName} — {cockpit.product}
                </strong>
                {noticeDueDate ? (
                  <>
                    {' '}
                    with a notice deadline of <strong>{noticeDueDate}</strong>
                  </>
                ) : null}
                . It tracks the legal / procurement hand-off — AbarVa records
                the task and its SLA; it does not itself issue the formal
                legal notice. The item shows on the Decision Queue card with
                its owner and due date.
              </p>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={LABEL}>Human approval rationale</span>
                <textarea
                  value={serveNoticeJustification}
                  onChange={(e) => setServeNoticeJustification(e.target.value)}
                  placeholder="Summarize the business/legal reason and evidence reviewed before creating this external-action work item."
                  rows={4}
                  style={{
                    fontFamily: SHELL.SANS,
                    fontSize: 13,
                    color: SHELL.INK,
                    border: '1px solid ' + SHELL.CARD_LINE,
                    borderRadius: 7,
                    padding: '9px 10px',
                    lineHeight: 1.45,
                    resize: 'vertical',
                  }}
                />
              </label>
              <p style={{ ...BODY, fontSize: 12, color: SHELL.INK_MUTED }}>
                Required before creation: at least{' '}
                {SOURCE_EXTERNAL_ACTION_RATIONALE_MIN_CHARS} characters and
                evidence refs ({serveNoticeEvidenceRefs.join(', ')}). Human
                review remains responsible for any notice sent outside AbarVa.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={
                    serveNoticeRationaleReady &&
                    workItemBusy !== 'serve_notice'
                      ? BLACK_BTN
                      : DISABLED_BTN
                  }
                  disabled={
                    !serveNoticeRationaleReady ||
                    workItemBusy === 'serve_notice'
                  }
                  onClick={() =>
                    createWorkItem('serve_notice', {
                      title: `Serve notice — ${cockpit.vendorName} ${cockpit.product}`,
                      dueDate: noticeDueDate ?? undefined,
                      legalStatus: 'not_started',
                      procurementStatus: 'not_started',
                      note: `Decline the auto-renewal on contract ${cockpit.contractId}. ${cockpit.timing.summary}`,
                      humanConfirmed: true,
                      humanJustification: serveNoticeJustification.trim(),
                      evidenceRefs: serveNoticeEvidenceRefs,
                    })
                  }
                >
                  {workItemBusy === 'serve_notice'
                    ? 'Creating…'
                    : 'Create serve-notice work item'}
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

      {/* ── Assign owner — persisted owner_assignment work item ── */}
      {active === 'assign' ? (
        <div style={PANEL}>
          <span style={LABEL}>Assign owner</span>
          {ownerResult ? (
            <>
              <h3 style={HEADING}>
                {ownerResult.ok
                  ? 'Owner assignment persisted'
                  : 'Assignment not created'}
              </h3>
              <p style={BODY}>{ownerResult.message}</p>
            </>
          ) : (
            <>
              <h3 style={HEADING}>Who owns this renewal?</h3>
              <p style={BODY}>
                Name the accountable owner. This persists an{' '}
                <strong>owner-assignment</strong> work item — the owner and
                SLA then surface on the Decision Queue card for{' '}
                <strong>
                  {cockpit.vendorName} — {cockpit.product}
                </strong>
                .
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
                  style={
                    ownerName.trim() && workItemBusy !== 'owner_assignment'
                      ? BLACK_BTN
                      : DISABLED_BTN
                  }
                  disabled={
                    !ownerName.trim() || workItemBusy === 'owner_assignment'
                  }
                  onClick={() =>
                    createWorkItem('owner_assignment', {
                      title: `Renewal owner — ${cockpit.vendorName} ${cockpit.product}`,
                      owner: ownerName.trim(),
                      dueDate:
                        computeNoticeDueDate(
                          cockpit.timing.termEndDate,
                          cockpit.timing.noticePeriodDays,
                        ) ?? undefined,
                      note: `Accountable owner for the ${cockpit.vendorName} ${cockpit.product} renewal (contract ${cockpit.contractId}).`,
                    })
                  }
                >
                  {workItemBusy === 'owner_assignment'
                    ? 'Saving…'
                    : 'Persist assignment'}
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

      {/* ── Tower watch item — persisted tower_watch work item ── */}
      {active === 'tower_watch' ? (
        <div style={PANEL}>
          <span style={LABEL}>Create Tower watch item</span>
          {towerWatchResult ? (
            <>
              <h3 style={HEADING}>
                {towerWatchResult.ok
                  ? 'Tower watch item created'
                  : 'Watch item not created'}
              </h3>
              <p style={BODY}>{towerWatchResult.message}</p>
            </>
          ) : (
            <>
              <h3 style={HEADING}>Surface this renewal in Tower?</h3>
              <p style={BODY}>
                This persists a <strong>Tower watch</strong> work item for{' '}
                <strong>
                  {cockpit.vendorName} — {cockpit.product}
                </strong>
                . It is a real, tenant-scoped record — the Tower portfolio
                reads <code>tower_watch</code> work items, so the renewal
                becomes visible there.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  style={BLACK_BTN}
                  disabled={workItemBusy === 'tower_watch'}
                  onClick={() =>
                    createWorkItem('tower_watch', {
                      title: `Tower watch — ${cockpit.vendorName} ${cockpit.product} renewal`,
                      dueDate: cockpit.timing.termEndDate ?? undefined,
                      note: `Renewal watched in the Tower portfolio. Recommended posture: ${cockpit.postureLabel}. Contract ${cockpit.contractId}.`,
                    })
                  }
                >
                  {workItemBusy === 'tower_watch'
                    ? 'Creating…'
                    : 'Create watch item'}
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

/**
 * The last date to serve notice — the term-end date pulled back by the
 * notice period. Returns `null` when no term-end date is known; falls back to
 * the term-end date itself when no notice period is set.
 */
function computeNoticeDueDate(
  termEndDate: string | null,
  noticePeriodDays: number | null,
): string | null {
  if (!termEndDate) return null;
  if (noticePeriodDays === null || noticePeriodDays <= 0) return termEndDate;
  const end = new Date(`${termEndDate}T00:00:00Z`);
  if (Number.isNaN(end.getTime())) return termEndDate;
  end.setUTCDate(end.getUTCDate() - noticePeriodDays);
  return end.toISOString().slice(0, 10);
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
