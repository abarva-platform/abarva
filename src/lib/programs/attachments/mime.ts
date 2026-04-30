// Programs · Attachments · mime allowlist + size cap
//
// Server-enforced gate on what users can upload via the chat-window
// upload affordance (OV2-4d). Anything not on this list is rejected
// before the storage bucket sees the bytes. Spec lives in the
// Programs module redesign Section B.4 (file uploads cross-cutting).
//
// Design notes:
//   - Documents: PDF, .docx, .xlsx, .pptx, plain text, markdown, CSV.
//   - Images: PNG, JPEG only (no SVG — XSS risk · no GIF — rarely useful
//     for evidence).
//   - Audio / Video: meeting recordings · MP3, M4A, MP4 only.
//   - No archives (.zip / .tar) — they hide nested mime types from the
//     scanner. If users need to upload a folder, they upload files
//     individually.
//   - No application/octet-stream — would defeat the allowlist.
//
// Size cap: 100 MB. Larger files belong in the data-room ingestion
// path, not the chat-window upload path.

export const ATTACHMENT_MIME_ALLOWLIST = [
  // Documents
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/markdown',
  'text/plain',
  'text/csv',
  // Images
  'image/png',
  'image/jpeg',
  // Audio / Video (meeting recordings)
  'audio/mpeg',
  'audio/mp4',
  'video/mp4',
] as const;

export type AllowedMimeType = (typeof ATTACHMENT_MIME_ALLOWLIST)[number];

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ATTACHMENT_MIME_ALLOWLIST as readonly string[]).includes(mime);
}

export const MAX_ATTACHMENT_SIZE_BYTES = 104_857_600; // 100 MB

export function isWithinSizeLimit(bytes: number): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= MAX_ATTACHMENT_SIZE_BYTES;
}
