#!/usr/bin/env npx tsx

import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import { CANONICAL_AUTH_EMAILS } from '../src/lib/auth/canonical-auth-roster';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '../nexus/.env.local') });
loadEnv();

type JsonRecord = Record<string, unknown>;

interface ClerkUserSummary {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  reason: string;
}

interface DbPersonSummary {
  id: string;
  email: string | null;
  graph_node_id: string | null;
  name: string | null;
  reason: string;
}

interface PersonRow {
  id: string;
  email: string | null;
  graph_node_id: string | null;
  name: string | null;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getSupabase() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  );
}

function getClerk() {
  return createClerkClient({ secretKey: requireEnv('CLERK_SECRET_KEY') });
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

const CANONICAL_EMAIL_SET = new Set<string>(CANONICAL_AUTH_EMAILS);

const LEGACY_EMAIL_RULES: Array<{ label: string; test: (email: string) => boolean }> = [
  { label: 'old clerk_test identity', test: (email) => email.endsWith('+clerk_test@abarva.com') || email.includes('+clerk_test@') },
  { label: 'old demo identity', test: (email) => email.startsWith('demo-') || email.startsWith('demo_') },
  { label: 'old generated abarva-test identity', test: (email) => email.endsWith('@abarva-test.example.com') },
  { label: 'old shorthand test identity', test: (email) => ['mh@abarva.com', 'mh+clerk_test@abarva.com', 'af+clerk_test@abarva.com', 'investor+clerk_test@abarva.com'].includes(email) },
];

const LEGACY_GRAPH_RULES: Array<{ label: string; test: (graphNodeId: string) => boolean }> = [
  { label: 'old program demo graph node', test: (id) => id.startsWith('person_demo_') },
  { label: 'old source demo graph node', test: (id) => id.startsWith('source_operator_') },
  { label: 'old generated test graph node', test: (id) => id.startsWith('test_person_') },
];

function legacyEmailReason(email: string | null | undefined): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized || CANONICAL_EMAIL_SET.has(normalized)) return null;
  return LEGACY_EMAIL_RULES.find((rule) => rule.test(normalized))?.label ?? null;
}

function legacyGraphReason(graphNodeId: string | null | undefined): string | null {
  const normalized = (graphNodeId ?? '').trim();
  if (!normalized) return null;
  return LEGACY_GRAPH_RULES.find((rule) => rule.test(normalized))?.label ?? null;
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    apply: args.has('--apply'),
    confirm: args.has('--confirm-delete-non-roster-users'),
    json: args.has('--json'),
  };
}

function reportPath(): string {
  return path.resolve(process.cwd(), 'reports/auth-cleanup/latest.local.json');
}

async function listAllClerkUsers(): Promise<ClerkUserSummary[]> {
  const clerk = getClerk();
  const users: ClerkUserSummary[] = [];
  let offset = 0;
  const limit = 100;

  for (;;) {
    const page = await clerk.users.getUserList({ limit, offset });
    for (const user of page.data) {
      const email = normalizeEmail(user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress
        ?? user.emailAddresses[0]?.emailAddress
        ?? null);
      const reason = legacyEmailReason(email);
      if (!reason) continue;
      users.push({
        id: user.id,
        email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        reason,
      });
    }
    if (page.data.length < limit) break;
    offset += limit;
  }

  return users.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));
}

async function listLegacyDbPersons(): Promise<DbPersonSummary[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('persons')
    .select('id, email, graph_node_id, name')
    .order('email', { ascending: true, nullsFirst: false });
  if (error) throw error;

  return ((data as PersonRow[] | null) ?? [])
    .map((person): DbPersonSummary | null => {
      const reason = legacyEmailReason(person.email) ?? legacyGraphReason(person.graph_node_id);
      if (!reason) return null;
      return { ...person, reason };
    })
    .filter((person): person is DbPersonSummary => Boolean(person));
}

async function applyDbCleanup(personIds: string[]): Promise<JsonRecord> {
  if (personIds.length === 0) {
    return { source_event_participants: 0, engagement_participants: 0, memberships: 0, persons: 0 };
  }

  const sb = getSupabase();
  const counts: JsonRecord = {};

  const deleteByUserId = async (table: string, column: string) => {
    const { count, error } = await sb
      .from(table)
      .delete({ count: 'exact' })
      .in(column, personIds);
    if (error) throw error;
    counts[table] = count ?? 0;
  };

  await deleteByUserId('source_event_participants', 'user_id');
  await deleteByUserId('engagement_participants', 'user_id');
  await deleteByUserId('person_client_memberships', 'person_id');

  const { count, error } = await sb
    .from('persons')
    .delete({ count: 'exact' })
    .in('id', personIds);
  if (error) throw error;
  counts.persons = count ?? 0;

  return counts;
}

async function applyClerkCleanup(users: ClerkUserSummary[]): Promise<number> {
  const clerk = getClerk();
  let deleted = 0;
  for (const user of users) {
    await clerk.users.deleteUser(user.id);
    deleted += 1;
  }
  return deleted;
}

async function main() {
  const args = parseArgs();
  if (args.apply && !args.confirm) {
    throw new Error('Refusing to delete without --confirm-delete-non-roster-users');
  }

  const [clerkDeletes, dbPersonDeletes] = await Promise.all([
    listAllClerkUsers(),
    listLegacyDbPersons(),
  ]);

  const report: JsonRecord = {
    generatedAt: new Date().toISOString(),
    mode: args.apply ? 'apply' : 'dry-run',
    canonicalEmails: CANONICAL_AUTH_EMAILS,
    deleteCriteria: {
      clerk: 'Only non-canonical accounts matching old demo, clerk_test, shorthand, or @abarva-test.example.com patterns.',
      db: 'Only persons matching old demo/source/test graph ids or legacy test-email patterns. Org-chart persons without auth-test markers are not deleted.',
    },
    clerkDeletes,
    dbPersonDeletes,
    applied: null,
  };

  if (args.apply) {
    const dbCounts = await applyDbCleanup(dbPersonDeletes.map((person) => person.id));
    const clerkCount = await applyClerkCleanup(clerkDeletes);
    report.applied = { clerkUsersDeleted: clerkCount, dbCounts };
  }

  fs.mkdirSync(path.dirname(reportPath()), { recursive: true });
  fs.writeFileSync(reportPath(), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  console.log(`Auth cleanup ${args.apply ? 'applied' : 'dry-run'} · report saved to ${reportPath()}`);
  console.log(`Canonical users kept: ${CANONICAL_AUTH_EMAILS.length}`);
  console.log(`Clerk users selected for deletion: ${clerkDeletes.length}`);
  for (const user of clerkDeletes) {
    console.log(`- Clerk delete: ${user.email ?? user.id} · ${user.reason}`);
  }
  console.log(`DB persons selected for deletion: ${dbPersonDeletes.length}`);
  for (const person of dbPersonDeletes) {
    console.log(`- DB delete: ${person.email ?? person.graph_node_id ?? person.id} · ${person.reason}`);
  }
  if (!args.apply) {
    console.log('No records were deleted. Re-run with --apply --confirm-delete-non-roster-users after reviewing the report.');
  }
}

main().catch((error) => {
  console.error('FAILED:', error);
  process.exit(1);
});
