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

  it('ships the Source participant schema needed for record-scoped users', () => {
    const migration = read('supabase/migrations/053_source_access_control.sql');

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS source_event_participants');
    expect(migration).toContain('source_access_level');
    expect(migration).toContain('can_create_source_events');
    expect(migration).toContain('can_approve_source_stages');
    expect(migration).not.toContain("'abarva_super_admin',");
  });

  it('seeds Source-only demo operators with Clerk metadata and no approval rights', () => {
    const seedRoute = read('src/app/api/admin/seed-clerk-metadata/route.ts');
    const migration = read('supabase/migrations/055_source_demo_users.sql');

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
