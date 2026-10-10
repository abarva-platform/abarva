"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  DELIVERABLE_REGISTRY,
  type DeliverableSpec,
} from "@/lib/programs/deliverable-registry";
import { planPhaseGateSubmitWithoutBuild } from "@/lib/programs/phase-build-settlement";
import type { ChangeProfile } from "@/lib/programs/phase-workflow-registry";
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
    failureReason: row.blockers[0] ?? row.error ?? "The build did not finish.",
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
  /** True when `approverName` is the role, not a person's name. */
  approverIsRole?: boolean;
  /** The Move's change profile, which decides what some checks measure. */
  changeProfile?: ChangeProfile;
  onBeforeBuild?: () => Promise<void>;
  /** The governed gate submission. Throws with the refusal sentence. */
  onSubmit: (settlement: BuildSettledResult) => Promise<void>;
  /** P0 is approved from its captured brief and reviewed source evidence; it has no build batch. */
  originationReady?: boolean;
  /** The last P0 capture decision remains editable before approval. */
  originationRecommendation?: {
    value: string;
    saved: boolean;
    onSave: (value: string) => void;
  };
  /** Back to the previous step. */
  onBack?: () => void;
  /**
   * A sign-off or a finished build changed versions and sign-off records on
   * the server. Default: reload, so the server-rendered page reads them.
   */
  onRecordChanged?: () => void;
  /**
   * Wraps the page in the product's aVa dock. Receives aVa's opening briefing
   * for this step; without it the page renders on its own.
   */
  frame?: (page: ReactNode, briefing: string) => ReactNode;
}

function DocumentLine({
  moveId,
  doc,
  title,
  purpose,
  downloadUrl,
  canApprove,
  signOffReadable,
  buildBusy,
  onRecordChanged,
}: {
  moveId: string;
  doc: GateDocumentView;
  title: string;
  purpose?: string;
  downloadUrl: string | null;
  canApprove: boolean;
  signOffReadable: boolean;
  buildBusy: boolean;
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
    <a
      className={cx("link-btn")}
      href={downloadUrl}
      target="_blank"
      rel="noreferrer"
    >
      Open
    </a>
  ) : null;
  const refused = signOff.error?.canAcknowledge ? signOff.error : null;

  let stateText: ReactNode;
  let actions: ReactNode = null;
  if (state === "not_built") stateText = "Not built";
  else if (state === "building")
    stateText = doc.build === "queued" ? "Queued" : "Building…";
  else if (state === "failed") {
    stateText = doc.failureReason ?? "The build did not finish.";
  } else if (state === "signed") {
    stateText = (
      <>
        Signed v{doc.currentVersion} <span className={cx("status-ok")}>✓</span>
      </>
    );
    actions = buildBusy ? null : open;
  } else if (state === "unknown") {
    stateText = signOffReadable
      ? "Built · no sign-off record to sign against"
      : "Built · sign-off state could not be read";
    actions = open;
  } else {
    stateText =
      state === "superseded"
        ? `Signed v${doc.signedOffVersion} · v${doc.currentVersion} needs signing again`
        : `Built v${doc.currentVersion} · not signed`;
    actions = buildBusy ? null : canApprove ? (
      <>
        {open}
        {signing || refused ? null : (
          <button
            type="button"
            className={cx("btn-ink")}
            onClick={() => setSigning(true)}
          >
            Sign off
          </button>
        )}
      </>
    ) : (
      <>
        {open}
        <span className={cx("item-state")}>Awaiting sign-off</span>
      </>
    );
  }

  const busy = signOff.busy !== "idle";
  return (
    <li>
      <span>
        <span className={cx("item-name")}>{title}</span>
        {purpose ? <span className={cx("item-note")}>{purpose}</span> : null}
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
            <button
              type="button"
              className={cx("link-btn")}
              onClick={() => setSigning(false)}
            >
              Cancel
            </button>
          </span>
        </div>
      ) : null}
      {canApprove && refused ? (
        <div className={cx("warn-inline")} role="alert">
          <span>
            <span className={cx("lead")}>
              Not signed: {refused.blockers?.length ?? 0} client-readiness
              finding
              {(refused.blockers?.length ?? 0) === 1 ? "" : "s"} in v
              {doc.currentVersion}.
            </span>{" "}
            Fix the document, or sign it acknowledging them.
          </span>
          <ul className={cx("items")}>
            {(refused.blockers ?? []).map((blocker, index) => (
              <li key={`${blocker.kind ?? "finding"}-${index}`}>
                <span>
                  <span className={cx("tag", "t-fact")}>
                    {blocker.kind ?? "Finding"}
                  </span>
                  {blocker.match ? `“${blocker.match}”` : null}
                  {blocker.why ? (
                    <span className={cx("item-note")}>{blocker.why}</span>
                  ) : null}
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
              Sign off anyway, acknowledging {refused.blockers?.length ?? 0}{" "}
              finding
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
        .map((key) =>
          DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key),
        )
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

  // The approver's own words, recorded with the approval. No confirm step:
  // the footer's approve-and-submit enables once there is text (v1.5).
  const [rationale, setRationale] = useState("");
  const [recommendationDraft, setRecommendationDraft] = useState(
    props.originationRecommendation?.value ?? "",
  );
  const [rebuildAsk, setRebuildAsk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const artifactByKey = useMemo(() => {
    const byKey = new Map<string, PhaseBuildArtifact>();
    for (const artifact of props.initialArtifacts) {
      if (
        artifact.deliverableTypeKey &&
        !byKey.has(artifact.deliverableTypeKey)
      ) {
        byKey.set(artifact.deliverableTypeKey, artifact);
      }
    }
    return byKey;
  }, [props.initialArtifacts]);

  const rowByKey = new Map(
    build.rows.map((row) => [row.deliverableTypeKey, row]),
  );
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
    criteria: props.phaseNum === 1
      ? props.criteria.filter((criterion) => criterion.id !== "baseline_captured")
      : props.criteria,
    documents,
    signOffReadable: props.signOffReadable,
    canApprove: props.canApprove,
    approverName: props.approverName,
    approverIsRole: props.approverIsRole,
    changeProfile: props.changeProfile,
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

  const noneBuilt =
    documents.length > 0 && documents.every((d) => d.build === "none");
  const anyFailed = documents.some((d) => d.build === "failed");
  const docsSettled =
    documents.length > 0 &&
    documents.every(
      (d) => gateDocumentSignState(d, props.signOffReadable) === "signed",
    );

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
          : `Required by the ${props.phaseName} gate · the approver signs each version`,
      },
    ],
    middle: (
      <>
        {noneBuilt ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>Not built yet.</span> The gate
            documents are built from this phase&apos;s steps. Building takes a
            few minutes; you can leave the page.
          </p>
        ) : buildBusy ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>Building.</span> Each document becomes
            signable when it is built. You can leave the page.
          </p>
        ) : null}
        {props.buildHeldReason && !buildBusy ? (
          <p className={cx("lead-line")}>
            <span className={cx("lead")}>Build held.</span>{" "}
            {props.buildHeldReason}
          </p>
        ) : null}
        {build.error ? (
          <p className={cx("lead-line")} role="alert">
            <span className={cx("lead")}>The build did not start.</span>{" "}
            {build.error}
          </p>
        ) : null}
        {build.handOffSentence ? (
          <p className={cx("lead-line")}>{build.handOffSentence}</p>
        ) : null}
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
              <button
                type="button"
                className={cx("btn-line")}
                onClick={requestBuild}
              >
                Rebuild anyway
              </button>
              <button
                type="button"
                className={cx("link-btn")}
                onClick={() => setRebuildAsk(false)}
              >
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
                purpose={
                  specs.find((spec) => spec.deliverableTypeKey === doc.key)
                    ?.documentPurpose
                }
                downloadUrl={artifact?.downloadUrl ?? null}
                canApprove={props.canApprove}
                signOffReadable={props.signOffReadable}
                buildBusy={buildBusy}
                onRecordChanged={onRecordChanged}
              />
            );
          })}
        </ul>
        {supportSpecs.length > 0 ? (
          <>
            <span className={cx("eyebrow", "sub-eyebrow")}>
              Also built · not signed at the gate
            </span>
            <ul className={cx("items")}>
              {supportSpecs.map((spec) => {
                const artifact = artifactByKey.get(spec.deliverableTypeKey);
                return (
                  <li key={spec.deliverableTypeKey}>
                    <span>
                      <span className={cx("item-name")}>
                        {spec.documentTitle}
                      </span>
                    </span>
                    <span className={cx("item-actions")}>
                      {artifact ? (
                        <a
                          className={cx("link-btn")}
                          href={artifact.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        <span className={cx("item-state")}>
                          Built with the gate documents
                        </span>
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
            <span className={cx("eyebrow", "sub-eyebrow")}>
              Not built for this profile
            </span>
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
    // One build control for the whole set, at row level: a build always
    // rebuilds every gate document, so no single document offers one
    // (template v1.5).
    actions: buildBusy ? null : noneBuilt ? (
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={Boolean(props.buildHeldReason)}
        onClick={requestBuild}
      >
        Build the{" "}
        {documents.length === 1
          ? "gate document"
          : `${documents.length} gate documents`}
      </button>
    ) : anyFailed ? (
      <button
        type="button"
        className={cx("btn-ink")}
        disabled={Boolean(props.buildHeldReason)}
        onClick={requestBuild}
      >
        Build again
      </button>
    ) : rebuildAsk ? null : (
      <button
        type="button"
        className={cx("link-btn")}
        disabled={Boolean(props.buildHeldReason)}
        onClick={requestBuild}
      >
        Rebuild the gate documents…
      </button>
    ),
    basis: [
      {
        kind: "team",
        text: "A signature is bound to one version. Rebuilding or uploading creates a new, unsigned version; the signed one stays in the version history.",
        cite: "Sign-off rule",
      },
    ],
  };

  const rationaleField = (
    <div className={cx("field")}>
      <label className={cx("q-label")} htmlFor="gate-rationale">
        {props.phaseNum === 0
          ? "Why origination should pass the gate"
          : `Why this ${props.phaseName.toLowerCase()} should pass the gate`}
      </label>
      <textarea
        id="gate-rationale"
        className={cx("q-input")}
        rows={4}
        maxLength={2000}
        value={rationale}
        placeholder={
          props.phaseNum === 0
            ? "e.g. I reviewed the origination brief and source evidence and approve moving into Charter because…"
            : `e.g. I reviewed the ${props.phaseName.toLowerCase()} answers, evidence and signed deliverables and approve this transition because…`
        }
        onChange={(event) => setRationale(event.target.value)}
      />
    </div>
  );

  const rationaleRow: StepPageRow = {
    id: GATE_RATIONALE_ROW_ID,
    eyebrow: "Approval",
    rank: 2,
    shortName: "approval rationale",
    subject: "Approval rationale",
    state: "decision",
    clause: "write the approval rationale",
    facts: [
      {
        kind: "team",
        text:
          props.phaseNum === 0
            ? `Recorded with ${props.canApprove ? "your" : "the approver's"} approval of the origination brief`
            : `Recorded with ${props.canApprove ? "your" : "the approver's"} approval · approving also submits ${props.phaseName}`,
      },
    ],
    middle: !props.canApprove ? (
      <p className={cx("proposal")}>
        The approver writes the rationale when approving.
      </p>
    ) : (
      rationaleField
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
      setSubmitError(
        err instanceof Error ? err.message : "The gate submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // aVa's opening turn in the dock: what it checked, left out and did not
  // draft. Plain sentences, no figures.
  const briefing = (
    model.nextAction.state === "blocked"
      ? [
          "I couldn't read the gate state, so I won't guess at any check. Nothing here changed.",
        ]
      : [
          `I checked every ${props.phaseName} gate rule against this Move.`,
          noneBuilt
            ? "The gate documents aren't built yet. Build them on this page; signing comes after."
            : null,
          props.notBuilt.length > 0
            ? `I left out ${listNames(props.notBuilt.map((d) => d.title))} for this Move's change profile. If the profile changes, they come back.`
            : null,
          props.canApprove && !rationale.trim()
            ? "I haven't drafted the approval rationale. It is yours to write; it is recorded only when you approve and submit."
            : null,
          "Drafts stay drafts until you accept them. Numbers come only from approved evidence or labelled estimates; I never write them.",
        ]
  )
    .filter(Boolean)
    .join("\n\n");

  if (props.phaseNum === 0) {
    const recommendation = props.originationRecommendation;
    const recommendationReady = !recommendation ||
      (recommendation.value.trim().length > 0 && recommendation.saved &&
        recommendationDraft.trim() === recommendation.value.trim());
    const recommendationRow: StepPageRow[] = recommendation ? [{
      id: "P0-RECOMMENDATION",
      eyebrow: "Origination decision",
      rank: 1,
      shortName: "recommendation to advance",
      subject: "Recommendation to advance",
      state: recommendationReady ? "settled" : "decision",
      clause: "record the recommendation to advance",
      middle: <div className={cx("field")}>
        <label className={cx("q-label")} htmlFor="p0-recommendation">Why should this Move advance to Charter?</label>
        <textarea id="p0-recommendation" className={cx("q-input")} rows={3}
          value={recommendationDraft}
          onChange={(event) => setRecommendationDraft(event.target.value)} />
        {!recommendationReady && recommendation.value.trim() && !recommendation.saved ? <p className={cx("item-note")}>Saving the recommendation…</p> : null}
      </div>,
      actions: recommendationReady ? null : <button type="button" className={cx("btn-ink")}
        disabled={!recommendationDraft.trim()}
        onClick={() => recommendation.onSave(recommendationDraft.trim())}>Save recommendation</button>,
    }] : [];
    const readable = props.criteria.every((criterion) => criterion.verified);
    const approvalInputsReady =
      readable && props.originationReady === true && recommendationReady && props.canApprove;
    const mayApprove =
      approvalInputsReady &&
      rationale.trim().length > 0 &&
      !submitting;
    const approveOrigination = async () => {
      if (!mayApprove) return;
      setSubmitError(null);
      setSubmitting(true);
      try {
        await props.onSubmit({
          succeededKeys: ["origination_brief"],
          failedKeys: [],
          total: 1,
          succeeded: [
            { deliverableTypeKey: "origination_brief", gateArtifact: true },
          ],
          failed: [],
          source: "existing_documents",
          humanRationale: rationale.trim(),
        });
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "The origination approval failed.",
        );
      } finally {
        setSubmitting(false);
      }
    };
    const originationPage = (
      <MovesStepPage
        moveName={props.moveName}
        tabs={props.tabs}
        phases={props.phases}
        phaseCode={props.phaseCode}
        phaseName={props.phaseName}
        steps={props.steps}
        stepIndex={props.stepIndex}
        title="Approve origination"
        intro="Review the captured brief and source evidence, then record a person's approval. The seed checks clear only after that approval."
        nextAction={{
          state: mayApprove
            ? "ready"
            : approvalInputsReady
              ? "in_progress"
              : "blocked",
          eyebrow: mayApprove
            ? "Ready for approval"
            : approvalInputsReady
              ? "Your approval"
              : "Approval pending",
          sentence: !readable
            ? "Wait for the gate checks to be read."
            : !props.canApprove
              ? "Wait for an authorized approver."
            : !recommendationReady
              ? "Record the recommendation to advance."
            : !props.originationReady
              ? props.buildHeldReason ?? "Complete the brief and review its source evidence."
              : "Write the approval rationale and approve the origination brief.",
          settled: recommendationReady ? 1 : 0,
          total: recommendation ? 2 : 1,
          continueEnabled: mayApprove,
        }}
        checks={model.checks.map((check) => ({
          met: check.met,
          unknown: check.unknown,
          level: check.level,
          text: check.text,
          note:
            !check.met &&
            (check.id === "program_seed_recorded" ||
              check.id === "value_hypothesis_seed")
              ? "Recorded only after a person approves the origination brief."
              : check.note,
        }))}
        checksLabel={`Show all ${model.checks.length} checks`}
        checksWhenBlocked
        countLabel="Approval not yet recorded"
        context={{ items: [<b key="depth">Full depth</b>], details: [] }}
        blockedWork={props.canApprove ? <div className={cx("warn-inline")}>
          {!recommendationReady ? <section className={cx("field")}>
            {recommendationRow[0]?.middle}
            {recommendationRow[0]?.actions}
          </section> : null}
          {rationaleField}
        </div> : undefined}
        rows={[...submitRow, ...recommendationRow, rationaleRow]}
        continueLabel={submitting ? "Approving…" : "Approve origination"}
        onContinue={() => void approveOrigination()}
        onBack={props.onBack}
      />
    );
    return props.frame ? props.frame(originationPage, briefing) : originationPage;
  }

  const page = (
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
        items: [<b key="depth">Full depth</b>],
        // No Details: until the readiness workbook is wired here, it would
        // only repeat the depth (v1.6).
        details: [],
      }}
      // Unsaved input survives Blocked (template v1.5): the rationale stays
      // editable while the gate state cannot be read.
      blockedWork={
        <div className={cx("empty-note")}>
          <p>Documents and signatures are unchanged.</p>
          {props.canApprove ? rationaleField : null}
        </div>
      }
      blockedAction={{ label: "Try again", onClick: onRecordChanged }}
      carry={{
        label:
          props.phaseNum === 5
            ? "Carries to Tower"
            : `Carries to P${props.phaseNum + 1}`,
        text: " This phase's approved answers and signed documents.",
      }}
      decisionGroupTitle={
        props.canApprove ? undefined : "Waiting on the gate approver"
      }
      rows={[...submitRow, docsRow, rationaleRow]}
      submittedLabel={
        !props.canApprove && model.footerNote ? model.footerNote : undefined
      }
      continueLabel={
        submitting ? "Submitting…" : `Approve and submit ${props.phaseName}`
      }
      onContinue={() => void submit()}
      onBack={props.onBack}
    />
  );
  return props.frame ? props.frame(page, briefing) : page;
}
