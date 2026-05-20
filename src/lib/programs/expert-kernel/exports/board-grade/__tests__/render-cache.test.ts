// Board-grade render memo cache — behaviour contract tests.
//
// `render-cache.ts` is a deterministic in-process memo: the eight
// `/api/v1/moves/board-grade-*` routes are `force-dynamic` and recompute
// their PURE, date-keyed artifact on every request. The cache wraps each
// renderer CALL SITE so the artifact is computed once per `(artifact,
// format, generatedOn)` key and reused thereafter.
//
// These tests pin the three load-bearing properties:
//   • same key → `compute` runs exactly once;
//   • different key → `compute` runs again;
//   • the store is bounded — FIFO eviction caps it so a date rollover cannot
//     grow it without limit.
// Plus the integration check: a wrapped real board-grade renderer is invoked
// once per `generatedOn` and returns byte-identical output.

import {
  cachedRender,
  cachedRenderAsync,
  __resetRenderCacheForTests,
} from '../render-cache';
import { renderApexDiscoverBriefHtml } from '../discover-brief-renderer';

describe('render-cache — cachedRender (sync)', () => {
  beforeEach(() => {
    __resetRenderCacheForTests();
  });

  it('runs compute once for repeated same-key calls', () => {
    let calls = 0;
    const compute = () => {
      calls += 1;
      return `value-${calls}`;
    };

    const first = cachedRender('artifact:html:2026-05-20', compute);
    const second = cachedRender('artifact:html:2026-05-20', compute);
    const third = cachedRender('artifact:html:2026-05-20', compute);

    expect(calls).toBe(1);
    // Every call returns the SAME stored value — not a recomputed one.
    expect(first).toBe('value-1');
    expect(second).toBe('value-1');
    expect(third).toBe('value-1');
  });

  it('runs compute again for a different key (e.g. a date rollover)', () => {
    let calls = 0;
    const compute = () => {
      calls += 1;
      return `value-${calls}`;
    };

    cachedRender('artifact:html:2026-05-20', compute);
    cachedRender('artifact:html:2026-05-20', compute);
    // A new day → a new key → a fresh compute.
    const rolledOver = cachedRender('artifact:html:2026-05-21', compute);

    expect(calls).toBe(2);
    expect(rolledOver).toBe('value-2');
  });

  it('keys distinct artifacts and formats independently', () => {
    let calls = 0;
    const compute = () => {
      calls += 1;
      return calls;
    };

    cachedRender('costed-business-case:html:2026-05-20', compute);
    cachedRender('costed-business-case:pptx:2026-05-20', compute);
    cachedRender('discover-brief:html:2026-05-20', compute);
    // Repeats of each — all served from the memo.
    cachedRender('costed-business-case:html:2026-05-20', compute);
    cachedRender('costed-business-case:pptx:2026-05-20', compute);
    cachedRender('discover-brief:html:2026-05-20', compute);

    expect(calls).toBe(3);
  });

  it('does NOT cache a throw — the next call retries', () => {
    let calls = 0;
    const compute = () => {
      calls += 1;
      if (calls === 1) throw new Error('transient render failure');
      return 'recovered';
    };

    expect(() => cachedRender('artifact:html:2026-05-20', compute)).toThrow(
      'transient render failure',
    );
    // The failure left nothing stored, so the next call recomputes.
    const recovered = cachedRender('artifact:html:2026-05-20', compute);

    expect(calls).toBe(2);
    expect(recovered).toBe('recovered');
  });

  it('bounds the store with FIFO eviction (cap of 32 entries)', () => {
    let calls = 0;
    const compute = () => {
      calls += 1;
      return calls;
    };

    // Fill well past the 32-entry cap with unique keys.
    for (let i = 0; i < 100; i += 1) {
      cachedRender(`artifact:html:day-${i}`, compute);
    }
    expect(calls).toBe(100);

    // The 32 most-recent keys survive — they are served from the memo.
    for (let i = 68; i < 100; i += 1) {
      cachedRender(`artifact:html:day-${i}`, compute);
    }
    expect(calls).toBe(100);

    // An evicted (oldest) key must recompute — proof the map did not grow
    // unbounded.
    cachedRender('artifact:html:day-0', compute);
    expect(calls).toBe(101);
  });
});

describe('render-cache — cachedRenderAsync', () => {
  beforeEach(() => {
    __resetRenderCacheForTests();
  });

  it('awaits compute once for repeated same-key calls', async () => {
    let calls = 0;
    const compute = async () => {
      calls += 1;
      return Buffer.from(`pptx-${calls}`);
    };

    const first = await cachedRenderAsync('case:pptx:2026-05-20', compute);
    const second = await cachedRenderAsync('case:pptx:2026-05-20', compute);

    expect(calls).toBe(1);
    expect(first).toBe(second);
    expect(first.toString()).toBe('pptx-1');
  });

  it('does NOT cache a rejection — the next call retries', async () => {
    let calls = 0;
    const compute = async () => {
      calls += 1;
      if (calls === 1) throw new Error('transient rasterise failure');
      return Buffer.from('recovered');
    };

    await expect(
      cachedRenderAsync('case:pptx:2026-05-20', compute),
    ).rejects.toThrow('transient rasterise failure');
    const recovered = await cachedRenderAsync('case:pptx:2026-05-20', compute);

    expect(calls).toBe(2);
    expect(recovered.toString()).toBe('recovered');
  });
});

describe('render-cache — wrapped board-grade renderer', () => {
  beforeEach(() => {
    __resetRenderCacheForTests();
  });

  it('invokes the underlying renderer once per generatedOn and returns identical output', () => {
    let renderCalls = 0;
    const wrapped = (generatedOn: string) =>
      cachedRender(`discover-brief:html:${generatedOn}`, () => {
        renderCalls += 1;
        return renderApexDiscoverBriefHtml(generatedOn);
      });

    const first = wrapped('2026-05-20');
    const second = wrapped('2026-05-20');

    // The pure renderer ran exactly once for the shared date.
    expect(renderCalls).toBe(1);
    // The bytes served are identical — a behaviour-preserving memo.
    expect(second).toBe(first);
    expect(first).toBe(renderApexDiscoverBriefHtml('2026-05-20'));

    // A different day recomputes — and still matches a direct render.
    const nextDay = wrapped('2026-05-21');
    expect(renderCalls).toBe(2);
    expect(nextDay).toBe(renderApexDiscoverBriefHtml('2026-05-21'));
  });
});
