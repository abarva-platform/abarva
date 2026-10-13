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
import { expectedBenefitKindLabel } from "./expected-benefit-kind";
import { isBusinessCase, unclassifiedPortfolioCount } from "./portfolio-kind";

type FilterKey = "all" | TowerAiKind;
type SortKey = "name" | "valueType" | "constraint" | "investment" | "value" | "claimable";

const KIND_LABEL: Record<TowerAiKind, string> = {
  funded: "Funding group",
  embedded: "Embedded",
  candidate: "Candidate",
  governance: "Governance",
  platform: "Platform",
  unknown: "Unknown",
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
  gridTemplateColumns: "minmax(240px,2.2fr) minmax(128px,0.95fr) minmax(150px,1.1fr) 128px 116px 112px 92px",
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
  if (item.promisedBenefitLoaded) return formatUsdM(item.promisedUsd);
  return item.sourcePlan?.yearlyBenefitLowUsd != null
    ? formatUsdM(item.sourcePlan.yearlyBenefitLowUsd)
    : "Not loaded";
}

function financeActualLabel(item: TowerAiView): string {
  if (item.financeValidatedAmountLoaded === true) return formatUsdM(item.financeValidatedUsd);
  const hasValidationRecord =
    /validat/i.test(item.financeStatus ?? "") ||
    item.financeApprovalEvents.some((event) =>
      /validat/i.test(`${event.eventType ?? ""} ${event.approvalState ?? ""}`),
    ) ||
    item.valueObservationMonths.some((month) =>
      /validat/i.test(month.validationState ?? ""),
    );
  return hasValidationRecord ? "Amount not verified" : "Not loaded";
}

function sortValue(item: TowerAiView, key: SortKey): number | string {
  if (key === "name") return item.name;
  if (key === "valueType") return expectedBenefitKindLabel(item.expectedValueArchetype) ?? item.businessValueType ?? "";
  if (key === "constraint") return item.gatingConstraint ?? "";
  if (key === "investment") return item.aiAmountBasis === "approved_funding" ? item.aiSpendUsd : item.sourcePlan?.fundingUsd ?? -1;
  if (key === "value") return item.promisedBenefitLoaded ? item.promisedUsd : item.sourcePlan?.yearlyBenefitLowUsd ?? -1;
  return item.financeValidatedAmountLoaded === true ? item.financeValidatedUsd : -1;
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
  const cases = useMemo(
    () => view.allInitiatives.filter(isBusinessCase),
    [view.allInitiatives],
  );
  const hasSourcePlans = cases.some((item) => item.sourcePlan != null);
  const chips: FilterKey[] = [
    "all",
    ...(["funded", "embedded", "platform", "governance", "candidate", "unknown"] as TowerAiKind[])
      .filter((kind) => cases.some((item) => item.kind === kind)),
  ];
  const rows = useMemo(() => {
    return [...cases]
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
  }, [cases, desc, filter, sort]);

  function updateSort(next: SortKey) {
    if (next === sort) setDesc((current) => !current);
    else {
      setSort(next);
      setDesc(
        next !== "name" && next !== "valueType" && next !== "constraint",
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
          {rows.length} of {cases.length} shown
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--canon-gray-700)" }}>
        {hasSourcePlans
          ? "This synthetic source records case funding plans, yearly benefit estimates, and projected ROI. They are proposals, not approved spend or achieved savings. Open a case to inspect its source and evidence."
          : "Expected benefit kind describes what the source says a case aims to improve. It does not show an approved amount, a measured result, or a benefit cleared by Finance. The funding group is Tower's display grouping from intake labels; it is not proof of approved funding."}
      </p>

      <div style={{ background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)" }}>
        <div style={HEADER}>
          {[
            ["name", "Initiative"],
            ["valueType", "Expected benefit kind (plan)"],
            ["constraint", "Constraint"],
            ["investment", hasSourcePlans ? "Case funding plan" : "Approved AI funding"],
            ["value", hasSourcePlans ? "Yearly benefit plan / ROI" : "Projected yearly benefit"],
            ["claimable", "Finance validated in loaded months"],
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
                {item.id} · Source Finance status: {statusLabel(item)}
              </span>
            </span>
            <span style={{ color: "var(--canon-gray-700)", minWidth: 0, display: "grid", gap: 4 }}>
              <span>{expectedBenefitKindLabel(item.expectedValueArchetype) ?? "Not recorded in intake"}</span>
              {item.businessValueType ? (
                <small style={{ color: "var(--canon-gray-500)" }}>
                  Recorded value category: <span>{humanize(item.businessValueType)}</span>
                </small>
              ) : null}
            </span>
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
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
              {item.aiAmountBasis === "approved_funding" ? formatUsdM(item.aiSpendUsd) :
                item.sourcePlan?.fundingUsd != null ? formatUsdM(item.sourcePlan.fundingUsd) : "Not verified"}
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right", display: "grid", gap: 3 }}>
              <span>{valueLabel(item)}</span>
              {item.sourcePlan?.roiLowMultiple != null ? (
                <small style={{ color: "var(--canon-gray-500)" }}>
                  projected {item.sourcePlan.roiLowMultiple.toFixed(1)}x
                  {item.sourcePlan.roiHighMultiple != null ? `–${item.sourcePlan.roiHighMultiple.toFixed(1)}x` : ""}
                </small>
              ) : null}
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right", color: item.financeValidatedAmountLoaded === true && item.financeValidatedUsd > 0 ? "var(--canon-teal-dark)" : "var(--canon-gray-500)" }}>
              {financeActualLabel(item)}
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
        Case and tool counts use declared page and canonical object identity. {unclassifiedPortfolioCount(view.allInitiatives)}{" "}
        rows lack that identity and remain unclassified. Tool rollouts are shown on the Tools tab.
        Readiness is not used as a proxy for outcome.
        Loaded readiness: {cases.filter((item) => item.readinessScoreLoaded).length} cases.
      </p>
    </section>
  );
}
