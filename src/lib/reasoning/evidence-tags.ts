export const EVIDENCE_TAGS = ['financial', 'technical', 'legal', 'operational', 'market'] as const;
export type EvidenceTag = typeof EVIDENCE_TAGS[number];
