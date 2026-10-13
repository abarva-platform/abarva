"use client";
import { useState } from "react";
import type { P1ParticipantBindingCommand } from "@/lib/programs/p1-participant-binding";
import type { P1ParticipantBindingControl } from "./useP1ParticipantBinding";
import styles from "./MovesStepPage.module.css";

export function P1ParticipantBindingForm({
  control,
  captureBusy = false,
}: {
  control: P1ParticipantBindingControl;
  captureBusy?: boolean;
}) {
  const [sponsor, setSponsor] = useState("");
  const [lead, setLead] = useState("");
  const [rationale, setRationale] = useState("");
  const [reviewed, setReviewed] = useState<P1ParticipantBindingCommand | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const preview = control.preview;
  if (control.loading)
    return <p role="status">Reading current sponsor contact and lead…</p>;
  if (!preview || preview.status !== "available")
    return (
      <div>
        <p role="alert">
          {control.error ||
            preview?.reason ||
            "The current contact preview is unavailable."}
        </p>
        <button
          type="button"
          className={styles["link-btn"]}
          disabled={control.saving}
          onClick={() => void control.reload()}
        >
          Read current contact preview
        </button>
      </div>
    );
  const person = (id: string | null) =>
    preview.choices.find((choice) => choice.personId === id)?.name ||
    "Unconfirmed role or participant";
  const ready = Boolean(
    preview.canConfirm &&
    sponsor &&
    lead &&
    rationale.trim() &&
    rationale.length <= 2000 &&
    !captureBusy &&
    !control.saving,
  );
  return (
    <div className={styles["participant-binding-form"]}>
      <p>
        Current sponsor contact: {person(preview.current.sponsorPersonId)}.
        Current lead: {person(preview.current.leadPersonId)}.
      </p>
      <p>
        These are operational progress contacts. Signed P0 roles stay as
        recorded. Participant roles, permissions and gate evidence stay
        unchanged.
      </p>
      {preview.confirmed ? (
        <p role="status">Current contacts are confirmed by the stored audit.</p>
      ) : null}
      <button
        type="button"
        className={styles["link-btn"]}
        disabled={control.saving}
        onClick={() => {
          setReviewed(null);
          void control.reload();
        }}
      >
        Read current contact preview
      </button>
      <label className={styles["q-label"]} htmlFor="p1-sponsor-contact">
        Sponsor progress contact
      </label>
      <select
        className={styles["q-input"]}
        id="p1-sponsor-contact"
        value={sponsor}
        disabled={!preview.canConfirm || control.saving}
        onChange={(event) => {
          setSponsor(event.target.value);
          setReviewed(null);
        }}
      >
        <option value="">Choose an existing participant</option>
        {preview.choices.map((choice) => (
          <option key={choice.personId} value={choice.personId}>
            {choice.name} —{" "}
            {choice.attribution === "delegated_automated"
              ? "delegated automated contact"
              : "declared participant"}
          </option>
        ))}
      </select>
      <label className={styles["q-label"]} htmlFor="p1-day-to-day-lead">
        Day-to-day lead
      </label>
      <select
        className={styles["q-input"]}
        id="p1-day-to-day-lead"
        value={lead}
        disabled={!preview.canConfirm || control.saving}
        onChange={(event) => {
          setLead(event.target.value);
          setReviewed(null);
        }}
      >
        <option value="">Choose an existing participant</option>
        {preview.choices.map((choice) => (
          <option key={choice.personId} value={choice.personId}>
            {choice.name} —{" "}
            {choice.attribution === "delegated_automated"
              ? "delegated automated lead"
              : "declared participant"}
          </option>
        ))}
      </select>
      <p>
        Choosing an automated operator records delegated synthetic
        responsibility. It does not establish independent client, executive or
        Finance approval.
      </p>
      {preview.choices.length === 0 ? (
        <p>
          No eligible current declared participant could be verified. A role
          placeholder cannot be selected.
        </p>
      ) : null}
      <label className={styles["q-label"]} htmlFor="p1-contact-rationale">
        Contact confirmation rationale
      </label>
      <textarea
        className={styles["q-input"]}
        id="p1-contact-rationale"
        value={rationale}
        maxLength={2000}
        rows={3}
        disabled={!preview.canConfirm || control.saving}
        onChange={(event) => {
          setRationale(event.target.value);
          setReviewed(null);
        }}
      />
      {captureBusy ? (
        <p role="status">
          Wait for the saved P1 answers before reviewing contacts.
        </p>
      ) : null}
      {!preview.canConfirm ? (
        <p>Current permission to confirm contacts is required.</p>
      ) : null}
      <button
        type="button"
        className={styles["btn-ink"]}
        disabled={!ready}
        onClick={() => {
          setMessage(null);
          setReviewed({
            sponsorPersonId: sponsor,
            leadPersonId: lead,
            expectedRevision: preview.revision,
            requestId: crypto.randomUUID(),
            rationale: rationale.trim(),
          });
        }}
      >
        Review contact confirmation
      </button>
      {reviewed && reviewed.expectedRevision === preview.revision ? (
        <div
          className={`${styles["warn-inline"]} ${styles["participant-binding-review"]}`}
          data-contact-revision={reviewed.expectedRevision}
          data-request-id={reviewed.requestId}
        >
          <p>
            Sponsor contact: {person(preview.current.sponsorPersonId)} →{" "}
            {person(reviewed.sponsorPersonId)}
          </p>
          <p>
            Lead: {person(preview.current.leadPersonId)} →{" "}
            {person(reviewed.leadPersonId)}
          </p>
          <dl>
            <dt>Current sponsor ID</dt>
            <dd>{preview.current.sponsorPersonId || "Absent"}</dd>
            <dt>Selected sponsor ID</dt>
            <dd>{reviewed.sponsorPersonId}</dd>
            <dt>Current lead ID</dt>
            <dd>{preview.current.leadPersonId || "Absent"}</dd>
            <dt>Selected lead ID</dt>
            <dd>{reviewed.leadPersonId}</dd>
          </dl>
          <p>Rationale: {reviewed.rationale}</p>
          <button
            type="button"
            className={styles["btn-ink"]}
            disabled={!ready}
            onClick={async () => {
              try {
                await control.confirm(reviewed);
                setReviewed(null);
                setMessage(
                  "Sponsor contact and lead saved with the required audit. Protected records and participant permissions are preserved.",
                );
              } catch (failure) {
                setReviewed(null);
                setMessage(
                  failure instanceof Error
                    ? failure.message
                    : "Read the current contacts and audit before retrying.",
                );
              }
            }}
          >
            Confirm sponsor contact and lead
          </button>
        </div>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
