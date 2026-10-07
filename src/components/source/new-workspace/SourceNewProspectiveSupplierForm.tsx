"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SourceNewProspectiveSupplierForm({
  eventId,
  requestVersionId,
  canOriginate,
}: {
  eventId: string;
  requestVersionId: string | null;
  canOriginate: boolean;
}) {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [rationale, setRationale] = useState("");
  const [contactPermission, setContactPermission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  if (!canOriginate || !requestVersionId) return null;

  const ready =
    legalName.trim().length >= 3 &&
    contactName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) &&
    rationale.trim().length >= 12 &&
    contactPermission;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(event.currentTarget.action, {
        method: "POST",
        body: new FormData(event.currentTarget),
        headers: { Accept: "application/json" },
      });
      const result = await response.json() as { ok: boolean; detail?: string };
      if (!response.ok || !result.ok) {
        setMessage(result.detail ?? "The supplier could not be recorded. Review the details and try again.");
        return;
      }
      setLegalName("");
      setContactName("");
      setContactEmail("");
      setRationale("");
      setContactPermission(false);
      setMessage("Prospective supplier added to this event.");
      router.refresh();
    } catch {
      setMessage("The supplier could not be recorded. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <details className="snw-prospect">
      <summary>Add a prospective supplier</summary>
      <form
        action={`/api/v1/source/${encodeURIComponent(eventId)}/candidate-suppliers/originate`}
        method="post"
        onSubmit={submit}
      >
        <input type="hidden" name="eventVersionId" value={requestVersionId} />
        <label>
          <span>Legal name</span>
          <input name="legalName" value={legalName} onChange={(event) => setLegalName(event.target.value)} minLength={3} maxLength={200} required />
        </label>
        <label>
          <span>Contact name</span>
          <input name="contactName" value={contactName} onChange={(event) => setContactName(event.target.value)} minLength={2} maxLength={200} required />
        </label>
        <label>
          <span>Contact email</span>
          <input name="contactEmail" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} maxLength={320} required />
        </label>
        <label className="snw-prospect-wide">
          <span>Reason for adding</span>
          <input name="rationale" value={rationale} onChange={(event) => setRationale(event.target.value)} minLength={12} required />
        </label>
        <label className="snw-prospect-confirm snw-prospect-wide">
          <input
            type="checkbox"
            name="contactPermissionConfirmed"
            checked={contactPermission}
            onChange={(event) => setContactPermission(event.target.checked)}
            required
          />
          <span>I confirm this contact may be recorded for future governed supplier work.</span>
        </label>
        <p className="snw-note snw-prospect-wide">This records an event candidate, not an ERP or payable vendor. No message is sent.</p>
        {message && <p className="snw-prospect-message snw-prospect-wide" role="status">{message}</p>}
        <button className="snw-primary snw-prospect-action" type="submit" disabled={!ready || submitting}>
          {submitting ? "Adding supplier..." : "Add prospective supplier"}
        </button>
      </form>
    </details>
  );
}
