// GET /api/programs/expert-kernel/export
//
// Stable API alias for the Moves Expert Kernel artifact download route.
// The original page-adjacent route remains for unit compatibility, but the
// production app must link to an /api path so Vercel cannot resolve the request
// through the strategic-moves page tree.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export { GET } from '@/app/programs/expert-kernel/expert-review/export/route';
