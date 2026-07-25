"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { COLORS } from "@/components/home/HomeEnterpriseBriefApp";
import type { HomeKnowledgeV4JobRunFailure, HomeKnowledgeV4ReviewCandidate } from "@/lib/home/home-knowledge-v4-review";

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
  if (status === "approved") return statusPill("Approved", COLORS.tealDark);
  if (status === "candidate") return statusPill("Awaiting review", COLORS.amber);
  if (status === "retired") return statusPill("Retired", COLORS.quiet);
  return statusPill(status, COLORS.quiet);
}

function CandidateRow({ candidate, onApproved }: { candidate: HomeKnowledgeV4ReviewCandidate; onApproved: () => void }) {
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsOverride = candidate.validation_status !== "pass";
  const alreadyApproved = candidate.status === "approved";

  async function handleApprove() {
    setError(null);
    if (needsOverride && !overrideReason.trim()) {
      setError("An override reason is required to approve a flagged candidate.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/home-knowledge-v4/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantKey: candidate.tenant_key, overrideReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Approval failed.");
        return;
      }
      onApproved();
    } catch {
      setError("Approval request failed to reach the server.");
    } finally {
      setSubmitting(false);
    }
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
        {alreadyApproved && candidate.approved_by ? ` · approved by ${candidate.approved_by}` : ""}
      </p>
      {candidate.override_reason ? (
        <p className="heb-v4-rq-override-note">
          Approved with override by {candidate.overridden_by}: &ldquo;{candidate.override_reason}&rdquo;
        </p>
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
      {!alreadyApproved ? (
        <div className="heb-v4-rq-actions">
          {needsOverride ? (
            <textarea
              className="heb-v4-rq-override-input"
              placeholder="Required: why is it safe to approve this candidate despite the failed findings above?"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              rows={2}
            />
          ) : null}
          <button type="button" className="heb-v4-rq-approve-btn" onClick={handleApprove} disabled={submitting}>
            {submitting ? "Approving…" : needsOverride ? "Approve with override" : "Approve"}
          </button>
          {error ? <p className="heb-v4-rq-error">{error}</p> : null}
        </div>
      ) : null}
    </article>
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
          <CandidateRow key={candidate.id} candidate={candidate} onApproved={() => router.refresh()} />
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
