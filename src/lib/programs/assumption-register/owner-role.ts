// Move assumptions register — owner ROLE, never a person's name.
//
// A register row's `owner_role` reaches generation prompts and the governed
// context object (`toApprovedAssumption`, `toGovernedObject`), so it must be a
// role or function, never a person. This is the one heuristic for that check:
// the aVa `propose_assumption` tool refuses a value it flags, and the charter
// bridge moves a flagged P1 owner into `owner_name` and stores a generic role.
//
// Pure, with no server dependency, so the register panel can read
// `ownerNeedsRole` too.

import type { AssumptionRecord } from "./model";

/**
 * Words that mark an owner value as a ROLE or a function. A value with none of
 * them that reads like a person's name (two or three capitalised words) is
 * refused, as is anything carrying an email address or an honorific.
 */
const ROLE_WORDS = new Set([
  "administrator",
  "analyst",
  "architect",
  "board",
  "business",
  "care",
  "chief",
  "clinical",
  "committee",
  "compliance",
  "controller",
  "coordinator",
  "council",
  "customer",
  "data",
  "department",
  "digital",
  "director",
  "engineering",
  "finance",
  "financial",
  "group",
  "head",
  "lead",
  "leader",
  "legal",
  "manager",
  "nursing",
  "office",
  "officer",
  "operations",
  "owner",
  "partner",
  "people",
  "platform",
  "pmo",
  "president",
  "procurement",
  "product",
  "program",
  "project",
  "quality",
  "revenue",
  "risk",
  "security",
  "sponsor",
  "steward",
  "strategy",
  "supply",
  "team",
  "technology",
  "unit",
  "vice",
  "vp",
]);

/**
 * Does an owner value read like a person rather than a role? A heuristic: it
 * flags an email address, an honorific, or two or three capitalised words
 * with no role or function word. A single bare first name is not flagged.
 */
export function looksLikePersonalName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return true;
  if (/^(mr|mrs|ms|miss|mx|dr|prof)\.?\s/i.test(trimmed)) return true;
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 3) return false;
  if (!words.every((word) => /^[A-Z][a-z'’-]+$/.test(word))) return false;
  return !words.some((word) => ROLE_WORDS.has(word.toLowerCase()));
}

/**
 * The role-only `owner_role` a charter row carries when the owner typed in the
 * P1 charter basis reads like a person. The person stays in `owner_name`,
 * which no generation view or governed object carries.
 */
export const CHARTER_OWNER_ROLE_PLACEHOLDER = "Owner named in the P1 charter";

/**
 * Does this row still need the team to set a real owner ROLE? True for a
 * charter row whose owner was moved to `owner_name` and that still carries the
 * placeholder role.
 */
export function ownerNeedsRole(
  record: Pick<AssumptionRecord, "origin" | "ownerRole">,
): boolean {
  return (
    record.origin === "charter_carry_forward" &&
    record.ownerRole === CHARTER_OWNER_ROLE_PLACEHOLDER
  );
}
