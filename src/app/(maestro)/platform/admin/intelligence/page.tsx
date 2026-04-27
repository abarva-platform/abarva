import { redirect } from 'next/navigation';

// ADMIN10 · Legacy `/platform/admin/intelligence` is consolidated into the
// canonical `/intelligence` surface. This route is a thin server-side
// redirect; the prior client-side soft redirect was promoted to a server
// `redirect()` for honest 308 behavior. Do not render UI here.

export default function PlatformAdminIntelligenceRedirect(): never {
  redirect('/intelligence');
}
