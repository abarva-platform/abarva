/**
 * Regression-suite helper · INT-RGS
 *
 * Runs a single regression question through the broker and
 * returns the assembled bundle plus the composed system prompt.
 * No LLM call — the regression suite at this stage validates
 * structural properties (bundle shape, system prompt content,
 * voice-doctrine compliance of canned anti-pattern responses).
 *
 * LLM-dependent assertions (e.g. "the actual model output for
 * this question doesn't drift from doctrine") land in CB-6 once
 * the validator is wired in.
 */

import { getContextBroker } from '@/lib/knowledge/context-broker';
import type { ContextBundle } from '@/lib/knowledge/context-broker';
import { composeSentinelSystemPrompt } from '@/lib/agent/voice-doctrine/sentinel';

import type { RegressionQuestion } from '../fixtures/questions';

export interface RegressionRunResult {
  question: RegressionQuestion;
  bundle: ContextBundle;
  systemPrompt: string;
}

export async function runQuestion(
  question: RegressionQuestion,
  options: {
    surface?: string;
    /** When set, override the question's default mode. */
    mode?: ContextBundle['mode'];
    vectorIndexPending?: boolean;
    worldviewPending?: boolean;
  } = {},
): Promise<RegressionRunResult> {
  const broker = getContextBroker();
  const mode = options.mode ?? question.defaultMode;
  const tenantKey = (mode === 'tenant' || mode === 'full') ? question.tenantKey ?? undefined : undefined;
  const bundle = await broker.assemble({
    query: question.text,
    tenantKey,
    mode,
  });
  const systemPrompt = composeSentinelSystemPrompt({
    mode,
    tenantKey: tenantKey ?? null,
    surface: options.surface ?? '/intelligence',
    vectorIndexPending: options.vectorIndexPending ?? true,
    worldviewPending: options.worldviewPending ?? true,
  });
  return { question, bundle, systemPrompt };
}

/**
 * Run a question through every BrokerMode and return all four
 * results. Used for FM #1 (mode comparison) and the four-mode
 * UX tests.
 */
export async function runQuestionAllModes(
  question: RegressionQuestion,
): Promise<{
  generic: RegressionRunResult;
  corpus: RegressionRunResult;
  tenant: RegressionRunResult | null;
  full: RegressionRunResult | null;
}> {
  const generic = await runQuestion(question, { mode: 'generic' });
  const corpus = await runQuestion(question, { mode: 'corpus' });
  const tenant = question.tenantKey
    ? await runQuestion(question, { mode: 'tenant' })
    : null;
  const full = question.tenantKey
    ? await runQuestion(question, { mode: 'full' })
    : null;
  return { generic, corpus, tenant, full };
}
