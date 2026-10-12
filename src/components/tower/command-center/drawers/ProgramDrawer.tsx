"use client";

// The program drawer — opened from any program row, lane card or heatmap point.
// Transcribed from `progDrawer()` (design line ~1096).
//
// Structure: eyebrow → serif title → "In plain terms" → 4-up stat grid → the
// value proof chain (five rows, each with a one-line definition) → usage &
// adoption evidence bars → owner / function / next gate → "The read" with its
// cited source file → footer.

import { formatPct, formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerProgramView } from "@/lib/tower/command-center/types";

import { Dot, LANE_TONE, LANE_WORD, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";
import {
  DrawerRow,
  DrawerSection,
  DrawerShell,
  DrawerStat,
} from "./DrawerShell";
import { sourceFieldLabel, sourceFieldNote } from "./sourceFieldCopy";

const EYEBROW_TONE = {
  teal: "eTeal",
  amber: "eAmber",
  red: "eRed",
  gray: "eGray",
  blue: "eTeal",
} as const;

const PLAIN_TONE = {
  teal: "pTeal",
  amber: "pAmber",
  red: "pRed",
  gray: "pGray",
  blue: "pGray",
} as const;

/**
 * The "in plain terms" sentence.
 *
 * Assembled from the program's own governed figures and its mart-written
 * decision rationale. Every number in it is a value the drawer also shows
 * numerically — the sentence restates, it never introduces.
 */
export function plainProgram(p: TowerProgramView): string {
  if (!p.promisedBenefitLoaded) {
    const gate = p.nextGate ? ` The next unlock is ${p.nextGate}.` : "";
    const funding = p.fundingAmountLoaded === false
      ? "Approved FY26 funding is not verified."
      : `${formatUsdM(p.fundedUsd)} is approved FY26 funding.`;
    return `${funding} A projected direct benefit is not loaded, so Tower cannot count one here.${gate}`;
  }
  if (p.promisedUsd <= 0) {
    return "This case records $0 in projected direct benefit. It may help other cases, but that link is not recorded here, so no downstream benefit is assigned to it.";
  }
  const claim =
    p.claimableAmountLoaded !== true
      ? "A reportable amount is not verified"
      : p.claimableUsd > 0
        ? `The source marks ${formatUsdM(p.claimableUsd)} reportable in the loaded months; approval evidence still needs checking`
        : "The source records no reportable amount in the loaded months";
  const because = p.blocker
    ? ` — because ${p.blocker.charAt(0).toLowerCase()}${p.blocker.slice(1).replace(/\.$/, "")}`
    : "";
  const gate = p.nextGate ? ` The next unlock is ${p.nextGate}.` : "";
  return `This case projects ${formatUsdM(p.promisedUsd)} in yearly benefit. ${claim.charAt(0).toUpperCase()}${claim.slice(1)}${because}. Its decision status is ${LANE_WORD[p.lane]}.${gate}`;
}

export function ProgramDrawer({
  program,
  onClose,
  onSeeAction,
}: {
  program: TowerProgramView | null;
  onClose: () => void;
  onSeeAction: () => void;
}) {
  const open = program !== null;
  const p = program;
  const tone = p ? LANE_TONE[p.lane] : "gray";

  const chain = p
    ? ([
        [
          "Projected yearly benefit",
          p.promisedBenefitLoaded ? p.promisedUsd : null,
          "",
          "the benefit estimated for this case, not an earned result",
        ],
        [
          "Value measured from use",
          p.usageSupportedValueMeasured ? p.usageSupportedUsd : null,
          p.usageSupportedValueMeasured && p.usageSupportedUsd > 0
            ? "teal"
            : "",
          p.usageSupportedValueMeasured
            ? "backed by recorded adoption / usage evidence"
            : "no independent usage value measurement recorded",
        ],
        [
          "Finance review",
          p.financeValidatedAmountLoaded === true ? p.financeValidatedUsd : null,
          p.financeValidatedAmountLoaded === true && p.financeValidatedUsd > 0 ? "teal" : "",
          p.financeValidatedAmountLoaded === true
            ? "the source lists this as Finance-reviewed; check approval evidence and period"
            : "Finance confirmation and amount are not verified here",
        ],
        [
          "Reporting clearance",
          p.claimableAmountLoaded === true ? p.claimableUsd : null,
          p.claimableAmountLoaded === true && p.claimableUsd > 0 ? "teal" : "",
          p.claimableAmountLoaded === true
            ? "the source marks this amount reportable for loaded months; check approval evidence"
            : "Reporting clearance and amount are not verified here",
        ],
        [
          "Amount still under review",
          p.blockedValueComparable ? p.blockedUsd : null,
          "red",
          p.blockedValueComparable
            ? "a comparable amount remains under review"
            : "a yearly estimate cannot be subtracted from loaded-month results",
        ],
      ] as const)
    : [];

  const chainColor = (tint: string) =>
    tint === "teal"
      ? "var(--canon-teal-dark)"
      : tint === "red"
        ? "var(--canon-red)"
        : "var(--canon-gray-900)";

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      eyebrowTone={EYEBROW_TONE[tone]}
      eyebrow={p ? `Program · ${p.id} · ${LANE_WORD[p.lane]}` : ""}
      title={p?.name ?? ""}
      footer={
        <>
          <span className={styles.drTrust}>
            <Dot tone={tone} />
            {p
              ? `${LANE_WORD[p.lane]} · ${p.blocker ?? "No decision rationale recorded"}`
              : ""}
          </span>
          <button type="button" className={styles.btn} onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className={cx(styles.btn, styles.primary)}
            onClick={onSeeAction}
          >
            See the action
          </button>
        </>
      }
    >
      {p ? (
        <>
          <div className={cx(styles.drPlain, styles[PLAIN_TONE[tone]])}>
            <div className={styles.pk}>In plain terms</div>
            <p className={styles.pt}>{plainProgram(p)}</p>
          </div>

          <div className={styles.drGrid}>
            <DrawerStat label="Approved FY26 funding" value={p.fundingAmountLoaded === false ? "Not verified" : formatUsdM(p.fundedUsd)} />
            <DrawerStat
              label="Projected direct benefit"
              value={
                p.promisedBenefitLoaded
                  ? formatUsdM(p.promisedUsd)
                  : "Not loaded"
              }
            />
            <DrawerStat
              label="Finance review amount"
              value={p.financeValidatedAmountLoaded === true ? formatUsdM(p.financeValidatedUsd) : "Not verified"}
              small
              tone={p.financeValidatedAmountLoaded === true && p.financeValidatedUsd > 0 ? "vTeal" : undefined}
            />
            <DrawerStat
              label="Reportable in loaded months"
              value={p.claimableAmountLoaded === true ? formatUsdM(p.claimableUsd) : "Not verified"}
              small
              tone={p.claimableAmountLoaded === true ? p.claimableUsd > 0 ? "vTeal" : "vRed" : undefined}
            />
          </div>

          <DrawerSection>Budget stated in the source plan</DrawerSection>
          <DrawerRow
            label="Program planning budget"
            value={p.planningBudgetUsd === null || p.planningBudgetUsd === undefined
              ? "Not recorded"
              : formatUsdM(p.planningBudgetUsd)}
            sub="The source lists this planning amount. Its fiscal year and approval are not verified, so it is separate from approved FY26 funding."
          />

          <DrawerSection note={p.blockedValueComparable
            ? "— how a projected benefit moves toward an amount that can be reported"
            : "— the yearly plan and loaded-month results cover different periods; do not subtract them"}>
            Steps to report a benefit
          </DrawerSection>
          {chain.map(([label, value, tint, definition]) => (
            <DrawerRow
              key={label}
              label={label}
              sub={definition}
              value={
                label === "Finance review" && p.financeValidatedAmountLoaded !== true
                  ? "Not verified"
                  : label === "Reporting clearance" && p.claimableAmountLoaded !== true
                    ? "Not verified"
                  : label === "Value measured from use" && !p.usageSupportedValueMeasured
                  ? "Not measured"
                  : label === "Amount still under review" && !p.blockedValueComparable
                    ? "Not comparable"
                  : value === null
                    ? "No amount recorded"
                  : formatUsdM(value)
              }
              valueColor={chainColor(tint)}
            />
          ))}

          <DrawerSection>Usage &amp; adoption evidence</DrawerSection>
          {p.usageMetric || p.adoptionRatePct !== null ? (
            <>
              {p.usageMetric ? (
                <div className={styles.urow}>
                  <div className={styles.ut}>
                    <span className={styles.un}>{p.usageMetric}</span>
                    <span className={styles.uv}>
                      {p.usageActual === null
                        ? "Not recorded"
                        : p.usageActual.toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
              ) : null}
              {p.adoptionRatePct !== null ? (
                <div className={styles.urow}>
                  <div className={styles.ut}>
                    <span className={styles.un}>Adoption</span>
                    <span className={styles.uv}>
                      {formatPct(p.adoptionRatePct)}
                    </span>
                  </div>
                  <div className={styles.ubar}>
                    <i
                      style={{
                        width: `${Math.max(0, Math.min(100, p.adoptionRatePct))}%`,
                        background:
                          p.adoptionRatePct >= 60
                            ? "var(--canon-teal)"
                            : p.adoptionRatePct >= 25
                              ? "var(--canon-amber)"
                              : "var(--canon-red)",
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.urow}>
              <div className={styles.ut}>
                <span className={styles.un}>Usage evidence</span>
                <span
                  className={styles.uv}
                  style={{ color: "var(--canon-gray-500)" }}
                >
                  Not measured
                </span>
              </div>
              <p className={styles.us}>
                No independent usage measurement is recorded for this program.
                Tower cannot call its value usage-supported until that proof is linked.
              </p>
            </div>
          )}

          <DrawerSection>Owner &amp; next gate</DrawerSection>
          <DrawerRow label="Owner" value={p.ownerRole ?? "Not recorded"} />
          {p.technologyOwnerRole ? (
            <DrawerRow label="Technology owner" value={p.technologyOwnerRole} />
          ) : null}
          {p.sourceProgramStatus || p.sourceProgramPhase ? (
            <>
              <DrawerRow
                label="Status reported in intake"
                value={p.sourceProgramStatus
                  ? sourceFieldLabel("programStatus", p.sourceProgramStatus)
                  : "Not recorded"}
                sub={p.sourceProgramStatus
                  ? sourceFieldNote(p.sourceProgramStatus, "This is the source's status, not a Finance or delivery check.")
                  : undefined}
              />
              <DrawerRow
                label="Work stage reported in intake"
                value={p.sourceProgramPhase
                  ? sourceFieldLabel("programPhase", p.sourceProgramPhase)
                  : "Not recorded"}
                sub={p.sourceProgramPhase
                  ? sourceFieldNote(p.sourceProgramPhase, "This describes the planned or reported stage; it does not prove a gate passed.")
                  : undefined}
              />
              <DrawerRow
                label="Affected work areas"
                value={p.affectedFunctions?.length
                  ? p.affectedFunctions.map((item) => item.functionName).join(", ")
                  : "No work area linked in intake"}
                sub="Source-linked work areas; these are not funding categories."
              />
            </>
          ) : null}
          <DrawerRow
            label="Finance owner"
            value={p.financeOwnerRole ?? "Not recorded"}
          />
          <DrawerRow
            label="Next gate"
            value={p.nextGate ?? "No gate recorded in the value model"}
          />

          <DrawerSection>The read</DrawerSection>
          <div className={styles.efact}>
            <p className={styles.es}>
              {p.note ?? "No caveat recorded for this program."}
            </p>
            <div className={styles.eloc}>
              <span className={styles.file}>
                {p.sourceFile ?? "source file not recorded"}
              </span>{" "}
              · {p.id}
            </div>
          </div>
        </>
      ) : null}
    </DrawerShell>
  );
}
