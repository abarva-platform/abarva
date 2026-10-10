import type { RomResult } from "./rom-service";

/** An approved P3 estimate and its workbook link, supplied by the governed snapshot read path. */
export interface ApprovedRomSnapshot {
  id: string;
  approvedAt: string;
  result: RomResult;
  workbookHref: string | null;
}

/**
 * The approval-backed snapshot read is not published yet. Keep the missing
 * result explicit until the P3 approval flow can supply it here.
 */
export async function readApprovedRomSnapshot(
  moveId: string,
): Promise<ApprovedRomSnapshot | null> {
  void moveId;
  return null;
}
