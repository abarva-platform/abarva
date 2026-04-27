/**
 * ADMIN-DATA2 — Admin datasets adapter.
 * DATA11 — Live path wired to Supabase.
 */

import type {
  AdminDatasetApprovalRow,
  AdminDatasetApprovalState,
  AdminDatasetApprovalStatus,
  AdminDatasetDetail,
  AdminDatasetQuality,
  AdminDatasetRow,
  AdminDatasetRung,
  AdminLoadedFileRow,
} from './admin-datasets-adapter-types';
import {
  isFixtureMode,
} from './admin-data-mode';
import {
  adminDatasetApprovalsFixture,
  adminDatasetDetailFixture,
  adminDatasetQualityFixture,
  adminDatasetQualityScoresFixture,
  adminDatasetsByRungFixture,
  adminDatasetsFixture,
  adminLoadedFilesFixture,
} from './fixtures/admin-datasets-fixture';
import { getServerSupabase } from '@/lib/supabase-server';
import { mapDbRung, requireClientId } from './admin-db-helpers';

export async function getAdminDatasets(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminDatasetRow>> {
  if (isFixtureMode()) return adminDatasetsFixture(tenantSlug);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_datasets')
    .select('id, slug, label, domain, rung, row_count, owner_person_id, updated_at')
    .eq('client_id', clientId)
    .order('label');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.label,
    domain: row.domain,
    rung: mapDbRung(row.rung),
    rowCount: row.row_count ?? null,
    ownerPersonId: row.owner_person_id ?? null,
    segment: row.domain,
    evidenceUsable: ['blessed', 'ground_truth', 'audit_trail'].includes(row.rung),
    approvalState: 'unapproved' as AdminDatasetApprovalState,
    lastUpdatedAt: row.updated_at,
  }));
}

export async function getAdminDatasetsByRung(
  tenantSlug: string,
): Promise<Readonly<Record<AdminDatasetRung, ReadonlyArray<AdminDatasetRow>>>> {
  if (isFixtureMode()) return adminDatasetsByRungFixture(tenantSlug);

  const all = await getAdminDatasets(tenantSlug);
  const groups: Record<AdminDatasetRung, AdminDatasetRow[]> = {
    loaded: [],
    available: [],
    usable: [],
    agent_usable: [],
    decision_grade: [],
  };
  for (const row of all) {
    groups[row.rung].push(row);
  }
  return groups;
}

export async function getAdminDatasetById(
  tenantSlug: string,
  datasetId: string,
): Promise<AdminDatasetRow | null> {
  const all = await getAdminDatasets(tenantSlug);
  return all.find((d) => d.id === datasetId) ?? null;
}

export async function getAdminDatasetDetail(
  tenantSlug: string,
  datasetId: string,
): Promise<AdminDatasetDetail | null> {
  if (isFixtureMode()) return adminDatasetDetailFixture(tenantSlug, datasetId);

  // No extended detail table in DATA10 schema — fall back to base row + empty extended fields.
  const row = await getAdminDatasetById(tenantSlug, datasetId);
  if (!row) return null;
  return {
    ...row,
    lineageSources: [],
    schemaSummary: [],
    provenance: [],
    approvalOwner: '',
    notes: '',
  };
}

export async function getAdminDatasetApprovals(
  tenantSlug: string,
  status?: AdminDatasetApprovalRow['status'],
): Promise<ReadonlyArray<AdminDatasetApprovalRow>> {
  if (isFixtureMode()) return adminDatasetApprovalsFixture(tenantSlug, status);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  let query = supabase
    .from('admin_dataset_approvals')
    .select('id, dataset_id, from_rung, to_rung, status, requested_by, requested_at, decided_by, decided_at, reason')
    .eq('client_id', clientId)
    .order('requested_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    datasetId: row.dataset_id,
    fromRung: mapDbRung(row.from_rung),
    toRung: mapDbRung(row.to_rung),
    status: row.status as AdminDatasetApprovalStatus,
    requestedBy: row.requested_by ?? 'Unknown',
    requestedAt: row.requested_at,
    decidedBy: row.decided_by ?? null,
    decidedAt: row.decided_at ?? null,
    reason: row.reason ?? null,
  }));
}

export async function getAdminDatasetQuality(
  tenantSlug: string,
  datasetId: string,
): Promise<AdminDatasetQuality | null> {
  if (isFixtureMode()) return adminDatasetQualityFixture(tenantSlug, datasetId);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_dataset_quality')
    .select('dataset_id, completeness, freshness, schema_conformance, lineage, sample_agreement, overall, measured_at')
    .eq('client_id', clientId)
    .eq('dataset_id', datasetId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    datasetId: data.dataset_id,
    completeness: Number(data.completeness),
    freshness: Number(data.freshness),
    schemaConformance: Number(data.schema_conformance),
    lineage: Number(data.lineage),
    sampleAgreement: Number(data.sample_agreement),
    overall: Number(data.overall),
    measuredAt: data.measured_at,
  };
}

export async function getAdminDatasetQualityScores(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminDatasetQuality>> {
  if (isFixtureMode()) return adminDatasetQualityScoresFixture(tenantSlug);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_dataset_quality')
    .select('dataset_id, completeness, freshness, schema_conformance, lineage, sample_agreement, overall, measured_at')
    .eq('client_id', clientId)
    .order('measured_at', { ascending: false });
  if (error) throw error;
  // Deduplicate: keep latest per dataset_id
  const seen = new Set<string>();
  return (data ?? [])
    .filter((row) => {
      if (seen.has(row.dataset_id)) return false;
      seen.add(row.dataset_id);
      return true;
    })
    .map((row) => ({
      datasetId: row.dataset_id,
      completeness: Number(row.completeness),
      freshness: Number(row.freshness),
      schemaConformance: Number(row.schema_conformance),
      lineage: Number(row.lineage),
      sampleAgreement: Number(row.sample_agreement),
      overall: Number(row.overall),
      measuredAt: row.measured_at,
    }));
}

export async function getAdminLoadedFiles(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminLoadedFileRow>> {
  // No data_uploads table in DATA10 migrations — graceful fallback to fixture.
  if (isFixtureMode()) return adminLoadedFilesFixture(tenantSlug);
  // In live mode, also fall back to fixture (no table available yet).
  return adminLoadedFilesFixture(tenantSlug);
}

export function getAdminDatasetsFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminDatasetRow> {
  return adminDatasetsFixture(tenantSlug);
}
