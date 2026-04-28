'use client';
import { useState } from 'react';
import { isWorkEmail } from '@/lib/public-site/work-email';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', program: '', need: '' });
  const [emailError, setEmailError] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'email') {
      if (value && value.includes('@') && !isWorkEmail(value)) {
        setEmailError('Use your work email. We don\'t accept personal email addresses.');
      } else {
        setEmailError('');
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isWorkEmail(form.email)) {
      setEmailError('Use your work email. We don\'t accept personal email addresses.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 15,
    fontFamily: 'var(--pub-font-sans)', color: 'var(--pub-ink)',
    background: '#fff', border: '1px solid var(--pub-rule)', borderRadius: 8,
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--pub-font-sans)', fontSize: 13,
    fontWeight: 600, color: 'var(--pub-slate)', marginBottom: 6,
  };

  if (status === 'success') {
    return (
      <div style={{ padding: '32px', background: '#fff', borderRadius: 12, border: '1px solid var(--pub-rule)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 22, color: 'var(--pub-ink)', marginBottom: 12 }}>Sent.</p>
        <p style={{ fontSize: 15, color: 'var(--pub-slate)' }}>We read every submission and respond to serious inquiries within 48 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }} noValidate>
      <div>
        <label htmlFor="cf-name" style={labelStyle}>Name</label>
        <input id="cf-name" name="name" type="text" required value={form.name} onChange={handleChange} style={inputStyle} placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="cf-email" style={labelStyle}>Work email</label>
        <input id="cf-email" name="email" type="email" required value={form.email} onChange={handleChange} style={{...inputStyle, borderColor: emailError ? '#c0392b' : undefined}} placeholder="you@company.com" />
        {emailError && <p style={{ fontSize: 13, color: '#c0392b', marginTop: 4, fontFamily: 'var(--pub-font-sans)' }}>{emailError}</p>}
      </div>
      <div>
        <label htmlFor="cf-company" style={labelStyle}>Company</label>
        <input id="cf-company" name="company" type="text" required value={form.company} onChange={handleChange} style={inputStyle} placeholder="Acme Corp" />
      </div>
      <div>
        <label htmlFor="cf-program" style={labelStyle}>What AI program are you working on?</label>
        <input id="cf-program" name="program" type="text" required value={form.program} onChange={handleChange} style={inputStyle} placeholder="e.g. Microsoft Copilot rollout, CDP implementation" />
      </div>
      <div>
        <label htmlFor="cf-need" style={labelStyle}>What would AbarVa need to do to be useful to you?</label>
        <textarea id="cf-need" name="need" required value={form.need} onChange={handleChange} rows={4} style={{...inputStyle, resize: 'vertical'}} placeholder="Be specific. The more you tell us, the better we can assess fit." />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{
          padding: '14px 28px', fontSize: 16, fontWeight: 600,
          fontFamily: 'var(--pub-font-sans)', color: '#fff',
          background: status === 'submitting' ? 'var(--pub-stone)' : 'var(--pub-signal)',
          border: 'none', borderRadius: 8, cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'submitting' ? 'Sending…' : 'Send →'}
      </button>
      {status === 'error' && (
        <p style={{ fontSize: 14, color: '#c0392b', fontFamily: 'var(--pub-font-sans)' }}>
          Submission failed. Try again or email us directly.
        </p>
      )}
    </form>
  );
}
