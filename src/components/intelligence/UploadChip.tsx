'use client';

import type { UploadedAttachment } from '@/hooks/useNexusStream';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadChip({
  attachment,
  onRemove,
}: {
  attachment: UploadedAttachment;
  onRemove?: () => void;
}) {
  return (
    <span className="intel-chip">
      <span role="img" aria-label="file">📄</span>
      <span style={{ fontSize: 12 }}>{attachment.fileName}</span>
      <span className="intel-dim" style={{ fontSize: 12 }}>{formatBytes(attachment.fileSizeBytes)}</span>
      <span className="intel-chip mono teal" style={{ minHeight: 20, padding: '0 8px' }}>staged</span>
      {onRemove ? (
        <button type="button" className="intel-button-ghost" onClick={onRemove} style={{ padding: 0, color: 'inherit' }}>
          ×
        </button>
      ) : null}
    </span>
  );
}
