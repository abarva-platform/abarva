'use client';

import { useState } from 'react';

const ROLES = [
  { id: 'client_viewer', label: 'Client viewer', desc: 'Tenant-scoped read access · Home + Programs + Tower' },
  { id: 'maestro', label: 'Maestro', desc: 'AbarVa delivery · multi-tenant engagement work' },
  { id: 'observer', label: 'Observer', desc: 'Investor / design partner · Home + Tower only' },
  { id: 'admin', label: 'Admin', desc: 'Full access · provisioning + audit · use sparingly' },
] as const;

const TENANTS = [
  { id: 'apex', name: 'Apex Retail Group' },
  { id: 'meridian', name: 'Meridian Health System' },
  { id: 'arcturus', name: 'Arcturus Financial Group' },
  { id: 'keystone', name: 'Keystone Energy' },
  { id: '', name: 'No tenant (admin / unbound)' },
] as const;

export function InviteUserForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('client_viewer');
  const [tenant, setTenant] = useState<string>('apex');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: true; email: string } | { ok: false; error: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const selectedTenant = TENANTS.find((t) => t.id === tenant);
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          clientId: selectedTenant?.id || undefined,
          clientName: selectedTenant?.name && selectedTenant.id ? selectedTenant.name : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: data.error ?? `HTTP ${res.status}` });
      } else {
        setResult({ ok: true, email: data.email });
        setEmail('');
      }
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : 'network error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{formCss}</style>
      <form className="iuf-form" onSubmit={handleSubmit}>
        <div className="iuf-row">
          <label className="iuf-field">
            <span className="iuf-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="teammate@example.com"
              className="iuf-input"
            />
          </label>
        </div>
        <div className="iuf-row two-col">
          <label className="iuf-field">
            <span className="iuf-label">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="iuf-input">
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <span className="iuf-hint">{ROLES.find((r) => r.id === role)?.desc}</span>
          </label>
          <label className="iuf-field">
            <span className="iuf-label">Tenant</span>
            <select value={tenant} onChange={(e) => setTenant(e.target.value)} className="iuf-input">
              {TENANTS.map((t) => (
                <option key={t.id || 'none'} value={t.id}>{t.name}</option>
              ))}
            </select>
            <span className="iuf-hint">Pre-seeds clientId in Clerk public metadata</span>
          </label>
        </div>
        <div className="iuf-actions">
          <button type="submit" className="iuf-submit" disabled={submitting || !email.trim()}>
            {submitting ? 'Sending…' : 'Send invitation →'}
          </button>
          {result?.ok ? (
            <span className="iuf-result ok">Sent to {result.email}</span>
          ) : null}
          {result && !result.ok ? (
            <span className="iuf-result err">Failed: {result.error}</span>
          ) : null}
        </div>
      </form>
    </>
  );
}

const formCss = `
.iuf-form { display: flex; flex-direction: column; gap: 14px; }
.iuf-row { display: flex; gap: 16px; }
.iuf-row.two-col .iuf-field { flex: 1; }
.iuf-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.iuf-label {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #8a7e72; font-weight: 700;
}
.iuf-input {
  padding: 9px 11px; border-radius: 8px;
  border: 1px solid rgba(26,22,18,0.14); background: #FFFFFF; color: #1a1612;
  font-family: 'DM Sans', sans-serif; font-size: 14px;
}
.iuf-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.iuf-hint { font-size: 11px; color: #8a7e72; font-style: italic; }
.iuf-actions { display: flex; align-items: center; gap: 14px; margin-top: 4px; }
.iuf-submit {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700;
  padding: 10px 18px; border-radius: 999px; border: 1px solid transparent;
  background: #3B82F6; color: #FFFFFF; cursor: pointer;
}
.iuf-submit:hover { background: #2b6cdb; }
.iuf-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.iuf-result { font-size: 12px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; }
.iuf-result.ok { color: #0e9f8c; }
.iuf-result.err { color: #b5452f; }
`;
