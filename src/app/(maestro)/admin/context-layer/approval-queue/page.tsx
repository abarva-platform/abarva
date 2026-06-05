import { getActiveClientRow } from "@/lib/active-client";
import { getTenantPendingChunks } from "@/lib/context-ingestion/tenant-context-read-model";

export const metadata = { title: "Context Approval Queue | AbarVa Admin" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string | null): string {
  if (!value) return "Not attempted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ContextApprovalQueuePage() {
  const activeClient = await getActiveClientRow(null);
  const pendingChunks = activeClient
    ? await getTenantPendingChunks(activeClient.id, { limit: 100 })
    : [];

  return (
    <main style={{ background: "#F8F7F4", minHeight: "100%", padding: 32 }}>
      <section
        style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 18 }}
      >
        <div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              letterSpacing: 0,
              textTransform: "uppercase",
            }}
          >
            Admin · Approval queue
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 42, margin: 0 }}>
            {activeClient
              ? `${activeClient.name} approval queue`
              : "Approval queue"}
          </h1>
        </div>

        {!activeClient ? (
          <p style={{ fontFamily: "DM Sans, sans-serif", lineHeight: 1.6 }}>
            No active client row is available for this session.
          </p>
        ) : pendingChunks.length === 0 ? (
          <div
            style={{
              background: "#fffdf8",
              border: "1px solid #d8d2c4",
              borderRadius: 8,
              padding: 18,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            No pending or failed embedding chunks are currently visible for this
            tenant. Check embedding history before treating loaded context as
            agent-ready.
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fffdf8",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            <thead>
              <tr>
                {[
                  "Chunk",
                  "Source document",
                  "Index",
                  "State",
                  "Last attempt",
                  "Error",
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #d8d2c4",
                      textAlign: "left",
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingChunks.map((item) => (
                <tr key={item.chunk_id}>
                  <td
                    style={{ padding: 10, borderBottom: "1px solid #eee7d8" }}
                  >
                    {item.chunk_id}
                  </td>
                  <td
                    style={{ padding: 10, borderBottom: "1px solid #eee7d8" }}
                  >
                    {item.source_doc}
                  </td>
                  <td
                    style={{ padding: 10, borderBottom: "1px solid #eee7d8" }}
                  >
                    {item.chunk_index}
                  </td>
                  <td
                    style={{ padding: 10, borderBottom: "1px solid #eee7d8" }}
                  >
                    {item.embedding_status}
                  </td>
                  <td
                    style={{ padding: 10, borderBottom: "1px solid #eee7d8" }}
                  >
                    {formatDate(item.last_attempt_at)}
                  </td>
                  <td
                    style={{ padding: 10, borderBottom: "1px solid #eee7d8" }}
                  >
                    {item.error_message ?? "Awaiting embedding"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
