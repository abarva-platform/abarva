import type { AtlasIntent, AtlasRouteType } from '@/lib/atlas/types';

export interface AtlasClassification {
  intent: AtlasIntent;
  routeType: AtlasRouteType;
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function classifyAtlasIntent(message: string): AtlasClassification {
  const text = message.trim().toLowerCase();

  if (!text) {
    return { intent: 'morning_summary', routeType: 'scripted' };
  }

  if (hasAny(text, ['good morning', 'morning summary', 'welcome back', 'portfolio look like', 'portfolio status'])) {
    return { intent: 'morning_summary', routeType: 'scripted' };
  }

  if (hasAny(text, ['shadow ai', 'jasper', 'grammarly', 'abridge', 'unmanaged tools'])) {
    return { intent: 'shadow_ai_detail', routeType: 'scripted' };
  }

  if (hasAny(text, ['cohort', 'peer median', 'peer group', 'benchmark', 'how do we compare', 'percentile'])) {
    return { intent: 'cohort_position', routeType: 'scripted' };
  }

  if (hasAny(text, ['roi', 'value attainment', 'realized value', 'worth it'])) {
    return { intent: 'roi', routeType: 'scripted' };
  }

  if (hasAny(text, ['idle seats', 'copilot seats', 'licensed vs active', 'seat utilization'])) {
    return { intent: 'idle_seats', routeType: 'scripted' };
  }

  if (hasAny(text, ['biggest issue', 'largest issue', 'active signals', 'what changed', 'signals'])) {
    return { intent: 'portfolio_status', routeType: 'scripted' };
  }

  if (
    hasAny(text, [
      'should we',
      'is this the right move',
      'what should our strategy be',
      'should we consolidate',
      'should we exit',
      'should we double down',
    ])
  ) {
    return { intent: 'strategy_refusal', routeType: 'scripted' };
  }

  if (hasAny(text, ['tell me more about', 'walk me through', 'show provenance'])) {
    return { intent: 'signal_detail', routeType: 'hybrid' };
  }

  return { intent: 'llm', routeType: 'llm' };
}
