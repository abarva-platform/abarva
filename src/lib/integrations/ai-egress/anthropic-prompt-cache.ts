import type {
  MessageParam,
  TextBlockParam,
} from '@anthropic-ai/sdk/resources/messages';

type CacheControl = { type: 'ephemeral' };
type CacheableTextBlock = TextBlockParam & { cache_control?: CacheControl };

export interface AnthropicPromptCacheResolution {
  enabled: boolean;
  cacheSystemPrompt: boolean;
  cacheUserPrompt: boolean;
  cacheKey: string | null;
  ttl: 'ephemeral_5m';
  reason: string;
}

export interface AnthropicPromptCachePayload {
  system?: string | CacheableTextBlock[];
  messages: MessageParam[];
  auditMetadata: AnthropicPromptCacheResolution;
}

const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nestedCacheConfig(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!metadata) return {};
  const anthropic = metadata.anthropicPromptCache;
  if (isRecord(anthropic)) return anthropic;
  const generic = metadata.promptCache;
  if (isRecord(generic)) return generic;
  return {};
}

function booleanValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (TRUE_VALUES.has(normalized)) return true;
    if (FALSE_VALUES.has(normalized)) return false;
  }
  return null;
}

function stringFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  keys: readonly string[],
): string | null {
  if (!metadata) return null;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function promptCacheDisabledByEnv(env: NodeJS.ProcessEnv): boolean {
  return FALSE_VALUES.has(env.ABARVA_ANTHROPIC_PROMPT_CACHE?.trim().toLowerCase() ?? '');
}

export function resolveAnthropicPromptCache(
  args: {
    system?: string;
    metadata?: Record<string, unknown>;
    env?: NodeJS.ProcessEnv;
  },
): AnthropicPromptCacheResolution {
  const env = args.env ?? process.env;
  const config = nestedCacheConfig(args.metadata);
  const explicitEnabled = booleanValue(config.enabled ?? args.metadata?.promptCacheEnabled);
  const cacheKey = stringFromMetadata(args.metadata, [
    'promptCacheKey',
    'prompt_cache_key',
    'parseCacheKey',
    'parse_cache_key',
    'documentKey',
    'document_key',
    'documentId',
    'document_id',
    'sourceDocumentId',
    'source_document_id',
    'artifactCode',
    'artifact_code',
    'sha256',
  ]);
  const explicitCachePrompt = booleanValue(config.cacheUserPrompt ?? config.cachePrompt);
  const explicitCacheSystem = booleanValue(config.cacheSystemPrompt ?? config.cacheSystem);
  const hasSystem = Boolean(args.system?.trim());
  const cacheUserPrompt = explicitCachePrompt ?? Boolean(cacheKey || explicitEnabled === true);
  const cacheSystemPrompt = explicitCacheSystem ?? hasSystem;
  const enabled =
    explicitEnabled !== false &&
    !promptCacheDisabledByEnv(env) &&
    (cacheSystemPrompt || cacheUserPrompt);

  if (!enabled) {
    return {
      enabled: false,
      cacheSystemPrompt: false,
      cacheUserPrompt: false,
      cacheKey,
      ttl: 'ephemeral_5m',
      reason: explicitEnabled === false || promptCacheDisabledByEnv(env)
        ? 'disabled'
        : 'no cacheable prompt block',
    };
  }

  return {
    enabled,
    cacheSystemPrompt: cacheSystemPrompt && hasSystem,
    cacheUserPrompt,
    cacheKey,
    ttl: 'ephemeral_5m',
    reason: cacheKey ? 'stable cache key metadata' : 'system prompt cache',
  };
}

function cacheableTextBlock(text: string, cache: boolean): CacheableTextBlock {
  return {
    type: 'text',
    text,
    ...(cache ? { cache_control: { type: 'ephemeral' } } : {}),
  } as CacheableTextBlock;
}

export function buildAnthropicPromptCachePayload(args: {
  system?: string;
  prompt: string;
  metadata?: Record<string, unknown>;
  env?: NodeJS.ProcessEnv;
}): AnthropicPromptCachePayload {
  const resolution = resolveAnthropicPromptCache(args);
  return {
    ...(args.system
      ? {
          system: resolution.cacheSystemPrompt
            ? [cacheableTextBlock(args.system, true)]
            : args.system,
        }
      : {}),
    messages: [
      {
        role: 'user',
        content: resolution.cacheUserPrompt
          ? [cacheableTextBlock(args.prompt, true)]
          : args.prompt,
      },
    ],
    auditMetadata: resolution,
  };
}
