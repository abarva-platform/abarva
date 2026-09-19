#!/usr/bin/env node
/**
 * Enum reachability sweep — backlog item T-003.
 *
 * A gate whose vocabulary is never checked against the column it reads is a
 * gate that can be born dead. Backlog item 126 shipped one: the Programs
 * pattern authority accepted `published` / `validated` / `active`, while
 * `engagement_topics.promotion_state` is constrained to
 * ('draft','pilot','mature','deprecated'). Every accepted state was
 * impossible, so the gate refused every row that could exist and blocked
 * creating a program from a matched pattern. Twenty-seven CI checks passed,
 * because each unit test injects its own row source and can hand the code a
 * row the database could never produce.
 *
 * `pattern-authority-reachability.test.ts` now guards that one column. This
 * sweep is the registry-wide form: for every text column a migration
 * constrains with a CHECK, find the SQL in `src/` that compares values
 * against that column, and assert the compared set is reachable.
 *
 * Two deliberate design decisions, both learned from item 49 (why the
 * "audit names a path that does not exist" gate would have been wrong):
 *
 * 1. **Only a whole-expression domain form defines a column.** A CHECK such
 *    as `claim_role <> 'sizing' OR ... OR basis IN ('not_recorded','judgment')`
 *    is a conditional rule, not the column's domain. An early draft of this
 *    script read that conjunct as the domain of `source.opportunity_claim.basis`
 *    and would have reported the live, correct query against it as a defect.
 *    Only `col IN (...)`, optionally `col IS NULL OR col IN (...)`, and
 *    top-level AND-conjunctions of those, are treated as a domain.
 *
 * 2. **A column is only checked when its table is resolved.** Column names
 *    collide: `data_type` is constrained on `uploaded_files` and is also an
 *    `information_schema.columns` column, and `lifecycle_state` is
 *    constrained on eleven different tables with five different vocabularies.
 *    A comparison is only judged when the statement names exactly one base
 *    table that constrains that column, or when an alias resolves it
 *    unambiguously. Everything else is reported as unresolved, not as a pass.
 *
 * Verdicts:
 *   UNREACHABLE — no compared value can be held by the column. The comparison
 *                 can never match. This is a live defect, not a style point.
 *   PARTIAL     — some compared values are impossible. Usually a stale value
 *                 left behind by a vocabulary change.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─────────────────────────────────────────────────────────────────────
// SQL text helpers
// ─────────────────────────────────────────────────────────────────────

/** Index of the `)` closing the `(` at `openIdx`, or -1. Quote-aware. */
export function balanced(text, openIdx) {
  let depth = 0;
  let inStr = false;
  for (let i = openIdx; i < text.length; i += 1) {
    const c = text[i];
    if (inStr) {
      if (c === "'") {
        if (text[i + 1] === "'") i += 1;
        else inStr = false;
      }
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === '(') depth += 1;
    else if (c === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Blank out SQL comments **without moving anything**. Offsets are how a
 * finding reports its line number and how a waiver is located, so a
 * length-changing strip would misreport both.
 */
export function stripSqlComments(sql) {
  const blank = (match) => match.replace(/[^\n]/g, ' ');
  return sql.replace(/--[^\n]*/g, blank).replace(/\/\*[\s\S]*?\*\//g, blank);
}

/** Split an expression on a top-level keyword (AND / OR), respecting parens and quotes. */
export function splitTopLevel(expr, word) {
  const parts = [];
  const re = new RegExp(`\\b${word}\\b`, 'gi');
  let depth = 0;
  let inStr = false;
  let start = 0;
  for (let i = 0; i < expr.length; i += 1) {
    const c = expr[i];
    if (inStr) {
      if (c === "'") {
        if (expr[i + 1] === "'") i += 1;
        else inStr = false;
      }
      continue;
    }
    if (c === "'") {
      inStr = true;
      continue;
    }
    if (c === '(') {
      depth += 1;
      continue;
    }
    if (c === ')') {
      depth -= 1;
      continue;
    }
    if (depth !== 0) continue;
    re.lastIndex = i;
    const m = re.exec(expr);
    if (m && m.index === i) {
      parts.push(expr.slice(start, i));
      start = i + m[0].length;
      i = start - 1;
    }
  }
  parts.push(expr.slice(start));
  return parts;
}

/** Strip redundant outer parentheses. */
export function unwrap(expr) {
  let s = expr.trim();
  while (s.startsWith('(') && balanced(s, 0) === s.length - 1) s = s.slice(1, -1).trim();
  return s;
}

const LITERAL = /'((?:[^']|'')*)'/g;

function literalList(inner) {
  if (/\bSELECT\b/i.test(inner) || inner.includes('$') || inner.includes('${')) return null;
  const values = [...inner.matchAll(LITERAL)].map((m) => m[1].replace(/''/g, "'"));
  if (!values.length) return null;
  // Everything outside the literals must be separators — no expressions,
  // no function calls, no bind parameters.
  if (!/^[\s,]*$/.test(inner.replace(LITERAL, ''))) return null;
  return values;
}

/**
 * `col IN ('a','b')` as an entire expression, optionally alias-qualified.
 * Returns null for anything else, including `col IN (SELECT ...)`.
 */
export function domainForm(expr) {
  const s = unwrap(expr);
  const m = /^(?:([a-z_][a-z0-9_]*)\.)?([a-z_][a-z0-9_]*)\s+IN\s*\(/i.exec(s);
  if (!m) return null;
  const open = s.indexOf('(', m[0].length - 1);
  if (open < 0 || balanced(s, open) !== s.length - 1) return null;
  const values = literalList(s.slice(open + 1, -1));
  if (!values) return null;
  return {
    qualifier: m[1] ? m[1].toLowerCase() : null,
    column: m[2].toLowerCase(),
    values,
  };
}

/**
 * The domains a CHECK body declares. A conjunct counts only when the whole
 * conjunct is a domain form, or the `col IS NULL OR col IN (...)` shape.
 */
export function domainsFromCheck(body) {
  const out = [];
  for (const conjunct of splitTopLevel(body, 'AND')) {
    const disjuncts = splitTopLevel(conjunct, 'OR');
    let found = null;
    if (disjuncts.length === 1) {
      found = domainForm(disjuncts[0]);
    } else {
      const forms = disjuncts.map(domainForm);
      const present = forms.filter(Boolean);
      const idx = forms.findIndex(Boolean);
      if (present.length === 1) {
        const { column } = forms[idx];
        const rest = disjuncts.filter((_, i) => i !== idx).map(unwrap);
        const nullable = new RegExp(`^(?:[a-z_][a-z0-9_]*\\.)?${column}\\s+IS\\s+NULL$`, 'i');
        if (rest.every((r) => nullable.test(r))) found = forms[idx];
      }
    }
    if (found) out.push(found);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Phase 1 — what the database permits
// ─────────────────────────────────────────────────────────────────────

const normalizeTable = (raw) =>
  raw.replace(/"/g, '').toLowerCase().replace(/^public\./, '');

/**
 * Every (table, column) a migration constrains to a literal value set.
 * Migrations are applied in filename order, so a later redefinition wins —
 * the same order Postgres saw them in.
 */
export function extractColumnDomains(migrationsDir) {
  const domains = new Map();
  const record = (table, domain, file) => {
    domains.set(`${table}.${domain.column}`, {
      table,
      column: domain.column,
      values: [...new Set(domain.values)].sort(),
      migration: file,
    });
  };
  const harvest = (scope, table, file) => {
    const re = /\bCHECK\s*\(/gi;
    let m;
    while ((m = re.exec(scope))) {
      const open = scope.indexOf('(', m.index + m[0].length - 1);
      const close = balanced(scope, open);
      if (close < 0) continue;
      for (const d of domainsFromCheck(scope.slice(open + 1, close))) record(table, d, file);
    }
  };

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = stripSqlComments(readFileSync(join(migrationsDir, file), 'utf8'));
    let m;
    const createTable = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z0-9_."]+)\s*\(/gi;
    while ((m = createTable.exec(sql))) {
      const open = sql.indexOf('(', m.index + m[0].length - 1);
      const close = balanced(sql, open);
      if (close < 0) continue;
      harvest(sql.slice(open + 1, close), normalizeTable(m[1]), file);
    }
    const alterTable = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?([a-z0-9_."]+)([\s\S]*?);/gi;
    while ((m = alterTable.exec(sql))) harvest(m[2], normalizeTable(m[1]), file);
  }
  return domains;
}

// ─────────────────────────────────────────────────────────────────────
// Phase 2 — what the code compares against
// ─────────────────────────────────────────────────────────────────────

const SQL_SHAPED = /\b(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|WHERE)\b/i;

/**
 * A word that follows a table reference but is not an alias. `FROM a JOIN b`
 * reads `JOIN` as an alias of `a` unless this list says otherwise — and an
 * early draft did exactly that, which also swallowed the `JOIN` keyword and
 * left table `b` unregistered. Both halves are covered by the alias cases in
 * the behavioral suite.
 */
const NOT_AN_ALIAS = new Set([
  'select', 'from', 'join', 'where', 'on', 'as', 'set', 'values', 'lateral',
  'using', 'left', 'right', 'inner', 'outer', 'full', 'cross', 'natural',
  'order', 'group', 'limit', 'offset', 'having', 'window', 'and', 'or', 'not',
  'union', 'all', 'except', 'intersect', 'returning', 'conflict', 'with',
  'for', 'into', 'by',
]);

/** Base tables and aliases named by a SQL statement, plus its CTE names. */
export function resolveStatementTables(sql) {
  const aliases = new Map();
  const tables = new Set();
  const ctes = new Set();

  for (const m of sql.matchAll(/\b(?:WITH|,)\s+([a-z_][a-z0-9_]*)\s+AS\s*\(/gi)) {
    ctes.add(m[1].toLowerCase());
  }

  // The table name is consumed; the alias is only peeked at, so a keyword
  // that follows a table is never eaten and the next reference still matches.
  const ref = /\b(?:FROM|JOIN|UPDATE|INSERT\s+INTO)\s+([a-z0-9_."]+)/gi;
  let m;
  while ((m = ref.exec(sql))) {
    const table = normalizeTable(m[1]);
    const after = /^\s+(?:AS\s+)?([a-z_][a-z0-9_]*)/i.exec(
      sql.slice(m.index + m[0].length),
    );
    const alias =
      after && !NOT_AN_ALIAS.has(after[1].toLowerCase())
        ? after[1].toLowerCase()
        : null;
    if (ctes.has(table)) {
      // An alias of a CTE resolves to no base table, and must not fall
      // through to an unqualified match on some other table in the statement.
      if (alias) aliases.set(alias, null);
      continue;
    }
    tables.add(table);
    if (alias) aliases.set(alias, table);
  }
  return { tables, aliases, ctes };
}

/** SQL-shaped template literals in a TypeScript source file. */
export function sqlLiterals(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf('`', i);
    if (start < 0) break;
    let end = start + 1;
    while (end < text.length && text[end] !== '`') {
      if (text[end] === '\\') end += 1;
      end += 1;
    }
    if (end >= text.length) break;
    const body = text.slice(start + 1, end);
    if (SQL_SHAPED.test(body)) out.push({ body, offset: start + 1 });
    i = end + 1;
  }
  return out;
}

const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;

/**
 * A deliberate comparison against a value the column cannot hold.
 *
 * These exist and are correct: `src/scripts/verify-029-032.mjs` queries
 * `relationship_notes.subject_type = 'maestro'` precisely to prove migration
 * 025 left no residual rows behind — the constraint is what makes the
 * expected answer zero. Item 49 recorded the general shape of this mistake:
 * a retirement check names the thing that should be absent, and a blanket
 * rule would fail exactly the checks that are working.
 *
 * So the exception is declared rather than inferred, on or immediately above
 * the comparison, and it must carry a reason:
 *
 *   // enum-reachability-waiver: residual check for migration 025
 *
 * A waived finding is still printed on every run, with its reason. It is
 * never hidden — it is acknowledged. A marker with no reason waives nothing.
 */
const WAIVER = /enum-reachability-waiver:[ \t]*(\S.*?)\s*$/;
const MIN_WAIVER_REASON = 12;

/** The waiver reason governing `line` (1-indexed), or null. */
export function waiverFor(text, line) {
  const lines = text.split('\n');
  for (const candidate of [line - 1, line - 2, line - 3]) {
    if (candidate < 0 || candidate >= lines.length) continue;
    const m = WAIVER.exec(lines[candidate]);
    if (!m) continue;
    const reason = m[1].replace(/\*\/\s*$/, '').trim();
    if (reason.length < MIN_WAIVER_REASON) return null;
    return reason;
  }
  return null;
}

/** The three comparison forms this sweep understands, as one description. */
const COMPARISON_FORMS = ['sql-in', 'sql-equality', 'query-builder'];

function judge({ file, text, line, form, domain, values, resolution, findings, seen }) {
  const key = `${file}:${line}:${domain.table}.${domain.column}:${values.join(',')}`;
  if (seen.has(key)) return;
  seen.add(key);
  const impossible = values.filter((v) => !domain.values.includes(v));
  if (!impossible.length) return;
  const waived = waiverFor(text, line);
  findings.push({
    file,
    line,
    form,
    waived,
    column: `${domain.table}.${domain.column}`,
    migration: domain.migration,
    resolution,
    compared: [...new Set(values)].sort(),
    permitted: domain.values,
    impossible: [...new Set(impossible)].sort(),
    verdict: waived
      ? 'WAIVED'
      : impossible.length === values.length
        ? 'UNREACHABLE'
        : 'PARTIAL',
  });
}

/**
 * Resolve a column reference to the one table that constrains it, or null.
 * A qualified reference must resolve through an alias; an unqualified one is
 * only accepted when exactly one table in the statement constrains that
 * column. Ambiguity is never resolved by guessing.
 */
function tableMatchesQualifier(table, qualifier) {
  return table === qualifier || table.endsWith(`.${qualifier}`);
}

function resolveDomainOrUnresolved(candidates, qualifier, tables, aliases) {
  if (!candidates) return { resolved: null, unresolved: null };
  if (qualifier) {
    if (!aliases.has(qualifier)) {
      const namedTables = [...tables].filter((table) => tableMatchesQualifier(table, qualifier));
      const matched = candidates.filter((c) => namedTables.includes(c.table));
      if (matched.length === 1) {
        return {
          resolved: {
            domain: matched[0],
            resolution: `table qualifier ${qualifier} -> ${matched[0].table}`,
          },
          unresolved: null,
        };
      }
      if (namedTables.length > 0) {
        return {
          resolved: null,
          unresolved: {
            bucket: 'not-a-subject',
            reason: 'qualified-table-not-constrained-for-column',
            statementTables: namedTables,
          },
        };
      }
      return {
        resolved: null,
        unresolved: {
          bucket: 'resolvable-with-work',
          reason: 'unknown-qualifier',
        },
      };
    }
    const table = aliases.get(qualifier);
    if (!table) {
      return {
        resolved: null,
        unresolved: {
          bucket: 'resolvable-with-work',
          reason: 'cte-alias',
        },
      };
    }
    const domain = candidates.find((c) => c.table === table);
    return domain
      ? {
          resolved: { domain, resolution: `alias ${qualifier} -> ${table}` },
          unresolved: null,
        }
      : {
          resolved: null,
          unresolved: {
            bucket: 'not-a-subject',
            reason: 'alias-table-not-constrained-for-column',
            statementTables: [table],
          },
        };
  }
  const matched = candidates.filter((c) => tables.has(c.table));
  if (matched.length === 0) {
    return {
      resolved: null,
      unresolved: {
        bucket: 'not-a-subject',
        reason: tables.size ? 'no-constrained-table-in-statement' : 'no-table-in-statement',
        statementTables: [...tables],
      },
    };
  }
  if (matched.length > 1) {
    return {
      resolved: null,
      unresolved: {
        bucket: 'ambiguous',
        reason: 'ambiguous-unqualified-column',
        statementTables: matched.map((c) => c.table),
      },
    };
  }
  return {
    resolved: {
      domain: matched[0],
      resolution: `sole constrained table in statement: ${matched[0].table}`,
    },
    unresolved: null,
  };
}

/** `.from('table')` … `.eq('col','lit')` / `.neq(...)` / `.in('col', ['a','b'])` */
function recordUnresolved({
  file,
  line,
  form,
  qualifier = null,
  column,
  values,
  candidates,
  resolution,
  unresolved,
  unresolvedComparisons,
}) {
  unresolvedComparisons.push({
    file,
    line,
    form,
    bucket: unresolved.bucket,
    reason: unresolved.reason,
    reference: qualifier ? `${qualifier}.${column}` : column,
    compared: [...new Set(values)].sort(),
    candidateColumns: candidates.map((c) => `${c.table}.${c.column}`).sort(),
    statementTables: (unresolved.statementTables ?? []).sort(),
    resolution,
  });
}

function countBy(items, keyOf) {
  const out = {};
  for (const item of items) {
    const key = keyOf(item);
    out[key] = (out[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function loadReportSanitizerTerms(registryPath = 'datasets/tenant-inputs/tenant-input-registry.json') {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  const terms = new Set();
  const add = (value) => {
    const normalized = String(value ?? '').trim();
    if (normalized.length >= 4) terms.add(normalized.toLowerCase());
  };
  for (const collection of ['activeTenants', 'retiredTenants']) {
    for (const tenant of registry?.[collection] ?? []) {
      add(tenant.tenantKey);
      add(String(tenant.tenantKey ?? '').replace(/-/g, '_'));
      add(String(tenant.tenantKey ?? '').replace(/[-_]+/g, ' '));
      for (const part of String(tenant.tenantKey ?? '').split(/[-_\s]+/)) add(part);
      add(tenant.displayName);
      add(String(tenant.displayName ?? '').replace(/\s+/g, '_'));
      for (const part of String(tenant.displayName ?? '').split(/[-_\s]+/)) add(part);
    }
  }
  return Array.from(terms).sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function sanitizePublicText(value, terms = loadReportSanitizerTerms()) {
  let out = String(value ?? '');
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\[-_\s]+/g, '[-_\\s]+');
    out = out.replace(new RegExp(escaped, 'gi'), '[tenant]');
  }
  return out;
}

function publicLocationId(file, line) {
  return createHash('sha256').update(`${file}:${line}`).digest('hex').slice(0, 12);
}

function sanitizeUnresolvedComparison(entry, terms) {
  return {
    id: `enum-unresolved-${publicLocationId(entry.file, entry.line)}`,
    bucket: entry.bucket,
    reason: entry.reason,
    file: sanitizePublicText(relative(process.cwd(), entry.file), terms),
    line: entry.line,
    form: entry.form,
    reference: entry.reference,
    compared: entry.compared.map((value) => sanitizePublicText(value, terms)),
    candidateColumns: entry.candidateColumns.map((value) => sanitizePublicText(value, terms)),
    statementTables: entry.statementTables.map((value) => sanitizePublicText(value, terms)),
    resolution: entry.resolution,
  };
}

function buildUnresolvedTriageReport({ domains, files, counts, unresolvedComparisons }) {
  const terms = loadReportSanitizerTerms();
  const entries = unresolvedComparisons.map((entry) => sanitizeUnresolvedComparison(entry, terms));
  return {
    report: 'enum-reachability-unresolved-triage',
    generatedFrom: 'scripts/quality/enum-reachability.mjs',
    domains: domains.size,
    files: files.length,
    counts,
    unresolvedBuckets: countBy(unresolvedComparisons, (entry) => entry.bucket),
    unresolvedReasons: countBy(unresolvedComparisons, (entry) => entry.reason),
    parserLimitations: [
      {
        reason: 'unknown-qualifier',
        bucket: 'resolvable-with-work',
        note:
          'The comparison names a qualifier that this bounded statement parser cannot tie to a base table. This may be a missing SQL alias, a CTE-scope issue, or parser work that needs a separate focused fix.',
      },
      {
        reason: 'ambiguous-unqualified-column',
        bucket: 'ambiguous',
        note:
          'The statement names multiple tables with a CHECK-constrained column of the same name. The sweep refuses to choose a table without a qualifier.',
      },
    ],
    entries,
  };
}

function writeJsonFile(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function scanQueryBuilder(file, text, byColumn, findings, seen, counts, unresolvedComparisons) {
  const from = /\.\s*from\(\s*['"]([a-z0-9_.]+)['"]\s*\)/gi;
  let m;
  while ((m = from.exec(text))) {
    const table = normalizeTable(m[1]);
    const rest = text.slice(m.index + m[0].length);
    // The chain ends at the next `.from(` or the next statement terminator.
    const nextFrom = rest.search(/\.\s*from\(\s*['"]/i);
    const terminator = rest.search(/;/);
    const bounds = [nextFrom, terminator].filter((i) => i >= 0);
    const window = rest.slice(0, bounds.length ? Math.min(...bounds) : rest.length);

    const eq = /\.\s*(eq|neq)\(\s*['"]([a-z_][a-z0-9_]*)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/g;
    let c;
    while ((c = eq.exec(window))) {
      counts.considered += 1;
      const candidates = byColumn.get(c[2].toLowerCase());
      if (!candidates) continue;
      const domain = candidates.find((d) => d.table === table);
      if (!domain) {
        counts.unresolved += 1;
        recordUnresolved({
          file,
          text,
          line: lineAt(text, m.index + m[0].length + c.index),
          form: 'query-builder',
          column: c[2].toLowerCase(),
          values: [c[3]],
          candidates,
          resolution: `.from('${table}')`,
          unresolved: {
            bucket: 'not-a-subject',
            reason: 'query-builder-table-not-constrained-for-column',
            statementTables: [table],
          },
          unresolvedComparisons,
        });
        continue;
      }
      counts.resolved += 1;
      judge({
        file,
        text,
        line: lineAt(text, m.index + m[0].length + c.index),
        form: 'query-builder',
        domain,
        values: [c[3]],
        resolution: `.from('${table}')`,
        findings,
        seen,
      });
    }

    const inList = /\.\s*in\(\s*['"]([a-z_][a-z0-9_]*)['"]\s*,\s*\[([^\]]*)\]\s*\)/g;
    while ((c = inList.exec(window))) {
      counts.considered += 1;
      const candidates = byColumn.get(c[1].toLowerCase());
      if (!candidates) continue;
      const raw = c[2];
      // Only a list written entirely as string literals is a vocabulary.
      const values = [...raw.matchAll(/['"]([^'"]*)['"]/g)].map((x) => x[1]);
      if (!values.length) continue;
      if (!/^[\s,]*$/.test(raw.replace(/['"]([^'"]*)['"]/g, ''))) continue;
      const domain = candidates.find((d) => d.table === table);
      if (!domain) {
        counts.unresolved += 1;
        recordUnresolved({
          file,
          text,
          line: lineAt(text, m.index + m[0].length + c.index),
          form: 'query-builder',
          column: c[1].toLowerCase(),
          values,
          candidates,
          resolution: `.from('${table}')`,
          unresolved: {
            bucket: 'not-a-subject',
            reason: 'query-builder-table-not-constrained-for-column',
            statementTables: [table],
          },
          unresolvedComparisons,
        });
        continue;
      }
      counts.resolved += 1;
      judge({
        file,
        text,
        line: lineAt(text, m.index + m[0].length + c.index),
        form: 'query-builder',
        domain,
        values,
        resolution: `.from('${table}')`,
        findings,
        seen,
      });
    }
  }
}

/**
 * Every comparison in `files` that targets a column some migration
 * constrains, judged against that constraint.
 *
 * Returns both the findings and the resolution counts. The counts matter as
 * much as the findings: a sweep that resolves nothing reports clean, which is
 * the vacuity this repository has already been bitten by (backlog item 47).
 */
export function scanComparisons(files, readFile, domains) {
  const byColumn = new Map();
  for (const d of domains.values()) {
    if (!byColumn.has(d.column)) byColumn.set(d.column, []);
    byColumn.get(d.column).push(d);
  }

  const findings = [];
  const unresolvedComparisons = [];
  const seen = new Set();
  const counts = { considered: 0, resolved: 0, unresolved: 0 };

  for (const file of files) {
    const text = readFile(file);
    scanQueryBuilder(file, text, byColumn, findings, seen, counts, unresolvedComparisons);

    for (const literal of sqlLiterals(text)) {
      const sql = stripSqlComments(literal.body);
      const { tables, aliases } = resolveStatementTables(sql);
      const lineOfMatch = (idx) => lineAt(text, literal.offset + idx);

      // form: col IN ('a','b')
      const inForm = /(?:([a-z_][a-z0-9_]*)\.)?\b([a-z_][a-z0-9_]*)\s+IN\s*\(/gi;
      let m;
      while ((m = inForm.exec(sql))) {
        const candidates = byColumn.get(m[2].toLowerCase());
        const open = sql.indexOf('(', m.index + m[0].length - 1);
        const close = balanced(sql, open);
        if (close < 0) continue;
        const values = literalList(sql.slice(open + 1, close));
        if (!values) continue;
        counts.considered += 1;
        if (!candidates) continue;
        const qualifier = m[1] ? m[1].toLowerCase() : null;
        const hit = resolveDomainOrUnresolved(candidates, qualifier, tables, aliases);
        if (!hit.resolved) {
          counts.unresolved += 1;
          recordUnresolved({
            file,
            text,
            line: lineOfMatch(m.index),
            form: 'sql-in',
            qualifier,
            column: m[2].toLowerCase(),
            values,
            candidates,
            resolution: qualifier ? `qualifier ${qualifier}` : 'unqualified',
            unresolved: hit.unresolved,
            unresolvedComparisons,
          });
          continue;
        }
        counts.resolved += 1;
        judge({
          file,
          text,
          line: lineOfMatch(m.index),
          form: 'sql-in',
          domain: hit.resolved.domain,
          values,
          resolution: hit.resolved.resolution,
          findings,
          seen,
        });
      }

      // form: col = 'a' / col <> 'a' / col != 'a'
      const eqForm = /(?:([a-z_][a-z0-9_]*)\.)?\b([a-z_][a-z0-9_]*)\s*(?:=|<>|!=)\s*'((?:[^']|'')*)'/g;
      while ((m = eqForm.exec(sql))) {
        counts.considered += 1;
        const candidates = byColumn.get(m[2].toLowerCase());
        if (!candidates) continue;
        const qualifier = m[1] ? m[1].toLowerCase() : null;
        const hit = resolveDomainOrUnresolved(candidates, qualifier, tables, aliases);
        if (!hit.resolved) {
          counts.unresolved += 1;
          recordUnresolved({
            file,
            text,
            line: lineOfMatch(m.index),
            form: 'sql-equality',
            qualifier,
            column: m[2].toLowerCase(),
            values: [m[3].replace(/''/g, "'")],
            candidates,
            resolution: qualifier ? `qualifier ${qualifier}` : 'unqualified',
            unresolved: hit.unresolved,
            unresolvedComparisons,
          });
          continue;
        }
        counts.resolved += 1;
        judge({
          file,
          text,
          line: lineOfMatch(m.index),
          form: 'sql-equality',
          domain: hit.resolved.domain,
          values: [m[3].replace(/''/g, "'")],
          resolution: hit.resolved.resolution,
          findings,
          seen,
        });
      }
    }
  }
  return { findings, unresolvedComparisons, counts };
}

export { COMPARISON_FORMS };

// ─────────────────────────────────────────────────────────────────────
// Driver
// ─────────────────────────────────────────────────────────────────────

export function collectSourceFiles(root, { includeTests = false } = {}) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        if (entry === 'node_modules') continue;
        if (!includeTests && entry === '__tests__') continue;
        walk(p);
        continue;
      }
      if (!/\.(ts|tsx|mts|mjs)$/.test(entry)) continue;
      if (!includeTests && /\.(test|spec)\.[a-z]+$/.test(entry)) continue;
      out.push(p);
    }
  };
  walk(root);
  return out;
}

/**
 * The number of comparisons this sweep resolved on the tree it was written
 * against. It exists so the check cannot quietly stop having a subject: if a
 * refactor moves SQL out of template literals, or the constraint extractor
 * breaks, resolution collapses and the sweep reports clean while proving
 * nothing. That is the failure mode of backlog item 47, and of the CI gate
 * that proved a control existed by finding its name in a comment.
 *
 * Raise it when resolution genuinely grows. Never lower it to make the
 * check pass — a drop means the scanner lost its subjects.
 */
export const RESOLUTION_FLOOR = 60;

export function runEnumReachabilitySweep({
  migrationsDir = 'supabase/migrations',
  srcDir = 'src',
  includeTests = false,
  readFile = (f) => readFileSync(f, 'utf8'),
} = {}) {
  const domains = extractColumnDomains(migrationsDir);
  const files = collectSourceFiles(srcDir, { includeTests });
  const { findings, unresolvedComparisons, counts } = scanComparisons(files, readFile, domains);
  return { domains, files, findings, unresolvedComparisons, counts };
}

function parseArgs(argv) {
  const opts = {};
  for (const arg of argv) {
    const m = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!m) continue;
    if (m[1] === 'migrations') opts.migrationsDir = m[2];
    else if (m[1] === 'src') opts.srcDir = m[2];
    else if (m[1] === 'floor') opts.floor = Number(m[2]);
    else if (m[1] === 'include-tests') opts.includeTests = true;
    else if (m[1] === 'json') opts.json = true;
    else if (m[1] === 'include-unresolved') opts.includeUnresolved = true;
    else if (m[1] === 'unresolved-report') opts.unresolvedReport = m[2];
  }
  return opts;
}

function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  const floor = Number.isFinite(opts.floor) ? opts.floor : RESOLUTION_FLOOR;
  const { domains, files, findings, unresolvedComparisons, counts } =
    runEnumReachabilitySweep(opts);
  const unreachable = findings.filter((f) => f.verdict === 'UNREACHABLE');
  const partial = findings.filter((f) => f.verdict === 'PARTIAL');
  const waived = findings.filter((f) => f.verdict === 'WAIVED');

  console.log(
    `enum-reachability: ${domains.size} CHECK-constrained columns, ` +
      `${files.length} source files, ` +
      `${counts.resolved} comparisons resolved to a constrained column ` +
      `(${counts.considered} considered, ${counts.unresolved} unresolved).`,
  );

  if (opts.json) {
    const report = { domains: domains.size, files: files.length, counts, findings };
    if (opts.includeUnresolved) report.unresolvedComparisons = unresolvedComparisons;
    console.log(
      JSON.stringify(
        report,
        null,
        2,
      ),
    );
  }

  if (opts.unresolvedReport) {
    const report = buildUnresolvedTriageReport({
      domains,
      files,
      counts,
      unresolvedComparisons,
    });
    writeJsonFile(opts.unresolvedReport, report);
    console.log(`enum-reachability: wrote unresolved triage report to ${opts.unresolvedReport}.`);
  }

  for (const f of findings) {
    console.log('');
    console.log(`${f.verdict}  ${relative(process.cwd(), f.file)}:${f.line}  [${f.form}]`);
    console.log(`  column     ${f.column}  (${f.migration})`);
    console.log(`  resolved   ${f.resolution}`);
    console.log(`  compared   ${f.compared.join(', ')}`);
    console.log(`  permitted  ${f.permitted.join(', ')}`);
    console.log(`  impossible ${f.impossible.join(', ')}`);
    if (f.waived) console.log(`  waived     ${f.waived}`);
  }

  if (counts.resolved < floor) {
    console.log('');
    console.log(
      `enum-reachability: VACUOUS — resolved ${counts.resolved} comparisons, ` +
        `floor is ${floor}. The sweep has lost its subjects; ` +
        'fix the scanner rather than lowering the floor.',
    );
    return 3;
  }

  if (!unreachable.length && !partial.length) {
    console.log('');
    console.log(
      `enum-reachability: clean — every resolved comparison is reachable ` +
        `(${waived.length} declared waiver${waived.length === 1 ? '' : 's'} above).`,
    );
    return 0;
  }

  console.log('');
  console.log(
    `enum-reachability: ${unreachable.length} UNREACHABLE, ${partial.length} PARTIAL, ` +
      `${waived.length} waived. ` +
      'An UNREACHABLE comparison can never match a row the column is allowed to hold.',
  );
  return 1;
}

const invokedDirectly =
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exit(main());
