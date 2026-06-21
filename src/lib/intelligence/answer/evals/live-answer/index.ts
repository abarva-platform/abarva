// Live-answer bank — aggregate (W5.2). The full corpus the env-gated live
// model-answer harness scores: ~5 depth+adversarial cases per expert plus the
// global cross-tenant / out-of-domain probes. See ./types.ts for the case shape,
// ./validate.ts for the structural gate, ./check.ts for the per-behavior checker
// the live runner calls against a real Ava answer.

import type { LiveAnswerCase } from "./types";
import { HEALTHCARE_AIRLINE_CASES } from "./cases/healthcare-airline";
import { INDUSTRY_CASES } from "./cases/industry";
import { FRONT_OFFICE_CASES } from "./cases/front-office";
import { FINANCE_RISK_CASES } from "./cases/finance-risk";
import { IT_ESTATE_A_CASES } from "./cases/it-estate-a";
import { IT_ESTATE_B_CASES } from "./cases/it-estate-b";
import { INDUSTRY_OPS_CASES } from "./cases/industry-ops";
import { GLOBAL_ADVERSARIAL_CASES } from "./cases/global-adversarial";

export type { LiveAnswerCase, LiveAnswerBehavior, AdversarialKind } from "./types";
export {
  validateLiveAnswerBank,
  type LiveAnswerBankValidation,
} from "./validate";
export {
  checkLiveAnswerCase,
  type LiveAnswerObservation,
  type LiveAnswerCaseResult,
  type LiveAnswerBehaviorResult,
} from "./check";

export const LIVE_ANSWER_CASES: LiveAnswerCase[] = [
  ...HEALTHCARE_AIRLINE_CASES,
  ...INDUSTRY_CASES,
  ...FRONT_OFFICE_CASES,
  ...FINANCE_RISK_CASES,
  ...IT_ESTATE_A_CASES,
  ...IT_ESTATE_B_CASES,
  ...INDUSTRY_OPS_CASES,
  ...GLOBAL_ADVERSARIAL_CASES,
];
