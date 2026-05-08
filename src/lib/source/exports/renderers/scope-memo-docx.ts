// Source · d05 Scope Memo · docx renderer
//
// Slice 3.1 first-cut renderer; Slice 3.2 generalized the per-artifact
// shape into narrative-docx.ts. This file is now a thin wrapper that
// preserves the original buildScopeMemoDocx export (used by tests + the
// dispatcher) and delegates to the generic builder.

import 'server-only';

import type { Document } from 'docx';

import {
  SCOPE_MEMO_DOCX_CONFIG,
  buildNarrativeDocx,
  type NarrativeDocxPayload,
} from './narrative-docx';

/**
 * Payload shape preserved from Slice 3.1 (typed alias of the generic
 * narrative payload). Keeps existing imports working.
 */
export type ScopeMemoDocxPayload = NarrativeDocxPayload;

export function buildScopeMemoDocx(payload: ScopeMemoDocxPayload): Document {
  return buildNarrativeDocx(payload, SCOPE_MEMO_DOCX_CONFIG);
}
