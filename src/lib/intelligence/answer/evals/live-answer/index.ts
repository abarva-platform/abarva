// Live-answer eval API (W5.2). Keep this barrel lightweight so production
// builds can import checker/validator contracts without pulling the full case
// bank into the Next.js app typecheck. The corpus itself lives in ./bank.ts.

export type {
  LiveAnswerCase,
  LiveAnswerBehavior,
  AdversarialKind,
} from "./types";
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
