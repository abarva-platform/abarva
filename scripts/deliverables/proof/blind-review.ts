/**
 * The blind review.
 *
 * The reviewer is a fresh model call whose context contains the two slide sets,
 * shuffled, and nothing else. No renderer names, no file paths, no hint which
 * is which, and no mention that one of them was produced by a model. The key
 * exists on disk and is deliberately not read into the prompt.
 *
 * This is an instrument, not a verdict. It removes the obvious confound — a
 * reviewer who knows which deck is the new one — but it cannot substitute for
 * the human judgement the increment was built to ask for.
 */
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "@/lib/deliverables/orchestrator/orchestrator";
import { deliverableModel } from "@/lib/deliverables/model-policy";

const OUT = path.resolve(process.argv[2] ?? "./proof-out");
const KEY = JSON.parse(fs.readFileSync(path.join(OUT, "blind-pack/KEY-do-not-open-first.json"), "utf8"));

const apiKey =
  process.env.ANTHROPIC_API_KEY ??
  fs.readFileSync("/Users/anand/Projects/nexus/.env.local", "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m)![1].trim();

const SOURCE_DIR: Record<string, string> = {
  "renderer:deterministic": "png-baseline",
  "renderer:model-composed": process.env.COMPOSED_PNG ?? "png-B",
};

const SYSTEM = `You are a partner-level reviewer about to take a deck into a steering committee with a CIO, a CFO and a COO.

You are shown two decks built from the SAME approved source material. Judge only what a reader sees.

Answer these six questions for EACH deck, then state a preference.

1. Can I understand the conclusion in under two minutes?
2. Does the deck tell one coherent story?
3. Does each slide make one meaningful point?
4. Are the visuals helping me understand rather than decorating the prose?
5. Can I distinguish facts, gaps, hypotheses and decisions?
6. Would I use this deck in a CDAO/CIO steering meeting without redesigning it?

Return ONE JSON object:

{
  "deckOne": { "q1": {"score": 1-5, "note": "..."}, ..., "q6": {...}, "total": n, "summary": "..." },
  "deckTwo": { ... },
  "preference": "Deck One" | "Deck Two" | "neither",
  "margin": "decisive" | "clear" | "narrow" | "none",
  "why": "...",
  "whatTheLoserDoesBetter": "...",
  "wouldRedesign": { "deckOne": true|false, "deckTwo": true|false }
}

Score 1 (no) to 5 (yes, unreservedly). Be exacting: a deck that is merely tidy is not a 5. If both are weak, say so.`;

function slidesOf(dir: string): string[] {
  const p = path.join(OUT, dir);
  return fs.readdirSync(p).filter((f) => f.endsWith(".png")).sort().map((f) => path.join(p, f));
}

async function main() {
  const content: Anthropic.ContentBlockParam[] = [];
  for (const label of ["Deck One", "Deck Two"] as const) {
    const source = KEY[label].source as string;
    const files = slidesOf(SOURCE_DIR[source]);
    content.push({ type: "text", text: `\n=== ${label} — ${files.length} slides, in order ===` });
    files.forEach((f, i) => {
      content.push({ type: "text", text: `${label}, slide ${i + 1}:` });
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: fs.readFileSync(f).toString("base64") },
      });
    });
  }
  content.push({ type: "text", text: "\nReview both decks and return the single JSON object." });

  const client = new Anthropic({ apiKey });
  const model = deliverableModel();
  const started = Date.now();
  const response = await client.messages
    .stream({ model, system: SYSTEM, messages: [{ role: "user", content }], max_tokens: 24_000 })
    .finalMessage();
  const body = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  console.log(
    `reviewer: ${model}  in ${response.usage.input_tokens.toLocaleString()} out ${response.usage.output_tokens.toLocaleString()}  ${((Date.now() - started) / 1000).toFixed(0)}s`,
  );

  fs.writeFileSync(path.join(OUT, "blind-review-raw.txt"), body);
  const verdict = extractJson<Record<string, unknown>>(body);
  if (!verdict) {
    console.error("reviewer returned no parseable verdict");
    process.exit(1);
  }
  fs.writeFileSync(path.join(OUT, "blind-review.json"), JSON.stringify(verdict, null, 2));

  const show = (label: "deckOne" | "deckTwo", name: string) => {
    const d = verdict[label] as Record<string, { score: number; note: string }> & { total: number; summary: string };
    console.log(`\n${name}  total ${d.total}/30`);
    for (let q = 1; q <= 6; q++) {
      const item = d[`q${q}`];
      console.log(`  q${q} ${item.score}/5  ${item.note.slice(0, 110)}`);
    }
    console.log(`  → ${d.summary.slice(0, 200)}`);
  };
  show("deckOne", "Deck One");
  show("deckTwo", "Deck Two");
  console.log(`\npreference: ${verdict.preference} (${verdict.margin})`);
  console.log(`why: ${verdict.why}`);
  console.log(`the other does better: ${verdict.whatTheLoserDoesBetter}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
