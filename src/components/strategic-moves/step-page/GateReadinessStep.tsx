"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  DELIVERABLE_REGISTRY,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import { planPhaseGateSubmitWithoutBuild } from "@/lib/programs/phase-build-settlement";
import {
  GATE_DOCUMENTS_ROW_ID,
  GATE_RATIONALE_ROW_ID,
  gateDocumentSignState,
  resolveGateStep,
  type GateCriterionView,
  type GateDocumentBuildState,
  type GateDocumentView,
} from "@/lib/programs/gate-readiness-step";
import {
  usePhaseDocumentBuild,
  type BuildSettledResult,
  type DeliverableRow,
} from "@/components/strategic-moves/use-phase-document-build";
import { useDeliverableSignOff } from "@/components/strategic-moves/use-deliverable-sign-off";
import type { PhaseBuildArtifact } from "@/components/strategic-moves/PhaseApproveAndBuild";
import {
  MovesStepPage,
  type StepPagePhase,
  type StepPageRow,
  type StepPageStep,
} from "./MovesStepPage";
import styles from "./MovesStepPage.module.css";

/**
 * The gate step page (template v1.3, "Check the gate and sign off"). Every
 * action runs through the governed path the gate already reads:
 * - build: `usePhaseDocumentBuild` (generate-phase + run polling), WITHOUT the
 *   old auto-submit: building, signing and submitting are separate decisions;
 * - sign-off: `useDeliverableSignOff`, bound to the document's current version;
 * - approve and submit: the host's gate submission (`phase-gate-approval`),
 *   with the approver's own rationale recorded as the human rationale.
 * The checks and their state come from the evaluator; this page decides none.
 */

const cx = (...names: Array<string | false | null | undefined>) =>
  names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? name)
    .join(" ");

function buildStateOf(row: DeliverableRow | undefined): {
  build: GateDocumentBuildState;
  failureReason?: string;
} {
  if (!row || row.status === "idle") return { build: "none" };
  if (row.status === "queued") return { build: "queued" };
  if (row.status === "running" || row.status === "handed_off") {
    return { build: "building" };
  }
  if (row.status === "succeeded") return { build: "built" };
  return {
    build: "failed",
    failureReason:
      row.blockers[0] ?? row.error ?? "The build did not finish.",
  };
}

export interface GateReadinessStepProps {
  moveId: string;
  moveName: string;
  syntheticNote?: string;
  archetype: string;
  clientDisplayName: string;
  phaseNum: number;
  phaseCode: string;
  /** "Design" */
  phaseName: string;
  /** "P4 Roadmap" */
  nextPhaseLabel: string;
  phases: readonly StepPagePhase[];
  steps: readonly StepPageStep[];
  stepIndex: number;
  tabs?: ReactNode;
  criteria: readonly GateCriterionView[];
  /** The documents this Move's change profile builds, in build order. */
  routeDocumentKeys: readonly string[];
  /** Documents the phase can build that this profile does not, with why. */
  notBuilt: ReadonlyArray<{ title: string; reason: string }>;
  initialArtifacts: readonly PhaseBuildArtifact[];
  /** Whether the sign-off columns on `initialArtifacts` were read. */
  signOffReadable: boolean;
  canApprove: boolean;
  /** Who approves, shown to a viewer who cannot. */
  approverName: string;
  /** Why the build is held (capture incomplete, required evidence open), or null. */
  buildHeldReason: string | null;
  depthDetail: string;
  onBeforeBuild?: () => Promise<void>;
  /** The governed gate submission. Throws with the refusal sentence. */
  onSubmit: (settlement: BuildSettledResult) => Promise<void>;
  /** Back to the previous step. */
  onBack?: () => void;
  /**
   * A sign-off or a finished build changed versions and sign-off records on
   * the server. Default: reload, so the server-rendered page reads them.
   */
  onRecordChanged?: () => void;
}

function DocumentLine({
  moveId,
  doc,
  title,
  downloadUrl,
  canApprove,
  approverName,
  signOffReadable,
  buildBusy,
  onRebuild,
  onRecordChanged,
}: {
  moveId: string;
  doc: GateDocumentView;
  title: string;
  downloadUrl: string | null;
  canApprove: boolean;
  approverName: string;
  signOffReadable: boolean;
  buildBusy: boolean;
  onRebuild: () => void;
  onRecordChanged: () => void;
}) {
  const state = gateDocumentSignState(doc, signOffReadable);
  const signOff = useDeliverableSignOff({
    moveId,
    deliverableId: doc.deliverableId ?? "",
    onSigned: onRecordChanged,
  });
  const [signing, setSigning] = useState(false);
  const [note, setNote] = useState("");
  const open = downloadUrl ? (
    <a className={cx("link-btn")} href={downloadUrl} target="_blank" rel="noreferrer">
      Open
    </a>
  ) : null;
  const refused = signOff.error?.canAcknowledge ? signOff.error : null;

  let stateText: ReactNode;
  let actions: ReactNode = null;
  if (state === "not_built") stateText = "Not built";
  else if (state === "building") stateText = doc.build === "queued" ? "Queued" : "Building…";
  else if (state === "failed") {
    stateText = doc.failureReason ?? "The build did not finish.";
    actions = buildBusy ? null : (
      <button type="button" className={cx("btn-ink")} onClick={onRebuild}>
        Build again
      </button>
    );
  } else if (state === "signed") {
    stateText = (
      <>
        Signed v{doc.currentVersion} <span className={cx("status-ok")}>✓</span>
      </>
    );
    actions = buildBusy ? null : (
      <>
        {open}
        <button type="button" className={cx("link-btn")} onClick={onRebuild}>
          Rebuild…
        </button>
      </>
    );
  } else if (state === "unknown") {
    stateText = signOffReadable
      ? "Built · no sign-off record to sign against"
      : "Built · sign-off state could not be read";
    actions = open;
  } else {
    stateText =
      state === "superseded"
        ? `Signed v${doc.signedOffVersion} · v${doc.currentVersion} is newer, sign again`
        : `Built v${doc.currentVersion} · not signed`;
    actions = buildBusy ? null : canApprove ? (
      <>
        {open}
        {signing || refused ? null : (
          <button type="button" className={cx("btn-ink")} onClick={() => setSigning(true)}>
            Sign off
          </button>
        )}
      </>
    ) : (
      <>
        {open}
        <span className={cx("item-state")}>Awaiting {approverName}</span>
      </>
    );
  }

  const busy = signOff.busy !== "idle";
  return (
    <li>
      <span>
        <span className={cx("item-name")}>{title}</span>
      </span>
      <span className={cx("item-actions")}>
        <span className={cx("item-state")}>{stateText}</span>
        {actions}
      </span>
      {canApprove && signing && !refused ? (
        <div className={cx("warn-inline")}>
          <label className={cx("q-label")} htmlFor={`sign-note-${doc.key}`}>
            Approval note{" "}
            <span className={cx("item-note")} style={{ display: "inline" }}>
              optional · up to 1,000 characters
            </span>
          </label>
          <textarea
            id={`sign-note-${doc.key}`}
            className={cx("q-input")}
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          {signOff.error && !signOff.error.canAcknowledge ? (
            <span role="alert">{signOff.error.message}</span>
          ) : null}
          <span className={cx("item-actions")}>
            <button
              type="button"
              className={cx("btn-ink")}
              disabled={busy}
              onClick={() => void signOff.submit({ rationale: note })}
            >
              {busy ? "Signing…" : `Sign off v${doc.currentVersion}`}
            </button>
            <button type="button" className={cx("link-btn")} onClick={() => setSigning(false)}>
              Cancel
            </button>
          </span>
        </div>
      ) : null}
      {canApprove && refused ? (
        <div className={cx("warn-inline")} role="alert">
          <span>
            <span className={cx("lead")}>
              Not signed: {refused.blockers?.length ?? 0} client-readiness finding
              {(refused.blockers?.length ?? 0) === 1 ? "" : "s"} in v{doc.currentVersion}.
            </span>{" "}
            Fix the document, or sign it acknowledging them.
          </span>
          <ul className={cx("items")}>
            {(refused.blockers ?? []).map((blocker, index) => (
              <li key={`${blocker.kind ?? "finding"}-${index}`}>
                <span>
                  <span className={cx("tag", "t-fact")}>{blocker.kind ?? "Finding"}</span>
                  {blocker.match ? `“${blocker.match}”` : null}
                  {blocker.why ? <span className={cx("item-note")}>{blocker.why}</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <span className={cx("item-actions")}>
            <button
              type="button"
              className={cx("btn-line")}
              disabled={busy}
              onClick={() =>
                void signOff.submit({
                  file: signOff.pendingUpload ?? undefined,
                  rationale: note,
                  acknowledgeReadinessBlockers: true,
                })
              }
            >
              Sign off anyway, acknowledging {refused.blockers?.length ?? 0} finding
              {(refused.blockers?.length ?? 0) === 1 ? "" : "s"}
            </button>
            <label className={cx("link-btn")}>
              Upload an edited final…
              <input
                type="file"
                className={cx("sr-only")}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void signOff.submit({ file, rationale: note });
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </span>
        </div>
      ) : null}
    </li>
  );
}

const reloadPage = () => window.location.reload();

/** "A", "A and B", "A, B, and C". */
function listNames(names: readonly string[]): string {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function GateReadinessStep(props: GateReadinessStepProps) {
  const onRecordChanged = props.onRecordChanged ?? reloadPage;
  const specs = useMemo(
    () =>
      props.routeDocumentKeys
        .map((key) => DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key))
        .filter(Boolean) as DeliverableSpec[],
    [props.routeDocumentKeys],
  );
  const build = usePhaseDocumentBuild({
    moveId: props.moveId,
    phaseNum: props.phaseNum,
    phaseLabel: `${props.phaseCode} ${props.phaseName}`,
    archetype: props.archetype,
    moveName: props.moveName,
    clientDisplayName: props.clientDisplayName,
    specs,
    initialArtifacts: props.initialArtifacts,
    onBeforeBuild: props.onBeforeBuild,
    // A finished build changes versions and sign-off records on the server;
    // reload so the page reads them, rather than submitting anything.
    onBuildSettled: async () => {
      onRecordChanged();
    },
  });

  const [rationale, setRationale] = useState("");
  const [rationaleDraft, setRationaleDraft] = useState("");
  const [editingRationale, setEditingRationale] = useState(true);
  const [rebuildAsk, setRebuildAsk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const artifactByKey = useMemo(() => {
    const byKey = new Map<string, PhaseBuildArtifact>();
    for (const artifact of props.initialArtifacts) {
      if (artifact.deliverableTypeKey && !byKey.has(artifact.deliverableTypeKey)) {
        byKey.set(artifact.deliverableTypeKey, artifact);
      }
    }
    return byKey;
  }, [props.initialArtifacts]);

  const rowByKey = new Map(build.rows.map((row) => [row.deliverableTypeKey, row]));
  const gateSpecs = specs.filter((spec) => spec.gateArtifact);
  const supportSpecs = specs.filter((spec) => !spec.gateArtifact);
  const documents: GateDocumentView[] = gateSpecs.map((spec) => {
    const artifact = artifactByKey.get(spec.deliverableTypeKey);
    return {
      key: spec.deliverableTypeKey,
      title: spec.documentTitle,
      ...buildStateOf(rowByKey.get(spec.deliverableTypeKey)),
      currentVersion: artifact?.currentVersion ?? null,
      signedOffVersion: artifact?.signedOffVersion ?? null,
      deliverableId: artifact?.deliverableId ?? null,
    };
  });
  const buildBusy =
    build.building ||
    documents.some((d) => d.build === "queued" || d.build === "building");
  const signedTitles = documents
    .filter((d) => gateDocumentSignState(d, props.signOffReadable) === "signed")
    .map((d) => d.title);

  const model = resolveGateStep({
    criteria: props.criteria,
    documents,
    signOffReadable: props.signOffReadable,
    canApprove: props.canApprove,
    approverName: props.approverName,
    rationaleWritten: rationale.trim().length > 0,
    phaseName: props.phaseName,
    nextPhaseLabel: props.nextPhaseLabel,
  });

  const requestBuild = () => {
    if (signedTitles.length > 0 && !rebuildAsk) {
      setRebuildAsk(true);
      return;
    }
    setRebuildAsk(false);
    void build.approveAndBuild();
  };

  const noneBuilt = documents.length > 0 && documents.every((d) => d.build === "none");
  const docsSettled =
    documents.length > 0 &&
    documents.every((d) => gateDocumentSignState(d, props.signOffReadable) === "signed");

  const docsRow: StepPageRow = {
    id: GATE_DOCUMENTS_ROW_ID,
    eyebrow: "Gate documents",
    rank: 1,
    shortName: "gate documents",
    subject: noneBuilt
      ? "Build the gate documents"
      : buildBusy
        ? "Building the gate documents"
        : docsSettled
          ? "Gate documents signed off"
          : "Sign off the gate documents",
    state: docsSettled ? "settled" : "decision",
    clause: "settle the gate documents",
    wide: true,
    facts: [
      {
        kind: "team",
        text: props.canApprove
          ? `Required by the ${props.phaseName} gate · each signature is bound to one version`
          : `Required by the ${props.phaseName} gate · ${props.approverName} signs each version`,
      },
    ],
    middle: (
      <>
        {noneBuilt ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>Not built yet.</span> The gate documents
            are built from this phase&apos;s steps. Building takes a few minutes; you
            can leave the page.
          </p>
        ) : buildBusy ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>Building.</span> Each document becomes
            signable when it is built. You can leave the page.
          </p>
        ) : null}
        {props.buildHeldReason && !buildBusy ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>Build held.</span> {props.buildHeldReason}
          </p>
        ) : null}
        {build.error ? (
          <p className={cx("lead-line")} role="alert">
            <span className={cx("lead")}>The build did not start.</span> {build.error}
          </p>
        ) : null}
        {build.handOffSentence ? <p className={cx("lead-line")}>{build.handOffSentence}</p> : null}
        {rebuildAsk ? (
          <div className={cx("warn-inline")}>
            <span>
              <span className={cx("lead")}>
                A build rebuilds every gate document, so it replaces the signed{" "}
                {listNames(signedTitles)} with unsigned new versions.
              </span>{" "}
              The gate&apos;s sign-off checks fail again until they are signed.
            </span>
            <span className={cx("item-actions")}>
              <button type="button" className={cx("btn-line")} onClick={requestBuild}>
                Rebuild anyway
              </button>
              <button type="button" className={cx("link-btn")} onClick={() => setRebuildAsk(false)}>
                Cancel
              </button>
            </span>
          </div>
        ) : null}
        <ul className={cx("items")}>
          {documents.map((doc) => {
            const artifact = artifactByKey.get(doc.key);
            return (
              <DocumentLine
                key={doc.key}
                moveId={props.moveId}
                doc={doc}
                title={doc.title}
                downloadUrl={artifact?.downloadUrl ?? null}
                canApprove={props.canApprove}
                approverName={props.approverName}
                signOffReadable={props.signOffReadable}
                buildBusy={buildBusy}
                onRebuild={requestBuild}
                onRecordChanged={onRecordChanged}
              />
            );
          })}
        </ul>
        {supportSpecs.length > 0 ? (
          <>
            <span className={cx("eyebrow", "sub-eyebrow")}>Also built · not signed at the gate</span>
            <ul className={cx("items")}>
              {supportSpecs.map((spec) => {
                const artifact = artifactByKey.get(spec.deliverableTypeKey);
                return (
                  <li key={spec.deliverableTypeKey}>
                    <span>
                      <span className={cx("item-name")}>{spec.documentTitle}</span>
                    </span>
                    <span className={cx("item-actions")}>
                      {artifact ? (
                        <a className={cx("link-btn")} href={artifact.downloadUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        <span className={cx("item-state")}>Built with the gate documents</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
        {props.notBuilt.length > 0 ? (
          <>
            <span className={cx("eyebrow", "sub-eyebrow")}>Not built for this profile</span>
            <ul className={cx("items")}>
              {props.notBuilt.map((doc) => (
                <li key={doc.title}>
                  <span>
                    <span className={cx("item-name")}>{doc.title}</span>
                    <span className={cx("item-note")}>{doc.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </>
    ),
    actions:
      noneBuilt && !buildBusy ? (
        <button
          type="button"
          className={cx("btn-ink")}
          disabled={Boolean(props.buildHeldReason)}
          onClick={requestBuild}
        >
          Build the {documents.length === 1 ? "gate document" : `${documents.length} gate documents`}
        </button>
      ) : null,
    basis: [
      {
        kind: "team",
        text: "A signature is bound to one version. Rebuilding or uploading creates a new, unsigned version; the signed one stays in the version history.",
        cite: "Sign-off rule",
      },
    ],
  };

  const rationaleRow: StepPageRow = {
    id: GATE_RATIONALE_ROW_ID,
    eyebrow: "Approval",
    rank: 2,
    shortName: "approval rationale",
    subject: "Approval rationale",
    state: rationale.trim() ? "settled" : "decision",
    clause: "write the approval rationale",
    facts: [
      {
        kind: "team",
        text: `Recorded with ${props.canApprove ? "your" : `${props.approverName}'s`} approval · approving also submits ${props.phaseName}`,
      },
    ],
    middle: !props.canApprove ? (
      <div>
        <p className={cx("proposal")}>
          {props.approverName} writes the rationale when approving.
        </p>
      </div>
    ) : editingRationale ? (
      <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor="gate-rationale">
          Why this {props.phaseName.toLowerCase()} should pass the gate
        </label>
        <textarea
          id="gate-rationale"
          className={cx("q-input")}
          rows={4}
          maxLength={2000}
          value={rationaleDraft}
          placeholder="e.g. The design maps every root cause to a design element and follows the route the approved evidence supports."
          onChange={(event) => setRationaleDraft(event.target.value)}
        />
      </div>
    ) : (
      <div>
        <p className={cx("proposal")}>{rationale}</p>
        <span className={cx("when-settled")}>Written by you · recorded when you approve and submit</span>
      </div>
    ),
    actions: !props.canApprove ? null : editingRationale ? (
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={!rationaleDraft.trim()}
        onClick={() => {
          setRationale(rationaleDraft.trim());
          setEditingRationale(false);
        }}
      >
        Use this rationale
      </button>
    ) : (
      <button
        type="button"
        className={cx("link-btn")}
        onClick={() => {
          setRationaleDraft(rationale);
          setRationale("");
          setEditingRationale(true);
        }}
      >
        Edit rationale
      </button>
    ),
  };

  const submitRow: StepPageRow[] = submitError
    ? [
        {
          id: "SUBMIT",
          eyebrow: "Submission",
          rank: 0,
          shortName: "submission",
          subject: "The gate refused the submission",
          state: "decision",
          clause: "resolve what the gate refused",
          middle: (
            <p className={cx("proposal")} role="alert">
              {submitError}
            </p>
          ),
        },
      ]
    : [];

  const submit = async () => {
    const plan = planPhaseGateSubmitWithoutBuild({
      phase: props.phaseNum,
      phaseLabel: `${props.phaseCode} ${props.phaseName}`,
      documents: specs.map((spec) => ({
        deliverableTypeKey: spec.deliverableTypeKey,
        documentTitle: spec.documentTitle,
        gateArtifact: spec.gateArtifact,
      })),
      states: build.rows.map((row) => ({
        deliverableTypeKey: row.deliverableTypeKey,
        status: row.status,
        artifactStatus: row.runId
          ? null
          : (artifactByKey.get(row.deliverableTypeKey)?.status ?? null),
      })),
      buildInFlight: buildBusy,
    });
    if (!plan.submittable) {
      setSubmitError(plan.explanation);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await props.onSubmit({
        succeededKeys: plan.settled.map((entry) => entry.deliverableTypeKey),
        failedKeys: [],
        total: plan.total,
        succeeded: plan.settled,
        failed: [],
        source: "existing_documents",
        humanRationale: rationale.trim(),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "The gate submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const docStates = documents.map((d) => gateDocumentSignState(d, props.signOffReadable));
  const builtCount = docStates.filter((s) => s !== "not_built" && s !== "building" && s !== "failed").length;
  const signedCount = docStates.filter((s) => s === "signed").length;
  const docsSummary = noneBuilt
    ? "Gate documents not built"
    : buildBusy
      ? "Gate documents building"
      : `${signedCount} of ${documents.length} gate documents signed`;

  return (
    <MovesStepPage
      moveName={props.moveName}
      syntheticNote={props.syntheticNote}
      tabs={props.tabs}
      phases={props.phases}
      phaseCode={props.phaseCode}
      phaseName={props.phaseName}
      steps={props.steps}
      stepIndex={props.stepIndex}
      title={`Check the gate and sign off ${props.phaseName}`}
      intro={`Everything the ${props.phaseName} gate checks is on this page. Build and sign off the gate documents here; approving the ${props.phaseName.toLowerCase()} also submits it.`}
      nextAction={{
        ...model.nextAction,
        continueEnabled: model.nextAction.continueEnabled && !submitting,
      }}
      checks={model.checks.map((check) => ({
        met: check.met,
        unknown: check.unknown,
        level: check.level,
        text: check.text,
        note: check.note,
        targetRowId: check.targetRowId,
      }))}
      checksLabel={`Show all ${model.checks.length} checks`}
      checksWhenBlocked
      countLabel={model.countLabel}
      context={{
        items: [
          <b key="depth">Full depth</b>,
          `${builtCount} of ${documents.length} gate documents built`,
          docsSummary,
        ],
        details: [{ term: "Depth", detail: <span>{props.depthDetail}</span> }],
      }}
      blockedWork="Documents, signatures and the rationale are unchanged. They will appear again once the gate state can be read."
      avaBlocked="I couldn’t read the gate state, so I won’t guess at any check. Nothing here changed."
      rows={[...submitRow, docsRow, rationaleRow]}
      ava={
        <ul className={cx("ava-read")}>
          <li>I checked every {props.phaseName} gate rule against this Move.</li>
          {noneBuilt ? (
            <li>
              <b>The gate documents aren’t built yet.</b>{" "}
              <a href={`#row-${GATE_DOCUMENTS_ROW_ID}`}>Build them here</a>; signing comes after.
            </li>
          ) : null}
          {props.notBuilt.length > 0 ? (
            <li>
              <b>I left out</b> {props.notBuilt.map((d) => d.title).join(" and ")} for this
              Move’s change profile. If the profile changes, they come back.
            </li>
          ) : null}
          {props.canApprove && !rationale.trim() ? (
            <li>
              <b>I haven’t drafted</b> the <a href={`#row-${GATE_RATIONALE_ROW_ID}`}>approval rationale</a>.
              It is yours to write; it is recorded only when you approve and submit.
            </li>
          ) : null}
        </ul>
      }
      submittedLabel={!props.canApprove && model.footerNote ? model.footerNote : undefined}
      continueLabel={submitting ? "Submitting…" : `Approve and submit ${props.phaseName}`}
      onContinue={() => void submit()}
      onBack={props.onBack}
    />
  );
}
