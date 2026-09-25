'use client';

// Vendor sign-in. Outside the Clerk shell entirely — a competing vendor is not
// a platform user and must not see internal chrome, navigation, or tenant names.

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function VendorSignInPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/source/rfp/${params.eventId}/sign-in`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; retryAfterSeconds?: number };
      if (data.ok) {
        router.push(`/rfp/${params.eventId}`);
        return;
      }
      // Say what to do next, not just what failed. The credential is shared, so
      // "ask whoever received the invitation" is usually the real answer.
      if (data.error === 'too_many_attempts') {
        setError(
          `Too many attempts. Try again in ${data.retryAfterSeconds ?? 30} seconds — your access is not locked.`,
        );
      } else if (data.error === 'access_withdrawn') {
        setError('Access to this solicitation has been withdrawn. Contact the procurement lead.');
      } else {
        setError(
          'That username and password did not match. Check the invitation email, or ask the colleague who received it.',
        );
      }
    } catch {
      setError('Could not reach the server. Try again shortly.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <p style={S.eyebrow}>Request for Proposal</p>
        <h1 style={S.h1}>Sign in to respond</h1>
        <p style={S.lede}>
          Use the username and password from your invitation email. This login is issued to your
          organisation and may be shared with colleagues preparing the response.
        </p>
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <label style={S.label} htmlFor="username">Username</label>
          <input
            id="username"
            style={S.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <label style={{ ...S.label, marginTop: 16 }} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            style={S.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error ? <p style={S.error}>{error}</p> : null}
          <button type="submit" style={{ ...S.button, opacity: busy ? 0.6 : 1 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f7f5ef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
    color: '#1b2b5c',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#fff',
    border: '1px solid #dde3ea',
    borderRadius: 16,
    padding: '36px 34px',
  },
  eyebrow: {
    margin: 0,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: '#5d6c80',
  },
  h1: { margin: '12px 0 0', fontFamily: 'Georgia, serif', fontWeight: 500, fontSize: 28 },
  lede: { margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.6, color: '#5d6c80' },
  label: {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 800,
    letterSpacing: '.09em',
    textTransform: 'uppercase',
    color: '#3d5570',
    marginBottom: 7,
  },
  input: {
    width: '100%',
    padding: '11px 13px',
    fontSize: 15,
    border: '1px solid #dde3ea',
    borderRadius: 9,
    background: '#fffcf7',
    color: '#1b2b5c',
    fontFamily: 'ui-monospace, Menlo, monospace',
  },
  error: {
    margin: '16px 0 0',
    padding: '11px 14px',
    fontSize: 13.5,
    lineHeight: 1.5,
    color: '#8a3b36',
    background: '#fdf6f5',
    border: '1px solid #e6c6c6',
    borderRadius: 9,
  },
  button: {
    marginTop: 22,
    width: '100%',
    padding: '12px 20px',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    background: '#1b2b5c',
    border: 'none',
    borderRadius: 9,
    cursor: 'pointer',
  },
};
