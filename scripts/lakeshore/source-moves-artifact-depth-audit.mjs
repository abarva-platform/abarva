import pg from 'pg';
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const { Client } = pg;
const execFileAsync = promisify(execFile);

const clientIdOverride = process.env.LAKESHORE_CLIENT_ID;
const tenantKey = process.env.LAKESHORE_TENANT_KEY ?? 'lakeshore';
const brokerTenantKey = process.env.LAKESHORE_BROKER_TENANT_KEY ?? 'lakeshore-holdings';
const outputRoot = process.env.LAKESHORE_ARTIFACT_DEPTH_OUT ?? 'audit-artifacts/lakeshore-source-moves-artifact-depth';
const storageAccount = process.env.LAKESHORE_AZURE_STORAGE_ACCOUNT ?? 'stlakeshorepilotlsh001';
const runId = `lakeshore-source-moves-artifact-depth-${new Date().toISOString().replace(/[:.]/g, '-')}-${await gitSha()}`;
const outputDir = path.join(outputRoot, runId);

const sourceExpectations = {
  'LSH-KYRIBA-TREASURY-2026': {
    posture: 'flagship_full_artifact_spine',
    safeDemo: 'Show Strategy through BAFO as approved, Executive Decision as in review, and Selection/Transition/Value as artifact-backed downstream preview.',
    expectedCurrentStage: 'executive_decision',
    stageMinimums: {
      strategy: { states: 3, linked: 3, approved: 3 },
      scope: { states: 5, linked: 5, approved: 5 },
      rfp: { states: 4, linked: 4, approved: 4 },
      responses: { states: 3, linked: 3, approved: 3 },
      evaluation: { states: 3, linked: 3, approved: 3 },
      pricing: { states: 3, linked: 3, approved: 3 },
      bafo: { states: 2, linked: 2, approved: 2 },
      executive_decision: { states: 3, linked: 3, inReview: 1 },
      selection: { states: 2, linked: 2, inReview: 1 },
      transition: { states: 3, linked: 3, inReview: 1 },
      value: { states: 2, linked: 2, inReview: 1 },
    },
    requiredBlobPrefix: 'lakeshore/LSH-KYRIBA-TREASURY-2026/',
  },
  'LSH-AMS-MODERNIZATION-2026': {
    posture: 'evaluation_stage_story_only',
    safeDemo: 'Show Strategy, Scope, RFP, and Responses as approved with Evaluation in review. Do not demo Pricing, BAFO, Decision, Selection, Transition, or Value as complete.',
    expectedCurrentStage: 'evaluation',
    stageMinimums: {
      strategy: { states: 3, linked: 3, approved: 3 },
      scope: { states: 5, linked: 5, approved: 5 },
      rfp: { states: 4, linked: 4, approved: 4 },
      responses: { states: 3, linked: 3, approved: 3 },
      evaluation: { states: 3, linked: 3, inReview: 1 },
    },
    forbiddenCompleteStages: ['pricing', 'bafo', 'executive_decision', 'selection', 'transition', 'value'],
    requiredBlobPrefix: 'lakeshore/LSH-AMS-MODERNIZATION-2026/',
  },
};

const moveExpectations = {
  'Kyriba global treasury rollout': {
    posture: 'document_real_flagship_move',
    expectedDeliverables: 6,
    expectedAttachments: 12,
  },
  'Shared data platform and evidence spine': {
    posture: 'document_real_second_move',
    expectedDeliverables: 6,
    expectedAttachments: 6,
  },
  'Northline WMS modernization': { posture: 'row_only_not_artifact_demo', expectedDeliverables: 0, expectedAttachments: 0 },
  'Freight visibility and exception AI': { posture: 'row_only_not_artifact_demo', expectedDeliverables: 0, expectedAttachments: 0 },
  'Brightmark loyalty platform consolidation': { posture: 'row_only_not_artifact_demo', expectedDeliverables: 0, expectedAttachments: 0 },
  'Promotion sourcing control tower': { posture: 'row_only_not_artifact_demo', expectedDeliverables: 0, expectedAttachments: 0 },
};

async function gitSha() {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' });
    return stdout.trim();
  } catch {
    return 'nogit';
  }
}

function databaseUrl() {
  const url = process.env.DATABASE_URL ?? process.env.ABARVA_AZURE_DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL or ABARVA_AZURE_DATABASE_URL is required');
  return url;
}

async function query(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows;
}

async function azJson(args) {
  try {
    const { stdout } = await execFileAsync('az', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
    const trimmed = stdout.trim();
    return { ok: true, data: trimmed ? JSON.parse(trimmed) : null };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      stderr: error.stderr?.trim(),
    };
  }
}

async function countBlobs(container, prefix) {
  if (!prefix) return { checked: false, count: null, names: [] };
  let result = await azJson([
    'storage',
    'blob',
    'list',
    '--account-name',
    storageAccount,
    '--container-name',
    container,
    '--prefix',
    prefix,
    '--auth-mode',
    'login',
    '--query',
    '[].name',
    '-o',
    'json',
  ]);
  if (!result.ok && /auth-mode.*key|Storage Blob Data Reader|Storage Blob Data Contributor/i.test(result.stderr || result.error || '')) {
    result = await azJson([
      'storage',
      'blob',
      'list',
      '--account-name',
      storageAccount,
      '--container-name',
      container,
      '--prefix',
      prefix,
      '--auth-mode',
      'key',
      '--query',
      '[].name',
      '-o',
      'json',
    ]);
  }
  if (!result.ok) return { checked: true, count: null, error: 'blob_list_failed' };
  const names = Array.isArray(result.data) ? result.data : [];
  return { checked: true, count: names.length };
}

function statusFromIssues(issues) {
  return issues.length === 0 ? 'pass' : 'watch';
}

function assessSourceEvent(event, stageRows, blobProof) {
  const expectation = sourceExpectations[event.event_code];
  const issues = [];
  const byStage = Object.fromEntries(stageRows.map((row) => [row.stage_key, row]));

  if (!expectation) {
    issues.push('No explicit demo expectation is registered for this Source event.');
  } else {
    if (event.current_stage_key !== expectation.expectedCurrentStage) {
      issues.push(`Current stage is ${event.current_stage_key}; expected ${expectation.expectedCurrentStage}.`);
    }

    for (const [stage, minimum] of Object.entries(expectation.stageMinimums)) {
      const row = byStage[stage] ?? {};
      const states = Number(row.state_count ?? 0);
      const linked = Number(row.linked_count ?? 0);
      const approved = Number(row.approved_count ?? 0);
      const inReview = Number(row.in_review_count ?? 0) + Number(row.needs_review_count ?? 0);
      const bodies = Number(row.authored_body_count ?? 0);
      const chunks = Number(row.chunk_count ?? 0);
      const facts = Number(row.fact_count ?? 0);
      if (states < minimum.states) issues.push(`${stage} has ${states} artifact states; expected at least ${minimum.states}.`);
      if (linked < minimum.linked) issues.push(`${stage} has ${linked} linked artifacts; expected at least ${minimum.linked}.`);
      if (minimum.approved && approved < minimum.approved) issues.push(`${stage} has ${approved} approved artifacts; expected at least ${minimum.approved}.`);
      if (minimum.inReview && inReview < minimum.inReview) issues.push(`${stage} has ${inReview} review-state artifacts; expected at least ${minimum.inReview}.`);
      if (bodies < minimum.linked) issues.push(`${stage} has ${bodies} authored bodies; expected at least ${minimum.linked}.`);
      if (chunks < minimum.linked) issues.push(`${stage} has ${chunks} chunks; expected at least ${minimum.linked}.`);
      if (facts < minimum.linked) issues.push(`${stage} has ${facts} facts; expected at least ${minimum.linked}.`);
    }

    for (const stage of expectation.forbiddenCompleteStages ?? []) {
      const row = byStage[stage];
      if (Number(row?.approved_count ?? 0) > 0) {
        issues.push(`${stage} has approved artifacts but should not be presented as complete for this demo.`);
      }
    }

    if (blobProof.checked && blobProof.count !== null && blobProof.count === 0) {
      issues.push(`No Azure Blob files found under ${expectation.requiredBlobPrefix}.`);
    }
  }

  return {
    eventCode: event.event_code,
    eventName: event.event_name,
    currentStage: event.current_stage_key,
    lifecycleState: event.lifecycle_state,
    posture: expectation?.posture ?? 'unclassified',
    safeDemo: expectation?.safeDemo ?? 'Treat as not demo-qualified until classified.',
    status: statusFromIssues(issues),
    issues,
    stageRows,
    blobProof,
  };
}

function assessMove(move, blobProof) {
  const expectation = moveExpectations[move.name];
  const issues = [];
  const deliverables = Number(move.deliverable_count ?? 0);
  const versions = Number(move.version_count ?? 0);
  const attachments = Number(move.attachment_count ?? 0);

  if (!expectation) {
    issues.push('No explicit demo expectation is registered for this Move.');
  } else {
    if (deliverables < expectation.expectedDeliverables) {
      issues.push(`Move has ${deliverables} deliverables; expected at least ${expectation.expectedDeliverables}.`);
    }
    if (expectation.expectedDeliverables > 0 && versions < expectation.expectedDeliverables) {
      issues.push(`Move has ${versions} deliverable versions; expected at least ${expectation.expectedDeliverables}.`);
    }
    if (attachments < expectation.expectedAttachments) {
      issues.push(`Move has ${attachments} DB attachments; expected at least ${expectation.expectedAttachments}.`);
    }
    if (blobProof.checked && blobProof.count !== null && blobProof.count < expectation.expectedAttachments) {
      issues.push(`Move has ${blobProof.count} Azure Blob attachments; expected at least ${expectation.expectedAttachments}.`);
    }
  }

  return {
    name: move.name,
    phase: move.current_phase,
    status: move.status,
    valueProjectedLowUsd: move.value_projected_low_usd,
    valueProjectedHighUsd: move.value_projected_high_usd,
    posture: expectation?.posture ?? 'unclassified',
    statusAssessment: statusFromIssues(issues),
    issues,
    deliverableCount: deliverables,
    deliverableVersionCount: versions,
    attachmentCount: attachments,
    evidenceLinkCount: Number(move.evidence_link_count ?? 0),
    blobProof,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderSourceTable(rows) {
  return `<table><thead><tr><th>Event</th><th>Posture</th><th>Status</th><th>Current Stage</th><th>Blob Count</th><th>Issues</th></tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr class="${row.status}"><td>${escapeHtml(row.eventCode)}<br><span>${escapeHtml(row.eventName)}</span></td><td>${escapeHtml(row.posture)}</td><td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.currentStage)}</td><td>${escapeHtml(row.blobProof.count ?? 'not checked')}</td><td>${escapeHtml(row.issues.join(' ') || 'None')}</td></tr>`,
    )
    .join('')}</tbody></table>`;
}

function renderMoveTable(rows) {
  return `<table><thead><tr><th>Move</th><th>Posture</th><th>Status</th><th>Deliverables</th><th>Versions</th><th>DB Attachments</th><th>Blob Attachments</th><th>Issues</th></tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr class="${row.statusAssessment}"><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.posture)}</td><td>${escapeHtml(row.statusAssessment)}</td><td>${row.deliverableCount}</td><td>${row.deliverableVersionCount}</td><td>${row.attachmentCount}</td><td>${escapeHtml(row.blobProof.count ?? 'not checked')}</td><td>${escapeHtml(row.issues.join(' ') || 'None')}</td></tr>`,
    )
    .join('')}</tbody></table>`;
}

function renderStageDetails(events) {
  return events
    .map(
      (event) => `<h3>${escapeHtml(event.eventCode)}</h3>
      <p>${escapeHtml(event.safeDemo)}</p>
      <table><thead><tr><th>Stage</th><th>States</th><th>Linked</th><th>Approved</th><th>In Review</th><th>Needs Review</th><th>Bodies</th><th>Chunks</th><th>Facts</th><th>Edges</th></tr></thead><tbody>${event.stageRows
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row.stage_key)}</td><td>${row.state_count}</td><td>${row.linked_count}</td><td>${row.approved_count}</td><td>${row.in_review_count}</td><td>${row.needs_review_count}</td><td>${row.authored_body_count}</td><td>${row.chunk_count}</td><td>${row.fact_count}</td><td>${row.edge_count}</td></tr>`,
        )
        .join('')}</tbody></table>`,
    )
    .join('');
}

function renderReport(summary) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lakeshore Source/Moves Artifact Depth Audit</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #18221f; background: #f7f4ed; }
    h1 { margin-bottom: 4px; }
    .meta, p { color: #52615b; }
    .pill { display: inline-block; margin: 16px 0; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5cf; background: #fff; font-weight: 750; }
    table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #d8ded8; margin: 14px 0 26px; }
    th, td { text-align: left; border-bottom: 1px solid #e6e9e4; padding: 8px 10px; vertical-align: top; font-size: 13px; }
    th { background: #edf1ec; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .pass td:nth-child(3), .pass td:first-child { color: #116b3a; font-weight: 800; }
    .watch td:nth-child(3), .watch td:first-child { color: #8a5c00; font-weight: 800; }
    span { color: #52615b; }
  </style>
</head>
<body>
  <h1>Lakeshore Source/Moves Artifact Depth Audit</h1>
  <div class="meta">Checked at ${escapeHtml(summary.checkedAt)} · git ${escapeHtml(summary.gitSha)}</div>
  <div class="pill">Status: ${escapeHtml(summary.status)} · ${summary.totals.pass} pass · ${summary.totals.watch} watch</div>
  <p>This audit validates whether demo Source events and Moves have real synthetic artifacts, authored bodies, parsed chunks/facts/edges, and Azure Blob files/attachments for the stages being presented.</p>
  <h2>Source Events</h2>
  ${renderSourceTable(summary.sourceEvents)}
  <h2>Moves</h2>
  ${renderMoveTable(summary.moves)}
  <h2>Source Stage Details</h2>
  ${renderStageDetails(summary.sourceEvents)}
</body>
</html>`;
}

async function collect() {
  const client = new Client({ connectionString: databaseUrl(), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const clientRow = await query(
      client,
      `select id, name, slug, tenant_key
         from clients
        where ($1::uuid is not null and id = $1::uuid)
           or tenant_key = $2
           or slug = $3
        order by case when tenant_key = $2 then 0 else 1 end
        limit 1`,
      [clientIdOverride || null, brokerTenantKey, brokerTenantKey],
    );
    const clientId = clientRow[0]?.id;
    if (!clientId) throw new Error(`Could not resolve Lakeshore client row for tenant ${brokerTenantKey}`);

    const sourceRows = await query(
      client,
      `select id, event_code, event_name, current_stage_key, lifecycle_state, linked_program_id
         from source_events
        where client_key = $1
        order by event_code`,
      [tenantKey],
    );

    const sourceEvents = [];
    for (const event of sourceRows) {
      const stageRows = await query(
        client,
        `select s.stage_key,
                count(*)::int as state_count,
                count(s.linked_artifact_id)::int as linked_count,
                count(*) filter (where coalesce(a.approval_state, s.status) = 'approved')::int as approved_count,
                count(*) filter (where coalesce(a.approval_state, s.status) = 'in_review')::int as in_review_count,
                count(*) filter (where coalesce(a.approval_state, s.status) = 'needs_review')::int as needs_review_count,
                count(*) filter (where length(coalesce(s.body, '')) > 80)::int as authored_body_count,
                count(distinct c.id)::int as chunk_count,
                count(distinct f.id)::int as fact_count,
                count(distinct g.id)::int as edge_count
           from source_event_artifact_states s
           left join source_artifacts a on a.id = s.linked_artifact_id and a.deleted_at is null
           left join source_artifact_chunks c on c.artifact_id = a.id
           left join source_artifact_facts f on f.artifact_id = a.id
           left join source_graph_edges g on g.artifact_id = a.id
          where s.tenant_key = $1
            and s.source_event_id = $2
          group by s.stage_key
          order by case s.stage_key
            when 'strategy' then 1 when 'scope' then 2 when 'rfp' then 3 when 'responses' then 4
            when 'evaluation' then 5 when 'pricing' then 6 when 'bafo' then 7
            when 'executive_decision' then 8 when 'selection' then 9 when 'transition' then 10
            when 'value' then 11 else 99 end`,
        [tenantKey, event.id],
      );
      const blobProof = await countBlobs('source-artifacts', sourceExpectations[event.event_code]?.requiredBlobPrefix);
      sourceEvents.push(assessSourceEvent(event, stageRows, blobProof));
    }

    const moveRows = await query(
      client,
      `select e.id,
              e.name,
              e.current_phase,
              e.status,
              e.value_projected_low_usd,
              e.value_projected_high_usd,
              count(distinct d.id)::int as deliverable_count,
              count(distinct v.id)::int as version_count,
              count(distinct pa.id)::int as attachment_count,
              0::int as evidence_link_count
         from engagements e
         left join deliverables_v2 d on d.engagement_id = e.id
         left join deliverable_versions v on v.deliverable_id = d.id
         left join program_attachments pa on pa.program_id = e.id and pa.deleted_at is null
        where e.client_id = $1
          and e.archived_at is null
          and e.deleted_at is null
        group by e.id, e.name, e.current_phase, e.status, e.value_projected_low_usd, e.value_projected_high_usd
        order by e.name`,
      [clientId],
    );

    const moves = [];
    for (const move of moveRows) {
      const expectation = moveExpectations[move.name];
      const prefix = expectation?.expectedAttachments > 0 ? `${brokerTenantKey}/${move.id}/` : null;
      const blobProof = await countBlobs('program-attachments', prefix);
      moves.push(assessMove(move, blobProof));
    }

    const totals = {
      pass:
        sourceEvents.filter((event) => event.status === 'pass').length +
        moves.filter((move) => move.statusAssessment === 'pass').length,
      watch:
        sourceEvents.filter((event) => event.status === 'watch').length +
        moves.filter((move) => move.statusAssessment === 'watch').length,
    };

    return {
      status: totals.watch === 0 ? 'demo_artifact_depth_green' : 'demo_artifact_depth_with_watches',
      checkedAt: new Date().toISOString(),
      gitSha: await gitSha(),
      client: {
        name: clientRow[0].name,
        slug: clientRow[0].slug,
        tenantKey: clientRow[0].tenant_key,
      },
      tenantKey,
      brokerTenantKey,
      sourceEvents,
      moves,
      totals,
      demoDecision: {
        flagshipSource: 'LSH-KYRIBA-TREASURY-2026',
        secondarySource: 'LSH-AMS-MODERNIZATION-2026 only through Evaluation',
        flagshipMoves: ['Kyriba global treasury rollout', 'Shared data platform and evidence spine'],
        rowOnlyMoves:
          'Northline WMS modernization, Freight visibility and exception AI, Brightmark loyalty platform consolidation, and Promotion sourcing control tower should not be presented as document-real.',
      },
      outputDir,
    };
  } finally {
    await client.end();
  }
}

const summary = await collect();
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(path.join(outputDir, 'report.html'), renderReport(summary));
console.log(JSON.stringify({ status: summary.status, totals: summary.totals, outputDir }, null, 2));
