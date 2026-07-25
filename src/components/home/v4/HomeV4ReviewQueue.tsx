"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import type {
  HomeKnowledgeV4JobRunFailure,
  HomeKnowledgeV4PackHistoryRow,
  HomeKnowledgeV4ReviewCandidate,
} from "@/lib/home/home-knowledge-v4-review";

function statusPill(label: string, tone: string) {
  return (
    <span className="heb-v4-rq-pill" style={{ background: tone }}>
      {label}
    </span>
  );
}

function validationPill(status: string | null) {
  if (status === "pass") return statusPill("Pass", COLORS.teal);
  if (status === "fail") return statusPill("Failed", COLORS.red);
  if (status === "warn") return statusPill("Pass with warnings", COLORS.amber);
  return statusPill(status ?? "Unknown", COLORS.quiet);
}

function approvalPill(status: string) {
  if (status === "approved") return statusPill("Active", COLORS.tealDark);
  if (status === "candidate") return statusPill("Awaiting review", COLORS.amber);
  if (status === "retired") return statusPill("Retired", COLORS.quiet);
  if (status === "rejected") return statusPill("Rejected", COLORS.red);
  return statusPill(status, COLORS.quiet);
}

function CandidateRow({
  candidate,
  onChanged,
}: {
  candidate: HomeKnowledgeV4ReviewCandidate;
  onChanged: () => void;
}) {
  const [overrideReason, setOverrideReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [retireReason, setRetireReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showRetire, setShowRetire] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsOverride = candidate.validation_status !== "pass";
  const isActive = candidate.status === "approved";
  const isCandidate = candidate.status === "candidate";

  async function post(url: string, body: Record<string, unknown>) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      onChanged();
    } catch {
      setError("Request failed to reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    if (needsOverride && !overrideReason.trim()) {
      setError("An override reason is required to approve a flagged candidate.");
      return;
    }
    await post("/api/admin/home-knowledge-v4/approve", { tenantKey: candidate.tenant_key, overrideReason });
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setError("A reject reason is required.");
      return;
    }
    await post("/api/admin/home-knowledge-v4/reject", { packId: candidate.id, reason: rejectReason });
  }

  async function handleRetire() {
    if (!retireReason.trim()) {
      setError("A retire reason is required.");
      return;
    }
    await post("/api/admin/home-knowledge-v4/retire", { tenantKey: candidate.tenant_key, reason: retireReason });
  }

  return (
    <article className="heb-v4-rq-row">
      <div className="heb-v4-rq-row-head">
        <h3>{candidate.tenant_name}</h3>
        <div className="heb-v4-rq-pills">
          {approvalPill(candidate.status)}
          {validationPill(candidate.validation_status)}
        </div>
      </div>
      <p className="heb-v4-rq-meta">
        {candidate.pack_version} · generated {new Date(candidate.created_at).toLocaleString()}
        {isActive && candidate.approved_by ? ` · approved by ${candidate.approved_by}` : ""}
        {candidate.status === "rejected" && candidate.rejected_by ? ` · rejected by ${candidate.rejected_by}` : ""}
        {candidate.status === "retired" && candidate.retired_by ? ` · retired by ${candidate.retired_by}` : ""}
      </p>
      {candidate.override_reason ? (
        <p className="heb-v4-rq-override-note">
          {candidate.rollback_of_pack_id ? "Rolled back" : "Approved with override"} by {candidate.overridden_by}: &ldquo;{candidate.override_reason}&rdquo;
        </p>
      ) : null}
      {candidate.reject_reason ? (
        <p className="heb-v4-rq-override-note">Rejected: &ldquo;{candidate.reject_reason}&rdquo;</p>
      ) : null}
      {candidate.retire_reason ? (
        <p className="heb-v4-rq-override-note">Retired: &ldquo;{candidate.retire_reason}&rdquo;</p>
      ) : null}
      {candidate.violations.length > 0 ? (
        <div className="heb-v4-rq-findings">
          <span className="heb-section-label">{candidate.violations.length} finding{candidate.violations.length === 1 ? "" : "s"}</span>
          <ul>
            {candidate.violations.slice(0, 8).map((violation, index) => (
              <li key={index}>
                <strong>{violation.dimension_key ?? "general"}:</strong> {violation.message ?? violation.type}
              </li>
            ))}
            {candidate.violations.length > 8 ? <li>…and {candidate.violations.length - 8} more.</li> : null}
          </ul>
        </div>
      ) : null}
      <div className="heb-v4-rq-actions">
        {isCandidate ? (
          <>
            {needsOverride ? (
              <textarea
                className="heb-v4-rq-override-input"
                placeholder="Required: why is it safe to approve this candidate despite the failed findings above?"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                rows={2}
              />
            ) : null}
            <div className="heb-v4-rq-action-row">
              <button type="button" className="heb-v4-rq-approve-btn" onClick={handleApprove} disabled={submitting}>
                {submitting ? "Approving…" : needsOverride ? "Approve with override" : "Approve"}
              </button>
              <button type="button" className="heb-v4-rq-reject-btn" onClick={() => setShowReject((v) => !v)} disabled={submitting}>
                Reject
              </button>
            </div>
            {showReject ? (
              <div className="heb-v4-rq-action-row">
                <textarea
                  className="heb-v4-rq-override-input"
                  placeholder="Required: why is this candidate being declined?"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={2}
                />
                <button type="button" className="heb-v4-rq-reject-confirm-btn" onClick={handleReject} disabled={submitting}>
                  {submitting ? "Rejecting…" : "Confirm reject"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        {isActive ? (
          <div className="heb-v4-rq-action-row">
            <button type="button" className="heb-v4-rq-reject-btn" onClick={() => setShowRetire((v) => !v)} disabled={submitting}>
              Retire
            </button>
          </div>
        ) : null}
        {showRetire ? (
          <div className="heb-v4-rq-action-row">
            <textarea
              className="heb-v4-rq-override-input"
              placeholder="Required: why is this active pack being pulled down (tenant falls back to V2)?"
              value={retireReason}
              onChange={(event) => setRetireReason(event.target.value)}
              rows={2}
            />
            <button type="button" className="heb-v4-rq-reject-confirm-btn" onClick={handleRetire} disabled={submitting}>
              {submitting ? "Retiring…" : "Confirm retire"}
            </button>
          </div>
        ) : null}
        <button type="button" className="heb-v4-rq-history-btn" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "Hide version history" : "View version history"}
        </button>
        {error ? <p className="heb-v4-rq-error">{error}</p> : null}
      </div>
      {showHistory ? (
        <HistoryPanel tenantKey={candidate.tenant_key} onChanged={onChanged} />
      ) : null}
    </article>
  );
}

function HistoryPanel({ tenantKey, onChanged }: { tenantKey: string; onChanged: () => void }) {
  const [history, setHistory] = useState<HomeKnowledgeV4PackHistoryRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/home-knowledge-v4/history?tenantKey=${encodeURIComponent(tenantKey)}`)
      .then((res) => res.json())
      .then((data) => setHistory(Array.isArray(data.history) ? data.history : []))
      .catch(() => setError("Failed to load version history."))
      .finally(() => setLoading(false));
  }, [tenantKey]);

  async function handleRollback(targetPackId: string) {
    if (!reason.trim()) {
      setError("A rollback reason is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/home-knowledge-v4/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantKey, targetPackId, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Rollback failed.");
        return;
      }
      onChanged();
    } catch {
      setError("Rollback request failed to reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="heb-v4-rq-history-loading">Loading version history…</p>;
  if (!history || history.length === 0) return <p className="heb-v4-rq-history-loading">No version history yet.</p>;

  return (
    <div className="heb-v4-rq-history">
      <span className="heb-section-label">Version history ({history.length})</span>
      <ul>
        {history.map((row) => {
          const canRollback = row.status === "retired" || row.status === "rejected";
          return (
            <li key={row.id}>
              <span className="heb-v4-rq-history-status">{row.status}</span>
              {row.pack_version} · {new Date(row.created_at).toLocaleString()}
              {row.status === "retired" && row.retire_reason ? ` — "${row.retire_reason}"` : ""}
              {row.status === "rejected" && row.reject_reason ? ` — "${row.reject_reason}"` : ""}
              {canRollback ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="heb-v4-rq-rollback-btn"
                    onClick={() => setRollingBackId(rollingBackId === row.id ? null : row.id)}
                  >
                    Roll back to this
                  </button>
                  {rollingBackId === row.id ? (
                    <div className="heb-v4-rq-action-row">
                      <textarea
                        className="heb-v4-rq-override-input"
                        placeholder="Required: why roll back to this specific pack?"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={2}
                      />
                      <button
                        type="button"
                        className="heb-v4-rq-reject-confirm-btn"
                        onClick={() => handleRollback(row.id)}
                        disabled={submitting}
                      >
                        {submitting ? "Rolling back…" : "Confirm rollback"}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
      {error ? <p className="heb-v4-rq-error">{error}</p> : null}
    </div>
  );
}

export function HomeV4ReviewQueue({
  candidates,
  recentFailures,
}: {
  candidates: HomeKnowledgeV4ReviewCandidate[];
  recentFailures: HomeKnowledgeV4JobRunFailure[];
}) {
  const router = useRouter();

  if (candidates.length === 0 && recentFailures.length === 0) return <HomeV4ReviewQueueStyles />;

  return (
    <section className="heb-v4-rq">
      <header className="heb-v4-rq-header">
        <span className="heb-section-label">Review queue</span>
        <p>Candidates persisted for the 3 book-mode tenants. Nothing here is live until explicitly approved.</p>
      </header>
      <div className="heb-v4-rq-rows">
        {candidates.map((candidate) => (
          // router.refresh() re-runs the server component's data fetch --
          // candidates/recentFailures are server-fetched props, so a purely
          // client-side state bump would reset local UI state without ever
          // reflecting the real post-approval database row.
          <CandidateRow key={candidate.id} candidate={candidate} onChanged={() => router.refresh()} />
        ))}
      </div>
      {recentFailures.length > 0 ? (
        <div className="heb-v4-rq-failures">
          <span className="heb-section-label">Recent generation / persistence failures</span>
          <ul>
            {recentFailures.map((failure) => (
              <li key={failure.id}>
                <span className="heb-v4-rq-failure-tag">{failure.outcome === "generation_failed" ? "Generation failed" : "Persistence failed"}</span>
                {failure.tenant_key} — {failure.error_message ?? "no error detail recorded"} ({new Date(failure.created_at).toLocaleString()})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <HomeV4ReviewQueueStyles />
    </section>
  );
}

function HomeV4ReviewQueueStyles() {
  return (
    <style jsx global>{`
      .heb-v4-rq {
        margin: 0 0 20px;
        padding: 16px 20px;
        border: 1px solid ${COLORS.line};
        border-radius: 12px;
        background: ${COLORS.surface};
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .heb-v4-rq-header p {
        margin: 4px 0 0;
        font-size: 12.5px;
        color: ${COLORS.muted};
      }
      .heb-v4-rq-rows {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .heb-v4-rq-row {
        padding: 12px 14px;
        border: 1px solid ${COLORS.line};
        border-radius: 10px;
        background: ${COLORS.page};
      }
      .heb-v4-rq-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .heb-v4-rq-row-head h3 {
        margin: 0;
        font-size: 14px;
        color: ${COLORS.ink};
      }
      .heb-v4-rq-pills {
        display: flex;
        gap: 6px;
      }
      .heb-v4-rq-pill {
        padding: 2px 9px;
        border-radius: 999px;
        font-size: 10.5px;
        font-weight: 600;
        color: #fffdf8;
        white-space: nowrap;
      }
      .heb-v4-rq-meta {
        margin: 6px 0 0;
        font-size: 11.5px;
        color: ${COLORS.quiet};
      }
      .heb-v4-rq-override-note {
        margin: 8px 0 0;
        padding: 8px 10px;
        border-left: 3px solid ${COLORS.amber};
        background: ${COLORS.rail};
        font-size: 12px;
        color: ${COLORS.ink};
      }
      .heb-v4-rq-findings {
        margin-top: 10px;
      }
      .heb-v4-rq-findings ul {
        margin: 6px 0 0;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        color: ${COLORS.muted};
      }
      .heb-v4-rq-actions {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
      .heb-v4-rq-override-input {
        width: 100%;
        max-width: 520px;
        padding: 8px 10px;
        border: 1px solid ${COLORS.lineStrong};
        border-radius: 8px;
        font-size: 12.5px;
        font-family: inherit;
        resize: vertical;
      }
      .heb-v4-rq-approve-btn {
        padding: 6px 16px;
        border: none;
        border-radius: 999px;
        background: ${COLORS.ink};
        color: #fffdf8;
        font-size: 12.5px;
        cursor: pointer;
      }
      .heb-v4-rq-approve-btn:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .heb-v4-rq-action-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
      .heb-v4-rq-reject-btn,
      .heb-v4-rq-history-btn {
        padding: 6px 16px;
        border: 1px solid ${COLORS.lineStrong};
        border-radius: 999px;
        background: transparent;
        color: ${COLORS.ink};
        font-size: 12.5px;
        cursor: pointer;
      }
      .heb-v4-rq-reject-confirm-btn,
      .heb-v4-rq-rollback-btn {
        padding: 5px 14px;
        border: 1px solid ${COLORS.red};
        border-radius: 999px;
        background: transparent;
        color: ${COLORS.red};
        font-size: 12px;
        cursor: pointer;
      }
      .heb-v4-rq-rollback-btn {
        border-color: ${COLORS.blue};
        color: ${COLORS.blue};
        padding: 2px 10px;
        font-size: 11px;
      }
      .heb-v4-rq-history-btn {
        align-self: flex-start;
      }
      .heb-v4-rq-history {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed ${COLORS.line};
      }
      .heb-v4-rq-history ul {
        margin: 6px 0 0;
        padding-left: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 12px;
        color: ${COLORS.muted};
      }
      .heb-v4-rq-history-status {
        display: inline-block;
        margin-right: 6px;
        padding: 1px 7px;
        border-radius: 999px;
        background: ${COLORS.rail};
        color: ${COLORS.ink};
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .heb-v4-rq-history-loading {
        margin: 10px 0 0;
        font-size: 12px;
        color: ${COLORS.quiet};
      }
      .heb-v4-rq-error {
        margin: 0;
        font-size: 12px;
        color: ${COLORS.red};
      }
      .heb-v4-rq-failures {
        padding-top: 10px;
        border-top: 1px dashed ${COLORS.line};
      }
      .heb-v4-rq-failures ul {
        margin: 6px 0 0;
        padding-left: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: ${COLORS.muted};
      }
      .heb-v4-rq-failure-tag {
        display: inline-block;
        margin-right: 6px;
        padding: 1px 7px;
        border-radius: 999px;
        background: ${COLORS.red};
        color: #fffdf8;
        font-size: 10px;
        font-weight: 600;
      }
    `}</style>
  );
}
