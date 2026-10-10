"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EstimateModelEditor } from "@/components/strategic-moves/EstimateModelEditor";
import { CaptureNotesFill } from "@/components/strategic-moves/CaptureNotesFill";
import {
  readApprovedRomSnapshot,
  type ApprovedRomSnapshot,
} from "@/lib/pricing/moves-workflow/approved-rom-snapshot";
import { evaluateEstimateModel } from "@/lib/programs/estimate-model";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";
import {
  readValueModel,
  serializeValueModel,
  type ValueModelCapture,
} from "@/lib/programs/value-model-capture";
import { resolveStepNextAction } from "@/lib/programs/step-page-model";
import {
  stepPageHref,
  type StepPageView,
} from "@/lib/programs/step-page-views";
import { formatValueCents } from "@/lib/programs/value-engine/format-money";
import { MovesStepPage, SourceLine, type StepPageRow } from "./MovesStepPage";
import { useStepEvidence } from "./StepEvidence";
import type { PhaseStepPageMap, StepPageHostProps } from "./phase-step-pages";
import styles from "./MovesStepPage.module.css";

const cx = (...names: string[]) =>
  names.map((name) => styles[name] ?? name).join(" ");

export interface CaptureField {
  key: string;
  label: string;
  shortName: string;
  clause: string;
  guidance: string;
}

export const field = (
  key: string,
  label: string,
  shortName: string,
  clause: string,
  guidance: string,
): CaptureField => ({ key, label, shortName, clause, guidance });

export function CaptureStepPage({
  host,
  title,
  intro,
  fields,
  beforeRows = [],
  afterRows = [],
  carry,
  workEnd,
  checkIds = [],
  blockedBy,
  blockedLink,
  blockedWork,
}: {
  host: StepPageHostProps;
  view: StepPageView;
  title: string;
  intro: string;
  fields: readonly CaptureField[];
  beforeRows?: readonly StepPageRow[];
  afterRows?: readonly StepPageRow[];
  carry?: string;
  workEnd?: ReactNode;
  checkIds?: readonly string[];
  blockedBy?: string | null;
  blockedLink?: { label: string; href: string };
  blockedWork?: ReactNode;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [noteDrafts, setNoteDrafts] = useState<
    Record<string, { value: string; line?: number }>
  >({});
  const evidence = useStepEvidence({
    moveId: host.move.id,
    phase: host.phase,
    canReview: host.canApproveGates,
    onEvidenceChanged: () => window.location.reload(),
    uploadLabel: "Add session output",
  });
  const rows: StepPageRow[] = [
    ...evidence.rows,
    ...beforeRows,
    ...fields.map((entry, index): StepPageRow => {
      const saved = host.values[entry.key]?.trim() ?? "";
      const noteDraft = noteDrafts[entry.key];
      const open = entry.key in drafts || !saved;
      return {
        id: entry.key,
        eyebrow: entry.label,
        rank: index + 1,
        shortName: entry.shortName,
        subject: entry.label,
        state:
          noteDraft && !saved && !(entry.key in drafts)
            ? "draft"
            : open
              ? "decision"
              : "settled",
        clause: entry.clause,
        draftName: entry.shortName,
        facts: saved
          ? [{ kind: "team", text: "Your saved capture answer" }]
          : undefined,
        middle:
          noteDraft && !saved && !(entry.key in drafts) ? (
            <div className={cx("field")}>
              <p className={cx("proposal")}>{noteDraft.value}</p>
              <span className={cx("ava-badge")}>Session notes · review</span>
              <SourceLine
                source={{
                  kind: "team",
                  text: `From pasted session notes${noteDraft.line ? `, line ${noteDraft.line}` : ""}`,
                }}
              />
            </div>
          ) : open ? (
            <div className={cx("field")}>
              <label className={cx("q-label")} htmlFor={`capture-${entry.key}`}>
                {entry.guidance}
              </label>
              <textarea
                id={`capture-${entry.key}`}
                className={cx("q-input")}
                rows={4}
                value={drafts[entry.key] ?? ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [entry.key]: event.target.value,
                  }))
                }
              />
              <span className={cx("item-note")}>
                Written to the Move&apos;s {entry.shortName} answer.
              </span>
            </div>
          ) : (
            <p className={cx("proposal")}>{saved}</p>
          ),
        actions:
          noteDraft && !saved && !(entry.key in drafts) ? (
            <button
              type="button"
              className={cx("btn-ink")}
              onClick={() => {
                host.setValue(entry.key, noteDraft.value);
                setNoteDrafts((current) => {
                  const next = { ...current };
                  delete next[entry.key];
                  return next;
                });
              }}
            >
              Accept
            </button>
          ) : open ? (
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={!drafts[entry.key]?.trim()}
              onClick={() => {
                host.setValue(entry.key, drafts[entry.key].trim());
                setDrafts((current) => {
                  const next = { ...current };
                  delete next[entry.key];
                  return next;
                });
              }}
            >
              Save
            </button>
          ) : (
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() =>
                setDrafts((current) => ({ ...current, [entry.key]: saved }))
              }
            >
              Edit
            </button>
          ),
      };
    }),
    ...afterRows,
  ];
  const next = resolveStepNextAction({
    depth: host.chrome.steps[host.chrome.stepIndex]?.depth ?? "full",
    rows,
    blockedBy,
    readySentence: `Continue to ${host.chrome.steps[host.chrome.stepIndex + 1]?.title ?? "the gate"}`,
    emptySentence: "Record this step's decisions",
  });
  const checks = host.gateProps.criteria
    .filter((criterion) => checkIds.includes(criterion.id))
    .map((criterion) => ({
      met: criterion.completed && criterion.verified,
      unknown: !criterion.verified,
      level: criterion.severity,
      text: criterion.label,
      note: criterion.reason,
    }));
  const navigate = (index: number) =>
    window.location.assign(
      stepPageHref(host.move.id, host.phase, `P${host.phase}.${index + 1}`),
    );
  const depth = host.chrome.steps[host.chrome.stepIndex]?.depth;
  const page = (
    <MovesStepPage
      moveName={host.gateProps.moveName}
      phases={host.chrome.phases}
      phaseCode={`P${host.phase}`}
      phaseName={host.phase === 4 ? "Roadmap" : "Mobilize"}
      steps={host.chrome.steps}
      stepIndex={host.chrome.stepIndex}
      tabs={host.chrome.tabs}
      title={title}
      intro={intro}
      nextAction={next}
      checks={checks}
      checksLabel="Show gate checks"
      blockedLink={blockedLink}
      blockedWork={blockedWork}
      context={{
        items: [
          depth
            ? `${depth[0].toUpperCase()}${depth.slice(1)} depth`
            : "Depth unavailable",
          evidence.summary,
        ],
        details: [],
      }}
      contextAction={evidence.uploadControl}
      rows={rows}
      workEnd={workEnd}
      carry={
        carry
          ? {
              label: host.phase === 4 ? "Carries to P5" : "Carries to Tower",
              text: carry,
            }
          : undefined
      }
      onBack={
        host.chrome.stepIndex > 0
          ? () => navigate(host.chrome.stepIndex - 1)
          : undefined
      }
      onContinue={
        host.chrome.stepIndex + 1 < host.chrome.steps.length
          ? () => navigate(host.chrome.stepIndex + 1)
          : undefined
      }
    />
  );
  const notesPanel = fields.length ? (
    <CaptureNotesFill
      targets={fields.map((entry) => ({
        section: {
          key: entry.key,
          label: entry.label,
          description: entry.guidance,
          required: true,
        } as PhaseCaptureSection,
        value:
          host.values[entry.key] ??
          drafts[entry.key] ??
          noteDrafts[entry.key]?.value ??
          "",
      }))}
      onInsert={(key, value, line) => {
        if (host.values[key]?.trim() || drafts[key]?.trim()) return;
        setNoteDrafts((current) => ({ ...current, [key]: { value, line } }));
      }}
    />
  ) : null;
  return host.dock(page, {
    briefing: `I can use the saved ${title.toLowerCase()} answers and evidence shown here. I leave decisions and figures to the team. Drafts stay drafts until you accept them. I don't write figures.`,
    actions: [],
    notesPanel,
  });
}

function Milestones({
  moveId,
  onCountChange,
}: {
  moveId: string;
  onCountChange: (count: number | null) => void;
}) {
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [status, setStatus] = useState("Reading milestones…");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(`/api/v1/programs/${encodeURIComponent(moveId)}/milestones`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{
          milestones?: Array<{ id: string; name: string }>;
        }>;
      })
      .then((body) => {
        if (live) {
          const next = body.milestones ?? [];
          setItems(next);
          onCountChange(next.length);
          setStatus("");
        }
      })
      .catch(() => {
        if (live) {
          onCountChange(null);
          setStatus(
            "Milestones could not be read. The gate will re-evaluate them.",
          );
        }
      });
    return () => {
      live = false;
    };
  }, [moveId, onCountChange]);
  const add = async () => {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/v1/programs/${encodeURIComponent(moveId)}/milestones`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phaseNumber: 4 }),
        },
      );
      const body = (await response.json()) as {
        milestoneId?: string;
        detail?: string;
      };
      if (!response.ok || !body.milestoneId)
        throw new Error(body.detail ?? "The milestone was not saved.");
      const next = [...items, { id: body.milestoneId, name: name.trim() }];
      setItems(next);
      onCountChange(next.length);
      setName("");
      setStatus("");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "The milestone was not saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={cx("field")}>
      <p className={cx("proposal")} role="status">
        {status ||
          `${items.length} milestone${items.length === 1 ? "" : "s"} recorded for this Move.`}
      </p>
      {items.length ? (
        <ul className={cx("items")}>
          {items.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ) : null}
      <label className={cx("q-label")} htmlFor="p4-milestone-name">
        Milestone name
      </label>
      <input
        id="p4-milestone-name"
        className={cx("q-input")}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={!name.trim() || busy}
        onClick={() => void add()}
      >
        {busy ? "Saving…" : "Add milestone"}
      </button>
    </div>
  );
}

function EstimateBasis({
  moveId,
  snapshot,
}: {
  moveId: string;
  snapshot: ApprovedRomSnapshot | null;
}) {
  if (!snapshot) {
    return (
      <p className={cx("proposal")}>
        <strong>No approved estimate yet.</strong> Approve it in{" "}
        <a href={stepPageHref(moveId, 3, "P3.4")}>P3 Step 4 →</a>
        <span className={cx("item-note")}>
          Per-release low / plan / high and the workbook link are unavailable
          until an approved ROM snapshot can be read.
        </span>
      </p>
    );
  }

  return (
    <div className={cx("field")}>
      <p className={cx("proposal")}>
        Approved ROM snapshot {snapshot.id} · {snapshot.approvedAt}
      </p>
      {snapshot.result.releases.map((release) => (
        <p key={release.code} className={cx("proposal")}>
          <strong>{release.name}</strong> · low{" "}
          {formatValueCents(release.standalone.lowCents)} · plan{" "}
          {formatValueCents(release.standalone.planCents)} · high{" "}
          {formatValueCents(release.standalone.highCents)}
          <SourceLine
            source={{
              kind: "est",
              text: "Approved ROM basis",
              cite: `ROM snapshot ${snapshot.id}`,
            }}
          />
        </p>
      ))}
      {snapshot.workbookHref ? (
        <a href={snapshot.workbookHref}>Open ROM workbook →</a>
      ) : (
        <p className={cx("item-note")}>Workbook link unavailable.</p>
      )}
    </div>
  );
}

function ValueCaseReadback({
  moveId,
  driverUnits,
}: {
  moveId: string;
  driverUnits: Readonly<Record<string, string>>;
}) {
  const [body, setBody] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("Reading the value case…");
  useEffect(() => {
    let live = true;
    fetch(
      `/api/v1/programs/${encodeURIComponent(moveId)}/value-case?delivery=internal`,
      { credentials: "include" },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<Record<string, unknown>>;
      })
      .then((value) => {
        if (live) {
          setBody(value);
          setStatus("");
        }
      })
      .catch(() => {
        if (live)
          setStatus("Value case unavailable. No engine result is being shown.");
      });
    return () => {
      live = false;
    };
  }, [moveId]);
  const result =
    body?.result && typeof body.result === "object"
      ? (body.result as Record<string, unknown>)
      : null;
  const levers = Array.isArray(result?.levers)
    ? (result.levers as Array<Record<string, unknown>>)
    : [];
  const economics =
    result?.economics && typeof result.economics === "object"
      ? (result.economics as Record<string, unknown>)
      : null;
  const npv =
    economics?.npvCents && typeof economics.npvCents === "object"
      ? (economics.npvCents as Record<string, unknown>)
      : null;
  const npvTerms =
    economics?.npvTerms && typeof economics.npvTerms === "object"
      ? (economics.npvTerms as Record<string, unknown>)
      : null;
  const sourcesOf = (terms: unknown): string =>
    Array.isArray(terms)
      ? [
          ...new Set(
            (terms as Array<Record<string, unknown>>)
              .map((term) => String(term.source ?? ""))
              .filter((source) => source && source !== "engine"),
          ),
        ].join(" · ") || "Engine formula only"
      : "Source terms unavailable";
  const caseSources = sourcesOf(npvTerms?.base);
  const payback =
    economics?.paybackMonth && typeof economics.paybackMonth === "object"
      ? (economics.paybackMonth as Record<string, unknown>)
      : null;
  const breakeven = Array.isArray(result?.breakeven)
    ? (result.breakeven as Array<Record<string, unknown>>)
    : [];
  const sensitivity = Array.isArray(result?.sensitivity)
    ? (result.sensitivity as Array<Record<string, unknown>>)
    : [];
  return (
    <div className={cx("field")}>
      <p role="status" className={cx("proposal")}>
        {status ||
          `Engine status: ${String(result?.status ?? "not evaluated")}.`}
      </p>
      {levers.map((lever, index) => (
        <p key={String(lever.leverId ?? index)} className={cx("proposal")}>
          <strong>{String(lever.name ?? "Unnamed lever")}</strong> ·{" "}
          {String(lever.status ?? "unknown")}
          {lever.status === "zero_no_release_path" ? (
            <>
              {" "}
              · $0: no release path
              <SourceLine
                source={{
                  kind: "est",
                  text: "No approved release path",
                  cite: sourcesOf(
                    (lever.terms as Record<string, unknown> | undefined)?.base,
                  ),
                }}
              />
            </>
          ) : null}
        </p>
      ))}
      {npv ? (
        <p className={cx("proposal")}>
          <strong>NPV</strong> · low {formatValueCents(npv.low)} · plan{" "}
          {formatValueCents(npv.base)} · high {formatValueCents(npv.high)}
          <SourceLine
            source={{ kind: "est", text: "Engine result", cite: caseSources }}
          />
        </p>
      ) : null}
      {payback ? (
        <p className={cx("proposal")}>
          <strong>Payback</strong> · plan{" "}
          {payback.base === null
            ? "not reached"
            : `${String(payback.base ?? "unknown")} months`}
          <SourceLine
            source={{ kind: "est", text: "Engine result", cite: caseSources }}
          />
        </p>
      ) : null}
      {breakeven.map((item, index) => (
        <p key={String(item.leverId ?? index)} className={cx("proposal")}>
          Breakeven · {String(item.leverId ?? "lever")} ·{" "}
          {String(item.status ?? "unknown")}{" "}
          {typeof item.breakevenDelta === "number"
            ? driverUnits[String(item.leverId)]
              ? `· driver delta ${item.breakevenDelta} ${driverUnits[String(item.leverId)]}`
              : "· driver unit unavailable"
            : ""}
          <SourceLine
            source={{ kind: "est", text: "Engine result", cite: caseSources }}
          />
        </p>
      ))}
      {sensitivity.map((item, index) => (
        <p
          key={`${String(item.key ?? index)}-${String(item.side ?? "")}`}
          className={cx("proposal")}
        >
          Sensitivity · {String(item.label ?? item.key ?? "input")} ·{" "}
          {String(item.side ?? "")} · NPV {formatValueCents(item.npvCents)}
          <SourceLine
            source={{ kind: "est", text: "Engine result", cite: caseSources }}
          />
        </p>
      ))}
      {levers.flatMap((lever) => {
        const terms =
          lever.terms && typeof lever.terms === "object"
            ? (lever.terms as Record<string, unknown>)
            : null;
        return Array.isArray(terms?.base)
          ? (terms.base as Array<Record<string, unknown>>).map(
              (term, index) => (
                <p
                  key={`${String(lever.leverId)}-term-${index}`}
                  className={cx("item-note")}
                >
                  Formula term · {String(term.label ?? term.role ?? "input")} ·{" "}
                  {String(term.source ?? "source absent")}
                </p>
              ),
            )
          : [];
      })}
      <SourceLine
        source={{
          kind: "team",
          text: "Figures require [A:ID], reviewed evidence, or an approved ROM snapshot.",
        }}
      />
    </div>
  );
}

function ValueReferences({
  model,
  onSave,
}: {
  model: ValueModelCapture;
  onSave: (model: ValueModelCapture) => void;
}) {
  const [draft, setDraft] = useState(model);
  const change = (
    index: number,
    key: "conversion" | "attribution" | "probability",
    value: string,
  ) => {
    setDraft(
      (current) =>
        ({
          ...current,
          case: {
            ...current.case,
            levers: current.case.levers.map((lever, at) =>
              at !== index
                ? lever
                : {
                    ...lever,
                    [key]:
                      key === "conversion"
                        ? value
                        : { kind: "register" as const, registerId: value },
                  },
            ),
          },
        }) as ValueModelCapture,
    );
  };
  return (
    <div className={cx("field")}>
      {draft.case.levers.map((lever, index) => (
        <div key={lever.id} className={cx("field")}>
          <strong>{lever.name}</strong>
          <label className={cx("q-label")} htmlFor={`conversion-${lever.id}`}>
            Conversion rule
          </label>
          <select
            id={`conversion-${lever.id}`}
            className={cx("q-input")}
            value={lever.conversion}
            onChange={(event) =>
              change(index, "conversion", event.target.value)
            }
          >
            <option value="cost_reduction">Cost reduction</option>
            <option value="volume_added">Volume added</option>
            <option value="revenue">Revenue</option>
            <option value="risk_avoided">Risk avoided</option>
            <option value="non_cash">Non-cash</option>
          </select>
          <label className={cx("q-label")} htmlFor={`attribution-${lever.id}`}>
            Attribution register ID
          </label>
          <input
            id={`attribution-${lever.id}`}
            className={cx("q-input")}
            value={
              lever.attribution.kind === "register"
                ? lever.attribution.registerId
                : ""
            }
            placeholder="V3"
            onChange={(event) =>
              change(index, "attribution", event.target.value)
            }
          />
          <label className={cx("q-label")} htmlFor={`probability-${lever.id}`}>
            Probability register ID
          </label>
          <input
            id={`probability-${lever.id}`}
            className={cx("q-input")}
            value={
              lever.probability.kind === "register"
                ? lever.probability.registerId
                : ""
            }
            placeholder="V4"
            onChange={(event) =>
              change(index, "probability", event.target.value)
            }
          />
        </div>
      ))}
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={draft.case.levers.some(
          (lever) =>
            lever.attribution.kind !== "register" ||
            !lever.attribution.registerId.trim() ||
            lever.probability.kind !== "register" ||
            !lever.probability.registerId.trim(),
        )}
        onClick={() => onSave(draft)}
      >
        Save register references
      </button>
    </div>
  );
}

function P4MilestonesPage({ host }: { host: StepPageHostProps }) {
  const [milestoneCount, setMilestoneCount] = useState<number | null>(null);
  return (
    <CaptureStepPage
      host={host}
      view="p4-milestones"
      title="Sequence workstreams and milestones"
      intro="Record the delivery sequence and critical milestones for the roadmap."
      checkIds={["execution_roadmap_drafted", "execution_milestones_defined"]}
      fields={[
        field(
          "roadmap_sequencing",
          "Roadmap sequence",
          "sequence",
          "record the workstream sequence",
          "Describe workstreams, dependencies, owner roles and the planned sequence in the team's words.",
        ),
      ]}
      afterRows={[
        {
          id: "MILESTONES",
          rank: 5,
          shortName: "milestones",
          subject: "Critical milestones",
          state:
            milestoneCount !== null && milestoneCount > 0
              ? "settled"
              : "decision",
          clause: "add a critical milestone",
          middle: (
            <Milestones
              moveId={host.move.id}
              onCountChange={setMilestoneCount}
            />
          ),
          facts: [
            {
              kind: "team",
              text: "Read from the Move's milestones route; gate status comes from the evaluator.",
            },
          ],
        },
      ]}
      carry="The workstream sequence and critical milestone record."
    />
  );
}

function P4EstimatePage({ host }: { host: StepPageHostProps }) {
  const [snapshot, setSnapshot] = useState<ApprovedRomSnapshot | null>(null);
  const [readStatus, setReadStatus] = useState<
    "reading" | "available" | "missing" | "failed"
  >("reading");
  useEffect(() => {
    let live = true;
    readApprovedRomSnapshot(host.move.id)
      .then((value) => {
        if (live) {
          setSnapshot(value);
          setReadStatus(value ? "available" : "missing");
        }
      })
      .catch(() => {
        if (live) setReadStatus("failed");
      });
    return () => {
      live = false;
    };
  }, [host.move.id]);
  const evaluation = evaluateEstimateModel(
    host.values.estimates_capacity ?? "",
  );
  const blockedBy =
    readStatus === "available"
      ? null
      : readStatus === "reading"
        ? "Reading the approved estimate basis"
        : readStatus === "failed"
          ? "Approved estimate could not be read"
          : "No approved estimate yet. Approve it in P3 Step 4";
  const editor = (
    <div
      className={
        evaluation.errors.length ? cx("hide-estimate-total") : undefined
      }
    >
      <EstimateModelEditor
        value={host.values.estimates_capacity ?? ""}
        onChange={(value) => host.setValue("estimates_capacity", value)}
      />
    </div>
  );
  return (
    <CaptureStepPage
      host={host}
      view="p4-estimate"
      title="Review estimate and capacity"
      intro="Confirm the human-reviewed delivery estimate against the approved ROM basis."
      fields={[]}
      blockedBy={blockedBy}
      blockedLink={
        readStatus === "missing"
          ? {
              label: "Open P3 Step 4 →",
              href: stepPageHref(host.move.id, 3, "P3.4"),
            }
          : undefined
      }
      blockedWork={
        <div>
          <p className={cx("item-note")}>
            Estimate inputs remain editable while the approved ROM basis is
            unavailable.
          </p>
          {editor}
        </div>
      }
      beforeRows={[
        {
          id: "ROM",
          rank: 0,
          shortName: "approved ROM basis",
          subject: "Approved P3 estimate basis",
          state: snapshot ? "settled" : "decision",
          clause: "approve the P3 estimate basis",
          middle:
            readStatus === "reading" ? (
              <p className={cx("proposal")}>Reading approved ROM snapshot…</p>
            ) : readStatus === "failed" ? (
              <p className={cx("proposal")}>
                Approved ROM snapshot could not be read.
              </p>
            ) : (
              <EstimateBasis moveId={host.move.id} snapshot={snapshot} />
            ),
        },
        {
          id: "ESTIMATE",
          rank: 1,
          shortName: "estimate model",
          subject: "Estimate and capacity model",
          state: evaluation.readyForApproval ? "settled" : "decision",
          clause: "review the estimate assumptions",
          wide: true,
          middle: editor,
          facts: [
            {
              kind: "est",
              text: "Planning estimate; reviewer confirmation is a human act",
              cite: "Estimate model",
            },
          ],
        },
      ]}
      carry="The reviewed estimate model and its source basis."
    />
  );
}

export const P4_STEP_PAGES: PhaseStepPageMap = {
  "p4-milestones": (host) => <P4MilestonesPage host={host} />,
  "p4-estimate": (host) => <P4EstimatePage host={host} />,
  "p4-value": (host) => {
    const value = readValueModel(host.values.value_plan ?? "");
    return (
      <CaptureStepPage
        host={host}
        view="p4-value"
        title="Set the value plan and funding path"
        intro="Confirm the value conversion rules and funding route before the business case gate."
        fields={[
          field(
            "funding_governance",
            "Funding governance",
            "funding route",
            "record the funding route",
            "Name the funding decision, approval role and open conditions.",
          ),
        ]}
        beforeRows={[
          {
            id: "VALUE",
            rank: 0,
            shortName: "value plan",
            subject: "Structured value case",
            state:
              value.kind === "model" && value.model.case.levers.length > 0
                ? "settled"
                : "decision",
            clause: "resolve the structured value plan",
            wide: true,
            middle: (
              <>
                <ValueCaseReadback
                  moveId={host.move.id}
                  driverUnits={
                    value.kind === "model"
                      ? Object.fromEntries(
                          value.model.case.levers.map((lever) => [
                            lever.id,
                            lever.driver.unit,
                          ]),
                        )
                      : {}
                  }
                />
                {value.kind === "model" ? (
                  <ValueReferences
                    model={value.model}
                    onSave={(model) =>
                      host.setValue("value_plan", serializeValueModel(model))
                    }
                  />
                ) : (
                  <p className={cx("item-note")}>
                    No structured value model is recorded. Legacy text is not an
                    engine result.
                  </p>
                )}
              </>
            ),
          },
        ]}
        checkIds={["business_case_approved", "funding_approval_recorded"]}
        carry="The value case and funding decision, with unresolved assumptions named."
      />
    );
  },
  "p4-tower": (host) => (
    <CaptureStepPage
      host={host}
      view="p4-tower"
      title="Define Tower metrics and handoff"
      intro="Record who will measure outcomes after this Move is handed off."
      checkIds={["tower_metric_plan_drafted", "tower_handoff_plan_accepted"]}
      fields={[
        field(
          "handoff_plan",
          "Tower handoff plan",
          "handoff plan",
          "record the Tower handoff plan",
          "Name the measurement owner role, baseline, cadence and handoff conditions.",
        ),
      ]}
      carry="The Tower measurement plan for P5 handoff."
    />
  ),
};
