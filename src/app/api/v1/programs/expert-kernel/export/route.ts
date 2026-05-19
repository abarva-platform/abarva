// GET /api/v1/programs/expert-kernel/export
//
// Stable authenticated API alias for the Moves Expert Kernel artifact downloads.
// The page-adjacent route remains for renderer tests, and /api/programs remains
// as a compatibility alias, but the live console links use /api/v1 because that
// namespace is already covered by the app's API auth matcher.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export { GET } from '@/app/programs/expert-kernel/expert-review/export/route';
