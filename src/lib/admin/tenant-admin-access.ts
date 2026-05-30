import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { requireTenancy } from "@/lib/auth/tenancy";

export async function hasTenantAdminAccess(): Promise<boolean> {
  try {
    const tenancy = await requireTenancy();
    const policy = await loadUserProgramAccessPolicy(tenancy);
    return policy.canAdminUsers === true;
  } catch {
    return false;
  }
}
