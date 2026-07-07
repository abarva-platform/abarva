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
}: SimpleStageFrontProps) {
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerPending, setAnswerPending] = useState<string | null>(null);
  const [uploadPending, setUploadPending] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const latestDoc = latestGeneratedDoc(
    registryArtifacts,
    view.deliverable.artifactCode,
  );

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
        setMessage(payload?.detail ?? payload?.error ?? "Answer was not saved.");
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
          <h2 style={TITLE_STYLE}>You&apos;re on {view.stageLabel}</h2>
          <p style={SUBTITLE_STYLE}>
            Give the essentials, write the document, then move to the next step.
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

      <div style={ASKS_STYLE}>
        {view.required.map((requirement, index) => {
          const isAnswerOpen = answerFor === requirement.requirementId;
          const isSkipped = skipped.has(requirement.requirementId);
          return (
            <div
              key={requirement.requirementId}
              data-testid={`source-simple-front-requirement-${requirement.requirementId}`}
              style={ASK_ROW_STYLE}
            >
              <div style={ASK_NUMBER_STYLE}>{index + 1}</div>
              <div style={ASK_COPY_STYLE}>
                <div style={ASK_TITLE_ROW_STYLE}>
                  <strong style={ASK_TITLE_STYLE}>{requirement.label}</strong>
                  <span style={stateChipStyle(requirement.state, isSkipped)}>
                    {isSkipped ? "Skipped" : requirement.state}
                  </span>
                </div>
                <p style={ASK_META_STYLE}>{requirement.why}</p>
                <p style={ASK_HINT_STYLE}>{requirement.acceptHint}</p>
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
                  Just tell me
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSkipped((prev) => new Set(prev).add(requirement.requirementId))
                  }
                  style={QUIET_BUTTON_STYLE}
                >
                  Skip
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {view.extras.length > 0 ? (
        <details style={EXTRAS_STYLE}>
          <summary style={EXTRAS_SUMMARY_STYLE}>What else would help?</summary>
          <ul style={EXTRAS_LIST_STYLE}>
            {view.extras.map((requirement) => (
              <li key={requirement.requirementId}>
                {requirement.label} · {requirement.acceptHint}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div style={BOTTOM_BAR_STYLE}>
        <button
          type="button"
          data-testid="source-simple-front-approve"
          onClick={() => void handleApproveAndContinue()}
          disabled={generating}
          style={PRIMARY_BUTTON_STYLE}
        >
          {generating
            ? "Writing..."
            : view.nextStep.stage
              ? `Approve & write ${view.deliverable.name}`
              : `Write my ${view.deliverable.name}`}
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
        <div style={NEXT_STEP_STYLE}>
          <span>Then: {view.nextStep.label}</span>
        </div>
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

function stateChipStyle(
  state: SimpleStageRequirementView["state"],
  skipped: boolean,
): CSSProperties {
  const color =
    state === "Usable Evidence" || state === "Available"
      ? CANVAS.ACTIVE
      : skipped
        ? CANVAS.INK_MUTED
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

const SHELL_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: 28,
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
  fontSize: 30,
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const SUBTITLE_STYLE: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  color: CANVAS.INK_SOFT,
};

const ASKS_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
};

const ASK_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0,1fr) auto",
  gap: 14,
  alignItems: "start",
  padding: "18px 0",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const ASK_NUMBER_STYLE: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(12,26,58,0.06)",
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 800,
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

const ASK_META_STYLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
};

const ASK_HINT_STYLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_MUTED,
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

const EXTRAS_LIST_STYLE: CSSProperties = {
  margin: "10px 0 0",
  paddingLeft: 18,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
};

const BOTTOM_BAR_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  paddingTop: 2,
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  ...BASE_BUTTON_STYLE,
  padding: "12px 18px",
  border: `1px solid ${CANVAS.ACTIVE}`,
  background: CANVAS.ACTIVE,
  color: CANVAS.CARD,
};

const DOWNLOAD_LINK_STYLE: CSSProperties = {
  ...SECONDARY_SMALL_STYLE,
  textDecoration: "none",
};

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  ...SECONDARY_SMALL_STYLE,
  padding: "10px 14px",
};

const NEXT_STEP_STYLE: CSSProperties = {
  marginLeft: "auto",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
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
