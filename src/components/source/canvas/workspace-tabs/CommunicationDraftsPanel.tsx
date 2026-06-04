"use client";

import { useState, type CSSProperties } from "react";

import {
  labelForCommunicationDraft,
  type SourceCommunicationDraft,
  type SourceCommunicationDraftType,
} from "@/lib/source/communication-drafts";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";

interface CommunicationDraftsPanelProps {
  eventId: string;
  stage: SourceStageKey;
}

const DRAFT_OPTIONS: Array<{
  type: SourceCommunicationDraftType;
  stages: SourceStageKey[];
  hint: string;
}> = [
  {
    type: "qa_follow_up",
    stages: ["rfp", "responses", "evaluation"],
    hint: "Clarify questions and controlled vendor answers.",
  },
  {
    type: "bafo_request",
    stages: ["pricing", "bafo", "executive_decision"],
    hint: "Ask finalists for best-and-final improvements.",
  },
  {
    type: "award_notice",
    stages: ["selection", "transition"],
    hint: "Prepare award or intent-to-award wording.",
  },
  {
    type: "vendor_follow_up",
    stages: ["responses", "evaluation", "pricing", "bafo", "transition"],
    hint: "Request missing information or approvals.",
  },
];

export function CommunicationDraftsPanel({
  eventId,
  stage,
}: CommunicationDraftsPanelProps) {
  const options = DRAFT_OPTIONS.filter((option) =>
    option.stages.includes(stage),
  );
  const [draftType, setDraftType] = useState<SourceCommunicationDraftType>(
    options[0]?.type ?? "vendor_follow_up",
  );
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<SourceCommunicationDraft | null>(null);
  const [copied, setCopied] = useState(false);

  if (options.length === 0) return null;

  async function generateDraft() {
    setPending(true);
    setError(null);
    setCopied(false);
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/communications/draft`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ draftType, recipientName, note }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { draft?: SourceCommunicationDraft; detail?: string; error?: string }
        | null;
      if (!response.ok || !payload?.draft) {
        throw new Error(
          payload?.detail ?? payload?.error ?? `Draft failed (${response.status}).`,
        );
      }
      setDraft(payload.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft failed.");
    } finally {
      setPending(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    const text = formatDraftForExport(draft);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      data-testid="source-communication-drafts-panel"
      aria-label="Communication drafts"
      style={PANEL_STYLE}
    >
      <header style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Communication drafts</div>
          <h3 style={TITLE_STYLE}>Draft only · review before sending</h3>
          <p style={BODY_STYLE}>
            Create internal wording for the procurement system or email client.
            AbarVa does not send external messages from this panel.
          </p>
        </div>
        <span style={BADGE_STYLE}>no send</span>
      </header>

      <div style={FORM_STYLE}>
        <label style={FIELD_STYLE}>
          <span style={LABEL_STYLE}>Draft type</span>
          <select
            value={draftType}
            onChange={(event) =>
              setDraftType(event.currentTarget.value as SourceCommunicationDraftType)
            }
            style={INPUT_STYLE}
          >
            {options.map((option) => (
              <option key={option.type} value={option.type}>
                {labelForCommunicationDraft(option.type)}
              </option>
            ))}
          </select>
        </label>
        <label style={FIELD_STYLE}>
          <span style={LABEL_STYLE}>Recipient or group</span>
          <input
            value={recipientName}
            onChange={(event) => setRecipientName(event.currentTarget.value)}
            placeholder="Finalist vendors, procurement team, selected vendor"
            style={INPUT_STYLE}
          />
        </label>
        <label style={{ ...FIELD_STYLE, gridColumn: "1 / -1" }}>
          <span style={LABEL_STYLE}>Maestro note</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            placeholder={
              options.find((option) => option.type === draftType)?.hint ??
              "Add a specific ask or constraint."
            }
            rows={3}
            style={TEXTAREA_STYLE}
          />
        </label>
      </div>

      {error ? <div role="alert" style={ERROR_STYLE}>{error}</div> : null}

      <div style={ACTIONS_STYLE}>
        <button
          type="button"
          onClick={generateDraft}
          disabled={pending}
          style={{ ...PRIMARY_BUTTON_STYLE, opacity: pending ? 0.62 : 1 }}
          data-testid="source-communication-draft-generate"
        >
          {pending ? "Creating draft..." : "Create internal draft"}
        </button>
        {draft ? (
          <>
            <button type="button" onClick={copyDraft} style={GHOST_BUTTON_STYLE}>
              {copied ? "Copied" : "Copy text"}
            </button>
            <a
              href={downloadHrefForDraft(draft)}
              download={`${draft.draftType}-draft.txt`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: "none" }}
            >
              Download text
            </a>
          </>
        ) : null}
      </div>

      {draft ? (
        <article style={DRAFT_STYLE} data-testid="source-communication-draft">
          <div style={LABEL_STYLE}>Subject</div>
          <div style={SUBJECT_STYLE}>{draft.subject}</div>
          <pre style={DRAFT_BODY_STYLE}>{draft.body}</pre>
          <div style={DISCLAIMER_STYLE}>{draft.disclaimer}</div>
        </article>
      ) : null}
    </section>
  );
}

function formatDraftForExport(draft: SourceCommunicationDraft): string {
  return [`Subject: ${draft.subject}`, "", draft.body, "", draft.disclaimer].join(
    "\n",
  );
}

function downloadHrefForDraft(draft: SourceCommunicationDraft): string {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(formatDraftForExport(draft))}`;
}

const PANEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 14,
  marginTop: 16,
  padding: "16px 18px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};

const TITLE_STYLE: CSSProperties = {
  margin: "4px 0 6px",
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  color: CANVAS.INK,
  lineHeight: 1.2,
};

const BODY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const BADGE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 999,
  padding: "5px 9px",
};

const FORM_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const FIELD_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
};

const LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  fontWeight: 700,
};

const INPUT_STYLE: CSSProperties = {
  minHeight: 38,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 6,
  padding: "0 10px",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
  background: "#fff",
};

const TEXTAREA_STYLE: CSSProperties = {
  ...INPUT_STYLE,
  minHeight: 76,
  padding: 10,
  resize: "vertical",
};

const ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const GHOST_BUTTON_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  minHeight: 36,
  padding: "0 14px",
  background: "#fff",
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  cursor: "pointer",
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  ...GHOST_BUTTON_STYLE,
  borderColor: CANVAS.INK,
  background: CANVAS.INK,
  color: "#fff",
};

const ERROR_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.BLOCKED,
};

const DRAFT_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 14,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.PAGE_BG,
};

const SUBJECT_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  fontWeight: 700,
  color: CANVAS.INK,
};

const DRAFT_BODY_STYLE: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.55,
  color: CANVAS.INK,
};

const DISCLAIMER_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};
