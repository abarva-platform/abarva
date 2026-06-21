// Live-answer bank — aggregate (W5.2). The full corpus the env-gated live
// model-answer harness scores: ~5 depth+adversarial cases per expert plus the
// global cross-tenant / out-of-domain probes. See ./types.ts for the case shape,
// ./validate.ts for the structural gate, ./check.ts for the per-behavior checker
// the live runner calls against a real Ava answer.

import type { LiveAnswerCase } from "./types";
import { FINANCE_RISK_CASES } from "../../../../../../evals/intelligence/live-answer/cases/finance-risk";
import { FRONT_OFFICE_CASES } from "../../../../../../evals/intelligence/live-answer/cases/front-office";
import { GLOBAL_ADVERSARIAL_CASES } from "../../../../../../evals/intelligence/live-answer/cases/global-adversarial";
import { HEALTHCARE_AIRLINE_CASES } from "../../../../../../evals/intelligence/live-answer/cases/healthcare-airline";
import { INDUSTRY_OPS_CASES } from "../../../../../../evals/intelligence/live-answer/cases/industry-ops";
import { INDUSTRY_CASES } from "../../../../../../evals/intelligence/live-answer/cases/industry";
import { IT_ESTATE_A_CASES } from "../../../../../../evals/intelligence/live-answer/cases/it-estate-a";
import { IT_ESTATE_B_CASES } from "../../../../../../evals/intelligence/live-answer/cases/it-estate-b";

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
