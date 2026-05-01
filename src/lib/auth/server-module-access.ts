import 'server-only';

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { canAccessModule, resolveModuleAccess, type ModuleAccessResult, type ProductModule } from '@/lib/auth/module-access';

export async function getCurrentModuleAccess(): Promise<{
  user: Awaited<ReturnType<typeof currentUser>> | null;
  email: string | null;
  access: ModuleAccessResult;
}> {
  const user = await currentUser().catch(() => null);
  const email = user?.primaryEmailAddress?.emailAddress
    ?? user?.emailAddresses?.[0]?.emailAddress
    ?? null;

  if (!user) {
    return {
      user,
      email,
      access: {
        modules: [],
        explicit: false,
        noWorkspaceAssigned: true,
      },
    };
  }

  return {
    user,
    email,
    access: resolveModuleAccess({
      role: user?.publicMetadata?.role as string | undefined,
      email,
      publicMetadata: user?.publicMetadata as Record<string, unknown> | null | undefined,
    }),
  };
}

export async function requireProductModule(module: ProductModule) {
  const { user, email } = await getCurrentModuleAccess();
  if (!user) {
    redirect('/sign-in');
  }

  const allowed = canAccessModule({
    role: user.publicMetadata?.role as string | undefined,
    email,
    publicMetadata: user.publicMetadata as Record<string, unknown> | null | undefined,
  }, module);

  if (!allowed) {
    redirect(`/home?access=${module}_required`);
  }
}
