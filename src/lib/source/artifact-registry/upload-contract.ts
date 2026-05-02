import type { SourceStageKey } from '../types';
import type { SourceArtifactFamily, SourceArtifactFormat } from './types';

export function sourceArtifactFormatFromMime(mimeType: string): SourceArtifactFormat {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'xlsx';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'pptx';
    case 'text/markdown':
      return 'markdown';
    case 'text/csv':
      return 'csv';
    case 'text/plain':
      return 'txt';
    case 'image/png':
    case 'image/jpeg':
      return 'image';
    case 'audio/mpeg':
    case 'audio/mp4':
      return 'audio';
    case 'video/mp4':
      return 'video';
    default:
      return 'unknown';
  }
}

export function inferSourceArtifactFamily(args: {
  stageKey: SourceStageKey;
  filename: string;
  requestedFamily?: string | null;
}): SourceArtifactFamily {
  if (isSourceArtifactFamily(args.requestedFamily)) return args.requestedFamily;

  const name = args.filename.toLowerCase();
  if (name.includes('bafo')) return 'bafo';
  if (name.includes('rfp')) return 'rfp';
  if (name.includes('rfi')) return 'rfi';
  if (name.includes('scorecard') || name.includes('evaluation')) return 'scorecard';
  if (name.includes('pricing') || name.includes('rate') || name.includes('commercial')) {
    return 'pricing_workbook';
  }
  if (name.includes('meeting') || name.includes('minutes') || name.includes('notes')) {
    return 'meeting_notes';
  }
  if (name.includes('workshop')) return 'workshop_output';
  if (name.includes('value') || name.includes('kpi') || name.includes('realization') || name.includes('realisation')) {
    return 'value_ledger';
  }
  if (name.includes('strategy')) return 'sourcing_strategy';
  if (name.includes('scope')) return 'scope_document';
  if (name.includes('transition') || name.includes('risk')) return 'transition_risk_register';

  switch (args.stageKey) {
    case 'rfp_rfi_package':
      return 'rfp';
    case 'vendor_responses':
      return 'proposal';
    case 'orals_bafo':
      return 'bafo';
    case 'selection':
      return 'decision_brief';
    case 'scope':
      return 'scope_document';
    case 'sourcing_strategy':
      return 'sourcing_strategy';
    case 'value_realization':
      return 'value_ledger';
    default:
      return 'other';
  }
}

function isSourceArtifactFamily(value: string | null | undefined): value is SourceArtifactFamily {
  return (
    value === 'rfi' ||
    value === 'rfp' ||
    value === 'bafo' ||
    value === 'scorecard' ||
    value === 'pricing_workbook' ||
    value === 'proposal' ||
    value === 'meeting_notes' ||
    value === 'workshop_output' ||
    value === 'decision_brief' ||
    value === 'transition_risk_register' ||
    value === 'value_ledger' ||
    value === 'sourcing_strategy' ||
    value === 'scope_document' ||
    value === 'other'
  );
}
