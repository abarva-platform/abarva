"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type {
  SimpleStageRequirementView,
  SimpleStageScreenView,
} from "@/lib/source/simple-front";
import type { SourceStageKey } from "@/lib/source/types";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import { CANVAS } from "./canvas-tokens";

interface SimpleStageFrontProps {
  eventId: string;
  stage: SourceStageKey;
  view: SimpleStageScreenView;
  generating: boolean;
  registryArtifacts: SourceArtifactRegistryRecord[];
  onGenerateArtifact: (
    code: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; error: string; detail: string; missingUpstream?: string[] }
  >;
  onAdvanceStage: (stage: SourceStageKey) => void;
  onRefresh: () => void;
  advanced: ReactNode;
  spotlight?: ReactNode;
}

export function SimpleStageFront({
  eventId,
  stage,
  view,
  generating,
  registryArtifacts,
  onGenerateArtifact,
  onAdvanceStage,
  onRefresh,
  advanced,
  spotlight,
}: SimpleStageFrontProps) {
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerPending, setAnswerPending] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const latestDoc = latestGeneratedDoc(
    registryArtifacts,
    view.deliverable.artifactCode,
  );
  const readyRequiredCount = view.required.filter((requirement) =>
    isRequirementReady(requirement),
  ).length;
  const remainingRequiredCount = Math.max(
    0,
    view.required.length - readyRequiredCount,
  );
  const allRequiredReady =
    view.required.length > 0 && remainingRequiredCount === 0;
  const nextStageName = view.nextStep.label.replace(/^Issue the\s+/i, "");

  const handleUpload = async (
    requirement: SimpleStageRequirementView,
    file: File | null,
  ) => {
    if (!file) return;
    setMessage(null);
    setUploadPending(requirement.requirementId);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("stageKey", stage);
    formData.set("artifactCode", view.deliverable.artifactCode);
    formData.set("dataClassification", "Confidential");
    try {
      const res = await fetch(`/api/v1/source/${eventId}/artifacts/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          detail?: string;
          error?: string;
        } | null;
        setMessage(payload?.detail ?? payload?.error ?? "Upload failed.");
        return;
      }
      setMessage(`${requirement.label} uploaded.`);
      onRefresh();
    } finally {
      setUploadPending(null);
      const input = fileInputs.current[requirement.requirementId];
      if (input) input.value = "";
    }
  };

  const handleAnswer = async (requirement: SimpleStageRequirementView) => {
    const answer = answerText.trim();
    if (answer.length < 8) {
      setMessage("Add a short answer first.");
      return;
    }
    setMessage(null);
    setAnswerPending(requirement.requirementId);
    try {
      const res = await fetch(
        `/api/v1/source/${eventId}/evidence/${encodeURIComponent(requirement.requirementId)}/answer`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answer, stage }),
        },
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          detail?: string;
          error?: string;
        } | null;
        setMessage(
          payload?.detail ?? payload?.error ?? "Answer was not saved.",
        );
        return;
      }
      setAnswerFor(null);
      setAnswerText("");
      setMessage(`${requirement.label} noted as client-stated evidence.`);
      onRefresh();
    } finally {
      setAnswerPending(null);
    }
  };

  const handleGenerate = async () => {
    setMessage(null);
    const result = await onGenerateArtifact(view.deliverable.artifactCode);
    if (result.ok) {
      setMessage(`${view.deliverable.name} is ready.`);
      onRefresh();
    } else {
      setMessage(result.detail);
    }
  };

  // Approving a step is the only decision: it writes the step's deliverable AND
  // moves on. No separate "generate" click — the write runs server-side and lands
  // in the deliverables explorer / File Cabinet, so we never block the advance on
  // a slow board-grade generation. Mirrors the Moves "Approve & Build" model.
  const handleApproveAndContinue = async () => {
    if (!allRequiredReady) {
      setMessage(
        `${remainingRequiredCount} required input${remainingRequiredCount === 1 ? "" : "s"} still open before this stage can move to approval.`,
      );
      return;
    }
    const nextStage = view.nextStep.stage;
    if (!nextStage) {
      // Final stage: nothing to advance to, so approving just writes the doc.
      await handleGenerate();
      return;
    }
    setMessage(`Writing your ${view.deliverable.name} and moving on…`);
    void onGenerateArtifact(view.deliverable.artifactCode);
    onAdvanceStage(nextStage);
  };

  return (
    <section
      data-testid="source-simple-front"
      aria-label="Start here"
      style={SHELL_STYLE}
    >
      <div style={TOP_ROW_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Start here</div>
          <h2 style={TITLE_STYLE}>Complete {view.stageLabel} evidence</h2>
          <p style={SUBTITLE_STYLE}>
            Required rows block approval until they reach the target state.
            Optional rows improve confidence, artifacts, and aVa answers.
          </p>
        </div>
        <button
          type="button"
          data-testid="source-simple-front-advanced-toggle"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((open) => !open)}
          style={SECONDARY_BUTTON_STYLE}
        >
          {advancedOpen ? "Hide advanced" : "Advanced"}
        </button>
      </div>

      <WorkingSessionGuide view={view} />

      {spotlight ? (
        <div
          data-testid="source-simple-front-spotlight"
          style={SPOTLIGHT_STYLE}
        >
          {spotlight}
        </div>
      ) : null}

      <div style={EVIDENCE_TABLE_STYLE} aria-label="Required evidence">
        <div style={TABLE_HEADER_STYLE}>
          <span>Evidence needed</span>
          <span>Where to get it and what to load</span>
          <span>Gate status</span>
          <span>Action</span>
        </div>
        {view.required.map((requirement, index) => {
          const isAnswerOpen = answerFor === requirement.requirementId;
          return (
            <div
              key={requirement.requirementId}
              data-testid={`source-simple-front-requirement-${requirement.requirementId}`}
              style={ASK_ROW_STYLE}
            >
              <div style={ASK_COPY_STYLE}>
                <div style={ASK_TITLE_ROW_STYLE}>
                  <span style={ASK_NUMBER_STYLE}>{index + 1}</span>
                  <strong style={ASK_TITLE_STYLE}>{requirement.label}</strong>
                  <span style={REQUIRED_BADGE_STYLE}>Required</span>
                </div>
                <p style={ASK_META_STYLE}>{requirement.why}</p>
              </div>
              <div style={ASK_COPY_STYLE}>
                <EvidenceSourceSummary requirement={requirement} />
                {isAnswerOpen ? (
                  <div style={ANSWER_BOX_STYLE}>
                    <textarea
                      data-testid={`source-simple-front-answer-${requirement.requirementId}`}
                      value={answerText}
                      onChange={(event) => setAnswerText(event.target.value)}
                      placeholder="Type the answer you would have given in a meeting."
                      style={ANSWER_TEXTAREA_STYLE}
                    />
                    <div style={ANSWER_ACTIONS_STYLE}>
                      <button
                        type="button"
                        onClick={() => handleAnswer(requirement)}
                        disabled={answerPending === requirement.requirementId}
                        style={PRIMARY_SMALL_STYLE}
                      >
                        Save answer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAnswerFor(null);
                          setAnswerText("");
                        }}
                        style={QUIET_BUTTON_STYLE}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <span style={stateChipStyle(requirement.state)}>
                  {requirementStatusLabel(requirement)}
                </span>
                <p style={STATUS_HELP_STYLE}>
                  {isRequirementReady(requirement)
                    ? `Meets ${requirement.minimumState}.`
                    : `Blocks approval until ${requirement.minimumState}.`}
                </p>
              </div>
              <div style={ASK_ACTIONS_STYLE}>
                <a
                  href={`/api/v1/source/${eventId}/evidence/${encodeURIComponent(
                    requirement.requirementId,
                  )}/template`}
                  data-testid={`source-simple-front-template-${requirement.requirementId}`}
                  style={TEMPLATE_LINK_STYLE}
                  title="Download a blank, pre-shaped form for this item. Fill it in and upload it back — it attaches here automatically."
                >
                  Template
                </a>
                <input
                  ref={(node) => {
                    fileInputs.current[requirement.requirementId] = node;
                  }}
                  data-testid={`source-simple-front-file-${requirement.requirementId}`}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(event) =>
                    void handleUpload(
                      requirement,
                      event.currentTarget.files?.[0] ?? null,
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    fileInputs.current[requirement.requirementId]?.click()
                  }
                  disabled={uploadPending === requirement.requirementId}
                  style={PRIMARY_SMALL_STYLE}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnswerFor(requirement.requirementId);
                    setAnswerText("");
                  }}
                  style={SECONDARY_SMALL_STYLE}
                >
                  Answer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {view.extras.length > 0 ? (
        <details
          data-testid="source-simple-front-optional-evidence"
          style={EXTRAS_STYLE}
        >
          <summary style={EXTRAS_SUMMARY_STYLE}>
            Optional evidence that improves confidence
          </summary>
          <div style={EXTRAS_BODY_STYLE}>
            <p style={EXTRAS_HELP_STYLE}>
              These rows do not block the gate, but they make artifacts,
              scoring, pricing, or aVa answers more defensible.
            </p>
            <div style={EVIDENCE_TABLE_STYLE} aria-label="Optional evidence">
              <div style={OPTIONAL_TABLE_HEADER_STYLE}>
                <span>Optional evidence</span>
                <span>Where to get it and what to load</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {view.extras.map((requirement) => {
                const isAnswerOpen = answerFor === requirement.requirementId;
                return (
                  <div
                    key={requirement.requirementId}
                    data-testid={`source-simple-front-optional-${requirement.requirementId}`}
                    style={OPTIONAL_ROW_STYLE}
                  >
                    <div style={ASK_COPY_STYLE}>
                      <div style={ASK_TITLE_ROW_STYLE}>
                        <strong style={ASK_TITLE_STYLE}>
                          {requirement.label}
                        </strong>
                        <span style={OPTIONAL_BADGE_STYLE}>Optional</span>
                      </div>
                      <p style={ASK_META_STYLE}>{requirement.why}</p>
                    </div>
                    <div style={ASK_COPY_STYLE}>
                      <EvidenceSourceSummary requirement={requirement} />
                      {isAnswerOpen ? (
                        <div style={ANSWER_BOX_STYLE}>
                          <textarea
                            data-testid={`source-simple-front-answer-${requirement.requirementId}`}
                            value={answerText}
                            onChange={(event) =>
                              setAnswerText(event.target.value)
                            }
                            placeholder="Type the answer you would have given in a meeting."
                            style={ANSWER_TEXTAREA_STYLE}
                          />
                          <div style={ANSWER_ACTIONS_STYLE}>
                            <button
                              type="button"
                              onClick={() => handleAnswer(requirement)}
                              disabled={
                                answerPending === requirement.requirementId
                              }
                              style={PRIMARY_SMALL_STYLE}
                            >
                              Save answer
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAnswerFor(null);
                                setAnswerText("");
                              }}
                              style={QUIET_BUTTON_STYLE}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <span style={stateChipStyle(requirement.state)}>
                        {requirementStatusLabel(requirement)}
                      </span>
                      <p style={STATUS_HELP_STYLE}>
                        Helps confidence; does not block approval.
                      </p>
                    </div>
                    <div style={ASK_ACTIONS_STYLE}>
                      <a
                        href={`/api/v1/source/${eventId}/evidence/${encodeURIComponent(
                          requirement.requirementId,
                        )}/template`}
                        data-testid={`source-simple-front-template-${requirement.requirementId}`}
                        style={TEMPLATE_LINK_STYLE}
                        title="Download a blank, pre-shaped form for this item. Fill it in and upload it back — it attaches here automatically."
                      >
                        Template
                      </a>
                      <input
                        ref={(node) => {
                          fileInputs.current[requirement.requirementId] = node;
                        }}
                        data-testid={`source-simple-front-file-${requirement.requirementId}`}
                        type="file"
                        style={{ display: "none" }}
                        onChange={(event) =>
                          void handleUpload(
                            requirement,
                            event.currentTarget.files?.[0] ?? null,
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          fileInputs.current[requirement.requirementId]?.click()
                        }
                        disabled={uploadPending === requirement.requirementId}
                        style={SECONDARY_SMALL_STYLE}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAnswerFor(requirement.requirementId);
                          setAnswerText("");
                        }}
                        style={QUIET_BUTTON_STYLE}
                      >
                        Answer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </details>
      ) : null}

      <ArtifactContextManifest view={view} />

      <div style={NEXT_GATE_STYLE} data-ready={allRequiredReady}>
        <div style={NEXT_GATE_COPY_STYLE}>
          <div style={EYEBROW_STYLE}>Approval gate</div>
          <h3 style={NEXT_GATE_TITLE_STYLE}>
            {allRequiredReady
              ? `Ready to open ${nextStageName}`
              : `${remainingRequiredCount} required input${remainingRequiredCount === 1 ? "" : "s"} still open`}
          </h3>
          <p style={NEXT_GATE_BODY_STYLE}>
            {allRequiredReady
              ? `Approval writes ${view.deliverable.name} and advances this event to ${nextStageName}.`
              : `Finish the evidence rows above, or use Advanced when a named owner needs to approve with gaps carried forward.`}
          </p>
        </div>
        <button
          type="button"
          data-testid="source-simple-front-approve"
          onClick={() => void handleApproveAndContinue()}
          disabled={generating || !allRequiredReady}
          style={primaryButtonStyle(allRequiredReady)}
        >
          {generating
            ? "Writing..."
            : !allRequiredReady
              ? `Complete ${remainingRequiredCount} input${remainingRequiredCount === 1 ? "" : "s"}`
              : view.nextStep.stage
                ? `Open approval gate → ${nextStageName}`
                : `Write ${view.deliverable.name}`}
        </button>
        {latestDoc ? (
          <Link
            data-testid="source-simple-front-download"
            href={`/api/v1/source/artifacts/${encodeURIComponent(latestDoc.id)}/download`}
            download
            style={DOWNLOAD_LINK_STYLE}
          >
            Download
          </Link>
        ) : null}
      </div>

      {message ? (
        <p data-testid="source-simple-front-message" style={MESSAGE_STYLE}>
          {message}
        </p>
      ) : null}

      {advancedOpen ? (
        <div data-testid="source-simple-front-advanced" style={ADVANCED_STYLE}>
          {advanced}
        </div>
      ) : null}
    </section>
  );
}

function WorkingSessionGuide({ view }: { view: SimpleStageScreenView }) {
  const allRows = [...view.required, ...view.extras];
  const sourceSystems = uniqueList(
    allRows.flatMap((requirement) => requirement.sourceSystems),
  );
  const acceptedFormats = uniqueList(
    allRows.flatMap((requirement) => requirement.acceptedFileTypes),
  );
  const criticalFields = uniqueList(
    view.required.flatMap((requirement) => requirement.criticalFields),
  );
  const requiredOpen = view.required.filter(
    (requirement) => !isRequirementReady(requirement),
  );
  const firstRequiredGrain =
    view.required[0]?.recordGrain ?? "one governed evidence row per item";
  const fieldPreview = previewList(criticalFields, 5);
  const sourcePreview = previewList(sourceSystems, 5);
  const formatPreview = previewList(acceptedFormats, 4);
  const blockingCopy =
    requiredOpen.length === 1
      ? "1 blocking input remains"
      : `${requiredOpen.length} blocking inputs remain`;

  return (
    <section
      data-testid="source-simple-front-session-guide"
      aria-label={`${view.stageLabel} working session guide`}
      style={SESSION_GUIDE_STYLE}
    >
      <div style={SESSION_GUIDE_HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Working session guide</div>
          <h3 style={SESSION_GUIDE_TITLE_STYLE}>
            Run the {view.stageLabel} working session with the right evidence.
          </h3>
        </div>
        <span style={SESSION_GUIDE_BADGE_STYLE}>
          {view.required.length} required · {view.extras.length} optional
        </span>
      </div>
      <div style={SESSION_GUIDE_GRID_STYLE}>
        <GuideCard
          title="Invite"
          body={`Sponsor, sourcing lead, finance/procurement, and owners for ${sourcePreview || "the requested systems"}.`}
        />
        <GuideCard
          title="Pull"
          body={`${sourcePreview || "Source systems"}; load at ${firstRequiredGrain}.`}
        />
        <GuideCard
          title="Template"
          body={`${formatPreview || "CSV/XLSX/PDF"} accepted. Required fields include ${fieldPreview || "the fields named in each row"}.`}
        />
        <GuideCard
          title="Unlock"
          body={
            requiredOpen.length > 0
              ? `${blockingCopy} before ${view.deliverable.name}.`
              : `Approval writes ${view.deliverable.name} and opens ${view.nextStep.label.replace(/^Issue the\s+/i, "")}.`
          }
        />
      </div>
    </section>
  );
}

function GuideCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={SESSION_GUIDE_CARD_STYLE}>
      <div style={SESSION_GUIDE_CARD_TITLE_STYLE}>{title}</div>
      <p style={SESSION_GUIDE_CARD_BODY_STYLE}>{body}</p>
    </div>
  );
}

function ArtifactContextManifest({ view }: { view: SimpleStageScreenView }) {
  const requiredReady = view.required.filter((requirement) =>
    isRequirementReady(requirement),
  );
  const optionalReady = view.extras.filter((requirement) =>
    isRequirementReady(requirement),
  );
  const pendingRequired = view.required.filter(
    (requirement) => !isRequirementReady(requirement),
  );
  const optionalPending = view.extras.filter(
    (requirement) => !isRequirementReady(requirement),
  );
  const used = [...requiredReady, ...optionalReady];

  return (
    <section
      data-testid="source-simple-front-context-manifest"
      aria-label="Artifact context manifest"
      style={CONTEXT_MANIFEST_STYLE}
    >
      <div style={CONTEXT_MANIFEST_HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Artifact context</div>
          <h3 style={CONTEXT_MANIFEST_TITLE_STYLE}>
            What will support {view.deliverable.name}
          </h3>
        </div>
        <span style={CONTEXT_MANIFEST_BADGE_STYLE}>
          {used.length} used · {pendingRequired.length} pending
        </span>
      </div>
      <div style={CONTEXT_MANIFEST_GRID_STYLE}>
        <ManifestColumn
          title="Used as evidence"
          tone="ready"
          empty="No usable evidence yet."
          rows={used.map((requirement) => manifestRow(requirement))}
        />
        <ManifestColumn
          title="Carried as gaps"
          tone="pending"
          empty="No required gaps."
          rows={pendingRequired.map((requirement) => manifestRow(requirement))}
        />
        <ManifestColumn
          title="Not used yet"
          tone="optional"
          empty="No optional items outside the artifact context."
          rows={optionalPending.map((requirement) => manifestRow(requirement))}
        />
      </div>
      <p style={CONTEXT_MANIFEST_FOOTNOTE_STYLE}>
        After approval, the generation receipt records the model, prompt
        version, token usage, quality checks, and the upstream evidence codes.
      </p>
    </section>
  );
}

function ManifestColumn({
  title,
  tone,
  empty,
  rows,
}: {
  title: string;
  tone: "ready" | "pending" | "optional";
  empty: string;
  rows: string[];
}) {
  return (
    <div style={CONTEXT_MANIFEST_COLUMN_STYLE}>
      <div style={CONTEXT_MANIFEST_COLUMN_TITLE_STYLE}>
        <span style={manifestDotStyle(tone)} aria-hidden="true" />
        {title}
      </div>
      {rows.length > 0 ? (
        <ul style={CONTEXT_MANIFEST_LIST_STYLE}>
          {rows.slice(0, 4).map((row) => (
            <li key={row} style={CONTEXT_MANIFEST_ITEM_STYLE}>
              {row}
            </li>
          ))}
          {rows.length > 4 ? (
            <li style={CONTEXT_MANIFEST_ITEM_STYLE}>+{rows.length - 4} more</li>
          ) : null}
        </ul>
      ) : (
        <p style={CONTEXT_MANIFEST_EMPTY_STYLE}>{empty}</p>
      )}
    </div>
  );
}

function manifestRow(requirement: SimpleStageRequirementView): string {
  return `${requirement.label} · ${requirement.state}`;
}

function uniqueList(values: readonly string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function previewList(values: readonly string[], limit: number): string {
  const visible = values.slice(0, limit);
  const suffix = values.length > limit ? ` +${values.length - limit}` : "";
  return `${visible.join(", ")}${suffix}`;
}

function latestGeneratedDoc(
  rows: SourceArtifactRegistryRecord[],
  artifactCode: string,
): SourceArtifactRegistryRecord | null {
  return (
    rows
      .filter((row) => {
        const name =
          typeof row.originalName === "string"
            ? row.originalName.toLowerCase()
            : "";
        return (
          row.sourceOrigin === "generated" &&
          (name.includes(artifactCode.toLowerCase()) ||
            name.includes(artifactCode.replace(/^d\d+_/, "").toLowerCase()))
        );
      })
      .sort((a, b) =>
        safeRegistryString(b.createdAt).localeCompare(
          safeRegistryString(a.createdAt),
        ),
      )[0] ?? null
  );
}

function safeRegistryString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isRequirementReady(requirement: SimpleStageRequirementView): boolean {
  return (
    READINESS_RANK[requirement.state] >=
    READINESS_RANK[requirement.minimumState]
  );
}

function requirementStatusLabel(
  requirement: SimpleStageRequirementView,
): string {
  if (isRequirementReady(requirement)) return "Ready";
  if (requirement.state === "Not Requested") return "Needed";
  return requirement.state;
}

function EvidenceSourceSummary({
  requirement,
}: {
  requirement: SimpleStageRequirementView;
}) {
  const systems = requirement.sourceSystems.slice(0, 3).join(", ");
  const extraSystemCount = Math.max(0, requirement.sourceSystems.length - 3);
  const fields = requirement.criticalFields.slice(0, 4).join(", ");
  const extraFieldCount = Math.max(0, requirement.criticalFields.length - 4);
  return (
    <div style={SOURCE_SUMMARY_STYLE}>
      <div style={SOURCE_LINE_STYLE}>
        <strong>Get from:</strong> {systems}
        {extraSystemCount > 0 ? ` +${extraSystemCount}` : ""}
      </div>
      <div style={SOURCE_LINE_STYLE}>
        <strong>Load:</strong> {requirement.recordGrain}
      </div>
      <div style={SOURCE_LINE_STYLE}>
        <strong>Parse:</strong> {fields}
        {extraFieldCount > 0 ? ` +${extraFieldCount}` : ""}
      </div>
      <div style={SOURCE_LINE_STYLE}>
        <strong>Formats:</strong> {requirement.acceptedFileTypes.join(", ")}
      </div>
    </div>
  );
}

const READINESS_RANK: Record<
  | SimpleStageRequirementView["state"]
  | SimpleStageRequirementView["minimumState"],
  number
> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

function stateChipStyle(
  state: SimpleStageRequirementView["state"],
): CSSProperties {
  const color =
    state === "Usable Evidence" || state === "Available"
      ? CANVAS.ACTIVE
      : "#b7791f";
  return {
    border: `1px solid ${color}33`,
    borderRadius: 999,
    padding: "3px 8px",
    color,
    background: `${color}10`,
    fontFamily: CANVAS.SANS,
    fontSize: 11,
    fontWeight: 700,
  };
}

function manifestDotStyle(tone: "ready" | "pending" | "optional") {
  const color =
    tone === "ready"
      ? CANVAS.ACTIVE
      : tone === "pending"
        ? "#b83232"
        : "#b7791f";
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    boxShadow: `0 0 0 3px ${color}18`,
    flex: "0 0 auto",
  } satisfies CSSProperties;
}

const SHELL_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  padding: 24,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 10,
  background: CANVAS.CARD,
};

const TOP_ROW_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const TITLE_STYLE: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 26,
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const SUBTITLE_STYLE: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  color: CANVAS.INK_SOFT,
};

const SESSION_GUIDE_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 10,
  padding: "14px 16px",
  background: "rgba(30,124,90,0.045)",
};

const SPOTLIGHT_STYLE: CSSProperties = {
  display: "grid",
};

const SESSION_GUIDE_HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "flex-start",
};

const SESSION_GUIDE_TITLE_STYLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 15,
  lineHeight: 1.25,
  color: CANVAS.INK,
};

const SESSION_GUIDE_BADGE_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  padding: "5px 9px",
  background: CANVAS.CARD,
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  whiteSpace: "nowrap",
};

const SESSION_GUIDE_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
};

const SESSION_GUIDE_CARD_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.CARD,
  padding: "10px 12px",
  minWidth: 0,
};

const SESSION_GUIDE_CARD_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.ACTIVE,
};

const SESSION_GUIDE_CARD_BODY_STYLE: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.38,
  color: CANVAS.INK_SOFT,
};

const EVIDENCE_TABLE_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 10,
  overflow: "hidden",
};

const TABLE_HEADER_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 1.25fr) minmax(220px, 1fr) 104px minmax(230px, auto)",
  gap: 14,
  alignItems: "center",
  padding: "10px 14px",
  background: "rgba(12,26,58,0.035)",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const OPTIONAL_TABLE_HEADER_STYLE: CSSProperties = {
  ...TABLE_HEADER_STYLE,
  gridTemplateColumns:
    "minmax(220px, 1.25fr) minmax(220px, 1fr) 104px minmax(210px, auto)",
};

const ASK_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 1.25fr) minmax(220px, 1fr) 104px minmax(230px, auto)",
  gap: 14,
  alignItems: "start",
  padding: "14px",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const OPTIONAL_ROW_STYLE: CSSProperties = {
  ...ASK_ROW_STYLE,
  gridTemplateColumns:
    "minmax(220px, 1.25fr) minmax(220px, 1fr) 104px minmax(210px, auto)",
};

const ASK_NUMBER_STYLE: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(12,26,58,0.06)",
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  fontWeight: 800,
  flex: "0 0 auto",
};

const ASK_COPY_STYLE: CSSProperties = { minWidth: 0 };

const ASK_TITLE_ROW_STYLE: CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const ASK_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 15,
  color: CANVAS.INK,
};

const REQUIRED_BADGE_STYLE: CSSProperties = {
  border: "1px solid rgba(12,26,58,0.16)",
  borderRadius: 999,
  padding: "3px 7px",
  background: "rgba(12,26,58,0.055)",
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
};

const OPTIONAL_BADGE_STYLE: CSSProperties = {
  ...REQUIRED_BADGE_STYLE,
  background: "rgba(30,124,90,0.08)",
  borderColor: "rgba(30,124,90,0.18)",
  color: CANVAS.ACTIVE,
};

const ASK_META_STYLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
};

const SOURCE_SUMMARY_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.35,
};

const SOURCE_LINE_STYLE: CSSProperties = {
  minWidth: 0,
};

const STATUS_HELP_STYLE: CSSProperties = {
  margin: "6px 0 0",
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  lineHeight: 1.35,
};

const ASK_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const BASE_BUTTON_STYLE: CSSProperties = {
  borderRadius: 8,
  padding: "9px 12px",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 750,
  cursor: "pointer",
};

const PRIMARY_SMALL_STYLE: CSSProperties = {
  ...BASE_BUTTON_STYLE,
  border: `1px solid ${CANVAS.INK}`,
  background: CANVAS.INK,
  color: CANVAS.CARD,
};

const SECONDARY_SMALL_STYLE: CSSProperties = {
  ...BASE_BUTTON_STYLE,
  border: `1px solid ${CANVAS.RULE}`,
  background: CANVAS.CARD,
  color: CANVAS.INK,
};

const QUIET_BUTTON_STYLE: CSSProperties = {
  ...BASE_BUTTON_STYLE,
  border: "1px solid transparent",
  background: "transparent",
  color: CANVAS.INK_MUTED,
};

const TEMPLATE_LINK_STYLE: CSSProperties = {
  ...QUIET_BUTTON_STYLE,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const ANSWER_BOX_STYLE: CSSProperties = {
  marginTop: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const ANSWER_TEXTAREA_STYLE: CSSProperties = {
  width: "100%",
  minHeight: 82,
  resize: "vertical",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: 12,
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  lineHeight: 1.45,
};

const ANSWER_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  gap: 8,
};

const EXTRAS_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  padding: "10px 12px",
};

const EXTRAS_SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 700,
  color: CANVAS.INK,
};

const EXTRAS_BODY_STYLE: CSSProperties = {
  margin: "10px 0 0",
  display: "grid",
  gap: 10,
};

const EXTRAS_HELP_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

const CONTEXT_MANIFEST_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 10,
  padding: "14px 16px",
  background: "rgba(12,26,58,0.018)",
};

const CONTEXT_MANIFEST_HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const CONTEXT_MANIFEST_TITLE_STYLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 15,
  lineHeight: 1.25,
  color: CANVAS.INK,
};

const CONTEXT_MANIFEST_BADGE_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  padding: "5px 9px",
  background: CANVAS.CARD,
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  whiteSpace: "nowrap",
};

const CONTEXT_MANIFEST_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const CONTEXT_MANIFEST_COLUMN_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.CARD,
  padding: "10px 12px",
  minWidth: 0,
};

const CONTEXT_MANIFEST_COLUMN_TITLE_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 800,
  color: CANVAS.INK,
};

const CONTEXT_MANIFEST_LIST_STYLE: CSSProperties = {
  margin: "8px 0 0",
  padding: 0,
  listStyle: "none",
  display: "grid",
  gap: 5,
};

const CONTEXT_MANIFEST_ITEM_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.35,
};

const CONTEXT_MANIFEST_EMPTY_STYLE: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_MUTED,
};

const CONTEXT_MANIFEST_FOOTNOTE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 11.5,
  color: CANVAS.INK_MUTED,
  lineHeight: 1.4,
};

const NEXT_GATE_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto auto",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 10,
  background: "rgba(12,26,58,0.025)",
};

const NEXT_GATE_COPY_STYLE: CSSProperties = {
  minWidth: 0,
};

const NEXT_GATE_TITLE_STYLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 16,
  fontWeight: 800,
  color: CANVAS.INK,
};

const NEXT_GATE_BODY_STYLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

function primaryButtonStyle(enabled: boolean): CSSProperties {
  return {
    ...BASE_BUTTON_STYLE,
    padding: "12px 18px",
    border: `1px solid ${enabled ? CANVAS.ACTIVE : CANVAS.RULE}`,
    background: enabled ? CANVAS.ACTIVE : "rgba(12,26,58,0.08)",
    color: enabled ? CANVAS.CARD : CANVAS.INK_MUTED,
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

const DOWNLOAD_LINK_STYLE: CSSProperties = {
  ...SECONDARY_SMALL_STYLE,
  textDecoration: "none",
};

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  ...SECONDARY_SMALL_STYLE,
  padding: "10px 14px",
};

const MESSAGE_STYLE: CSSProperties = {
  margin: 0,
  padding: "10px 12px",
  borderRadius: 8,
  background: "rgba(12,26,58,0.06)",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
};

const ADVANCED_STYLE: CSSProperties = {
  marginTop: 8,
  paddingTop: 18,
  borderTop: `1px solid ${CANVAS.RULE}`,
};
