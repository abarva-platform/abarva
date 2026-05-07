import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSeedClient, loadSeedEnv, TENANTS, type TenantKey } from './seed-wave-lib';
import {
  COMPOSITE_EXECUTIVE_PROFILES,
  EXECUTIVE_PROFILE_ACCESS_SCOPES,
  REAL_WORLD_EXECUTIVE_PROFILES_PENDING_ETHICS,
  type AccessScopeSeedRow,
  type ExecutiveProfileSeed,
} from './executive-profiles-data';

interface ClientRow {
  id: string;
  name: string;
  legal_name: string | null;
}

interface PersonRow {
  id: string;
  name: string;
}

function wantsRealWorldProfiles(): boolean {
  return process.argv.includes('--include-real-world') || process.env.ALLOW_REAL_WORLD_EXEC_PROFILES === '1';
}

async function resolveClient(sb: SupabaseClient, tenantKey: TenantKey): Promise<ClientRow> {
  const tenant = TENANTS[tenantKey];
  for (const field of [
    { column: 'name', value: tenant.shortName },
    { column: 'name', value: tenant.canonicalName },
    { column: 'legal_name', value: tenant.legalName },
  ]) {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, legal_name')
      .eq(field.column, field.value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ClientRow;
  }
  throw new Error(`Client missing for ${tenant.canonicalName}. Seed the tenant base data first.`);
}

async function loadPeopleIndex(sb: SupabaseClient): Promise<Map<string, PersonRow>> {
  const { data, error } = await sb.from('persons').select('id, name');
  if (error) throw error;
  return new Map(((data ?? []) as PersonRow[]).map((row) => [row.name.toLowerCase(), row]));
}

async function upsertRows(sb: SupabaseClient, table: string, rows: Array<Record<string, unknown>>, onConflict = 'id'): Promise<void> {
  if (rows.length === 0) return;
  const batchSize = 50;
  for (let idx = 0; idx < rows.length; idx += batchSize) {
    const batch = rows.slice(idx, idx + batchSize);
    const { error } = await sb.from(table).upsert(batch, { onConflict });
    if (error) throw error;
  }
}

async function seedAccessScopes(sb: SupabaseClient, clientsByTenant: Map<TenantKey, ClientRow>): Promise<number> {
  const rows = EXECUTIVE_PROFILE_ACCESS_SCOPES.map((scope) => ({
    id: scope.id,
    client_id: scope.tenantKey ? clientsByTenant.get(scope.tenantKey)?.id ?? null : null,
    summary: scope.summary,
    scope_type: scope.scopeType,
    program_ids: scope.programIds,
    role_filter: scope.roleFilter,
    maestro_filter: scope.maestroFilter,
    output_mode_filter: scope.outputModeFilter,
    regulatory_constraints: scope.regulatoryConstraints,
    conditions: scope.conditions,
    audit_required: scope.auditRequired,
    scope_payload: scope.scopePayload,
  }));
  await upsertRows(sb, 'access_scopes', rows);
  return rows.length;
}

function buildProfileRow(
  profile: ExecutiveProfileSeed,
  clientsByTenant: Map<TenantKey, ClientRow>,
  peopleByName: Map<string, PersonRow>,
): Record<string, unknown> {
  const clientId = profile.tenantKey ? clientsByTenant.get(profile.tenantKey)?.id ?? null : null;
  const personId = profile.personName ? peopleByName.get(profile.personName.toLowerCase())?.id ?? null : null;

  return {
    id: profile.id,
    profile_type: profile.profileType,
    client_id: clientId,
    person_id: personId,
    full_name: profile.fullName,
    preferred_name: profile.preferredName,
    pronouns: profile.pronouns ?? null,
    current_role_title: profile.currentRole,
    current_company: profile.currentCompany,
    current_tenure_start: profile.currentTenureStart ?? null,
    current_remit: profile.currentRemit,
    reporting_structure: profile.reportingStructure,
    strategic_priorities_personally_owned: profile.strategicPrioritiesPersonallyOwned,
    initiatives_personally_sponsored: profile.initiativesPersonallySponsored,
    communication_style: profile.communicationStyle,
    decision_patterns: profile.decisionPatterns,
    known_priorities: profile.knownPriorities,
    known_constraints: profile.knownConstraints,
    influential_voices: profile.influentialVoices,
    abarva_relationship_history: profile.abarvaRelationshipHistory,
    source_material: profile.sourceMaterial,
    reasoning_scope_id: profile.reasoningScopeId,
    disclosure_scope_id: profile.disclosureScopeId,
    profile_use_statement: profile.profileUseStatement,
    profile_non_use_statement: profile.profileNonUseStatement,
    human_reviewed_by: profile.humanReviewedBy,
    human_reviewed_at: profile.humanReviewedAt,
    last_refreshed_at: profile.humanReviewedAt,
    confidence: profile.confidence,
    metadata: {
      ...profile.metadata,
      ethics_review_required: profile.profileType === 'real_world',
    },
  };
}

function buildCareerRows(profile: ExecutiveProfileSeed): Array<Record<string, unknown>> {
  return profile.careerHistory.map((entry) => ({
    id: entry.id,
    profile_id: profile.id,
    ordinal: entry.ordinal,
    role: entry.role,
    company: entry.company,
    tenure_start: entry.tenureStart ?? null,
    tenure_end: entry.tenureEnd ?? null,
    notable_accomplishments: entry.notableAccomplishments ?? [],
    exit_context: entry.exitContext ?? null,
  }));
}

function buildStatementRows(profile: ExecutiveProfileSeed): Array<Record<string, unknown>> {
  return profile.publicStatements.map((statement) => ({
    id: statement.id,
    profile_id: profile.id,
    ordinal: statement.ordinal,
    statement_summary: statement.statementSummary,
    source: statement.source,
    statement_date: statement.statementDate ?? null,
    topic_tags: statement.topicTags,
    commitment_quality: statement.commitmentQuality,
    evidence_id: null,
  }));
}

function buildPersonaRow(profile: ExecutiveProfileSeed): Record<string, unknown> | null {
  if (!profile.personaOverrides) return null;
  return {
    profile_id: profile.id,
    use_preferred_name_in_greetings: profile.personaOverrides.usePreferredNameInGreetings,
    specific_frames_to_open_with: profile.personaOverrides.specificFramesToOpenWith,
    topics_to_lead_with: profile.personaOverrides.topicsToLeadWith,
    sensitivities_to_acknowledge: profile.personaOverrides.sensitivitiesToAcknowledge,
    avoid_framings: profile.personaOverrides.avoidFramings,
  };
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();

  const clientsByTenant = new Map<TenantKey, ClientRow>();
  for (const tenantKey of ['apex', 'meridian', 'first_capital'] as const) {
    clientsByTenant.set(tenantKey, await resolveClient(sb, tenantKey));
  }

  const peopleByName = await loadPeopleIndex(sb);
  const includeRealWorld = wantsRealWorldProfiles();
  const profilesToSeed = COMPOSITE_EXECUTIVE_PROFILES;

  const scopeCount = await seedAccessScopes(sb, clientsByTenant);
  const profileRows = profilesToSeed.map((profile) => buildProfileRow(profile, clientsByTenant, peopleByName));
  const careerRows = profilesToSeed.flatMap((profile) => buildCareerRows(profile));
  const statementRows = profilesToSeed.flatMap((profile) => buildStatementRows(profile));
  const personaRows = profilesToSeed
    .map((profile) => buildPersonaRow(profile))
    .filter((row): row is Record<string, unknown> => Boolean(row));

  await upsertRows(sb, 'executive_profiles', profileRows);
  await upsertRows(sb, 'executive_career_history', careerRows);
  await upsertRows(sb, 'executive_public_statements', statementRows);
  await upsertRows(sb, 'executive_demo_persona_overrides', personaRows, 'profile_id');

  console.log('\nExecutive profiles seeded');
  console.log(`  access scopes      · ${scopeCount}`);
  console.log(`  composite profiles · ${profileRows.length}`);
  console.log(`  career rows        · ${careerRows.length}`);
  console.log(`  statement rows     · ${statementRows.length}`);
  console.log(`  persona overrides  · ${personaRows.length}`);

  if (!includeRealWorld) {
    console.log('  real-world profiles · SKIPPED (ethics review required)');
    console.log(
      `  pending ethics set  · ${REAL_WORLD_EXECUTIVE_PROFILES_PENDING_ETHICS.map((profile) => profile.fullName).join(' · ')}`,
    );
    return;
  }

  throw new Error('Real-world executive profile ingestion is intentionally blocked pending explicit ethics approval.');
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((err) => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}
