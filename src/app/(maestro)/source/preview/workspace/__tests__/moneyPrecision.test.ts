import { money, moneyPrecise } from "../viewModel";

/**
 * Two unrelated quantities were rendering as the same string on one surface.
 *
 * On the Story decision strip the sized ask (the sum of the traced negotiation
 * levers) sat two cards from the undrawn commitment (committed annual baseline
 * minus observed spend). On the demo contract those are $1.511M and $1.484M —
 * $27K apart, unrelated measures — and `money` renders millions to one
 * decimal, so both printed "$1.5M". A reader has no way to see that the two
 * are different, and the coherent inference from three cards showing the same
 * figure is that the ask was derived from the gap. It was not.
 */

describe("money precision where two quantities share a surface", () => {
  const SIZED_ASK = 1_511_000;
  const UNDRAWN_COMMITMENT = 1_484_000;

  it("shows the collision that money() produces", () => {
    expect(money(SIZED_ASK)).toBe("$1.5M");
    expect(money(UNDRAWN_COMMITMENT)).toBe("$1.5M");
    expect(money(SIZED_ASK)).toBe(money(UNDRAWN_COMMITMENT));
  });

  it("separates them", () => {
    expect(moneyPrecise(SIZED_ASK)).toBe("$1.51M");
    expect(moneyPrecise(UNDRAWN_COMMITMENT)).toBe("$1.48M");
    expect(moneyPrecise(SIZED_ASK)).not.toBe(
      moneyPrecise(UNDRAWN_COMMITMENT),
    );
  });

  it("defers to money outside the millions, so nothing else changes shape", () => {
    expect(moneyPrecise(66_000)).toBe(money(66_000));
    expect(moneyPrecise(549_000_000_000)).toBe(money(549_000_000_000));
    expect(moneyPrecise(0)).toBe(money(0));
  });

  it("refuses rather than rendering a zero for an absent figure", () => {
    expect(moneyPrecise(null)).toBe("Not established");
    expect(moneyPrecise(undefined)).toBe("Not established");
  });

  it("keeps the sign on a negative figure", () => {
    expect(moneyPrecise(-1_484_000)).toBe("$-1.48M");
  });
});
