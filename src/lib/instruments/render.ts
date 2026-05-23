import { Document, Packer, Paragraph, TextRun } from 'docx';
import { withInstrumentClient } from './db';
import { getInstrumentTemplate } from './authoring';
import type { InstrumentFormat, InstrumentTemplateRecord, RenderInstrumentResult } from './types';

type ClientColumnHints = {
  clientId: string;
  applicationColumns: string[];
  teamColumns: string[];
  sampleApplications: string[];
  sampleTeams: string[];
};

const CONTENT_TYPES: Record<InstrumentFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  json: 'application/json; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  sql: 'application/sql; charset=utf-8',
  interactive_form: 'application/schema+json; charset=utf-8',
};

const EXTENSIONS: Record<InstrumentFormat, string> = {
  csv: 'csv',
  md: 'md',
  json: 'json',
  docx: 'docx',
  sql: 'sql',
  interactive_form: 'schema.json',
};

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function scalar(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function csvCell(value: unknown): string {
  const raw = scalar(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
}

function resolveSchemaColumns(template: InstrumentTemplateRecord): string[] {
  const properties = template.schema.properties;
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    return Object.keys(properties);
  }
  const columns = asArray(template.schema.columns);
  if (columns.length > 0) {
    return columns
      .map((column) => {
        if (typeof column === 'string') return column;
        if (column && typeof column === 'object' && 'name' in column) return scalar((column as { name: unknown }).name);
        return '';
      })
      .filter(Boolean);
  }
  return ['client_id', 'instrument_slug', 'response_owner', 'evidence_link', 'notes'];
}

async function getClientColumnHints(clientId: string): Promise<ClientColumnHints> {
  return withInstrumentClient(async (client) => {
    const [apps, teams] = await Promise.all([
      client.query<{ app_id: string; name: string; stack: string; language: string }>(
        `
          SELECT app_id, name, stack, language
          FROM public.application_portfolio
          WHERE client_id = $1 AND deleted_at IS NULL
          ORDER BY criticality_tier ASC, annual_run_cost_usd DESC
          LIMIT 3
        `,
        [clientId],
      ),
      client.query<{ team_id: string; name: string; type: string; geo: string }>(
        `
          SELECT team_id, name, type, geo
          FROM public.org_topology
          WHERE client_id = $1 AND deleted_at IS NULL
          ORDER BY size_fte DESC
          LIMIT 3
        `,
        [clientId],
      ),
    ]);
    return {
      clientId,
      applicationColumns: ['app_id', 'name', 'stack', 'language', 'time_classification', 'ai_fit_score'],
      teamColumns: ['team_id', 'name', 'type', 'geo', 'maturity_stage'],
      sampleApplications: apps.rows.map((row) => `${row.app_id}:${row.name} (${row.stack}/${row.language})`),
      sampleTeams: teams.rows.map((row) => `${row.team_id}:${row.name} (${row.type}, ${row.geo})`),
    };
  }).catch(() => ({
    clientId,
    applicationColumns: ['app_id', 'name', 'stack', 'language', 'time_classification', 'ai_fit_score'],
    teamColumns: ['team_id', 'name', 'type', 'geo', 'maturity_stage'],
    sampleApplications: [],
    sampleTeams: [],
  }));
}

function interpolateTemplate(
  template: InstrumentTemplateRecord,
  hints: ClientColumnHints,
  format: InstrumentFormat,
): string {
  const replacements: Record<string, string> = {
    clientId: hints.clientId,
    client_id: hints.clientId,
    instrumentId: template.id,
    instrument_id: template.id,
    instrumentSlug: template.slug,
    instrument_slug: template.slug,
    instrumentName: template.name,
    instrument_name: template.name,
    version: String(template.version),
    format,
    ownerRole: template.ownerRole,
    owner_role: template.ownerRole,
    refreshCadence: template.refreshCadence,
    refresh_cadence: template.refreshCadence,
    applicationColumnHints: hints.applicationColumns.join(', '),
    application_column_hints: hints.applicationColumns.join(', '),
    teamColumnHints: hints.teamColumns.join(', '),
    team_column_hints: hints.teamColumns.join(', '),
    sampleApplications: hints.sampleApplications.join('; '),
    sample_applications: hints.sampleApplications.join('; '),
    sampleTeams: hints.sampleTeams.join('; '),
    sample_teams: hints.sampleTeams.join('; '),
  };
  return template.contentTemplateText
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token: string) => replacements[token] ?? '')
    .replace(/\[([a-zA-Z0-9_]+)\]/g, (_match, token: string) => replacements[token] ?? '');
}

function renderCsv(template: InstrumentTemplateRecord, hints: ClientColumnHints): string {
  const columns = Array.from(new Set([
    'client_id',
    ...resolveSchemaColumns(template),
    'application_column_hints',
    'team_column_hints',
  ]));
  const sampleRows = [
    [
      hints.clientId,
      ...columns.slice(1, -2).map((column) => {
        if (column.toLowerCase().includes('app')) return hints.sampleApplications[0] ?? '';
        if (column.toLowerCase().includes('team')) return hints.sampleTeams[0] ?? '';
        if (column.toLowerCase().includes('owner')) return template.ownerRole;
        return '';
      }),
      hints.applicationColumns.join('|'),
      hints.teamColumns.join('|'),
    ],
  ];
  return [
    columns.map(csvCell).join(','),
    ...sampleRows.map((row) => row.map(csvCell).join(',')),
  ].join('\n');
}

function renderMarkdown(template: InstrumentTemplateRecord, hints: ClientColumnHints): string {
  return [
    `# ${template.name}`,
    '',
    `- Instrument: ${template.slug}`,
    `- Version: ${template.version}`,
    `- T-tier: T${template.tTier}`,
    `- Owner: ${template.ownerRole}`,
    `- Refresh cadence: ${template.refreshCadence}`,
    '',
    '## Client Hints',
    `Application columns: ${hints.applicationColumns.join(', ')}`,
    `Team columns: ${hints.teamColumns.join(', ')}`,
    hints.sampleApplications.length ? `Sample applications: ${hints.sampleApplications.join('; ')}` : '',
    hints.sampleTeams.length ? `Sample teams: ${hints.sampleTeams.join('; ')}` : '',
    '',
    '## Privacy',
    template.privacyBlock,
    '',
    '## Instrument',
    interpolateTemplate(template, hints, 'md'),
  ].filter((line) => line !== '').join('\n');
}

function renderJson(template: InstrumentTemplateRecord, hints: ClientColumnHints): string {
  return JSON.stringify({
    id: template.id,
    slug: template.slug,
    name: template.name,
    version: template.version,
    category: template.category,
    tTier: template.tTier,
    ownerRole: template.ownerRole,
    refreshCadence: template.refreshCadence,
    schema: template.schema,
    sampleSizeMath: template.sampleSizeMath,
    biasControls: template.biasControls,
    privacyBlock: template.privacyBlock,
    validationRules: template.validationRules,
    triangulationPlan: template.triangulationPlan,
    edgeCaseGuide: template.edgeCaseGuide,
    clientHints: hints,
    content: interpolateTemplate(template, hints, 'json'),
  }, null, 2);
}

function renderSql(template: InstrumentTemplateRecord, hints: ClientColumnHints): string {
  const body = interpolateTemplate(template, hints, 'sql').trim();
  return [
    '-- Discovery instrument extraction template',
    `-- Instrument: ${template.slug} v${template.version}`,
    '-- Parameters:',
    '--   $1::uuid = client_id',
    '--   $2::date = start_date (nullable)',
    '--   $3::date = end_date (nullable)',
    '',
    body || [
      'SELECT',
      '  $1::uuid AS client_id,',
      `  '${template.slug.replaceAll("'", "''")}'::text AS instrument_slug,`,
      '  app_id,',
      '  name,',
      '  stack,',
      '  language,',
      '  time_classification,',
      '  ai_fit_score',
      'FROM public.application_portfolio',
      'WHERE client_id = $1',
      '  AND deleted_at IS NULL;',
    ].join('\n'),
    '',
    `-- Client-specific application column hints: ${hints.applicationColumns.join(', ')}`,
    `-- Client-specific team column hints: ${hints.teamColumns.join(', ')}`,
  ].join('\n');
}

function renderInteractiveForm(template: InstrumentTemplateRecord, hints: ClientColumnHints): string {
  return JSON.stringify({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: template.name,
    description: `Interactive capture form for ${template.slug} v${template.version}.`,
    type: 'object',
    properties: template.schema.properties ?? template.schema,
    required: template.schema.required ?? [],
    metadata: {
      instrumentId: template.id,
      version: template.version,
      tTier: template.tTier,
      ownerRole: template.ownerRole,
      privacyBlock: template.privacyBlock,
      validationRules: template.validationRules,
      clientHints: hints,
    },
  }, null, 2);
}

async function renderDocx(template: InstrumentTemplateRecord, hints: ClientColumnHints): Promise<Buffer> {
  const markdown = renderMarkdown(template, hints);
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: markdown.split('\n').map((line) => new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: line.startsWith('#'),
            }),
          ],
        })),
      },
    ],
  });
  return Packer.toBuffer(doc);
}

export async function renderInstrument(
  instrumentId: string,
  version: number | undefined,
  clientId: string,
  format: InstrumentFormat,
): Promise<RenderInstrumentResult> {
  const template = await getInstrumentTemplate(instrumentId, version);
  const hints = await getClientColumnHints(clientId);
  const filename = `${template.slug}-v${template.version}.${EXTENSIONS[format]}`;

  if (format === 'docx') {
    return {
      bytes: await renderDocx(template, hints),
      contentType: CONTENT_TYPES.docx,
      filename,
      format,
    };
  }

  const bytes = format === 'csv'
    ? renderCsv(template, hints)
    : format === 'md'
      ? renderMarkdown(template, hints)
      : format === 'json'
        ? renderJson(template, hints)
        : format === 'sql'
          ? renderSql(template, hints)
          : renderInteractiveForm(template, hints);

  return {
    bytes,
    contentType: CONTENT_TYPES[format],
    filename,
    format,
  };
}
