// ADMIN8 — Legacy /platform/admin/production-readiness retired.
// Canonical implementation is /admin/production-readiness, gated by /admin/layout.tsx.
import { redirect } from 'next/navigation';

export default function PlatformAdminProductionReadinessRedirect() {
  redirect('/admin/production-readiness');
}
