// pilot-data-loader-exception: global-static-corpus
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Airline genome patterns - Digital Transformation & AI/ML Governance
// Code range: A5100-A5399
// Run: npx tsx src/scripts/seed/seed-airline-dom17-digital-ai.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface AirlineDigitalAiPatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
}

export const AIRLINE_DIGITAL_AI_PATTERNS: AirlineDigitalAiPatternSeed[] = [
  {
    code: 'A5100',
    name: 'AI Portfolio Lacks Operational Risk Tiering',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      'Airline AI initiatives are prioritized by ROI and sponsor enthusiasm without tiering by safety, regulatory, customer, and day-of-travel operational risk. A chatbot, pricing model, crew tool, and maintenance model enter the same governance path even though failure blast radius differs materially.',
    keywords: ['AI portfolio', 'risk tiering', 'SMS', 'day-of-travel', 'governance'],
    demoRelevant: true,
  },
  {
    code: 'A5101',
    name: 'GenAI Assistant Answers From Unapproved Operations Manuals',
    officeCategory: 'front_office',
    failureRatePct: 62,
    description:
      'A generative AI assistant retrieves old station playbooks, draft SOPs, and superseded service-recovery policies because the knowledge base lacks approval-state filtering. Frontline staff receive confident guidance that conflicts with the currently approved operating procedure.',
    keywords: ['GenAI assistant', 'SOP', 'knowledge grounding', 'approval state', 'frontline operations'],
    demoRelevant: true,
  },
  {
    code: 'A5102',
    name: 'AI Model Inventory Excludes Vendor-Embedded Models',
    officeCategory: 'back_office',
    failureRatePct: 64,
    description:
      'The AI inventory captures internally built models but misses vendor-embedded AI in PSS, revenue management, fraud, workforce, and customer-service tools. Risk leaders believe the model estate is small while procurement has introduced a shadow fleet of decisioning models.',
    keywords: ['AI inventory', 'vendor AI', 'model risk', 'procurement', 'shadow AI'],
    demoRelevant: true,
  },
  {
    code: 'A5103',
    name: 'AI Use Case Approved Without Data Readiness Gate',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      'AI use cases are approved before source-system ownership, refresh cadence, lineage, and quality thresholds are verified. Teams fund model work first and discover later that PSS, DCS, loyalty, or maintenance data cannot support the promised decision.',
    keywords: ['AI use case', 'data readiness', 'PSS', 'lineage', 'approval gate'],
    demoRelevant: true,
  },
  {
    code: 'A5104',
    name: 'Customer GenAI Escalation Loses Conversation Context',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      'A customer GenAI assistant escalates complex rebooking or refund cases to human agents without passing the full conversation, intent, and attempted actions. The customer repeats the story, agent handle time rises, and the AI channel is blamed even when the core gap is handoff design.',
    keywords: ['customer GenAI', 'escalation', 'conversation context', 'AHT', 'handoff'],
    demoRelevant: true,
  },
  {
    code: 'A5105',
    name: 'AI Governance Board Reviews Policies Not Deployments',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'The AI governance board approves principles, standards, and intake templates but does not review live model behavior, adoption telemetry, drift, override rates, and incident evidence. Governance looks mature on paper while production AI risk accumulates silently.',
    keywords: ['AI governance', 'model drift', 'adoption telemetry', 'override rate', 'incident evidence'],
    demoRelevant: true,
  },
  {
    code: 'A5106',
    name: 'AI Vendor Contract Missing Model Change Notice',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'A vendor AI product can change model behavior, prompt templates, or ranking logic without advance notice, validation evidence, or rollback rights. Source teams buy a capability but not the operational control needed when the model changes after go-live.',
    keywords: ['AI vendor', 'model change notice', 'rollback right', 'Source', 'validation evidence'],
    demoRelevant: true,
  },
  {
    code: 'A5107',
    name: 'AI Pilot Success Measured Without Adoption Denominator',
    officeCategory: 'middle_office',
    failureRatePct: 57,
    description:
      'AI pilots report accuracy, revenue uplift, or time saved among users who tried the tool, but exclude the eligible population that ignored it. Moves teams scale a pilot that worked for enthusiasts but never crossed the adoption threshold needed for enterprise value.',
    keywords: ['AI pilot', 'adoption denominator', 'Moves', 'value realization', 'scale decision'],
    demoRelevant: true,
  },
  {
    code: 'A5108',
    name: 'Operational AI Lacks Human Override Evidence',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      'Operational AI allows human override but does not capture who overrode, why, what data they saw, and whether the override improved outcome. The airline cannot learn when the model was wrong or defend decisions when regulators, customers, or unions challenge them.',
    keywords: ['operational AI', 'human override', 'audit evidence', 'model learning', 'governance'],
    demoRelevant: true,
  },
  {
    code: 'A5109',
    name: 'AI SDLC Productivity Booked Before Quality Holds',
    officeCategory: 'back_office',
    failureRatePct: 63,
    description:
      'Engineering teams book AI code-assistant productivity after measuring faster story completion but before escaped defects, review burden, and rework stabilize. The CIO sees delivery acceleration while operations absorbs reliability debt.',
    keywords: ['AI SDLC', 'code assistant', 'escaped defect', 'review burden', 'DORA'],
    demoRelevant: true,
  },
  {
    code: 'A5110',
    name: 'AI Safety Classification Not Embedded In Intake',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'AI intake forms ask about business value and data sources but not whether the model can influence safety, security, pricing, eligibility, or regulated customer treatment. High-risk use cases enter low-risk delivery lanes until legal or safety review catches them late.',
    keywords: ['AI intake', 'risk classification', 'safety', 'pricing', 'regulated treatment'],
    demoRelevant: true,
  },
  {
    code: 'A5111',
    name: 'Digital Twin AI Validated On Normal Operations Only',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      'A network digital twin performs well on normal operating days but is not validated on weather, ATC, crew, maintenance, and airport-capacity disruption scenarios. The model supports planning meetings but fails the exact IROPS conditions where executives need it most.',
    keywords: ['digital twin AI', 'IROPS', 'scenario validation', 'network planning', 'model testing'],
    demoRelevant: true,
  },
  {
    code: 'A5112',
    name: 'AI Procurement Skips Data Usage Boundary',
    officeCategory: 'back_office',
    failureRatePct: 58,
    description:
      'Source teams evaluate AI vendors on features and price but do not define whether tenant data can be used for model training, benchmarking, or cross-customer improvement. The contract creates future data-use ambiguity just as the tool becomes embedded in operations.',
    keywords: ['AI procurement', 'data usage', 'model training', 'Source', 'contract clause'],
    demoRelevant: true,
  },
  {
    code: 'A5113',
    name: 'AI Explainability Report Not Written For Operators',
    officeCategory: 'middle_office',
    failureRatePct: 53,
    description:
      'Explainability artifacts satisfy data scientists and governance reviewers but do not tell dispatchers, agents, analysts, or supervisors what changed the recommendation and what to do when they disagree. The model is technically explainable and operationally opaque.',
    keywords: ['AI explainability', 'operator workflow', 'model recommendation', 'human override', 'adoption'],
    demoRelevant: true,
  },
  {
    code: 'A5114',
    name: 'AI Incident Response Missing Model Rollback Playbook',
    officeCategory: 'back_office',
    failureRatePct: 60,
    description:
      'Incident response playbooks cover infrastructure and application outages but not model rollback, prompt rollback, feature rollback, or vendor model freeze. When an AI decision path misbehaves, teams improvise while the model continues influencing operations.',
    keywords: ['AI incident response', 'model rollback', 'prompt rollback', 'vendor freeze', 'playbook'],
    demoRelevant: true,
  },
  {
    code: 'A5115',
    name: 'Personalization AI Uses Unapproved Sensitive Signals',
    officeCategory: 'front_office',
    failureRatePct: 56,
    description:
      'Digital personalization AI uses inferred family status, disability services, disruption history, or complaint patterns without approval for that purpose. Customer experience becomes more targeted while privacy, fairness, and reputational risk increase.',
    keywords: ['personalization AI', 'sensitive signal', 'privacy', 'fairness', 'customer experience'],
    demoRelevant: true,
  },
  {
    code: 'A5116',
    name: 'AI Value Dashboard Counts Activity Not Outcomes',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'AI dashboards count prompts, active users, models launched, and documents generated rather than revenue, cycle time, risk reduction, or adoption quality. Executives see momentum without knowing whether AI changed decisions or outcomes.',
    keywords: ['AI value dashboard', 'outcomes', 'adoption quality', 'Moves', 'value realization'],
    demoRelevant: true,
  },
  {
    code: 'A5117',
    name: 'AI Feature Store Reuses Uncertified Operational Data',
    officeCategory: 'back_office',
    failureRatePct: 57,
    description:
      'Feature stores make operational data reusable but do not certify which features are safe for pricing, safety, workforce, or customer-treatment models. Teams reuse convenient features and accidentally move low-quality or restricted data into high-risk decisions.',
    keywords: ['feature store', 'operational data', 'model governance', 'pricing', 'safety'],
    demoRelevant: true,
  },
  {
    code: 'A5118',
    name: 'AI Steering Committee Lacks Business Kill Criteria',
    officeCategory: 'middle_office',
    failureRatePct: 52,
    description:
      'AI steering committees approve funding but do not define kill criteria such as adoption floor, override ceiling, safety incident threshold, or value evidence deadline. Weak initiatives continue because no one agreed upfront what failure looks like.',
    keywords: ['AI steering committee', 'kill criteria', 'adoption floor', 'Moves', 'value evidence'],
    demoRelevant: true,
  },
  {
    code: 'A5119',
    name: 'AI Training Data Captures Historical Service Inequity',
    officeCategory: 'middle_office',
    failureRatePct: 55,
    description:
      'AI models trained on historical service recovery or disruption decisions learn past inequities in who received vouchers, proactive support, or premium reaccommodation. The model automates the old pattern and makes it harder to spot fairness drift.',
    keywords: ['AI fairness', 'training data', 'service recovery', 'fairness drift', 'customer treatment'],
    demoRelevant: true,
  },
  {
    code: 'A5120',
    name: 'Digital Roadmap Separates AI From Core Modernization',
    officeCategory: 'back_office',
    failureRatePct: 59,
    description:
      'AI initiatives are funded as a digital layer while the PSS, data, integration, and workflow modernization needed for AI quality remains underfunded. The airline buys visible AI experiences before fixing the systems that determine whether those experiences can act.',
    keywords: ['AI roadmap', 'core modernization', 'PSS', 'data platform', 'dependency'],
    demoRelevant: true,
  },
  {
    code: 'A5121',
    name: 'GenAI Knowledge Base Missing Source Freshness Rules',
    officeCategory: 'back_office',
    failureRatePct: 50,
    description:
      'A GenAI knowledge base retrieves route, fare, station, and policy content without freshness rules by content type. Agents receive old but plausible answers, and the organization learns not to trust the assistant for live operational questions.',
    keywords: ['GenAI knowledge base', 'freshness rule', 'RAG', 'policy content', 'trust'],
    demoRelevant: true,
  },
  {
    code: 'A5122',
    name: 'AI Tool Sprawl Duplicates Governance Burden',
    officeCategory: 'back_office',
    failureRatePct: 53,
    description:
      'Different teams procure copilots, chatbots, forecasting tools, optimization models, and analytics assistants with separate controls and vendor terms. The governance burden grows faster than AI value, and no one has a single view of operational exposure.',
    keywords: ['AI tool sprawl', 'vendor governance', 'copilot', 'model inventory', 'operational exposure'],
    demoRelevant: true,
  },
  {
    code: 'A5123',
    name: 'AI Model Monitoring Stops At Technical Drift',
    officeCategory: 'middle_office',
    failureRatePct: 54,
    description:
      'Model monitoring checks feature drift and prediction drift but not business drift such as customer complaints, manual overrides, union grievances, or regulatory inquiries. The model appears technically stable while business trust erodes.',
    keywords: ['model monitoring', 'business drift', 'manual override', 'regulatory inquiry', 'AI governance'],
    demoRelevant: true,
  },
  {
    code: 'A5124',
    name: 'AI Assistant Cannot Execute Protected Actions',
    officeCategory: 'front_office',
    failureRatePct: 57,
    description:
      'An AI assistant can explain rebooking, refunds, vouchers, and upgrades but cannot execute protected actions because authority was never delegated safely. Customers perceive the assistant as unhelpful, and human agents inherit longer escalations.',
    keywords: ['AI assistant', 'protected action', 'rebooking', 'voucher', 'delegated authority'],
    demoRelevant: true,
  },
  {
    code: 'A5125',
    name: 'AI Business Case Omits Human Review Capacity',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      'AI business cases assume automation replaces manual work but omit the reviewer, exception, appeal, and quality-assurance capacity needed after launch. The program scales volume faster than the human control layer can absorb.',
    keywords: ['AI business case', 'human review', 'exception management', 'quality assurance', 'Moves'],
    demoRelevant: true,
  },
  {
    code: 'A5126',
    name: 'AI Governance Excludes Labor And Customer Commitments',
    officeCategory: 'middle_office',
    failureRatePct: 51,
    description:
      'AI governance reviews data, model, and security risk but not labor commitments, customer promises, and commercial contracts affected by the AI workflow. The model is approved in isolation and later blocked by stakeholders whose obligations were never mapped.',
    keywords: ['AI governance', 'labor agreement', 'customer promise', 'commercial contract', 'stakeholder map'],
    demoRelevant: true,
  },
  {
    code: 'A5127',
    name: 'AI Procurement Scores Accuracy Without Workflow Fit',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      'RFP scoring weights model accuracy and demo quality but not workflow authority, exception handling, audit evidence, and integration with PSS or operational tools. Source selects the best model demo rather than the vendor most likely to work in production.',
    keywords: ['AI procurement', 'RFP scoring', 'workflow fit', 'Source', 'PSS integration'],
    demoRelevant: true,
  },
  {
    code: 'A5128',
    name: 'AI Decision Ledger Missing Rejected Recommendations',
    officeCategory: 'middle_office',
    failureRatePct: 49,
    description:
      'Decision logs store accepted AI recommendations but not rejected recommendations and the human rationale for rejection. Learning loops become biased toward accepted cases, and governance cannot see where experts consistently disagree with the model.',
    keywords: ['AI decision ledger', 'rejected recommendation', 'human rationale', 'learning loop', 'governance'],
    demoRelevant: true,
  },
  {
    code: 'A5129',
    name: 'AI Roadmap Lacks Tenant Data Boundary',
    officeCategory: 'back_office',
    failureRatePct: 52,
    description:
      'Enterprise AI platforms are designed for broad reuse without explicit tenant, partner, alliance, and joint-venture data boundaries. A model trained or retrieved across the wrong boundary can leak commercial, passenger, or operational context.',
    keywords: ['AI roadmap', 'data boundary', 'tenant isolation', 'partner data', 'privacy'],
    demoRelevant: true,
  },
];
