// Parses a <choices>…</choices> block optionally emitted by Nexus at the end
// of a turn. Choices are rendered as tappable chips beneath the agent bubble.
// Exactly one <choice> per line; the 4th slot typically carries free_type="true"
// to mean "open the composer for the Maestro to free-type instead."

export interface TurnChoice {
  label: string;
  value: string;
  freeType?: boolean;
}

export interface ParsedChoicesResult {
  text: string; // agent text with the <choices> block removed
  choices: TurnChoice[];
}

const BLOCK_RE = /<choices>([\s\S]*?)<\/choices>/;
const CHOICE_RE = /<choice(?:\s+free_type="([^"]*)")?>([\s\S]*?)<\/choice>/g;

export function parseChoicesFromText(fullText: string): ParsedChoicesResult {
  const match = fullText.match(BLOCK_RE);
  if (!match || match.index === undefined) return { text: fullText, choices: [] };

  const before = fullText.slice(0, match.index);
  const after = fullText.slice(match.index + match[0].length);
  const cleanedText = (before + after).trim();

  const choices: TurnChoice[] = [];
  let m: RegExpExecArray | null;
  const inner = match[1];
  // Reset lastIndex (regex has /g flag)
  CHOICE_RE.lastIndex = 0;
  while ((m = CHOICE_RE.exec(inner)) !== null) {
    const label = m[2].trim();
    if (!label) continue;
    choices.push({
      label,
      value: label,
      freeType: m[1] === 'true' || m[1] === '',
    });
  }

  return { text: cleanedText, choices };
}

export function stripChoicesBlock(text: string): string {
  return text.replace(BLOCK_RE, '').trim();
}
