/**
 * ADMIN-DATA2 — Admin datasets adapter.
 */

import type {
  AdminDatasetApprovalRow,
  AdminDatasetDetail,
  AdminDatasetQuality,
  AdminDatasetRow,
  AdminDatasetRung,
  AdminLoadedFileRow,
} from './admin-datasets-adapter-types';
import {
  AdminDataMigrationPendingError,
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

export async function getAdminDatasets(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminDatasetRow>> {
  if (isFixtureMode()) return adminDatasetsFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_datasets');
}

export async function getAdminDatasetsByRung(
  tenantSlug: string,
): Promise<Readonly<Record<AdminDatasetRung, ReadonlyArray<AdminDatasetRow>>>> {
  if (isFixtureMode()) return adminDatasetsByRungFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_datasets');
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
  throw new AdminDataMigrationPendingError('admin_datasets');
}

export async function getAdminDatasetApprovals(
  tenantSlug: string,
  status?: AdminDatasetApprovalRow['status'],
): Promise<ReadonlyArray<AdminDatasetApprovalRow>> {
  if (isFixtureMode()) return adminDatasetApprovalsFixture(tenantSlug, status);
  throw new AdminDataMigrationPendingError('admin_dataset_approvals');
}

export async function getAdminDatasetQuality(
  tenantSlug: string,
  datasetId: string,
): Promise<AdminDatasetQuality | null> {
  if (isFixtureMode()) return adminDatasetQualityFixture(tenantSlug, datasetId);
  throw new AdminDataMigrationPendingError('admin_dataset_quality');
}

export async function getAdminDatasetQualityScores(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminDatasetQuality>> {
  if (isFixtureMode()) return adminDatasetQualityScoresFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_dataset_quality');
}

export async function getAdminLoadedFiles(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminLoadedFileRow>> {
  if (isFixtureMode()) return adminLoadedFilesFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('data_uploads');
}

export function getAdminDatasetsFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminDatasetRow> {
  return adminDatasetsFixture(tenantSlug);
}
