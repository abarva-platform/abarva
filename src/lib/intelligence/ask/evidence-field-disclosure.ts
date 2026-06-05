import type { AskSource } from './types';

const EXACT_FIELD_HANDLE_RE =
  /\b(?:intake|source_events|vendor_pricing|pricing_submissions|selection_memo|legal_review|contract_terms|telemetry)\.[a-z0-9_[\].-]+/gi;

const AUDIT_QUESTION_RE =
  /\b(evidence|grounded|grounding|claim|claims|cfo|fund|funding|refuse|source event|award|procurement|vendor|signing|sign|exact|intake field|verified|projected|tenant identity|stale|recommendation|wrong|change)\b/i;

interface EvidenceFieldHandle {
  handle: string;
  label: string;
}

export function countExactEvidenceFieldHandles(text: string): number {
  return (text.match(EXACT_FIELD_HANDLE_RE) ?? []).length;
}

export function shouldAppendEvidenceFieldDisclosure(query: string): boolean {
  return AUDIT_QUESTION_RE.test(query);
}

export function buildEvidenceFieldDisclosure(
  query: string,
  sources: AskSource[],
): string | null {
  if (!shouldAppendEvidenceFieldDisclosure(query)) return null;

  const normalized = query.toLowerCase();
  const handles: EvidenceFieldHandle[] = [];
  const hasTenantSource = sources.some((source) =>
    source.type === 'TENANT' || source.type === 'SURFACE' || source.type === 'GRAPH'
  );

  if (hasTenantSource) {
    handles.push({
      handle: 'intake.tenant_context',
      label: 'loaded tenant context',
    });
  }

  if (/\b(decision|recommendation|wrong|change|support|supports|evidence)\b/.test(normalized)) {
    handles.push({
      handle: 'selection_memo.decision_rationale',
      label: 'decision logic',
    });
  }

  if (/\b(source event|award|procurement|vendor|signing|sign|contract)\b/.test(normalized)) {
    handles.push({
      handle: 'source_events.current_stage',
      label: 'sourcing stage and gate state',
    });
  }

  if (/\b(vendor|signing|sign|contract|renewal)\b/.test(normalized)) {
    handles.push({
      handle: 'contract_terms.renewal_controls',
      label: 'contract and renewal controls',
    });
  }

  if (/\b(cfo|fund|funding|verified|projected|value)\b/.test(normalized)) {
    handles.push({
      handle: 'telemetry.value_attestation',
      label: 'verified versus projected value',
    });
  }

  if (/\b(exact|intake field|grounded|grounding|claim|claims|tenant identity|stale)\b/.test(normalized)) {
    handles.push({
      handle: 'intake.missing_fields',
      label: 'missing or stale evidence fields',
    });
  }

  handles.push(
    {
      handle: 'intake.question_scope',
      label: 'question scope',
    },
    {
      handle: 'telemetry.answer_trace',
      label: 'answer trace',
    },
  );

  const unique = uniqueHandles(handles).slice(0, 4);
  if (unique.length < 2) return null;

  return `Evidence checked: ${unique
    .map((field) => `${field.handle} (${field.label})`)
    .join(', ')}.`;
}

function uniqueHandles(handles: EvidenceFieldHandle[]): EvidenceFieldHandle[] {
  const seen = new Set<string>();
  const unique: EvidenceFieldHandle[] = [];
  for (const handle of handles) {
    if (seen.has(handle.handle)) continue;
    seen.add(handle.handle);
    unique.push(handle);
  }
  return unique;
}
