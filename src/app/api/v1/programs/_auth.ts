// Shared auth + tenancy resolver for /api/v1/programs/** routes.
// The implementation lives in src/lib/auth/tenancy so server components
// and non-Programs modules can enforce the same one-client boundary without
// importing from an API route.

export { TenancyError, requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
