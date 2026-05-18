import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getActiveClientKey } from '@/lib/active-client';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { loadSourceDecisionQueue } from '@/lib/source/decision-queue/load';
import {
  buildSourceDecisionQueueNotifications,
  parseNotificationEventsPayload,
  selectNotificationStoreAdapter,
  toBellItem,
  type NotificationBellItem,
} from '@/lib/notifications';

// Priority 2 item 4 · notifications feed.
//
// GET /api/notifications?since=ISO · returns events relevant to the
// calling user, unified across the legacy ledgers plus platform signals.
// Each notification carries
// kind + actor + subject + timestamp + href so the UI can render a badge
// + feed + deep-link.
//
// Relevance rules:
//   - TASKS assigned to me (regardless of done state)
//   - APPROVALS I recorded OR on deliverables where I'm the assignee
//   - PHASE-GATES I advanced (for audit feed; not as "new" alerts)
//
// No stored read-state yet; client passes `since` to fetch fresh-only.

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

function stableNotificationClock(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

  const out: NotificationBellItem[] = [];

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

  try {
    const clientKey = await getActiveClientKey();
    const persisted = await selectNotificationStoreAdapter().listEvents({
      tenantKey: clientKey,
      sinceMs,
      limit: 50,
    });
    if (persisted.ok && persisted.data) {
      for (const event of persisted.data) {
        out.push(toBellItem(event, myEmail));
      }
    }

    const queue = await loadSourceDecisionQueue(clientKey, stableNotificationClock());
    const sourceEvents = buildSourceDecisionQueueNotifications(queue.bundles);
    for (const event of sourceEvents) {
      const producedAt = Date.parse(event.producedAt);
      if (!Number.isNaN(producedAt) && producedAt <= sinceMs) continue;
      out.push(toBellItem(event, myEmail));
    }
  } catch {
    // Notification feed stays fail-soft. Source surfaces still render even if
    // the data plane or active-client lookup is unavailable.
  }

  out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  return NextResponse.json({ ok: true, notifications: out.slice(0, 50) });
}

export async function POST(request: NextRequest) {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = parseNotificationEventsPayload(body);
  if (!parsed.ok || !parsed.data) {
    return NextResponse.json({ error: parsed.error ?? 'invalid_payload' }, { status: 400 });
  }

  const adapter = selectNotificationStoreAdapter();
  const persisted = await adapter.persistEvents({
    tenantKey: ctx.clientKey ?? ctx.clientId,
    events: parsed.data,
  });

  if (!persisted.ok) {
    const status = persisted.error?.includes('tenant mismatch') ? 403 : 500;
    return NextResponse.json({ error: persisted.error ?? 'notification_persist_failed' }, { status });
  }

  return NextResponse.json({
    ok: true,
    plane: adapter.name,
    persisted: persisted.data?.length ?? 0,
    notifications: (persisted.data ?? []).map((event) => toBellItem(event, ctx.email)),
  });
}
