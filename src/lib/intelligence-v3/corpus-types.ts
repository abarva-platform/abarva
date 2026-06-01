import type { AttentionItem, PatternRow } from '@/components/intelligence-v3/cxo-fixtures';
import type { RetailIntelligenceStatus } from '@/components/intelligence-v3/types';
import type { BriefData, MapData } from '@/lib/knowledge-corpus/types';

export interface IntelligenceCorpusData {
  status?: RetailIntelligenceStatus | null;
  patterns?: PatternRow[];
  todayItems?: AttentionItem[];
  mapData: MapData;
  briefData: BriefData;
}
