"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { constantColumnsForRecord } from "@/lib/home/preview/bundle-normalization";
import type { TechRecordType } from "@/lib/home/preview/types";
import { RecordBrowser, RelationshipLens } from "../v4/RecordBrowser";
import { cxoText } from "../v4/cxo-language";
import type { CanvasPanel } from "./canvas-model";
import styles from "./HomeCanvas.module.css";

export function FamilyCanvas({
  family,
  panel,
  query,
  recordsHref,
}: {
  family: TechRecordType;
  panel: CanvasPanel;
  query: string;
  recordsHref: string;
}) {
  const constants = useMemo(() => constantColumnsForRecord(family), [family]);
  const primary = family.primaryDimension;
  const distribution = useMemo(() => {
    if (!primary) return [];
    const counts = new Map<string, number>();
    for (const row of family.rows) {
      const value = String(row[primary] ?? "").trim() || "Not recorded";
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts]
      .map(([label, count]) => ({ label: cxoText(label), count }))
      .sort((a, b) => b.count - a.count);
  }, [family.rows, primary]);
  if (panel === "evidence" || query)
    return (
      <RecordBrowser
        key={`${family.objectType}:${query}`}
        recordType={family}
        initialQuery={query}
        presentation="canvas"
      />
    );
  if (panel === "reading")
    return (
      <div className={styles.recordLegacy}>
        <h2 className={styles.heading}>Recorded attribute associations</h2>
        <p className={styles.basis}>
          Fields occurring on the same source row. This does not establish an
          inter-object dependency or causal relationship.
        </p>
        <RelationshipLens
          objectType={family.objectType}
          rows={family.rows}
          emptyMessage="No supported attribute pairing is present in these records."
        />
      </div>
    );
  const linked = family.rowSourceRefs
    ? family.rowSourceRefs.filter((refs) => refs.length > 0).length
    : null;
  const rows = distribution.slice(0, 7);
  return (
    <div className={styles.overview}>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <strong>{family.rows.length.toLocaleString()}</strong>
          <span>Records on screen</span>
          <small>This family, this record version</small>
        </div>
        <div className={styles.metric}>
          <strong>{family.columns.length}</strong>
          <span>Declared fields</span>
          <small>All values available in record detail</small>
        </div>
        <div className={styles.metric}>
          <strong>{constants.length}</strong>
          <span>Constant columns</span>
          <small>Defaults do not establish an assessment</small>
        </div>
        <div className={styles.metric}>
          <strong data-unknown={linked === null}>
            {linked === null ? "Not established" : linked.toLocaleString()}
          </strong>
          <span>Source-linked rows</span>
          <small>
            {linked === null
              ? "Source-row bridge not present"
              : `Of ${family.rows.length.toLocaleString()} records`}
          </small>
        </div>
      </div>
      <div className={styles.split}>
        <section className={styles.section}>
          <h2>
            {primary
              ? `Composition by ${cxoText(primary.replace(/([a-z])([A-Z])/g, "$1 $2")).toLowerCase()}`
              : "Record composition"}
          </h2>
          {rows.length > 0 ? (
            <>
              <div
                className={styles.chart}
                role="img"
                aria-label={rows
                  .map((row) => `${row.label}: ${row.count} records`)
                  .join("; ")}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rows}
                    layout="vertical"
                    margin={{ right: 20, top: 3, bottom: 3 }}
                    barSize={15}
                  >
                    <CartesianGrid horizontal={false} stroke="#e5eaec" />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      width={145}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(label: string) =>
                        label.length > 23 ? `${label.slice(0, 21)}...` : label
                      }
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="#2767ba"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <span className={styles.basis}>
                {rows.length} of {distribution.length} categories shown. Each
                row contributes once; blank values are counted as Not recorded.
              </span>
            </>
          ) : (
            <div className={styles.empty}>
              No primary grouping is declared for this family. Its rows are
              still available.
            </div>
          )}
        </section>
        <section className={styles.section}>
          <h2>Data quality to keep in view</h2>
          {constants.length > 0 ? (
            <ul className={styles.list}>
              {constants.slice(0, 5).map((column, i) => (
                <li key={column.key}>
                  <span className={styles.number}>{i + 1}</span>
                  <span>
                    {column.label}
                    <small>
                      {cxoText(column.value)} on all{" "}
                      {column.rowCount.toLocaleString()} rows. No variation to
                      support comparison.
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              No constant columns detected. This does not attest completeness or
              accuracy.
            </div>
          )}
          {constants.length > 5 && (
            <p className={styles.basis} style={{ marginTop: 12 }}>
              {constants.length - 5} more constant columns are listed in the
              record view.
            </p>
          )}
        </section>
      </div>
      <div className={styles.linkBand}>
        <div>
          <strong>Family record</strong>
          <p>{family.rows.length.toLocaleString()} supplied rows</p>
        </div>
        <Link href={recordsHref} scroll={false} prefetch={false}>
          Open records
        </Link>
      </div>
    </div>
  );
}
