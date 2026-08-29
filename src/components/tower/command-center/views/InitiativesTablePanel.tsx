"use client";

/**
 * Initiatives -> table.
 *
 * Reads the uncapped `allInitiatives` collection. The executive `ai` array is intentionally capped,
 * so using it here would silently hide rows from the mechanical table.
 */

import { useMemo, useState } from "react";
import type React from "react";

import type { TowerAiKind, TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatUsdM } from "@/lib/tower/command-center/format";

type FilterKey = "all" | TowerAiKind;
type SortKey = "name" | "domain" | "status" | "investment" | "value" | "claimable";

const KIND_LABEL: Record<TowerAiKind, string> = {
  funded: "Funded",
  embedded: "Embedded",
  candidate: "Candidate",
  governance: "Governance",
  platform: "Platform",
};

const STATUS_LABEL: Record<string, string> = {
  sponsor_claimed: "Sponsor claimed",
  finance_challenged: "Challenged",
  cfo_approved_target: "CFO target",
  not_submitted: "Not submitted",
  finance_validated_actual: "Validated actual",
  approved: "Approved",
  not_funded: "Not funded",
};

const HEADER: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,3fr) minmax(0,1.45fr) 124px 98px 116px 114px",
  gap: 14,
  padding: "10px 22px",
  borderBottom: "1px solid var(--canon-border-strong)",
};

const TH: React.CSSProperties = {
  appearance: "none",
  background: "transparent",
  border: 0,
  color: "var(--canon-gray-500)",
  cursor: "pointer",
  fontFamily: "var(--abarva-mono)",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  padding: 0,
  textAlign: "left",
  textTransform: "uppercase",
};

function statusLabel(item: TowerAiView): string {
  if (!item.financeStatus) return "Not loaded";
  return STATUS_LABEL[item.financeStatus] ?? item.financeStatus.replace(/_/g, " ");
}

function valueLabel(item: TowerAiView): string {
  return item.promisedBenefitLoaded ? formatUsdM(item.promisedUsd) : "Not loaded";
}

function claimableProxy(item: TowerAiView): string {
  return item.financeValidatedUsd > 0 ? formatUsdM(item.financeValidatedUsd) : "Not loaded";
}

function sortValue(item: TowerAiView, key: SortKey): number | string {
  if (key === "name") return item.name;
  if (key === "domain") return item.category ?? "";
  if (key === "status") return statusLabel(item);
  if (key === "investment") return item.aiSpendUsd;
  if (key === "value") return item.promisedBenefitLoaded ? item.promisedUsd : -1;
  return item.financeValidatedUsd || -1;
}

export function InitiativesTablePanel({ view }: { view: TowerCommandCenterView }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("investment");
  const [desc, setDesc] = useState(true);
  const chips: FilterKey[] = ["all", "funded", "embedded", "platform", "governance", "candidate"];
  const rows = useMemo(() => {
    return [...view.allInitiatives]
      .filter((item) => filter === "all" || item.kind === filter)
      .sort((a, b) => {
        const av = sortValue(a, sort);
        const bv = sortValue(b, sort);
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return desc ? -cmp : cmp;
      });
  }, [desc, filter, sort, view.allInitiatives]);

  function updateSort(next: SortKey) {
    if (next === sort) setDesc((current) => !current);
    else {
      setSort(next);
      setDesc(next !== "name" && next !== "domain" && next !== "status");
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--canon-gray-500)", marginRight: 4 }}>
          Filter
        </span>
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setFilter(chip)}
            style={{
              border: "1px solid var(--canon-border)",
              background: filter === chip ? "var(--canon-teal-light)" : "var(--canon-bg-surface)",
              color: filter === chip ? "var(--canon-teal-dark)" : "var(--canon-gray-700)",
              borderRadius: 0,
              cursor: "pointer",
              fontFamily: "var(--abarva-mono)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "7px 10px",
              textTransform: "uppercase",
            }}
          >
            {chip === "all" ? "All" : KIND_LABEL[chip]}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 14, color: "var(--canon-gray-500)" }}>
          {rows.length} of {view.allInitiatives.length} shown
        </span>
      </div>

      <div style={{ background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)" }}>
        <div style={HEADER}>
          {[
            ["name", "Initiative"],
            ["domain", "Domain"],
            ["status", "Status"],
            ["investment", "Invested"],
            ["value", "Sponsor-stated"],
            ["claimable", "Finance actual"],
          ].map(([key, label], i) => (
            <button
              key={key}
              type="button"
              onClick={() => updateSort(key as SortKey)}
              style={{ ...TH, textAlign: i >= 3 ? "right" : "left" }}
            >
              {label}
            </button>
          ))}
        </div>
        {rows.map((item) => (
          <div
            key={item.id}
            style={{
              ...HEADER,
              alignItems: "center",
              borderBottom: "1px solid var(--canon-border)",
              color: "var(--canon-gray-900)",
              fontFamily: "var(--abarva-sans)",
              fontSize: 14,
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 15, lineHeight: 1.35 }}>{item.name}</span>
              <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--canon-gray-500)" }}>
                {item.id}
              </span>
            </span>
            <span style={{ color: "var(--canon-gray-500)", minWidth: 0 }}>{item.category ?? "Not loaded"}</span>
            <span style={{ color: item.financeStatus === "finance_validated_actual" ? "var(--canon-teal-dark)" : "var(--canon-gray-700)" }}>
              {statusLabel(item)}
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>{formatUsdM(item.aiSpendUsd)}</span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>{valueLabel(item)}</span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right", color: item.financeValidatedUsd > 0 ? "var(--canon-teal-dark)" : "var(--canon-gray-500)" }}>
              {claimableProxy(item)}
            </span>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--canon-gray-500)" }}>
        Readiness is available per row but is not used as a proxy for outcome. Loaded readiness:
        {" "}{view.allInitiatives.filter((item) => item.readinessScoreLoaded).length} rows.
      </p>
    </section>
  );
}
