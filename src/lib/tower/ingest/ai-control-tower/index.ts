import type { TowerIngestSource } from '../registry';

export {
  buildAiControlTowerLoadPlan,
  aiControlTowerSheetKey,
  type AiControlTowerCanonicalPackage,
  type AiControlTowerDerivedActionRow,
  type AiControlTowerLoadDiagnostic,
  type AiControlTowerLoadPlan,
} from '@/lib/ai-control-tower/load-plan';
export {
  prepareAiControlTowerCommitBatch,
  writeAiControlTowerLoadPlan,
  type AiControlTowerCommitBatch,
  type AiControlTowerWriteResult,
} from '@/lib/ai-control-tower/persistence';

export const aiControlTowerSource: TowerIngestSource = {
  key: 'ai-control-tower',
  displayName: 'AI Control Tower monthly refresh',
  vendor: 'AbarVa template / enterprise source exports',
  kind: 'value',
  targetTable: 'ai_control_refresh_runs',
  templatePath: '/templates/tower/ai-control-tower/AI_Control_Tower_Monthly_Refresh_Template_v1.xlsx',
  samplePath: '/templates/tower/ai-control-tower/AI_Control_Tower_Monthly_Refresh_Template_v1.xlsx',
  readmePath: 'docs/build/ai-control-tower-template/README.md',
  parserModule: 'lib/tower/ingest/ai-control-tower',
  validatorModule: 'lib/ai-control-tower/contracts',
  cliScript: 'ingest-ai-control-tower',
  extractPath:
    'Monthly workbook or API connector bundle covering AI initiatives, Copilot/Claude/Codex usage, DORA, ServiceNow, ERP agents, spend, benefits, risks, and evidence.',
  sampleSummary: { tenant: 'First Capital Financial Synthetic Bank', rowsApprox: 65 },
};
