import { SENTINEL_PROMPT_V1_0_0 } from '@/lib/prompts/sentinel.v1.0.0';

export type SentinelPromptVersion = '1.0.0';

export interface SentinelPromptDefinition {
  agent: 'sentinel';
  version: SentinelPromptVersion;
  citationBehavior: {
    expectedGroundingFlagPrefix: string;
    requiresContextOnlyAnswers: boolean;
    requiresThinEvidenceDisclosure: boolean;
  };
  buildSystemPrompt(): string;
}

type SentinelPromptEnv = {
  [key: string]: string | undefined;
  SENTINEL_PROMPT_VERSION?: string;
};

export const DEFAULT_SENTINEL_PROMPT_VERSION: SentinelPromptVersion = '1.0.0';

const SENTINEL_PROMPTS = {
  '1.0.0': SENTINEL_PROMPT_V1_0_0,
} satisfies Record<SentinelPromptVersion, SentinelPromptDefinition>;

export function resolveActiveSentinelPromptVersion(
  env: SentinelPromptEnv = process.env,
): SentinelPromptVersion {
  const configuredVersion = env.SENTINEL_PROMPT_VERSION?.trim();
  if (!configuredVersion) return DEFAULT_SENTINEL_PROMPT_VERSION;

  if (configuredVersion in SENTINEL_PROMPTS) {
    return configuredVersion as SentinelPromptVersion;
  }

  const supportedVersions = Object.keys(SENTINEL_PROMPTS).join(', ');
  throw new Error(
    `Unsupported SENTINEL_PROMPT_VERSION "${configuredVersion}". Supported versions: ${supportedVersions}.`,
  );
}

export function getSentinelPrompt(version: SentinelPromptVersion): SentinelPromptDefinition {
  return SENTINEL_PROMPTS[version];
}

export function getActiveSentinelPrompt(
  env: SentinelPromptEnv = process.env,
): SentinelPromptDefinition {
  return getSentinelPrompt(resolveActiveSentinelPromptVersion(env));
}
