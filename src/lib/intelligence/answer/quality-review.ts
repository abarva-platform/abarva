import type { EnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";

export const EXECUTIVE_REVIEW_SUITE = "intelligence-executive-v1";
export function executiveReviewQuestions(
  viewModel: Pick<EnterpriseLandscapeViewModel, "tenantName">,
): string[] {
  const name = viewModel.tenantName;
  return [
    `What should the executive team know about ${name}'s current state that is most consequential right now?`,
    `What are the top 5 AI opportunities for ${name}, and which should we invest in now versus validate first?`,
    "Which trends in our industry matter most over the next 12-24 months, and what do they mean for us specifically?",
    "Where does our current strategy appear out of step with our capabilities, evidence, or industry direction?",
    "Does our leading AI opportunity make economic sense? Show a chart of evidenced costs and benefits if available; otherwise identify the inputs and break-even test needed before investment.",
    "Which data and operating capabilities must be ready before we scale AI? Compare the most consequential gaps, business impact, and validation gates in a compact table.",
    "Show a dependency graph for our priority AI use cases and their data platforms, using confirmed relationships only. Explain any missing relationship evidence.",
    "What are the three most material risks in our AI strategy, and what should executives do to mitigate each before approving investment?",
    "For our priority AI capability, should we build, buy, partner, or hold? Compare the options and state what evidence would change your recommendation.",
    "What should our next 90-day execution plan be? Summarize the sequence, accountable roles where known, decision gates, and measures of success in a compact table.",
  ];
}
