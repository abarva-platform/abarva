import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Priority 2 item 4 · notifications feed.
//
// GET /api/notifications?since=ISO · returns events relevant to the
// calling user, unified across the 3 ledgers. Each notification carries
// kind + actor + subject + timestamp + href so the UI can render a badge
// + feed + deep-link.
//
// Relevance rules:
//   - TASKS assigned to me (regardless of done state)
//   - APPROVALS I recorded OR on deliverables where I'm the assignee
//   - PHASE-GATES I advanced (for audit feed; not as "new" alerts)
//
// No stored read-state yet; client passes `since` to fetch fresh-only.

interface Notification {
  id: string;
  kind: 'task-assigned' | 'task-done' | 'approval' | 'phase-gate';
  actorName: string | null;
  actorEmail: string | null;
  subject: string;
  programCode: string | null;
  deliverableCode: string | null;
  timestamp: string;
  href: string;
  // "unread relative to the caller" · false for events authored by caller
  forCaller: boolean;
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
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const myEmail = (user.emailAddresses[0]?.emailAddress ?? '').toLowerCase();

  const sinceRaw = request.nextUrl.searchParams.get('since');
  const sinceMs = sinceRaw ? Date.parse(sinceRaw) : 0;

  const tasks = readJson<{ entries: TaskEntry[] }>(join(process.cwd(), '.approvals/tasks.json'))?.entries ?? [];
  const approvals = readJson<{ entries: ApprovalEntry[] }>(join(process.cwd(), '.approvals/ledger.json'))?.entries ?? [];
  const gates = readJson<{ entries: PhaseGateEntry[] }>(join(process.cwd(), '.approvals/phase-gates.json'))?.entries ?? [];

  const out: Notification[] = [];

  for (const t of tasks) {
    const assignedToMe = t.assigneeEmail.toLowerCase() === myEmail;
    if (!assignedToMe) continue;
    const assignedT = Date.parse(t.assignedAt);
    if (!Number.isNaN(assignedT) && assignedT > sinceMs) {
      out.push({
        id: `${t.id}:assigned`,
        kind: 'task-assigned',
        actorName: t.assignedByName,
        actorEmail: t.assignedByEmail,
        subject: t.title,
        programCode: t.programCode,
        deliverableCode: t.deliverableCode,
        timestamp: t.assignedAt,
        href: '/home/queue',
        forCaller: true,
      });
    }
    if (t.done && t.doneAt) {
      const doneT = Date.parse(t.doneAt);
      if (!Number.isNaN(doneT) && doneT > sinceMs) {
        out.push({
          id: `${t.id}:done`,
          kind: 'task-done',
          actorName: null,
          actorEmail: null,
          subject: `${t.title} · marked done`,
          programCode: t.programCode,
          deliverableCode: t.deliverableCode,
          timestamp: t.doneAt,
          href: '/home/queue',
          forCaller: true,
        });
      }
    }
  }

  for (const a of approvals) {
    const approvedT = Date.parse(a.timestamp);
    if (Number.isNaN(approvedT) || approvedT <= sinceMs) continue;
    const fromMe = (a.approverEmail ?? '').toLowerCase() === myEmail;
    out.push({
      id: a.id,
      kind: 'approval',
      actorName: a.approverName,
      actorEmail: a.approverEmail,
      subject: `${a.decision} approved`,
      programCode: a.programCode,
      deliverableCode: a.deliverableCode,
      timestamp: a.timestamp,
      href: '/home/queue',
      forCaller: fromMe,
    });
  }

  for (const g of gates) {
    const tMs = Date.parse(g.timestamp);
    if (Number.isNaN(tMs) || tMs <= sinceMs) continue;
    const fromMe = (g.advancedByEmail ?? '').toLowerCase() === myEmail;
    out.push({
      id: g.id,
      kind: 'phase-gate',
      actorName: g.advancedByName,
      actorEmail: g.advancedByEmail,
      subject: `${g.programCode} · Phase ${g.fromPhase} → Phase ${g.toPhase}`,
      programCode: g.programCode,
      deliverableCode: null,
      timestamp: g.timestamp,
      href: '/home/queue',
      forCaller: fromMe,
    });
  }

  out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return NextResponse.json({ ok: true, notifications: out.slice(0, 50) });
}
