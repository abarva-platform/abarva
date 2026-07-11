export type ModuleMemoryStatus =
  | 'proposed'
  | 'evidence-linked'
  | 'validated'
  | 'approved'
  | 'promoted'
  | 'superseded'
  | 'retired'
  | 'rejected'
  | 'benchmark-eligible'
  | 'benchmark-excluded';

export interface ModuleMemoryRecord {
  memoryKey: string;
  tenantKey: string;
  moduleKey: 'home' | 'intelligence' | 'moves' | 'source' | 'tower' | 'export';
  eventType: string;
  status: ModuleMemoryStatus;
  summary: string;
  evidenceKeys: string[];
  createdAt: string;
  approvedBy?: string;
  promotedFactKeys?: string[];
}
