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
    return `${formatUsdM(p.fundedUsd)} is approved investment. Explicit promised benefit is not loaded, so Tower does not convert this program into a board value claim yet.${gate}`;
  }
  if (p.promisedUsd <= 0) {
    return "No explicit benefit is promised here. It matters for investment posture and proof follow-up, not the economic benefit total.";
  }
  const claim =
    p.claimableUsd > 0
      ? `${formatUsdM(p.claimableUsd)} of it is claimable today`
      : "none of it is claimable yet";
  const because = p.blocker
    ? ` — because ${p.blocker.charAt(0).toLowerCase()}${p.blocker.slice(1).replace(/\.$/, "")}`
    : "";
  const gate = p.nextGate ? ` The next unlock is ${p.nextGate}.` : "";
  return `Of ${formatUsdM(p.promisedUsd)} in promised benefit, ${claim}${because}. It sits in the ${LANE_WORD[p.lane]} lane.${gate}`;
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
          "Explicit benefit",
          p.promisedBenefitLoaded ? p.promisedUsd : null,
          "",
          "source-backed business-case benefit",
        ],
        [
          "Usage-supported",
          p.usageSupportedUsd,
          p.usageSupportedUsd > 0 ? "teal" : "red",
          "backed by real adoption / usage evidence",
        ],
        [
          "Finance-validated",
          p.financeValidatedUsd,
          p.financeValidatedUsd > 0 ? "teal" : "red",
          "Finance has signed the measurement method",
        ],
        [
          "Claimable",
          p.claimableUsd,
          p.claimableUsd > 0 ? "teal" : "red",
          "cleared by the Tower claim gate",
        ],
        [
          "Blocked",
          p.promisedBenefitLoaded ? p.blockedUsd : null,
          "red",
          "benefit that cannot be claimed yet",
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
            <DrawerStat label="Funded" value={formatUsdM(p.fundedUsd)} />
            <DrawerStat
              label="Explicit benefit"
              value={
                p.promisedBenefitLoaded
                  ? formatUsdM(p.promisedUsd)
                  : "Not loaded"
              }
            />
            <DrawerStat
              label="Finance-validated"
              value={formatUsdM(p.financeValidatedUsd)}
              small
              tone={p.financeValidatedUsd > 0 ? "vTeal" : undefined}
            />
            <DrawerStat
              label="Claimable"
              value={formatUsdM(p.claimableUsd)}
              small
              tone={p.claimableUsd > 0 ? "vTeal" : "vRed"}
            />
          </div>

          <DrawerSection note="— where explicit benefit moves on the way to claimable">
            Value proof chain
          </DrawerSection>
          {chain.map(([label, value, tint, definition]) => (
            <DrawerRow
              key={label}
              label={label}
              sub={definition}
              value={formatUsdM(value)}
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
                  Thin
                </span>
              </div>
              <p className={styles.us}>
                No usage-linked measurement is in place for this program yet.
                That absence is the reason value is not claimable.
              </p>
            </div>
          )}

          <DrawerSection>Owner &amp; next gate</DrawerSection>
          <DrawerRow label="Owner" value={p.ownerRole ?? "Not recorded"} />
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
