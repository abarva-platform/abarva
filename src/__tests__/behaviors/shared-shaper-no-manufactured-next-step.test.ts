/**
 * Backlog item 41 — the shared shaper must never manufacture a closing.
 *
 * #4038 removed the appended "- Next: open the cited initiative …" ending
 * from Tower and shared aVa answers, and recorded that removal in
 * `docs/releases/records/2026-06-27-tower-stock-closing-contract.md`. The
 * append is gone; what survived it were two options on the shaper's public
 * input — `requireNextStep` and `nextStepFallback` — that read as a
 * guarantee and did nothing. A caller setting `requireNextStep: true` got
 * silence. Item 41 deletes them.
 *
 * Deleting an option is a compile-time change, so these cases pin the
 * *behaviour* the deletion is supposed to leave standing: the real surface
 * shaper returns the answer it was given and appends no closing of its own,
 * in any rendered form.
 *
 * Why the form matters. The visible-answer contract's `scaffolding_label_next`
 * check is `/(?:^|\n)\s*Next:/i`, which catches a bare `Next:` line and
 * *not* `- Next:`, `* Next:` or `**Next:**` — and the bulleted form is
 * precisely the one #4038 removed. Measured, not assumed: see the "the
 * contract is not the backstop here" case below, which states that gap
 * rather than leaving a future reader to assume coverage that is not there.
 * So these assertions carry the weight themselves and do not delegate it.
 */

import { shapeAgentResponseForSurface } from "@/lib/agent/response-shape";
import { shapeSharedAdvisorResponse } from "@/lib/answer/shared-response-shaper";
import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";

/**
 * Every rendered form of a manufactured next-step label. A re-added append
 * has to pick one of these, so the set is the guard.
 */
const NEXT_STEP_LABEL_FORMS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: "bare label", re: /(?:^|\n)\s*Next\s*:/i },
  { name: "dash bullet", re: /(?:^|\n)\s*[-–—]\s*Next\s*:/i },
  { name: "asterisk bullet", re: /(?:^|\n)\s*\*\s*Next\s*:/i },
  { name: "bold label", re: /(?:^|\n)\s*\*\*\s*Next\s*:?\s*\*\*/i },
  { name: "next move label", re: /(?:^|\n)\s*[-–—*\s]*Next move\s*:/i },
];

function expectNoManufacturedClosing(shaped: string, context: string): void {
  for (const form of NEXT_STEP_LABEL_FORMS) {
    // Asserted as an object rather than `expect(re.test(…)).toBe(false)` so a
    // failure names the surface and the form instead of printing `true`.
    expect({ context, form: form.name, matched: form.re.test(shaped) }).toEqual({
      context,
      form: form.name,
      matched: false,
    });
  }
}

/**
 * Tower prose with no action cue at all. This is the exact input the
 * pre-#4038 behaviour keyed on: the append fired *because* nothing in the
 * answer looked like a next step.
 */
const TOWER_PROSE_WITH_NO_ACTION_CUE =
  "The portfolio has pressure in value attainment. The evidence points to adoption and gate timing.";

/**
 * The surfaces the real shaper treats differently: `/tower`, `/intelligence`
 * and `/source` pass advisor prose through, `setup` and `/platform/admin`
 * compact it. A closing appended on any of them reaches a user.
 */
const SURFACES = [
  "/tower",
  "tower",
  "/intelligence",
  "/source",
  "/programs",
  "/strategic-moves",
  "setup",
  "/admin/setup",
  "/platform/admin",
] as const;

describe("the shared shaper manufactures no closing (backlog item 41)", () => {
  it("appends no next-step label on any surface when the answer has no action cue", () => {
    for (const surface of SURFACES) {
      const shaped = shapeAgentResponseForSurface(
        surface,
        TOWER_PROSE_WITH_NO_ACTION_CUE,
      );
      expectNoManufacturedClosing(shaped, surface);
    }
  });

  it("returns Tower advisor prose unchanged rather than adding to it", () => {
    // Stronger than "no Next: label": the shaper adds nothing whatsoever to
    // a clean, already-short advisor answer on a non-compacting surface. Any
    // append — labelled or not — fails this.
    expect(
      shapeAgentResponseForSurface("/tower", TOWER_PROSE_WITH_NO_ACTION_CUE),
    ).toBe(TOWER_PROSE_WITH_NO_ACTION_CUE);
  });

  it("appends nothing through the shared shaper itself, with or without structure preserved", () => {
    for (const preserveStructure of [true, false]) {
      const result = shapeSharedAdvisorResponse({
        text: TOWER_PROSE_WITH_NO_ACTION_CUE,
        preserveStructure,
      });
      expect(result.text).toBe(TOWER_PROSE_WITH_NO_ACTION_CUE);
      expectNoManufacturedClosing(
        result.text,
        `shapeSharedAdvisorResponse preserveStructure=${preserveStructure}`,
      );
    }
  });

  it("emits only the three issue codes it declares, and no next-step issue", () => {
    // The half-reconnect this guards against: re-introducing a
    // `missing_next_step` issue without an append, so a caller is told the
    // guarantee is running when nothing enforces it. The shaper's declared
    // union is raw_id_leak | banned_brand_leak | length_over_target.
    const declared = new Set([
      "raw_id_leak",
      "banned_brand_leak",
      "length_over_target",
    ]);
    const inputs = [
      TOWER_PROSE_WITH_NO_ACTION_CUE,
      "Atlas flagged LAK-AI-004 as the exposure.",
      "The renewal window closes in March and the owner is unnamed.",
      `${"The portfolio carries unmeasured value across several programs. ".repeat(40)}`,
    ];
    for (const text of inputs) {
      for (const code of shapeSharedAdvisorResponse({ text }).issues.map(
        (issue) => issue.code,
      )) {
        expect({ text: text.slice(0, 40), code, declared: declared.has(code) })
          .toEqual({ text: text.slice(0, 40), code, declared: true });
      }
    }
  });

  /**
   * Guardrails. Both pass on unfixed code by design — they are what an
   * over-broad repair breaks, and they are why the cases above can be
   * trusted to mean "nothing was appended" rather than "something was
   * scrubbed".
   */
  it("leaves the model's own next step alone when it is written as prose", () => {
    // #7809 puts an intent-specific next action in Tower's real answer
    // assembly path. Removing the shaper's manufactured closing must not
    // touch a real one the answer producer wrote.
    const authored =
      "The portfolio has pressure in value attainment. Open the value-attainment review with the named program owner before the next governance meeting.";
    expect(shapeAgentResponseForSurface("/tower", authored)).toBe(authored);
  });

  it("leaves the ordinary word next alone in prose", () => {
    const prose =
      "The next renewal lands in March, and the next review after it is unscheduled.";
    const shaped = shapeAgentResponseForSurface("/tower", prose);
    expect(shaped).toBe(prose);
    expect(shaped).toContain("The next renewal lands in March");
  });

  it("the visible-answer contract is not the backstop here, and this states why", () => {
    // Measured on the real contract, not assumed. A bare `Next:` closing is
    // refused; the bulleted form #4038 actually removed is not. This case
    // exists so that a future reader does not delete the cases above on the
    // belief that the contract already covers them — and so that if the
    // contract is ever widened to cover the bulleted form, this case fails
    // and is updated deliberately rather than silently drifting.
    const body = "The portfolio has pressure in value attainment.";
    expect(
      assertVisibleAnswerContract(`${body}\n\nNext: open the cited initiative.`)
        .violations.map((violation) => violation.id),
    ).toContain("scaffolding_label_next");
    expect(
      assertVisibleAnswerContract(
        `${body}\n\n- Next: open the cited initiative.`,
      ).passed,
    ).toBe(true);
  });
});
