'use client';

// Source Stage-Gate panel — the Maestro/Admin approve-with-gaps surface. Shows the full
// recommended standard (met / unmet), the minimum-viable gate, the gaps with risk +
// downstream impact, the honest gate status, Nexus guidance, and a Maestro decision form.
// Lets Maestro proceed with gaps (rationale required) without faking completeness.

import { useCallback, useEffect, useMemo, useState } from 'react';

const NAVY = '#0C1A3A';
const TEAL = '#2DD4C8';

interface Requirement { key: string; label: string; tier: 'recommended' | 'minimum_viable'; kind: string; riskIfMissing: string; downstreamImpact?: string[] }
interface Gap { key: string; label: string; riskIfMissing: string; downstreamImpact: string[]; tier: string }
interface Assessment {
  stageName: string; recommendedStandard: Requirement[]; minimumViableGate: Requirement[];
  gaps: Gap[]; currentCompletion: number; minimumViableMet: boolean; gateStatus: string;
  downstreamImpacts: string[]; recommendedDecision: string; maestroOverrideAllowed: boolean;
}
interface Guidance { verdict: string; detail: string }
interface StageItem { stageKey: string; stageNumber: number; stageName: string }

const ACTIONS = [
  { v: 'approve', l: 'Approve' },
  { v: 'approve_with_gaps', l: 'Approve with gaps' },
  { v: 'mark_preliminary', l: 'Mark preliminary' },
  { v: 'mark_client_to_complete', l: 'Mark client-to-complete' },
  { v: 'force_advance', l: 'Force advance' },
  { v: 'reject', l: 'Reject / request more evidence' },
];

const STATUS_COLOR: Record<string, string> = {
  ready: '#1f7a3d', ready_with_gaps: '#8a6d1a', preliminary_only: '#8a6d1a',
  needs_review: '#8a6d1a', client_to_complete: '#1d5e87', blocked: '#b3261e', maestro_override_approved: '#1d5e87',
};

export function GateDecisionPanel({ eventId }: { eventId: string }) {
  const [stages, setStages] = useState<StageItem[]>([]);
  const [stageKey, setStageKey] = useState<string>('');
  const [satisfied, setSatisfied] = useState<Set<string>>(new Set());
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [action, setAction] = useState('approve_with_gaps');
  const [rationale, setRationale] = useState('');
  const [result, setResult] = useState<{ gateStatus: string; allowIssueReady: boolean; approvalArtifactId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notify, setNotify] = useState<{ channel: string; to: string } | null>(null);

  useEffect(() => {
    void fetch(`/api/v1/source/events/${eventId}/gate`).then((r) => r.json()).then((d: { stages?: StageItem[] }) => {
      setStages(d.stages ?? []);
      if (d.stages?.length) setStageKey(d.stages[0].stageKey);
    }).catch(() => setError('failed to load stages'));
  }, [eventId]);

  const assess = useCallback(async (sk: string, sat: Set<string>) => {
    if (!sk) return;
    const q = `stageKey=${encodeURIComponent(sk)}&satisfied=${encodeURIComponent([...sat].join(','))}`;
    const r = await fetch(`/api/v1/source/events/${eventId}/gate?${q}`);
    const d = (await r.json()) as { assessment?: Assessment; guidance?: Guidance };
    setAssessment(d.assessment ?? null);
    setGuidance(d.guidance ?? null);
  }, [eventId]);

  // when the stage changes, reset satisfied + re-assess
  useEffect(() => { setSatisfied(new Set()); setResult(null); if (stageKey) void assess(stageKey, new Set()); }, [stageKey, assess]);

  const toggle = (key: string) => {
    const next = new Set(satisfied);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSatisfied(next);
    void assess(stageKey, next);
  };

  const submit = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await fetch(`/api/v1/source/events/${eventId}/gate-decision`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stageKey, satisfiedRequirementKeys: [...satisfied], action, rationale: rationale || undefined }),
      });
      const d = (await r.json()) as { detail?: string; resolved?: { gateStatus: string; allowIssueReady: boolean }; approvalArtifactId?: string };
      if (r.status === 422) { setError(d.detail ?? 'decision rejected'); return; }
      if (!r.ok) throw new Error(d.detail ?? `HTTP ${r.status}`);
      setResult({ gateStatus: d.resolved!.gateStatus, allowIssueReady: d.resolved!.allowIssueReady, approvalArtifactId: d.approvalArtifactId });
    } catch (e) { setError(e instanceof Error ? e.message : 'failed'); } finally { setBusy(false); }
  };

  const requestApproval = async () => {
    setNotifyBusy(true); setError(null); setNotify(null);
    try {
      const stage = stages.find((s) => s.stageKey === stageKey);
      const r = await fetch(`/api/v1/source/events/${eventId}/request-approval`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          stageKey,
          stageLabel: stage ? `${stage.stageNumber}. ${stage.stageName}` : (assessment?.stageName ?? undefined),
        }),
      });
      const d = (await r.json()) as { channel?: string; to?: string; error?: string };
      if (!r.ok) { setError(d.error ?? `request-approval HTTP ${r.status}`); return; }
      setNotify({ channel: d.channel ?? 'unknown', to: d.to ?? '' });
    } catch (e) { setError(e instanceof Error ? e.message : 'failed to notify approver'); } finally { setNotifyBusy(false); }
  };

  const statusColor = useMemo(() => (assessment ? STATUS_COLOR[assessment.gateStatus] ?? '#6b6b6b' : '#6b6b6b'), [assessment]);

  return (
    <div style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 24, color: NAVY, margin: 0 }}>Stage Gate</h1>
        <p style={{ color: '#706D66', fontSize: 13, marginTop: 4 }}>The full standard, what you have, what&apos;s missing, and the risk of proceeding. Maestro can approve with gaps — gaps are carried forward and affected deliverables stay preliminary.</p>
      </header>

      <label style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>Stage&nbsp;
        <select value={stageKey} onChange={(e) => setStageKey(e.target.value)} style={{ fontSize: 13, padding: '4px 8px' }}>
          {stages.map((s) => <option key={s.stageKey} value={s.stageKey}>{s.stageNumber}. {s.stageName}</option>)}
        </select>
      </label>

      {error && <div style={{ padding: '10px 12px', background: 'rgba(179,38,30,0.06)', border: '1px solid rgba(179,38,30,0.3)', borderRadius: 6, color: '#B3261E', fontSize: 13 }}>{error}</div>}

      {assessment && (
        <>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${statusColor}1a`, color: statusColor }}>{assessment.gateStatus.replace(/_/g, ' ')}</span>
            <span style={{ fontSize: 13, color: '#706D66' }}>{Math.round(assessment.currentCompletion * 100)}% of standard · minimum-viable {assessment.minimumViableMet ? 'met' : 'NOT met'}</span>
          </div>

          {guidance && <div style={{ background: '#fff', border: `1px solid ${TEAL}55`, borderLeft: `3px solid ${TEAL}`, borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>{guidance.verdict}</div>
            <div style={{ color: '#444' }}>{guidance.detail}</div>
          </div>}

          <section style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: '#f1efe9', fontWeight: 600, fontSize: 13, color: NAVY }}>Recommended standard — check what is satisfied</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><tbody>
              {assessment.recommendedStandard.map((r) => (
                <tr key={r.key} style={{ borderTop: '1px solid #efece5' }}>
                  <td style={{ padding: '8px 14px', width: 28 }}><input type="checkbox" checked={satisfied.has(r.key)} onChange={() => toggle(r.key)} /></td>
                  <td style={{ padding: '8px 8px' }}>
                    <div style={{ fontWeight: 600 }}>{r.label} {r.tier === 'minimum_viable' && <span style={{ fontSize: 10, color: '#b3261e', fontWeight: 700 }}>· MIN-VIABLE</span>}</div>
                    {!satisfied.has(r.key) && <div style={{ color: '#8a6d1a', fontSize: 11 }}>Risk if missing: {r.riskIfMissing}</div>}
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: satisfied.has(r.key) ? '#1f7a3d' : '#b3261e', fontSize: 12, fontWeight: 700 }}>{satisfied.has(r.key) ? 'met' : 'gap'}</td>
                </tr>
              ))}
            </tbody></table>
          </section>

          {assessment.downstreamImpacts.length > 0 && (
            <div style={{ fontSize: 12, color: '#8a6d1a' }}>If you proceed, these stay preliminary: <b>{assessment.downstreamImpacts.join(', ')}</b>.</div>
          )}

          <section style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>Maestro decision</div>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={{ fontSize: 13, padding: '5px 8px', alignSelf: 'flex-start' }}>
              {ACTIONS.map((a) => <option key={a.v} value={a.v}>{a.l}</option>)}
            </select>
            <textarea value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Rationale (required to approve past gaps): why proceed, what risk is accepted, follow-ups…" rows={3} style={{ fontSize: 13, padding: 8, border: '1px solid #e4e1da', borderRadius: 6, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={submit} disabled={busy} style={{ padding: '8px 16px', background: NAVY, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Recording…' : 'Record decision'}
              </button>
              <button type="button" onClick={requestApproval} disabled={notifyBusy || !stageKey} style={{ padding: '8px 16px', background: '#fff', color: NAVY, border: `1px solid ${NAVY}`, borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: notifyBusy || !stageKey ? 'not-allowed' : 'pointer', opacity: notifyBusy || !stageKey ? 0.6 : 1 }}>
                {notifyBusy ? 'Emailing…' : 'Email approver'}
              </button>
              {notify && (
                <span style={{ fontSize: 12, color: notify.channel === 'email_sent' ? '#1f7a3d' : '#1d5e87' }}>
                  {notify.channel === 'email_sent' ? 'Sent' : notify.channel === 'logged_fallback' ? 'Logged (no mail key)' : notify.channel} → {notify.to}
                </span>
              )}
            </div>
          </section>

          {result && (
            <div style={{ background: 'rgba(45,212,200,0.06)', border: `1px solid ${TEAL}55`, borderRadius: 8, padding: 14, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: NAVY }}>Decision recorded → {result.gateStatus.replace(/_/g, ' ')}</div>
              <div style={{ color: '#706D66', marginTop: 4 }}>Issue-ready allowed: {result.allowIssueReady ? 'yes' : 'no — deliverables remain preliminary'}.</div>
              {result.approvalArtifactId && <a href={`/api/v1/source/artifacts/${result.approvalArtifactId}/download`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, color: '#fff', background: NAVY, padding: '5px 12px', borderRadius: 5, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Download approval record</a>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
