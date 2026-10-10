import { z } from "zod";

import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";

const receiptRowSchema = z.object({
  event_id: z.string(),
  client_key: z.string(),
  action_type: z.literal("artifact_uploaded"),
  stage_key: z.literal("responses"),
  metadata: z.object({
    responseSupplierId: z.string().trim().min(1),
    artifactId: z.string().trim().min(1),
    responseParseState: z.enum(["parsed", "failed", "not_parsed"]),
  }),
  occurred_at: z.union([z.string().min(1), z.date()]),
});

export type SourceResponseUploadReceipt = {
  supplierId: string;
  artifactId: string;
  parseState: "parsed" | "failed" | "not_parsed";
  recordedAt: string;
};

export async function readSourceResponseUploadReceipts({
  eventId,
  clientKey,
}: {
  eventId: string;
  clientKey: string;
}): Promise<SourceResponseUploadReceipt[]> {
  if (!eventId.trim() || !clientKey.trim()) {
    throw new Error("Response upload receipt read requires event and client keys");
  }

  const { data, error } = await getAzureReadFluentClient()
    .from("source_event_activity")
    .select("event_id,client_key,action_type,stage_key,metadata,occurred_at")
    .eq("event_id", eventId)
    .eq("client_key", clientKey)
    .eq("action_type", "artifact_uploaded")
    .eq("stage_key", "responses")
    .order("occurred_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) {
    throw new Error("Response upload receipt read returned no row set");
  }

  const receipts: SourceResponseUploadReceipt[] = [];
  for (const rawRow of data) {
    const parsed = receiptRowSchema.safeParse(rawRow);
    if (!parsed.success) continue;
    const row = parsed.data;
    if (row.event_id !== eventId || row.client_key !== clientKey) continue;

    const timestamp = new Date(row.occurred_at);
    if (Number.isNaN(timestamp.getTime())) continue;
    receipts.push({
      supplierId: row.metadata.responseSupplierId,
      artifactId: row.metadata.artifactId,
      parseState: row.metadata.responseParseState,
      recordedAt: timestamp.toISOString(),
    });
  }

  return receipts.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}
