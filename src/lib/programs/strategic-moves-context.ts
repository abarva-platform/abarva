import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import type { TenancyCtx } from "./types.db";

export async function getStrategicMovesTenancy(): Promise<TenancyCtx | null> {
  try {
    return await requireTenancy();
  } catch (error) {
    if (error instanceof TenancyError) return null;
    throw error;
  }
}
