// Programs · doc-parser · text extraction facade (Step 8.2-D)
//
// Thin facade over the upload-time evidence extraction pipeline. Exposes
// a simple `extractAndChunk` function suitable for fire-and-forget
// invocation from the workspace upload API. All heavy lifting (PDF via
// pdf-parse, DOCX via mammoth, XLSX via exceljs, plain text/CSV direct
// read) is implemented in `evidence-ingestion.ts`.
//
// Usage pattern (fire-and-forget in an API route):
//   void extractAndChunk({ attachmentId, moveId, filename, mimeType, buffer, phase })
//     .catch(console.error);
//
// Dependency fallback strategy:
//   - pdf-parse: available (^2.4.5 in package.json) — used via evidence-ingestion.ts
//   - mammoth: available (^1.12.0 in package.json) — used via evidence-ingestion.ts
//   - TXT/CSV: read as UTF-8 directly, no library needed
//   - XLSX: exceljs (available) — used via evidence-ingestion.ts
//
// Chunking: extracted text is split into ~800-char chunks with a ~100-char
// overlap and stored in `enterprise_context_chunks` so the broker can
// retrieve attachment content during Nexus reasoning.
//
// Spec: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section B.4 (file uploads), slice OV2-4b/d.

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import {
  extractProgramEvidenceFromUploadBuffer,
  type ExtractedProgramEvidence,
} from './evidence-ingestion';

export const CHUNK_SIZE = 800;
export const CHUNK_OVERLAP = 100;

export interface ExtractAndChunkInput {
  /** The `program_attachments.id` row — used as source_record_id. */
  attachmentId: string;
  /** The engagement / program / move ID — used as source_segment_id. */
  moveId: string;
  /** The tenant key (broker format, e.g. 'apex-retail'). */
  tenantKey: string;
  filename: string;
  mimeType: string;
  /** Raw file bytes (already in memory from the upload path). */
  buffer: Buffer;
  /** Phase 0–6, if known. Stored in chunk metadata. */
  phase?: number | null;
}

export interface ChunkRecord {
  // enterprise_context_chunks schema (migration 20260430121500)
  tenant_key: string;
  chunk_id: string;
  source_segment_id: string;
  source_record_id: string;
  source_doc: string;
  source_path: string;
  chunk_index: number;
  chunk_text: string;
  embedding_status: string;
  provenance: Record<string, unknown>;
  chunk_metadata: Record<string, unknown>;
}

/**
 * Split `text` into overlapping fixed-size chunks. Attempts to split at
 * whitespace boundaries where possible. Returns an empty array when text
 * is empty or whitespace-only.
 */
export function splitIntoChunks(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP,
): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = start + chunkSize;
    if (end >= normalized.length) {
      chunks.push(normalized.slice(start));
      break;
    }

    // Find the last whitespace within the chunk window so we don't slice
    // mid-word. Walk back from `end` at most `overlap` chars.
    let boundary = end;
    for (let i = end; i >= end - overlap && i > start; i--) {
      if (/\s/.test(normalized[i])) {
        boundary = i;
        break;
      }
    }

    chunks.push(normalized.slice(start, boundary));
    // Advance by (chunkSize - overlap) to keep the overlap window.
    start = boundary - overlap > start ? boundary - overlap : start + 1;
  }

  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Fire-and-forget: extract text from the uploaded buffer, split into
 * chunks, and insert into `enterprise_context_chunks`.
 *
 * Call as:
 *   void extractAndChunk(input).catch(console.error);
 *
 * Never throws into the caller (all errors surfaced via console.error).
 */
export async function extractAndChunk(input: ExtractAndChunkInput): Promise<void> {
  const { attachmentId, moveId, tenantKey, filename, mimeType, buffer, phase } = input;

  let evidence: ExtractedProgramEvidence;
  try {
    evidence = await extractProgramEvidenceFromUploadBuffer({
      filename,
      mimeType,
      buffer,
    });
  } catch (err) {
    console.error('[doc-parser] extractProgramEvidenceFromUploadBuffer failed', {
      attachmentId,
      filename,
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const rawText = evidence.extractedText;
  if (!rawText || !rawText.trim()) {
    console.warn('[doc-parser] no text extracted — skipping chunk insert', {
      attachmentId,
      filename,
      parseMethod: evidence.extractedStructured.parse_method,
    });
    return;
  }

  const chunkTexts = splitIntoChunks(rawText);
  if (chunkTexts.length === 0) {
    return;
  }

  const parseMethod = evidence.extractedStructured.parse_method;
  const warnings = evidence.extractedStructured.warnings;

  // enterprise_context_chunks schema (migration 20260430121500):
  //   tenant_key, chunk_id (unique per tenant), source_segment_id,
  //   source_record_id, source_doc, source_path, chunk_index,
  //   chunk_text, embedding_status, provenance, chunk_metadata.
  //
  // Naming convention for program attachments:
  //   source_segment_id = moveId   (the program/engagement the attachment belongs to)
  //   source_record_id  = attachmentId
  //   source_doc        = filename
  //   source_path       = "program_attachment/{attachmentId}"
  //   chunk_id          = "{attachmentId}-{index}"  (unique within tenant)
  const rows: ChunkRecord[] = chunkTexts.map((chunkText, index) => ({
    tenant_key: tenantKey,
    chunk_id: `${attachmentId}-${index}`,
    source_segment_id: moveId,
    source_record_id: attachmentId,
    source_doc: filename,
    source_path: `program_attachment/${attachmentId}`,
    chunk_index: index,
    chunk_text: chunkText,
    embedding_status: 'pending',
    provenance: {
      source_type: 'program_attachment',
      parse_method: parseMethod,
      uploaded_at: new Date().toISOString(),
    },
    chunk_metadata: {
      filename,
      phase: phase ?? null,
      total_chunks: chunkTexts.length,
      parse_method: parseMethod,
      warnings,
    },
  }));

  const sb = getServerSupabase();
  const { error } = await sb.from('enterprise_context_chunks').insert(rows);
  if (error) {
    // Log but do not crash the upload response — chunking is best-effort.
    console.error('[doc-parser] chunk insert failed', {
      attachmentId,
      moveId,
      tenantKey,
      chunkCount: rows.length,
      error: error.message,
    });
    return;
  }

  console.info('[doc-parser] chunks inserted', {
    attachmentId,
    moveId,
    tenantKey,
    chunkCount: rows.length,
    parseMethod,
  });
}
