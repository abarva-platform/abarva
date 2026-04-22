import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env';

// Fixture helper for deliverables_v2 + deliverable_versions seeds.
// Skips the real AI generation path (slow + non-deterministic) and writes
// the persisted shape directly · mirrors what generateDeliverable() would
// produce on a happy path, so the rendered pages exercise real read code.

export interface DeliverableSeed {
  engagementId: string;
  deliverableTypeKey: string;
  title: string;
  status?: 'draft' | 'in_review' | 'signed_off' | 'superseded';
  version?: number;
  content: string;
  structuredData?: Record<string, unknown>;
  qualityTotalScore?: number;
  qualityCritical?: string[];
  qualityRemaining?: string[];
  qualityResolved?: string[];
}

export interface DeliverableFixtureState {
  deliverableId: string;
  version: number;
  versionId: string;
}

let sb: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env is required for deliverable fixtures');
  }
  if (!sb) {
    sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return sb;
}

async function clearExisting(engagementId: string, typeKey: string): Promise<void> {
  const client = getSupabase();
  const { data: rows } = await client
    .from('deliverables_v2')
    .select('id')
    .eq('engagement_id', engagementId)
    .eq('deliverable_type_key', typeKey);
  const ids = ((rows as Array<{ id: string }> | null) ?? []).map((r) => r.id);
  if (ids.length === 0) return;
  await client.from('deliverable_versions').delete().in('deliverable_id', ids);
  await client.from('deliverables_v2').delete().in('id', ids);
}

export async function ensureDeliverableFixture(seed: DeliverableSeed): Promise<DeliverableFixtureState> {
  const client = getSupabase();
  await clearExisting(seed.engagementId, seed.deliverableTypeKey);

  const version = seed.version ?? 1;
  const status = seed.status ?? 'draft';

  const { data: inserted, error: insertError } = await client
    .from('deliverables_v2')
    .insert({
      engagement_id: seed.engagementId,
      deliverable_type_key: seed.deliverableTypeKey,
      title: seed.title,
      status,
      current_version: version,
      created_by: 'e2e-fixture',
    })
    .select('id')
    .single();
  if (insertError || !inserted) throw insertError ?? new Error('deliverable insert returned no id');
  const deliverableId = (inserted as { id: string }).id;

  const qualityTotalScore = seed.qualityTotalScore ?? 82;
  const qualityCritical = seed.qualityCritical ?? [];
  const qualityRemaining = seed.qualityRemaining ?? [];
  const qualityResolved = seed.qualityResolved ?? [];

  const { data: versionRow, error: verError } = await client
    .from('deliverable_versions')
    .insert({
      deliverable_id: deliverableId,
      version,
      content: seed.content,
      structured_data: seed.structuredData ?? null,
      quality_score: [{ name: 'overall', score: qualityTotalScore }],
      quality_issues: {
        total_score: qualityTotalScore,
        critical: qualityCritical,
        remaining: qualityRemaining,
        resolved: qualityResolved,
      },
    })
    .select('id')
    .single();
  if (verError || !versionRow) throw verError ?? new Error('version insert returned no id');

  return {
    deliverableId,
    version,
    versionId: (versionRow as { id: string }).id,
  };
}

export async function cleanupDeliverableFixture(deliverableId: string): Promise<void> {
  const client = getSupabase();
  await client.from('deliverable_versions').delete().eq('deliverable_id', deliverableId);
  await client.from('deliverables_v2').delete().eq('id', deliverableId);
}
