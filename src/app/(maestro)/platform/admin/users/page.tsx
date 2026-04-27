import { redirect } from 'next/navigation';

// ADMIN10 · Legacy `/platform/admin/users` is consolidated into the canonical
// `/admin/users-access` surface (ADMIN11 lifted InviteUserForm + listing into
// the canonical admin shell). This route is a thin server-side redirect.

export default function PlatformAdminUsersRedirect(): never {
  redirect('/admin/users-access');
}
