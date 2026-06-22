// Golden questions — W5.2 eval fixtures.
//
// Comprehensive CXO question coverage for the Consilium faculty: ~5 questions
// per expert across distinct angles (headline metric, AI use-case, pain-theme,
// vendor/system-of-record, diagnostic/ROI). Used by the golden eval
// (golden-eval.ts) to score the DETERMINISTIC layer that runs without the model
// or the live env: does the router summon the right expert as lead, and does
// the grounding block carry that expert's authored content? Per-expert golden
// coverage is also what makes a pack EXPOSABLE (see exposure/shared-engine-policy.ts).
//
// The fixtures live in per-domain batch modules under ./golden/ so they can be
// authored + verified independently; this file aggregates them into the single
// GOLDEN_QUESTIONS array the eval + harness consume. The model-answer quality
// scoring rides on the W5.1 runner + live env and is layered on top later.

export type { GoldenQuestion } from "./golden/types";
import type { GoldenQuestion } from "./golden/types";

import { BATCH_1_HEALTHCARE_AIRLINE } from "./golden/batch1-healthcare-airline";
import { BATCH_2_INDUSTRY } from "./golden/batch2-industry";
import { BATCH_3_FRONT_OFFICE } from "./golden/batch3-front-office";
import { BATCH_4_FINANCE_RISK } from "./golden/batch4-finance-risk";
import { BATCH_5_IT_ESTATE_A } from "./golden/batch5-it-estate-a";
import { BATCH_6_IT_ESTATE_B } from "./golden/batch6-it-estate-b";
import { BATCH_7_INDUSTRY_OPS } from "./golden/batch7-industry-ops";

export const GOLDEN_QUESTIONS: GoldenQuestion[] = [
  ...BATCH_1_HEALTHCARE_AIRLINE,
  ...BATCH_2_INDUSTRY,
  ...BATCH_3_FRONT_OFFICE,
  ...BATCH_4_FINANCE_RISK,
  ...BATCH_5_IT_ESTATE_A,
  ...BATCH_6_IT_ESTATE_B,
  ...BATCH_7_INDUSTRY_OPS,
];
