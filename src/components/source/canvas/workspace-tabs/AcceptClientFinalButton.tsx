import { useRef, useState, type CSSProperties, type FormEvent } from "react";

import { CLIENT_FINAL_GOVERNANCE_MESSAGE } from "@/lib/source/client-final-artifacts";

interface AcceptClientFinalButtonProps {
  eventId: string;
  artifactCode: string;
  artifactName: string;
  hasGeneratedDraft?: boolean;
  onAccepted?: () => void;
}

export function AcceptClientFinalButton({
  eventId,
  artifactCode,
  artifactName,
  hasGeneratedDraft = true,
  onAccepted,
}: AcceptClientFinalButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedName, setAcceptedName] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose the client-approved final file first.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/client-final`,
        {
          method: "POST",
          body: formData,
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        artifact?: { fileName?: string };
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.detail ?? payload?.error ?? "Client-final upload failed.",
        );
      }
      setAcceptedName(payload.artifact?.fileName ?? file.name);
      form.reset();
      onAccepted?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Client-final upload failed.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={WRAP_STYLE}>
      <button
        type="button"
        disabled={!hasGeneratedDraft}
        onClick={() => {
          if (!hasGeneratedDraft) return;
          setOpen((value) => !value);
          setError(null);
        }}
        style={{
          ...BUTTON_STYLE,
          opacity: hasGeneratedDraft ? 1 : 0.55,
          cursor: hasGeneratedDraft ? "pointer" : "not-allowed",
        }}
        data-testid={`source-accept-client-final-toggle-${artifactCode}`}
        title={
          hasGeneratedDraft
            ? undefined
            : "Generate and persist an AbarVa draft before accepting a client-final version."
        }
      >
        Accept Client Final
      </button>
      {!hasGeneratedDraft ? (
        <p style={COPY_STYLE}>
          Generate and persist the AbarVa draft first; then upload the
          client-approved final as the authoritative version.
        </p>
      ) : null}
      {open ? (
        <form
          onSubmit={handleSubmit}
          style={PANEL_STYLE}
          data-testid={`source-accept-client-final-panel-${artifactCode}`}
        >
          <div style={EYEBROW_STYLE}>Authoritative version</div>
          <strong style={TITLE_STYLE}>{artifactName}</strong>
          <p style={COPY_STYLE}>{CLIENT_FINAL_GOVERNANCE_MESSAGE}</p>
          <label style={LABEL_STYLE}>
            Client-approved file
            <input
              ref={inputRef}
              name="file"
              type="file"
              required
              style={INPUT_STYLE}
            />
          </label>
          <label style={LABEL_STYLE}>
            Optional note
            <textarea name="note" rows={3} style={TEXTAREA_STYLE} />
          </label>
          <div style={FIELD_GRID_STYLE}>
            <label style={LABEL_STYLE}>
              Review date
              <input name="reviewMeetingDate" type="date" style={INPUT_STYLE} />
            </label>
            <label style={LABEL_STYLE}>
              Stakeholder group
              <input
                name="stakeholderGroup"
                type="text"
                placeholder="Steering committee, legal, CPO..."
                style={INPUT_STYLE}
              />
            </label>
          </div>
          {error ? (
            <div role="alert" style={ERROR_STYLE}>
              {error}
            </div>
          ) : null}
          {acceptedName ? (
            <div style={SUCCESS_STYLE}>
              Client Final accepted — this version is authoritative:{" "}
              {acceptedName}
            </div>
          ) : null}
          <div style={ACTIONS_STYLE}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={GHOST_STYLE}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              style={{ ...PRIMARY_STYLE, opacity: pending ? 0.6 : 1 }}
            >
              {pending ? "Accepting…" : "Confirm client final"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

const WRAP_STYLE: CSSProperties = {
  position: "relative",
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid #b9c7dc",
  borderRadius: 8,
  background: "#f8fbff",
  color: "#0c1a3a",
  fontWeight: 800,
  padding: "8px 12px",
  cursor: "pointer",
};

const PANEL_STYLE: CSSProperties = {
  position: "absolute",
  right: 0,
  top: "calc(100% + 8px)",
  zIndex: 5,
  width: 420,
  maxWidth: "min(420px, calc(100vw - 48px))",
  border: "1px solid #d8e2ef",
  borderRadius: 12,
  background: "#fffdf8",
  boxShadow: "0 18px 60px rgba(12, 26, 58, 0.18)",
  padding: 16,
};

const EYEBROW_STYLE: CSSProperties = {
  color: "#5d6b82",
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  fontWeight: 800,
};

const TITLE_STYLE: CSSProperties = {
  display: "block",
  marginTop: 4,
  color: "#071633",
};

const COPY_STYLE: CSSProperties = {
  color: "#34435c",
  lineHeight: 1.45,
  margin: "10px 0 12px",
};

const LABEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
  color: "#34435c",
  fontSize: 13,
  fontWeight: 700,
  marginTop: 10,
};

const INPUT_STYLE: CSSProperties = {
  border: "1px solid #cbd7e7",
  borderRadius: 8,
  color: "#071633",
  padding: "8px 10px",
};

const TEXTAREA_STYLE: CSSProperties = {
  ...INPUT_STYLE,
  resize: "vertical",
};

const FIELD_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 14,
};

const GHOST_STYLE: CSSProperties = {
  border: "1px solid #cbd7e7",
  borderRadius: 8,
  background: "#fff",
  color: "#24344f",
  fontWeight: 800,
  padding: "8px 12px",
};

const PRIMARY_STYLE: CSSProperties = {
  border: "1px solid #0f766e",
  borderRadius: 8,
  background: "#0f766e",
  color: "#fff",
  fontWeight: 800,
  padding: "8px 12px",
};

const ERROR_STYLE: CSSProperties = {
  marginTop: 10,
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "#fff1f2",
  color: "#991b1b",
  padding: "8px 10px",
};

const SUCCESS_STYLE: CSSProperties = {
  marginTop: 10,
  border: "1px solid #bbf7d0",
  borderRadius: 8,
  background: "#f0fdf4",
  color: "#166534",
  padding: "8px 10px",
  fontWeight: 800,
};
