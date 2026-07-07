const ROLE_WORDS = new Set([
  "admin",
  "advisor",
  "business",
  "cco",
  "cdao",
  "cdo",
  "ceo",
  "cfo",
  "chief",
  "cio",
  "ciso",
  "cmo",
  "coo",
  "cosponsor",
  "co",
  "cto",
  "director",
  "lead",
  "officer",
  "owner",
  "primary",
  "program",
  "sponsor",
  "svp",
  "user",
  "vp",
]);

const ROLE_HINT_RE =
  /\b(CEO|CFO|COO|CIO|CTO|CMO|CCO|CDO|CDAO|CISO|CHRO|CRO|CAIO|CMIO|COO|VP|SVP|EVP|Director|Chief [A-Za-z &/]+ Officer)\b/i;

export interface ParsedPersonLabel {
  lookupLabel: string;
  placeholderName: string | null;
  placeholderRole: string | null;
  relationship: "primary" | "co_sponsor" | "unknown";
}

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function roleFromParenthetical(value: string): string | null {
  const match = value.match(/\(([^)]*)\)/);
  if (!match) return null;
  const role = match[1]
    .split(/[,;/]/)
    .map((part) => part.trim())
    .find(
      (part) =>
        part.length > 0 &&
        !/\b(primary|co-?sponsor|sponsor|lead|owner|named by user)\b/i.test(
          part,
        ),
    );
  return role ?? null;
}

function stripDecorators(value: string): string {
  return normalizeSpaces(
    value
      .replace(/\([^)]*\)/g, " ")
      .replace(
        /\b(primary|co-?sponsor|sponsor|lead|owner|both named by user|named by user)\b/gi,
        " ",
      )
      .replace(/[^\p{L}\p{N}' .-]+/gu, " "),
  );
}

function firstMention(value: string): string {
  const [first] = value
    .split(/\s*;\s*|\s+\band\b\s+|\s+\/\s+|\n+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  return first ?? value.trim();
}

function mentions(value: string): string[] {
  return value
    .split(/\s*;\s*|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function relationshipFor(
  value: string,
  index: number,
): ParsedPersonLabel["relationship"] {
  if (/\bco-?sponsor\b/i.test(value)) return "co_sponsor";
  if (/\bprimary\b/i.test(value)) return "primary";
  return index === 0 ? "primary" : "unknown";
}

function looksLikeHumanName(value: string): boolean {
  const tokens = stripDecorators(value)
    .split(" ")
    .map((token) => token.toLowerCase().replace(/[^a-z'-]/g, ""))
    .filter(Boolean)
    .filter((token) => !ROLE_WORDS.has(token));
  return tokens.length >= 2;
}

function parseMention(mention: string, index: number): ParsedPersonLabel {
  const lookupLabel = stripDecorators(mention);
  const placeholderName = looksLikeHumanName(mention) ? lookupLabel : null;
  const parentheticalRole = roleFromParenthetical(mention);
  const roleHint = mention.match(ROLE_HINT_RE)?.[0]?.trim() ?? null;
  return {
    lookupLabel: lookupLabel || mention.trim(),
    placeholderName,
    placeholderRole: parentheticalRole ?? roleHint,
    relationship: relationshipFor(mention, index),
  };
}

export function parsePersonLabelForOrigination(
  label: string,
): ParsedPersonLabel {
  return parseMention(firstMention(label), 0);
}

export function parsePersonMentionsForOrigination(
  label: string,
): ParsedPersonLabel[] {
  const parsed = mentions(label).map((mention, index) =>
    parseMention(mention, index),
  );
  return parsed.length > 0 ? parsed : [parsePersonLabelForOrigination(label)];
}
