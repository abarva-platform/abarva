import type { PatternSeed } from './seed-types';

const INDUSTRY_COMMON = {
  domain: 'industry_specific',
  tier: 'validated',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.8,
  createdFrom: 'human_authored',
  createdBy: 'founder',
  createdAt: '2026-04-28',
  regulatoryChips: [],
  taggedContradictionIds: [],
} satisfies Omit<
  PatternSeed,
  | 'id'
  | 'slug'
  | 'title'
  | 'vertical'
  | 'thesis'
  | 'applicability'
  | 'instanceCount'
  | 'sourceDocuments'
  | 'relatedPatternIds'
  | 'derivedFromPatternIds'
  | 'body'
>;

export const INDUSTRY_PATTERNS: PatternSeed[] = [
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-HC-001',
    slug: 'ambient-clinical-value-chain',
    title: 'Ambient Intelligence & Clinical Value Chain Automation',
    vertical: 'healthcare',
    thesis:
      'Ambient listening compounds far beyond note creation when encounter signal is integrated into coding, quality, care-gap closure, value-based care, and revenue integrity workflows instead of being treated as a documentation-only product.',
    applicability:
      'Applies to health systems, IDNs, physician groups, and value-based care organizations deploying ambient clinical AI where clinical, coding, quality, and revenue stakeholders all touch the same encounter signal.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/06-ambient-clinical-value-chain.md'],
    relatedPatternIds: ['PAT-IND-HC-002'],
    derivedFromPatternIds: ['PAT-IND-HC-002'],
    body: `## Summary
Ambient clinical AI is a value-chain pattern, not a scribe point solution. The source argues that documentation burden relief is only the first layer, while the larger economics sit in HCC capture, HEDIS and Stars quality evidence, care-gap closure, medication and referral workflows, SDOH capture, and revenue integrity.

## When to apply
Use this pattern when ambient tools are already deployed or being evaluated across provider workflows and leadership expects meaningful clinical or financial return beyond physician wellness alone. It is strongest in organizations with Medicare Advantage, ACO, MSSP, or other risk-bearing economics.

## How it works
The pattern starts with ambient capture of the full encounter, then routes that signal into CDI, coding, quality, population health, and revenue-cycle workflows. Real value appears only when the health system changes operating models and downstream integrations instead of leaving the signal trapped inside an encounter note.

## Variations
The source is explicit that deployment can stay narrow around documentation, or expand into the full value chain. Specialty, MA mix, quality programs, and population-health maturity all change where the biggest return shows up first.

## Pitfalls
The dominant failure mode is documentation-only scope. Other recurring misses are CDI isolation, flat HCC and quality performance after rollout, ROI decks framed only around hours saved, and leadership vendor-shopping for more value without changing the architecture.

## Instances
Concrete instances in the source are the eight named detection signals and the clinical value-chain components spanning documentation, HCC coding, quality measures, care-gap closure, value-based care performance, and revenue integrity.`,
  },
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-HC-002',
    slug: 'prior-authorization-automation',
    title: 'Prior Authorization Automation',
    vertical: 'healthcare',
    thesis:
      'Prior authorization only modernizes durably when AI is integrated into the underlying clinical workflow and evidence chain, not when it is applied as isolated workflow automation on top of a pre-AI transaction path.',
    applicability:
      'Applies to provider, payer, and integrated prior authorization operations facing cycle-time delays, reviewer strain, CMS interoperability pressure, or high appeal-overturn rates.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/07-prior-authorization-automation.md'],
    relatedPatternIds: ['PAT-IND-HC-001'],
    derivedFromPatternIds: ['PAT-IND-HC-001'],
    body: `## Summary
This pattern reframes prior authorization from administrative routing into a clinical workflow transformation problem. The source ties cycle-time compression, lower reviewer burden, and better member experience to ambient-enabled evidence capture, payer-side review automation, and integrated provider-payer workflow redesign.

## When to apply
Use this pattern when prior auth decision times are measured in days, provider burden is material, appeals overturn initial decisions at high rates, or CMS-0057-F compliance pressure is converging with modernization demand.

## How it works
Provider-side AI uses better clinical documentation and ambient signal to assemble requests and supporting evidence. Payer-side AI accelerates criteria review, triages obvious approvals, and focuses human reviewers on exceptions. Durable value comes when those layers are joined by clinical workflow redesign instead of deployed as form-fill shortcuts.

## Variations
The source distinguishes provider-side, payer-side, and integrated approaches, as well as rule-driven trust programs like gold carding. Payer variance, specialty mix, and CMS-rule timing all change where adoption starts.

## Pitfalls
The most common miss is transactional automation without clinical integration. The source also flags low ePA penetration, missing gold-card mechanisms, reviewer-capacity bottlenecks, and a failure to link ambient or EHR documentation improvements back into authorization quality.

## Instances
Concrete instances in the source are the eight detection signals, including cycle-time excess, high appeal overturn, reviewer strain, CMS compliance gaps, and low electronic prior-authorization penetration.`,
  },
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-RET-001',
    slug: 'owned-brand-margin-recovery',
    title: 'Owned Brand Margin Recovery',
    vertical: 'retail',
    thesis:
      'Owned brand is a structural margin and differentiation lever that only compounds when SKU rationalization, sourcing, pricing, assortment, and NPD are run as an integrated analytics-backed program rather than as a lightly staffed line extension.',
    applicability:
      'Applies to grocery, mass, and specialty retailers with meaningful private-label exposure, penetration gaps versus peers, underpowered analytics, or static pricing and sourcing practices.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/08-owned-brand-margin-recovery.md'],
    relatedPatternIds: ['PAT-IND-RET-002'],
    derivedFromPatternIds: ['PAT-IND-RET-002'],
    body: `## Summary
The source frames owned brand as the most underexploited margin-recovery opportunity in traditional retail. AI matters because it turns owned brand from a merchandising intuition play into an integrated operating program spanning SKU-level economics, supplier leverage, elasticity-aware pricing, trend detection, and launch acceleration.

## When to apply
Use this pattern when owned-brand penetration trails peers, margin dollars are flat, velocity is concentrated in a small subset of SKUs, pricing still follows fixed discounts to national brands, or category teams cannot produce same-day SKU-level P&L views.

## How it works
The integrated program starts with executive elevation of owned brand, then moves through SKU rationalization, cost-of-goods intelligence, assortment and pricing optimization, NPD acceleration, and stronger analytics support. The goal is to redirect shelf, spend, and talent toward the SKUs and categories where private label can widen margin and differentiation together.

## Variations
The pattern plays differently across grocery, mass, and specialty retail depending on assortment breadth, supplier structure, and consumer quality perception. Some retailers start with penetration recovery, while others start with pricing or sourcing because penetration is already mature.

## Pitfalls
The source warns against treating owned brand as an afterthought, relying on inherited national-brand pricing logic, leaving sourcing relationships static for years, and accepting low analytics coverage that forces category leaders to decide without SKU-level economics.

## Instances
Concrete instances in the source are the eight detection signals covering penetration gaps, margin-flatline, SKU velocity skew, sourcing stasis, static pricing, low NPD velocity, weak analytics support, and missing SKU-level P&L.`,
  },
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-RET-002',
    slug: 'demand-forecasting-inventory-ai',
    title: 'Demand Forecasting & Inventory AI',
    vertical: 'retail',
    thesis:
      'Retail forecast modernization pays off when probabilistic, hierarchical, causal forecasting is paired with planner-operating-model redesign and downstream consumption governance rather than dropped into a legacy override culture.',
    applicability:
      'Applies to retail planning and supply-chain environments where inventory days are growing, in-stocks and overstocks coexist, planners override models heavily, and promotional or new-product demand is still handled by heuristics.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/09-demand-forecasting-inventory-ai.md'],
    relatedPatternIds: ['PAT-IND-RET-001'],
    derivedFromPatternIds: ['PAT-IND-RET-001'],
    body: `## Summary
This pattern treats the forecast as the most leveraged number in retail operations. The source ties working capital, in-stock performance, markdowns, waste, and vendor planning back to whether the retailer has moved from category-level moving averages and planner overrides toward probabilistic, causal, hierarchical demand intelligence.

## When to apply
Use this pattern when SKU-store accuracy is plateaued, safety stock keeps rising, promotional lift is adjusted manually, new product forecasts depend on planner analogy, or fresh categories are accepting waste as unavoidable.

## How it works
The modernization program spans platform choice, causal feature libraries, probabilistic and hierarchical forecasting, promotional lift modeling, new-product forecasting, planner-role redesign, fresh optimization, and governance over how downstream replenishment, allocation, labor, and finance consume the demand signal.

## Variations
Subsector matters. Grocery and fresh require tighter shrink and perishability handling, while mass and specialty lean harder into promotions, assortment, and omnichannel substitution. The same pattern can be delivered on modern platforms or custom ML stacks when data and workflow discipline exist.

## Pitfalls
The source repeatedly calls out category-level accuracy theater, unguided planner overrides, safety-stock inflation as a substitute for model quality, disconnected promotional planning, and treating forecast fragmentation across functions as normal.

## Instances
Concrete instances in the source are the eight named trigger signals, from forecast-accuracy plateau through fresh-category waste and event/weather insensitivity.`,
  },
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-FIN-001',
    slug: 'fraud-detection-modernization',
    title: 'Fraud Detection Modernization',
    vertical: 'financial_services',
    thesis:
      'Fraud modernization succeeds when graph, sequence, biometric, consortium, and real-time decisioning capabilities are paired with unified investigator workflows and model-risk discipline instead of stacked on top of rule-engine silos.',
    applicability:
      'Applies to banks, payments, insurers, fintechs, and retail-finance operations dealing with elevated false positives, siloed fraud teams, weak network intelligence, or real-time rail exposure.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/10-fraud-detection-modernization.md'],
    relatedPatternIds: ['PAT-IND-FIN-002'],
    derivedFromPatternIds: ['PAT-IND-FIN-002'],
    body: `## Summary
The source treats fraud as a network, speed, and context problem that legacy rule stacks cannot manage alone. Modern fraud defense requires graph intelligence for rings and mules, sequence models for behavior, biometric and device signals, low-latency scoring, and investigator workflows that feed model learning back continuously.

## When to apply
Use this pattern when the institution normalizes high false-positive rates, relies mostly on rules, keeps fraud teams split by channel, lacks graph detection, or cannot score modern payment rails within the required latency window.

## How it works
The full program combines a modern model portfolio, cross-channel decisioning, real-time infrastructure, network intelligence, investigator workflow modernization, model-risk alignment, consortium signal integration, and explainability for compliance and adverse-action obligations.

## Variations
The core pattern is financial-services native, but it extends differently across cards, ACH, account opening, payments, insurance claims, and retail finance. Real-time rails, regulatory expectations, and consortium availability change which interventions land first.

## Pitfalls
The source flags the usual traps: adding more rules instead of redesigning the stack, accepting false positives as inevitable, leaving graph in the lab, keeping dispositions in free text, integrating consortium signals only in batch, and treating model risk as a documentation exercise.

## Instances
Concrete instances in the source are the eight activation signals covering rule-engine dominance, false-positive normalization, channel silos, absent graph capability, weak investigator tooling, broken feedback loops, real-time gaps, and lagging model-risk discipline.`,
  },
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-FIN-002',
    slug: 'customer-onboarding-kyc-ai',
    title: 'Customer Onboarding & KYC AI',
    vertical: 'financial_services',
    thesis:
      'Onboarding becomes a risk-calibrated growth capability when document intelligence, liveness, identity graphing, sanctions screening, beneficial ownership, and perpetual KYC are orchestrated end to end instead of handled by siloed manual-review stacks.',
    applicability:
      'Applies to banks, fintechs, broker-dealers, payments firms, insurers, and crypto-adjacent operations with high drop-off, static KYC refresh cycles, manual review queues, or fragmented onboarding technology across product lines.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/11-customer-onboarding-kyc-ai.md'],
    relatedPatternIds: ['PAT-IND-FIN-001'],
    derivedFromPatternIds: ['PAT-IND-FIN-001'],
    body: `## Summary
This pattern turns onboarding from a compliance bottleneck into a calibrated customer-experience and fraud-control layer. The source combines identity orchestration, neural document extraction, biometrics, graph resolution, sanctions and adverse-media screening, EDD workflow, and event-driven refresh into a single modernization path.

## When to apply
Use this pattern when digital drop-off is elevated, manual reviews age in queues, KYC is still refreshed on fixed cycles, synthetic identity losses are visible, or beneficial ownership and screening are trapped in spreadsheets and siloed product-line stacks.

## How it works
The program begins with an identity orchestration layer, then modernizes document and biometric verification, adds graph-based synthetic identity and related-party logic, calibrates friction by risk, introduces perpetual KYC triggers, upgrades EDD, operationalizes beneficial ownership and CTA compliance, and modernizes sanctions and adverse-media workflows.

## Variations
The same pattern spans consumer, SMB, commercial, wealth, and crypto onboarding, but straight-through expectations, regulatory mix, and beneficial-ownership complexity vary sharply by segment. Some firms start with digital funnel economics, others with regulatory cleanup or fraud losses.

## Pitfalls
The source calls out drop-off fatalism, manual review as the default response, static KYC, product-line silos, spreadsheet beneficial ownership, screening limited to onboarding, and vendor sprawl without orchestration.

## Instances
Concrete instances in the source are the eight activation signals covering drop-off, manual-review bottlenecks, static refresh, synthetic identity, onboarding silos, beneficial ownership fragility, dated screening, and unmanaged vendor proliferation.`,
  },
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-EN-001',
    slug: 'predictive-maintenance-modernization',
    title: 'Predictive Maintenance Modernization',
    vertical: 'energy',
    thesis:
      'Predictive maintenance creates reliability and cost outcomes only when asset-class alerts, sensor streams, work orders, technician workflows, and feedback loops are integrated into one operating system rather than left as disconnected vendor point solutions.',
    applicability:
      'Applies to utilities, generation operators, pipelines, and broader energy companies running multiple predictive-maintenance tools or asset programs without integrated alerting, work management, or outcome attribution.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/12-predictive-maintenance-modernization.md'],
    relatedPatternIds: ['PAT-IND-FIN-003'],
    derivedFromPatternIds: ['PAT-IND-FIN-003'],
    body: `## Summary
The source describes predictive maintenance as a chronic insight-without-action problem. Utilities and energy operators often have strong sensing and vendor coverage on individual asset classes but weak unification across alert priority, work-order creation, technician workflow, and model feedback.

## When to apply
Use this pattern when three or more predictive-maintenance vendors are live, alert-to-work-order conversion is low, technicians distrust alerts, sensor data is fragmented across historians and vendor clouds, or NERC CIP is being treated as a blocker rather than an architectural design constraint.

## How it works
The integrated program creates unified alert prioritization, attaches predictive context directly to EAM work orders, captures actual findings back into model training, incrementally unifies sensor data, equips field technicians with better guidance, incorporates drone and satellite imagery, aligns digital twins, and measures maintenance outcomes with attribution.

## Variations
The same pattern spans generation, transmission, distribution, pipelines, and oil and gas, but asset-class mix changes the vendor stack and the role of OT/IT boundaries. Some firms begin with alert/work-order integration, while others begin with field workflow or data unification.

## Pitfalls
The source warns against celebrating alert volume, treating vendor-per-asset-class sprawl as permanent, separating digital twin from predictive monitoring, waiting for perfect data unification before acting, and pushing generative AI into dashboard summaries instead of field workflow.

## Instances
Concrete instances in the source are the eight detection signals covering vendor sprawl, weak alert conversion, missing feedback loops, fragmented sensor data, technician workflow gaps, ad-hoc imagery, disconnected digital twins, and NERC-CIP-driven silos.`,
  },
  {
    ...INDUSTRY_COMMON,
    id: 'PAT-IND-FIN-003',
    slug: 'commodity-trading-ai',
    title: 'Commodity Trading AI',
    vertical: 'financial_services,energy',
    thesis:
      'Commodity trading gains from AI only when forecasting, surveillance, credit, reporting, analyst workflows, and physical-financial optimization are modernized inside a control framework fit for regulated market-facing activity.',
    applicability:
      'Applies to utility and energy trading desks, marketers, merchants, and hybrid physical-financial organizations where ETRM fragmentation, forecasting inconsistency, surveillance lag, and uncontrolled GenAI adoption are affecting decisions.',
    instanceCount: 8,
    sourceDocuments: ['docs/source-material/intelligence-pack/13-commodity-trading-ai.md'],
    relatedPatternIds: ['PAT-IND-EN-001'],
    derivedFromPatternIds: ['PAT-IND-EN-001'],
    body: `## Summary
The source frames energy trading as both a financial-services pattern and an energy-sector pattern. AI matters across price and load forecasting, congestion and fuel prediction, credit exposure, surveillance, reporting, analyst productivity, and asset-backed optimization, but each of those gains sits inside a heavy CFTC, FERC, EMIR, MiFID II, and REMIT control envelope.

## When to apply
Use this pattern when commodity desks are consolidating forecasts manually, living inside heavily extended ETRM stacks, experimenting with GenAI without sanctioned controls, struggling with surveillance or reporting burden, or missing physical-financial arbitrage because operations and commercial systems are split.

## How it works
The integrated program modernizes forecasting, establishes a sanctioned GenAI control framework for the desk, upgrades surveillance, tightens credit and counterparty risk, automates reporting, links physical and financial positions, improves analyst productivity, and expands model-risk governance to cover both predictive and generative AI workloads.

## Variations
The pattern is dual-tagged because it sits at the intersection of regulated financial decisioning and physical energy operations. Power, gas, crude, emissions, RECs, and carbon each emphasize different data, market, and compliance layers, while vertically integrated operators care more about physical-financial coupling than pure merchants.

## Pitfalls
The source warns against desk-by-desk GenAI adoption, Excel-based forecast consolidation, surveillance tuned only for minimum examination posture, nightly credit visibility in fast markets, manual reporting, organizational silos between physical ops and trading, and treating ETRM modernization as pure technology replacement.

## Instances
Concrete instances in the source are the eight activation signals covering forecasting fragmentation, patched ETRM stacks, uncontrolled GenAI use, surveillance lag, dated credit models, labor-heavy reporting, weak physical-financial integration, and underleveraged analyst productivity.`,
  },
];

export const INDUSTRY_PATTERN_COUNT = INDUSTRY_PATTERNS.length;
export const INDUSTRY_PATTERN_IDS = INDUSTRY_PATTERNS.map((pattern) => pattern.id);

export default INDUSTRY_PATTERNS;
