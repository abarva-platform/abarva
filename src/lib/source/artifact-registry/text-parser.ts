// Source artifact text parsing.
//
// This is the synchronous, first-mile parser for text-like Source uploads. It
// does not replace the async binary/parser/vector/graph pipeline. It makes
// pasted notes, Markdown, text, and CSV uploads immediately useful by writing
// chunks and lightweight structured evidence into the existing Source parsed
// object tables.

import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';
import type { SourceStageKey } from '../types';
import { updateSourceArtifactProcessingState } from './index';
import type {
  SourceArtifactFamily,
  SourceArtifactFormat,
  SourceArtifactRegistryRecord,
} from './types';

const MAX_CHUNK_CHARS = 1_800;
const MAX_STRUCTURED_ROWS = 30;

export function isSynchronouslyParseableSourceFormat(format: SourceArtifactFormat): boolean {
  return format === 'markdown' || format === 'txt' || format === 'csv' || format === 'html';
}

interface ParsedLine {
  kind: string;
  text: string;
  owner?: string;
  dueDate?: string;
}

interface ExtractedPricingComponent {
  label: string;
  amountUsd: number;
  unit?: string;
  yearIndex?: number;
  pricingModel?: string;
  sourceText: string;
}

interface TextArtifactParseInput {
  artifact: SourceArtifactRegistryRecord;
  text: string;
}

function normalizeText(text: string): string {
  return text.replace(/\u0000/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function chunkText(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const paragraph of paragraphs.length > 0 ? paragraphs : [text]) {
    if ((current + '\n\n' + paragraph).trim().length > MAX_CHUNK_CHARS && current.trim()) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = (current ? `${current}\n\n${paragraph}` : paragraph).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.flatMap((chunk) => {
    if (chunk.length <= MAX_CHUNK_CHARS) return [chunk];
    const parts: string[] = [];
    for (let i = 0; i < chunk.length; i += MAX_CHUNK_CHARS) {
      parts.push(chunk.slice(i, i + MAX_CHUNK_CHARS).trim());
    }
    return parts.filter(Boolean);
  });
}

function stripMarkdownBullet(line: string): string {
  return line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, '').trim();
}

function extractLabeledLines(text: string): ParsedLine[] {
  const rows: ParsedLine[] = [];
  for (const rawLine of text.split('\n')) {
    const line = stripMarkdownBullet(rawLine);
    if (!line) continue;
    const match = line.match(/^(decision|decided|action|todo|owner|risk|issue|gap|requirement|req|commitment|sla|kpi|metric|baseline|assumption)\s*[:\-]\s*(.+)$/i);
    if (!match) continue;
    const kind = match[1].toLowerCase();
    const body = match[2].trim();
    const ownerMatch =
      body.match(/\bowner\s*=\s*(.+?)(?=\s+\bdue\s*[=:]|[;|,]|$)/i) ??
      body.match(/\bowner\s*:\s*(.+?)(?=\s+\bdue\s*[=:]|[;|,]|$)/i);
    const dueMatch = body.match(/\bdue\s*=\s*(\d{4}-\d{2}-\d{2})/i) ?? body.match(/\bdue\s*:\s*(\d{4}-\d{2}-\d{2})/i);
    rows.push({
      kind,
      text: body,
      owner: ownerMatch?.[1]?.trim(),
      dueDate: dueMatch?.[1],
    });
    if (rows.length >= MAX_STRUCTURED_ROWS) break;
  }
  return rows;
}

function factTypeForLine(kind: string): string {
  if (['decision', 'decided'].includes(kind)) return 'decision';
  if (['action', 'todo', 'owner'].includes(kind)) return 'action_item';
  if (['risk', 'issue', 'gap'].includes(kind)) return 'risk_or_gap';
  if (['requirement', 'req'].includes(kind)) return 'requirement';
  if (['commitment', 'sla'].includes(kind)) return 'vendor_commitment';
  if (['kpi', 'metric', 'baseline'].includes(kind)) return 'metric_or_baseline';
  return 'source_note';
}

function extractPricingComponents(text: string): ExtractedPricingComponent[] {
  const components: ExtractedPricingComponent[] = [];
  const amountRe = /(?:(?:USD|\$)\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(m|mm|million|k|thousand)?(?:\s*(?:usd|dollars))?/gi;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || !/(price|pricing|rate|cost|fee|tco|run-rate|run rate|savings|value|commercial|labor|offshore|onshore)/i.test(line)) {
      continue;
    }
    let match: RegExpExecArray | null;
    while ((match = amountRe.exec(line)) !== null) {
      const matchedAmountText = match[0] ?? '';
      const hasCurrencyMarker = /\$|\bUSD\b/i.test(matchedAmountText);
      const hasMagnitudeSuffix = Boolean(match[3]);
      if (!hasCurrencyMarker && !hasMagnitudeSuffix) continue;

      const base = Number(match[1].replace(/,/g, '') + (match[2] ? `.${match[2]}` : ''));
      if (!Number.isFinite(base)) continue;
      const suffix = match[3]?.toLowerCase();
      const amountUsd = suffix === 'm' || suffix === 'mm' || suffix === 'million'
        ? base * 1_000_000
        : suffix === 'k' || suffix === 'thousand'
          ? base * 1_000
          : base;
      components.push({
        label: line.slice(0, 120),
        amountUsd,
        unit: /hour|hr/i.test(line) ? 'hour' : /month/i.test(line) ? 'month' : /year|annual/i.test(line) ? 'year' : undefined,
        yearIndex: Number(line.match(/\byear\s*(\d)\b/i)?.[1] ?? '') || undefined,
        pricingModel: /fixed/i.test(line) ? 'fixed' : /variable|usage/i.test(line) ? 'variable' : undefined,
        sourceText: line,
      });
      if (components.length >= MAX_STRUCTURED_ROWS) return components;
    }
  }
  return components;
}

function shouldWriteRequirements(stageKey: SourceStageKey, family: SourceArtifactFamily): boolean {
  return (
    family === 'scope_document' ||
    family === 'rfp' ||
    stageKey === 'scope' ||
    stageKey === 'rfp_rfi_package'
  );
}

function shouldWriteMeetingOutcomes(family: SourceArtifactFamily): boolean {
  return family === 'meeting_notes' || family === 'workshop_output';
}

function shouldWriteVendorCommitments(family: SourceArtifactFamily): boolean {
  return family === 'proposal' || family === 'bafo';
}

function isPricingFamily(family: SourceArtifactFamily): boolean {
  return family === 'pricing_workbook' || family === 'value_ledger' || family === 'proposal' || family === 'bafo';
}

function provenanceFor(artifact: SourceArtifactRegistryRecord, sourceText?: string) {
  return {
    artifact_id: artifact.id,
    artifact_name: artifact.originalName,
    artifact_family: artifact.artifactFamily,
    source_origin: artifact.sourceOrigin,
    parser: 'source_text_first_mile_v1',
    ...(sourceText ? { source_text: sourceText.slice(0, 500) } : {}),
  };
}

export async function parseSourceTextArtifact(
  input: TextArtifactParseInput,
): Promise<SourceArtifactRegistryRecord> {
  const text = normalizeText(input.text);
  const { artifact } = input;
  if (!text) {
    return updateSourceArtifactProcessingState({
      artifactId: artifact.id,
      parseStatus: 'failed',
      classificationStatus: 'rejected',
      evidenceState: 'unparsed',
    });
  }

  const supabase = getServerSupabase();
  const chunks = chunkText(text);
  const labeledLines = extractLabeledLines(text);
  const pricing = isPricingFamily(artifact.artifactFamily) ? extractPricingComponents(text) : [];
  const provenance = provenanceFor(artifact);

  const chunkRows = chunks.map((chunk, index) => ({
    artifact_id: artifact.id,
    tenant_key: artifact.tenantKey,
    source_event_id: artifact.sourceEventId,
    chunk_id: `${artifact.id}:chunk:${String(index + 1).padStart(3, '0')}`,
    chunk_text: chunk,
    chunk_kind: artifact.sourceFormat === 'csv' ? 'source_csv_chunk' : 'source_document_chunk',
    provenance: { ...provenance, chunk_index: index + 1 },
    confidence: 0.9,
  }));
  if (chunkRows.length > 0) {
    const { error } = await supabase.from('source_artifact_chunks').insert(chunkRows);
    if (error) throw error;
  }

  const factRows = [
    {
      artifact_id: artifact.id,
      tenant_key: artifact.tenantKey,
      source_event_id: artifact.sourceEventId,
      fact_type: 'artifact_summary',
      fact_key: 'text_uploaded',
      fact_value: {
        character_count: text.length,
        chunk_count: chunks.length,
        labeled_line_count: labeledLines.length,
        pricing_component_count: pricing.length,
      },
      provenance,
      confidence: 0.85,
    },
    ...labeledLines.map((line, index) => ({
      artifact_id: artifact.id,
      tenant_key: artifact.tenantKey,
      source_event_id: artifact.sourceEventId,
      fact_type: factTypeForLine(line.kind),
      fact_key: `${factTypeForLine(line.kind)}_${String(index + 1).padStart(2, '0')}`,
      fact_value: {
        kind: line.kind,
        text: line.text,
        ...(line.owner ? { owner: line.owner } : {}),
        ...(line.dueDate ? { due_date: line.dueDate } : {}),
      },
      provenance: provenanceFor(artifact, line.text),
      confidence: 0.82,
    })),
  ];
  const { error: factError } = await supabase.from('source_artifact_facts').insert(factRows);
  if (factError) throw factError;

  if (shouldWriteRequirements(artifact.stageKey, artifact.artifactFamily)) {
    const requirementRows = labeledLines
      .filter((line) => ['requirement', 'req', 'sla', 'kpi', 'metric'].includes(line.kind))
      .slice(0, MAX_STRUCTURED_ROWS)
      .map((line, index) => ({
        artifact_id: artifact.id,
        tenant_key: artifact.tenantKey,
        source_event_id: artifact.sourceEventId,
        requirement_key: `REQ-${String(index + 1).padStart(3, '0')}`,
        requirement_text: line.text,
        requirement_category: line.kind === 'sla' ? 'service_level' : line.kind === 'kpi' || line.kind === 'metric' ? 'measurement' : 'functional',
        required: true,
        provenance: provenanceFor(artifact, line.text),
        confidence: 0.8,
      }));
    if (requirementRows.length > 0) {
      const { error } = await supabase.from('source_requirements').insert(requirementRows);
      if (error) throw error;
    }
  }

  if (shouldWriteMeetingOutcomes(artifact.artifactFamily)) {
    const outcomeRows = labeledLines
      .filter((line) => ['decision', 'decided', 'action', 'todo', 'risk', 'issue', 'gap'].includes(line.kind))
      .slice(0, MAX_STRUCTURED_ROWS)
      .map((line) => ({
        artifact_id: artifact.id,
        tenant_key: artifact.tenantKey,
        source_event_id: artifact.sourceEventId,
        outcome_type: factTypeForLine(line.kind),
        outcome_text: line.text,
        owner: line.owner ?? null,
        due_date: line.dueDate ?? null,
        status: ['decision', 'decided'].includes(line.kind) ? 'closed' : 'open',
        provenance: provenanceFor(artifact, line.text),
        confidence: 0.82,
      }));
    if (outcomeRows.length > 0) {
      const { error } = await supabase.from('source_meeting_outcomes').insert(outcomeRows);
      if (error) throw error;
    }
  }

  if (shouldWriteVendorCommitments(artifact.artifactFamily)) {
    const commitmentRows = labeledLines
      .filter((line) => ['commitment', 'sla', 'kpi', 'metric'].includes(line.kind))
      .slice(0, MAX_STRUCTURED_ROWS)
      .map((line) => ({
        artifact_id: artifact.id,
        tenant_key: artifact.tenantKey,
        source_event_id: artifact.sourceEventId,
        vendor_id: null,
        commitment_type: line.kind,
        commitment_text: line.text,
        metric: {},
        provenance: provenanceFor(artifact, line.text),
        confidence: 0.8,
      }));
    if (commitmentRows.length > 0) {
      const { error } = await supabase.from('source_vendor_commitments').insert(commitmentRows);
      if (error) throw error;
    }
  }

  if (pricing.length > 0) {
    const pricingRows = pricing.map((component, index) => ({
      artifact_id: artifact.id,
      tenant_key: artifact.tenantKey,
      source_event_id: artifact.sourceEventId,
      vendor_id: null,
      component_key: `PRICE-${String(index + 1).padStart(3, '0')}`,
      component_label: component.label,
      amount_usd: component.amountUsd,
      unit: component.unit ?? null,
      year_index: component.yearIndex ?? null,
      pricing_model: component.pricingModel ?? null,
      assumptions: {},
      provenance: provenanceFor(artifact, component.sourceText),
      confidence: 0.72,
    }));
    const { error } = await supabase.from('source_pricing_components').insert(pricingRows);
    if (error) throw error;
  }

  return updateSourceArtifactProcessingState({
    artifactId: artifact.id,
    parseStatus: 'parsed',
    classificationStatus: 'classified',
    evidenceState: 'parsed_uncited',
  });
}
