// ─────────────────────────────────────────────────────────────────────────────
// Parsers for structured confirmation blocks emitted by agent turns.
// Each agent mode appends a self-contained <block>{json}</block> after a
// plain-language confirmation; the server detects + strips the block and
// triggers the corresponding mutation.
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedUserIntent {
  name: string;
  title: string;
  organization: string;
  role: string;
  cxo_function: string;
  primary_focus: string;
}

export function parseUserReadyBlock(text: string): ParsedUserIntent | null {
  const m = text.match(/<user_ready>([\s\S]*?)<\/user_ready>/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[1].trim());
    const required = ['name', 'title', 'organization', 'role', 'cxo_function', 'primary_focus'];
    if (required.some((k) => !p[k])) return null;
    return p as ParsedUserIntent;
  } catch {
    return null;
  }
}

export function stripUserReadyBlock(text: string): string {
  return text.replace(/<user_ready>[\s\S]*?<\/user_ready>/g, '').trim();
}

export interface ParsedEngagementIntent {
  name: string;
  sponsor_graph_node_id: string;
  sponsor_creation_needed: boolean;
  sponsor_payload?: {
    name: string;
    title: string;
    organization: string;
    role: string;
    cxo_function: string;
    primary_focus: string;
  };
  industry_code: string;
  function_code: string;
  objective_code: string;
  topic_code: string;
}

export function parseEngagementReadyBlock(text: string): ParsedEngagementIntent | null {
  const m = text.match(/<engagement_ready>([\s\S]*?)<\/engagement_ready>/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[1].trim());
    const required = ['name', 'sponsor_graph_node_id', 'industry_code', 'function_code', 'objective_code', 'topic_code'];
    if (required.some((k) => !p[k])) return null;
    return p as ParsedEngagementIntent;
  } catch {
    return null;
  }
}

export function stripEngagementReadyBlock(text: string): string {
  return text.replace(/<engagement_ready>[\s\S]*?<\/engagement_ready>/g, '').trim();
}
