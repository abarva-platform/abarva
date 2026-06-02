#!/usr/bin/env node

import { createHash } from 'node:crypto';

const PILOT_CLIENTS = [
  {
    key: 'apex',
    displayName: 'Apex Retail',
    acceptedAliases: ['apex', 'apex-retail', 'apexretail'],
  },
  {
    key: 'meridian',
    displayName: 'Meridian Health',
    acceptedAliases: ['meridian', 'meridian-health'],
  },
  {
    key: 'skyharbor',
    displayName: 'SkyHarbor',
    acceptedAliases: ['skyharbor', 'skyharbor-air'],
  },
];

const HOPS = [
  {
    id: 'sso',
    label: 'SSO and role binding',
    required: [
      ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
      ['CLERK_SECRET_KEY'],
    ],
    optional: ['PILOT_CLERK_ORG_ID', 'PILOT_ADMIN_ROLE', 'PILOT_DATA_UPLOADER_ROLE'],
    liveCheck: 'Clerk organization and role mapping configured for pilot admins and uploaders.',
  },
  {
    id: 'blob',
    label: 'Private Azure Blob landing zone',
    required: [
      [
        'AZURE_BLOB_CONNECTION_STRING',
        'DATA_PLANE_OBJECT_STORE_CONNECTION_STRING',
        'AZURE_OBJECT_STORAGE_CONNECTION_STRING',
        'AZURE_STORAGE_CONNECTION_STRING',
      ],
      ['AZURE_BLOB_LANDING_CONTAINER', 'DATA_PLANE_OBJECT_STORE_CONTAINER', 'AZURE_OBJECT_STORAGE_CONTAINER'],
    ],
    optional: ['AZURE_BLOB_QUARANTINE_CONTAINER', 'AZURE_BLOB_PROCESSED_CONTAINER'],
    liveCheck: 'Private landing container can receive client-prefixed upload manifests.',
  },
  {
    id: 'queue',
    label: 'Durable processing queue',
    required: [
      ['AZURE_QUEUE_CONNECTION_STRING', 'AZURE_SERVICE_BUS_CONNECTION_STRING', 'VERCEL_QUEUE_TOKEN'],
      ['AZURE_QUEUE_NAME', 'AZURE_SERVICE_BUS_QUEUE_NAME', 'VERCEL_QUEUE_INGESTION_TOPIC'],
    ],
    optional: ['AZURE_SERVICE_BUS_NAMESPACE'],
    liveCheck: 'Landing-zone message can be emitted for parse/orchestration.',
  },
  {
    id: 'database',
    label: 'Client-scoped Postgres data plane',
    required: [['DATABASE_URL']],
    optional: ['AZURE_CONTEXT_DATABASE_URL', 'AZURE_CONTROL_DATABASE_URL'],
    liveCheck: 'Data-plane URL is configured for tenant-scoped ledger and commit writes.',
  },
  {
    id: 'audit',
    label: 'Immutable audit and ingestion ledger',
    required: [['DATABASE_URL']],
    optional: ['ADMIN_AUDIT_LOG_RETENTION_DAYS', 'PILOT_INGESTION_AUDIT_EXPORT_CONTAINER'],
    liveCheck: 'Audit ledger can record upload, quarantine, clarification, approval, commit, and rollback events.',
  },
  {
    id: 'scan',
    label: 'Malware and restricted-data scan gate',
    required: [['AZURE_DEFENDER_SCAN_MODE']],
    optional: ['AZURE_DEFENDER_SCAN_RESULT_TOPIC', 'AZURE_DEFENDER_STORAGE_ACCOUNT'],
    liveCheck: 'Scan mode is explicit; live mode requires Defender result plumbing before parse.',
  },
  {
    id: 'search',
    label: 'Approved-data search index',
    required: [
      ['AZURE_SEARCH_ENDPOINT', 'AZURE_AI_SEARCH_ENDPOINT'],
      ['AZURE_SEARCH_INDEX_NAME', 'AZURE_AI_SEARCH_INDEX_NAME'],
    ],
    optional: ['AZURE_SEARCH_API_KEY', 'AZURE_AI_SEARCH_API_KEY'],
    liveCheck: 'Approved committed data can be indexed with client and provenance metadata.',
  },
  {
    id: 'notifications',
    label: 'In-app and email notification fan-out',
    required: [
      ['RESEND_API_KEY'],
      ['RESEND_FROM'],
    ],
    optional: ['PILOT_NOTIFICATION_OWNER_EMAIL', 'NOTIFICATIONS_DISPATCH_SECRET'],
    liveCheck: 'Uploader, owner, and admin notifications can be dispatched after meaningful events.',
  },
  {
    id: 'admin_access',
    label: 'Role-gated admin access',
    required: [
      ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
      ['CLERK_SECRET_KEY'],
    ],
    optional: ['PILOT_ADMIN_ROLE', 'PILOT_DATA_REVIEWER_ROLE', 'PILOT_LOAD_APPROVER_ROLE'],
    liveCheck: 'Pilot admins can reach /admin/setup while non-admins cannot mutate loads.',
  },
];

function parseArgs(argv) {
  const args = new Set(argv);
  return {
    json: args.has('--json'),
    live: args.has('--live') || process.env.PILOT_DATA_PLANE_MODE === 'live',
    strict: args.has('--strict') || args.has('--live') || process.env.PILOT_DATA_PLANE_MODE === 'live',
  };
}

function hasEnv(env, key) {
  return typeof env[key] === 'string' && env[key].trim().length > 0;
}

function evaluateGroup(env, keys) {
  return {
    keys,
    satisfiedBy: keys.find((key) => hasEnv(env, key)) ?? null,
    satisfied: keys.some((key) => hasEnv(env, key)),
  };
}

function evaluateHop(env, hop, live) {
  const groups = hop.required.map((keys) => evaluateGroup(env, keys));
  const missingGroups = groups.filter((group) => !group.satisfied).map((group) => group.keys);
  const configuredKeys = [
    ...groups.flatMap((group) => group.satisfiedBy ? [group.satisfiedBy] : []),
    ...hop.optional.filter((key) => hasEnv(env, key)),
  ];

  if (missingGroups.length > 0) {
    return {
      id: hop.id,
      label: hop.label,
      status: live ? 'blocked' : 'stub_fail_closed',
      configuredKeys,
      missingGroups,
      note: live
        ? 'live mode requested but required configuration is missing'
        : 'missing configuration; downstream code must fail closed instead of passing this hop',
    };
  }

  if (hop.id === 'scan') {
    const mode = env.AZURE_DEFENDER_SCAN_MODE.trim();
    if (!['live', 'stub'].includes(mode)) {
      return {
        id: hop.id,
        label: hop.label,
        status: 'blocked',
        configuredKeys,
        missingGroups: [],
        note: 'AZURE_DEFENDER_SCAN_MODE must be live or stub',
      };
    }
    if (mode === 'stub') {
      return {
        id: hop.id,
        label: hop.label,
        status: live ? 'blocked' : 'stub_fail_closed',
        configuredKeys,
        missingGroups: [],
        note: live
          ? 'live mode requested but scan gate is explicitly stubbed'
          : 'scan gate is explicit stub; parser must remain fail-closed until live Defender wiring exists',
      };
    }
  }

  return {
    id: hop.id,
    label: hop.label,
    status: 'live_ready',
    configuredKeys,
    missingGroups: [],
    note: hop.liveCheck,
  };
}

function buildClientRows(hops) {
  return PILOT_CLIENTS.map((client) => {
    const fingerprint = createHash('sha256')
      .update(`${client.key}:${client.acceptedAliases.join('|')}`)
      .digest('hex')
      .slice(0, 12);
    return {
      key: client.key,
      displayName: client.displayName,
      acceptedAliases: client.acceptedAliases,
      isolationFingerprint: fingerprint,
      hops: hops.map((hop) => ({ id: hop.id, status: hop.status })),
    };
  });
}

function evaluate(env = process.env, options = parseArgs(process.argv.slice(2))) {
  const hops = HOPS.map((hop) => evaluateHop(env, hop, options.live));
  const blocked = hops.filter((hop) => hop.status === 'blocked');
  const failClosed = hops.filter((hop) => hop.status === 'stub_fail_closed');
  const liveReady = hops.filter((hop) => hop.status === 'live_ready');
  return {
    schema: 'abarva.pilot-data-plane-verification.v1',
    mode: options.live ? 'live' : 'stub-aware',
    generatedAt: new Date().toISOString(),
    clients: buildClientRows(hops),
    hops,
    summary: {
      liveReady: liveReady.length,
      stubFailClosed: failClosed.length,
      blocked: blocked.length,
      exitCode: blocked.length > 0 || (options.strict && failClosed.length > 0) ? 1 : 0,
    },
  };
}

function renderMarkdown(report) {
  const lines = [
    '# Pilot Private Data-Plane Verification',
    '',
    `Mode: ${report.mode}`,
    `Generated: ${report.generatedAt}`,
    '',
    '| Hop | Status | Configured key names | Missing key groups | Note |',
    '|---|---:|---|---|---|',
  ];

  for (const hop of report.hops) {
    const configured = hop.configuredKeys.length ? hop.configuredKeys.join(', ') : 'none';
    const missing = hop.missingGroups.length
      ? hop.missingGroups.map((group) => `[${group.join(' or ')}]`).join('; ')
      : 'none';
    lines.push(`| ${hop.label} | ${hop.status} | ${configured} | ${missing} | ${hop.note} |`);
  }

  lines.push('', '| Client | Accepted aliases | Isolation fingerprint |');
  lines.push('|---|---|---:|');
  for (const client of report.clients) {
    lines.push(`| ${client.displayName} | ${client.acceptedAliases.join(', ')} | ${client.isolationFingerprint} |`);
  }

  lines.push(
    '',
    `Summary: ${report.summary.liveReady} live-ready, ${report.summary.stubFailClosed} stub-fail-closed, ${report.summary.blocked} blocked.`,
  );
  return lines.join('\n');
}

const options = parseArgs(process.argv.slice(2));
const report = evaluate(process.env, options);

if (options.json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`${renderMarkdown(report)}\n`);
}

process.exitCode = report.summary.exitCode;
