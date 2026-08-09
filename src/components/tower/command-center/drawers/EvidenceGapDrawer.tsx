"use client";

// The evidence-gap drawer — opened from a gap row on the Evidence tab.
// Transcribed from `gapDrawer()` (design line ~1163).

import type { TowerEvidenceGapView } from "@/lib/tower/command-center/types";
import { formatUsdM } from "@/lib/tower/command-center/format";

import { Dot, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";
import { DrawerSection, DrawerShell, DrawerStat } from "./DrawerShell";

export function EvidenceGapDrawer({
  gap,
  onClose,
  onRouteToAction,
}: {
  gap: TowerEvidenceGapView | null;
  onClose: () => void;
  onRouteToAction: () => void;
}) {
  const open = gap !== null;
  const high = gap?.priority === "high";

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      eyebrowTone={high ? "eRed" : "eAmber"}
      eyebrow={gap ? `Evidence gap · ${gap.area}` : ""}
      title={gap?.missing ?? ""}
      footer={
        <>
          <span className={styles.drTrust}>
            <Dot tone={high ? "red" : "amber"} />
            {gap ? `Blocks: ${gap.blockedDecision}` : ""}
          </span>
          <button type="button" className={styles.btn} onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className={cx(styles.btn, styles.primary)}
            onClick={onRouteToAction}
          >
            Route to action
          </button>
        </>
      }
    >
      {gap ? (
        <>
          <div className={styles.drGrid}>
            <DrawerStat
              label="Owner"
              value={gap.owner ?? "Not recorded"}
              small
            />
            <DrawerStat
              label="Priority"
              value={
                gap.priority.charAt(0).toUpperCase() + gap.priority.slice(1)
              }
              small
              tone={high ? "vRed" : "vAmber"}
            />
            <DrawerStat
              label="Linked program"
              value={gap.linkedProgram ?? "Not linked"}
              small
            />
            <DrawerStat
              label="Blocking"
              value={gap.blocking ? "Yes" : "No"}
              small
              tone={gap.blocking ? "vRed" : undefined}
            />
            <DrawerStat
              label="Promised exposed"
              value={formatUsdM(gap.promisedValueExposedUsd)}
              small
              tone={gap.promisedValueExposedUsd > 0 ? "vRed" : undefined}
            />
            <DrawerStat
              label="Validated held"
              value={formatUsdM(gap.validatedValueHeldUsd)}
              small
              tone={gap.validatedValueHeldUsd > 0 ? "vAmber" : undefined}
            />
          </div>

          <DrawerSection>Why it matters</DrawerSection>
          <p className={styles.recBox}>{gap.why}</p>

          <DrawerSection>Decision blocked until it arrives</DrawerSection>
          <p className={styles.recBox}>
            <b>{gap.blockedDecision}</b>
          </p>

          <DrawerSection>Audit trace</DrawerSection>
          <div className={styles.efact}>
            <p className={styles.es}>
              {gap.kind === "pipeline"
                ? `Recorded by the Tower value model as a required-field gap on ${gap.area.toLowerCase()}.`
                : `Derived by the Tower business-evidence bridge as ${gap.primaryBlockingGap ? "the primary blocker" : "an additional open proof gap"} for this program.`}
            </p>
            <div className={styles.eloc}>
              <span className={styles.file}>
                {gap.sourceTemplate ?? "source template not recorded"}
              </span>{" "}
              · owner {gap.owner ?? "unassigned"} · severity {gap.priority} ·
              policy {gap.gapPolicyVersion}
            </div>
          </div>
        </>
      ) : null}
    </DrawerShell>
  );
}
