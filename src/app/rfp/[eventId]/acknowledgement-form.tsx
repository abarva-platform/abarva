'use client';

// The acknowledgement. This is the step with legal weight, so the form says
// what is being recorded and who it is attributed to, rather than hiding it.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AcknowledgementForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [intends, setIntends] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (intends === null) {
      setError('Choose whether your organisation intends to respond.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/source/rfp/${eventId}/acknowledge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          intendsToRespond: intends,
          declaredName: name,
          declaredTitle: title,
          declaredEmail: email,
          declineReason: reason,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        router.refresh();
        return;
      }
      if (data.error === 'already_answered') {
        setError('Someone at your organisation has already answered. Refresh to see the current status.');
      } else if (data.error === 'declared_contact_required') {
        setError('Your name, title and email are required — they are recorded with the response.');
      } else if (data.error === 'invitation_expired') {
        setError('The window to accept this invitation has closed. Contact the procurement lead.');
      } else {
        setError('That could not be recorded. Try again, or contact the procurement lead.');
      }
    } catch {
      setError('Could not reach the server. Try again shortly.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={S.block}>
      <h2 style={S.h2}>Confirm your intent</h2>
      <p style={S.note}>
        Record whether your organisation intends to submit a response. This is kept as part of the
        procurement record, and the RFP package becomes available to download once an intent to
        respond is recorded.
      </p>
      <form onSubmit={submit}>
        <div style={S.choices}>
          <button
            type="button"
            onClick={() => setIntends(true)}
            style={{ ...S.choice, ...(intends === true ? S.choiceOn : {}) }}
          >
            We intend to respond
          </button>
          <button
            type="button"
            onClick={() => setIntends(false)}
            style={{ ...S.choice, ...(intends === false ? S.choiceOn : {}) }}
          >
            We decline to respond
          </button>
        </div>

        <div style={S.grid}>
          <div>
            <label style={S.label} htmlFor="ack-name">Your name</label>
            <input id="ack-name" style={S.input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={S.label} htmlFor="ack-title">Your title</label>
            <input id="ack-title" style={S.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label style={S.label} htmlFor="ack-email">Your email</label>
            <input id="ack-email" type="email" style={S.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        {intends === false ? (
          <div style={{ marginTop: 14 }}>
            <label style={S.label} htmlFor="ack-reason">Reason for declining (optional)</label>
            <input id="ack-reason" style={S.input} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        ) : null}

        {/* Said plainly, because the credential is shared and the record must not
            imply an identity check that did not happen. */}
        <p style={S.disclosure}>
          This login is shared across your organisation, so we cannot verify who is submitting this.
          The details above are recorded as your organisation&rsquo;s own declaration.
        </p>

        {error ? <p style={S.error}>{error}</p> : null}
        <button type="submit" style={{ ...S.submit, opacity: busy ? 0.6 : 1 }} disabled={busy}>
          {busy ? 'Recording…' : 'Record our response'}
        </button>
      </form>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  block: { marginTop: 34, padding: '24px 26px', background: '#fff', border: '1px solid #1b2b5c', borderRadius: 14 },
  h2: { margin: 0, fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 22, color: '#1b2b5c' },
  note: { margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: '#5d6c80' },
  choices: { display: 'flex', gap: 12, margin: '20px 0 18px', flexWrap: 'wrap' },
  choice: { flex: '1 1 220px', padding: '13px 18px', fontSize: 14.5, fontWeight: 700, color: '#3d5570', background: '#fffcf7', border: '1px solid #dde3ea', borderRadius: 10, cursor: 'pointer' },
  choiceOn: { color: '#fff', background: '#1b2b5c', borderColor: '#1b2b5c' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 },
  label: { display: 'block', fontSize: 11.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: '#3d5570', marginBottom: 7 },
  input: { width: '100%', padding: '10px 12px', fontSize: 14.5, border: '1px solid #dde3ea', borderRadius: 9, background: '#fffcf7', color: '#1b2b5c' },
  disclosure: { margin: '18px 0 0', fontSize: 13, lineHeight: 1.55, color: '#8a6118', background: '#fdf6ea', border: '1px solid #e8cfa0', borderRadius: 9, padding: '11px 14px' },
  error: { margin: '14px 0 0', padding: '11px 14px', fontSize: 13.5, lineHeight: 1.5, color: '#8a3b36', background: '#fdf6f5', border: '1px solid #e6c6c6', borderRadius: 9 },
  submit: { marginTop: 18, padding: '12px 26px', fontSize: 15, fontWeight: 700, color: '#fff', background: '#1b2b5c', border: 'none', borderRadius: 9, cursor: 'pointer' },
};
