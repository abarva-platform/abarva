"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { RomResult } from "@/lib/pricing/moves-workflow/rom-service";
import type { RangePolicyInputs } from "@/lib/pricing/effort-engine/types";
import type { PodRateBasis } from "@/lib/pricing/effort-engine/pod-pricer";
import {
  acceptReleases,
  addFoundation,
  addRelease,
  addUseCase,
  approveMapping,
  approveRomEstimate,
  buildRomStructure,
  confirmCounts,
  countedDrivers,
  emptyRomEstimate,
  formatAllocation,
  formatFactor,
  formatRomHours,
  formatRomMoney,
  formatRomWeeks,
  parseRomEstimate,
  provisionalSentence,
  releaseGroupingProblem,
  removeRelease,
  reopenCounts,
  reopenReleases,
  reopenRomApproval,
  resolveRomUnitHours,
  romEstimateNextAction,
  romProvisionalBecause,
  romReliedRegisterIds,
  romResultFigures,
  romRowStates,
  ROM_DRIVERS,
  ROM_DRIVER_LABELS,
  ROM_DRIVER_UNITS,
  serializeRomEstimate,
  setCount,
  setFactors,
  setPod,
  setUnitHoursRef,
  type RomCountBlock,
  type RomDriver,
  type RomEdit,
  type RomEstimate,
  type RomRegisterRow,
  type RomPodMember,
  type RomRowId,
  type RomUnitHoursState,
} from "@/lib/programs/rom-estimate";
import {
  applyRomNotesProposals,
  proposeRomCountsFromNotes,
} from "@/lib/programs/rom-estimate-notes";
import {
  MovesStepPage,
  SourceTag,
  StepRowView,
  type StepPagePhase,
  type StepPageRow,
  type StepPageStep,
} from "./MovesStepPage";
import type { StepAvaAction } from "./RootCausesStep";
import { useStepEvidence } from "./StepEvidence";
import styles from "./MovesStepPage.module.css";

/**
 * P3 Step 4, "Estimate the work bottom-up" (template v1.9). Count what gets
 * built, price it with a delivery pod and group it into releases. The page
 * edits the `rom_estimate` step record's INPUTS; every number in the
 * estimate comes from the ROM service through the read-only preview route,
 * so the page never sums, prices or rounds an estimate itself.
 *
 * Unit hours are references, never defaults: a register assumption supplies
 * a figure once it is confirmed or corrected (an open row's working figure
 * feeds only the provisional preview, and the page says so), or an approved
 * benchmark does. Approving stores the computed snapshot for P4.
 *
 * Blocked while P3 Step 2 is not done. Step 3 (operating & adoption) has no
 * step record yet, so it cannot block this step; the pod's owners are not
 * checked against it.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

const CONFIDENCE_WORD = { low: "Low", medium: "Medium", high: "High" };
const STATUS_WORD: Record<string, string> = {
  proposed: "Proposed",
  open: "Open",
  confirmed: "Confirmed",
  corrected: "Corrected",
  superseded: "Superseded",
  rejected: "Rejected",
};
const UNUSABLE_WORDS = {
  proposed: "is an aVa proposal nobody has accepted",
  superseded: "was superseded",
  rejected: "was rejected",
  missing: "is not in the register",
  no_value: "was answered without a number",
} as const;
const RATE_BASIS_LABELS: Record<PodRateBasis, string> = {
  loaded_cost: "Loaded cost",
  scarcity_adjusted_cost: "Scarcity-adjusted cost",
  bill_rate: "Bill rate",
};
const TIER_FIELDS = [
  ["scopeMaturity", "Scope maturity"],
  ["evidenceQuality", "Evidence quality"],
  ["deliveryNovelty", "Delivery novelty"],
  ["quantityUncertainty", "Quantity uncertainty"],
] as const;

export interface RomEstimateStepProps {
  moveId: string;
  canReviewEvidence: boolean;
  onEvidenceChanged?: () => void;
  moveName: string;
  clientDisplayName: string;
  syntheticNote?: string;
  phases: readonly StepPagePhase[];
  steps: readonly StepPageStep[];
  stepIndex: number;
  tabs?: ReactNode;
  /** The saved `rom_estimate` record. */
  value: string;
  onChange: (value: string) => void;
  /** P3 Step 2 is done: a direction is chosen, covered and confirmed. */
  step2Done: boolean;
  step2Href: string;
  /** Where the register answers a row. The register screen is not built yet. */
  registerAnswerHref: (registerId: string) => string;
  decidedBy: string;
  today: string;
  onBack?: () => void;
  onContinue?: () => void;
  frame?: (
    page: ReactNode,
    dock: { briefing: string; actions: StepAvaAction[]; notesPanel: ReactNode },
  ) => ReactNode;
}

type RegisterRead =
  | { status: "loading" }
  | {
      status: "ok";
      rows: RomRegisterRow[];
      figuresRedacted: boolean;
    }
  | { status: "error"; detail: string };

type PreviewRead = { key: string } & (
  | { status: "ok"; rom: RomResult }
  | { status: "refused" | "error"; detail: string }
);

type OpenForm =
  | { kind: "use-case"; name: string }
  | { kind: "unit-ref"; driver: RomDriver; registerId: string }
  | {
      kind: "pod";
      mode: "template" | "members";
      templateCode: string;
      membersText: string;
      locationCode: string;
      providerClassCode: string;
      rateBasis: PodRateBasis | "";
    }
  | {
      kind: "factors";
      friction: string;
      frictionSource: string;
      share: string;
      shareSource: string;
      week: string;
      weekSource: string;
    }
  | {
      kind: "release";
      name: string;
      useCaseCodes: string[];
      designStatus: "not_designed" | "designed";
      carriesFoundation: boolean;
      range: Partial<Record<(typeof TIER_FIELDS)[number][0], string>> & {
        coverage?: string;
      };
    };

function shortDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
}

function toRegisterRow(raw: unknown): RomRegisterRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  if (!str(r.registerId) || !str(r.status)) return null;
  return {
    registerId: r.registerId as string,
    status: r.status as RomRegisterRow["status"],
    statement: str(r.statement) ?? "",
    whyItMatters: str(r.whyItMatters),
    workingFigure: str(r.workingFigure),
    workingValue: num(r.workingValue),
    source: str(r.source) ?? "",
    confidence: num(r.confidence) ?? 1,
    ownerRole: str(r.ownerRole) ?? "",
    answer: str(r.answer),
    answerFigure: str(r.answerFigure),
    answerValue: num(r.answerValue),
    answerSource: str(r.answerSource),
  };
}

async function refusalDetail(res: Response, what: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    detail?: unknown;
  } | null;
  return typeof body?.detail === "string" && body.detail.trim()
    ? body.detail
    : `${what} answered HTTP ${res.status} with no explanation.`;
}

/** A proposed member list stays visibly unapproved until the owner reviews each mapping. */
export function parseProposedPodMembers(value:string):RomPodMember[] | null {
  const lines=value.trim().split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const members:RomPodMember[]=[];
  for (const line of lines) {
    const parts=line.split("|").map((part)=>part.trim());
    if (parts.length!==5 || !/^ROL-[A-Z0-9-]+$/.test(parts[0]) || !parts[1] ||
        !/^LVL-[A-Z0-9-]+$/.test(parts[2]) || !/^\d+(?:\.\d+)?$/.test(parts[3]) ||
        Number(parts[3])<=0 || !parts[4]) return null;
    members.push({roleCode:parts[0],roleLabel:parts[1],levelCode:parts[2],
      levelLabel:parts[2],fte:Number(parts[3]),proposedMapping:{from:parts[4]}});
  }
  return members;
}

export function RomEstimateStep(props: RomEstimateStepProps) {
  const record: RomEstimate =
    parseRomEstimate(props.value) ?? emptyRomEstimate();
  const [refusal, setRefusal] = useState<string | null>(null);
  const [form, setForm] = useState<OpenForm | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [fillReply, setFillReply] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const evidence = useStepEvidence({
    uploadLabel: "Add session output",
    moveId: props.moveId,
    phase: 3,
    canReview: props.canReviewEvidence,
    onEvidenceChanged: props.onEvidenceChanged,
  });

  // ── The assumptions register (read-only here) ────────────────────────────
  const [registerRead, setRegisterRead] = useState<RegisterRead>({
    status: "loading",
  });
  const [registerToken, setRegisterToken] = useState(0);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch(`/api/v1/programs/${props.moveId}/assumptions`);
        if (!res.ok) {
          const detail = await refusalDetail(res, "The register");
          if (live) setRegisterRead({ status: "error", detail });
          return;
        }
        const body = (await res.json()) as {
          assumptions?: unknown;
          figuresRedacted?: unknown;
        };
        if (!live) return;
        if (!Array.isArray(body.assumptions)) {
          setRegisterRead({
            status: "error",
            detail: "The register answered without its rows.",
          });
          return;
        }
        setRegisterRead({
          status: "ok",
          rows: body.assumptions
            .map(toRegisterRow)
            .filter((r): r is RomRegisterRow => r !== null),
          figuresRedacted: body.figuresRedacted === true,
        });
      } catch {
        if (live) {
          setRegisterRead({
            status: "error",
            detail: "The assumptions register could not be reached.",
          });
        }
      }
    })();
    return () => {
      live = false;
    };
  }, [props.moveId, registerToken]);
  const withheld = registerRead.status === "ok" && registerRead.figuresRedacted;
  // Withheld rows carry no figures, so nothing resolves from them: the
  // viewer sees the rows, and the unit hours read as withheld, not unset.
  const register =
    registerRead.status === "ok" && !withheld ? registerRead.rows : null;
  const registerUnreadBecause =
    registerRead.status === "loading"
      ? ("loading" as const)
      : withheld
        ? ("withheld" as const)
        : undefined;
  // Rates and costs show only once the register has said the viewer may see
  // figures; until then (or if it cannot say) they are not shown.
  const hiddenMoney: ReactNode =
    registerRead.status === "loading" ? (
      <span className={cx("withheld")}>…</span>
    ) : registerRead.status === "error" ? (
      <span className={cx("withheld")}>Not shown</span>
    ) : withheld ? (
      <span className={cx("withheld")}>Withheld</span>
    ) : null;
  const retryRegister = () => {
    setRegisterRead({ status: "loading" });
    setRegisterToken((n) => n + 1);
  };

  // ── The estimate, computed by the ROM service only ───────────────────────
  const build = buildRomStructure(record, register);
  const previewKey = build.ok ? JSON.stringify(build.structure) : "";
  const [preview, setPreview] = useState<PreviewRead | null>(null);
  useEffect(() => {
    if (!previewKey) return;
    let live = true;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/v1/programs/${props.moveId}/rom/preview`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: previewKey,
            },
          );
          if (!res.ok) {
            const detail = await refusalDetail(res, "The estimate service");
            if (live) {
              setPreview({
                key: previewKey,
                status: res.status === 422 ? "refused" : "error",
                detail,
              });
            }
            return;
          }
          const body = (await res.json()) as { rom?: RomResult };
          if (!live) return;
          setPreview(
            body.rom?.ok
              ? { key: previewKey, status: "ok", rom: body.rom }
              : {
                  key: previewKey,
                  status: "error",
                  detail: "The estimate service answered without an estimate.",
                },
          );
        } catch {
          if (live) {
            setPreview({
              key: previewKey,
              status: "error",
              detail: "The estimate service could not be reached.",
            });
          }
        }
      })();
    }, 200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [props.moveId, previewKey]);
  const current = preview && preview.key === previewKey ? preview : null;
  // While a new result computes, the last one stays on screen, marked.
  const shown =
    current ?? (build.ok && preview?.status === "ok" ? preview : null);
  const rom = shown?.status === "ok" ? shown.rom : null;

  const commit = (edit: RomEdit) => {
    if (!edit.ok) {
      setRefusal(edit.reason);
      return false;
    }
    setRefusal(null);
    props.onChange(serializeRomEstimate(edit.value));
    return true;
  };
  const save = (value: RomEstimate) => commit({ ok: true, value });

  const step2Blocked = !props.step2Done;
  const na = romEstimateNextAction({
    record,
    register,
    depth: props.steps[props.stepIndex]?.depth ?? "full",
    blockedBy: step2Blocked
      ? "Waiting on Step 2: the direction isn’t chosen and confirmed yet, so there is nothing to estimate"
      : null,
    estimateRefused: current?.status === "refused",
    registerUnreadBecause,
    leadingRows: [
      ...evidence.rows,
      ...(refusal
        ? [
            {
              id: "REFUSED",
              rank: -100,
              subject: "That change was not made",
              state: "decision" as const,
              clause: "dismiss the refused change",
            },
          ]
        : []),
    ],
  });
  const states = new Map(
    romRowStates(record, register, registerUnreadBecause).map(
      (r) => [r.id, r] as const,
    ),
  );
  const rowBase = (id: RomRowId) => {
    const s = states.get(id)!;
    return {
      id,
      rank: s.rank,
      subject: s.subject,
      state: s.state,
      clause: s.clause,
      draftName: s.draftName,
    };
  };

  // ── Counts ────────────────────────────────────────────────────────────────
  const counted = new Set(countedDrivers(record));
  const carrier = record.releases?.items.find((r) => r.carriesFoundation);
  const blockLabel = (b: RomCountBlock, foundation: boolean) => (
    <>
      <span className={cx("item-name")}>
        {foundation ? b.name : `${b.code} · ${b.name}`}
      </span>
      {foundation ? (
        <span className={cx("item-note")}>
          Counted once
          {carrier
            ? `, in ${carrier.code}`
            : ", in the release that carries it"}
        </span>
      ) : null}
      {b.confirmedAt ? (
        <span className={cx("item-note")}>
          Confirmed by{" "}
          {b.confirmedBy === props.decidedBy ? "you" : b.confirmedBy}
        </span>
      ) : b.source.kind === "session_notes" ? (
        <>
          <span className={cx("ava-badge")}>Session notes · review</span>
          <span className={cx("item-note")}>From {b.source.citation}</span>
        </>
      ) : b.source.kind === "evidence" ? (
        <span className={cx("item-note")}>From {b.source.citation}</span>
      ) : null}
    </>
  );
  const countCell = (b: RomCountBlock, d: RomDriver) =>
    b.confirmedAt || withheld ? (
      <span className={cx("num")}>{b.counts[d] ?? 0}</span>
    ) : (
      <input
        className={cx("cell-input", "cnt-input")}
        inputMode="numeric"
        aria-label={`${ROM_DRIVER_LABELS[d]} for ${b.code}`}
        value={b.counts[d] === undefined ? "" : String(b.counts[d])}
        onChange={(e) => commit(setCount(record, b.code, d, e.target.value))}
      />
    );
  const confirmCell = (b: RomCountBlock) =>
    b.confirmedAt || withheld ? null : (
      <button
        type="button"
        className={cx("link-btn")}
        aria-label={`Confirm counts for ${b.code}`}
        onClick={() =>
          commit(confirmCounts(record, b.code, props.decidedBy, props.today))
        }
      >
        Confirm
      </button>
    );
  const countBlocks: Array<[RomCountBlock, boolean]> = [
    ...record.useCases.map((u) => [u, false] as [RomCountBlock, boolean]),
    ...(record.foundation
      ? [[record.foundation, true] as [RomCountBlock, boolean]]
      : []),
  ];
  const countsTable = (
    <table className={cx("tbl")}>
      <thead>
        <tr>
          <th scope="col" style={{ width: "26%" }}>
            Use case
          </th>
          {ROM_DRIVERS.map((d) => (
            <th scope="col" className={cx("num")} key={d}>
              {ROM_DRIVER_LABELS[d]}
            </th>
          ))}
          <th scope="col">
            <span className={cx("sr-only")}>Confirm</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {countBlocks.map(([b, foundation]) => (
          <tr key={b.code}>
            <th scope="row">{blockLabel(b, foundation)}</th>
            {ROM_DRIVERS.map((d) => (
              <td className={cx("num")} key={d}>
                {countCell(b, d)}
              </td>
            ))}
            <td>{confirmCell(b)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const countsCards = (
    <div className={cx("cards")}>
      {countBlocks.map(([b, foundation]) => (
        <div className={cx("card")} key={b.code}>
          <span className={cx("card-title")}>{blockLabel(b, foundation)}</span>
          <dl>
            {ROM_DRIVERS.map((d) => (
              <div key={d}>
                <dt>{ROM_DRIVER_LABELS[d]}</dt>
                <dd>{countCell(b, d)}</dd>
              </div>
            ))}
          </dl>
          {confirmCell(b)}
        </div>
      ))}
    </div>
  );
  const useCaseForm =
    form?.kind === "use-case" ? (
      <div className={cx("warn-inline")}>
        <label className={cx("q-label")} htmlFor="rom-uc-name">
          New use case
        </label>
        <input
          id="rom-uc-name"
          className={cx("cell-input")}
          value={form.name}
          placeholder="e.g. Certified measure layer"
          onChange={(e) => setForm({ kind: "use-case", name: e.target.value })}
        />
        <span className={cx("item-actions")}>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!form.name.trim()}
            onClick={() =>
              commit(addUseCase(record, form.name)) && setForm(null)
            }
          >
            Save
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </span>
      </div>
    ) : null;
  const countsSettled = states.get("CNT")!.state === "settled";
  const countsRow: StepPageRow = {
    ...rowBase("CNT"),
    eyebrow: "Counts",
    shortName: "counts",
    wide: true,
    facts: [
      {
        kind: "est",
        text: "Planned component counts per use case",
        cite: "your counts and session notes",
      },
    ],
    middle: (
      <>
        {countBlocks.length ? (
          <>
            {countsTable}
            {countsCards}
          </>
        ) : (
          <p className={cx("proposal")}>
            No use cases yet. Add each one the Move delivers, or fill the counts
            from your session notes.
          </p>
        )}
        {useCaseForm}
      </>
    ),
    actions: withheld ? null : countsSettled ? (
      <button
        type="button"
        className={cx("link-btn")}
        onClick={() => save(reopenCounts(record))}
      >
        Reopen
      </button>
    ) : form?.kind === "use-case" ? null : (
      <>
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => setForm({ kind: "use-case", name: "" })}
        >
          Add a use case…
        </button>
        {record.foundation ? null : (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => commit(addFoundation(record))}
          >
            Add the shared foundation
          </button>
        )}
      </>
    ),
    basis: [
      {
        kind: "team",
        text: "Counts are scope, not effort: hours come from the unit hours below.",
        cite: "Estimate rule",
      },
    ],
  };

  // ── Unit hours ───────────────────────────────────────────────────────────
  const unitText = (d: RomDriver, s: RomUnitHoursState): ReactNode => {
    const unit = ROM_DRIVER_UNITS[d];
    switch (s.state) {
      case "confirmed":
        return (
          <span className={cx("src")}>
            <SourceTag kind="est" />
            {s.value} h per {unit}
            <span className={cx("cite")}>
              {" "}
              · {s.sourceLabel} · {CONFIDENCE_WORD[s.confidence]} confidence
            </span>
          </span>
        );
      case "open":
        return (
          <span className={cx("src")}>
            <span className={cx("lead")}>Not set.</span> Needs A:{s.registerId},
            still open with the {s.ownerRole}.{" "}
            {s.workingValue !== null
              ? `Its working figure (${withheld ? "withheld" : (s.workingFigure ?? `${s.workingValue} h per ${unit}`)}) is used only to show the provisional estimate.`
              : "It has no working figure, so nothing is computed from it."}{" "}
            No default is used.
          </span>
        );
      case "unusable":
        return (
          <span className={cx("src")}>
            <span className={cx("lead")}>Not set.</span> A:{s.registerId}{" "}
            {UNUSABLE_WORDS[s.reason]}, so it supplies no hours. Reference
            another register row. No default is used.
          </span>
        );
      case "unread":
        return withheld ? (
          <span className={cx("src")}>
            <span className={cx("withheld")}>
              Figure withheld · no financial visibility
            </span>
            <span className={cx("cite")}> · [A:{s.registerId}]</span>
          </span>
        ) : (
          <span className={cx("src")}>
            <span className={cx("lead")}>Not read.</span>{" "}
            {registerRead.status === "loading"
              ? `Reading A:${s.registerId} from the assumptions register…`
              : `A:${s.registerId} could not be resolved: the assumptions register could not be read.`}
          </span>
        );
      case "unset":
        return counted.has(d) ? (
          <span className={cx("src")}>
            <span className={cx("lead")}>Not set.</span> No register row or
            approved benchmark is referenced. No default is used.
          </span>
        ) : (
          <span className={cx("item-note")}>
            Not needed yet: nothing counts {ROM_DRIVER_LABELS[d].toLowerCase()}.
          </span>
        );
    }
  };
  const referableRows = (register ?? []).filter(
    (r) => r.status !== "superseded" && r.status !== "rejected",
  );
  const unitLine = (d: RomDriver) => {
    const s = resolveRomUnitHours(record.unitHours[d], register);
    const canReference =
      !withheld &&
      register !== null &&
      (s.state === "unusable" || (s.state === "unset" && counted.has(d)));
    const refForm =
      form?.kind === "unit-ref" && form.driver === d ? (
        <div className={cx("warn-inline")}>
          <label className={cx("q-label")} htmlFor={`rom-ref-${d}`}>
            Register row for {ROM_DRIVER_UNITS[d]} hours
          </label>
          <select
            id={`rom-ref-${d}`}
            className={cx("cell-input")}
            value={form.registerId}
            onChange={(e) =>
              setForm({
                kind: "unit-ref",
                driver: d,
                registerId: e.target.value,
              })
            }
          >
            <option value="">Choose a row…</option>
            {referableRows.map((r) => (
              <option key={r.registerId} value={r.registerId}>
                {r.registerId} · {r.statement}
              </option>
            ))}
          </select>
          <span className={cx("item-actions")}>
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={!form.registerId}
              onClick={() =>
                commit(setUnitHoursRef(record, d, form.registerId)) &&
                setForm(null)
              }
            >
              Save
            </button>
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() => setForm(null)}
            >
              Cancel
            </button>
          </span>
        </div>
      ) : null;
    return (
      <li key={d} id={`unit-${d}`}>
        <span>
          <span className={cx("item-name")}>{ROM_DRIVER_LABELS[d]}</span>
          {unitText(d, s)}
          {refForm}
        </span>
        <span className={cx("item-actions")}>
          {s.state === "open" && !withheld ? (
            <a
              className={cx("btn-ink")}
              href={props.registerAnswerHref(s.registerId)}
            >
              Answer A:{s.registerId}…
            </a>
          ) : null}
          {canReference && !refForm ? (
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() =>
                setForm({ kind: "unit-ref", driver: d, registerId: "" })
              }
            >
              Reference a register row…
            </button>
          ) : null}
        </span>
      </li>
    );
  };
  const unitRow: StepPageRow = {
    ...rowBase("UNIT"),
    eyebrow: "Unit hours",
    shortName: "unit hours",
    wide: true,
    facts: [
      {
        kind: "team",
        text: "Each from a confirmed register assumption or an approved benchmark · no defaults",
      },
    ],
    middle: (
      <>
        {registerRead.status === "error" ? (
          <p className={cx("lead-line")} role="alert">
            <span className={cx("lead")}>
              The assumptions register could not be read.
            </span>{" "}
            {registerRead.detail}{" "}
            <button
              type="button"
              className={cx("link-btn", "inline")}
              onClick={retryRegister}
            >
              Try again
            </button>
          </p>
        ) : null}
        <ul className={cx("items")}>{ROM_DRIVERS.map(unitLine)}</ul>
      </>
    ),
  };

  // ── Delivery pod ─────────────────────────────────────────────────────────
  const pod = record.pod;
  const memberLines =
    rom?.foundation?.priced.pod.memberLines ??
    rom?.releases[0]?.own.pod.memberLines ??
    [];
  const rateText = (index: number) =>
    hiddenMoney ? (
      hiddenMoney
    ) : memberLines[index] ? (
      `${formatRomMoney(memberLines[index].rate.hourlyRateCents)}/h`
    ) : (
      <span className={cx("no")}>Not priced</span>
    );
  const podMembers = pod
    ? pod.members
      ? pod.members
      : (rom?.pod.members ?? []).map((m) => ({
          roleCode: m.roleCode,
          roleLabel: m.roleCode,
          levelCode: m.levelCode,
          levelLabel: m.levelCode,
          fte: m.fte,
        }))
    : [];
  const flags = (m: (typeof podMembers)[number]) => {
    const member = pod?.members?.find((x) => x.roleCode === m.roleCode);
    return (
      <>
        {member?.proposedMapping ? (
          member.proposedMapping.approvedAt ? (
            <span className={cx("flag")}>
              Mapped from {member.proposedMapping.from}, approved by{" "}
              {member.proposedMapping.approvedBy === props.decidedBy
                ? "you"
                : member.proposedMapping.approvedBy}
            </span>
          ) : (
            <>
              <span className={cx("flag")}>
                <b>Proposed role mapping, unapproved:</b>{" "}
                {member.proposedMapping.from} → {member.roleLabel}
              </span>
              {withheld ? null : (
                <button
                  type="button"
                  className={cx("link-btn", "inline")}
                  aria-label={`Approve mapping ${member.proposedMapping.from} → ${member.roleLabel}`}
                  onClick={() =>
                    commit(
                      approveMapping(
                        record,
                        member.roleCode,
                        props.decidedBy,
                        props.today,
                      ),
                    )
                  }
                >
                  Approve mapping
                </button>
              )}
            </>
          )
        ) : null}
        {member?.levelClamp ? (
          <span className={cx("flag")}>
            <b>Level clamped:</b> {member.levelClamp.from} → {member.levelLabel}
            : {member.levelClamp.reason}
          </span>
        ) : null}
      </>
    );
  };
  const location = pod ? (pod.locationLabel ?? pod.locationCode) : "";
  const provider = pod
    ? (pod.providerClassLabel ??
      pod.providerClassCode ??
      "Rate source’s own class")
    : "";
  const podTable = (
    <table className={cx("tbl")}>
      <thead>
        <tr>
          <th scope="col" style={{ width: "30%" }}>
            Role
          </th>
          <th scope="col">Level</th>
          <th scope="col">Location</th>
          <th scope="col">Provider</th>
          <th scope="col" className={cx("num")}>
            Rate <SourceTag kind="est" />
          </th>
          <th scope="col" className={cx("num")}>
            Allocation
          </th>
        </tr>
      </thead>
      <tbody>
        {podMembers.map((m, i) => (
          <tr key={`${m.roleCode}-${i}`}>
            <th scope="row">
              <span className={cx("item-name")}>{m.roleLabel}</span>
              {flags(m)}
            </th>
            <td>{m.levelLabel}</td>
            <td>{location}</td>
            <td>{provider}</td>
            <td className={cx("num")}>{rateText(i)}</td>
            <td className={cx("num")}>{formatAllocation(m.fte)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const podCards = (
    <div className={cx("cards")}>
      {podMembers.map((m, i) => (
        <div className={cx("card")} key={`${m.roleCode}-${i}`}>
          <span className={cx("card-title")}>{m.roleLabel}</span>
          <dl>
            <div>
              <dt>Level · location · provider</dt>
              <dd>
                {m.levelLabel} · {location} · {provider}
              </dd>
            </div>
            <div>
              <dt>
                Rate <SourceTag kind="est" />
              </dt>
              <dd>
                {rateText(i)} · {formatAllocation(m.fte)}
              </dd>
            </div>
          </dl>
          {flags(m)}
        </div>
      ))}
    </div>
  );
  const podForm =
    form?.kind === "pod" ? (
      <div className={cx("warn-inline")}>
        <span>Choose a pod template or enter a proposed role mapping. Rates come only from the cost foundation.</span>
        <div className={cx("form-grid")}>
          <label>Pod source
            <select className={cx("cell-input")} value={form.mode}
              onChange={(e)=>setForm({...form,mode:e.target.value as "template"|"members"})}>
              <option value="template">Pod library template</option>
              <option value="members">Proposed role mapping, unapproved</option>
            </select>
          </label>
          {form.mode==="template" ? <label>
            Pod template code
            <input className={cx("cell-input")} value={form.templateCode}
              onChange={(e)=>setForm({...form,templateCode:e.target.value})} />
          </label> : <label>
            Proposed members, one per line: role code | role name | level code | FTE | source role
            <textarea className={cx("cell-input")} rows={5} value={form.membersText}
              onChange={(e)=>setForm({...form,membersText:e.target.value})} />
          </label>}
          <label>
            Delivery location code
            <input
              className={cx("cell-input")}
              value={form.locationCode}
              onChange={(e) =>
                setForm({ ...form, locationCode: e.target.value })
              }
            />
          </label>
          <label>
            Provider class code (optional)
            <input
              className={cx("cell-input")}
              value={form.providerClassCode}
              onChange={(e) =>
                setForm({ ...form, providerClassCode: e.target.value })
              }
            />
          </label>
          <label>
            Rate basis
            <select
              className={cx("cell-input")}
              value={form.rateBasis}
              onChange={(e) =>
                setForm({ ...form, rateBasis: e.target.value as PodRateBasis })
              }
            >
              <option value="">Choose…</option>
              {(Object.keys(RATE_BASIS_LABELS) as PodRateBasis[]).map((b) => (
                <option key={b} value={b}>
                  {RATE_BASIS_LABELS[b]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className={cx("item-actions")}>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={
              (form.mode==="template"?!form.templateCode.trim():!form.membersText.trim()) ||
              !form.locationCode.trim() ||
              !form.rateBasis
            }
            onClick={() => {
              const members=form.mode==="members"?parseProposedPodMembers(form.membersText):null;
              if (form.mode==="members" && !members) {
                setRefusal("Each proposed member needs role code | role name | level code | positive FTE | source role.");
                return;
              }
              if (commit(setPod(record,{
                ...(form.mode==="template"?{templateCode:form.templateCode.trim()}:{members:members!}),
                locationCode:form.locationCode.trim(),
                providerClassCode:form.providerClassCode.trim()||null,
                rateBasis:form.rateBasis as PodRateBasis,
              }))) setForm(null);
            }}
          >
            Save
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </span>
      </div>
    ) : null;
  const openPodForm = () =>
    setForm({
      kind: "pod",
      mode:pod?.members?"members":"template",
      templateCode: pod?.templateCode ?? "",
      membersText:pod?.members?.map((m)=>`${m.roleCode} | ${m.roleLabel} | ${m.levelCode} | ${m.fte} | ${m.proposedMapping?.from??m.roleLabel}`).join("\n")??"",
      locationCode: pod?.locationCode ?? "",
      providerClassCode: pod?.providerClassCode ?? "",
      rateBasis: pod?.rateBasis ?? "",
    });
  const podRow: StepPageRow = {
    ...rowBase("POD"),
    eyebrow: "Delivery pod",
    shortName: "pod",
    subject: pod
      ? (pod.templateName ??
        (pod.templateCode ? `Pod ${pod.templateCode}` : "Delivery pod"))
      : "Set the delivery pod",
    wide: Boolean(pod),
    facts: pod
      ? [
          {
            kind: "team",
            text: pod.templateCode
              ? `Template ${pod.templateCode}`
              : "Members named by the team",
            cite: `rates from the cost foundation · ${RATE_BASIS_LABELS[pod.rateBasis].toLowerCase()}`,
          },
        ]
      : undefined,
    middle: (
      <>
        {pod ? (
          <>
            {podTable}
            {podCards}
          </>
        ) : (
          <p className={cx("proposal")}>
            No delivery pod is set. Name a pod template and where it delivers;
            its rates come from the cost foundation.
          </p>
        )}
        {podForm}
      </>
    ),
    actions:
      withheld || form?.kind === "pod" ? null : pod ? (
        <button type="button" className={cx("link-btn")} onClick={openPodForm}>
          Change template…
        </button>
      ) : (
        <button type="button" className={cx("btn-ink")} onClick={openPodForm}>
          Set the pod…
        </button>
      ),
  };

  // ── Friction and productive share ────────────────────────────────────────
  const factorForm =
    form?.kind === "factors" ? (
      <div className={cx("warn-inline")}>
        <span>
          Each factor needs a source: a register row such as [A:DL4], or an
          approved benchmark.
        </span>
        <div className={cx("form-grid")}>
          {(
            [
              ["friction", "frictionSource", "Friction (e.g. 1.1)"],
              ["share", "shareSource", "Productive share (0–1, e.g. 0.65)"],
              ["week", "weekSource", "Hours per FTE-week"],
            ] as const
          ).map(([v, src, label]) => (
            <div key={v} className={cx("span2")}>
              <div className={cx("form-grid")}>
                <label>
                  {label}
                  <input
                    className={cx("cell-input")}
                    inputMode="decimal"
                    value={form[v]}
                    onChange={(e) => setForm({ ...form, [v]: e.target.value })}
                  />
                </label>
                <label>
                  Source
                  <input
                    className={cx("cell-input")}
                    value={form[src]}
                    onChange={(e) =>
                      setForm({ ...form, [src]: e.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <span className={cx("item-actions")}>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() =>
              commit(
                setFactors(record, {
                  friction: {
                    value: Number(form.friction),
                    source: form.frictionSource,
                  },
                  productiveShare: {
                    value: Number(form.share),
                    source: form.shareSource,
                  },
                  hoursPerFteWeek: {
                    value: Number(form.week),
                    source: form.weekSource,
                  },
                }),
              ) && setForm(null)
            }
          >
            Save
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </span>
      </div>
    ) : null;
  const openFactorForm = () =>
    setForm({
      kind: "factors",
      friction: record.friction ? String(record.friction.value) : "",
      frictionSource: record.friction?.source ?? "",
      share: record.productiveShare ? String(record.productiveShare.value) : "",
      shareSource: record.productiveShare?.source ?? "",
      week: record.hoursPerFteWeek ? String(record.hoursPerFteWeek.value) : "",
      weekSource: record.hoursPerFteWeek?.source ?? "",
    });
  const factorsSettled = states.get("FAC")!.state === "settled";
  const factorRow: StepPageRow = {
    ...rowBase("FAC"),
    eyebrow: "Factors",
    shortName: "factors",
    facts: [
      record.friction
        ? {
            kind: "est" as const,
            text: `Friction ${formatFactor("friction", record.friction.value)}`,
            cite: record.friction.source,
          }
        : null,
      record.productiveShare
        ? {
            kind: "est" as const,
            text: `Productive share ${formatFactor("share", record.productiveShare.value)}`,
            cite: record.productiveShare.source,
          }
        : null,
      record.hoursPerFteWeek
        ? {
            kind: "est" as const,
            text: `Capacity ${formatFactor("week", record.hoursPerFteWeek.value)}`,
            cite: record.hoursPerFteWeek.source,
          }
        : null,
    ].filter((f): f is NonNullable<typeof f> => f !== null),
    middle: (
      <div>
        <p className={cx("proposal")}>
          Effort is raised by friction; elapsed time uses only the productive
          share of the pod’s week.
        </p>
        {factorsSettled ? (
          <span className={cx("when-settled")}>Each sourced</span>
        ) : null}
        {factorForm}
      </div>
    ),
    actions:
      withheld || form?.kind === "factors" ? null : (
        <button
          type="button"
          className={cx(factorsSettled ? "link-btn" : "btn-ink")}
          onClick={openFactorForm}
        >
          {factorsSettled ? "Edit" : "Source the factors…"}
        </button>
      ),
  };

  // ── Releases ─────────────────────────────────────────────────────────────
  const grouping = record.releases;
  const problem = releaseGroupingProblem(record);
  const releasesSettled = states.get("REL")!.state === "settled";
  const rangeOf = (code: string) =>
    rom?.releases.find((r) => r.code === code)?.own.range ?? null;
  const releaseState = (r: NonNullable<typeof grouping>["items"][number]) => {
    const range = rangeOf(r.code);
    const band = range
      ? `range ×${range.lowMultiplier.toFixed(2)}–×${range.highMultiplier.toFixed(2)} · ${range.policyCode}`
      : r.designStatus === "designed"
        ? "range from its five range inputs"
        : "range ×0.75–×1.50";
    return `${r.designStatus === "designed" ? "Designed" : "Not designed"} · ${band}`;
  };
  const unassignedUseCases = record.useCases.filter(
    (u) => !grouping?.items.some((r) => r.useCaseCodes.includes(u.code)),
  );
  const releaseForm =
    form?.kind === "release" ? (
      <div className={cx("warn-inline")}>
        <div className={cx("form-grid")}>
          <label className={cx("span2")}>
            Release name
            <input
              className={cx("cell-input")}
              value={form.name}
              placeholder="e.g. Pilot · certified measures"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <fieldset className={cx("span2")}>
            <legend className={cx("q-label")}>Use cases it ships</legend>
            {unassignedUseCases.map((u) => (
              <label key={u.code}>
                <span>
                  <input
                    type="checkbox"
                    checked={form.useCaseCodes.includes(u.code)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        useCaseCodes: e.target.checked
                          ? [...form.useCaseCodes, u.code]
                          : form.useCaseCodes.filter((c) => c !== u.code),
                      })
                    }
                  />{" "}
                  {u.code} · {u.name}
                </span>
              </label>
            ))}
          </fieldset>
          <div
            className={cx("seg", "seg-sm", "span2")}
            role="radiogroup"
            aria-label="Design status"
          >
            {(
              [
                ["not_designed", "Not designed"],
                ["designed", "Designed"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={form.designStatus === v}
                onClick={() => setForm({ ...form, designStatus: v })}
              >
                {l}
              </button>
            ))}
          </div>
          {form.designStatus === "designed" ? (
            <>
              {TIER_FIELDS.map(([k, l]) => (
                <label key={k}>
                  {l}
                  <select
                    className={cx("cell-input")}
                    value={form.range[k] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        range: { ...form.range, [k]: e.target.value },
                      })
                    }
                  >
                    <option value="">Choose…</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              ))}
              <label>
                Rate-card coverage (0–100)
                <input
                  className={cx("cell-input")}
                  inputMode="numeric"
                  value={form.range.coverage ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      range: { ...form.range, coverage: e.target.value },
                    })
                  }
                />
              </label>
            </>
          ) : null}
          {record.foundation ? (
            <label className={cx("span2")}>
              <span>
                <input
                  type="checkbox"
                  checked={form.carriesFoundation}
                  onChange={(e) =>
                    setForm({ ...form, carriesFoundation: e.target.checked })
                  }
                />{" "}
                Carries the shared foundation (counted once, in this release)
              </span>
            </label>
          ) : null}
        </div>
        <span className={cx("item-actions")}>
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() => {
              const r = form.range;
              const coverage = Number(r.coverage);
              const rangeInputs: RangePolicyInputs | undefined =
                form.designStatus === "designed" &&
                TIER_FIELDS.every(([k]) => r[k]) &&
                r.coverage?.trim() &&
                Number.isFinite(coverage)
                  ? {
                      scopeMaturity:
                        r.scopeMaturity as RangePolicyInputs["scopeMaturity"],
                      evidenceQuality:
                        r.evidenceQuality as RangePolicyInputs["evidenceQuality"],
                      deliveryNovelty:
                        r.deliveryNovelty as RangePolicyInputs["deliveryNovelty"],
                      quantityUncertainty:
                        r.quantityUncertainty as RangePolicyInputs["quantityUncertainty"],
                      rateCardCoveragePct: coverage,
                    }
                  : undefined;
              if (
                commit(
                  addRelease(record, {
                    name: form.name,
                    useCaseCodes: form.useCaseCodes,
                    designStatus: form.designStatus,
                    ...(rangeInputs ? { rangeInputs } : {}),
                    ...(form.carriesFoundation
                      ? { carriesFoundation: true }
                      : {}),
                  }),
                )
              ) {
                setForm(null);
              }
            }}
          >
            Save release
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setForm(null)}
          >
            Cancel
          </button>
        </span>
      </div>
    ) : null;
  const releaseRow: StepPageRow = {
    ...rowBase("REL"),
    eyebrow: "Releases",
    shortName: "releases",
    wide: true,
    middle: (
      <>
        {grouping &&
        !releasesSettled &&
        grouping.source.kind === "session_notes" ? (
          <p className={cx("lead-line")}>
            <span className={cx("ava-badge")}>Session notes · review</span>
          </p>
        ) : null}
        {problem ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>
              {problem.unassigned.length
                ? `${problem.unassigned.join(", ")} ${problem.unassigned.length === 1 ? "is" : "are"} in no release.`
                : problem.inTwo.length
                  ? `${problem.inTwo.join(", ")} ${problem.inTwo.length === 1 ? "is" : "are"} in two releases.`
                  : "The shared foundation must be counted in exactly one release."}
            </span>
          </p>
        ) : null}
        {grouping?.items.length ? (
          <ul className={cx("items")}>
            {grouping.items.map((r) => (
              <li key={r.code}>
                <span>
                  <span className={cx("item-name")}>
                    {r.code} · {r.name}
                  </span>
                  <span className={cx("item-note")}>
                    {r.useCaseCodes.join(", ")}
                    {r.carriesFoundation
                      ? " · includes the shared foundation, counted once"
                      : ""}
                  </span>
                </span>
                <span className={cx("item-actions")}>
                  <span className={cx("item-state")}>{releaseState(r)}</span>
                  {releasesSettled ||
                  withheld ||
                  grouping.source.kind !== "team" ? null : (
                    <button
                      type="button"
                      className={cx("link-btn")}
                      aria-label={`Remove ${r.code}`}
                      onClick={() => commit(removeRelease(record, r.code))}
                    >
                      Remove
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={cx("proposal")}>
            No releases yet. Group the use cases into releases; the shared
            foundation is counted once, in the release that carries it.
          </p>
        )}
        {releasesSettled && grouping?.acceptedAt ? (
          <span className={cx("when-settled")}>
            {grouping.source.kind === "session_notes"
              ? "Accepted"
              : "Confirmed"}{" "}
            by{" "}
            {grouping.acceptedBy === props.decidedBy
              ? "you"
              : grouping.acceptedBy}
            , {shortDate(grouping.acceptedAt)}
          </span>
        ) : grouping?.source.kind === "session_notes" ? (
          <span className={cx("src")}>
            <span className={cx("cite")}>From {grouping.source.citation}</span>
          </span>
        ) : null}
        {releaseForm}
      </>
    ),
    actions:
      withheld || form?.kind === "release" ? null : releasesSettled ? (
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => save(reopenReleases(record))}
        >
          Reopen
        </button>
      ) : (
        <>
          {grouping?.items.length ? (
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={problem !== null}
              onClick={() =>
                commit(acceptReleases(record, props.decidedBy, props.today))
              }
            >
              {grouping.source.kind === "session_notes"
                ? "Accept"
                : "Confirm the grouping"}
            </button>
          ) : null}
          {unassignedUseCases.length ? (
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() =>
                setForm({
                  kind: "release",
                  name: "",
                  useCaseCodes: [],
                  designStatus: "not_designed",
                  carriesFoundation: false,
                  range: {},
                })
              }
            >
              Add a release…
            </button>
          ) : null}
        </>
      ),
  };

  // ── The estimate (output block, after the groups) ────────────────────────
  const approval = record.approval;
  const approvalCurrent = na.approvalCurrent;
  const because = romProvisionalBecause(na.categories);
  const provisional = provisionalSentence(because);
  // An approval that still stands shows the snapshot it approved, which
  // needs no live read; otherwise the figures are the service's latest.
  const figures =
    approval && approvalCurrent
      ? {
          releases: approval.releases,
          foundation: approval.foundation,
          combined: approval.combined,
        }
      : rom
        ? romResultFigures(rom)
        : null;
  const money = (cents: number) => hiddenMoney ?? formatRomMoney(cents);
  const buildReason = !build.ok
    ? {
        no_use_cases:
          "Nothing to estimate yet: add the use cases and their counts.",
        no_releases: "Group the use cases into releases to see the estimate.",
        grouping:
          "Put every use case in exactly one release to see the estimate.",
        no_pod: "Set the delivery pod to see the estimate.",
        no_factors: "Source the delivery factors to see the estimate.",
        unit_hours_missing:
          registerRead.status === "loading"
            ? "Reading the assumptions register…"
            : registerRead.status === "error"
              ? "The assumptions register could not be read, so the unit hours behind the estimate are unknown."
              : `Nothing is computed while ${(build.drivers ?? [])
                  .map((d) => `${ROM_DRIVER_UNITS[d]} hours`)
                  .join(" and ")} have no figure. No default is used.`,
      }[build.reason]
    : null;
  const resultRows = figures
    ? [
        ...figures.releases.map((r) => ({
          key: r.code,
          label: `${r.code} · ${r.name}`,
          f: r,
        })),
        ...(figures.foundation
          ? [
              {
                key: "foundation",
                label: `${figures.foundation.name} · counted once, in ${figures.foundation.releaseCode}`,
                f: figures.foundation,
              },
            ]
          : []),
      ]
    : [];
  const resultsTable = figures ? (
    <table className={cx("tbl")}>
      <thead>
        <tr>
          <th scope="col" style={{ width: "34%" }}>
            Release
          </th>
          <th scope="col" className={cx("num")}>
            Hours
          </th>
          <th scope="col" className={cx("num")}>
            Weeks
          </th>
          <th scope="col" className={cx("num")}>
            Low
          </th>
          <th scope="col" className={cx("num")}>
            Plan
          </th>
          <th scope="col" className={cx("num")}>
            High
          </th>
        </tr>
      </thead>
      <tbody>
        {resultRows.map(({ key, label, f }) => (
          <tr key={key}>
            <th scope="row">{label}</th>
            <td className={cx("num")}>{formatRomHours(f.hours)}</td>
            <td className={cx("num")}>{formatRomWeeks(f.weeks)}</td>
            <td className={cx("num")}>{money(f.lowCents)}</td>
            <td className={cx("num")}>{money(f.planCents)}</td>
            <td className={cx("num")}>{money(f.highCents)}</td>
          </tr>
        ))}
        <tr className={cx("total")}>
          <th scope="row">Combined · foundation counted once</th>
          <td className={cx("num")}>
            {formatRomHours(figures.combined.hours)}
          </td>
          <td className={cx("num")}>
            {formatRomWeeks(figures.combined.weeks)}
          </td>
          <td className={cx("num")}>{money(figures.combined.lowCents)}</td>
          <td className={cx("num")}>{money(figures.combined.planCents)}</td>
          <td className={cx("num")}>{money(figures.combined.highCents)}</td>
        </tr>
      </tbody>
    </table>
  ) : null;
  const resultsCards = figures ? (
    <div className={cx("cards")}>
      {[
        ...resultRows,
        {
          key: "combined",
          label: "Combined · foundation counted once",
          f: figures.combined,
        },
      ].map(({ key, label, f }) => (
        <div className={cx("card")} key={key}>
          <span className={cx("card-title")}>{label}</span>
          <dl>
            <div>
              <dt>Hours · weeks</dt>
              <dd>
                {formatRomHours(f.hours)} · {formatRomWeeks(f.weeks)}
              </dd>
            </div>
            <div>
              <dt>Cost low · plan · high</dt>
              <dd>
                {money(f.lowCents)} · {money(f.planCents)} ·{" "}
                {money(f.highCents)}
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  ) : null;
  const canApprove =
    na.approvable &&
    !approvalCurrent &&
    build.ok &&
    build.workingFigureDrivers.length === 0 &&
    current?.status === "ok";
  const approve = () => {
    if (current?.status !== "ok") return;
    commit(
      approveRomEstimate(
        record,
        register,
        current.rom,
        props.decidedBy,
        props.today,
      ),
    );
  };
  const downloadWorkbook = async () => {
    if (!build.ok) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(
        `/api/v1/programs/${props.moveId}/rom/preview?format=xlsx`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(build.structure),
        },
      );
      if (!res.ok) {
        setDownloadError(await refusalDetail(res, "The workbook service"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL?.(blob);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `rom-estimate-${props.moveId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL?.(url);
      }
    } catch {
      setDownloadError("The workbook could not be downloaded. Try again.");
    } finally {
      setDownloading(false);
    }
  };
  const estimateRow: StepPageRow = {
    id: "EST",
    rank: 6,
    eyebrow: "Estimate",
    shortName: "estimate",
    subject: approvalCurrent ? "Estimate approved" : "Approve the estimate",
    state: approvalCurrent ? "settled" : "decision",
    wide: true,
    facts: [
      {
        kind: "est",
        text: "Bottom-up ROM, computed from the inputs above",
        cite: "planning grade; P4 sizes from the approved snapshot",
      },
    ],
    middle: (
      <>
        {!approvalCurrent && provisional ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>Provisional</span>
            {provisional.slice("Provisional".length)} These figures move as they
            are.
          </p>
        ) : null}
        {build.ok && build.workingFigureDrivers.length ? (
          <p className={cx("lead-line")}>
            Priced with the working figure of{" "}
            {build.workingFigureDrivers
              .map((d) => {
                const ref = record.unitHours[d];
                return ref?.kind === "register" ? `A:${ref.registerId}` : d;
              })
              .join(" and ")}
            , still open.
          </p>
        ) : null}
        {buildReason ? <p className={cx("empty-note")}>{buildReason}</p> : null}
        {!approvalCurrent && build.ok && !shown ? (
          <p className={cx("empty-note")}>Computing the estimate…</p>
        ) : null}
        {!approvalCurrent && shown && shown.status !== "ok" ? (
          <p className={cx("lead-line")} role="alert">
            <span className={cx("lead")}>
              {shown.status === "refused"
                ? "The estimate service refused these inputs."
                : "The estimate could not be computed."}
            </span>{" "}
            {shown.detail}
          </p>
        ) : null}
        {resultsTable}
        {resultsCards}
        {!approvalCurrent && shown && !current && rom ? (
          <span className={cx("item-note")}>Updating…</span>
        ) : null}
        {approval && approvalCurrent ? (
          <span className={cx("when-settled")}>
            Approved by{" "}
            {approval.approvedBy === props.decidedBy
              ? "you"
              : approval.approvedBy}
            , {shortDate(approval.approvedAt)} · snapshot v{approval.version}{" "}
            for P4
          </span>
        ) : approval ? (
          <p className={cx("lead-line")}>
            Snapshot v{approval.version} was approved on{" "}
            {shortDate(approval.approvedAt)}; its inputs have changed since.
            Approve again for P4.
          </p>
        ) : null}
        {downloadError ? (
          <p className={cx("lead-line")} role="alert">
            {downloadError}
          </p>
        ) : null}
      </>
    ),
    actions: withheld ? null : (
      <>
        <button
          type="button"
          className={cx("link-btn")}
          disabled={!build.ok || downloading}
          title="Sheets: Estimate, Component Library, Pod & Rates, Releases, Assumptions; live formulas"
          onClick={() => void downloadWorkbook()}
        >
          Download the workbook
        </button>
        {approvalCurrent ? (
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => save(reopenRomApproval(record))}
          >
            Reopen
          </button>
        ) : (
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!canApprove}
            onClick={approve}
          >
            Approve the estimate
          </button>
        )}
      </>
    ),
    basis: [
      {
        kind: "team",
        text: "Hours = Σ count × unit hours × friction. Weeks = hours ÷ (pod hours per week × productive share), in whole pod-weeks. Cost = weeks × the pod’s weekly cost. Low and high apply the release range. The foundation is added once, to the release that carries it.",
        cite: "Estimate rule",
      },
      {
        kind: "team",
        text: "The workbook carries the same formulas live, across Estimate, Component Library, Pod & Rates, Releases and Assumptions.",
        cite: "Workbook",
      },
    ],
  };

  // ── Assumptions this estimate relies on (compact, read-only) ─────────────
  const reliedIds = romReliedRegisterIds(record);
  const reliedRows = reliedIds.map(
    (id) =>
      [
        id,
        (registerRead.status === "ok" ? registerRead.rows : []).find(
          (r) => r.registerId === id,
        ) ?? null,
      ] as const,
  );
  const openRelied = reliedRows.filter(([, r]) => r?.status === "open").length;
  const compact = reliedIds.length ? (
    <section className={cx("group")}>
      <h2 className={cx("eyebrow", "group-title")}>
        Assumptions this estimate relies on · {reliedIds.length}
        {openRelied ? ` · ${openRelied} open` : ""}
      </h2>
      <details className={cx("disc", "list", "settled")}>
        <summary>
          <span className={cx("what")}>{reliedIds.join(", ")}</span>
          <span className={cx("disc-toggle")}>
            <span className={cx("when-closed")}>Show</span>
            <span className={cx("when-open")}>Hide</span>
          </span>
        </summary>
        {registerRead.status === "error" ? (
          <p className={cx("empty-note")}>
            The assumptions register could not be read. {registerRead.detail}
          </p>
        ) : registerRead.status === "loading" ? (
          <p className={cx("empty-note")}>Reading the assumptions register…</p>
        ) : (
          <ul className={cx("items")} style={{ padding: "4px 24px 16px" }}>
            {reliedRows.map(([id, r]) =>
              r ? (
                <li key={id} id={`reg-${id}`}>
                  <span>
                    <span className={cx("item-name")}>
                      {id} · {r.statement}
                    </span>
                    {r.whyItMatters ? (
                      <span className={cx("item-note")}>{r.whyItMatters}</span>
                    ) : null}
                    <span className={cx("src")}>
                      {withheld ? (
                        <span className={cx("withheld")}>
                          Figure withheld · no financial visibility
                        </span>
                      ) : r.workingFigure ? (
                        <>
                          <SourceTag kind="est" />
                          {r.workingFigure}
                        </>
                      ) : null}
                      <span className={cx("cite")}> · {r.source}</span>
                    </span>
                    <span className={cx("reg-meta")}>
                      {r.ownerRole} ·{" "}
                      {
                        CONFIDENCE_WORD[
                          ({ 1: "low", 3: "medium", 5: "high" } as const)[
                            r.confidence as 1 | 3 | 5
                          ] ?? "low"
                        ]
                      }{" "}
                      confidence
                    </span>
                    {r.status === "confirmed" || r.status === "corrected" ? (
                      <span className={cx("reg-meta")}>
                        {withheld ? (
                          <span className={cx("withheld")}>
                            Answer withheld
                          </span>
                        ) : (
                          (r.answer ?? r.answerFigure ?? STATUS_WORD[r.status])
                        )}
                        {r.answerSource ? ` · ${r.answerSource}` : ""}
                      </span>
                    ) : null}
                  </span>
                  <span className={cx("item-actions")}>
                    <span className={cx("item-state")}>
                      {STATUS_WORD[r.status] ?? r.status}
                    </span>
                  </span>
                </li>
              ) : (
                <li key={id} id={`reg-${id}`}>
                  <span>
                    <span className={cx("item-name")}>{id}</span>
                    <span className={cx("item-note")}>Not in the register</span>
                  </span>
                </li>
              ),
            )}
          </ul>
        )}
      </details>
    </section>
  ) : null;

  const output = (
    <>
      <section className={cx("group")}>
        <h2 className={cx("eyebrow", "group-title")}>
          {approvalCurrent ? "Approved estimate" : "The estimate"}
        </h2>
        <div className={cx("list")}>
          <StepRowView row={estimateRow} />
        </div>
      </section>
      {compact}
    </>
  );

  const pageRows: StepPageRow[] = [
    ...evidence.rows,
    countsRow,
    unitRow,
    podRow,
    factorRow,
    releaseRow,
  ];
  if (refusal) {
    pageRows.unshift({
      id: "REFUSED",
      rank: -100,
      shortName: "refusal",
      eyebrow: "Not saved",
      subject: "That change was not made",
      state: "decision",
      clause: "dismiss the refused change",
      middle: (
        <p className={cx("proposal")} role="alert">
          {refusal}
        </p>
      ),
      actions: (
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => setRefusal(null)}
        >
          Dismiss
        </button>
      ),
    });
  }

  const openUnits = countedDrivers(record).filter(
    (d) =>
      resolveRomUnitHours(record.unitHours[d], register).state !== "confirmed",
  );
  const notesDrafts = record.useCases.filter(
    (u) => !u.confirmedAt && u.source.kind === "session_notes",
  );
  const briefing = [
    "I read this step’s inputs and the assumptions register.",
    notesDrafts.length
      ? `Counts for ${notesDrafts.map((u) => u.code).join(" and ")} come from your session notes, word for word. Confirm them; I didn’t estimate any count.`
      : null,
    openUnits.length
      ? `No unit hours for ${openUnits.map((d) => ROM_DRIVER_LABELS[d].toLowerCase()).join(" and ")}: there is no confirmed assumption or approved benchmark, and I don’t use defaults.`
      : null,
    "Drafts stay drafts until you accept them. I don’t write figures.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const fillFromNotes = () => {
    const proposals = proposeRomCountsFromNotes(notes, record);
    const confirmedNamed = record.useCases.filter(
      (u) => u.confirmedAt && new RegExp(`\\b${u.code}\\b`, "i").test(notes),
    );
    if (!proposals.length) {
      setFillReply(
        "Your notes state no counts for an open use case on this step. I don’t fill unit hours, rates or releases.",
      );
      return;
    }
    save(applyRomNotesProposals(record, proposals));
    setFillReply(
      [
        `I filled counts for ${proposals.map((p) => p.code).join(" and ")} from your notes, word for word. ${proposals.length > 1 ? "They are drafts" : "It is a draft"}; confirm each row.`,
        confirmedNamed.length
          ? `I left ${confirmedNamed.map((u) => u.code).join(" and ")} alone because you had confirmed ${confirmedNamed.length > 1 ? "them" : "it"}.`
          : null,
        "I don’t fill unit hours or rates.",
      ]
        .filter(Boolean)
        .join(" "),
    );
  };

  const notesPanel = notesOpen ? (
    <div className={cx("root")}>
      <div className={cx("warn-inline")}>
        <label className={cx("q-label")} htmlFor="rom-notes">
          Fill this step from your notes
        </label>
        <span className={cx("item-note")}>
          Notes are your account of a session, not approved evidence. aVa fills
          only counts, word for word, into use cases you haven’t confirmed;
          never a number you typed, and never unit hours or rates.
        </span>
        <textarea
          id="rom-notes"
          className={cx("q-input")}
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <span className={cx("item-actions")}>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!notes.trim()}
            onClick={fillFromNotes}
          >
            Fill with aVa
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => setNotesOpen(false)}
          >
            Close
          </button>
        </span>
        {fillReply ? <span role="status">{fillReply}</span> : null}
      </div>
    </div>
  ) : null;

  const depth = props.steps[props.stepIndex]?.depth ?? "full";
  const page = (
    <MovesStepPage
      moveName={props.moveName}
      clientDisplayName={props.clientDisplayName}
      syntheticNote={props.syntheticNote}
      tabs={props.tabs}
      phases={props.phases}
      phaseCode="P3"
      phaseName="Design"
      steps={props.steps}
      stepIndex={props.stepIndex}
      title="Estimate the work bottom-up"
      intro="Count what gets built, price it with a delivery pod and group it into releases. The approved estimate is the snapshot P4 plans from; nothing here is procured."
      nextAction={na.nextAction}
      countLabel={na.countLabel}
      blockedLink={{ label: "Open Step 2 →", href: props.step2Href }}
      blockedWork="Counts, unit hours and the pod will appear here once Step 2’s direction is chosen and confirmed. Your inputs are kept."
      context={{
        items: step2Blocked
          ? [<b key="depth">{depth === "light" ? "Light" : "Full"} depth</b>]
          : [
              <b key="depth">{depth === "light" ? "Light" : "Full"} depth</b>,
              evidence.summary,
            ],
        details: [],
      }}
      contextAction={step2Blocked ? undefined : evidence.uploadControl}
      rows={pageRows}
      workEnd={output}
      carry={{
        label: "Carries to P4",
        text: " The approved snapshot: per-release cost, hours and weeks, the pod and every assumption behind them.",
      }}
      onBack={props.onBack}
      onContinue={props.onContinue}
    />
  );

  return props.frame
    ? props.frame(page, {
        briefing,
        actions: [
          {
            id: "fill-notes",
            label: "Fill this step from my notes",
            onClick: () => setNotesOpen(true),
          },
        ],
        notesPanel,
      })
    : page;
}
