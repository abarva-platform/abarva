// Live answer-quality probe (Workstream G).
//
// Drives the REAL Sentinel answer engine (askIntelligence) server-side against
// a tenant's golden questions, then scores each answer with the governed
// validation stack — grounding, citation emission, claim support, and
// cross-tenant leakage. Runs in-VNet (DB + ANTHROPIC_API_KEY) on Azure
// Container Apps. Emits NDJSON per question + a summary line. No fabrication:
// every number comes from a real answer.
//
// Usage (ACA job): npx tsx src/scripts/qa/agent-answer-quality-probe.ts <tenantKey> [limit]

import { askIntelligence, type AskSource } from '@/lib/intelligence/ask';
import { buildGoldenSuites } from '@/lib/agent-golden';
import {
  buildSentinelTrace,
  hashModelInput,
  type RawAskSource,
} from '@/lib/agent-trace';
import { validateClaimsAndCitations } from '@/lib/agent-claims';
import { evaluateAgentResponse } from '@/lib/agent-eval';
import { deriveAnswerability } from '@/lib/agent-data-coverage';
import { getCanonicalTenant } from '@/config/tenants/CANONICAL_TENANTS';
import { brokerTenantKey, canonicalTenantKey } from '@/lib/tenant/aliases';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

async function resolveClientId(canonicalKey: string): Promise<string | null> {
  // Best-effort: find the clients row for this tenant. Retrieval scopes mainly
  // by tenantInventoryKey, so a missing clientId does not block the probe.
  for (const [col, val] of [
    ['tenant_key', canonicalKey],
    ['key', brokerTenantKey(canonicalKey) ?? canonicalKey],
    ['slug', canonicalKey],
  ] as const) {
    try {
      const { data } = await getAzureWriteFluentClient()
        .from('clients')
        .select('id')
        .eq(col, val)
        .maybeSingle();
      if (data && typeof (data as { id?: unknown }).id === 'string') {
        return (data as { id: string }).id;
      }
    } catch {
      /* try next column */
    }
  }
  return null;
}

async function main(): Promise<void> {
  const tenantKey = canonicalTenantKey(process.argv[2] ?? 'skyharbor-air');
  const limit = Number(process.argv[3] ?? '8');
  const canonical = getCanonicalTenant(tenantKey);
  if (!canonical) {
    console.error(JSON.stringify({ event: 'probe_error', error: `unknown tenant ${tenantKey}` }));
    process.exit(1);
  }

  const clientId = await resolveClientId(tenantKey);
  const suite = buildGoldenSuites().find((s) => s.tenantKey === tenantKey);
  const questions = (suite?.questions ?? []).slice(0, limit);

  console.log(JSON.stringify({
    event: 'probe_start', tenantKey, clientId: clientId ? 'resolved' : 'fallback',
    questionCount: questions.length,
  }));

  let grounded = 0;
  let leaked = 0;
  let withCitations = 0;
  let unsupportedTotal = 0;

  for (const q of questions) {
    let answer = '';
    let sources: AskSource[] = [];
    let modelInputHash = 'no_model_call';
    try {
      for await (const ev of askIntelligence(q.question, {
        tenantId: clientId ?? tenantKey,
        tenantClientKey: brokerTenantKey(tenantKey),
        tenantInventoryKey: tenantKey,
        userId: 'ws-g-probe',
        onModelInput: (p) => { modelInputHash = hashModelInput(p); },
      })) {
        if (ev.type === 'delta' && typeof ev.text === 'string') answer += ev.text;
        else if (ev.type === 'sources' && Array.isArray(ev.sources)) sources = ev.sources;
        else if (ev.type === 'error') throw new Error(ev.error ?? 'ask error');
      }
    } catch (err) {
      console.log(JSON.stringify({ event: 'q', id: q.id, error: err instanceof Error ? err.message : 'unknown' }));
      continue;
    }

    const rawSources = sources as unknown as RawAskSource[];
    const trace = buildSentinelTrace({
      questionId: q.id,
      tenantId: clientId ?? tenantKey,
      tenantKey,
      surface: 'intelligence',
      userIntent: q.category,
      modelInputHash,
      citationObjectsEmitted: rawSources.map((s) => s.id).filter((x): x is string => Boolean(x)),
      emittedAt: new Date().toISOString(),
      sources: rawSources,
    });
    const validation = validateClaimsAndCitations({
      trace: {
        tenant_key: trace.tenant_key,
        retrieved_tenant_context: trace.retrieved_tenant_context,
        retrieved_corpus_patterns: trace.retrieved_corpus_patterns,
        retrieved_artifacts: trace.retrieved_artifacts,
        citation_objects_emitted: trace.citation_objects_emitted,
      },
      answerText: answer,
    });
    const evaluation = evaluateAgentResponse({
      trace,
      answerText: answer,
      unsupportedClaims: validation.unsupportedClaims,
      tenantLeakage: validation.tenantLeakage,
      namespaceFindings: validation.namespaceFindings,
    });
    const answerability = deriveAnswerability({
      tested: true,
      loadedCount: trace.retrieved_tenant_context.length + trace.retrieved_corpus_patterns.length,
      requiredContentPresent: trace.retrieved_tenant_context.length > 0,
      indexedCount: trace.retrieved_tenant_context.length + trace.retrieved_corpus_patterns.length,
      retrievedCount: trace.retrieved_tenant_context.length + trace.retrieved_corpus_patterns.length,
      inContextBundle: true,
      citationsEmitted: trace.citation_objects_emitted.length > 0,
      citationsRendered: trace.citation_objects_emitted.length > 0,
      claimsSupported: validation.claimValidationStatus === 'pass',
    });

    const isGrounded = trace.retrieved_tenant_context.length > 0;
    if (isGrounded) grounded += 1;
    if (validation.tenantIsolationStatus === 'fail') leaked += 1;
    if (trace.citation_objects_emitted.length > 0) withCitations += 1;
    unsupportedTotal += validation.unsupportedClaims.length;

    console.log(JSON.stringify({
      event: 'q',
      id: q.id,
      category: q.category,
      answerChars: answer.length,
      sources: rawSources.length,
      tenantContext: trace.retrieved_tenant_context.length,
      patterns: trace.retrieved_corpus_patterns.length,
      citations: trace.citation_objects_emitted.length,
      answerability: answerability.status,
      claimStatus: validation.claimValidationStatus,
      isolationStatus: validation.tenantIsolationStatus,
      leak: validation.tenantLeakage.map((f) => f.detail ?? f.offendingTenantKey),
      unsupportedClaims: validation.unsupportedClaims.length,
      rubricOverall: evaluation.overallScore,
      autoFail: evaluation.autoFailReasons,
    }));
  }

  console.log(JSON.stringify({
    event: 'probe_summary',
    tenantKey,
    questions: questions.length,
    grounded,
    withCitations,
    leakageFailures: leaked,
    unsupportedClaims: unsupportedTotal,
  }));
}

main().catch((err) => {
  console.error(JSON.stringify({ event: 'probe_fatal', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
