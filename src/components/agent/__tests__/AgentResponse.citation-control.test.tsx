/** @jest-environment jsdom */

/**
 * Behavioral test for the `citation` required-control of the
 * `agent-surface-output` catalog entry — the one entry in
 * docs/security/ai-surface-control-catalog.json that carried
 * `behavioralTest.status: "none"` on a component a route actually mounts.
 *
 * WHY THIS SUITE EXISTS, AND WHAT IT CAN AND CANNOT SAY
 *
 * `AgentResponse.controls.test.tsx` proves four of the five controls on this
 * surface and then documents, in a test of its own, that it cannot prove the
 * fifth: citation substitution happens inside react-markdown's component
 * overrides, and react-markdown is mocked repo-wide to a passthrough because
 * its ESM breaks next/jest's transform. That note names the two ways out —
 * "a suite that unmocks react-markdown, or one against
 * @/lib/agent/markdownTokens directly". This is the second, joined back to the
 * real component.
 *
 * The control is a two-link chain and the links fail differently:
 *
 *   1. `AgentResponse` builds a placeholder -> node map from
 *      `response.citations`, keyed by BOTH the placeholder the model emitted
 *      and the canonical `{{cite:type:id}}` form.
 *   2. `tokenize` in markdownTokens substitutes any key it finds in the text.
 *
 * Link 2 already has coverage (`markdownRenderer.test.tsx · inline-node
 * substitution`), and it is substitution of *an arbitrary node supplied by the
 * test* — it says nothing about what the product puts in that map. Link 1 has
 * had no coverage at all, and it is the link that fails silently: if the key
 * grammar drifts by one character the map still exists, still has entries,
 * still gets passed down, and every citation in every answer degrades to
 * literal `{{cite:...}}` text with nothing red anywhere.
 *
 * So this suite drives the REAL `AgentResponse`, intercepts the REAL map it
 * hands to `AgentMarkdown`, and runs it through the REAL `tokenize`. The only
 * substituted part is react-markdown's own block parse, which is what the
 * repo-wide mock blocks. That limit is asserted explicitly at the end rather
 * than left as a comment, so a future change that makes the real renderer
 * reachable has a line to delete.
 *
 * Fixtures are single-paragraph on purpose. The real `AgentMarkdown` calls
 * `tokenizeChildren` on the text children of each parsed element; for one
 * paragraph of prose that string is the paragraph. Multi-block fixtures would
 * make the stand-in diverge from the renderer and the suite would start
 * proving its own arithmetic.
 */

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import {
  normalizeAbarvaAgentMarkup,
  tokenizeChildren,
} from "@/lib/agent/markdownTokens";
import type { Citation } from "@/lib/agent/renderedResponse";

/**
 * Captures what the real component passes down. Assigned by the mock below on
 * every render; read by the assertions.
 */
let handedToRenderer: {
  text: string;
  inlineNodes?: ReadonlyMap<string, ReactNode>;
} | null = null;

jest.mock("@/lib/agent/markdownRenderer", () => {
  const actualTokens = jest.requireActual("@/lib/agent/markdownTokens");
  return {
    __esModule: true,
    AgentMarkdown: ({
      text,
      inlineNodes,
    }: {
      text: string;
      inlineNodes?: ReadonlyMap<string, ReactNode>;
    }) => {
      handedToRenderer = { text, inlineNodes };
      return (
        <div data-testid="agent-markdown">
          {actualTokens.tokenizeChildren(
            actualTokens.normalizeAbarvaAgentMarkup(text),
            "citation-control",
            inlineNodes,
          )}
        </div>
      );
    },
  };
});

// Imported after the mock is declared so the component picks it up.
import { AgentResponse } from "../AgentResponse";

const PROSE =
  "Denial write-offs rose to $4.2M last year, the single largest recoverable line in the portfolio.";

function citation(extra: Partial<Citation> = {}): Citation {
  return {
    placeholder: "[[E1]]",
    target_type: "evidence_source",
    target_id: "denials-ledger-fy25",
    target_slug: "denials-ledger-fy25",
    target_label: "Denials ledger FY25",
    confidence: 0.82,
    confidence_tier: "HIGH",
    provenance: "measured",
    ...extra,
  };
}

function response(extra: Record<string, unknown> = {}) {
  return {
    response_text: PROSE,
    citations: [],
    confidence_signal: "medium",
    sparsity_flag: false,
    follow_up_actions: [],
    handoff_affordance: null,
    ...extra,
  } as never;
}

beforeEach(() => {
  handedToRenderer = null;
});

describe("agent response · citation control · the map the component builds", () => {
  it("keys every citation under the placeholder the model actually emitted", () => {
    // The model's placeholder is the only key the answer text is guaranteed to
    // contain. A citation whose placeholder is not a key cannot resolve, no
    // matter how well-formed the citation is.
    const cite = citation({ placeholder: "[[E1]]" });

    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${cite.placeholder}`,
          citations: [cite],
        })}
      />,
    );

    expect(handedToRenderer).not.toBeNull();
    expect(handedToRenderer?.inlineNodes?.has(cite.placeholder)).toBe(true);
  });

  it("also keys it under the canonical {{cite:type:id}} form", () => {
    // Claude does not always emit the canonical spelling. The component maps
    // both grammars to the same pill; this asserts the canonical one is
    // derived from target_type and target_id in that order.
    const cite = citation();

    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${cite.placeholder}`,
          citations: [cite],
        })}
      />,
    );

    expect(
      handedToRenderer?.inlineNodes?.has(
        `{{cite:${cite.target_type}:${cite.target_id}}}`,
      ),
    ).toBe(true);
  });

  it("keys every citation in a multi-citation answer, not just the first", () => {
    const first = citation();
    const second = citation({
      placeholder: "[[P2]]",
      target_type: "pattern",
      target_id: "denial-prevention-front-end",
      target_slug: "denial-prevention-front-end",
      target_label: "Front-end denial prevention",
      confidence_tier: "MEDIUM",
    });

    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${first.placeholder} ${second.placeholder}`,
          citations: [first, second],
        })}
      />,
    );

    expect(handedToRenderer?.inlineNodes?.has(first.placeholder)).toBe(true);
    expect(handedToRenderer?.inlineNodes?.has(second.placeholder)).toBe(true);
  });

  it("hands down an empty map when the answer cites nothing", () => {
    // The inverse case. An uncited answer must not carry stray keys that
    // could substitute prose — and the citation-gap control, tested next
    // door, is what makes that answer honest.
    render(<AgentResponse response={response({ citations: [] })} />);

    expect(handedToRenderer?.inlineNodes?.size ?? 0).toBe(0);
  });
});

describe("agent response · citation control · what the reader sees", () => {
  it("resolves the placeholder to a citation pill naming the source", () => {
    const cite = citation();

    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${cite.placeholder}`,
          citations: [cite],
        })}
        compactCitations={false}
      />,
    );

    const markdown = screen.getByTestId("agent-markdown");
    const pill = markdown.querySelector(".citation-pill");

    expect(pill).toBeTruthy();
    expect(pill?.getAttribute("data-target-type")).toBe("evidence_source");
    expect(markdown.textContent ?? "").toContain(cite.target_label);
  });

  it("leaves no raw placeholder text where a citation resolved", () => {
    // The failure this control exists to prevent is a reader seeing
    // `{{cite:...}}` in an executive answer.
    const cite = citation();

    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${cite.placeholder}`,
          citations: [cite],
        })}
        compactCitations={false}
      />,
    );

    const markdown = screen.getByTestId("agent-markdown");
    expect(markdown.textContent ?? "").not.toContain(cite.placeholder);
    expect(markdown.textContent ?? "").not.toContain("{{cite:");
  });

  it("resolves the canonical grammar even when the model emitted another", () => {
    // The text carries the canonical form while the citation's own
    // `placeholder` field is something else — the case the second map key
    // exists for, driven end to end rather than asserted on the map.
    const cite = citation();
    const canonical = `{{cite:${cite.target_type}:${cite.target_id}}}`;

    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${canonical}`,
          citations: [cite],
        })}
        compactCitations={false}
      />,
    );

    const markdown = screen.getByTestId("agent-markdown");
    expect(markdown.querySelector(".citation-pill")).toBeTruthy();
    expect(markdown.textContent ?? "").not.toContain(canonical);
  });

  it("renders a broken target visibly rather than hiding it", () => {
    // §9.4: an unresolvable target is never silently dropped. Asserted here
    // because "the placeholder disappeared" is otherwise indistinguishable
    // from "the citation resolved".
    const cite = citation({ broken_target: true });

    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${cite.placeholder}`,
          citations: [cite],
        })}
        compactCitations={false}
      />,
    );

    const markdown = screen.getByTestId("agent-markdown");
    expect(markdown.querySelector(".citation-broken")).toBeTruthy();
    expect(markdown.textContent ?? "").not.toContain(cite.placeholder);
  });

  it("renders an unresolvable placeholder as literal text rather than swallowing it", () => {
    // §4.6 failure semantics: a placeholder with no matching citation should
    // reach the reader visibly broken. Pinned so that a future "tidy up
    // stray placeholders" change has to argue with this line.
    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} {{cite:pattern:never-retrieved}}`,
          citations: [],
        })}
      />,
    );

    expect(screen.getByTestId("agent-markdown").textContent ?? "").toContain(
      "{{cite:pattern:never-retrieved}}",
    );
  });
});

describe("agent response · citation control · the limit of this suite", () => {
  it("states what it does not cover: react-markdown's own parse", () => {
    // Everything above runs the real map builder and the real tokenizer. What
    // it does not run is react-markdown parsing the answer into blocks and
    // calling the component overrides — that is mocked repo-wide and no jsdom
    // suite here can unmock it without changing the transform config for the
    // whole repository. Proven rather than claimed: the real renderer module
    // is the one being stood in for, and the stand-in performs the same two
    // calls the real one performs on a single-paragraph answer.
    const cite = citation();
    render(
      <AgentResponse
        response={response({
          response_text: `${PROSE} ${cite.placeholder}`,
          citations: [cite],
        })}
        compactCitations={false}
      />,
    );

    const text = handedToRenderer?.text ?? "";
    expect(
      tokenizeChildren(
        normalizeAbarvaAgentMarkup(text),
        "limit",
        handedToRenderer?.inlineNodes,
      ),
    ).toBeTruthy();
    expect(normalizeAbarvaAgentMarkup(text)).toBe(
      normalizeAbarvaAgentMarkup(`${PROSE} ${cite.placeholder}`),
    );
  });
});
