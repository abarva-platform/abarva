"use client";

// The AI capability drawer — opened from a bubble point or inventory row.
// Transcribed from `aiDrawer()` (design line ~1139).

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerAiView } from "@/lib/tower/command-center/types";

import { AI_KIND_WORD, Dot, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";
import {
  DrawerRow,
  DrawerSection,
  DrawerShell,
  DrawerStat,
} from "./DrawerShell";

const KIND_LABEL: Record<TowerAiView["kind"], string> = {
  funded: "Funded program",
  embedded: "Embedded platform spend",
  candidate: "Candidate idea",
  governance: "Governance",
  platform: "Platform",
};

/**
 * The "in plain terms" sentence for an AI item. Definitions are fixed per spend
 * type — they explain the *category*, which is a stable product concept, not a
 * claim about this tenant.
 */
export function plainAi(a: TowerAiView): string {
  const definition: Record<TowerAiView["kind"], string> = {
    funded: "a real, funded program with its own budget and approvals",
    embedded:
      "value delivered inside a platform you already pay for — not new AI spend",
    candidate: "a candidate idea, not approved spend",
    governance:
      "a control that unblocks other AI, not a value generator on its own",
    platform: "shared platform consumption spread across many teams",
  };
  return `This is ${definition[a.kind]}. Recommended posture: ${a.posture}.`;
}

export function AiInitiativeDrawer({
  item,
  onClose,
}: {
  item: TowerAiView | null;
  onClose: () => void;
}) {
  const open = item !== null;
  const a = item;
  const plainTone =
    a?.kind === "funded"
      ? "pTeal"
      : a?.kind === "governance"
        ? "pAmber"
        : "pGray";

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      eyebrow={a ? `AI capability ${a.n} · ${KIND_LABEL[a.kind]}` : ""}
      title={a?.name ?? ""}
      footer={
        <>
          <span className={styles.drTrust}>
            <Dot tone={a && a.readinessScore >= 60 ? "teal" : "amber"} />
            {a?.posture ?? ""}
          </span>
          <button type="button" className={styles.btn} onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      {a ? (
        <>
          <div className={styles.drGrid}>
            <DrawerStat label="AI spend" value={formatUsdM(a.aiSpendUsd)} />
            <DrawerStat label="Recommended posture" value={a.posture} small />
            <DrawerStat
              label="Value potential"
              value={`${a.valueScore}/100`}
              small
              tone="vTeal"
            />
            <DrawerStat
              label="Readiness"
              value={`${a.readinessScore}/100`}
              small
              tone={a.readinessScore >= 60 ? "vTeal" : "vAmber"}
            />
          </div>

          <div className={cx(styles.drPlain, styles[plainTone])}>
            <div className={styles.pk}>In plain terms</div>
            <p className={styles.pt}>{plainAi(a)}</p>
          </div>

          {/*
            Where the case sits, and what stopped it. The approved design leads its drill-down
            with these before any money, because a reader's first question about a case is not how
            large it is but why it has not moved.
          */}
          <DrawerSection>Where this sits</DrawerSection>
          <DrawerRow label="Project" value={a.projectName ?? "Not recorded"} />
          <DrawerRow
            label="Lifecycle stage"
            value={a.lifecycleStage ?? "Not recorded"}
          />
          <DrawerRow
            label="Stopped at"
            value={a.gatingConstraint ?? "Not recorded"}
          />
          <DrawerRow
            label="Operating metric"
            value={a.successMetric ?? "Not recorded"}
          />
          <DrawerRow
            label="Payback target"
            value={
              a.paybackMonthsTarget === null
                ? "Not recorded"
                : `${formatCount(a.paybackMonthsTarget)} months`
            }
          />

          <DrawerSection>Who answers for it</DrawerSection>
          <DrawerRow label="Sponsor" value={a.sponsorRole ?? "Not recorded"} />
          <DrawerRow
            label="Finance partner"
            value={a.financePartnerRole ?? "Not recorded"}
          />

          {/*
            The waterfall by month, not just its total. A single "finance validated $0" says the
            claim has not landed; the sequence says whether it is moving. Months are rendered as
            the source recorded them, and a case with no observations says so rather than
            drawing an empty chart frame.
          */}
          <DrawerSection>What the claim did, month by month</DrawerSection>
          {a.valueObservationMonths.length === 0 ? (
            <div className={styles.urow}>
              No monthly value observations are recorded for this case. That is a
              measurement gap, not evidence that the claim did not move.
            </div>
          ) : (
            <>
              {a.valueObservationMonths.slice(-4).map((m) => (
                <DrawerRow
                  key={m.month}
                  label={m.month}
                  value={`${formatUsdM(m.sponsorClaimedUsd)} claimed · ${formatUsdM(
                    m.financeReviewedUsd,
                  )} reviewed · ${formatUsdM(m.financeValidatedUsd)} validated${
                    m.validationState === null ? "" : ` · ${m.validationState}`
                  }`}
                />
              ))}
              <DrawerRow
                label="Observations on file"
                value={`${formatCount(a.valueObservationMonths.length)} months`}
              />
            </>
          )}

          <DrawerSection>Vendor &amp; system</DrawerSection>
          <DrawerRow label="Vendor" value={a.vendor ?? "Not recorded"} />
          <DrawerRow label="System" value={a.system ?? "Not recorded"} />
          <DrawerRow label="Spend type" value={AI_KIND_WORD[a.kind]} />
          <DrawerRow label="Category" value={a.category ?? "Not recorded"} />
          <DrawerRow
            label="Explicit source-backed benefit"
            value={
              a.promisedBenefitLoaded ? formatUsdM(a.promisedUsd) : "Not loaded"
            }
          />
          <DrawerRow
            label="Finance-validated"
            value={formatUsdM(a.financeValidatedUsd)}
          />

          <DrawerSection>Usage &amp; adoption evidence</DrawerSection>
          {a.usageBars.length === 0 ? (
            <div className={styles.urow}>
              <div className={styles.ut}>
                <span className={styles.un}>Usage evidence</span>
                <span
                  className={styles.uv}
                  style={{ color: "var(--canon-gray-500)" }}
                >
                  Thin
                </span>
              </div>
              <p className={styles.us}>
                No usage-linked measurement is recorded for this capability. Its
                value cannot be usage-supported until one exists.
              </p>
            </div>
          ) : (
            <div className={styles.usageGroup}>
              {a.usageHeadline ? (
                <div className={styles.usageGroupHead}>
                  {a.usageHeadline}
                  {a.vendor ? ` · ${a.vendor}` : ""}
                </div>
              ) : null}
              {a.usageBars.map((bar) => (
                <div key={bar.label} className={styles.urow}>
                  <div className={styles.ut}>
                    <span className={styles.un}>{bar.label}</span>
                    <span className={styles.uv}>{bar.valueText}</span>
                  </div>
                  <div className={styles.ubar}>
                    <i
                      style={{
                        width: `${bar.pct}%`,
                        background:
                          bar.tone === "teal"
                            ? "var(--canon-teal)"
                            : bar.tone === "amber"
                              ? "var(--canon-amber)"
                              : "var(--canon-red)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <DrawerSection>The read</DrawerSection>
          <div className={styles.efact}>
            <p className={styles.es}>
              {a.note ?? "No caveat recorded for this capability."}
            </p>
            <div className={styles.eloc}>
              <span className={styles.file}>
                {a.sourceFile ?? "source file not recorded"}
              </span>{" "}
              · usage feed
            </div>
          </div>
        </>
      ) : null}
    </DrawerShell>
  );
}
