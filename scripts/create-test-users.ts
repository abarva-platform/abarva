#!/usr/bin/env npx tsx

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import {
  TEST_USER_SPECS,
  type ProvisioningMembershipRole,
  type TestUserSpec,
} from '../src/testing/test-users/spec';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '../nexus/.env.local') });
loadEnv();

type JsonRecord = Record<string, unknown>;

interface ClientRow {
  id: string;
  name: string;
}

interface PersonRow {
  id: string;
  graph_node_id: string | null;
  name: string;
  email: string | null;
  role: string | null;
  organization: string | null;
  primary_role: ProvisioningMembershipRole | null;
}

interface ProvisionResult {
  key: string;
  email: string;
  role: string;
  clerkUserId: string;
  personId: string | null;
  visibleClientKeys: string[];
  passwordVerified: boolean;
  signInTokenVerified: boolean;
  membershipsVerified: boolean;
  sponsorGrantVerified: boolean;
  sourceGrantsVerified: boolean;
  publicOnlyVerified: boolean;
  investorAccessToken: string | null;
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

function localReportPath(): string {
  return path.resolve(process.cwd(), 'reports/test-users/latest.local.json');
}

function ensureReportDir(): void {
  fs.mkdirSync(path.dirname(localReportPath()), { recursive: true });
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    verify: !args.has('--no-verify'),
    json: args.has('--json'),
  };
}

async function loadClients(): Promise<Map<string, ClientRow>> {
  const sb = getSupabase();
  const { data, error } = await sb.from('clients').select('id, name');
  if (error) throw error;

  const byKey = new Map<string, ClientRow>();
  for (const row of (data as ClientRow[] | null) ?? []) {
    if (/Meridian/i.test(row.name)) byKey.set('meridian', row);
    if (/Arcturus|First Capital/i.test(row.name)) byKey.set('arcturus', row);
    if (/Apex Retail/i.test(row.name)) byKey.set('apexretail', row);
    if (/Keystone/i.test(row.name)) byKey.set('keystone', row);
  }
  return byKey;
}

async function findPersonByEmailOrGraph(email: string, graphNodeId: string): Promise<PersonRow | null> {
  const sb = getSupabase();
  const { data: byEmail, error: emailError } = await sb
    .from('persons')
    .select('id, graph_node_id, name, email, role, organization, primary_role')
    .eq('email', email)
    .maybeSingle();
  if (emailError) throw emailError;
  if (byEmail) return byEmail as PersonRow;

  const { data: byGraph, error: graphError } = await sb
    .from('persons')
    .select('id, graph_node_id, name, email, role, organization, primary_role')
    .eq('graph_node_id', graphNodeId)
    .maybeSingle();
  if (graphError) throw graphError;
  return (byGraph as PersonRow | null) ?? null;
}

async function upsertPerson(spec: TestUserSpec): Promise<string | null> {
  if (!spec.person) return null;

  const sb = getSupabase();
  const existing = await findPersonByEmailOrGraph(spec.email, spec.person.graphNodeId);
  const payload = {
    graph_node_id: spec.person.graphNodeId,
    name: spec.person.name,
    email: spec.email,
    role: spec.person.role,
    organization: spec.person.organization,
    primary_role: spec.person.primaryRole,
    familiarity: 'first_meeting',
    communication_style: {},
    working_rhythm: {},
    personal_threads: [],
  };

  if (existing) {
    const { error } = await sb.from('persons').update(payload).eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await sb.from('persons').insert(payload).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}

async function removePersonByEmail(email: string): Promise<void> {
  const sb = getSupabase();
  const { data, error } = await sb.from('persons').select('id').eq('email', email);
  if (error) throw error;
  const ids = ((data as Array<{ id: string }> | null) ?? []).map((row) => row.id);
  if (ids.length === 0) return;
  const { error: deleteError } = await sb.from('persons').delete().in('id', ids);
  if (deleteError) throw deleteError;
}

async function syncMemberships(personId: string, spec: TestUserSpec, clientRows: Map<string, ClientRow>): Promise<void> {
  const sb = getSupabase();
  const expected = new Map(
    (spec.memberships ?? []).map((membership) => {
      const client = clientRows.get(membership.clientKey);
      if (!client) throw new Error(`Unknown client key ${membership.clientKey}`);
      return [client.id, membership];
    }),
  );

  const { data: existingRows, error: existingError } = await sb
    .from('person_client_memberships')
    .select('id, client_id, role')
    .eq('person_id', personId);
  if (existingError) throw existingError;

  const existing = (existingRows as Array<{ id: string; client_id: string; role: ProvisioningMembershipRole }> | null) ?? [];
  const existingByClientId = new Map(existing.map((row) => [row.client_id, row]));

  for (const [clientId, membership] of expected) {
    const row = existingByClientId.get(clientId);
    const payload = {
      role: membership.role,
      access_level: membership.accessLevel ?? null,
      financial_visibility: membership.financialVisibility ?? false,
      can_admin_users: membership.canAdminUsers ?? false,
      can_create_programs: membership.canCreatePrograms ?? false,
      can_approve_gates: membership.canApproveGates ?? false,
      can_create_source_events: membership.canCreateSourceEvents ?? false,
      can_approve_source_stages: membership.canApproveSourceStages ?? false,
      can_approve_award: membership.canApproveAward ?? false,
      can_upload_source_artifacts: membership.canUploadSourceArtifacts ?? true,
      can_generate_sourcing_artifacts: membership.canGenerateSourcingArtifacts ?? true,
      can_publish_sourcing_artifacts: membership.canPublishSourcingArtifacts ?? false,
    };
    if (!row) {
      const { error } = await sb.from('person_client_memberships').insert({
        person_id: personId,
        client_id: clientId,
        ...payload,
      });
      if (error) throw error;
      continue;
    }
    const { error } = await sb.from('person_client_memberships').update(payload).eq('id', row.id);
    if (error) throw error;
  }

  const staleIds = existing.filter((row) => !expected.has(row.client_id)).map((row) => row.id);
  if (staleIds.length > 0) {
    const { error } = await sb.from('person_client_memberships').delete().in('id', staleIds);
    if (error) throw error;
  }
}

async function ensureSponsorGrant(personId: string, personName: string, spec: TestUserSpec, clientRows: Map<string, ClientRow>): Promise<void> {
  if (!spec.sponsorGrant) return;

  const sb = getSupabase();
  const client = clientRows.get(spec.sponsorGrant.clientKey);
  if (!client) throw new Error(`Missing client ${spec.sponsorGrant.clientKey} for sponsor grant`);

  const { data: program, error: programError } = await sb
    .from('engagements')
    .select('id')
    .eq('client_id', client.id)
    .eq('name', spec.sponsorGrant.programName)
    .maybeSingle();
  if (programError) throw programError;
  if (!program) {
    throw new Error(`Program "${spec.sponsorGrant.programName}" not found for ${client.name}`);
  }

  const engagementId = (program as { id: string }).id;
  const { data: participants, error: participantError } = await sb
    .from('engagement_participants')
    .select('id, user_id, approval_authority, role')
    .eq('engagement_id', engagementId)
    .eq('user_id', personId);
  if (participantError) throw participantError;

  const existing = (participants as Array<{ id: string; approval_authority: string | null; role: string | null }> | null) ?? [];
  const sponsorRow = existing.find((row) => row.approval_authority === 'sponsor');
  if (sponsorRow) {
    if (sponsorRow.role !== 'sponsor') {
      const { error } = await sb.from('engagement_participants').update({ role: 'sponsor' }).eq('id', sponsorRow.id);
      if (error) throw error;
    }
    return;
  }

  if (existing[0]) {
    const { error } = await sb
      .from('engagement_participants')
      .update({ role: 'sponsor', approval_authority: 'sponsor', user_name: personName })
      .eq('id', existing[0].id);
    if (error) throw error;
    return;
  }

  const { error } = await sb.from('engagement_participants').insert({
    engagement_id: engagementId,
    user_id: personId,
    user_name: personName,
    role: 'sponsor',
    approval_authority: 'sponsor',
    notify_on: ['approval_needed', 'phase_gate'],
  });
  if (error) throw error;
}

async function syncSourceAssignments(personId: string, personName: string, spec: TestUserSpec, clientRows: Map<string, ClientRow>): Promise<void> {
  const assignments = spec.sourceAssignments ?? [];
  if (assignments.length === 0) return;

  const sb = getSupabase();
  for (const assignment of assignments) {
    const client = clientRows.get(assignment.clientKey);
    if (!client) throw new Error(`Missing client ${assignment.clientKey} for source grant`);

    const { data: existingRows, error: existingError } = await sb
      .from('source_event_participants')
      .select('id')
      .eq('client_key', assignment.clientKey)
      .eq('source_event_id', assignment.sourceEventId)
      .eq('user_id', personId);
    if (existingError) throw existingError;

    const payload = {
      client_key: assignment.clientKey,
      source_event_id: assignment.sourceEventId,
      user_id: personId,
      user_name: personName,
      role: assignment.sourceAccessLevel === 'source_member' ? 'source contributor' : 'source viewer',
      approval_authority: assignment.approvalAuthority ?? null,
      source_access_level: assignment.sourceAccessLevel,
      can_view_financial: assignment.canViewFinancial ?? false,
      can_upload_source_artifacts: assignment.canUploadSourceArtifacts ?? true,
      can_generate_sourcing_artifacts: assignment.canGenerateSourcingArtifacts ?? true,
      can_publish_sourcing_artifacts: assignment.canPublishSourcingArtifacts ?? false,
      can_approve_source_stages: assignment.canApproveSourceStages ?? false,
      can_approve_award: assignment.canApproveAward ?? false,
      notify_on: ['source_event_update', 'approval_needed'],
    };

    const existingId = ((existingRows as Array<{ id: string }> | null) ?? [])[0]?.id;
    if (existingId) {
      const { error } = await sb.from('source_event_participants').update(payload).eq('id', existingId);
      if (error) throw error;
      continue;
    }
    const { error } = await sb.from('source_event_participants').insert(payload);
    if (error) throw error;
  }
}

function mergeMetadata(existing: JsonRecord | null | undefined, next: JsonRecord): JsonRecord {
  return { ...(existing ?? {}), ...next };
}

async function upsertClerkUser(spec: TestUserSpec, personId: string | null, investorAccessToken: string | null) {
  const clerk = getClerk();
  const [existingByEmail, existingByExternalId] = await Promise.all([
    clerk.users.getUserList({ emailAddress: [spec.email], limit: 1 }),
    clerk.users.getUserList({ externalId: [spec.key], limit: 1 }),
  ]);
  const existing = existingByEmail.data[0] ?? existingByExternalId.data[0];

  const publicMetadata = mergeMetadata(existing?.publicMetadata as JsonRecord | undefined, {
    ...spec.publicMetadata,
    ...(personId ? { person_id: personId } : {}),
  });
  const privateMetadata = mergeMetadata(existing?.privateMetadata as JsonRecord | undefined, {
    ...(spec.privateMetadata ?? {}),
    ...(investorAccessToken ? { investorAccessToken } : {}),
  });

  if (existing) {
    await clerk.users.updateUser(existing.id, {
      firstName: spec.firstName,
      lastName: spec.lastName,
      password: spec.password,
      skipPasswordChecks: true,
      signOutOfOtherSessions: true,
      externalId: spec.key,
    });

    const matchingEmail = existing.emailAddresses.find((email) => email.emailAddress === spec.email);
    if (matchingEmail) {
      const isVerified = matchingEmail.verification?.status === 'verified';
      const isPrimary = existing.primaryEmailAddressId === matchingEmail.id;
      if (!isVerified || !isPrimary) {
        await clerk.emailAddresses.updateEmailAddress(matchingEmail.id, {
          verified: true,
          primary: true,
        });
      }
    } else {
      await clerk.emailAddresses.createEmailAddress({
        userId: existing.id,
        emailAddress: spec.email,
        verified: true,
        primary: true,
      });
    }

    await clerk.users.updateUserMetadata(existing.id, { publicMetadata, privateMetadata });
    return existing.id;
  }

  const created = await clerk.users.createUser({
    emailAddress: [spec.email],
    password: spec.password,
    skipPasswordChecks: true,
    firstName: spec.firstName,
    lastName: spec.lastName,
    externalId: spec.key,
    publicMetadata,
    privateMetadata,
  });
  return created.id;
}

async function verifyProvisioning(
  spec: TestUserSpec,
  clerkUserId: string,
  personId: string | null,
  investorAccessToken: string | null,
  clientRows: Map<string, ClientRow>,
): Promise<ProvisionResult> {
  const clerk = getClerk();
  const sb = getSupabase();

  await clerk.users.verifyPassword({ userId: clerkUserId, password: spec.password });
  await clerk.signInTokens.createSignInToken({ userId: clerkUserId, expiresInSeconds: 300 });

  let visibleClientKeys: string[] = [];
  let membershipsVerified = true;
  let sponsorGrantVerified = !spec.sponsorGrant;
  let sourceGrantsVerified = (spec.sourceAssignments ?? []).length === 0;
  let publicOnlyVerified = spec.expectations.publicOnly;

  if (personId) {
    const { data: memberships, error } = await sb
      .from('person_client_memberships')
      .select('client_id')
      .eq('person_id', personId);
    if (error) throw error;

    const clientIdToKey = new Map(Array.from(clientRows.entries()).map(([key, row]) => [row.id, key]));
    visibleClientKeys = ((memberships as Array<{ client_id: string }> | null) ?? [])
      .map((row) => clientIdToKey.get(row.client_id))
      .filter((value): value is string => Boolean(value))
      .sort();
    membershipsVerified = JSON.stringify(visibleClientKeys) === JSON.stringify([...spec.expectations.visibleClientKeys].sort());

    if (spec.sponsorGrant) {
      const client = clientRows.get(spec.sponsorGrant.clientKey)!;
      const { data: program } = await sb
        .from('engagements')
        .select('id')
        .eq('client_id', client.id)
        .eq('name', spec.sponsorGrant.programName)
        .maybeSingle();
      if (!program) throw new Error(`Unable to re-load sponsor program ${spec.sponsorGrant.programName}`);
      const { data: participant, error: participantError } = await sb
        .from('engagement_participants')
        .select('id')
        .eq('engagement_id', (program as { id: string }).id)
        .eq('user_id', personId)
        .eq('approval_authority', 'sponsor')
        .maybeSingle();
      if (participantError) throw participantError;
      sponsorGrantVerified = Boolean(participant);
    }

    if ((spec.sourceAssignments ?? []).length > 0) {
      const { data: sourceRows, error: sourceRowsError } = await sb
        .from('source_event_participants')
        .select('client_key, source_event_id')
        .eq('user_id', personId);
      if (sourceRowsError) throw sourceRowsError;
      const actual = new Set(((sourceRows as Array<{ client_key: string; source_event_id: string }> | null) ?? [])
        .map((row) => `${row.client_key}:${row.source_event_id}`));
      sourceGrantsVerified = (spec.sourceAssignments ?? []).every((assignment) =>
        actual.has(`${assignment.clientKey}:${assignment.sourceEventId}`),
      );
    }
  } else {
    const { data: personRows, error } = await sb.from('persons').select('id').eq('email', spec.email);
    if (error) throw error;
    publicOnlyVerified = spec.expectations.publicOnly
      ? ((personRows as Array<{ id: string }> | null) ?? []).length === 0
      : publicOnlyVerified;
    membershipsVerified = ((personRows as Array<{ id: string }> | null) ?? []).length === 0;
    visibleClientKeys = [...spec.expectations.visibleClientKeys];
    sourceGrantsVerified = (spec.sourceAssignments ?? []).length === 0;
  }

  return {
    key: spec.key,
    email: spec.email,
    role: spec.appRole,
    clerkUserId,
    personId,
    visibleClientKeys,
    passwordVerified: true,
    signInTokenVerified: true,
    membershipsVerified,
    sponsorGrantVerified,
    sourceGrantsVerified,
    publicOnlyVerified,
    investorAccessToken,
  };
}

async function provisionOne(
  spec: TestUserSpec,
  clientRows: Map<string, ClientRow>,
  verify: boolean,
): Promise<ProvisionResult> {
  if (!spec.person) {
    await removePersonByEmail(spec.email);
  }

  const personId = await upsertPerson(spec);
  if (personId) {
    await syncMemberships(personId, spec, clientRows);
  }

  const clerk = getClerk();
  const existingUsers = await clerk.users.getUserList({ emailAddress: [spec.email], limit: 1 });
  const existingUser = existingUsers.data[0];
  const existingInvestorToken = (existingUser?.privateMetadata as JsonRecord | undefined)?.investorAccessToken;
  const investorAccessToken = spec.appRole === 'investor'
    ? (typeof existingInvestorToken === 'string' && existingInvestorToken.length > 0
      ? existingInvestorToken
      : `investor_${crypto.randomUUID()}`)
    : null;

  const clerkUserId = await upsertClerkUser(spec, personId, investorAccessToken);

  if (personId && spec.sponsorGrant && spec.person) {
    await ensureSponsorGrant(personId, spec.person.name, spec, clientRows);
  }
  if (personId && spec.sourceAssignments && spec.person) {
    await syncSourceAssignments(personId, spec.person.name, spec, clientRows);
  }

  if (!verify) {
    return {
      key: spec.key,
      email: spec.email,
      role: spec.appRole,
      clerkUserId,
      personId,
      visibleClientKeys: [...spec.expectations.visibleClientKeys],
      passwordVerified: false,
      signInTokenVerified: false,
      membershipsVerified: false,
      sponsorGrantVerified: !spec.sponsorGrant,
      sourceGrantsVerified: (spec.sourceAssignments ?? []).length === 0,
      publicOnlyVerified: spec.expectations.publicOnly,
      investorAccessToken,
    };
  }

  return verifyProvisioning(spec, clerkUserId, personId, investorAccessToken, clientRows);
}

async function main() {
  const args = parseArgs();
  const clientRows = await loadClients();
  ensureReportDir();

  const results: ProvisionResult[] = [];
  for (const spec of TEST_USER_SPECS) {
    const result = await provisionOne(spec, clientRows, args.verify);
    results.push(result);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: process.env.BASE_URL ?? null,
    notes: [
      'Jake uses the current single-token investor model. The token is stored in Clerk private metadata for the user.',
      'Dara is intentionally provisioned without a persons row so she stays on public-only surfaces.',
      'Mike is mapped to Meridian because no Fortune-40 composite tenant exists in the live client table.',
    ],
    results,
  };

  fs.writeFileSync(localReportPath(), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  if (args.json) {
    process.stdout.write(`${JSON.stringify({
      generatedAt: report.generatedAt,
      reportPath: localReportPath(),
      results: report.results.map((result) => ({
        ...result,
        investorAccessToken: result.investorAccessToken ? '[recorded in local report]' : null,
      })),
    }, null, 2)}\n`);
    return;
  }

  console.log(`\nTest user provisioning complete · report saved to ${localReportPath()}\n`);
  for (const result of results) {
    console.log(
      `• ${result.key} · ${result.email} · role=${result.role} · clients=${result.visibleClientKeys.join(',') || 'public-only'}`
        + ` · password=${result.passwordVerified ? 'ok' : 'skipped'}`
        + ` · token=${result.signInTokenVerified ? 'ok' : 'skipped'}`
        + ` · source=${result.sourceGrantsVerified ? 'ok' : 'missing'}`,
    );
  }
}

main().catch((error) => {
  console.error('FAILED:', error);
  process.exit(1);
});
