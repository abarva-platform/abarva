export type SignalSourceType =
  | "vendor_announcement"
  | "regulatory"
  | "analyst"
  | "manual_curated";

export interface SignalSeed {
  id: string;
  title: string;
  sourceType: SignalSourceType;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  observedAt: string;
  ingestedAt: string;
  confidence: number;
  ttlDays: number;
  affectedPatternIds: string[];
  affectedProgramIds: string[];
}

const INGESTED_AT = "2026-04-28";

export const MANUAL_SIGNALS: SignalSeed[] = [
  {
    id: "SIG-SRC-2025-001",
    title: "Microsoft 365 Copilot adds tuning and multi-agent orchestration",
    sourceType: "vendor_announcement",
    sourceName: "Microsoft 365 Blog",
    sourceUrl:
      "https://www.microsoft.com/en-us/microsoft-365/blog/2025/05/19/introducing-microsoft-365-copilot-tuning-multi-agent-orchestration-and-more-from-microsoft-build-2025/",
    summary:
      "Microsoft said customers created more than 1 million custom agents in SharePoint and Copilot Studio and introduced Copilot Tuning and multi-agent orchestration for larger enterprise rollouts.",
    observedAt: "2025-05-19",
    ingestedAt: INGESTED_AT,
    confidence: 0.91,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-007", "PAT-AI-010", "PAT-AI-014"],
    affectedProgramIds: ["M365-COPILOT-ROLLOUT"],
  },
  {
    id: "SIG-SRC-2025-002",
    title: "Anthropic ships code execution, MCP, files, and extended caching",
    sourceType: "vendor_announcement",
    sourceName: "Anthropic",
    sourceUrl: "https://claude.com/blog/agent-capabilities-api",
    summary:
      "Anthropic added code execution, remote MCP connectors, Files API support, and one-hour prompt caching to make agent workflows more practical to build and operate.",
    observedAt: "2025-05-22",
    ingestedAt: INGESTED_AT,
    confidence: 0.92,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-006", "PAT-AI-010", "PAT-ARCH-007"],
    affectedProgramIds: ["CLAUDE-CODE-ROLLOUT"],
  },
  {
    id: "SIG-SRC-2026-003",
    title: "OpenAI frames enterprise AI as a company-wide agent operating layer",
    sourceType: "vendor_announcement",
    sourceName: "OpenAI",
    sourceUrl: "https://openai.com/index/next-phase-of-enterprise-ai/",
    summary:
      "OpenAI said enterprise now makes up more than 40 percent of its revenue and positioned Frontier as the layer for deploying and managing agents across business systems.",
    observedAt: "2026-04-08",
    ingestedAt: INGESTED_AT,
    confidence: 0.91,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-009", "PAT-AI-010", "PAT-ARCH-006"],
    affectedProgramIds: ["AI-CLOUD-SPEND-PRESSURE", "AI-PORTFOLIO-GOVERNANCE"],
  },
  {
    id: "SIG-SRC-2026-004",
    title: "Google expands Gemini creation workflows across Docs, Sheets, Slides, and Drive",
    sourceType: "vendor_announcement",
    sourceName: "Google Workspace Blog",
    sourceUrl:
      "https://blog.google/products-and-platforms/products/workspace/gemini-workspace-updates-march-2026/",
    summary:
      "Google rolled out Gemini features that can pull from files, email, and web context inside Workspace, signaling continued pressure on workplace productivity-agent adoption.",
    observedAt: "2026-03-10",
    ingestedAt: INGESTED_AT,
    confidence: 0.88,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-007", "PAT-AI-010"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-SRC-2025-005",
    title: "ServiceNow launches AI Agent Orchestrator and AI Agent Studio",
    sourceType: "vendor_announcement",
    sourceName: "ServiceNow Newsroom",
    sourceUrl:
      "https://newsroom.servicenow.com/press-releases/details/2025/ServiceNow-announces-new-agentic-AI-innovations-to-autonomously-solve-the-most-complex-enterprise-challenges-01-29-2025-traffic/default.aspx",
    summary:
      "ServiceNow introduced an AI agent control tower, orchestrator, and studio, with thousands of prebuilt agents for IT, customer service, HR, and adjacent workflows.",
    observedAt: "2025-01-29",
    ingestedAt: INGESTED_AT,
    confidence: 0.92,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-002", "PAT-AI-010", "PAT-AI-011"],
    affectedProgramIds: ["NOW-ASSIST-DEPLOYMENT"],
  },
  {
    id: "SIG-SRC-2025-006",
    title: "SAP expands Joule and developer AI in Q1 2025 release wave",
    sourceType: "vendor_announcement",
    sourceName: "SAP News Center",
    sourceUrl: "https://news.sap.com/2025/04/sap-business-ai-release-highlights-q1-2025/",
    summary:
      "SAP said Joule reached more solutions in Q1 2025, added 11-language support, and pushed AI deeper into developer, finance, procurement, and supply-chain workflows.",
    observedAt: "2025-04-07",
    ingestedAt: INGESTED_AT,
    confidence: 0.9,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-010", "PAT-AI-012", "PAT-AI-014"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-SRC-2025-007",
    title: "Salesforce launches Agentforce 3 with agent observability and control",
    sourceType: "vendor_announcement",
    sourceName: "Salesforce News",
    sourceUrl:
      "https://www.salesforce.com/news/press-releases/2025/06/23/agentforce-3-announcement/",
    summary:
      "Salesforce said Agentforce 3 was built on lessons from thousands of deployments and highlighted measurable results in case handling, autonomous resolution, and retention.",
    observedAt: "2025-06-23",
    ingestedAt: INGESTED_AT,
    confidence: 0.9,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-010", "PAT-AI-014", "PAT-ARCH-002"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-SRC-2025-008",
    title: "Amazon Q Developer begins validating generated code with builds and tests",
    sourceType: "vendor_announcement",
    sourceName: "AWS What's New",
    sourceUrl:
      "https://aws.amazon.com/about-aws/whats-new/2025/01/amazon-q-developer-agent-builds-tests-validate-generated-code-real-time/",
    summary:
      "AWS added build and test execution to the Amazon Q Developer agent, moving coding assistants further toward autonomous multi-file implementation loops.",
    observedAt: "2025-01-31",
    ingestedAt: INGESTED_AT,
    confidence: 0.9,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-006", "PAT-AI-010"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-SRC-2025-009",
    title: "Azure AI Foundry adds enterprise agent networking and multi-agent orchestration",
    sourceType: "vendor_announcement",
    sourceName: "Microsoft Azure Blog",
    sourceUrl:
      "https://azure.microsoft.com/en-us/blog/announcing-new-models-customization-tools-and-enterprise-agent-upgrades-in-azure-ai-foundry/",
    summary:
      "Microsoft added VNet isolation for agent traffic and Magma multi-agent orchestration in Azure AI Foundry, reinforcing secure enterprise deployment and cost-governed scaling.",
    observedAt: "2025-02-27",
    ingestedAt: INGESTED_AT,
    confidence: 0.91,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-009", "PAT-ARCH-006", "PAT-ARCH-007"],
    affectedProgramIds: ["AI-CLOUD-SPEND-PRESSURE"],
  },
  {
    id: "SIG-SRC-2025-010",
    title: "Apple opens on-device foundation model access to developers",
    sourceType: "vendor_announcement",
    sourceName: "Apple Newsroom",
    sourceUrl:
      "https://www.apple.com/newsroom/2025/06/apple-intelligence-gets-even-more-powerful-with-new-capabilities-across-apple-devices/",
    summary:
      "Apple opened the Foundation Models framework so developers can call Apple Intelligence locally, with offline operation and Private Cloud Compute positioning privacy as a deployment differentiator.",
    observedAt: "2025-06-09",
    ingestedAt: INGESTED_AT,
    confidence: 0.88,
    ttlDays: 60,
    affectedPatternIds: ["PAT-AI-007", "PAT-ARCH-006"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-REG-2025-001",
    title: "EU publishes the General-Purpose AI Code of Practice",
    sourceType: "regulatory",
    sourceName: "European Commission",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/general-purpose-ai-code-practice-now-available",
    summary:
      "The Commission published the voluntary GPAI Code of Practice and tied it directly to AI Act obligations that started applying to general-purpose AI models on August 2, 2025.",
    observedAt: "2025-07-10",
    ingestedAt: INGESTED_AT,
    confidence: 0.95,
    ttlDays: 365,
    affectedPatternIds: ["PAT-AI-002", "PAT-AI-004", "PAT-AI-005"],
    affectedProgramIds: ["AI-PORTFOLIO-GOVERNANCE", "SHADOW-AI-TO-SANCTIONED-MIGRATION"],
  },
  {
    id: "SIG-REG-2026-002",
    title: "NIST starts a critical infrastructure AI RMF profile",
    sourceType: "regulatory",
    sourceName: "NIST",
    sourceUrl:
      "https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure",
    summary:
      "NIST opened work on a critical-infrastructure profile for the AI RMF, signaling a stronger trust-and-governance baseline for high-consequence enterprise AI deployments.",
    observedAt: "2026-04-07",
    ingestedAt: INGESTED_AT,
    confidence: 0.93,
    ttlDays: 365,
    affectedPatternIds: ["PAT-AI-002", "PAT-ARCH-005", "PAT-ARCH-009"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-REG-2025-003",
    title: "SEC schedules a public AI roundtable for the financial industry",
    sourceType: "regulatory",
    sourceName: "U.S. Securities and Exchange Commission",
    sourceUrl: "https://www.sec.gov/newsroom/press-releases/2025-48",
    summary:
      "The SEC announced a March 2025 roundtable on AI risks, benefits, and governance in financial services, reinforcing board-level scrutiny on AI claims and controls.",
    observedAt: "2025-02-28",
    ingestedAt: INGESTED_AT,
    confidence: 0.91,
    ttlDays: 180,
    affectedPatternIds: ["PAT-AI-002", "PAT-AI-010"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-REG-2025-004",
    title: "FDA issues draft lifecycle guidance for AI-enabled device software",
    sourceType: "regulatory",
    sourceName: "U.S. Food and Drug Administration",
    sourceUrl:
      "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/artificial-intelligence-enabled-device-software-functions-lifecycle-management-and-marketing",
    summary:
      "FDA published draft lifecycle and submission recommendations for AI-enabled device software functions, tightening expectations for documentation, validation, and ongoing change management.",
    observedAt: "2025-01-06",
    ingestedAt: INGESTED_AT,
    confidence: 0.94,
    ttlDays: 365,
    affectedPatternIds: ["PAT-AI-002", "PAT-IND-HC-001", "PAT-IND-HC-002"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-REG-2026-005",
    title: "CFPB formalizes an AI governance posture and compliance plan",
    sourceType: "regulatory",
    sourceName: "Consumer Financial Protection Bureau",
    sourceUrl: "https://www.consumerfinance.gov/ai/",
    summary:
      "CFPB designated a Chief AI Officer, published an AI compliance plan under OMB M-25-21, and stated it had no reportable AI use cases as of January 2026.",
    observedAt: "2026-01-28",
    ingestedAt: INGESTED_AT,
    confidence: 0.89,
    ttlDays: 180,
    affectedPatternIds: ["PAT-AI-002", "PAT-AI-005"],
    affectedProgramIds: ["SHADOW-AI-TO-SANCTIONED-MIGRATION"],
  },
  {
    id: "SIG-MAN-2025-001",
    title: "Anthropic Economic Index shows coding as a leading Claude workload",
    sourceType: "manual_curated",
    sourceName: "Anthropic Economic Index",
    sourceUrl: "https://www.anthropic.com/research/impact-software-development",
    summary:
      "Anthropic reported that software-development use is disproportionately high in Claude traffic, with startup work leading enterprise work in Claude Code adoption.",
    observedAt: "2025-04-28",
    ingestedAt: INGESTED_AT,
    confidence: 0.86,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-006", "PAT-AI-010", "PAT-AI-013"],
    affectedProgramIds: ["CLAUDE-CODE-ROLLOUT"],
  },
  {
    id: "SIG-MAN-2025-002",
    title: "Anthropic says Claude Code reached a $1B run-rate milestone",
    sourceType: "manual_curated",
    sourceName: "Anthropic",
    sourceUrl:
      "https://www.anthropic.com/news/anthropic-acquires-bun-as-claude-code-reaches-usd1b-milestone",
    summary:
      "Anthropic said Claude Code reached a $1 billion run-rate milestone six months after becoming generally available, reinforcing fast enterprise willingness to pay for coding agents.",
    observedAt: "2025-12-03",
    ingestedAt: INGESTED_AT,
    confidence: 0.84,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-006", "PAT-AI-013", "PAT-AI-014"],
    affectedProgramIds: ["CLAUDE-CODE-ROLLOUT"],
  },
  {
    id: "SIG-MAN-2025-003",
    title: "OpenAI publishes its 2025 state-of-enterprise-AI report",
    sourceType: "manual_curated",
    sourceName: "OpenAI",
    sourceUrl:
      "https://openai.com/business/guides-and-resources/the-state-of-enterprise-ai-2025-report/",
    summary:
      "OpenAI paired case studies with a BCG reference showing AI leaders outperforming on revenue, shareholder return, margin, and employee-satisfaction measures.",
    observedAt: "2025-12-17",
    ingestedAt: INGESTED_AT,
    confidence: 0.83,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-010", "PAT-AI-014", "PAT-ARCH-006"],
    affectedProgramIds: ["AI-PORTFOLIO-GOVERNANCE"],
  },
  {
    id: "SIG-MAN-2025-004",
    title: "Gartner places OpenAI in the 2025 Emerging Leaders quadrant",
    sourceType: "analyst",
    sourceName: "OpenAI referencing Gartner",
    sourceUrl: "https://openai.com/index/gartner-2025-emerging-leader/",
    summary:
      "OpenAI cited the November 13, 2025 Gartner Innovation Guide and framed the result as evidence that AI is becoming core enterprise infrastructure rather than an experiment.",
    observedAt: "2025-11-13",
    ingestedAt: INGESTED_AT,
    confidence: 0.8,
    ttlDays: 180,
    affectedPatternIds: ["PAT-AI-002", "PAT-AI-014", "PAT-ARCH-006"],
    affectedProgramIds: ["AI-PORTFOLIO-GOVERNANCE"],
  },
  {
    id: "SIG-MAN-2025-005",
    title: "Microsoft says the market has entered the era of AI agents",
    sourceType: "manual_curated",
    sourceName: "Microsoft Corporate Blog",
    sourceUrl:
      "https://blogs.microsoft.com/blog/2025/05/19/microsoft-build-2025-the-age-of-ai-agents-and-building-the-open-agentic-web/",
    summary:
      "Microsoft said 15 million developers already use GitHub Copilot and more than 230,000 organizations have used Copilot Studio to build agents and automations.",
    observedAt: "2025-05-19",
    ingestedAt: INGESTED_AT,
    confidence: 0.87,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-007", "PAT-AI-014", "PAT-ARCH-007"],
    affectedProgramIds: ["M365-COPILOT-ROLLOUT"],
  },
  {
    id: "SIG-MAN-2025-006",
    title: "Microsoft extends Copilot and agent adoption into U.S. government",
    sourceType: "manual_curated",
    sourceName: "Microsoft Corporate Blog",
    sourceUrl:
      "https://blogs.microsoft.com/blog/2025/09/02/accelerating-ai-adoption-for-the-us-government/",
    summary:
      "Microsoft and the U.S. GSA announced a program to provide Microsoft 365 Copilot at no cost for up to 12 months to millions of G5 users and highlighted agent use in public services.",
    observedAt: "2025-09-02",
    ingestedAt: INGESTED_AT,
    confidence: 0.82,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-002", "PAT-AI-007", "PAT-AI-014"],
    affectedProgramIds: ["M365-COPILOT-ROLLOUT"],
  },
  {
    id: "SIG-MAN-2025-007",
    title: "ServiceNow repositions its platform around any AI, any agent, any model",
    sourceType: "manual_curated",
    sourceName: "ServiceNow Newsroom",
    sourceUrl:
      "https://newsroom.servicenow.com/press-releases/details/2025/ServiceNow-Unveils-the-New-ServiceNow-AI-Platform-to-Put-Any-AI-Any-Agent-Any-Model-to-Work-Across-the-Enterprise/default.aspx",
    summary:
      "At Knowledge 2025, ServiceNow said its AI Platform would unify data, intelligence, and orchestration across workflows and partners such as Microsoft, NVIDIA, Google, and Oracle.",
    observedAt: "2025-05-06",
    ingestedAt: INGESTED_AT,
    confidence: 0.85,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-002", "PAT-AI-011", "PAT-ARCH-002"],
    affectedProgramIds: ["NOW-ASSIST-DEPLOYMENT"],
  },
  {
    id: "SIG-MAN-2026-008",
    title: "ServiceNow reports Fiserv will scale Now Assist in operations and ITSM",
    sourceType: "manual_curated",
    sourceName: "ServiceNow Newsroom",
    sourceUrl:
      "https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-Reports-Fourth-Quarter-and-Full-Year-2025-Financial-Results-Board-of-Directors-Authorizes-Additional-5B-for-Share-Repurchase-Program/default.aspx",
    summary:
      "ServiceNow said Fiserv would scale Now Assist for Financial Services Operations and ITSM, a concrete deployment signal that AI is moving from pilot features into core operating workflows.",
    observedAt: "2026-01-28",
    ingestedAt: INGESTED_AT,
    confidence: 0.81,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-010", "PAT-AI-011", "PAT-AI-014"],
    affectedProgramIds: ["NOW-ASSIST-DEPLOYMENT"],
  },
  {
    id: "SIG-MAN-2025-009",
    title: "SAP says Joule and partner agents can lift productivity by up to 30 percent",
    sourceType: "manual_curated",
    sourceName: "SAP News Center",
    sourceUrl: "https://news.sap.com/2025/05/sap-business-ai-reimagine-how-enterprises-run/",
    summary:
      "At Sapphire 2025, SAP said expanded Joule coverage and interoperable agent ecosystems could drive productivity gains of up to 30 percent across enterprise processes.",
    observedAt: "2025-05-20",
    ingestedAt: INGESTED_AT,
    confidence: 0.83,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-010", "PAT-AI-012", "PAT-AI-014"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-MAN-2025-010",
    title: "SAP publishes a growing catalog of more than 240 AI use cases",
    sourceType: "manual_curated",
    sourceName: "SAP News Center",
    sourceUrl: "https://news.sap.com/2025/08/sap-ai-use-cases-business-value/",
    summary:
      "SAP said its Discovery Center AI catalog had grown to more than 240 use cases, reinforcing that ERP-agent deployment depth is becoming a portfolio-management problem, not a single-tool decision.",
    observedAt: "2025-08-13",
    ingestedAt: INGESTED_AT,
    confidence: 0.8,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-010", "PAT-AI-012"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-MAN-2025-011",
    title: "Salesforce HR reports a 96 percent self-service resolution rate with Agentforce",
    sourceType: "manual_curated",
    sourceName: "Salesforce News",
    sourceUrl:
      "https://www.salesforce.com/news/stories/agentforce-hr-service-announcement/",
    summary:
      "Salesforce said its own HR team resolved 96 percent of employee inquiries through self-service with Agentforce HR Service and the Employee Portal.",
    observedAt: "2025-05-06",
    ingestedAt: INGESTED_AT,
    confidence: 0.84,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-010", "PAT-AI-011"],
    affectedProgramIds: ["NOW-ASSIST-DEPLOYMENT"],
  },
  {
    id: "SIG-MAN-2025-012",
    title: "Salesforce targets retail operations with prebuilt Agentforce skills",
    sourceType: "manual_curated",
    sourceName: "Salesforce News",
    sourceUrl:
      "https://www.salesforce.com/news/press-releases/2025/01/10/agentforce-retail-cloud-pos-announcement/",
    summary:
      "Salesforce launched Agentforce for Retail with order-management, guided-shopping, appointment, and loyalty skills, tying agent rollout directly to owned-brand and store-margin operations.",
    observedAt: "2025-01-10",
    ingestedAt: INGESTED_AT,
    confidence: 0.81,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-010", "PAT-IND-RET-001", "PAT-IND-RET-002"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-MAN-2025-013",
    title: "Amazon Q Developer starts surfacing cost-optimization recommendations",
    sourceType: "manual_curated",
    sourceName: "AWS What's New",
    sourceUrl:
      "https://aws.amazon.com/about-aws/whats-new/2025/06/amazon-q-developer-optimize-aws-costs/",
    summary:
      "AWS made Q Developer a conversational surface for rightsizing, Reserved Instances, idle-resource cleanup, and savings-plan advice, pushing AI from coding help into cloud-spend operations.",
    observedAt: "2025-06-03",
    ingestedAt: INGESTED_AT,
    confidence: 0.85,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-009", "PAT-AI-010"],
    affectedProgramIds: ["AI-CLOUD-SPEND-PRESSURE"],
  },
  {
    id: "SIG-MAN-2025-014",
    title: "Apple ties AI rollout to a large domestic infrastructure commitment",
    sourceType: "manual_curated",
    sourceName: "Apple Newsroom",
    sourceUrl:
      "https://www.apple.com/newsroom/2025/02/apple-will-spend-more-than-500-billion-usd-in-the-us-over-the-next-four-years/",
    summary:
      "Apple said its $500 billion U.S. investment plan includes Apple Intelligence infrastructure and data centers, indicating that inference distribution and private-cloud capacity are now strategic spend categories.",
    observedAt: "2025-02-24",
    ingestedAt: INGESTED_AT,
    confidence: 0.77,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-007", "PAT-ARCH-006"],
    affectedProgramIds: [],
  },
  {
    id: "SIG-MAN-2025-015",
    title: "Amazon Q Developer expands multi-language support for global operations",
    sourceType: "manual_curated",
    sourceName: "AWS What's New",
    sourceUrl:
      "https://aws.amazon.com/about-aws/whats-new/2025/07/q-developer-multi-language-support",
    summary:
      "AWS expanded Amazon Q Developer language support across console and chat surfaces, reducing one common adoption barrier for globally distributed engineering and operations teams.",
    observedAt: "2025-07-31",
    ingestedAt: INGESTED_AT,
    confidence: 0.79,
    ttlDays: 120,
    affectedPatternIds: ["PAT-AI-006", "PAT-AI-013"],
    affectedProgramIds: [],
  },
];

export const MANUAL_SIGNAL_COUNT = MANUAL_SIGNALS.length;
export const MANUAL_SIGNAL_IDS = MANUAL_SIGNALS.map((signal) => signal.id);

export default MANUAL_SIGNALS;
