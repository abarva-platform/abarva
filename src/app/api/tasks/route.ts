import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Priority 2 item 3 · task assignment + assigned-to-me queue.
//
// POST /api/tasks · assign a task to a user (by email)
//   body: { assigneeEmail, programCode?, deliverableCode?, title, note?, dueAt? }
//
// GET /api/tasks?me=1 · list open tasks assigned to the calling user
// GET /api/tasks?assigneeEmail=... · list tasks assigned to a specific email
// GET /api/tasks · admin-only full dump
//
// PATCH /api/tasks · update a task (mark done, reassign)
//   body: { id, done?: boolean, reassignTo?: string }

interface TaskEntry {
  id: string;
  programCode: string | null;
  deliverableCode: string | null;
  title: string;
  note: string | null;
  assigneeEmail: string;
  assigneeName: string | null;
  assignedById: string;
  assignedByEmail: string | null;
  assignedByName: string | null;
  assignedAt: string;
  dueAt: string | null;
  done: boolean;
  doneAt: string | null;
}

interface TaskLedger {
  schemaVersion: '1.0';
  entries: TaskEntry[];
}

const LEDGER_DIR = join(process.cwd(), '.approvals');
const LEDGER_PATH = join(LEDGER_DIR, 'tasks.json');

function readLedger(): TaskLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', entries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as TaskLedger;
  } catch {
    return { schemaVersion: '1.0', entries: [] };
  }
}

function writeLedger(ledger: TaskLedger): void {
  mkdirSync(LEDGER_DIR, { recursive: true });
  writeFileSync(LEDGER_PATH, `${JSON.stringify(ledger, null, 2)}\n`);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: Partial<TaskEntry>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const assigneeEmail = typeof body.assigneeEmail === 'string' ? body.assigneeEmail.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!assigneeEmail || !assigneeEmail.includes('@') || !title) {
    return NextResponse.json({ error: 'assigneeEmail + title required' }, { status: 400 });
  }

  const clerk = await clerkClient();
  const assigner = await clerk.users.getUser(session.userId);
  const assignerEmail = assigner.emailAddresses[0]?.emailAddress ?? null;
  const assignerName = [assigner.firstName, assigner.lastName].filter(Boolean).join(' ') || assignerEmail;

  // Resolve assignee name via Clerk lookup (best-effort).
  let assigneeName: string | null = null;
  try {
    const users = await clerk.users.getUserList({ emailAddress: [assigneeEmail], limit: 1 });
    const found = Array.isArray(users) ? users[0] : users.data[0];
    if (found) assigneeName = [found.firstName, found.lastName].filter(Boolean).join(' ') || found.emailAddresses[0]?.emailAddress || null;
  } catch {
    // fallthrough with null
  }

  const entry: TaskEntry = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    programCode: typeof body.programCode === 'string' ? body.programCode : null,
    deliverableCode: typeof body.deliverableCode === 'string' ? body.deliverableCode : null,
    title,
    note: typeof body.note === 'string' ? body.note : null,
    assigneeEmail,
    assigneeName,
    assignedById: session.userId,
    assignedByEmail: assignerEmail,
    assignedByName: assignerName,
    assignedAt: new Date().toISOString(),
    dueAt: typeof body.dueAt === 'string' ? body.dueAt : null,
    done: false,
    doneAt: null,
  };

  const ledger = readLedger();
  ledger.entries.push(entry);
  writeLedger(ledger);

  return NextResponse.json({ ok: true, entry });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const me = request.nextUrl.searchParams.get('me');
  const assigneeEmailParam = request.nextUrl.searchParams.get('assigneeEmail');

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(session.userId);
  const myEmail = user.emailAddresses[0]?.emailAddress;

  const ledger = readLedger();
  let filtered = ledger.entries;
  if (me === '1' && myEmail) {
    filtered = filtered.filter((e) => e.assigneeEmail.toLowerCase() === myEmail.toLowerCase());
  } else if (assigneeEmailParam) {
    filtered = filtered.filter((e) => e.assigneeEmail.toLowerCase() === assigneeEmailParam.toLowerCase());
  }
  const sorted = filtered.sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));
  return NextResponse.json({ ok: true, entries: sorted });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { id?: string; done?: boolean; reassignTo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const ledger = readLedger();
  const entry = ledger.entries.find((e) => e.id === body.id);
  if (!entry) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (typeof body.done === 'boolean') {
    entry.done = body.done;
    entry.doneAt = body.done ? new Date().toISOString() : null;
  }
  if (typeof body.reassignTo === 'string' && body.reassignTo.includes('@')) {
    entry.assigneeEmail = body.reassignTo.trim();
  }

  writeLedger(ledger);
  return NextResponse.json({ ok: true, entry });
}
