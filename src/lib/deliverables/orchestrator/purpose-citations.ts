const citation = /\[(\d+(?:\s*[-–,]\s*\d+)*)\]/g;

export function purposeCitationIds(text: string): number[] {
  const ids = new Set<number>();
  for (const match of text.matchAll(citation)) {
    for (const part of match[1]!.split(/\s*,\s*/)) {
      const [start, end = start] = part.split(/\s*[-–]\s*/).map(Number);
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        !start ||
        !end ||
        end < start ||
        end - start > 1000
      )
        throw new Error("Invalid or excessive citation range");
      for (let id = start; id <= end; id++) ids.add(id);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

export function compactPurposeCitationIds(ids: readonly number[]): string {
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let end = i;
    while (sorted[end + 1] === sorted[end]! + 1) end++;
    if (end - i >= 2) {
      parts.push(`${sorted[i]}–${sorted[end]}`);
      i = end;
    } else parts.push(String(sorted[i]));
  }
  return parts.length ? `[${parts.join(", ")}]` : "";
}

/** Keep citation scope at sentence/cell level; never move sources across claims. */
export function collapsePurposeCitations(text: string): string {
  return text
    .split(/(\n|\||(?<=[.!?])\s+(?!\s*\[))/)
    .map((sentence) => {
      const ids = purposeCitationIds(sentence);
      if (!ids.length) return sentence;
      const matches = [...sentence.matchAll(citation)];
      const last = matches.at(-1)!;
      const before = sentence
        .slice(0, last.index)
        .replace(citation, "")
        .replace(/ {2,}/g, " ")
        .replace(/\s+([,;:])/g, "$1")
        .trimEnd();
      return `${before}${before ? " " : ""}${compactPurposeCitationIds(ids)}${sentence.slice(last.index! + last[0].length)}`;
    })
    .join("");
}
