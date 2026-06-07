#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function read(relPath) {
  return readFileSync(path.join(ROOT, relPath), 'utf8');
}

function asRegex(value) {
  return value instanceof RegExp ? value : new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

const checks = [
  {
    id: 'nexus-free-text-uses-audited-claude',
    file: 'src/lib/programs/nexus-free-text.ts',
    requires: [
      'getAuditedAnthropicClient',
      "workflow: 'programs-nexus-free-text'",
      /claude/i,
    ],
    forbids: [
      /createIntelligenceAskOpenAIText/,
      /chat\.completions/,
      /responses\.create/,
      /gpt-/i,
    ],
  },
  {
    id: 'sentinel-ask-synthesis-uses-anthropic-runtime',
    file: 'src/lib/intelligence/ask/synthesizer.ts',
    requires: [
      'createIntelligenceAskAnthropicText',
      'isIntelligenceAskAnthropicConfigured',
      'anthropic-runtime',
      'workflow: "intelligence-ask-synthesis"',
    ],
    forbids: [
      /createIntelligenceAskOpenAIText/,
      /openai-runtime/,
    ],
  },
  {
    id: 'sentinel-ask-runtime-uses-audited-claude',
    file: 'src/lib/intelligence/ask/anthropic-runtime.ts',
    requires: [
      'getAuditedAnthropicClient',
      'ANTHROPIC_API_KEY',
      /claude/i,
    ],
    forbids: [
      /openai/i,
      /gpt-/i,
    ],
  },
  {
    id: 'source-chat-uses-audited-claude',
    file: 'src/lib/source/sentinel-chat-llm.ts',
    requires: [
      'getAuditedAnthropicClient',
      'workflow: "source-sentinel-chat"',
      /claude/i,
    ],
    forbids: [
      /preflightOpenAIDirectClient/,
      /responses\.create/,
      /chat\.completions/,
      /gpt-/i,
    ],
  },
  {
    id: 'anthropic-preflight-stamps-provider-and-audit-sink',
    file: 'src/lib/integrations/ai-egress/anthropic-direct.ts',
    requires: [
      "provider: 'anthropic'",
      "route: 'anthropic-direct'",
      'preflightModelEgress',
      'createSupabaseAiEgressAuditSink',
      'loadTenantAiPolicyRecord',
      'intendedTenantKey',
      'resolvedTenantKey',
    ],
    forbids: [],
  },
  {
    id: 'audit-writer-is-tenant-stamped-monopoly',
    file: 'src/lib/admin/broker/egress-audit-writer.ts',
    requires: [
      "from('ai_egress_audit')",
      'validateContext(ctx)',
      'intendedTenantKey',
      'resolvedTenantKey',
      'request_metadata',
      'ai_egress_audit.tenant_mismatch',
    ],
    forbids: [],
  },
  {
    id: 'schema-supports-provider-audit-query',
    file: 'supabase/migrations/20260522170000_ai_egress_control_plane.sql',
    requires: [
      'CREATE TABLE IF NOT EXISTS public.ai_egress_audit',
      'provider TEXT NOT NULL',
      'workflow TEXT NOT NULL',
      'route TEXT NOT NULL',
      'policy_decision TEXT NOT NULL',
      'idx_ai_egress_audit_provider_recent',
      'idx_ai_egress_audit_workflow_recent',
    ],
    forbids: [],
  },
];

const results = [];

for (const check of checks) {
  const source = read(check.file);
  const missing = check.requires
    .map((requirement) => asRegex(requirement))
    .filter((requirement) => !requirement.test(source))
    .map(String);
  const forbidden = check.forbids
    .map((forbiddenPattern) => asRegex(forbiddenPattern))
    .filter((forbiddenPattern) => forbiddenPattern.test(source))
    .map(String);
  results.push({
    ...check,
    ok: missing.length === 0 && forbidden.length === 0,
    missing,
    forbidden,
  });
}

const liveAuditSql = `
select workflow, provider, route, model, policy_decision, count(*) as calls, max(created_at) as latest_call
from public.ai_egress_audit
where workflow in ('programs-nexus-free-text', 'intelligence-ask-synthesis', 'source-sentinel-chat')
  and created_at >= now() - interval '24 hours'
group by workflow, provider, route, model, policy_decision
order by workflow, latest_call desc;
`.trim();

const failed = results.filter((result) => !result.ok);
const summary = {
  status: failed.length === 0 ? 'pass' : 'fail',
  checkedAt: new Date().toISOString(),
  staticChecks: results.map((result) => ({
    id: result.id,
    file: result.file,
    status: result.ok ? 'pass' : 'fail',
    missing: result.missing,
    forbidden: result.forbidden,
  })),
  liveAuditSql,
  liveAuditNote:
    'Run this SQL after signed-in QA exercises Nexus, Sentinel Ask, and Source chat. Static proof does not replace live ai_egress_audit row confirmation.',
};

console.log(JSON.stringify(summary, null, 2));

if (failed.length > 0) {
  process.exitCode = 1;
}
