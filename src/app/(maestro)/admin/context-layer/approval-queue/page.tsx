import { getActiveClientRow } from "@/lib/active-client";
import { getTenantPendingChunks } from "@/lib/context-ingestion/tenant-context-read-model";
import {
  buildMovesLearningPromotionPreview,
  buildMovesLearningReviewPacket,
  getMovesLearningReviewQueue,
  type MovesLearningReviewCandidate,
  type MovesLearningReviewQueue,
} from "@/lib/programs/learning-writeback";

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

function countEntries(counts: Record<string, number>): string {
  const entries = Object.entries(counts);
  if (entries.length === 0) return "None";
  return entries.map(([label, count]) => `${label}: ${count}`).join(" · ");
}

function phaseLabel(phase: number | null): string {
  return typeof phase === "number" ? `P${phase}` : "Phase unknown";
}

function renderCandidateStatus(candidate: MovesLearningReviewCandidate): string {
  return [
    candidate.readinessStatus,
    candidate.retrievability,
    candidate.policyValidationStatus,
  ].join(" / ");
}

function MovesLearningQueueSection({
  queue,
}: {
  readonly queue: MovesLearningReviewQueue;
}) {
  return (
    <section
      style={{
        background: "#fffdf8",
        border: "1px solid #d8d2c4",
        borderRadius: 8,
        padding: 18,
        fontFamily: "DM Sans, sans-serif",
        display: "grid",
        gap: 16,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            color: "#0f766e",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          Moves learning candidates
        </p>
        <h2 style={{ fontFamily: "Georgia, serif", margin: "6px 0" }}>
          Review what Moves is teaching the context layer
        </h2>
        <p style={{ color: "#514c43", lineHeight: 1.5, margin: 0 }}>
          These rows are persisted from approved Move evidence, signed-off
          deliverables, and gate decisions. They are intentionally held as
          reviewable candidates: not indexed, not agent-ready, and not consumed
          by Nexus until stewardship promotion happens.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {[
          ["Candidates", queue.counts.total.toLocaleString()],
          ["Source basis", countEntries(queue.counts.bySourceBasis)],
          ["Readiness", countEntries(queue.counts.byReadiness)],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid #e3decf",
              borderRadius: 8,
              padding: 12,
              minHeight: 76,
            }}
          >
            <div style={{ color: "#6b665c", fontSize: 12 }}>{label}</div>
            <strong style={{ display: "block", marginTop: 6 }}>{value}</strong>
          </div>
        ))}
      </div>

      {queue.candidates.length === 0 ? (
        <div
          style={{
            border: "1px dashed #d8d2c4",
            borderRadius: 8,
            padding: 14,
            color: "#514c43",
          }}
        >
          No Moves learning candidates are currently visible for{" "}
          {queue.canonicalTenantKey}. Run a governed Move writeback after
          approved evidence or signed-off deliverables exist.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {queue.candidates.map((candidate) => {
            const reviewPacket = buildMovesLearningReviewPacket(candidate);
            const promotionPreview =
              buildMovesLearningPromotionPreview(candidate);
            return (
              <article
                key={candidate.id}
                style={{
                  border: "1px solid #e3decf",
                  borderRadius: 8,
                  background: "#ffffff",
                  padding: 14,
                  display: "grid",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ color: "#6b665c", fontSize: 12 }}>
                      {phaseLabel(candidate.phase)} · {candidate.sourceBasis}
                    </div>
                    <h3 style={{ margin: "4px 0", fontSize: 17 }}>
                      {candidate.title}
                    </h3>
                    <p style={{ margin: 0, color: "#514c43", lineHeight: 1.5 }}>
                      {candidate.summary}
                    </p>
                  </div>
                  <span
                    style={{
                      border: "1px solid #f3c27a",
                      borderRadius: 999,
                      color: "#8a4b00",
                      background: "#fff7e8",
                      padding: "5px 9px",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {reviewPacket.actionLabel}
                  </span>
                </div>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "130px 1fr 130px 1fr",
                    gap: "8px 12px",
                    margin: 0,
                    color: "#34312b",
                    fontSize: 13,
                  }}
                >
                  <dt style={{ color: "#6b665c" }}>Move</dt>
                  <dd style={{ margin: 0 }}>
                    {candidate.moveName ?? candidate.moveId ?? "Unknown"}
                  </dd>
                  <dt style={{ color: "#6b665c" }}>Status</dt>
                  <dd style={{ margin: 0 }}>{renderCandidateStatus(candidate)}</dd>
                  <dt style={{ color: "#6b665c" }}>Source ID</dt>
                  <dd style={{ margin: 0 }}>{candidate.sourceId ?? "Unknown"}</dd>
                  <dt style={{ color: "#6b665c" }}>Evidence refs</dt>
                  <dd style={{ margin: 0 }}>
                    {candidate.evidenceRefs.length > 0
                      ? candidate.evidenceRefs.join(", ")
                      : "None recorded"}
                  </dd>
                </dl>

                <div
                  style={{
                    border: "1px solid #dbe7f3",
                    borderRadius: 8,
                    background: "#f8fbff",
                    padding: 12,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", marginBottom: 4 }}>
                        Steward review packet
                      </strong>
                      <p
                        style={{
                          margin: 0,
                          color: "#435166",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {reviewPacket.whyHere}
                      </p>
                    </div>
                    <div>
                      <strong style={{ display: "block", marginBottom: 4 }}>
                        Safe next step
                      </strong>
                      <p
                        style={{
                          margin: 0,
                          color: "#435166",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        {reviewPacket.safeNextStep}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: "#6b665c", fontSize: 12 }}>
                        Inspect
                      </div>
                      <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                        {reviewPacket.inspect.map((item) => (
                          <li key={item} style={{ fontSize: 13, lineHeight: 1.5 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div style={{ color: "#6b665c", fontSize: 12 }}>
                        Blocks active use
                      </div>
                      <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                        {reviewPacket.blockers.length > 0 ? (
                          reviewPacket.blockers.map((item) => (
                            <li
                              key={item}
                              style={{ fontSize: 13, lineHeight: 1.5 }}
                            >
                              {item}
                            </li>
                          ))
                        ) : (
                          <li style={{ fontSize: 13, lineHeight: 1.5 }}>
                            No deterministic blocker found; still requires
                            steward sign-off before active context use.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {candidate.confidenceRationale ? (
                  <p style={{ margin: 0, color: "#6b665c", fontSize: 13 }}>
                    {candidate.confidenceRationale}
                  </p>
                ) : null}

                <div
                  style={{
                    border: "1px solid #e3decf",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      alignItems: "center",
                      background:
                        promotionPreview.status === "investigate"
                          ? "#fff7e8"
                          : promotionPreview.status === "preview_ready"
                            ? "#ecfdf5"
                            : "#fffdf8",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 12,
                    }}
                  >
                    <div>
                      <strong>Promotion readiness preview</strong>
                      <p
                        style={{
                          color: "#514c43",
                          fontSize: 13,
                          lineHeight: 1.45,
                          margin: "4px 0 0",
                        }}
                      >
                        {promotionPreview.summary}
                      </p>
                    </div>
                    <span
                      style={{
                        border: "1px solid #d8d2c4",
                        borderRadius: 999,
                        color:
                          promotionPreview.status === "preview_ready"
                            ? "#047857"
                            : promotionPreview.status === "investigate"
                              ? "#8a4b00"
                              : "#514c43",
                        padding: "5px 9px",
                        whiteSpace: "nowrap",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {promotionPreview.statusLabel}
                    </span>
                  </div>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr>
                        {["Check", "Status", "Meaning"].map((head) => (
                          <th
                            key={head}
                            style={{
                              borderTop: "1px solid #e3decf",
                              borderBottom: "1px solid #e3decf",
                              color: "#6b665c",
                              fontSize: 11,
                              letterSpacing: 0,
                              padding: 9,
                              textAlign: "left",
                              textTransform: "uppercase",
                            }}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {promotionPreview.checks.map((check) => (
                        <tr key={check.label}>
                          <td
                            style={{
                              borderBottom: "1px solid #eee7d8",
                              fontWeight: 700,
                              padding: 9,
                              width: "22%",
                            }}
                          >
                            {check.label}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #eee7d8",
                              color:
                                check.status === "pass"
                                  ? "#047857"
                                  : check.status === "investigate"
                                    ? "#8a4b00"
                                    : "#7c2d12",
                              fontWeight: 700,
                              padding: 9,
                              textTransform: "capitalize",
                              width: "14%",
                            }}
                          >
                            {check.status}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #eee7d8",
                              color: "#514c43",
                              padding: 9,
                            }}
                          >
                            {check.detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p
                    style={{
                      color: "#435166",
                      fontSize: 13,
                      lineHeight: 1.45,
                      margin: 0,
                      padding: 12,
                    }}
                  >
                    {promotionPreview.nextAction}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function ContextApprovalQueuePage() {
  const activeClient = await getActiveClientRow(null);
  const [pendingChunks, movesLearningQueue] = activeClient
    ? await Promise.all([
        getTenantPendingChunks(activeClient.id, { limit: 100 }),
        getMovesLearningReviewQueue(activeClient.key, { limit: 50 }),
      ])
    : [[], null];

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
        ) : (
          <section style={{ display: "grid", gap: 12 }}>
            {movesLearningQueue ? (
              <MovesLearningQueueSection queue={movesLearningQueue} />
            ) : null}
            <section
              style={{
                background: "#fffdf8",
                border: "1px solid #d8d2c4",
                borderRadius: 8,
                padding: 18,
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              <h2 style={{ fontFamily: "Georgia, serif", marginTop: 0 }}>
                Pending embedding chunks
              </h2>
              {pendingChunks.length === 0 ? (
                <p style={{ color: "#514c43", lineHeight: 1.5, margin: 0 }}>
                  No pending or failed embedding chunks are currently visible for
                  this tenant. Check embedding history before treating loaded
                  context as agent-ready.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fffdf8",
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
                          style={{
                            padding: 10,
                            borderBottom: "1px solid #eee7d8",
                          }}
                        >
                          {item.chunk_id}
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid #eee7d8",
                          }}
                        >
                          {item.source_doc}
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid #eee7d8",
                          }}
                        >
                          {item.chunk_index}
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid #eee7d8",
                          }}
                        >
                          {item.embedding_status}
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid #eee7d8",
                          }}
                        >
                          {formatDate(item.last_attempt_at)}
                        </td>
                        <td
                          style={{
                            padding: 10,
                            borderBottom: "1px solid #eee7d8",
                          }}
                        >
                          {item.error_message ?? "Awaiting embedding"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
