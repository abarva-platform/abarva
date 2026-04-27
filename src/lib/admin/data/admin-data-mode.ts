/**
 * ADMIN-DATA2 — Adapter mode helper.
 *
 * Reads `ADMIN_DATA_MODE` env (`fixture` | `live`; default `fixture`).
 * In fixture mode, adapters return deterministic seed data.
 * In live mode, adapters either query the real DB or throw
 * `AdminDataMigrationPendingError` until DATA10 lands.
 */

export type AdminDataMode = 'fixture' | 'live';

const VALID_MODES: ReadonlyArray<AdminDataMode> = ['fixture', 'live'];

export function getAdminDataMode(): AdminDataMode {
  const raw = process.env.ADMIN_DATA_MODE;
  if (!raw) return 'fixture';
  return (VALID_MODES as ReadonlyArray<string>).includes(raw)
    ? (raw as AdminDataMode)
    : 'fixture';
}

export function isFixtureMode(): boolean {
  return getAdminDataMode() === 'fixture';
}

/**
 * Thrown when an adapter is asked to read from a table that has not yet
 * been migrated. DATA10 ships migrations and removes these throws.
 */
export class AdminDataMigrationPendingError extends Error {
  readonly tableName: string;
  readonly migrationSlice: string;

  constructor(tableName: string, migrationSlice: string = 'ADMIN-DATA10') {
    super(
      `Admin data table '${tableName}' is not yet migrated. ` +
        `Real-DB read deferred until ${migrationSlice}. ` +
        `Set ADMIN_DATA_MODE=fixture (default) to use deterministic seed.`,
    );
    this.name = 'AdminDataMigrationPendingError';
    this.tableName = tableName;
    this.migrationSlice = migrationSlice;
  }
}
