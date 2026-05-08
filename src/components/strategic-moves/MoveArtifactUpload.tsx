'use client';

// MoveArtifactUpload · Wave 3c (revised)
//
// Shows BOTH existing uploads for this Move AND a file-upload affordance.
// On mount, fetches GET /api/programs/{programId}/attachments to populate
// the existing-uploads list. Uploads via POST .../upload (XHR with progress).
//
// Layout:
//   Existing uploads list (if any)  — each row has file name + size + download link
//   ──────────────────────────────
//   Upload zone (idle / uploading / success / error)

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  uploadAttachment,
  type UploadAttachmentError,
} from '@/lib/programs/attachments/upload-client';
import type { AttachmentRecord } from '@/lib/programs/attachments/types';

interface Props {
  programId: string;
  /** Phase to tag new uploads with (0 = Originate, etc.) */
  phase?: number;
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; fileName: string; percent: number }
  | { status: 'success'; record: AttachmentRecord }
  | { status: 'error'; message: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diff = Math.round((now - d.getTime()) / 60_000);
  if (diff < 60) return `${Math.max(1, diff)}m ago`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mimeIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('docx') || mimeType.includes('doc')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('pptx')) return '📋';
  if (mimeType.includes('image')) return '🖼';
  return '📎';
}

const S = {
  uploadZone: {
    border: '1px dashed #C9C7C2',
    borderRadius: 6,
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    userSelect: 'none' as const,
  },
  uploadZoneHover: {
    borderColor: '#1B2B5C',
    backgroundColor: 'rgba(27,43,92,0.04)',
  },
  label: { fontSize: 12, fontWeight: 600, color: '#1B2B5C', display: 'flex', alignItems: 'center', gap: 6 } as const,
  sub: { fontSize: 11, color: '#9AA3B2', lineHeight: 1.4, marginTop: 4 },
  bar: { height: 3, borderRadius: 999, backgroundColor: '#E8E6E1', overflow: 'hidden' as const },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: '#1B2B5C', transition: 'width 0.2s' },
  successChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', backgroundColor: 'rgba(22,163,74,0.08)',
    border: '1px solid rgba(22,163,74,0.3)', borderRadius: 999,
    fontSize: 11, color: '#15803D', fontWeight: 600,
  } as const,
  errorChip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 10px', backgroundColor: 'rgba(185,28,28,0.06)',
    border: '1px solid rgba(185,28,28,0.2)', borderRadius: 999,
    fontSize: 11, color: '#B91C1C',
  } as const,
  smallBtn: {
    fontSize: 11, color: '#525866', cursor: 'pointer', textDecoration: 'underline',
    background: 'none', border: 'none', padding: 0, marginTop: 4,
  } as const,
};

export function MoveArtifactUpload({ programId, phase }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [hovered, setHovered] = useState(false);
  const [existingUploads, setExistingUploads] = useState<AttachmentRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadExisting = useCallback(() => {
    fetch(`/api/programs/${programId}/attachments`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        const data = await r.json() as { attachments: AttachmentRecord[] };
        setExistingUploads(data.attachments ?? []);
      })
      .catch(() => {
        setLoadError(true);
        setExistingUploads([]);
      });
  }, [programId]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  function openPicker() { inputRef.current?.click(); }

  async function handleFileChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) return;
    evt.target.value = '';
    setUploadState({ status: 'uploading', fileName: file.name, percent: 0 });

    const result = await uploadAttachment({
      programId,
      file,
      phase,
      onProgress(loaded, total) {
        if (total > 0) setUploadState({ status: 'uploading', fileName: file.name, percent: Math.round((loaded / total) * 100) });
      },
    });

    if (result.ok) {
      setUploadState({ status: 'success', record: result.attachment });
      // Reload the list after success
      loadExisting();
    } else {
      const err = result as UploadAttachmentError;
      setUploadState({ status: 'error', message: err.message ?? 'Upload failed. Please try again.' });
    }
  }

  function reset() { setUploadState({ status: 'idle' }); }

  const zoneStyle = {
    ...S.uploadZone,
    ...(hovered && uploadState.status === 'idle' ? S.uploadZoneHover : {}),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Existing uploads */}
      {existingUploads && existingUploads.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            color: '#9AA3B2',
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            marginBottom: 2,
          }}>
            Uploaded files ({existingUploads.length})
          </div>
          {existingUploads.map((a) => (
            <a
              key={a.id}
              href={`/api/programs/${programId}/attachments/${a.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                backgroundColor: '#FAFAF8',
                border: '1px solid #E2DFD8',
                borderRadius: 5,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <span style={{ fontSize: 14 }}>{mimeIcon(a.mimeType)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {a.originalName}
                </div>
                <div style={{ fontSize: 10, color: '#9AA3B2' }}>
                  {formatBytes(a.sizeBytes)} · {formatDate(a.createdAt)}
                  {a.scanStatus === 'clean' && ' · ✓'}
                </div>
              </div>
              <span style={{ fontSize: 10, color: '#1B2B5C', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>↓</span>
            </a>
          ))}
        </div>
      )}

      {existingUploads !== null && existingUploads.length === 0 && !loadError && (
        <div style={{ fontSize: 11, color: '#9AA3B2', fontStyle: 'italic' }}>No files uploaded yet.</div>
      )}

      {loadError && (
        <div style={{ fontSize: 11, color: '#B45309' }}>Couldn&apos;t load uploads list.</div>
      )}

      {/* Upload zone */}
      {uploadState.status === 'uploading' && (
        <div style={zoneStyle}>
          <div style={S.label}><span style={{ fontSize: 14 }}>⏳</span> Uploading {uploadState.fileName}…</div>
          <div style={{ ...S.bar, marginTop: 8 }}>
            <div style={{ ...S.barFill, width: `${uploadState.percent}%` }} />
          </div>
          <div style={{ ...S.sub }}>{uploadState.percent}% complete</div>
        </div>
      )}

      {uploadState.status === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={S.successChip}><span>✓</span>{uploadState.record.originalName}<span style={{ opacity: 0.6 }}>· {formatBytes(uploadState.record.sizeBytes)}</span></div>
          <button style={S.smallBtn} onClick={reset} type="button">Upload another file</button>
        </div>
      )}

      {uploadState.status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={S.errorChip}><span>⚠</span>{uploadState.message}</div>
          <button style={S.smallBtn} onClick={reset} type="button">Try again</button>
        </div>
      )}

      {uploadState.status === 'idle' && (
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
            {existingUploads && existingUploads.length > 0 ? 'Upload another file' : 'Upload evidence'}
          </div>
          <div style={S.sub}>PDF, Word, Excel, PowerPoint, image — max 100 MB</div>
        </div>
      )}
    </div>
  );
}
