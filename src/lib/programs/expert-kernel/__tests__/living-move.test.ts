// The living Move (experience spec §6), generalised — the tenant-agnostic
// composer + the three-anchor case registry.
//
// The living Move was first proven on one tenant (Apex). These tests pin the
// generalised behaviour: the registry resolves all three kernel-anchored
// cases, the composer recompiles each, a control change moves each case's net
// value, the seed-gap-fill un-blocks payback per case, and each case's honest
// verdict is preserved — including First Capital reading `kill` honestly when
// the kernel can see the committed investment does not pay back.

import {
  buildLivingMoveCase,
  defaultsFor,
} from '../living-move';
import {
  LIVING_MOVE_CASES,
  LIVING_MOVE_CASE_IDS,
  DEFAULT_LIVING_MOVE_CASE_ID,
  resolveLivingMoveCase,
  isLivingMoveCaseId,
} from '../living-move-cases';
import {
  buildLivingMoveCase as buildApexLivingMoveCase,
  LIVING_MOVE_DEFAULTS,
} from '../apex-living-move';

describe('living-Move case registry', () => {
  it('resolves all three kernel-anchored tenant cases', () => {
    expect(LIVING_MOVE_CASE_IDS).toEqual(['apexretail', 'meridian', 'arcturus']);
    for (const id of LIVING_MOVE_CASE_IDS) {
      const entry = LIVING_MOVE_CASES[id];
      expect(entry.id).toBe(id);
      expect(entry.tenantLabel.length).toBeGreaterThan(0);
      expect(entry.moveLabel.length).toBeGreaterThan(0);
      // Each case carries exactly six highest-leverage controls.
      expect(entry.controls.length).toBe(6);
      // Exactly one of them is the seed-gap control, and it is named.
      const seedGaps = entry.controls.filter((c) => c.kind === 'seed-gap');
      expect(seedGaps.length).toBe(1);
      expect(seedGaps[0]?.id).toBe(entry.seedGapControlId);
    }
  });

  it('maps each case id to a distinct tenant Move', () => {
    const moves = LIVING_MOVE_CASE_IDS.map(
      (id) => LIVING_MOVE_CASES[id].moveLabel,
    );
    expect(new Set(moves).size).toBe(3);
  });

  it('defaults to the Apex case for an unknown or absent selector', () => {
    expect(resolveLivingMoveCase('meridian').id).toBe('meridian');
    expect(resolveLivingMoveCase('arcturus').id).toBe('arcturus');
    expect(resolveLivingMoveCase('nonsense').id).toBe(
      DEFAULT_LIVING_MOVE_CASE_ID,
    );
    expect(resolveLivingMoveCase(null).id).toBe(DEFAULT_LIVING_MOVE_CASE_ID);
    expect(resolveLivingMoveCase(undefined).id).toBe('apexretail');
  });

  it('isLivingMoveCaseId guards the three known ids', () => {
    expect(isLivingMoveCaseId('apexretail')).toBe(true);
    expect(isLivingMoveCaseId('meridian')).toBe(true);
    expect(isLivingMoveCaseId('arcturus')).toBe(true);
    expect(isLivingMoveCaseId('apex-retail')).toBe(false);
    expect(isLivingMoveCaseId(42)).toBe(false);
  });
});

describe('the composer recompiles every case — honest defaults', () => {
  it.each(LIVING_MOVE_CASE_IDS)(
    '%s opens on the audited case: monetisation blocked by its seed gap',
    (id) => {
      const entry = LIVING_MOVE_CASES[id];
      const live = buildLivingMoveCase(entry, defaultsFor(entry));
      // Each anchor's gross value rests on a declared seed gap — payback is
      // honestly blocked at the audited defaults.
      expect(live.skeleton.economics.monetisable).toBe(false);
      expect(live.skeleton.economics.paybackMonths).toBeNull();
      expect(live.seedGapFilled).toBe(false);
      // The critic still runs; its monetisation blocker is present and the
      // verdict is `shape` — the same honest verdict as the static anchor.
      expect(live.skeleton.critic.hasBlocker).toBe(true);
      expect(live.recommendation).toBe('shape');
      // The three board-grade exhibit datasets are populated.
      expect(live.waterfall.length).toBeGreaterThan(0);
      expect(live.bridgeSteps.length).toBe(6); // six haircut factors
      expect(live.tornado.length).toBeGreaterThan(0);
      expect(live.tornado.some((b) => b.isProxy)).toBe(true);
    },
  );
});

describe('a control change moves each case net value', () => {
  it.each(LIVING_MOVE_CASE_IDS)(
    '%s — a worse adoption-or-data haircut lowers the net value',
    (id) => {
      const entry = LIVING_MOVE_CASES[id];
      const base = buildLivingMoveCase(entry, defaultsFor(entry));
      // Every case carries an `adoptionRisk` or `dataReadiness` score control;
      // worsening the first available score must lower the net value.
      const scoreId = ['adoptionRisk', 'dataReadiness'].find((cid) =>
        entry.controls.some((c) => c.id === cid),
      );
      expect(scoreId).toBeDefined();
      const worse = buildLivingMoveCase(entry, {
        ...defaultsFor(entry),
        [scoreId as string]: 0.15,
      });
      expect(worse.netValue).toBeLessThan(base.netValue);
      expect(worse.haircut).toBeGreaterThan(base.haircut);
    },
  );

  it('each case has a value lever that moves gross value', () => {
    for (const id of LIVING_MOVE_CASE_IDS) {
      const entry = LIVING_MOVE_CASES[id];
      const lever = entry.controls.find((c) => c.kind === 'lever');
      expect(lever).toBeDefined();
      const base = buildLivingMoveCase(entry, defaultsFor(entry));
      const lifted = buildLivingMoveCase(entry, {
        ...defaultsFor(entry),
        [lever!.id]: lever!.max,
      });
      expect(lifted.grossValue).toBeGreaterThan(base.grossValue);
    }
  });
});

describe('the seed-gap-fill interaction works per case', () => {
  it.each(LIVING_MOVE_CASE_IDS)(
    '%s — supplying the seed gap un-blocks monetisation and payback',
    (id) => {
      const entry = LIVING_MOVE_CASES[id];
      const seedGap = entry.controls.find((c) => c.kind === 'seed-gap');
      expect(seedGap?.seedGapBenchmark).toBeGreaterThan(0);

      const blocked = buildLivingMoveCase(entry, defaultsFor(entry));
      expect(blocked.skeleton.economics.paybackMonths).toBeNull();

      const filled = buildLivingMoveCase(entry, {
        ...defaultsFor(entry),
        [entry.seedGapControlId]: seedGap!.seedGapBenchmark!,
      });
      expect(filled.seedGapFilled).toBe(true);
      expect(filled.skeleton.economics.monetisable).toBe(true);
      expect(filled.skeleton.economics.paybackMonths).not.toBeNull();
      expect(filled.skeleton.economics.paybackMonths).toBeGreaterThan(0);

      // Clearing it reverts to the honest blocked state.
      const cleared = buildLivingMoveCase(entry, {
        ...defaultsFor(entry),
        [entry.seedGapControlId]: null,
      });
      expect(cleared.skeleton.economics.paybackMonths).toBeNull();
      expect(cleared.seedGapFilled).toBe(false);
    },
  );
});

describe("First Capital's honest verdict — kill is preserved", () => {
  const fc = LIVING_MOVE_CASES.arcturus;

  it('reads kill honestly when the kernel can see the case underwater', () => {
    // With the seed gap filled (monetisation un-blocked) and the card-fraud
    // loss takeout dragged to its low end, the modelled value no longer clears
    // the committed investment — the kernel returns a negative net return and
    // an honest `kill`, never a fabricated positive.
    const lever = fc.controls.find((c) => c.kind === 'lever');
    const live = buildLivingMoveCase(fc, {
      ...defaultsFor(fc),
      [fc.seedGapControlId]: 135_000,
      [lever!.id]: lever!.min,
    });
    expect(live.skeleton.economics.monetisable).toBe(true);
    expect(live.skeleton.economics.netReturn.point).toBeLessThan(0);
    expect(live.recommendation).toBe('kill');
  });

  it('still opens shape at the audited defaults — kill is not forced', () => {
    const live = buildLivingMoveCase(fc, defaultsFor(fc));
    expect(live.recommendation).toBe('shape');
  });
});

describe('apex-living-move back-compat shim', () => {
  it('still recompiles the Apex case through the legacy entrypoint', () => {
    const live = buildApexLivingMoveCase(LIVING_MOVE_DEFAULTS);
    expect(live.skeleton.economics.monetisable).toBe(false);
    expect(live.seedGapFilled).toBe(false);
    expect(live.recommendation).toBe('shape');
  });

  it('the legacy defaults equal the Apex registry entry defaults', () => {
    expect(LIVING_MOVE_DEFAULTS).toEqual(
      defaultsFor(LIVING_MOVE_CASES.apexretail),
    );
  });
});
