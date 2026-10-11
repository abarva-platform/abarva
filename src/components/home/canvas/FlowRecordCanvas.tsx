"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeReviewBundle } from "@/lib/home/preview/types";
import type { ArchitectureViewRefusal } from "@/lib/visual-system/resolveArchitectureView";
import type { CanvasInspection } from "./ChapterCanvas";
import { flowRecords } from "./context-coverage";
import styles from "./HomeCanvas.module.css";

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
  const pages = Math.max(1, Math.ceil(pairs.length / 6));
  if (!context.family)
    return (
      <section className={styles.section}>
        <div className={styles.empty}>
          <strong>Data-flow detail is not supplied in this bundle</strong>No
          absence of enterprise data movement is implied. The end-to-end diagram
          remains withheld until its evidence gate passes.
        </div>
      </section>
    );
  return (
    <section className={styles.overview} data-recorded-flow-view>
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
            excluded
          </small>
        </div>
        <div className={styles.metric}>
          <strong>{sources.length}</strong>
          <span>Named origins</span>
          <small>Exactly as recorded, not a resolved system count</small>
        </div>
        <div className={styles.metric}>
          <strong>{context.pairs.length}</strong>
          <span>Recorded flow combinations</span>
          <small>Origin, destination, mechanism and platform context</small>
        </div>
        <div className={styles.metric}>
          <strong>{context.missingEndpoints}</strong>
          <span>Incomplete endpoint records</span>
          <small>Excluded from connection pairs, not from coverage</small>
        </div>
      </div>
      <div className={styles.sectionLabel}>
        <h2>Where the available records say data moves</h2>
        <label className={styles.basis}>
          Origin{" "}
          <select
            aria-label="Flow origin"
            value={origin}
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
      <div className={styles.flowPairs}>
        {pairs.slice(page * 6, (page + 1) * 6).map((pair, i) => (
          <article
            className={styles.flowPair}
            key={`${page}-${i}`}
            data-recorded-flow-pair
          >
            <div className={styles.flowEndpoints}>
              <strong>{pair.source}</strong>
              <svg
                viewBox="0 0 44 20"
                width="44"
                height="20"
                aria-label="Recorded source to target"
              >
                <path
                  d="M2 10H40M33 3L40 10L33 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <strong>{pair.target}</strong>
            </div>
            <div className={styles.signalFooter}>
              <span className={styles.basis}>
                {pair.mechanism || "Mechanism not supplied"} -{" "}
                {pair.members.length} record
                {pair.members.length === 1 ? "" : "s"}
                <br />
                Platform/database context: {pair.platform || "Not supplied"}
              </span>
              <button
                className={styles.textButton}
                onClick={() =>
                  inspect({
                    title: `${pair.source} to ${pair.target}`,
                    text: pair.members
                      .map(({ row }) =>
                        Object.entries(row)
                          .map(
                            ([key, value]) =>
                              `${key}: ${value ?? "Not supplied"}`,
                          )
                          .join("\n"),
                      )
                      .join("\n\n"),
                    sourceRefs: pair.members.flatMap((item) => item.sourceRefs),
                    basis: `Recorded fields in this bundle. Source rows: ${pair.members.map((item) => item.index + 1).join(", ")}. No ordered platform hop inferred.`,
                  })
                }
              >
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
      <div className={styles.pager}>
        <span>
          Page {page + 1} of {pages} - {pairs.length} combinations
        </span>
        <button
          title="Previous page"
          aria-label="Previous flow page"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          title="Next page"
          aria-label="Next flow page"
          disabled={page + 1 >= pages}
          onClick={() => setPage(page + 1)}
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
