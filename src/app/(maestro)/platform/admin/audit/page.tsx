// LEGACY · being migrated to /admin/audit in a follow-up wave (post-wave-admin-completion).
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// Audit log panel · Steward surface. Reads the three JSON ledgers written
// by /api/tasks, /api/programs/approve, and /api/programs/phase-gate,
// merges them, sorts newest first, and shows the last 50 events with
// actor + timestamp + kind. Admin-only via Clerk publicMetadata.role.
//
// These ledgers are the demo-grade persistence layer; production swaps
// them for Supabase. The schema is intentionally small so the UI stays
// honest about what it can show.

type EventKind = 'approval' | 'phase-gate' | 'task';

interface AuditEvent {
  id: string;
  kind: EventKind;
  timestamp: string;            // ISO
  actor: string;                // email or name
  subject: string;              // human-readable subject line
  detail: string | null;
}

interface ApprovalEntry {
  id: string;
  programCode: string;
  deliverableCode: string;
  phase: number;
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
  gateCriterion: string;
  advancedByEmail: string | null;
  advancedByName: string | null;
  timestamp: string;
}

interface TaskEntry {
  id: string;
  programCode: string | null;
  deliverableCode: string | null;
  title: string;
  assigneeEmail: string;
  assignedByEmail: string | null;
  assignedByName: string | null;
  assignedAt: string;
  done: boolean;
  doneAt: string | null;
}

interface Ledger<T> {
  schemaVersion?: string;
  entries?: T[];
}

const LEDGER_DIR = join(process.cwd(), '.approvals');

function readLedger<T>(file: string): T[] {
  const full = join(LEDGER_DIR, file);
  if (!existsSync(full)) return [];
  try {
    const parsed = JSON.parse(readFileSync(full, 'utf8')) as Ledger<T>;
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function loadEvents(): AuditEvent[] {
  const approvals = readLedger<ApprovalEntry>('ledger.json').map<AuditEvent>((e) => ({
    id: `approval:${e.id}`,
    kind: 'approval',
    timestamp: e.timestamp,
    actor: e.approverName || e.approverEmail || 'unknown',
    subject: `${e.programCode} · ${e.deliverableCode} · phase ${e.phase}`,
    detail: e.decision,
  }));
  const gates = readLedger<PhaseGateEntry>('phase-gates.json').map<AuditEvent>((e) => ({
    id: `gate:${e.id}`,
    kind: 'phase-gate',
    timestamp: e.timestamp,
    actor: e.advancedByName || e.advancedByEmail || 'unknown',
    subject: `${e.programCode} · phase ${e.fromPhase} → ${e.toPhase}`,
    detail: e.gateCriterion,
  }));
  const tasks = readLedger<TaskEntry>('tasks.json').map<AuditEvent>((e) => ({
    id: `task:${e.id}`,
    kind: 'task',
    timestamp: e.assignedAt,
    actor: e.assignedByName || e.assignedByEmail || 'unknown',
    subject: `${e.title}${e.programCode ? ` · ${e.programCode}` : ''}`,
    detail: `Assigned to ${e.assigneeEmail}${e.done ? ' · done' : ''}`,
  }));
  return [...approvals, ...gates, ...tasks]
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 50);
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function kindLabel(k: EventKind): string {
  switch (k) {
    case 'approval':   return 'Approval';
    case 'phase-gate': return 'Phase gate';
    case 'task':       return 'Task';
  }
}

export default async function AdminAuditPage() {
  const session = await auth();
  if (!session.userId) redirect('/sign-in');

  const clerk = await clerkClient();
  const callingUser = await clerk.users.getUser(session.userId);
  const callingRole = (callingUser.publicMetadata?.role as string | undefined) ?? '';
  if (callingRole !== 'admin') {
    return (
      <main style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
        <h1 style={{ fontFamily: 'Georgia, serif' }}>Admin access only</h1>
        <p>The audit log is restricted to admin-role users.</p>
      </main>
    );
  }

  const events = loadEvents();
  const counts = {
    total: events.length,
    approval: events.filter((e) => e.kind === 'approval').length,
    phaseGate: events.filter((e) => e.kind === 'phase-gate').length,
    task: events.filter((e) => e.kind === 'task').length,
  };

  return (
    <main style={{ minHeight: '100vh', background: '#F5F1EB', color: '#1a1612', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{pageCss}</style>
      <div className="au-shell">
        <header className="au-header">
          <div className="au-eyebrow">Admin · audit</div>
          <h1 className="au-title">Audit log</h1>
          <p className="au-lede">
            Cross-ledger view of the last 50 events from approvals, phase gates, and task
            assignments. Each row shows actor, kind, subject, and timestamp.
          </p>
        </header>

        <section className="au-panel">
          <div className="au-section-head">
            <div className="au-eyebrow">Roll-up</div>
            <span className="au-count">{counts.total} events</span>
          </div>
          <div className="au-rollup">
            <div className="au-rollup-cell">
              <div className="au-rollup-value">{counts.approval}</div>
              <div className="au-rollup-label">Approvals</div>
            </div>
            <div className="au-rollup-cell">
              <div className="au-rollup-value">{counts.phaseGate}</div>
              <div className="au-rollup-label">Phase gates</div>
            </div>
            <div className="au-rollup-cell">
              <div className="au-rollup-value">{counts.task}</div>
              <div className="au-rollup-label">Tasks</div>
            </div>
          </div>
        </section>

        <section className="au-panel">
          <div className="au-section-head">
            <div className="au-eyebrow">Events</div>
            <span className="au-count">newest first · max 50</span>
          </div>
          {events.length === 0 ? (
            <p className="au-empty">No ledger entries yet. Approvals, phase gates, and task assignments appear here as they are written.</p>
          ) : (
            <table className="au-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Kind</th>
                  <th>Actor</th>
                  <th>Subject</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="au-td-when">{formatTimestamp(e.timestamp)}</td>
                    <td>
                      <span className={`au-pill ${e.kind}`}>{kindLabel(e.kind)}</span>
                    </td>
                    <td>{e.actor}</td>
                    <td>{e.subject}</td>
                    <td className="au-td-detail">{e.detail ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="au-footer">
          <p>Composite organization built from real-world data.</p>
          <p>Audit rows are sourced from .approvals/*.json ledgers · demo-grade persistence pending Supabase migration.</p>
        </footer>
      </div>
    </main>
  );
}

const pageCss = `
.au-shell { max-width: 1100px; margin: 0 auto; padding: 40px 32px 80px; }
.au-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(26,22,18,0.10); }
.au-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #3B82F6; font-weight: 700;
  margin-bottom: 8px;
}
.au-title { font-family: Georgia, serif; font-size: 40px; letter-spacing: -0.025em; margin: 0 0 12px; font-weight: 700; line-height: 1.1; }
.au-lede { font-size: 15px; line-height: 1.65; color: #3d342d; margin: 0; max-width: 680px; }
.au-panel {
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.10);
  border-radius: 16px; padding: 24px; margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(26,22,18,0.04);
}
.au-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
.au-count {
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: #6d625a; font-weight: 700;
}
.au-empty { margin: 0; color: #6d625a; font-size: 14px; font-style: italic; }
.au-rollup { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.au-rollup-cell {
  border: 1px solid rgba(26,22,18,0.10); border-radius: 12px; padding: 16px 18px;
  background: #FAF7F1;
}
.au-rollup-value {
  font-family: Georgia, serif; font-size: 32px; font-weight: 700; color: #1a1612;
  line-height: 1; margin-bottom: 6px;
}
.au-rollup-label {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase; color: #6d625a; font-weight: 700;
}
.au-table { width: 100%; border-collapse: collapse; }
.au-table th {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #8a7e72; font-weight: 700;
  text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(26,22,18,0.1);
}
.au-table td {
  padding: 12px; border-bottom: 1px solid rgba(26,22,18,0.06);
  font-size: 13.5px; color: #1a1612; vertical-align: top;
}
.au-td-when { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #3d342d; white-space: nowrap; }
.au-td-detail { color: #6d625a; font-size: 12.5px; }
.au-pill {
  display: inline-block; padding: 3px 9px; border-radius: 999px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
}
.au-pill.approval   { background: rgba(22,101,52,0.12); color: #166534; }
.au-pill.phase-gate { background: rgba(59,130,246,0.12); color: #3B82F6; }
.au-pill.task       { background: rgba(139,92,246,0.12); color: #7C3AED; }
.au-footer {
  margin-top: 40px; padding-top: 18px; border-top: 1px solid rgba(26,22,18,0.10);
  font-size: 12px; color: #8a7e72; line-height: 1.7;
}
.au-footer p { margin: 0 0 3px; }
`;
