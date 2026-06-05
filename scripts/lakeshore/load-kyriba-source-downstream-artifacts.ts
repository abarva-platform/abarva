import crypto from 'node:crypto';

import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import pg from 'pg';

const { Client } = pg;

type Artifact = {
  code: string;
  name: string;
  stage: 'selection' | 'transition' | 'value';
  family: string;
  requirementLevel: 'required' | 'recommended';
  gateDefining: boolean;
  filename: string;
  approvalState: 'in_review' | 'needs_review';
  facts: Record<string, unknown>;
  body: string;
};

const tenantKey = 'lakeshore';
const eventCode = 'LSH-KYRIBA-TREASURY-2026';
const createdBy = 'codex-lakeshore-downstream-source-loader-v1';
const containerName = 'source-artifacts';

const artifacts: Artifact[] = [
  {
    code: 'd27_selection_memo',
    name: 'Selection Memo',
    stage: 'selection',
    family: 'selection_memo',
    requirementLevel: 'required',
    gateDefining: true,
    filename: 'd27_selection_memo-selection-memo.md',
    approvalState: 'in_review',
    facts: {
      recommendation: 'Proceed with Northern Trust as treasury bank connectivity anchor and Kyriba as the treasury workstation of record.',
      decision_owner: 'Lakeshore CFO with Treasurer and Audit Committee consultation',
      selected_partner: 'Northern Trust relationship bank connectivity anchor; Kyriba implementation partner of record to be contracted separately',
      residual_condition: 'Final contract execution and implementation SOW redlines remain open.',
    },
    body: `# Selection Memo - Kyriba Treasury Rollout

## Executive selection

Lakeshore should proceed with a treasury platform rollout anchored on Kyriba, with Northern Trust treated as the first bank-connectivity path because it carries the highest concentration of family-office, trust, and operating liquidity. The selection is not a technology vanity move. It is the control answer to daily cash visibility, covenant forecasting, intercompany lending discipline, and audit-grade board reporting across Lakeshore's HoldCo structure.

## Why this selection is defensible

- The current model depends on bank portals, manual file consolidation, and fragmented HoldCo reporting.
- The bank matrix already shows that several relationships can support host-to-host or SWIFT reporting, while a smaller tail requires remediation before go-live.
- The ERP feed audit makes clear that Kyriba cannot be asked to clean bad entity, GL, or AP/AR inputs after the fact.
- Intercompany loan true-up and cash concentration decisions need an owned treasury system of record, not spreadsheet reconciliation after month-end.

## Decision conditions

The selection is conditional on three controls before award is final:

1. Contract language must preserve Lakeshore's right to sequence banks by readiness, not by vendor convenience.
2. The implementation SOW must include entity hierarchy load, bank statement backfill, and ERP feed remediation as Phase 0 deliverables.
3. The CFO must receive a weekly rollout risk register until bank connectivity and historical cash reconstruction are green.

## Steward recommendation

Approve the selection path and authorize contract finalization, but do not release full transition funding until the six Move 0 gates remain owner-named and dated. This is a disciplined selection, not a blank check.`,
  },
  {
    code: 'd28_contract_record',
    name: 'Contract Record',
    stage: 'selection',
    family: 'selection_memo',
    requirementLevel: 'required',
    gateDefining: true,
    filename: 'd28_contract_record-contract-record.md',
    approvalState: 'in_review',
    facts: {
      contract_state: 'Synthetic contract record for demo; commercial terms are representative and pending counsel review.',
      effective_path: 'Master subscription agreement plus implementation SOW and bank-connectivity annex.',
      gating_terms: ['Bank onboarding SLA', 'data ownership', 'implementation exit rights', 'security addendum', 'audit support'],
    },
    body: `# Contract Record - Kyriba Treasury Rollout

## Contract package

This record captures the contract package required to move the Kyriba treasury rollout from selection into transition. It is synthetic demo evidence, but it reflects the contract architecture Lakeshore should expect: master subscription agreement, implementation statement of work, data-processing/security addendum, bank-connectivity annex, and service-level exhibit.

## Terms that cannot be skipped

- Bank onboarding service levels must be explicit by bank and protocol, including SWIFT, host-to-host, and portal fallback timing.
- Lakeshore retains ownership of extracted bank, ERP, and historical cash-position data.
- The implementation SOW must include entity hierarchy validation, not merely tenant configuration.
- Exit assistance must include export of cash position history, bank connectivity metadata, user roles, and audit logs.
- Security terms must cover privileged access, payment approval workflow controls, and evidence retention for audit committee review.

## Open redlines

Counsel should hold the line on three issues: unlimited vendor disclaimers for bank delays, weak audit-log retention language, and ambiguous responsibility for ERP feed defects. Those are not legal footnotes. They are where treasury rollouts stall.

## Approval posture

The contract record is suitable for selection-stage review. It is not yet a signed award record. The CFO, Treasurer, Counsel, and Audit Committee designee must clear the redline log before transition funding is released.`,
  },
  {
    code: 'd29_transition_plan',
    name: 'Transition Plan',
    stage: 'transition',
    family: 'transition_risk_register',
    requirementLevel: 'required',
    gateDefining: true,
    filename: 'd29_transition_plan-transition-plan.md',
    approvalState: 'in_review',
    facts: {
      transition_model: 'Phase 0 readiness, pilot bank wave, ERP feed remediation, historical reconstruction, parallel run, controlled cutover.',
      primary_owner: 'Treasurer',
      first_parallel_run: 'Daily cash position parallel run before market open Central time.',
    },
    body: `# Transition Plan - Kyriba Treasury Rollout

## Transition spine

The transition plan is built around a controlled parallel run, not a big-bang go-live. Lakeshore will treat Kyriba as board-grade only after bank statements, ERP feeds, entity hierarchy, and historical cash positions agree under daily operating pressure.

## Workstreams

1. Phase 0 readiness: finalize bank inventory, connectivity path, entity hierarchy, and data ownership.
2. Bank wave 1: Northern Trust, BMO, JPMorgan, and Wintrust reporting feeds.
3. ERP feed remediation: GL, AP, AR, cash account mapping, and entity code validation.
4. Historical reconstruction: 24 months of entity-currency-day cash position history loaded into the reporting layer.
5. Parallel run: Kyriba cash position compared against bank portals and controller packs for four close cycles.
6. Cutover: CFO approves production use after variance rules and audit log evidence are stable.

## Operating rules

- Daily cash position must be pre-walked by 9:00 a.m. Central.
- Variance over 5 percent or any unexplained restricted-cash movement triggers same-day reconciliation.
- Intercompany funding movements require documented note terms and monthly true-up evidence.
- No bank leaves the old process until its Kyriba feed has passed parallel-run evidence.

## Go/no-go posture

The plan is transition-ready once owners and dates are confirmed. It should not be sold internally as "Kyriba is live" until parallel-run evidence survives normal treasury stress.`,
  },
  {
    code: 'd30_checkpoint_log',
    name: 'Checkpoint Log',
    stage: 'transition',
    family: 'transition_risk_register',
    requirementLevel: 'required',
    gateDefining: true,
    filename: 'd30_checkpoint_log-checkpoint-log.md',
    approvalState: 'in_review',
    facts: {
      checkpoints: ['Bank wave 1 design', 'ERP feed certification', 'entity hierarchy signoff', 'parallel-run variance rule', 'cutover readiness'],
      status: 'In review',
      open_risks: ['Tail-bank onboarding duration', 'ERP account mapping cleanup', 'intercompany true-up ownership'],
    },
    body: `# Checkpoint Log - Kyriba Treasury Rollout

## Current checkpoint posture

The rollout is ready to enter transition planning but not unrestricted execution. The checkpoint log keeps the work honest: every milestone must be tied to a named owner, evidence artifact, and go/no-go call.

| Checkpoint | Owner | Status | Evidence required |
| --- | --- | --- | --- |
| Bank wave 1 design | Treasurer | In review | Connectivity matrix with protocol and target date by bank |
| ERP feed certification | Controller | In review | GL/AP/AR feed-quality scorecard and exception owner |
| Entity hierarchy signoff | CFO | In review | Corporate secretary and tax-approved entity registry |
| Historical cash reconstruction | Treasurer | In review | 24-month position coverage by entity-currency-day |
| Parallel-run variance rule | CFO | Drafted | Daily variance rule and escalation workflow |
| Cutover readiness | Audit Committee designee | Not started | Four-cycle parallel-run evidence packet |

## Open risks

Tail-bank onboarding can consume the calendar if no one names the fallback path. ERP mapping cleanup can become an accounting project disguised as implementation. Intercompany true-up ownership must sit with treasury and finance together, not with a systems integrator.

## Decision rule

A checkpoint is met only when the evidence artifact exists and the owner signs the go/no-go state. Meeting notes alone do not count.`,
  },
  {
    code: 'd31_kt_evidence',
    name: 'Knowledge-Transfer Evidence',
    stage: 'transition',
    family: 'transition_risk_register',
    requirementLevel: 'required',
    gateDefining: true,
    filename: 'd31_kt_evidence-knowledge-transfer-evidence.md',
    approvalState: 'in_review',
    facts: {
      kt_audiences: ['Treasury operations', 'Controller group', 'HoldCo CFO users', 'Audit Committee support'],
      excel_elimination_rule: 'Users must stop using standalone cash-position spreadsheets for production decisions after accepted parallel run.',
      evidence_required: ['attendance', 'role matrix', 'task walkthrough', 'user acceptance record'],
    },
    body: `# Knowledge-Transfer Evidence - Kyriba Treasury Rollout

## Training objective

Knowledge transfer is not a webinar. It is the point where the treasury team proves it can run daily cash, bank exception review, intercompany visibility, and board reporting without retreating to Excel.

## Required sessions

- Treasurer and treasury operations: daily cash position, variance investigation, bank feed exception handling.
- Controller group: GL reconciliation, cash-vs-book variance, close support, restricted cash treatment.
- HoldCo CFO users: liquidity rollup, covenant headroom, entity exposure, board-pack extracts.
- Audit Committee support: evidence retention, approval trail, and management-letter response support.

## Evidence standard

Each session needs attendance, role coverage, workflow walkthrough, open questions, and sign-off from the receiving owner. The most important sign-off is not that users attended. It is that the production cash-position workflow has an owner and the old spreadsheet has a retirement date.

## Adoption gate

The adoption gate is met when the CFO sees the same cash answer from Kyriba, treasury operations, and the controller close pack for four cycles. Until then, the implementation is in transition, not live.`,
  },
  {
    code: 'd32_value_ledger',
    name: 'Value Ledger',
    stage: 'value',
    family: 'value_ledger',
    requirementLevel: 'required',
    gateDefining: true,
    filename: 'd32_value_ledger-value-ledger.md',
    approvalState: 'in_review',
    facts: {
      value_lines: ['bank fee compression', 'cash visibility working-capital release', 'manual reconciliation reduction', 'audit support efficiency', 'covenant surprise reduction'],
      measurement_owner: 'Lakeshore CFO',
      current_value_state: 'Projected and committed controls; realized value not yet claimed.',
    },
    body: `# Value Ledger - Kyriba Treasury Rollout

## Value posture

The Kyriba rollout value ledger is intentionally conservative. Lakeshore can track projected value now, commit measurement rules during transition, and claim realized value only after production evidence exists.

| Value line | State | Measurement owner | Evidence |
| --- | --- | --- | --- |
| Bank fee compression | Projected | Treasurer | Consolidated fee baseline and negotiated rate card |
| Working-capital visibility | Projected | CFO | Daily entity-currency cash position and restricted-cash view |
| Manual reconciliation reduction | Committed control | Controller | Hours removed from bank portal and cash-vs-GL reconciliation |
| Audit support efficiency | Projected | Audit Committee support | Evidence packet and audit-log extract reuse |
| Covenant surprise reduction | Committed control | CFO | 12-week covenant forecast and quarterly headroom review |

## What is not claimed

No realized savings are claimed until the contract is executed, transition gates are met, and the parallel-run evidence shows stable operations. AbarVa should show the value path, not overstate completion.

## Board reporting rule

The board pack should separate projected, committed, measuring, and realized value. Mixing those states is how a clean treasury case turns into a credibility problem.`,
  },
  {
    code: 'd33_governance_review',
    name: 'Governance Review Note',
    stage: 'value',
    family: 'value_ledger',
    requirementLevel: 'recommended',
    gateDefining: false,
    filename: 'd33_governance_review-governance-review-note.md',
    approvalState: 'in_review',
    facts: {
      review_cadence: 'Quarterly governance review until two board cycles after cutover.',
      review_owner: 'Audit Committee designee with CFO and Treasurer',
      escalation_rule: 'Any unresolved bank-feed or intercompany variance older than five business days goes to CFO review.',
    },
    body: `# Governance Review Note - Kyriba Treasury Rollout

## Governance cadence

The rollout needs quarterly governance review until two board cycles after cutover. The point is not to admire the implementation plan. The point is to confirm that daily treasury discipline, evidence retention, and value measurement are working under normal operating load.

## Review agenda

1. Cash visibility: coverage by bank, entity, and currency.
2. Variance discipline: exceptions over threshold, owner, age, and resolution.
3. Intercompany lending: note documentation, AFR posture, true-up cadence, and audit support.
4. Adoption: production workflow usage, retired spreadsheets, and retraining needs.
5. Value ledger: projected, committed, measuring, and realized value by line.

## Escalation rule

Any unresolved bank-feed exception, cash-vs-GL variance, or intercompany true-up variance older than five business days goes to CFO review. Persistent exceptions are not implementation noise; they are a control failure waiting to be normalized.

## Review conclusion

This governance note is ready for value-stage use after selection and transition evidence mature. It keeps Lakeshore's board reporting disciplined without pretending realized value exists before the system earns it.`,
  },
];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function databaseUrl(): string {
  return requiredEnv('DATABASE_URL').replace(/\?.*$/, '');
}

function storageClient(): { service: BlobServiceClient; account: string } {
  const account = process.env.DATA_PLANE_OBJECT_STORE_ACCOUNT ?? process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const key = process.env.DATA_PLANE_OBJECT_STORE_ACCOUNT_KEY ?? process.env.AZURE_STORAGE_ACCOUNT_KEY;
  if (!account || !key) {
    throw new Error(
      'Missing storage account credentials. Set DATA_PLANE_OBJECT_STORE_ACCOUNT and DATA_PLANE_OBJECT_STORE_ACCOUNT_KEY.',
    );
  }
  const credential = new StorageSharedKeyCredential(account, key);
  return {
    account,
    service: new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential),
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const client = new Client({ connectionString: databaseUrl(), ssl: { rejectUnauthorized: false } });
  const { service, account } = storageClient();
  const container = service.getContainerClient(containerName);

  await client.connect();
  try {
    const eventResult = await client.query(
      `select id, event_code from source_events where client_key=$1 and event_code=$2`,
      [tenantKey, eventCode],
    );
    if (eventResult.rowCount !== 1) {
      throw new Error(`Expected one ${tenantKey}/${eventCode} event, found ${eventResult.rowCount}`);
    }
    const eventId = eventResult.rows[0].id as string;

    if (!dryRun) {
      await container.createIfNotExists();
    }

    const loaded: Array<{ code: string; id: string; blobUri: string }> = [];

    for (const artifact of artifacts) {
      const content = `${artifact.body.trim()}\n`;
      const bytes = Buffer.from(content, 'utf8');
      const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
      const blobName = `${tenantKey}/${eventCode}/${artifact.stage}/${artifact.filename}`;
      const blobUri = `https://${account}.blob.core.windows.net/${containerName}/${blobName}`;

      if (!dryRun) {
        const blob = container.getBlockBlobClient(blobName);
        await blob.uploadData(bytes, {
          blobHTTPHeaders: { blobContentType: 'text/markdown; charset=utf-8' },
          metadata: {
            tenant: tenantKey,
            event: eventCode,
            artifact: artifact.code,
            synthetic: 'true',
            loader: createdBy,
          },
        });
      }

      const existing = await client.query(
        `select id from source_artifacts where tenant_key=$1 and source_event_row_id=$2 and artifact_kind=$3 and deleted_at is null limit 1`,
        [tenantKey, eventId, artifact.code],
      );

      let artifactId = existing.rows[0]?.id as string | undefined;
      if (!dryRun) {
        if (artifactId) {
          await client.query(
            `update source_artifacts
             set artifact_family=$1, source_origin='generated', source_format='markdown', original_name=$2,
                 blob_uri=$3, uploader_user_id=$4, mime_type='text/markdown', size_bytes=$5, sha256=$6,
                 parse_status='parsed', embedding_status='not_applicable', graph_status='projected',
                 classification_status='classified', data_classification='Confidential',
                 evidence_state='cited', approval_state=$7, created_by=$4, validated_by=$4, updated_at=now()
             where id=$8`,
            [
              artifact.family,
              artifact.filename,
              blobUri,
              createdBy,
              bytes.byteLength,
              sha256,
              artifact.approvalState,
              artifactId,
            ],
          );
        } else {
          const insert = await client.query(
            `insert into source_artifacts
               (tenant_key, source_event_id, source_event_row_id, stage_key, artifact_family, artifact_kind,
                source_origin, source_format, original_name, blob_uri, uploader_user_id, mime_type,
                size_bytes, sha256, parse_status, embedding_status, graph_status, classification_status,
                data_classification, evidence_state, approval_state, created_by, validated_by)
             values
               ($1,$2,$3,$4,$5,$6,'generated','markdown',$7,$8,$9,'text/markdown',
                $10,$11,'parsed','not_applicable','projected','classified',
                'Confidential','cited',$12,$9,$9)
             returning id`,
            [
              tenantKey,
              eventId,
              eventId,
              artifact.stage,
              artifact.family,
              artifact.code,
              artifact.filename,
              blobUri,
              createdBy,
              bytes.byteLength,
              sha256,
              artifact.approvalState,
            ],
          );
          artifactId = insert.rows[0].id as string;
        }

        await client.query(`delete from source_artifact_chunks where artifact_id=$1`, [artifactId]);
        await client.query(`delete from source_artifact_facts where artifact_id=$1`, [artifactId]);
        await client.query(`delete from source_graph_edges where artifact_id=$1`, [artifactId]);

        await client.query(
          `insert into source_artifact_chunks
             (artifact_id, tenant_key, source_event_id, chunk_id, chunk_text, chunk_kind, provenance, confidence, embedding_status)
           values ($1,$2,$3,$4,$5,'document',jsonb_build_object('loader',$6::text,'synthetic',true),0.94,'not_applicable')`,
          [artifactId, tenantKey, eventCode, `${artifact.code}:body`, content, createdBy],
        );
        await client.query(
          `insert into source_artifact_facts
             (artifact_id, tenant_key, source_event_id, fact_type, fact_key, fact_value, provenance, confidence, validation_status)
           values ($1,$2,$3,'artifact_summary',$4,$5::jsonb,jsonb_build_object('loader',$6::text,'synthetic',true),0.93,'accepted')`,
          [artifactId, tenantKey, eventCode, artifact.code, JSON.stringify(artifact.facts), createdBy],
        );
        await client.query(
          `insert into source_graph_edges
             (artifact_id, tenant_key, source_event_id, from_node_id, edge_type, to_node_id, provenance, confidence, graph_status)
           values ($1,$2,$3,$4,'supports_stage',$5,jsonb_build_object('loader',$6::text,'synthetic',true),0.91,'projected')`,
          [artifactId, tenantKey, eventCode, `artifact:${artifact.code}`, `source_stage:${artifact.stage}`, createdBy],
        );
        await client.query(
          `update source_event_artifact_states
           set status='needs_review', tier='rich', linked_artifact_id=$1, notes=$2,
               body=$3, body_format='markdown', body_authored_by=$4, body_updated_at=now(),
               body_generation_metadata=jsonb_build_object('loader',$4::text,'synthetic',true,'source','lakeshore-kyriba-downstream-artifacts'),
               updated_at=now()
           where source_event_id=$5 and tenant_key=$6 and artifact_code=$7`,
          [
            artifactId,
            `Synthetic artifact-backed document loaded to Azure Blob: ${artifact.filename}`,
            content,
            createdBy,
            eventId,
            tenantKey,
            artifact.code,
          ],
        );
      }

      loaded.push({ code: artifact.code, id: artifactId ?? '(dry-run)', blobUri });
    }

    if (!dryRun) {
      const evidenceLinks: Array<[string, string]> = [
        ['EVID-SRC-SEL-CONTRACT', 'd28_contract_record'],
        ['EVID-SRC-TRAN-MILESTONES', 'd29_transition_plan'],
        ['EVID-SRC-TRAN-KT-EVIDENCE', 'd31_kt_evidence'],
        ['EVID-SRC-VAL-MEASUREMENT', 'd32_value_ledger'],
      ];
      for (const [requirementId, artifactCode] of evidenceLinks) {
        const loadedArtifact = loaded.find((item) => item.code === artifactCode);
        if (!loadedArtifact) throw new Error(`No loaded artifact for ${artifactCode}`);
        await client.query(
          `update source_event_evidence_states
           set current_state='Usable Evidence', source_artifact_id=$1,
               notes='Synthetic Lakeshore downstream artifact spine loaded and linked for this stage.',
               last_synced_at=now(), updated_at=now()
           where source_event_id=$2 and tenant_key=$3 and requirement_id=$4`,
          [loadedArtifact.id, eventId, tenantKey, requirementId],
        );
      }
    }

    console.log(
      JSON.stringify(
        {
          dryRun,
          tenantKey,
          eventCode,
          eventId,
          loadedCount: loaded.length,
          loaded,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
