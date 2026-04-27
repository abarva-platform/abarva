/**
 * ADMIN-DATA2 — Admin data layer barrel.
 *
 * Adapter contracts for the 9 admin domains. Default mode is `fixture`;
 * `live` mode throws `AdminDataMigrationPendingError` until DATA10 lands.
 */

export {
  AdminDataMigrationPendingError,
  getAdminDataMode,
  isFixtureMode,
  type AdminDataMode,
} from './admin-data-mode';

// Types
export type * from './admin-overview-adapter-types';
export type * from './admin-users-adapter-types';
export type * from './admin-connectors-adapter-types';
export type * from './admin-datasets-adapter-types';
export type * from './admin-blockers-adapter-types';
export type * from './admin-audit-log-adapter-types';
export type * from './admin-setup-progress-adapter-types';
export type * from './admin-agent-readiness-adapter-types';
export type * from './admin-production-readiness-adapter-types';
export type * from './admin-build-progress-adapter-types';
export type * from './admin-architecture-adapter-types';

// Adapters
export * from './admin-overview-adapter';
export * from './admin-users-adapter';
export * from './admin-connectors-adapter';
export * from './admin-datasets-adapter';
export * from './admin-blockers-adapter';
export * from './admin-audit-log-adapter';
export * from './admin-setup-progress-adapter';
export * from './admin-agent-readiness-adapter';
export * from './admin-production-readiness-adapter';
export * from './admin-build-progress-adapter';
export * from './admin-architecture-adapter';
