export interface ParsedUserIntent {
  name: string;
  title: string;
  organization: string;
  role: string;
  cxo_function: string;
  primary_focus: string;
}

export function parseUserReadyBlock(agentText: string): ParsedUserIntent | null {
  const match = agentText.match(/<user_ready>([\s\S]*?)<\/user_ready>/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed.name || !parsed.title || !parsed.organization || !parsed.role ||
        !parsed.cxo_function || !parsed.primary_focus) return null;
    return parsed as ParsedUserIntent;
  } catch {
    return null;
  }
}

export function stripUserReadyBlock(agentText: string): string {
  return agentText.replace(/<user_ready>[\s\S]*?<\/user_ready>/g, '').trim();
}
