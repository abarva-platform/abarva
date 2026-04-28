// ADMIN8 — Legacy /platform/admin/architecture retired.
// Canonical implementation is /admin/architecture.
import { redirect } from 'next/navigation';

export default function PlatformAdminArchitectureRedirect() {
  redirect('/admin/architecture');
}
