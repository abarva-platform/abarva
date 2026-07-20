// Source · Stage Guidebooks · types
//
// Facilitator guide content for the working session that moves a Source event
// through a stage's gate — purpose, agenda, talking points, and a
// decision-capture worksheet. Mirrors
// supabase/migrations/20260720130000_source_stage_guidebooks.sql.
//
// Source-native and parallel to (not shared with) the Moves workshop system
// (src/lib/workshops/). That system's template/section content shape informed
// this one; nothing here reads or writes its tables.

import type { SourceStageKey } from "@/lib/source/types";

export type SourceStageGuidebookSectionType =
  | "purpose"
  | "agenda"
  | "facilitator_brief"
  | "worksheet"
  | "decision_capture"
  | "pre_mortem";

export type SourceStageGuidebookStatus = "draft" | "published";

export interface SourceStageGuidebookSection {
  type: SourceStageGuidebookSectionType;
  title: string;
  /** Markdown body. Facilitator-facing — may reference internal process detail. */
  body: string;
  timeBoxMinutes?: number | null;
}

export interface SourceStageGuidebookRecord {
  id: string;
  stageKey: SourceStageKey;
  /** null = the global default guidebook for this stage. */
  clientKey: string | null;
  title: string;
  purpose: string;
  durationMinutes: number;
  status: SourceStageGuidebookStatus;
  sections: SourceStageGuidebookSection[];
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
