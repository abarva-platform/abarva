import {
  denialsSeedIdempotencyKey,
  readExactProposal,
  sourceSetSha256,
  validateDenialsSeedBinding,
  REGISTER_KEYS,
  type DenialsSeedBinding,
} from "../seed-contract";

function binding(): DenialsSeedBinding {
  return {
    moveId: "00000000-0000-4000-8000-000000000001",
    clientId: "00000000-0000-4000-8000-000000000002",
    appClientKey: "meridian",
    canonicalTenantKey: "meridian-health",
    operatorClerkId: "user_dedicated",
    operatorPersonId: "00000000-0000-4000-8000-000000000003",
    approvalRef: "private-approved-scope",
    observedAtUtc: "2026-10-11T16:00:00Z",
    currentPhase: 0,
    occupiedRegisterIds: [],
    registerIds: Object.fromEntries(REGISTER_KEYS.map((key, index) => [
      key, index < 9 ? `DL${index + 1}` : `V${index - 8}`,
    ])),
    sourceSetSha256: sourceSetSha256(),
  };
}

it("freezes the unchanged synthetic proposal and its binary source set", () => {
  const proposal = readExactProposal();
  expect(proposal.rows).toHaveLength(22);
  expect(proposal.rows.filter((row) => row.category === "delivery")).toHaveLength(9);
  expect(proposal.rows.filter((row) => row.category === "value")).toHaveLength(13);
  expect(sourceSetSha256()).toMatch(/^[a-f0-9]{64}$/);
});

it("binds idempotency to one authenticated Move, actor, exact input and allocation", () => {
  const current = binding();
  expect(() => validateDenialsSeedBinding(current)).not.toThrow();
  const key = denialsSeedIdempotencyKey(current);
  expect(key).toMatch(/^moves-denials-register-seed-v1:[a-f0-9]{64}$/);
  expect(denialsSeedIdempotencyKey({ ...current,
    moveId: "00000000-0000-4000-8000-000000000004",
  })).not.toBe(key);
});

it("refuses stale IDs, duplicate IDs, a changed source hash and another tenant", () => {
  const current = binding();
  expect(() => validateDenialsSeedBinding({ ...current, occupiedRegisterIds: ["DL1"] }))
    .toThrow();
  expect(() => validateDenialsSeedBinding({ ...current, registerIds: {
    ...current.registerIds, unit_table: "DL1",
  } })).toThrow();
  expect(() => validateDenialsSeedBinding({ ...current, sourceSetSha256: "0".repeat(64) }))
    .toThrow();
  expect(() => validateDenialsSeedBinding({ ...current, appClientKey: "skyharbor" as "meridian" }))
    .toThrow();
});
