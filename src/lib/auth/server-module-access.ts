import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canAccessModule,
  resolveModuleAccess,
  type ModuleAccessResult,
  type ProductModule,
} from "@/lib/auth/module-access";
import {
  PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
  readPrivateBrowserProofSessionValue,
} from "@/lib/auth/private-browser-proof-session";

export async function getCurrentModuleAccess(): Promise<{
  user: Awaited<ReturnType<typeof currentUser>> | null;
  email: string | null;
  access: ModuleAccessResult;
}> {
  const proofSession = await readPrivateBrowserProofSessionValue(
    (await cookies()).get(PRIVATE_BROWSER_PROOF_SESSION_COOKIE)?.value,
  ).catch(() => null);
  if (proofSession) {
    return {
      user: null,
      email: proofSession.email,
      access: {
        modules: proofSession.moduleAccess,
        explicit: true,
        noWorkspaceAssigned: false,
      },
    };
  }

  const user = await currentUser().catch(() => null);
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

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
      publicMetadata: user?.publicMetadata as
        | Record<string, unknown>
        | null
        | undefined,
    }),
  };
}

export async function requireProductModule(module: ProductModule) {
  const { user, email, access } = await getCurrentModuleAccess();
  if (!user && !access.explicit) {
    redirect("/sign-in");
  }

  const allowed = user
    ? canAccessModule(
        {
          role: user.publicMetadata?.role as string | undefined,
          email,
          publicMetadata: user.publicMetadata as
            | Record<string, unknown>
            | null
            | undefined,
        },
        module,
      )
    : access.modules.includes(module);

  if (!allowed) {
    redirect(`/home?access=${module}_required`);
  }
}
