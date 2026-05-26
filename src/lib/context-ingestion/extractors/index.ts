import { getTemplateById } from '../template-registry';
import type {
  ExtractedContextFact,
  FileClassification,
  UploadedFileInput,
} from '../types';

function stableId(parts: string[]): string {
  return parts
    .join(':')
    .toLowerCase()
    .replace(/[^a-z0-9:._-]+/g, '-')
    .replace(/-+/g, '-');
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? '']));
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === ',' && !quoted) {
      out.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  out.push(current);
  return out;
}

function parseJsonRows(text: string): Array<Record<string, unknown>> {
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) return parsed as Array<Record<string, unknown>>;
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>).map(([key, value]) => ({
        key,
        value,
      }));
    }
  }
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

export function extractContextFacts(args: {
  tenantKey: 'northstar';
  uploadId: string;
  file: UploadedFileInput;
  classification: FileClassification;
}): ExtractedContextFact[] {
  const { uploadId, file, classification } = args;
  const template = getTemplateById(classification.templateType);
  const text = file.text ?? '';
  const rows =
    classification.format === 'csv'
      ? parseCsv(text)
      : classification.format === 'json' || classification.format === 'jsonl'
        ? parseJsonRows(text)
        : [{ document_text: text.slice(0, 1200), title: file.fileName }];

  const required = template?.requiredFields ?? [];
  const fields = new Set([
    ...required,
    ...rows.flatMap((row) => Object.keys(row)),
  ]);

  return rows.flatMap((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const entityKey =
      String(row.id ?? row.app_id ?? row.vendor_id ?? row.initiative_id ?? row.product_family_id ?? row.person_id ?? row.event_id ?? `${uploadId}:row:${rowNumber}`);
    return Array.from(fields).map((field) => {
      const value = (row as Record<string, unknown>)[field] ?? '';
      return {
        id: stableId(['fact', uploadId, entityKey, field]),
        tenantKey: 'northstar',
        dimension: classification.dimension,
        entityType: classification.dimension,
        entityKey,
        field,
        value,
        valueText: String(value ?? ''),
        sourceFileId: uploadId,
        sourceLocator: {
          fileName: file.fileName,
          row: classification.extractionStrategy === 'structured_rows' ? rowNumber : undefined,
          page: classification.format === 'pdf' ? 1 : undefined,
          paragraph: classification.format === 'docx' || classification.format === 'markdown' ? 1 : undefined,
          slide: classification.format === 'pptx' ? 1 : undefined,
        },
        confidence: classification.llmExtractionNeeded ? 0.74 : 0.91,
        extractionMethod: classification.llmExtractionNeeded ? 'hybrid' : 'deterministic',
        requiresApproval: true,
        approvalRole: classification.requiredApprovalRole,
        validationFindings: [],
      } satisfies ExtractedContextFact;
    });
  });
}
