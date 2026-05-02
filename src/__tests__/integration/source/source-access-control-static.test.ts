import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Source access-control wiring', () => {
  it('routes Source chat through the Source access policy and tool permissions', () => {
    const route = read('src/app/api/chat/agent/route.ts');

    expect(route).toContain('loadUserSourceAccessPolicy');
    expect(route).toContain('formatUserSourceAccessPolicyForPrompt');
    expect(route).toContain('canCreateSourceEvents');
    expect(route).toContain('canApproveSourceStages');
    expect(route).toContain('canApproveAward');
  });

  it('protects Source approvals with client-scoped policy instead of legacy admin role checks', () => {
    const route = read('src/app/api/v1/source/events/[eventId]/approve/route.ts');

    expect(route).toContain('loadUserSourceAccessPolicy');
    expect(route).toContain('canApproveSourceStages');
    expect(route).toContain(".eq('client_key', activeClient.key)");
    expect(route).not.toContain('getCurrentPerson');
    expect(route).not.toContain("person.role !== 'admin'");
  });

  it('exposes Source event creation as a JSON API route guarded by Source create rights', () => {
    const route = read('src/app/api/v1/source/events/route.ts');

    expect(route).toContain('export async function POST');
    expect(route).toContain('loadUserSourceAccessPolicy');
    expect(route).toContain('canCreateSourceEvents');
    expect(route).toContain('createSourcingEvent');
    expect(route).toContain('source_event_participants');
    expect(route).toContain('Response.json');
    expect(route).not.toContain('redirect(');
    expect(route).not.toContain('NextResponse.redirect');
  });

  it('advances persisted Source events through the DB with client-scoped approval rights', () => {
    const route = read('src/app/api/v1/source/[eventId]/stage/route.ts');

    expect(route).toContain('loadUserSourceAccessPolicy');
    expect(route).toContain('canApproveSourceStages');
    expect(route).toContain('CANONICAL_CLIENT_ADMIN_EMAILS');
    expect(route).toContain('inferClientKeyFromEmail');
    expect(route).toContain('canonicalAdminFallbackAllowed');
    expect(route).toContain(".from('source_events')");
    expect(route).toContain(".update({");
    expect(route).toContain('current_stage_key: stageKey');
    expect(route).toContain("persisted: true");
    expect(route).toContain('getSourceEventSeed');
    expect(route).toContain('setStageOverride');
  });

  it('keeps Source stage advancement server-authorized instead of client-blocking admin self-approval', () => {
    const button = read('src/components/source/StageAdvanceButton.tsx');

    expect(button).toContain('gateWarningCount: blockingGateCount');
    expect(button).toContain('Admin advance carries');
    expect(button).not.toContain('Cannot advance — ${blockingGateCount}');
    expect(button).not.toContain('return;\\n    }\\n    setLoading(true)');
  });

  it('persists generated Source packets through the protected artifact registry path', () => {
    const route = read('src/app/api/v1/source/[eventId]/artifacts/generate/route.ts');
    const drawer = read('src/components/shell/AtlasDrawer.tsx');

    expect(route).toContain('loadUserSourceAccessPolicy');
    expect(route).toContain('canGenerateSourcingArtifacts');
    expect(route).toContain('registerSourceArtifactUpload');
    expect(route).toContain("sourceOrigin: 'generated'");
    expect(route).toContain("sourceFormat: 'markdown'");
    expect(route).toContain("mimeType: GENERATED_MIME");
    expect(route).toContain('source-artifacts');

    expect(drawer).toContain('Save generated artifact');
    expect(drawer).toContain('/artifacts/generate');
    expect(drawer).toContain('source-generated-artifact');
  });

  it('lets persisted Source event detail fall back to canonical admin client identity when client rows are absent', () => {
    const queries = read('src/lib/source/queries.ts');

    expect(queries).toContain('getCanonicalAdminClientFallback');
    expect(queries).toContain('CANONICAL_CLIENT_ADMIN_EMAILS');
    expect(queries).toContain('inferClientKeyFromEmail');
    expect(queries).toContain('getPersistedSourceEventRow(eventId, fallbackClient.key)');
    expect(queries).toContain('sourceEventRowToDetail(persistedEvent, fallbackClient.name)');
  });

  it('ships the Source participant schema needed for record-scoped users', () => {
    const migration = read('supabase/migrations/20260501170000_source_access_control.sql');

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS source_event_participants');
    expect(migration).toContain('source_access_level');
    expect(migration).toContain('can_create_source_events');
    expect(migration).toContain('can_approve_source_stages');
    expect(migration).not.toContain("'abarva_super_admin',");
  });

  it('seeds Source-only demo operators with Clerk metadata and no approval rights', () => {
    const seedRoute = read('src/app/api/admin/seed-clerk-metadata/route.ts');
    const migration = read('supabase/migrations/20260501171000_source_demo_users.sql');

    expect(seedRoute).toContain('demo-apexretail-source+clerk_test@abarva.com');
    expect(seedRoute).toContain('demo-meridian-source+clerk_test@abarva.com');
    expect(seedRoute).toContain('demo-firstcapital-source+clerk_test@abarva.com');
    expect(seedRoute).toContain("moduleAccess: ['source']");
    expect(seedRoute).toContain("sourceScope: 'assigned_source_events_only'");
    expect(seedRoute).toContain('canCreateSourceEvents: true');

    expect(migration).toContain("'source_member'");
    expect(migration).toContain('can_create_source_events');
    expect(migration).toContain('can_approve_source_stages = false');
    expect(migration).toContain('can_view_financial');
    expect(migration).toContain('false');
  });
});
