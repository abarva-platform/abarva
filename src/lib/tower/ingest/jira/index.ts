import type { TowerIngestSource } from '../registry';

export * from './parse';

export const jiraSource: TowerIngestSource = {
  key: 'jira',
  displayName: 'Jira — epics, stories, velocity, cycle time',
  vendor: 'Atlassian',
  kind: 'productivity',
  targetTable: 'tower_jira_issues',
  templatePath: '/templates/tower/jira/template.xlsx',
  samplePath: '/templates/tower/jira/template.xlsx',
  readmePath: 'docs/templates/tower/jira/README.md',
  parserModule: 'lib/tower/ingest/jira/parse',
  validatorModule: 'lib/tower/ingest/jira/parse',
  cliScript: 'ingest-jira',
  extractPath:
    'Jira → Issues filter → Export Excel CSV (current fields); OR REST /rest/api/3/search?jql=… with history expansion.',
  sampleSummary: { tenant: 'Northwind Retail', rowsApprox: 200 },
};
