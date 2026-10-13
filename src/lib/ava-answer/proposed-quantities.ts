import { splitNarrativeSentences } from "@/lib/home/preview/narrative-sentences";

export function quantitativeMentions(text: string) {
  const multipliers: Record<string, number> = {
    k: 1_000,
    thousand: 1_000,
    m: 1_000_000,
    million: 1_000_000,
    b: 1_000_000_000,
    billion: 1_000_000_000,
  };
  return Array.from(
    text.matchAll(
      /(?<![\w])([+-]?)(?:(\$|USD\b)\s*)?([+-]?\d+(?:,\d{3})*(?:\.\d+)?)(?:\s*(%|percent\b|[KMB]\b|thousand\b|million\b|billion\b))?(?:\s+(USD\b|dollars\b))?/gi,
    ),
    (match) => {
      const value = Number(`${match[1]}${match[3]}`.replace(/,/g, ""));
      const unit = match[4]?.toLowerCase();
      const currency = Boolean(match[2] || match[5]);
      const percentage = unit === "%" || unit === "percent";
      return {
        token: percentage
          ? `${currency ? "usd_percent" : "percent"}:${value}`
          : `${currency ? "usd" : "number"}:${value * (multipliers[unit] ?? 1)}`,
        start: match.index!,
        end: match.index! + match[0].length,
        malformed:
          !Number.isFinite(value) ||
          (percentage &&
            (currency ||
              /^(?:%|USD\b|dollars\b|percent\b)/i.test(
                text.slice(match.index! + match[0].length),
              ))),
      };
    },
  );
}

export function proposalClauses(text: string): string[] {
  return splitNarrativeSentences(text).flatMap((sentence) =>
    sentence.split(/;|:\s+|,\s+(?:but|whereas|while|yet|and)\b\s*/i),
  );
}

export function isLocallyQualifiedUserProposal(
  sentence: string,
  mentions: ReturnType<typeof quantitativeMentions>,
  index: number,
  proposedTokens: ReadonlySet<string>,
): boolean {
  const mention = mentions[index];
  if (!mention || mention.malformed || !proposedTokens.has(mention.token))
    return false;
  const resultText = sentence.replace(
    /\b(?:not|no|without)\s+(?:(?:a|an)\s+)?(?:(?:measured|achieved|delivered)(?:\s+(?:result|outcome|baseline))?|(?:(?:committed|realizable|realised|realized)\s+)?savings(?:\s+commitment)?|(?:(?:recorded|current|verified|confirmed|actual|resolution|measured|existing)\s+){0,6}baseline)(?:\s+(?:or|nor)\s+(?:(?:a|an)\s+)?(?:(?:measured|achieved|delivered)(?:\s+(?:result|outcome|baseline))?|(?:(?:committed|realizable|realised|realized)\s+)?savings(?:\s+commitment)?|(?:(?:recorded|current|verified|confirmed|actual|resolution|measured|existing)\s+){0,6}baseline))*/gi,
    "",
  );
  const assertsResult =
    /\b(?:achieved|delivered|measured|saved|saves|savings)\b/i.test(
      resultText,
    ) ||
    /\b(?:is|was|equals|matches|represents|reflects|constitutes)\s+(?:(?:a|an|the|our|recorded|current|verified|confirmed|actual|resolution|measured|existing)\s+){0,8}baseline\b/i.test(
      resultText,
    ) ||
    /\b(?:baseline|current\s+resolution|existing\s+resolution)\s+(?:is|was|equals|stands at|runs at)\s+(?:[\w-]+\s+){0,6}[+-]?\d/i.test(
      resultText,
    );
  if (assertsResult) return false;
  // A nearby target qualifier cannot license a different numerical occurrence.
  const before = sentence.slice(
    Math.max(mentions[index - 1]?.end ?? 0, mention.start - 100),
    mention.start,
  );
  const after = sentence.slice(
    mention.end,
    Math.min(mentions[index + 1]?.start ?? sentence.length, mention.end + 100),
  );
  const precedingQualifier = before.match(
    /\b(?:proposed|hypothetical|illustrative|assumed|unmeasured)\s+(?:[\w-]+\s+){0,4}$/i,
  );
  const positivePrefix = Boolean(
    precedingQualifier &&
    !/\b(?:not|no|never|without)\s+(?:(?:currently|presently|yet|now|genuinely|explicitly)\s+){0,3}(?:(?:a|an|the)\s+)?$/i.test(
      before.slice(0, precedingQualifier.index),
    ),
  );
  if (precedingQualifier && !positivePrefix) return false;
  const locallyProposed =
    positivePrefix ||
    /^\s*(?:(?:is|remains|as|would be)\s+)?(?:(?:only|a|an|the)\s+)?(?:proposed|hypothetical|illustrative|assumed|unmeasured)\b/i.test(
      after,
    ) ||
    /^\s*(?:[\w-]+\s+){0,6}(?:target|assumption|scenario|hypothesis|ambition)\s+(?:is|remains|would be)\s+(?:(?:only|a|an|the)\s+)?(?:proposed|hypothetical|illustrative|assumed|unmeasured)\b/i.test(
      after,
    );
  return (
    locallyProposed &&
    /\b(?:target|assumption|scenario|hypothesis|ambition)\b/i.test(
      `${before} ${after}`,
    )
  );
}

export function isUserProvidedPercentageProposal(
  passages: string[],
  question: string,
  claim: string,
): boolean {
  const token = quantitativeMentions(claim)[0]?.token;
  if (!token?.startsWith("percent:")) return false;
  const proposed = new Set(
    quantitativeMentions(question)
      .filter((mention) => !mention.malformed)
      .map((mention) => mention.token),
  );
  const occurrences = passages.flatMap(proposalClauses).flatMap((sentence) => {
    const mentions = quantitativeMentions(sentence);
    return mentions.flatMap((mention, index) =>
      mention.token === token
        ? [isLocallyQualifiedUserProposal(sentence, mentions, index, proposed)]
        : [],
    );
  });
  return occurrences.length > 0 && occurrences.every(Boolean);
}
