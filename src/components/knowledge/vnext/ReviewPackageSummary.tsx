"use client";

/**
 * ReviewPackageSummary — READ-ONLY presentation of a governed review dry-run
 * package. It renders counts, batches, samples, hashes and the classification
 * reason distribution so a human can read what a package proposes.
 *
 * This component performs NO approval and NO data-plane action. There are no
 * accept/reject controls. Package generation, review/apply, publication and
 * baseline activation belong to the foundation lane; this is only how their
 * output is displayed in the product.
 */

import { useState } from "react";
import type {
  ReviewBatchSummary,
  ReviewCandidateClass,
  ReviewPackageSummaryV1,
} from "@/lib/knowledge/consumption-contracts";
import { REVIEW_CLASS_LABELS } from "@/lib/knowledge/consumption-contracts";

const CLASS_ORDER: ReviewCandidateClass[] = [
  "auto_accept_eligible",
  "batch_review_required",
  "individual_review_required",
  "defer",
  "reject",
];

function Distribution({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  const max = Math.max(...entries.map(([, n]) => n), 1);
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="kv-eyebrow" style={{ marginBottom: 6 }}>{title}</div>
      <table className="kv-table" aria-label={title}>
        <tbody>
          {entries.map(([k, n]) => (
            <tr key={k}>
              <td style={{ width: "40%" }}>{k.replace(/_/g, " ")}</td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div aria-hidden style={{ height: 8, width: `${Math.round((n / max) * 100)}%`, minWidth: 2, background: "var(--kv-accent-bg)", borderRadius: 4 }} />
                  <span className="kv-mono" style={{ fontSize: 12 }}>{n.toLocaleString()}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReviewPackageSummary({ pkg }: { pkg: ReviewPackageSummaryV1 }) {
  return (
    <div className="kv-root" style={{ display: "block", padding: 24 }}>
      <div className="kv-banner" data-tone="info" role="status">
        <span aria-hidden>i</span>
        <span>
          Dry-run review package · <strong>read-only</strong>. No review decisions are written
          ({pkg.hardStop.replace(/_/g, " ")}). Approval and any data-plane action happen in the
          governed foundation pipeline, never from this view.
        </span>
      </div>

      <header style={{ marginBottom: 16 }}>
        <div className="kv-eyebrow">{pkg.tenantKey} · {pkg.releaseId}</div>
        <h2 className="kv-section-h">Review package · {pkg.counts.total.toLocaleString()} candidates</h2>
      </header>

      <section className="kv-card">
        <div className="kv-eyebrow" style={{ marginBottom: 8 }}>Review class distribution</div>
        <div className="kv-metric-grid">
          {CLASS_ORDER.map((c) => (
            <div key={c} className="kv-metric">
              <span className="kv-metric-val">{(pkg.byReviewClass[c] ?? 0).toLocaleString()}</span>
              <span className="kv-metric-label">{REVIEW_CLASS_LABELS[c]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", fontSize: 13 }}>
          <span><b>Proposed accept</b> {pkg.counts.proposedDecisions.accept.toLocaleString()}</span>
          <span><b>Proposed reject</b> {pkg.counts.proposedDecisions.reject.toLocaleString()}</span>
          <span><b>Proposed defer</b> {pkg.counts.proposedDecisions.defer.toLocaleString()}</span>
        </div>
      </section>

      <section className="kv-card">
        <Distribution title="By type" data={pkg.counts.byType} />
        <Distribution title="By domain" data={pkg.counts.byDomain} />
        <Distribution title="By source family" data={pkg.counts.bySourceFamily} />
        <Distribution title="By evidence completeness" data={pkg.counts.byEvidenceCompleteness} />
        <Distribution title="By confidence band" data={pkg.counts.byConfidenceBand} />
        <Distribution title="Reason distribution" data={pkg.reasonDistribution} />
      </section>

      <section className="kv-card">
        <div className="kv-eyebrow" style={{ marginBottom: 8 }}>Batches ({pkg.batches.length})</div>
        <table className="kv-table">
          <thead>
            <tr><th>Class</th><th>Type</th><th>Domain</th><th>Source</th><th>Evidence</th><th>Conf.</th><th>Count</th><th></th></tr>
          </thead>
          <tbody>
            {pkg.batches.map((b) => <BatchRow key={b.reviewBatchRef} batch={b} />)}
          </tbody>
        </table>
      </section>

      <div className="kv-proof" aria-label="Package provenance">
        <div>package: {pkg.packageId}</div>
        <div>policy: {pkg.policyVersion} · validation: {pkg.validationRunRef}</div>
        <div>package-hash: {pkg.packageContentHash}</div>
        <div>manifest-hash: {pkg.candidateManifestHash}</div>
        <div>sources: {pkg.sourceVersionRefs.join(" · ") || "—"}</div>
      </div>
    </div>
  );
}

function BatchRow({ batch }: { batch: ReviewBatchSummary }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr>
        <td><span className="kv-classbadge" data-c={batch.candidateClass === "auto_accept_eligible" ? "accepted_fact" : batch.candidateClass === "individual_review_required" ? "evidence_gap" : "candidate_insight"}>{REVIEW_CLASS_LABELS[batch.candidateClass]}</span></td>
        <td>{batch.candidateType.replace(/_candidate$/, "")}</td>
        <td>{batch.dimensions.domain}</td>
        <td>{batch.dimensions.sourceFamily}</td>
        <td>{batch.dimensions.evidenceCompleteness.replace(/_/g, " ")}</td>
        <td>{batch.dimensions.confidenceBand}</td>
        <td className="kv-mono">{batch.candidateCount.toLocaleString()}</td>
        <td>
          <button type="button" className="kv-row-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? "Hide" : "Samples"}
          </button>
        </td>
      </tr>
      {open ? (
        <tr>
          <td colSpan={8}>
            <div style={{ padding: "4px 0 8px" }}>
              <div style={{ fontSize: 11, color: "var(--kv-muted)", marginBottom: 4 }}>
                {batch.reviewBatchRef} · proposed: {batch.proposedDecision.replace(/_/g, " ")}
              </div>
              {batch.representativeSamples.map((s) => (
                <div key={s.candidateRef} style={{ fontSize: 12, padding: "3px 0", borderTop: "1px solid var(--kv-line)" }}>
                  <span className="kv-mono">{s.candidateRef}</span> — {s.summary}
                  {" · "}conf {s.confidence ?? "—"} · evidence {s.evidenceCount}
                  {s.reasons.length ? ` · ${s.reasons.join(", ")}` : ""}
                </div>
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
