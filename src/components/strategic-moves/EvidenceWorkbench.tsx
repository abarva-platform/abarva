"use client";

// EvidenceWorkbench — the P2–P5 phase surface. Evidence explorer (left),
// action-led "to advance" list + capture (center), selected-evidence detail
// (right). Purely presentational: it renders the props it is given and calls the
// callbacks it is given. The parent (CharterWorkflow) maps real move data +
// actions onto these props and passes the existing capture UI as `captureSlot`.

import type { ReactNode } from "react";
import styles from "./EvidenceWorkbench.module.css";
import { PhaseRail } from "./PhaseRail";

export type WorkbenchEvidenceStatus =
  | "missing"
  | "partial"
  | "covered"
  | "waived"
  | "not_applicable";

export interface WorkbenchEvidenceRow {
  id: string;
  name: string;
  status: WorkbenchEvidenceStatus;
  statusLabel: string;
}
export interface WorkbenchEvidenceGroup {
  key: string;
  label: string;
  rows: WorkbenchEvidenceRow[];
}
export interface WorkbenchGateStep {
  id: string;
  label: string;
  done: boolean;
  hard: boolean;
  action?: {
    label: string;
    onClick: () => void;
    kind: "primary" | "ghost";
    disabled?: boolean;
    /** Shown next to a disabled action — the critical thing left to enable it. */
    reason?: string;
  };
}
export interface WorkbenchDiagnosisRow {
  name: string;
  value: string;
  source?: string;
  tone?: "normal" | "need";
}
export interface WorkbenchEvidenceDetail {
  name: string;
  status: WorkbenchEvidenceStatus;
  statusLabel: string;
  whyItMatters?: string;
  nextAction?: string;
  acceptedFormats?: string[];
  evidenceTitles?: string[];
  lineage: Array<{ label: string; meta?: string; done: boolean }>;
}
export interface EvidenceWorkbenchProps {
  moveName: string;
  displayCode: string;
  tenantName: string;
  sponsorLine: string;
  phaseNum: number;
  phaseLabel: string;
  statusColor: "green" | "amber" | "red" | "teal";
  evidenceGroups: WorkbenchEvidenceGroup[];
  evidenceReadyLabel: string;
  /** 0–100, live: share of required evidence that is covered/waived. */
  evidencePct: number;
  /** 0–100, live: share of gate criteria met (the phase-completion signal). */
  gatePct: number;
  selectedEvidenceId: string | null;
  onSelectEvidence: (id: string) => void;
  onAddEvidence: () => void;
  gateHeading: string;
  gateSubhead: string;
  gateProgressLabel: string;
  gateSteps: WorkbenchGateStep[];
  advance: { label: string; onClick: () => void; disabled: boolean; note: string } | null;
  diagnosisTitle: string;
  diagnosis: WorkbenchDiagnosisRow[];
  errorText?: string | null;
  detail: WorkbenchEvidenceDetail | null;
  onOpenEvidenceFile: () => void;
  onAskAvaAboutSelected: () => void;
  onViewDossier: () => void;
  /** Existing capture UI, embedded in the center so capture still works. */
  captureSlot?: ReactNode;
}

const DOT: Record<Exclude<WorkbenchEvidenceStatus, "not_applicable">, string> = {
  missing: styles.dMissing,
  partial: styles.dPartial,
  covered: styles.dCovered,
  waived: styles.dWaived,
};
const TXT: Record<Exclude<WorkbenchEvidenceStatus, "not_applicable">, string> = {
  missing: styles.tMissing,
  partial: styles.tPartial,
  covered: styles.tCovered,
  waived: styles.tWaived,
};
const CHIP: Record<Exclude<WorkbenchEvidenceStatus, "not_applicable">, string> = {
  missing: styles.cMissing,
  partial: styles.cPartial,
  covered: styles.cCovered,
  waived: styles.cWaived,
};

function safeStatus(
  s: WorkbenchEvidenceStatus,
): Exclude<WorkbenchEvidenceStatus, "not_applicable"> {
  return s === "not_applicable" ? "missing" : s;
}

/** A live progress meter: a filled track + the % value. */
function Meter({ pct, label }: { pct: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className={styles.meter}>
      {label ? <span className={styles.meterLbl}>{label}</span> : null}
      <div className={styles.meterTrack}>
        <div className={styles.meterFill} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`${styles.meterPct} ${styles.num}`}>{clamped}%</span>
    </div>
  );
}

export function EvidenceWorkbench(props: EvidenceWorkbenchProps) {
  const {
    moveName,
    displayCode,
    tenantName,
    sponsorLine,
    phaseNum,
    statusColor,
    evidenceGroups,
    evidenceReadyLabel,
    evidencePct,
    gatePct,
    selectedEvidenceId,
    onSelectEvidence,
    onAddEvidence,
    gateHeading,
    gateSubhead,
    gateProgressLabel,
    gateSteps,
    advance,
    diagnosisTitle,
    diagnosis,
    errorText,
    detail,
    onOpenEvidenceFile,
    onAskAvaAboutSelected,
    onViewDossier,
    captureSlot,
  } = props;

  return (
    <div className={styles.wb} id={`ws-workbench-p${phaseNum}`}>
      {/* header */}
      <div className={styles.topbar}>
        <div className={styles.crumbs}>
          <span>Strategic Moves</span>
          <span className={styles.sep}>›</span>
          <span>{tenantName}</span>
          <span className={styles.sep}>›</span>
          <span>{displayCode}</span>
        </div>
        <div className={styles.titleRow}>
          <div>
            <h1>{moveName}</h1>
            <div className={styles.sponsor}>{sponsorLine}</div>
          </div>
          <button type="button" className={`${styles.btnLine} ${styles.btnSm}`} onClick={onViewDossier}>
            View dossier
          </button>
        </div>
        <div className={styles.railWrap}>
          <PhaseRail current={phaseNum} status={statusColor} />
        </div>
        <div className={styles.phaseProgress}>
          <Meter pct={gatePct} label="Phase complete" />
        </div>
      </div>

      <div className={styles.grid}>
        {/* LEFT — evidence explorer */}
        <aside className={`${styles.col} ${styles.explorer}`}>
          <div className={styles.colHead}>
            <span className={styles.lbl}>Evidence</span>
            <span className={`${styles.count} ${styles.num}`}>{evidenceReadyLabel}</span>
          </div>
          <div className={styles.evidenceProgress}>
            <Meter pct={evidencePct} />
          </div>

          {evidenceGroups.map((group) => (
            <div className={styles.grp} key={group.key}>
              <span className={`${styles.lbl} ${styles.grpLbl}`}>{group.label}</span>
              {group.rows
                .filter((row) => row.status !== "not_applicable")
                .map((row) => {
                  const st = safeStatus(row.status);
                  return (
                    <button
                      type="button"
                      key={row.id}
                      className={`${styles.erow} ${row.id === selectedEvidenceId ? styles.erowActive : ""}`}
                      onClick={() => onSelectEvidence(row.id)}
                    >
                      <span className={`${styles.sdot} ${DOT[st]}`} />
                      <span className={styles.ename}>{row.name}</span>
                      <span className={`${styles.est} ${TXT[st]}`}>{row.statusLabel}</span>
                    </button>
                  );
                })}
            </div>
          ))}

          <button type="button" className={`${styles.btnLine} ${styles.btnSm} ${styles.addEv}`} onClick={onAddEvidence}>
            + Add evidence
          </button>

          <div className={styles.legend}>
            <span className={styles.li}><span className={`${styles.sdot} ${styles.dMissing}`} /> Missing</span>
            <span className={styles.li}><span className={`${styles.sdot} ${styles.dPartial}`} /> Partial</span>
            <span className={styles.li}><span className={`${styles.sdot} ${styles.dCovered}`} /> Covered</span>
            <span className={styles.li}><span className={`${styles.sdot} ${styles.dWaived}`} /> Waived</span>
          </div>
        </aside>

        {/* CENTER — action list + capture / diagnosis */}
        <main className={styles.col}>
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div>
                <h2>{gateHeading}</h2>
                <div className={styles.sub}>{gateSubhead}</div>
              </div>
              <span className={`${styles.ready} ${styles.num}`}>{gateProgressLabel}</span>
            </div>

            <div className={styles.steps}>
              {gateSteps.map((step) => (
                <div className={`${styles.astep} ${step.done ? styles.astepDone : ""}`} key={step.id}>
                  <span
                    className={`${styles.ico} ${step.done ? styles.icoOk : step.hard ? styles.icoGap : styles.icoNow}`}
                  >
                    {step.done ? "✓" : step.hard ? "!" : "→"}
                  </span>
                  <div>
                    <div className={styles.aname}>{step.label}</div>
                  </div>
                  {step.done ? (
                    <span className={styles.doneTag}>Done</span>
                  ) : step.action ? (
                    <div className={styles.actWrap}>
                      <div className={styles.act}>
                        <button
                          type="button"
                          className={step.action.kind === "primary" ? `${styles.btn} ${styles.btnSm}` : `${styles.btnLine} ${styles.btnSm}`}
                          onClick={step.action.onClick}
                          disabled={step.action.disabled}
                        >
                          {step.action.label}
                        </button>
                      </div>
                      {step.action.disabled && step.action.reason ? (
                        <span className={styles.reason}>{step.action.reason}</span>
                      ) : null}
                    </div>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>

            {errorText ? <div className={styles.errRow}>{errorText}</div> : null}

            {advance ? (
              <div className={styles.advance}>
                <button type="button" className={styles.btn} onClick={advance.onClick} disabled={advance.disabled}>
                  {advance.label} →
                </button>
                <span className={styles.note}>{advance.note}</span>
              </div>
            ) : null}
          </div>

          {captureSlot ? (
            <div className={styles.captureSlot}>{captureSlot}</div>
          ) : diagnosis.length > 0 ? (
            <div className={styles.card}>
              <div className={styles.diagHd}>
                <h3>{diagnosisTitle}</h3>
                <span className={styles.sub}>each traced to its evidence</span>
              </div>
              <div className={styles.diag}>
                {diagnosis.map((row, i) => (
                  <div className={styles.frow} key={`${row.name}-${i}`}>
                    <div>
                      <div className={styles.fname}>{row.name}</div>
                      {row.source ? <div className={styles.fsrc}>{row.source}</div> : null}
                    </div>
                    <div className={`${styles.fval} ${styles.num} ${row.tone === "need" ? styles.fvalNeed : ""}`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </main>

        {/* RIGHT — selected evidence detail */}
        <aside className={`${styles.col} ${styles.detail}`}>
          <span className={styles.lbl}>Selected</span>
          {detail ? (
            <>
              <h3>{detail.name}</h3>
              <span className={`${styles.chip} ${CHIP[safeStatus(detail.status)]}`}>{detail.statusLabel}</span>

              <span className={styles.lbl}>Lineage</span>
              <div className={styles.lineage}>
                {detail.lineage.map((step, i) => (
                  <div className={styles.lstep} key={`${step.label}-${i}`}>
                    <span className={`${styles.ldot} ${step.done ? "" : styles.ldotTodo}`} />
                    <div>
                      <div className={`${styles.lname} ${step.done ? "" : styles.lnameTodo}`}>{step.label}</div>
                      {step.meta ? <div className={styles.lmeta}>{step.meta}</div> : null}
                    </div>
                  </div>
                ))}
              </div>

              <span className={styles.lbl}>Details</span>
              <div style={{ marginTop: 6 }}>
                {detail.whyItMatters ? (
                  <div className={styles.drow}>
                    <span className={styles.dk}>Why it matters</span>
                    <span className={styles.dv}>{detail.whyItMatters}</span>
                  </div>
                ) : null}
                {detail.nextAction ? (
                  <div className={styles.drow}>
                    <span className={styles.dk}>Next</span>
                    <span className={styles.dv}>{detail.nextAction}</span>
                  </div>
                ) : null}
                {detail.acceptedFormats && detail.acceptedFormats.length > 0 ? (
                  <div className={styles.drow}>
                    <span className={styles.dk}>Formats</span>
                    <span className={styles.dv}>{detail.acceptedFormats.join(", ")}</span>
                  </div>
                ) : null}
                {detail.evidenceTitles && detail.evidenceTitles.length > 0 ? (
                  <div className={styles.drow}>
                    <span className={styles.dk}>Files</span>
                    <span className={styles.dv}>{detail.evidenceTitles.join(", ")}</span>
                  </div>
                ) : null}
              </div>

              <div className={styles.dactions}>
                <button type="button" className={styles.btnLine} onClick={onOpenEvidenceFile}>
                  Open in File Cabinet
                </button>
                <button type="button" className={styles.btnLine} onClick={onAskAvaAboutSelected}>
                  Ask aVa about this
                </button>
              </div>
            </>
          ) : (
            <p className={styles.placeholder}>Select an evidence item to see its lineage.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
