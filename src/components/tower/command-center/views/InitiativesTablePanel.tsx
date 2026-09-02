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
import {
  formatUsdM,
  gatingConstraintExplanation,
} from "@/lib/tower/command-center/format";

import styles from "../TowerCommandCenter.module.css";

type FilterKey = "all" | TowerAiKind;
type SortKey = "name" | "valueType" | "domain" | "constraint" | "investment" | "value" | "claimable";

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
  gridTemplateColumns: "minmax(240px,2.2fr) minmax(128px,0.95fr) minmax(128px,1fr) minmax(150px,1.1fr) 98px 116px 112px 92px",
  gap: 12,
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

function humanize(value: string | null | undefined): string {
  if (!value) return "Not loaded";
  return value.replace(/_/g, " ");
}

function statusLabel(item: TowerAiView): string {
  if (!item.financeStatus) return "Not loaded";
  return STATUS_LABEL[item.financeStatus] ?? humanize(item.financeStatus);
}

function valueLabel(item: TowerAiView): string {
  return item.promisedBenefitLoaded ? formatUsdM(item.promisedUsd) : "Not loaded";
}

function claimableProxy(item: TowerAiView): string {
  return item.financeValidatedUsd > 0 ? formatUsdM(item.financeValidatedUsd) : "Not loaded";
}

function sortValue(item: TowerAiView, key: SortKey): number | string {
  if (key === "name") return item.name;
  if (key === "valueType") return item.businessValueType ?? "";
  if (key === "domain") return item.category ?? "";
  if (key === "constraint") return item.gatingConstraint ?? "";
  if (key === "investment") return item.aiSpendUsd;
  if (key === "value") return item.promisedBenefitLoaded ? item.promisedUsd : -1;
  return item.financeValidatedUsd || -1;
}

export function InitiativesTablePanel({
  view,
  onOpenAi,
}: {
  view: TowerCommandCenterView;
  onOpenAi?: (n: number) => void;
}) {
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
      setDesc(
        next !== "name" && next !== "domain" && next !== "valueType" && next !== "constraint",
      );
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
            ["valueType", "Value type"],
            ["domain", "Portfolio tag"],
            ["constraint", "Constraint"],
            ["investment", "Invested"],
            ["value", "Sponsor-stated"],
            ["claimable", "Finance actual"],
            ["detail", "Detail"],
          ].map(([key, label], i) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key !== "detail") updateSort(key as SortKey);
              }}
              disabled={key === "detail"}
              style={{ ...TH, textAlign: i >= 3 ? "right" : "left" }}
            >
              {label}
            </button>
          ))}
        </div>
        {rows.map((item) => (
          <div
            key={item.id}
            onDoubleClick={() => onOpenAi?.(item.n)}
            style={{
              ...HEADER,
              alignItems: "center",
              borderBottom: "1px solid var(--canon-border)",
              color: "var(--canon-gray-900)",
              fontFamily: "var(--abarva-sans)",
              fontSize: 14,
            }}
            title="Double-click to open case details"
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <button
                type="button"
                className={styles.rowOpen}
                onClick={() => onOpenAi?.(item.n)}
                disabled={!onOpenAi}
                style={{ fontSize: 15, lineHeight: 1.35 }}
              >
                {item.name}
              </button>
              <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--canon-gray-500)" }}>
                {item.id} · {statusLabel(item)}
              </span>
            </span>
            <span style={{ color: "var(--canon-gray-700)", minWidth: 0 }}>{humanize(item.businessValueType)}</span>
            <span style={{ color: "var(--canon-gray-500)", minWidth: 0 }}>{item.category ?? "Not loaded"}</span>
            <span
              className={styles.fieldWithHelp}
              style={{ color: item.gatingConstraint ? "var(--canon-gray-700)" : "var(--canon-gray-500)", minWidth: 0 }}
              title={gatingConstraintExplanation(item.gatingConstraint)}
            >
              {humanize(item.gatingConstraint)}
              <span
                className={styles.helpBadge}
                aria-label={`Constraint help: ${gatingConstraintExplanation(item.gatingConstraint)}`}
              />
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>{formatUsdM(item.aiSpendUsd)}</span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>{valueLabel(item)}</span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right", color: item.financeValidatedUsd > 0 ? "var(--canon-teal-dark)" : "var(--canon-gray-500)" }}>
              {claimableProxy(item)}
            </span>
            <span style={{ textAlign: "right" }}>
              <button
                type="button"
                className={styles.detailLink}
                onClick={() => onOpenAi?.(item.n)}
                disabled={!onOpenAi}
                aria-label={`Open detail for ${item.name}`}
              >
                Open
              </button>
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
