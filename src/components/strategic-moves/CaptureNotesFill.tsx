"use client";

import { useMemo, useState } from "react";
import {
  proposeCaptureValuesFromNotes,
  type CaptureNotesProposal,
  type CaptureNotesTarget,
} from "@/lib/programs/capture-notes-proposal";

/**
 * Paste-client-notes → governed fill-from-notes, for the aVa dock above the
 * 3-step capture flow.
 *
 * The shape is propose → review → insert, and the middle step is the point:
 * the panel shows, per field, the VERBATIM span of the pasted notes it came
 * from and the words that caused the match, and writes nothing until the person
 * presses Insert on that specific field. Dismiss drops a proposal without
 * touching the field.
 *
 * It also refuses to overstate what a paste is. Notes a consultant typed after
 * a conversation are an assertion, not approved evidence, so the panel says so
 * once at the top and every proposal carries the assertion wording — nothing
 * here ever reads as "evidence covered".
 *
 * Gated by `moves_capture_notes_v1`. The host renders it only when the flag is
 * on for the tenant; with the flag off the dock is byte-for-byte unchanged.
 */
export interface CaptureNotesFillProps {
  /** The current phase's sections plus their captured values. */
  targets: readonly CaptureNotesTarget[];
  /**
   * Write one proposal into a field. Called only from an explicit per-field
   * Insert. The host owns persistence, exactly as it does for a typed answer.
   */
  onInsert: (sectionKey: string, value: string) => void;
  /**
   * Section keys where inserting ALSO records "I'm asserting this" as the
   * field's charter basis, because the host has the per-field basis control
   * active there and the field has not had a basis declared yet.
   *
   * Presentational only: the host decides the set and performs the write. The
   * panel needs it so its wording is true of the field in front of the person
   * rather than true in general — with the basis control off, the person still
   * declares the basis by hand, and saying otherwise would be a lie about
   * where a number came from.
   */
  recordsBasisFor?: readonly string[];
}

const CNF_CSS = `
.cnf{--cnf-cream:#f5f1eb;--cnf-surface:#fff;--cnf-ink:#2c2c2a;--cnf-teal:#1d9e75;--cnf-amber:#ba7517;--cnf-line:rgba(44,44,42,.14);--cnf-muted:rgba(44,44,42,.62);--cnf-mono:"JetBrains Mono",ui-monospace,monospace;--cnf-sans:"Inter",system-ui,sans-serif;font-family:var(--cnf-sans);color:var(--cnf-ink);margin:0 0 14px}
.cnf-open{display:block;width:100%;box-sizing:border-box;text-align:left;border:1px dashed var(--cnf-line);background:var(--cnf-surface);border-radius:10px;padding:11px 16px;font-family:var(--cnf-sans);font-size:12.5px;font-weight:600;color:var(--cnf-ink);cursor:pointer}
.cnf-open:hover{border-color:var(--cnf-teal);color:#147c5b}
.cnf-panel{background:var(--cnf-surface);border:1px solid var(--cnf-line);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:11px}
.cnf-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.cnf-title{font-family:var(--cnf-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--cnf-muted);margin:0}
.cnf-close{border:0;background:none;color:var(--cnf-muted);font-size:12.5px;font-weight:500;cursor:pointer;padding:0}
.cnf-note{margin:0;font-size:12.5px;color:var(--cnf-muted);line-height:1.5}
.cnf-textarea{width:100%;box-sizing:border-box;min-height:96px;resize:vertical;border:1px solid var(--cnf-line);border-radius:9px;padding:10px 12px;font-family:var(--cnf-sans);font-size:13.5px;line-height:1.55;color:var(--cnf-ink);background:var(--cnf-cream)}
.cnf-textarea:focus{outline:2px solid rgba(29,158,117,.35);outline-offset:1px;border-color:var(--cnf-teal)}
.cnf-actions{display:flex;align-items:center;gap:10px}
.cnf-propose{border:0;background:var(--cnf-teal);color:#fff;font-size:12.5px;font-weight:600;padding:8px 15px;border-radius:8px;cursor:pointer}
.cnf-propose:disabled{background:rgba(44,44,42,.2);cursor:not-allowed}
.cnf-basis{border:1px solid rgba(186,117,23,.4);background:#fdf6ec;border-radius:9px;padding:9px 12px;margin:0;font-size:12.5px;color:#8a560f;line-height:1.5}
.cnf-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.cnf-item{border:1px solid var(--cnf-line);border-left:2px solid var(--cnf-amber);border-radius:10px;padding:11px 13px;display:flex;flex-direction:column;gap:7px}
.cnf-item-head{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.cnf-field{font-size:13.5px;font-weight:600}
.cnf-assert{font-family:var(--cnf-mono);font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:#8a560f;border:1px solid rgba(186,117,23,.45);border-radius:4px;padding:2px 6px}
.cnf-excerpt{margin:0;font-size:13.5px;line-height:1.55;color:var(--cnf-ink);border-left:2px solid var(--cnf-line);padding-left:11px}
.cnf-why{margin:0;font-size:11.5px;color:var(--cnf-muted);font-family:var(--cnf-mono)}
.cnf-item-actions{display:flex;gap:8px}
.cnf-insert{border:0;background:var(--cnf-teal);color:#fff;font-size:12.5px;font-weight:600;padding:7px 14px;border-radius:8px;cursor:pointer}
.cnf-dismiss{border:0;background:none;color:var(--cnf-muted);font-size:12.5px;font-weight:500;padding:7px 8px;cursor:pointer}
.cnf-skipped{margin:0;font-size:12px;color:var(--cnf-muted);line-height:1.5}
.cnf-records{margin:0;font-size:12px;color:#8a560f;line-height:1.5}
`;

export function CaptureNotesFill({
  targets,
  onInsert,
  recordsBasisFor = [],
}: CaptureNotesFillProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [proposed, setProposed] = useState(false);
  const [dismissed, setDismissed] = useState<readonly string[]>([]);
  const [inserted, setInserted] = useState<readonly string[]>([]);

  const result = useMemo(() => {
    if (!proposed) return null;
    return proposeCaptureValuesFromNotes({ notes, targets });
  }, [proposed, notes, targets]);

  const visible: readonly CaptureNotesProposal[] = useMemo(() => {
    if (!result) return [];
    return result.proposals.filter(
      (p) =>
        !dismissed.includes(p.sectionKey) && !inserted.includes(p.sectionKey),
    );
  }, [result, dismissed, inserted]);

  // True when at least one proposal still on screen will record its own basis.
  // Derived from what is VISIBLE, so the extra sentence disappears with the
  // last such proposal rather than lingering over a list it no longer describes.
  const anyRecordsBasis = useMemo(
    () => visible.some((p) => recordsBasisFor.includes(p.sectionKey)),
    [visible, recordsBasisFor],
  );

  if (!open) {
    return (
      <div className="cnf">
        <style>{CNF_CSS}</style>
        <button
          type="button"
          className="cnf-open"
          data-testid="capture-notes-open"
          onClick={() => setOpen(true)}
        >
          Paste client notes
        </button>
      </div>
    );
  }

  return (
    <div className="cnf" data-testid="capture-notes-fill">
      <style>{CNF_CSS}</style>
      <div className="cnf-panel">
        <div className="cnf-head">
          <p className="cnf-title">Fill from client notes</p>
          <button
            type="button"
            className="cnf-close"
            onClick={() => {
              setOpen(false);
              setProposed(false);
            }}
          >
            Close
          </button>
        </div>

        <p className="cnf-note">
          Paste your notes from the conversation. aVa proposes which answer each
          passage belongs to and shows you the passage it used. Nothing is
          written to a field until you insert it.
        </p>

        <textarea
          className="cnf-textarea"
          data-testid="capture-notes-input"
          aria-label="Client notes"
          value={notes}
          placeholder="e.g. Sponsor is the COO; she wants a fortnightly update. Out of scope: anything touching the billing platform this year."
          onChange={(event) => {
            setNotes(event.target.value);
            setProposed(false);
          }}
        />

        <div className="cnf-actions">
          <button
            type="button"
            className="cnf-propose"
            data-testid="capture-notes-propose"
            disabled={notes.trim().length === 0}
            onClick={() => {
              setDismissed([]);
              setProposed(true);
            }}
          >
            Propose fills
          </button>
        </div>

        {result ? (
          <>
            <p className="cnf-basis" data-testid="capture-notes-basis-warning">
              Your notes are your own account of the conversation, so anything
              you insert is recorded as <strong>your assertion</strong> — not as
              approved evidence. Attach the source document to a field if you
              need it to count as evidence.
              {anyRecordsBasis ? (
                <span data-testid="capture-notes-basis-recorded-note">
                  {" "}
                  Where a field asks how you know its answer, inserting records
                  that assertion for you — change it on the field if the answer
                  is backed by evidence or is really an assumption.
                </span>
              ) : null}
            </p>

            {visible.length === 0 ? (
              <p className="cnf-skipped" data-testid="capture-notes-empty">
                No passage matched an unanswered question on this phase. Edit the
                notes and propose again, or answer the fields directly.
              </p>
            ) : (
              <ul className="cnf-list">
                {visible.map((proposal) => (
                  <li
                    className="cnf-item"
                    key={proposal.sectionKey}
                    data-testid={`capture-notes-proposal-${proposal.sectionKey}`}
                  >
                    <div className="cnf-item-head">
                      <span className="cnf-field">{proposal.sectionLabel}</span>
                      <span className="cnf-assert">
                        {recordsBasisFor.includes(proposal.sectionKey)
                          ? "From your notes · records your assertion"
                          : "From your notes · your assertion"}
                      </span>
                    </div>
                    <blockquote className="cnf-excerpt">
                      {proposal.excerpt}
                    </blockquote>
                    <p className="cnf-why">
                      line {proposal.sourceLine} · matched{" "}
                      {proposal.matchedTerms.join(", ")}
                    </p>
                    {recordsBasisFor.includes(proposal.sectionKey) ? (
                      <p
                        className="cnf-records"
                        data-testid={`capture-notes-records-basis-${proposal.sectionKey}`}
                      >
                        Inserting also records <strong>I&rsquo;m asserting
                        this</strong> as how you know this answer. It completes
                        the charter and never reads as evidence.
                      </p>
                    ) : null}
                    <div className="cnf-item-actions">
                      <button
                        type="button"
                        className="cnf-insert"
                        data-testid={`capture-notes-insert-${proposal.sectionKey}`}
                        onClick={() => {
                          onInsert(proposal.sectionKey, proposal.excerpt);
                          setInserted((prev) => [...prev, proposal.sectionKey]);
                        }}
                      >
                        Insert into {proposal.sectionLabel}
                      </button>
                      <button
                        type="button"
                        className="cnf-dismiss"
                        data-testid={`capture-notes-dismiss-${proposal.sectionKey}`}
                        onClick={() =>
                          setDismissed((prev) => [...prev, proposal.sectionKey])
                        }
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {result.skippedAnswered.length > 0 ? (
              <p
                className="cnf-skipped"
                data-testid="capture-notes-skipped-answered"
              >
                {result.skippedAnswered.length} question
                {result.skippedAnswered.length === 1 ? "" : "s"} already
                answered — left untouched. Clear a field first if you want to
                refill it from notes.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
