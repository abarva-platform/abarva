'use client';

// MoveArtifactUpload · Wave 3c
//
// Lightweight upload affordance for the Move detail right pane.
// Uses uploadAttachment() from the attachments upload-client (XHR
// with progress events).  The component is intentionally thin:
// no drag-and-drop (Wave 3c scope), just a styled file input that
// opens the native picker, uploads on change, and shows:
//   • idle state — "Upload evidence ↑" prompt
//   • uploading   — file name + animated spinner + percent
//   • success     — file name + "✓ attached"
//   • error       — short error reason
//
// Supports multiple sequential uploads; each starts fresh.

import { useRef, useState } from 'react';
import {
  uploadAttachment,
  type UploadAttachmentError,
} from '@/lib/programs/attachments/upload-client';
import type { AttachmentRecord } from '@/lib/programs/attachments/types';

interface Props {
  programId: string;
  /** Phase to tag the attachment with (0 = Originate, etc.) */
  phase?: number;
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; percent: number }
  | { status: 'success'; record: AttachmentRecord }
  | { status: 'error'; message: string };

const S = {
  zone: {
    border: '1px dashed #C9C7C2',
    borderRadius: 6,
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    userSelect: 'none' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  zoneHover: {
    borderColor: '#1B2B5C',
    backgroundColor: 'rgba(27,43,92,0.04)',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#1B2B5C',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  sub: {
    fontSize: 11,
    color: '#9AA3B2',
    lineHeight: 1.4,
  },
  bar: {
    height: 3,
    borderRadius: 999,
    backgroundColor: '#E8E6E1',
    overflow: 'hidden' as const,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1B2B5C',
    transition: 'width 0.2s',
  },
  successChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    backgroundColor: 'rgba(22,163,74,0.08)',
    border: '1px solid rgba(22,163,74,0.3)',
    borderRadius: 999,
    fontSize: 11,
    color: '#15803D',
    fontWeight: 600,
  },
  errorChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    backgroundColor: 'rgba(185,28,28,0.06)',
    border: '1px solid rgba(185,28,28,0.2)',
    borderRadius: 999,
    fontSize: 11,
    color: '#B91C1C',
  },
  uploadAnother: {
    fontSize: 11,
    color: '#525866',
    cursor: 'pointer',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    padding: 0,
    marginTop: 2,
  },
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function MoveArtifactUpload({ programId, phase }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const [hovered, setHovered] = useState(false);

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFileChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected after an error.
    evt.target.value = '';

    setState({ status: 'uploading', fileName: file.name, percent: 0 });

    const result = await uploadAttachment({
      programId,
      file,
      phase,
      onProgress(loaded, total) {
        if (total > 0) {
          setState({
            status: 'uploading',
            fileName: file.name,
            percent: Math.round((loaded / total) * 100),
          });
        }
      },
    });

    if (result.ok) {
      setState({ status: 'success', record: result.attachment });
    } else {
      const err = result as UploadAttachmentError;
      setState({
        status: 'error',
        message: err.message ?? 'Upload failed. Please try again.',
      });
    }
  }

  function reset() {
    setState({ status: 'idle' });
  }

  const zoneStyle = {
    ...S.zone,
    ...(hovered && state.status === 'idle' ? S.zoneHover : {}),
  };

  if (state.status === 'uploading') {
    return (
      <div style={zoneStyle}>
        <div style={S.label}>
          <span style={{ fontSize: 14 }}>⏳</span>
          Uploading {state.fileName}…
        </div>
        <div style={S.bar}>
          <div style={{ ...S.barFill, width: `${state.percent}%` }} />
        </div>
        <div style={S.sub}>{state.percent}% complete</div>
      </div>
    );
  }

  if (state.status === 'success') {
    const rec = state.record;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={S.successChip}>
          <span>✓</span>
          {rec.originalName}
          <span style={{ opacity: 0.6 }}>· {formatBytes(rec.sizeBytes)}</span>
        </div>
        <button style={S.uploadAnother} onClick={reset} type="button">
          Upload another file
        </button>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={S.errorChip}>
          <span>⚠</span>
          {state.message}
        </div>
        <button style={S.uploadAnother} onClick={reset} type="button">
          Try again
        </button>
      </div>
    );
  }

  // idle state
  return (
    <div
      style={zoneStyle}
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPicker()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid="move-artifact-upload-zone"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.csv,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        data-testid="move-artifact-file-input"
      />
      <div style={S.label}>
        <span style={{ fontSize: 14 }}>📎</span>
        Upload evidence
      </div>
      <div style={S.sub}>
        PDF, Word, Excel, PowerPoint, image — max 100 MB. Attached here and available to Nexus.
      </div>
    </div>
  );
}
