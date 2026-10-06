import { createStructuredFenceStreamFilter } from "../structured-fence-stream-filter";

const PROSE =
  "The loaded enterprise context shows the shape of spend but not the dollar total.";
const FOLLOWUPS =
  '["Can you pull the spend categories with values attached?","How does the spend profile compare to peer benchmarks?","Which spend lines are candidates to reallocate toward AI and data modernization?"]';

function runStream(chunks: string[]): string {
  const filter = createStructuredFenceStreamFilter();
  let out = "";
  for (const chunk of chunks) out += filter.push(chunk);
  out += filter.flush();
  return out;
}

describe("followups fence must never reach the visible stream", () => {
  it("strips a well-formed fenced followups block delivered in one chunk", () => {
    const out = runStream([`${PROSE}\n\n\`\`\`followups\n${FOLLOWUPS}\n\`\`\``]);
    expect(out).toContain("dollar total");
    expect(out).not.toContain("Can you pull the spend categories");
    expect(out).not.toContain("```");
  });

  it("strips it when the fence marker is split across chunk boundaries", () => {
    const out = runStream([PROSE, "\n\n```fol", "lowups\n", FOLLOWUPS, "\n```"]);
    expect(out).not.toContain("Can you pull the spend categories");
  });

  it("strips it when the stream ends without the closing fence", () => {
    // Truncation (max_tokens) leaves the block unterminated. It must still
    // never render as a raw JSON array in the chat rail.
    const out = runStream([`${PROSE}\n\n\`\`\`followups\n${FOLLOWUPS}`]);
    expect(out).not.toContain("Can you pull the spend categories");
  });

  it("strips it when emitted character by character", () => {
    const full = `${PROSE}\n\n\`\`\`followups\n${FOLLOWUPS}\n\`\`\``;
    const out = runStream(full.split(""));
    expect(out).not.toContain("Can you pull the spend categories");
  });
});
