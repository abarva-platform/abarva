-- Allow 'xlsx' as a generated_artifacts.output_format.
--
-- The estimate_model / financial_model deliverable renders as an Excel workbook — that is
-- its prescribed primary format (orchestrated-deliverable-map.prescribedFormatForDeliverableType
-- returns 'xlsx' for estimate_model/financial_model), and the orchestrator builds an xlsx
-- companion for any table flagged targetFormat 'xlsx' (renderers.ts). The app type layer has
-- always allowed it (GeneratedArtifactFormat / OutputFormat include 'xlsx').
--
-- But the original generated_artifacts_v1 CHECK permitted only pptx/pdf/html/docx, so every
-- xlsx insert failed with:
--   new row for relation "generated_artifacts" violates check constraint
--   "generated_artifacts_output_format_check"
-- i.e. financial models could be generated but never PERSISTED. Surfaced by the full
-- P1→P5 deliverable arc on First Capital (2026-06-19): the financial_model run was the only
-- xlsx deliverable and it alone failed on insert while all docx deliverables persisted.
--
-- Fix: widen the constraint to include 'xlsx'. Additive; no data change.

ALTER TABLE public.generated_artifacts
  DROP CONSTRAINT IF EXISTS generated_artifacts_output_format_check;

ALTER TABLE public.generated_artifacts
  ADD CONSTRAINT generated_artifacts_output_format_check
  CHECK (output_format IN ('pptx', 'pdf', 'html', 'docx', 'xlsx'));
