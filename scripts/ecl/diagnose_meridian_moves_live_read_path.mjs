#!/usr/bin/env node

import { Client } from "pg";

const TENANT_KEY = "meridian-health";
const APP_CLIENT_KEY = "meridian";
const ACTIVATION_BASIS = "meridian_phs_demo_moves_activation_plan";
const DEFAULT_ACTIVATION_CLIENT_ID = "d2e9b6f4-8c25-43a9-b8e0-7d2f41f0a612";
const PROOF_BEGIN = "__MERIDIAN_MOVES_READPATH_DIAGNOSTIC_BEGIN__";
const PROOF_END = "__MERIDIAN_MOVES_READPATH_DIAGNOSTIC_END__";

const CLIENT_ALIASES = [
  APP_CLIENT_KEY,
  TENANT_KEY,
  "meridian health",
  "meridian-health",
  "meridianhealth",
  "Meridian Health",
];

const PROBE_EMAILS = [
  "admin@abarva.ai",
  "anand@abarva.ai",
  "anand.sundaram@thesundaram.com",
  "anand.sundaram+meridian@thesundaram.com",
  "agent@meridian-health.example.com",
  "meridian-agent@abarva.example.com",
  "cdio@meridian-health.example.com",
  "demo-meridian+clerk_test@abarva.com",
];

function parseArgs(argv) {
  const args = {
    databaseUrl:
      process.env.DATABASE_URL ??
      process.env.ABARVA_AZURE_DATABASE_URL ??
      process.env.AZURE_DATABASE_URL ??
      "",
    jsonOnly: false,
    planOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[index];
    };
    if (arg === "--database-url") args.databaseUrl = next();
    else if (arg === "--json") args.jsonOnly = true;
    else if (arg === "--plan-only") args.planOnly = true;
    else if (arg === "--help") {
      console.log(`Usage: node scripts/ecl/diagnose_meridian_moves_live_read_path.mjs [options]

Read-only diagnostic for the Meridian demo Moves live read path.

Options:
  --database-url <url>  Defaults to DATABASE_URL / ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL.
  --plan-only           Emit the diagnostic plan without contacting the database.
  --json                Emit only JSON, without proof markers.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

async function query(client, text, values = []) {
  const result = await client.query(text, values);
  return result.rows;
}

async function tableExists(client, tableName) {
  const rows = await query(client, "select to_regclass($1) as table_name", [
    tableName,
  ]);
  return Boolean(rows[0]?.table_name);
}

async function tableColumns(client, tableName) {
  const [schema, table] = tableName.split(".", 2);
  if (!schema || !table) return new Set();
  const rows = await query(
    client,
    `
    select column_name
    from information_schema.columns
    where table_schema = $1
      and table_name = $2
    `,
    [schema, table],
  );
  return new Set(rows.map((row) => row.column_name));
}

function optionalColumn(columns, columnName, type = "text") {
  return columns.has(columnName)
    ? columnName
    : `null::${type} as ${columnName}`;
}

function buildIssues(summary) {
  const issues = [];
  if (summary.client_resolution.candidate_clients.length === 0) {
    issues.push("no_meridian_client_row_found");
  }
  if (summary.activation.counts_by_client.length === 0) {
    issues.push("no_meridian_moves_activation_rows_found");
  }

  const candidateClientIds = new Set(
    summary.client_resolution.candidate_clients.map((row) => row.id),
  );
  const activatedClientIds = new Set(
    summary.activation.counts_by_client.map((row) => row.client_id),
  );
  const overlap = [...activatedClientIds].some((id) => candidateClientIds.has(id));
  if (candidateClientIds.size > 0 && activatedClientIds.size > 0 && !overlap) {
    issues.push("activation_client_id_not_resolvable_by_tenant_alias");
  }

  const activeRows = summary.activation.counts_by_client.reduce(
    (total, row) => total + Number(row.active_rows ?? 0),
    0,
  );
  if (activeRows !== 38) {
    issues.push(`active_moves_count_expected_38_actual_${activeRows}`);
  }

  const identitiesWithAccess = summary.identity_access.filter(
    (row) =>
      Number(row.membership_rows ?? 0) > 0 ||
      Number(row.participant_rows ?? 0) > 0 ||
      row.expected_program_scope === "all_client_programs",
  );
  if (identitiesWithAccess.length === 0) {
    issues.push("no_probe_identity_has_moves_access");
  }

  return issues;
}

function planSummary() {
  return {
    generated_at: new Date().toISOString(),
    mode: "plan_only",
    read_only: true,
    tenant_key: TENANT_KEY,
    app_client_key: APP_CLIENT_KEY,
    activation_basis: ACTIVATION_BASIS,
    client_aliases: CLIENT_ALIASES,
    probe_emails: PROBE_EMAILS,
    checks: [
      "Resolve Meridian clients by tenant_key, slug, and name aliases.",
      "Count activation engagements by client_id and active/archive state.",
      "Inspect memberships and participants for likely signed-in proof users.",
      "Classify client-id mismatch versus RBAC/no-access symptoms.",
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.planOnly) {
    const plan = planSummary();
    console.log(JSON.stringify(plan, null, 2));
    return;
  }
  if (!args.databaseUrl) {
    throw new Error(
      "DATABASE_URL, ABARVA_AZURE_DATABASE_URL, or AZURE_DATABASE_URL is required.",
    );
  }

  const client = new Client({
    connectionString: args.databaseUrl,
    ssl: args.databaseUrl.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const clientsExists = await tableExists(client, "public.clients");
    const personsExists = await tableExists(client, "public.persons");
    const membershipsExists = await tableExists(
      client,
      "public.person_client_memberships",
    );
    const participantsExists = await tableExists(
      client,
      "public.engagement_participants",
    );
    const personColumns = personsExists
      ? await tableColumns(client, "public.persons")
      : new Set();

    const candidateClients = clientsExists
      ? await query(
          client,
          `
          select id, tenant_key, slug, name, industry_code
          from public.clients
          where tenant_key = any($1::text[])
             or slug = any($1::text[])
             or lower(name) = any($2::text[])
             or lower(name) like '%meridian%'
          order by
            case
              when tenant_key = $3 then 0
              when tenant_key = $4 then 1
              when slug = $3 then 2
              when slug = $4 then 3
              else 4
            end,
            name nulls last,
            id
          `,
          [
            CLIENT_ALIASES,
            CLIENT_ALIASES.map((value) => value.toLowerCase()),
            TENANT_KEY,
            APP_CLIENT_KEY,
          ],
        )
      : [];

    const activationCounts = await query(
      client,
      `
      select
        e.client_id,
        c.tenant_key as client_tenant_key,
        c.slug as client_slug,
        c.name as client_name,
        count(*)::int as total_rows,
        count(*) filter (where e.deleted_at is null and e.archived_at is null)::int as active_rows,
        count(*) filter (where e.deleted_at is not null)::int as deleted_rows,
        count(*) filter (where e.archived_at is not null)::int as archived_rows,
        count(distinct e.solution)::int as distinct_solutions,
        min(e.created_at) as first_created_at,
        max(e.created_at) as last_created_at
      from public.engagements e
      left join public.clients c on c.id = e.client_id
      where e.is_demo_data = true
        and e.charter ->> 'tenant_key' = $1
        and e.charter ->> 'activation_basis' = $2
      group by e.client_id, c.tenant_key, c.slug, c.name
      order by total_rows desc, e.client_id
      `,
      [TENANT_KEY, ACTIVATION_BASIS],
    );

    const allMovesByCandidateClient =
      candidateClients.length === 0
        ? []
        : await query(
            client,
            `
            select
              e.client_id,
              c.tenant_key as client_tenant_key,
              c.slug as client_slug,
              c.name as client_name,
              count(*)::int as total_rows,
              count(*) filter (where e.deleted_at is null and e.archived_at is null)::int as active_rows,
              count(*) filter (where e.is_demo_data = true)::int as demo_rows,
              count(*) filter (where e.charter ->> 'tenant_key' = $1)::int as tenant_key_rows,
              count(*) filter (where e.charter ->> 'activation_basis' = $2)::int as activation_basis_rows
            from public.engagements e
            join public.clients c on c.id = e.client_id
            where e.client_id = any($3::uuid[])
            group by e.client_id, c.tenant_key, c.slug, c.name
            order by active_rows desc, e.client_id
            `,
            [
              TENANT_KEY,
              ACTIVATION_BASIS,
              candidateClients.map((row) => row.id),
            ],
          );

    const defaultActivationClientRows = clientsExists
      ? await query(
          client,
          `
          select id, tenant_key, slug, name, industry_code
          from public.clients
          where id = $1::uuid
          `,
          [DEFAULT_ACTIVATION_CLIENT_ID],
        )
      : [];

    const people = personsExists
      ? await query(
          client,
          `
          select
            id,
            email,
            ${optionalColumn(personColumns, "role")},
            ${optionalColumn(personColumns, "tenant_role")}
          from public.persons
          where lower(email) = any($1::text[])
          order by email
          `,
          [PROBE_EMAILS],
        )
      : [];

    const candidateClientIds = candidateClients.map((row) => row.id);
    const peopleByEmail = new Map(
      people.map((person) => [String(person.email).toLowerCase(), person]),
    );

    const membershipRows =
      membershipsExists && people.length > 0 && candidateClientIds.length > 0
        ? await query(
            client,
            `
            select
              p.email,
              pcm.person_id,
              pcm.client_id,
              c.tenant_key as client_tenant_key,
              c.slug as client_slug,
              pcm.role,
              pcm.access_level,
              pcm.financial_visibility,
              pcm.can_admin_users,
              pcm.can_create_programs,
              pcm.can_approve_gates
            from public.person_client_memberships pcm
            join public.persons p on p.id = pcm.person_id
            left join public.clients c on c.id = pcm.client_id
            where pcm.person_id = any($1::uuid[])
              and pcm.client_id = any($2::uuid[])
            order by p.email, pcm.client_id
            `,
            [people.map((person) => person.id), candidateClientIds],
          )
        : [];

    const participantRows =
      participantsExists && people.length > 0 && candidateClientIds.length > 0
        ? await query(
            client,
            `
            select
              p.email,
              ep.user_id as person_id,
              e.client_id,
              c.tenant_key as client_tenant_key,
              c.slug as client_slug,
              count(*)::int as participant_rows,
              count(*) filter (where ep.program_access_level in ('program_member','program_viewer'))::int as explicit_program_access_rows,
              count(*) filter (where ep.approval_authority in ('sponsor','approver'))::int as approval_authority_rows,
              count(*) filter (where e.deleted_at is null and e.archived_at is null)::int as active_engagement_rows
            from public.engagement_participants ep
            join public.persons p on p.id = ep.user_id
            join public.engagements e on e.id = ep.engagement_id
            left join public.clients c on c.id = e.client_id
            where ep.user_id = any($1::uuid[])
              and e.client_id = any($2::uuid[])
            group by p.email, ep.user_id, e.client_id, c.tenant_key, c.slug
            order by p.email, participant_rows desc
            `,
            [people.map((person) => person.id), candidateClientIds],
          )
        : [];

    const membershipsByEmail = new Map();
    for (const row of membershipRows) {
      const key = String(row.email).toLowerCase();
      membershipsByEmail.set(key, [...(membershipsByEmail.get(key) ?? []), row]);
    }

    const participantsByEmail = new Map();
    for (const row of participantRows) {
      const key = String(row.email).toLowerCase();
      participantsByEmail.set(key, [...(participantsByEmail.get(key) ?? []), row]);
    }

    const identityAccess = PROBE_EMAILS.map((email) => {
      const normalized = email.toLowerCase();
      const person = peopleByEmail.get(normalized) ?? null;
      const memberships = membershipsByEmail.get(normalized) ?? [];
      const participants = participantsByEmail.get(normalized) ?? [];
      const inferredClientKey = normalized.includes("@meridian-health.example.com")
        ? APP_CLIENT_KEY
        : normalized.includes("+meridian@abarva.com")
          ? APP_CLIENT_KEY
          : normalized === "meridian-agent@abarva.example.com"
            ? APP_CLIENT_KEY
            : null;
      const expectedProgramScope =
        normalized === "meridian-agent@abarva.example.com" ||
        normalized === "agent@meridian-health.example.com" ||
        (["admin@abarva.ai", "anand@abarva.ai"].includes(normalized) &&
          inferredClientKey === APP_CLIENT_KEY)
          ? "all_client_programs"
          : "requires_membership_or_participant";
      return {
        email,
        person_id: person?.id ?? null,
        person_role: person?.role ?? null,
        tenant_role: person?.tenant_role ?? null,
        inferred_client_key: inferredClientKey,
        membership_rows: memberships.length,
        participant_rows: participants.reduce(
          (total, row) => total + Number(row.participant_rows ?? 0),
          0,
        ),
        active_participant_engagement_rows: participants.reduce(
          (total, row) => total + Number(row.active_engagement_rows ?? 0),
          0,
        ),
        expected_program_scope: expectedProgramScope,
        memberships,
        participant_groups: participants,
      };
    });

    const summary = {
      generated_at: new Date().toISOString(),
      read_only: true,
      tenant_key: TENANT_KEY,
      app_client_key: APP_CLIENT_KEY,
      activation_basis: ACTIVATION_BASIS,
      client_resolution: {
        aliases: CLIENT_ALIASES,
        candidate_clients: candidateClients,
        default_activation_client_id: DEFAULT_ACTIVATION_CLIENT_ID,
        default_activation_client_row: defaultActivationClientRows[0] ?? null,
      },
      activation: {
        counts_by_client: activationCounts,
        candidate_client_move_counts: allMovesByCandidateClient,
      },
      identity_access: identityAccess,
      tables_present: {
        clients: clientsExists,
        persons: personsExists,
        person_client_memberships: membershipsExists,
        engagement_participants: participantsExists,
      },
    };
    summary.issues = buildIssues(summary);
    summary.accepted = summary.issues.length === 0;

    if (args.jsonOnly) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(PROOF_BEGIN);
      console.log(JSON.stringify(summary, null, 2));
      console.log(PROOF_END);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
