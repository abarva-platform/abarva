// Moves · evidence upload · the bounds the CONTROL states, before the bytes move.
//
// `POST /api/v1/programs/:programId/artifacts/upload` refuses on two bounds it
// does not share with its control: a 14-entry MIME allowlist and a 100 MB cap,
// both in `./mime.ts`. The cabinet's picker declared neither. It carried no
// `accept`, no stated cap and no stated format list, so the only way a reviewer
// learned either bound was to pick a file, wait out the entire upload, and read
// the refusal — which `move-upload-refusal.ts` words well, but words after the
// fact. On a 300 MB recording over a hotel connection that is the whole wait
// for an answer the control already had.
//
// This module is the one place that states those bounds, so the sentence shown
// BEFORE the upload and the sentence shown AFTER a refusal cannot drift:
// `move-upload-refusal.ts` reads its format prose and its size wording from
// here rather than keeping copies.
//
// Why `accept` carries EXTENSIONS as well as MIME types. The route's type check
// is `if (file.type && !isAllowedMimeType(file.type))` — an empty `file.type`
// is ACCEPTED, because a browser that cannot type a file is not evidence about
// the file. A MIME-only `accept` would therefore hide files the server takes:
// a `.md` or `.csv` that the OS reports with no type at all. The extensions are
// keyed by MIME type in a `Record` over the allowlist's own union, so a type
// added to the allowlist without extensions does not compile, and the two
// halves of `accept` cannot fall out of step with the list the server enforces.
//
// `accept` is a picker HINT. It filters the default view and a reviewer can
// still choose "All files", so nothing here can refuse an upload the route
// would have taken — which is the property that makes deriving it safe.
//
// Pure module: no I/O, no React, no `server-only`.

import {
  ATTACHMENT_MIME_ALLOWLIST,
  MAX_ATTACHMENT_SIZE_BYTES,
  type AllowedMimeType,
} from "./mime";

/**
 * The filename extensions that belong to each allowlisted MIME type.
 *
 * Keyed by the allowlist's union, so the compiler requires an entry for every
 * accepted type: a new type cannot be allowlisted and left out of the picker.
 */
const EXTENSIONS_BY_MIME: Record<AllowedMimeType, readonly string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "text/markdown": [".md", ".markdown"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/json": [".json"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "audio/mpeg": [".mp3"],
  "audio/mp4": [".m4a"],
  "video/mp4": [".mp4"],
};

/** Every extension the picker offers, derived from the allowlist. */
export const ACCEPTED_UPLOAD_EXTENSIONS: readonly string[] = Object.freeze(
  Array.from(
    new Set(
      ATTACHMENT_MIME_ALLOWLIST.flatMap((mime) => EXTENSIONS_BY_MIME[mime]),
    ),
  ),
);

/**
 * The `accept` attribute for a Moves upload picker: every allowlisted MIME
 * type, then every extension those types cover.
 */
export const UPLOAD_ACCEPT_ATTRIBUTE: string = [
  ...ATTACHMENT_MIME_ALLOWLIST,
  ...ACCEPTED_UPLOAD_EXTENSIONS,
].join(",");

/**
 * The file formats the upload allowlist accepts, in reviewer language.
 *
 * Read by `move-upload-refusal.ts` for the `unsupported_type` sentence, so the
 * formats a reviewer is offered and the formats a refusal names are one string.
 */
export const ACCEPTED_UPLOAD_FORMATS =
  "PDF, Word, Excel, PowerPoint, CSV, JSON, Markdown or plain text, a PNG or " +
  "JPEG image, or an MP3/M4A/MP4 recording";

/** The upload cap as the limit itself states it, never a retyped literal. */
export function describeUploadSizeLimit(
  bytes: number = MAX_ATTACHMENT_SIZE_BYTES,
): string {
  const megabytes = bytes / (1024 * 1024);
  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}

/**
 * The one sentence the upload control shows before a file is chosen: what it
 * takes, and how large. Both halves come from the values the route refuses on.
 */
export function describeUploadBounds(): string {
  return `Accepts ${ACCEPTED_UPLOAD_FORMATS}, up to ${describeUploadSizeLimit()}.`;
}
