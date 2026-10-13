"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import type { ArchitectureViewRefusal } from "@/lib/visual-system/resolveArchitectureView";
import type { CanvasInspection } from "./ChapterCanvas";
import { flowRecords } from "./context-coverage";
import styles from "./HomeCanvas.module.css";

const FLOW_PAGE_SIZE = 6;

export function mapRecordBasis(bundle: HomeReviewBundle) {
  return `${bundle.declaredSyntheticDemo ? "Synthetic reference. " : ""}${bundle.contextVersion ? "Projection bundle with serving lineage; this view does not independently verify serving state." : "Stored review bundle; live serving state is not established here."} Data as of: ${bundle.contextVersion?.dataAsOf || "not established"}.`;
}

export function FlowRecordCanvas({
  bundle,
  refusal,
  recordsHref,
  inspect,
}: {
  bundle: HomeReviewBundle;
  refusal?: ArchitectureViewRefusal;
  recordsHref: string;
  inspect: (detail: CanvasInspection) => void;
}) {
  const context = flowRecords(bundle);
  const [origin, setOrigin] = useState("");
  const [page, setPage] = useState(0);
  const sources = [...new Set(context.pairs.map((pair) => pair.source))].sort();
  const pairs = context.pairs.filter(
    (pair) => !origin || pair.source === origin,
  );
  const pages = Math.max(1, Math.ceil(pairs.length / FLOW_PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const first = currentPage * FLOW_PAGE_SIZE;
  const visiblePairs = pairs.slice(first, first + FLOW_PAGE_SIZE);
  const basis = mapRecordBasis(bundle);
  if (!context.family)
    return (
      <section className={styles.section}>
        <p className={styles.basis}>{basis}</p>
        <div className={styles.empty}>
          <strong>Data-flow detail is not supplied in this bundle</strong>No
          absence of enterprise data movement is implied. The end-to-end diagram
          remains withheld until its evidence gate passes.
        </div>
      </section>
    );
  return (
    <section
      className={styles.overview}
      data-recorded-flow-view
      style={{ minWidth: 0, maxWidth: "100%" }}
    >
      <p className={styles.basis}>{basis}</p>
      <div className={styles.notice}>
        <strong>Recorded source-to-target movements.</strong>{" "}
        {refusal
          ? "The full diagram is withheld because its evidence gate has not passed."
          : "Individual pairs complement the admitted architecture diagram."}{" "}
        No additional intermediate connections are inferred here.
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <strong>{context.rows.length}</strong>
          <span>Current / unstated-state flow records</span>
          <small>
            {context.unstatedState} without a declared state; target-state rows
            excluded; analytics-workload rows excluded
          </small>
        </div>
        <div className={styles.metric}>
          <strong>{sources.length}</strong>
          <span>Named origins</span>
          <small>Exactly as recorded, not a resolved system count</small>
        </div>
        <div className={styles.metric}>
          <strong>{context.pairs.length}</strong>
          <span>Distinct recorded flow combinations</span>
          <small>Origin, destination, mechanism and platform context</small>
        </div>
        <div className={styles.metric}>
          <strong>{context.missingEndpoints}</strong>
          <span>Incomplete endpoint records</span>
          <small>Excluded from connection pairs, not from coverage</small>
        </div>
      </div>
      <div className={styles.sectionLabel} style={{ flexWrap: "wrap" }}>
        <h2>Where the available records say data moves</h2>
        <label
          className={styles.basis}
          style={{ minWidth: 0, maxWidth: "100%" }}
        >
          Origin{" "}
          <select
            aria-label="Flow origin"
            value={origin}
            style={{ width: "100%", maxWidth: 240 }}
            onChange={(event) => {
              setOrigin(event.target.value);
              setPage(0);
            }}
          >
            <option value="">All recorded origins</option>
            {sources.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      <p className={styles.basis}>
        A platform/database field is context on the record, not proof of an
        ordered intermediate hop. These pairs do not establish convergence,
        lineage completeness or a causal chain.
      </p>
      <p className={styles.basis}>
        {pairs.length
          ? `Showing combinations ${first + 1}-${first + visiblePairs.length} of ${pairs.length}${origin ? " for the selected origin" : " across all recorded origins"}.`
          : "No complete pair in this selection."}{" "}
        Ordered by supporting row count, not volume, value or business
        criticality. One row belongs to one combination; these are not unique
        system or asset counts.
      </p>
      <div className={styles.flowPairs}>
        {visiblePairs.map((pair, i) => (
          <article
            className={styles.flowPair}
            key={`${currentPage}-${i}`}
            data-recorded-flow-pair
          >
            <div className={styles.flowEndpoints}>
              <strong>{pair.source}</strong>
              <ArrowRight size={32} aria-hidden="true" />
              <strong>{pair.target}</strong>
            </div>
            <div className={styles.signalFooter} style={{ flexWrap: "wrap" }}>
              <span
                className={styles.basis}
                style={{ overflowWrap: "anywhere", minWidth: 0 }}
              >
                {pair.mechanism || "Mechanism not supplied"} -{" "}
                {pair.members.length} record
                {pair.members.length === 1 ? "" : "s"}
                <br />
                Platform/database context: {pair.platform || "Not supplied"}
              </span>
              <button
                className={styles.textButton}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
                onClick={() =>
                  inspect({
                    title: `${pair.source} to ${pair.target}`,
                    text: pair.members
                      .map(({ row }) =>
                        Object.entries(row)
                          .map(
                            ([key, value]) =>
                              `${key}: ${value === null || value === undefined || (typeof value === "string" && !value.trim()) ? "Not supplied" : value}`,
                          )
                          .join("\n"),
                      )
                      .join("\n\n"),
                    sourceRefs: pair.members.flatMap((item) => item.sourceRefs),
                    basis: `${basis} Recorded fields in this bundle. Bundle row positions: ${pair.members.map((item) => item.index + 1).join(", ")}. ${pair.members.some((item) => item.sourceRefs.length) ? "Supplied source references are not independent source-row verification." : "No inspectable source links supplied."} No ordered platform hop inferred.`,
                  })
                }
              >
                <FileText size={16} aria-hidden="true" />
                Source records
              </button>
            </div>
          </article>
        ))}
      </div>
      {!pairs.length && (
        <div className={styles.empty}>
          No complete source-to-target pair is supplied for this selection.
        </div>
      )}
      <div className={styles.pager} style={{ flexWrap: "wrap" }}>
        <span>
          Page {currentPage + 1} of {pages} - {pairs.length} combinations
        </span>
        <button
          title="Previous page"
          aria-label="Previous flow page"
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          title="Next page"
          aria-label="Next flow page"
          disabled={currentPage + 1 >= pages}
          onClick={() => setPage(currentPage + 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <Link href={recordsHref} scroll={false} prefetch={false}>
          Full data record
        </Link>
      </div>
      {refusal && (
        <details className={styles.graphDetail}>
          <summary>Why the end-to-end diagram is withheld</summary>
          {refusal.failedRules.map((rule) => (
            <p key={rule.ruleId}>
              <strong>{rule.headline}.</strong> {rule.detail}
            </p>
          ))}
          <h3>Evidence needed for the full diagram</h3>
          <ul>
            {refusal.evidenceNeeded.map((item) => (
              <li key={item.evidenceType}>{item.description}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
