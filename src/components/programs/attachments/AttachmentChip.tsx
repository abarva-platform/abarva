'use client';

// AttachmentChip · OV2-4b
//
// Shared visual for two states:
//   1. Pending — selected but not yet uploaded (or uploading). Shows
//      filename, size, optional progress, optional error, remove (×).
//   2. Persisted — server has the AttachmentRecord. Shows filename,
//      mime icon, and a download anchor that hits the signed-URL
//      redirect endpoint.
//
// Visual language is intentionally minimal — small monospace caption
// over the brand paper, ink-black text, signal-blue accent. The chip
// is utility, not a brand surface.

import type { AttachmentRecord, AttachmentChipRef } from '@/lib/programs/attachments/types';

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeGlyph(mime: string): string {
  if (mime.startsWith('image/')) return 'IMG';
  if (mime.startsWith('audio/')) return 'AUD';
  if (mime.startsWith('video/')) return 'VID';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.includes('wordprocessingml')) return 'DOC';
  if (mime.includes('spreadsheetml')) return 'XLS';
  if (mime.includes('presentationml')) return 'PPT';
  if (mime === 'text/csv') return 'CSV';
  if (mime === 'text/markdown') return 'MD';
  if (mime === 'text/plain') return 'TXT';
  return 'FILE';
}

export interface PendingAttachmentChipProps {
  filename: string;
  sizeBytes: number;
  status: 'pending' | 'uploading' | 'error';
  /** Bytes uploaded so far (only meaningful when status = 'uploading'). */
  loadedBytes?: number;
  /** Error message — set when status = 'error'. */
  errorMessage?: string;
  onRemove: () => void;
  onRetry?: () => void;
}

export function PendingAttachmentChip({
  filename,
  sizeBytes,
  status,
  loadedBytes,
  errorMessage,
  onRemove,
  onRetry,
}: PendingAttachmentChipProps) {
  const isError = status === 'error';
  const isUploading = status === 'uploading';
  const pct =
    isUploading && sizeBytes > 0 && loadedBytes !== undefined
      ? Math.min(100, Math.round((loadedBytes / sizeBytes) * 100))
      : null;
  return (
    <span
      data-component="PendingAttachmentChip"
      data-status={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: isError ? '#FEE2E2' : '#FFFFFF',
        border: `1px solid ${isError ? '#FCA5A5' : '#E6DFCE'}`,
        borderRadius: 6,
        padding: '3px 8px',
        fontSize: 11.5,
        color: isError ? '#991B1B' : '#2A3A5E',
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <svg
        aria-hidden
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
      </svg>
      <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {filename}
      </span>
      <span style={{ opacity: 0.6, fontSize: 10 }}>
        {isError && errorMessage
          ? errorMessage
          : isUploading && pct !== null
            ? `${pct}%`
            : formatBytes(sizeBytes)}
      </span>
      {isError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry upload"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#991B1B',
            fontSize: 10,
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          retry
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isError ? '#991B1B' : '#8B95A8',
          fontSize: 13,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
}

export interface PersistedAttachmentChipProps {
  attachment: AttachmentRecord | AttachmentChipRef;
  /** Override programId when chip ref doesn't carry it (legacy contexts). */
  programId?: string;
}

export function PersistedAttachmentChip({
  attachment,
  programId,
}: PersistedAttachmentChipProps) {
  const pid = programId ?? attachment.programId;
  const href = `/api/programs/${encodeURIComponent(pid)}/attachments/${encodeURIComponent(attachment.id)}`;
  return (
    <a
      data-component="PersistedAttachmentChip"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#FFFFFF',
        border: '1px solid #E6DFCE',
        borderRadius: 6,
        padding: '3px 8px',
        fontSize: 11.5,
        color: '#2A3A5E',
        textDecoration: 'none',
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <span
        aria-hidden
        style={{
          fontFamily:
            '"JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace',
          fontSize: 9,
          letterSpacing: '0.04em',
          fontWeight: 700,
          color: '#5B6C8A',
        }}
      >
        {mimeGlyph(attachment.mimeType)}
      </span>
      <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {attachment.originalName}
      </span>
      <span style={{ opacity: 0.6, fontSize: 10 }}>
        {formatBytes(attachment.sizeBytes)}
      </span>
    </a>
  );
}
