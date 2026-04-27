// ADMIN8 — Legacy /platform/admin retired. Redirects to canonical /admin.
// The admin tree is consolidated under /admin/* with a single auth gate
// in /admin/layout.tsx. This redirect preserves old bookmarks.
import { redirect } from 'next/navigation';

export default function PlatformAdminRedirect() {
  redirect('/admin');
}
