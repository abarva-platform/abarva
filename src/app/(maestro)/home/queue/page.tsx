import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { QueueActions } from './QueueActions';

export const dynamic = 'force-dynamic';

// Priority 2 item 3 · Assigned-to-me queue.
// Shows the calling user's open tasks + recent approvals they participated
// in + phase gates they triggered. Reads the three ledgers (tasks,
// approvals, phase-gates) directly from .approvals/*.json.

interface TaskEntry {
  id: string;
  programCode: string | null;
  deliverableCode: string | null;
  title: string;
  note: string | null;
  assigneeEmail: string;
  assigneeName: string | null;
  assignedByName: string | null;
  assignedAt: string;
  dueAt: string | null;
  done: boolean;
  doneAt: string | null;
}

interface ApprovalEntry {
  id: string;
  programCode: string;
  deliverableCode: string;
  decision: string;
  approverEmail: string | null;
  approverName: string | null;
  timestamp: string;
}

interface PhaseGateEntry {
  id: string;
  programCode: string;
  fromPhase: number;
  toPhase: number;
  advancedByEmail: string | null;
  advancedByName: string | null;
  timestamp: string;
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')) as T; } catch { return null; }
}

export default async function QueuePage() {
  const session = await auth();
  if (!session.userId) redirect('/sign-in');

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const myEmail = user.emailAddresses[0]?.emailAddress ?? '';
  const myName = [user.firstName, user.lastName].filter(Boolean).join(' ') || myEmail;

  const tasksLedger = readJson<{ entries: TaskEntry[] }>(join(process.cwd(), '.approvals/tasks.json'));
  const approvalsLedger = readJson<{ entries: ApprovalEntry[] }>(join(process.cwd(), '.approvals/ledger.json'));
  const gatesLedger = readJson<{ entries: PhaseGateEntry[] }>(join(process.cwd(), '.approvals/phase-gates.json'));

  const myOpen = (tasksLedger?.entries ?? [])
    .filter((t) => t.assigneeEmail.toLowerCase() === myEmail.toLowerCase() && !t.done)
    .sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));

  const myDone = (tasksLedger?.entries ?? [])
    .filter((t) => t.assigneeEmail.toLowerCase() === myEmail.toLowerCase() && t.done)
    .sort((a, b) => ((a.doneAt ?? a.assignedAt) < (b.doneAt ?? b.assignedAt) ? 1 : -1))
    .slice(0, 10);

  const myApprovals = (approvalsLedger?.entries ?? [])
    .filter((e) => (e.approverEmail ?? '').toLowerCase() === myEmail.toLowerCase())
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 5);

  const myGates = (gatesLedger?.entries ?? [])
    .filter((e) => (e.advancedByEmail ?? '').toLowerCase() === myEmail.toLowerCase())
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 5);

  return (
    <main style={{ minHeight: '100vh', background: '#F5F1EB', color: '#1a1612', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{pageCss}</style>
      <div className="q-shell">
        <header className="q-header">
          <div className="q-eyebrow">Home · Queue</div>
          <h1 className="q-title">{myName}, what needs you</h1>
          <p className="q-lede">
            Tasks assigned to you, decisions you&rsquo;ve approved, and phase gates you&rsquo;ve advanced.
            Tasks persist across sessions.
          </p>
        </header>

        <section className="q-panel">
          <div className="q-section-head">
            <div className="q-eyebrow">Open tasks</div>
            <span className="q-count">{myOpen.length}</span>
          </div>
          {myOpen.length === 0 ? (
            <p className="q-empty">Nothing assigned. Ask a teammate to assign you a task — or use the approval buttons on deliverables to move work forward.</p>
          ) : (
            <ul className="q-list">
              {myOpen.map((t) => (
                <li key={t.id}>
                  <div className="q-item-main">
                    <strong>{t.title}</strong>
                    {t.note ? <span className="q-note">{t.note}</span> : null}
                    <span className="q-meta">
                      {t.programCode ? <span className="q-chip">{t.programCode}</span> : null}
                      {t.deliverableCode ? <span className="q-chip">{t.deliverableCode}</span> : null}
                      <span className="q-age">assigned by {t.assignedByName ?? '—'} · {timeAgo(t.assignedAt)}</span>
                    </span>
                  </div>
                  <QueueActions taskId={t.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="q-panel">
          <div className="q-section-head">
            <div className="q-eyebrow">Recent approvals · you</div>
            <span className="q-count">{myApprovals.length}</span>
          </div>
          {myApprovals.length === 0 ? (
            <p className="q-empty">No approvals yet. Open a Rich deliverable and click Approve decision to record one.</p>
          ) : (
            <ul className="q-list">
              {myApprovals.map((a) => (
                <li key={a.id}>
                  <div className="q-item-main">
                    <strong>{a.decision}</strong>
                    <span className="q-meta">
                      <span className="q-chip">{a.programCode}</span>
                      <span className="q-chip">{a.deliverableCode}</span>
                      <span className="q-age">{timeAgo(a.timestamp)}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="q-panel">
          <div className="q-section-head">
            <div className="q-eyebrow">Phase gates · you advanced</div>
            <span className="q-count">{myGates.length}</span>
          </div>
          {myGates.length === 0 ? (
            <p className="q-empty">No phase gates advanced yet. Close a phase gate from the Programs surface when your program is ready.</p>
          ) : (
            <ul className="q-list">
              {myGates.map((g) => (
                <li key={g.id}>
                  <div className="q-item-main">
                    <strong>{g.programCode} · Phase {g.fromPhase} → Phase {g.toPhase}</strong>
                    <span className="q-meta">
                      <span className="q-age">{timeAgo(g.timestamp)}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {myDone.length > 0 ? (
          <section className="q-panel done">
            <div className="q-section-head">
              <div className="q-eyebrow">Recently completed · you</div>
              <span className="q-count">{myDone.length}</span>
            </div>
            <ul className="q-list">
              {myDone.map((t) => (
                <li key={t.id} className="q-done">
                  <div className="q-item-main">
                    <strong>{t.title}</strong>
                    <span className="q-meta">
                      {t.programCode ? <span className="q-chip">{t.programCode}</span> : null}
                      <span className="q-age">completed {timeAgo(t.doneAt ?? t.assignedAt)}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="q-footer">
          <p>Composite organization built from real-world data.</p>
          <p>Queue reads the shared approval + phase-gate + task ledgers. Production persistence swaps to Supabase.</p>
        </footer>
      </div>
    </main>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const pageCss = `
.q-shell { max-width: 1100px; margin: 0 auto; padding: 40px 32px 80px; }
.q-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(26,22,18,0.10); }
.q-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #0e9f8c; font-weight: 700;
  margin-bottom: 8px;
}
.q-title { font-family: Georgia, serif; font-size: 40px; letter-spacing: -0.025em; margin: 0 0 12px; font-weight: 700; line-height: 1.1; }
.q-lede { font-size: 15px; line-height: 1.65; color: #3d342d; margin: 0; max-width: 680px; }
.q-panel {
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.10);
  border-radius: 16px; padding: 22px; margin-bottom: 18px;
  box-shadow: 0 1px 2px rgba(26,22,18,0.04);
}
.q-panel.done { background: rgba(26,22,18,0.02); }
.q-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.q-count { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #6d625a; font-weight: 700; }
.q-empty { margin: 0; color: #6d625a; font-size: 13.5px; font-style: italic; }
.q-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.q-list li { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1px solid rgba(26,22,18,0.08); border-radius: 10px; }
.q-list li.q-done { opacity: 0.7; }
.q-item-main { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.q-item-main strong { font-size: 14px; color: #1a1612; }
.q-note { font-size: 12.5px; color: #6d625a; font-style: italic; }
.q-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
.q-chip {
  display: inline-block; padding: 2px 7px; border-radius: 999px;
  background: rgba(14,159,140,0.1); color: #0e9f8c;
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
}
.q-age { font-size: 11px; color: #8a7e72; }
.q-footer { margin-top: 32px; padding-top: 18px; border-top: 1px solid rgba(26,22,18,0.10); font-size: 12px; color: #8a7e72; line-height: 1.7; }
.q-footer p { margin: 0 0 3px; }
`;
