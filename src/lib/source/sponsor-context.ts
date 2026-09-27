export interface SourceSponsorContext {
  name: string;
  title: string;
  role: string;
  email: string;
  ownerAcknowledged: true;
}

function cleanField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/ {2,}/g, " ");
  if (text.length < 2 || text.length > 120 || /[\x00-\x1f\x7f]/.test(text)) return null;
  if (/^(unknown|none|n\/a|test)$/i.test(text)) return null;
  return text;
}

function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null;
}

export function parseSourceSponsorContext(value: unknown): SourceSponsorContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const name = cleanField(row.name);
  const title = cleanField(row.title);
  const role = cleanField(row.role);
  const email = cleanEmail(row.email);
  if (!name || !title || !role || !email || row.ownerAcknowledged !== true) return null;
  return { name, title, role, email, ownerAcknowledged: true };
}

export function formatSourceSponsorContext(context: SourceSponsorContext): string {
  return [
    `Sponsor reference: ${context.name}`,
    `Title: ${context.title}`,
    `Role: ${context.role}`,
    `Notification address: ${context.email}`,
    "The signed-in Event Owner or admin made this decision. The named sponsor did not approve or sign through this action.",
  ].join("\n");
}
