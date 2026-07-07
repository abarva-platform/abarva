"use client";

import {
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";

/**
 * DropZone — the "Add your data" drop surface.
 *
 * One calm primary affordance (drag files or click to choose), plus
 * two secondary on-ramps: load into a specific dimension, and connect
 * Azure Storage. Pure presentational — it surfaces chosen files as an
 * `onFilesSelected` event and the two on-ramps as their own events.
 * No upload, no fetch.
 *
 * Locked design system: cream surface, near-black ink, serif display,
 * hairline border, black + ghost buttons.
 */

export interface DropZoneProps {
  /** Fired with the files the operator dropped or chose. */
  onFilesSelected: (files: File[]) => void;
  /** Secondary on-ramp: pick a target dimension before uploading. */
  onChooseDimension?: () => void;
  /** Secondary on-ramp: connect / open the Azure Storage landing zone. */
  onConnectAzureStorage?: () => void;
  /** Accept attribute for the hidden file input (e.g. ".csv,.json,.xlsx"). */
  accept?: string;
  /** Disable interaction (e.g. while a batch is mid-flight). */
  disabled?: boolean;
  /** Optional helper line under the title. */
  helperText?: string;
  className?: string;
}

export function DropZone({
  onFilesSelected,
  onChooseDimension,
  onConnectAzureStorage,
  accept,
  disabled = false,
  helperText = "CSV, JSON, JSONL, YAML, XLSX, PDF, DOCX or PPTX. Originals are preserved before anything is parsed.",
  className,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function emit(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFilesSelected(Array.from(fileList));
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (disabled) return;
    emit(event.dataTransfer.files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    setDragActive(true);
  }

  return (
    <div className={className} style={{ fontFamily: TYPOGRAPHY.sans }}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Add your data — drop files or choose from your computer"
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragActive(false)}
        style={{
          border: `1.5px dashed ${
            dragActive ? COLORS.navy : `${COLORS.ink}33`
          }`,
          borderRadius: RADIUS.lg,
          background: dragActive ? COLORS.skyPale : COLORS.cream,
          padding: "40px 28px",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "background 120ms ease, border-color 120ms ease",
          outline: "none",
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 24,
            color: COLORS.ink,
            marginBottom: 6,
          }}
        >
          Add your data
        </div>
        <div
          style={{
            fontSize: 14,
            color: `${COLORS.ink}99`,
            maxWidth: 460,
            margin: "0 auto 16px",
            lineHeight: 1.5,
          }}
        >
          {helperText}
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "9px 18px",
            borderRadius: RADIUS.md,
            background: COLORS.ink,
            color: COLORS.white,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Choose files
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          disabled={disabled}
          onChange={(event) => emit(event.target.files)}
          style={{ display: "none" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
          marginTop: 14,
        }}
      >
        {onChooseDimension ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onChooseDimension}
            style={ghostLinkStyle(disabled)}
          >
            Load into a specific dimension
          </button>
        ) : null}
        {onConnectAzureStorage ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onConnectAzureStorage}
            style={ghostLinkStyle(disabled)}
          >
            Connect Azure Storage
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ghostLinkStyle(disabled: boolean): React.CSSProperties {
  return {
    background: "transparent",
    border: "none",
    padding: 0,
    color: COLORS.navy,
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    opacity: disabled ? 0.6 : 1,
  };
}

export default DropZone;
