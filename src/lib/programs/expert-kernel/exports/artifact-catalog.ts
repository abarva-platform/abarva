// Moves Expert Kernel — exportable-artifact catalog.
//
// The single source of truth for WHAT the kernel can produce as a downloadable
// file. Each entry binds a stable artifact id to: the Moves phase it belongs
// to (Discover / Charter / Design & Plan / Mobilize), the file formats it is
// available in, and a human label / description.
//
// The download route, the Expert Review Console UI, and the renderer tests
// all read this catalog so the set of downloadable artifacts is defined once.
//
// Pure module: deterministic, no I/O.

/** The four Moves phases the kernel produces deliverables for. */
export type MovesPhase = 'discover' | 'charter' | 'design_plan' | 'mobilize';

/** The three export file formats. */
export type ArtifactFormat = 'docx' | 'xlsx' | 'pdf';

/** The stable artifact ids the kernel can export. */
export type KernelArtifactId =
  | 'discover_brief'
  | 'charter_case'
  | 'business_case_pack'
  | 'financial_model'
  | 'cfo_pack'
  | 'mobilize_pack';

/** Human label for each Moves phase, display order implied by the array. */
export const MOVES_PHASE_LABEL: Record<MovesPhase, string> = {
  discover: 'Discover',
  charter: 'Charter',
  design_plan: 'Design & Plan',
  mobilize: 'Mobilize & Handoff',
};

/** One entry in the exportable-artifact catalog. */
export interface KernelArtifactEntry {
  id: KernelArtifactId;
  /** The Moves phase this deliverable belongs to. */
  phase: MovesPhase;
  /** Short human label. */
  label: string;
  /** What the artifact contains — surfaced in the download UI. */
  description: string;
  /** Formats this artifact is downloadable in. */
  formats: ArtifactFormat[];
}

/** Display order of the phases in the download UI. */
export const MOVES_PHASE_ORDER: readonly MovesPhase[] = [
  'discover',
  'charter',
  'design_plan',
  'mobilize',
];

/**
 * The artifact catalog. Each artifact maps to deliverables the kernel already
 * produces (spec §8 deliverable table):
 *
 *  - discover_brief    — problem statement · baseline · opportunity · go/no-go
 *  - charter_case      — quantified value hypothesis · case skeleton · kill criteria
 *  - business_case_pack— costed business case · roadmap · human+agent RACI
 *  - financial_model   — baseline metrics · effort · value forecast · sensitivity · roadmap
 *  - cfo_pack          — the §9 7-part CFO answer, one document
 *  - mobilize_pack     — mobilization plan · adoption approach · measurement model · go-decision pack
 */
export const KERNEL_ARTIFACTS: readonly KernelArtifactEntry[] = Object.freeze([
  {
    id: 'discover_brief',
    phase: 'discover',
    label: 'Discover brief',
    description:
      'Problem statement, current-state baseline (with source and seed ' +
      'gaps), opportunity sizing and the go/no-go read.',
    formats: ['docx', 'pdf'],
  },
  {
    id: 'charter_case',
    phase: 'charter',
    label: 'Charter business-case skeleton',
    description:
      'The quantified value hypothesis, the CFO-readable business-case ' +
      'skeleton and the stop/kill criteria.',
    formats: ['docx', 'pdf'],
  },
  {
    id: 'business_case_pack',
    phase: 'design_plan',
    label: 'Costed business-case pack',
    description:
      'The full Design & Plan business case: costed roadmap, value-and-' +
      'effort profile and the human+agent RACI, in CFO-readable prose.',
    formats: ['docx', 'pdf'],
  },
  {
    id: 'financial_model',
    phase: 'design_plan',
    label: 'Financial model',
    description:
      'The spreadsheet model: baseline metrics, effort estimate by ' +
      'workstream, value forecast with haircuts, three-scenario ' +
      'sensitivity and the costed roadmap.',
    formats: ['xlsx'],
  },
  {
    id: 'cfo_pack',
    phase: 'design_plan',
    label: 'CFO business-case pack',
    description:
      'A one-document CFO pack — the seven-part answer standard: the ' +
      'answer, the case, the assumptions, what would make it wrong, what ' +
      'not to fund yet, what Tower will measure, the evidence and gaps.',
    formats: ['pdf'],
  },
  {
    id: 'mobilize_pack',
    phase: 'mobilize',
    label: 'Mobilize & go-decision packet',
    description:
      'The mobilization plan, adoption & change approach, the value-' +
      'measurement model handed to Tower and the go-decision pack.',
    formats: ['docx', 'pdf'],
  },
]);

/** True when `value` is a known artifact id. */
export function isKernelArtifactId(
  value: unknown,
): value is KernelArtifactId {
  return (
    typeof value === 'string' &&
    KERNEL_ARTIFACTS.some((a) => a.id === value)
  );
}

/** True when `value` is a known export format. */
export function isArtifactFormat(value: unknown): value is ArtifactFormat {
  return value === 'docx' || value === 'xlsx' || value === 'pdf';
}

/** Resolve an artifact id to its catalog entry, or null when unknown. */
export function resolveKernelArtifact(
  id: string | null | undefined,
): KernelArtifactEntry | null {
  return KERNEL_ARTIFACTS.find((a) => a.id === id) ?? null;
}

/** True when the artifact supports the given format. */
export function artifactSupportsFormat(
  id: KernelArtifactId,
  format: ArtifactFormat,
): boolean {
  const entry = resolveKernelArtifact(id);
  return entry !== null && entry.formats.includes(format);
}

/** MIME content type for each export format. */
export const ARTIFACT_CONTENT_TYPE: Record<ArtifactFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};
