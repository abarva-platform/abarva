export type IndustryVerticalKey = 'healthcare-provider' | 'retail';

export type IndustryCategoryKey =
  | 'ecosystem-map'
  | 'sub-verticals'
  | 'regulatory'
  | 'ai-vendor-landscape'
  | 'what-is-getting-solved-2026'
  | 'decision-makers'
  | 'anti-patterns'
  | 'third-party-analytics-services';

export type IndustryContentType = 'structured_data' | 'opinion' | 'hybrid';

export interface IndustryKnowledgeItem {
  id: string;
  title: string;
  body: string;
  meta?: string;
  children?: IndustryKnowledgeItem[];
}

export interface IndustryKnowledgeGroup {
  id: string;
  title: string;
  items: IndustryKnowledgeItem[];
}

export interface IndustryKnowledgeCategory {
  id: number;
  key: IndustryCategoryKey;
  name: string;
  vertical: IndustryVerticalKey;
  contentType: IndustryContentType;
  groups: IndustryKnowledgeGroup[];
  abarvaPov: string;
  lastRefreshed: string;
  refreshCadence: string;
}

export interface IndustryVerticalKnowledge {
  key: IndustryVerticalKey;
  label: string;
  categories: Record<IndustryCategoryKey, IndustryKnowledgeCategory>;
}

function findItemRecursive(items: IndustryKnowledgeItem[], itemId: string): IndustryKnowledgeItem | null {
  for (const item of items) {
    if (item.id === itemId) return item;
    const nested = item.children ? findItemRecursive(item.children, itemId) : null;
    if (nested) return nested;
  }
  return null;
}

export function getIndustryVertical(verticalKey: IndustryVerticalKey): IndustryVerticalKnowledge {
  return INDUSTRY_KNOWLEDGE[verticalKey];
}

export function getIndustryCategory(
  verticalKey: IndustryVerticalKey,
  categoryKey: IndustryCategoryKey,
): IndustryKnowledgeCategory {
  return INDUSTRY_KNOWLEDGE[verticalKey].categories[categoryKey];
}

export function getIndustryItems(
  verticalKey: IndustryVerticalKey,
  categoryKey: IndustryCategoryKey,
  itemIds: string[],
): IndustryKnowledgeItem[] {
  const category = getIndustryCategory(verticalKey, categoryKey);
  return itemIds
    .map((itemId) => {
      for (const group of category.groups) {
        const match = findItemRecursive(group.items, itemId);
        if (match) return match;
      }
      return null;
    })
    .filter((item): item is IndustryKnowledgeItem => item !== null);
}

export const INDUSTRY_KNOWLEDGE: Record<IndustryVerticalKey, IndustryVerticalKnowledge> = {
  'healthcare-provider': {
    key: 'healthcare-provider',
    label: 'Healthcare Provider',
    categories: {
      'ecosystem-map': {
        id: 1,
        key: 'ecosystem-map',
        name: 'Ecosystem Map',
        vertical: 'healthcare-provider',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          "[ANAND CURATE] Epic is not the real problem. The deeper question is which workloads should stay inside Epic's gravity well, which must leave it, and how to do that without creating another decade of fragmentation.",
        groups: [
          {
            id: 'ehr-tier',
            title: 'EHR Tier',
            items: [
              {
                id: 'epic',
                title: 'Epic',
                body: 'Dominant in academic medical centers and large IDNs. The platform every modernization conversation orbits around.',
                children: [
                  {
                    id: 'epic_clarity',
                    title: 'Clarity',
                    body: 'Relational operational reporting database; the practitioner source of truth for day-to-day analytics.',
                    meta: 'Normalized, SQL-familiar, where most analysts still do real work.',
                  },
                  {
                    id: 'epic_caboodle',
                    title: 'Caboodle',
                    body: "Epic's dimensional warehouse with a pre-built data model.",
                    meta: 'Meant to be analyst-friendly, but practitioners report friction on cross-domain queries, custom metrics, and non-Epic integration.',
                  },
                  {
                    id: 'epic_cosmos',
                    title: 'Cosmos',
                    body: 'De-identified research dataset aggregated from Epic-connected organizations on an opt-in basis.',
                    meta: 'Research-purpose-bound; common confusion point because it is not a substitute for operational analytics.',
                  },
                  {
                    id: 'epic_on_azure',
                    title: 'Epic on Azure',
                    body: "Epic's managed Azure offering, which changes the modernization debate from migration to coexistence.",
                    meta: 'Important architectural shift, but the Azure environment still has real constraints.',
                  },
                  {
                    id: 'hyperdrive',
                    title: 'Hyperdrive',
                    body: 'Web-based clinician client replacing Hyperspace.',
                    meta: 'Changes the clinician workflow layer and the third-party integration surface.',
                  },
                  {
                    id: 'epic_comet',
                    title: 'Comet',
                    body: "Epic's native ambient listening offering.",
                    meta: 'Directly reshapes the ambient documentation buy-vs-build decision against Abridge, DAX, Suki, and others.',
                  },
                ],
              },
              {
                id: 'oracle_health',
                title: 'Oracle Health (Cerner)',
                body: 'Second-largest EHR footprint by share, but platform direction ambiguity makes modernization harder.',
              },
              {
                id: 'meditech',
                title: 'Meditech',
                body: 'Community-hospital-heavy footprint where Expanse changes the economics and the partner ecosystem.',
              },
              {
                id: 'athenahealth',
                title: 'athenahealth',
                body: 'Ambulatory-heavy, cloud-native, and structurally different from Epic and Oracle conversations.',
              },
              {
                id: 'allscripts_altera_veradigm',
                title: 'Allscripts / Altera / Veradigm',
                body: 'Legacy footprint in specific segments with roadmap ambiguity shaped by restructuring and M&A.',
              },
            ],
          },
          {
            id: 'cloud-data-platform',
            title: 'Cloud Data Platform',
            items: [
              {
                id: 'snowflake',
                title: 'Snowflake',
                body: 'Common warehouse layer for non-Epic data and multi-source analytics.',
                meta: 'Healthcare Data Cloud is active; Cortex AI capabilities are maturing.',
              },
              {
                id: 'databricks',
                title: 'Databricks',
                body: 'Stronger where ML and AI ambition is central.',
                meta: 'Lakehouse posture and Genie make it appealing for natural-language querying against complex healthcare data.',
              },
              {
                id: 'azure',
                title: 'Azure',
                body: 'Tight Epic-on-Azure relationship and strong positioning in Microsoft-aligned systems.',
              },
              {
                id: 'aws',
                title: 'AWS',
                body: 'Less dominant in provider settings than cross-industry; HealthLake exists, but adoption is mixed.',
              },
            ],
          },
          {
            id: 'integration-layer',
            title: 'Integration Layer',
            items: [
              {
                id: 'redox',
                title: 'Redox',
                body: 'Default API integration layer between EHRs and new third-party vendors.',
              },
              {
                id: 'health_gorilla',
                title: 'Health Gorilla',
                body: 'National network posture for clinical data exchange.',
              },
              {
                id: 'rhapsody_corepoint',
                title: 'Rhapsody / Corepoint',
                body: 'Legacy integration engines that remain deeply embedded at large systems.',
              },
            ],
          },
          {
            id: 'master-data-identity',
            title: 'Master Data + Identity',
            items: [
              {
                id: 'nextgate_verato',
                title: 'NextGate / Verato',
                body: 'Enterprise master patient index layer. MDM remains a live problem in most systems.',
              },
            ],
          },
        ],
      },
      'sub-verticals': {
        id: 2,
        key: 'sub-verticals',
        name: 'Sub-vertical Structure',
        vertical: 'healthcare-provider',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'static',
        abarvaPov:
          '[ANAND CURATE] Sub-vertical matters more than most teams admit. A recommendation that works in a large AMC often fails in a community hospital because governance shape, data gravity, and capital cycle differ before technology even enters the conversation.',
        groups: [
          {
            id: 'sub-verticals',
            title: 'Healthcare Sub-verticals',
            items: [
              {
                id: 'academic_medical_center',
                title: 'Academic Medical Center',
                body: 'Research mission, complex governance, consolidation dynamics, heavy third-party analytics, and Epic dominance.',
              },
              {
                id: 'integrated_delivery_network',
                title: 'Integrated Delivery Network',
                body: 'Multi-hospital plus physician-network shape, sometimes with a health plan; integration work is the dominant theme.',
              },
              {
                id: 'regional_health_system',
                title: 'Regional Health System',
                body: 'Similar to an IDN but with smaller geographic scale and often mid-modernization.',
              },
              {
                id: 'community_hospital',
                title: 'Community Hospital',
                body: 'Meditech-heavy, sharper capital constraints, different partner mix, different economics.',
              },
              {
                id: 'specialty_system',
                title: "Specialty System (Children's / Cancer / Cardiac)",
                body: 'Unique workflows, specialty AI adoption dynamics, and a narrower but deeper operating model.',
              },
              {
                id: 'post_acute',
                title: 'Post-acute',
                body: 'Separate stack and different reimbursement and regulatory overlays.',
              },
              {
                id: 'ambulatory_networks',
                title: 'Ambulatory Networks',
                body: 'Often athenahealth-based with a different operational rhythm from inpatient-centric systems.',
              },
            ],
          },
        ],
      },
      regulatory: {
        id: 3,
        key: 'regulatory',
        name: 'Regulatory Layer',
        vertical: 'healthcare-provider',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] Regulatory is not a constraint layer to work around. It is a design input. Programs that treat HIPAA and FDA pathways as checklists often pass review and still fail clinician trust.',
        groups: [
          {
            id: 'federal',
            title: 'Federal + Foundational',
            items: [
              { id: 'hipaa', title: 'HIPAA', body: 'Foundational privacy and security rule posture. BAAs required for every vendor touching PHI.' },
              { id: 'part_2', title: '42 CFR Part 2', body: 'Substance-use-disorder data with stricter segmented handling requirements.' },
              { id: 'onc_cures_act', title: 'ONC Cures Act / Information Blocking', body: 'Interoperability mandates, USCDI alignment, and emerging AI transparency implications.' },
              { id: 'cms_quality', title: 'CMS Payment + Quality Programs', body: 'MIPS, value-based care contracts, quality reporting, and shifting payment-model incentives.' },
              { id: 'fda_samd', title: 'FDA SaMD Pathway', body: 'Software-as-medical-device pathway for higher-risk AI CDS use cases.' },
              { id: 'joint_commission', title: 'Joint Commission', body: 'Accreditation layer that increasingly touches AI deployment and IT operations.' },
              { id: 'clia', title: 'CLIA', body: 'Lab oversight; relevant any time lab-AI or diagnostic workflows are involved.' },
              { id: 'dea', title: 'DEA', body: 'Controlled-substance e-prescribing constraints.' },
            ],
          },
          {
            id: 'state-layer',
            title: 'State Layer',
            items: [
              { id: 'cmia', title: 'California CMIA', body: 'California medical-information regime that overlaps with and extends HIPAA.' },
              { id: 'shield_act', title: 'New York SHIELD Act', body: 'Broader state-level security obligations.' },
              { id: 'tmrpa', title: 'Texas TMRPA', body: 'Texas Medical Records Privacy Act obligations.' },
              { id: 'wa_my_health', title: 'Washington My Health My Data', body: 'Broad health-data law extending beyond HIPAA-covered contexts.' },
              { id: 'state_ai_laws_healthcare', title: 'State AI Laws Emerging', body: 'Bias-audit requirements, transparency rules, and state-specific expansion of AI oversight.' },
            ],
          },
        ],
      },
      'ai-vendor-landscape': {
        id: 7,
        key: 'ai-vendor-landscape',
        name: 'Healthcare-specific AI Vendor Landscape',
        vertical: 'healthcare-provider',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] The healthcare AI category is in mid-consolidation. We refuse to recommend a three-year commitment in a category whose architecture and competitive set are still being reshaped every renewal cycle.',
        groups: [
          {
            id: 'ambient',
            title: 'Clinical Documentation + Ambient',
            items: [
              { id: 'abridge', title: 'Abridge', body: "Epic's preferred ambient partner with strong clinician experience and rapid enterprise traction." },
              { id: 'dax', title: 'Nuance DAX (Microsoft)', body: 'Legacy ambient leader with deep enterprise presence, but now under direct pressure from Epic Comet.' },
              { id: 'suki', title: 'Suki', body: 'Assistant-first framing with growing mid-market traction.' },
              { id: 'augmedix', title: 'Augmedix', body: 'Scribe-plus-tech hybrid with a more mixed trajectory.' },
              { id: 'deepscribe_nabla', title: 'DeepScribe / Nabla', body: 'Newer entrants worth watching for traction versus consolidation.' },
              { id: 'comet_vendor', title: 'Epic Comet', body: 'Native Epic-integrated ambient option that reopens keep-or-migrate decisions at renewal.' },
            ],
          },
          {
            id: 'clinical-decision-support',
            title: 'Clinical Decision Support',
            items: [
              { id: 'closedloop', title: 'ClosedLoop', body: 'Predictive models for clinical and operational use cases.' },
              { id: 'jvion', title: 'Jvion (IQVIA)', body: 'Clinical prediction footprint post-acquisition.' },
              { id: 'kensci_prognos', title: 'KenSci / Prognos', body: 'Niche predictive analytics footprint.' },
              { id: 'glass_open_hippocratic', title: 'Glass Health / OpenEvidence / Hippocratic AI', body: 'Emerging LLM-based clinical assistants where trust and liability are still open questions.' },
              { id: 'epic_cds_hooks', title: 'Epic CDS Hooks Ecosystem', body: 'The integration frame most clinician-facing AI eventually has to land inside.' },
              { id: 'databricks_genie', title: 'Databricks Genie', body: 'Natural-language querying layer that increasingly matters on the analytics side of clinician adoption.' },
            ],
          },
          {
            id: 'revenue-cycle-prior-auth',
            title: 'Revenue Cycle + Prior Authorization',
            items: [
              { id: 'cohere_health', title: 'Cohere Health', body: 'Prior-auth automation at the payer-provider boundary.' },
              { id: 'waystar', title: 'Waystar', body: 'Broader RCM with an AI augmentation layer.' },
              { id: 'r1', title: 'R1 RCM', body: 'Enterprise RCM services with AI layered in.' },
              { id: 'notable', title: 'Notable', body: 'Workflow automation spanning patient intake and RCM.' },
              { id: 'iodine', title: 'Iodine Software', body: 'Clinical documentation integrity and AI-augmented CDI.' },
            ],
          },
          {
            id: 'patient-engagement',
            title: 'Patient Engagement',
            items: [
              { id: 'hyro_conversa_mpulse', title: 'Hyro / Conversa / mPulse', body: 'Conversational AI for patient-facing workflows.' },
              { id: 'mychart_ai', title: 'Epic MyChart with AI Additions', body: 'Native engagement surface expanding inside the EHR orbit.' },
            ],
          },
          {
            id: 'research-and-rwe',
            title: 'Research + Real-world Evidence',
            items: [
              { id: 'truveta', title: 'Truveta', body: 'Provider-owned real-world-evidence consortium with growing data footprint.' },
              { id: 'komodo', title: 'Komodo Health', body: 'Claims-based analytics and RWE, often payer-adjacent.' },
              { id: 'flatiron', title: 'Flatiron Health', body: 'Oncology real-world-data leader.' },
              { id: 'trinetx', title: 'TriNetX', body: 'Academic-heavy research network.' },
            ],
          },
        ],
      },
      'what-is-getting-solved-2026': {
        id: 8,
        key: 'what-is-getting-solved-2026',
        name: "What's Getting Solved in 2026",
        vertical: 'healthcare-provider',
        contentType: 'opinion',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] The question has shifted from whether to deploy AI to which deployments deserve the regulatory burden, integration debt, and clinician-trust runway they require.',
        groups: [
          {
            id: 'mainstream',
            title: 'Mainstream',
            items: [
              { id: 'ambient_docs', title: 'Ambient Clinical Documentation', body: 'Abridge and DAX lead while Comet disrupts the competitive frame.' },
              { id: 'early_warning', title: 'Early-warning CDS', body: 'Sepsis and deterioration signals integrated into Epic have broadly established ROI.' },
              { id: 'coding_augmentation', title: 'Clinical Coding Augmentation', body: 'Now broadly deployed with an operating model that buyers understand.' },
              { id: 'mychart_triage', title: 'MyChart Messaging Triage', body: 'A practical, workflow-anchored AI use case with increasingly clear adoption patterns.' },
            ],
          },
          {
            id: 'emerging',
            title: 'Emerging',
            items: [
              { id: 'prior_auth_auto', title: 'Prior Authorization Automation', body: 'Material enterprise adoption in 2026, ROI still being proven at scale.' },
              { id: 'patient_access_ai', title: 'Patient Scheduling + Access AI', body: 'Growing but still uneven across sub-verticals.' },
              { id: 'nursing_workflow', title: 'Nursing Workflow Automation', body: 'Visible momentum, but operational variance still high.' },
              { id: 'trial_matching', title: 'Clinical Trial Matching', body: 'Promising in research-heavy settings.' },
              { id: 'cdi_scale', title: 'Clinical Documentation Integrity at Scale', body: 'Adoption is rising with better operational framing.' },
            ],
          },
          {
            id: 'experimenting',
            title: 'Experimenting',
            items: [
              { id: 'complex_diagnostic_cds', title: 'Complex Diagnostic CDS', body: 'Pilots exist, but adoption and liability remain contested.' },
              { id: 'ambient_nursing', title: 'Ambient Nursing Documentation', body: 'Still earlier than the physician ambient category.' },
              { id: 'agentic_rcm', title: 'Agent-based Revenue Cycle Workflows', body: 'Compelling demos, thinner proof in production.' },
              { id: 'genai_education', title: 'GenAI Patient Education Content', body: 'Useful in narrow contexts but not yet a settled category.' },
              { id: 'imaging_expansion', title: 'Imaging AI Beyond Reads', body: 'Expansion outside radiology remains uneven.' },
            ],
          },
          {
            id: 'overhyped',
            title: 'Immature or Over-hyped',
            items: [
              { id: 'autonomous_diagnostic_ai', title: 'Autonomous Diagnostic AI', body: 'High hype-to-deployment ratio.' },
              { id: 'ai_care_management', title: 'AI-only Care Management', body: 'Human-in-the-loop gaps make this structurally weak today.' },
              { id: 'ai_only_clinical_decisions', title: 'AI-only High-risk Clinical Decision-making', body: 'Trust and regulatory posture are nowhere near mature enough.' },
              { id: 'general_health_chatbots', title: 'Generalized Health Chatbots Giving Clinical Advice', body: 'A category with a lot of marketing and far less defensible deployment.' },
            ],
          },
          {
            id: 'stalled',
            title: 'Stalled',
            items: [
              { id: 'population_health_stalled', title: 'Population Health AI without Data Integration', body: 'Fails when fragmentation is still unsolved.' },
              { id: 'post_merger_ai_stalled', title: 'Cross-system AI without Reconciled Master Data', body: 'A common post-merger health-system trap.' },
              { id: 'ehr_ai_without_owner', title: 'Large "AI in the EHR" Programs without Workflow Owners', body: 'Slideware grows faster than outcomes.' },
            ],
          },
        ],
      },
      'decision-makers': {
        id: 9,
        key: 'decision-makers',
        name: 'Decision-maker Archetypes',
        vertical: 'healthcare-provider',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'annual',
        abarvaPov:
          '[ANAND CURATE] The CMIO seat is the most commonly skipped seat in healthcare AI and the highest-leverage one to secure early. We do not start Phase 1 clinical AI work without explicit CMIO alignment.',
        groups: [
          {
            id: 'archetypes',
            title: 'Healthcare Decision-makers',
            items: [
              { id: 'cio', title: 'CIO', body: 'Platform and infrastructure decisions with core IT spend authority.', meta: 'Necessary, but rarely sufficient for AI programs.' },
              { id: 'cmio', title: 'CMIO', body: 'Clinical informatics, EHR optimization, and clinician AI adoption.', meta: 'Critical co-sponsor for any clinical AI program.' },
              { id: 'cnio', title: 'CNIO', body: 'Nursing workflow and documentation authority.', meta: 'Increasingly important as nursing-adjacent AI expands.' },
              { id: 'cdo_health', title: 'CDO', body: 'Data governance, analytics platform, and AI strategy.', meta: 'Reporting line varies widely by system maturity.' },
              { id: 'cmo_health', title: 'Chief Medical Officer', body: 'Clinical quality, physician alignment, and the outcomes AI is supposed to improve.' },
              { id: 'cfo_health', title: 'CFO', body: 'Revenue cycle, VBC economics, and capital allocation.', meta: 'Outcome economics land here.' },
              { id: 'chief_quality', title: 'Chief Quality Officer', body: 'Outcomes, accreditation, and safety monitoring.' },
              { id: 'ciso_health', title: 'CISO', body: 'Security, compliance, BAAs, and vendor-risk gates.' },
              { id: 'strategy_innovation', title: 'Chief Strategy / Innovation Officer', body: 'Pilot entry point and partnership posture.' },
              { id: 'experience_officer', title: 'Chief Experience Officer', body: 'Patient-experience surface for patient-facing AI.' },
              { id: 'service_line_leaders', title: 'Service-line Leaders', body: 'Often the actual buyer for specialty-specific AI vendors.' },
            ],
          },
        ],
      },
      'anti-patterns': {
        id: 11,
        key: 'anti-patterns',
        name: "Anti-patterns · What AbarVa Wouldn't Do",
        vertical: 'healthcare-provider',
        contentType: 'opinion',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'static',
        abarvaPov:
          '[ANAND CURATE] These refusals need sharper receipts over time, but the posture is already clear: we do not recommend architectures that confuse research with operations, or technology with sponsorship.',
        groups: [
          {
            id: 'refusals',
            title: 'Healthcare Refusals',
            items: [
              { id: 'cosmos_substitution', title: "We wouldn't treat Cosmos as operational analytics.", body: 'Cosmos is research-purpose-bound; using it to answer operational analytics needs confuses capacity with decision-making reality.' },
              { id: 'caboodle_only_path', title: "We wouldn't recommend a Caboodle-only modernization path.", body: 'The moment claims, pharmacy-network, SDOH, or cross-system analytics matter, Caboodle becomes the constraint rather than the answer.' },
              { id: 'cmio_misalignment', title: "We wouldn't start a clinical AI program without CMIO and service-line alignment.", body: 'IT-bought and clinician-rejected remains the most common healthcare AI failure mode.' },
              { id: 'ambient_without_change', title: "We wouldn't implement ambient documentation without an explicit clinician change runway.", body: 'Ambient ROI is real, but the adoption curve is steep without a deliberate 60-day behavior-change plan.' },
              { id: 'population_health_without_contract', title: "We wouldn't pursue population-health AI without payer-contract alignment.", body: 'No VBC contract means no economic engine to fund the second year.' },
              { id: 'lake_without_refresh', title: "We wouldn't build a healthcare data lake without refresh discipline and MDM.", body: 'Stale EHR snapshots and unreconciled identity always become the blocker later.' },
              { id: 'mpi_deferral', title: "We wouldn't defer master patient index work.", body: '"Solve MDM later" is one of the most expensive lies in provider analytics programs.' },
              { id: 'roi_without_peer_receipts', title: "We wouldn't accept AI vendor ROI claims without peer-system receipts.", body: 'Vendor case studies are weaker than five comparable deployments with published outcomes.' },
              { id: 'fda_late', title: "We wouldn't pursue high-risk FDA-pathway AI without regulatory design from the start.", body: 'Retroactive pathway work is slower, more expensive, and riskier.' },
              { id: 'epic_on_azure_cure_all', title: "We wouldn't treat Epic on Azure as a cure-all.", body: 'It solves a real problem, but it does not make downstream architecture constraints disappear.' },
            ],
          },
        ],
      },
      'third-party-analytics-services': {
        id: 14,
        key: 'third-party-analytics-services',
        name: 'Third-party Analytics and AI Service Providers',
        vertical: 'healthcare-provider',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] The typical large health system already runs three to five of these simultaneously, bought by different sponsors over years. The 2026 decision is not what new analytics layer to add, but which ones to keep, rationalize, or sunset honestly.',
        groups: [
          {
            id: 'providers',
            title: 'Healthcare Services + Analytics Providers',
            items: [
              { id: 'innovaccer', title: 'Innovaccer', body: 'Population-health and care-management data platform.', meta: 'Typical sponsor · CMO / Chief Population Health' },
              { id: 'health_catalyst', title: 'Health Catalyst', body: 'Warehouse, analytics services, and benchmark discipline.', meta: 'Typical sponsor · Quality / Finance' },
              { id: 'arcadia', title: 'Arcadia', body: 'VBC-focused analytics with ACO-heavy clientele.', meta: 'Typical sponsor · VBC Contracting / CMO' },
              { id: 'apixio', title: 'Apixio', body: 'Risk-adjustment and clinical AI layer.', meta: 'Typical sponsor · Revenue Cycle / Risk Adjustment' },
              { id: 'premier', title: 'Premier', body: 'GPO-adjacent analytics and benchmarks.', meta: 'Typical sponsor · Supply Chain / CFO' },
              { id: 'vizient', title: 'Vizient', body: 'AMC-heavy analytics and benchmarks.', meta: 'Typical sponsor · CFO / Quality' },
              { id: 'truveta_service', title: 'Truveta', body: 'Provider-consortium real-world evidence.', meta: 'Typical sponsor · Research / Strategy' },
              { id: 'closedloop_service', title: 'ClosedLoop', body: 'Predictive models as a service.', meta: 'Typical sponsor · CDO / Analytics' },
              { id: 'komodo_service', title: 'Komodo Health', body: 'Claims-based analytics and research posture.', meta: 'Typical sponsor · Research / Strategy' },
              { id: 'carta', title: 'Carta Healthcare', body: 'Clinical-data abstraction services.', meta: 'Typical sponsor · Quality / Research' },
              { id: 'syllable_hyro', title: 'Syllable / Hyro', body: 'Patient-engagement analytics and conversational layer.', meta: 'Typical sponsor · Experience / Patient Access' },
            ],
          },
        ],
      },
    },
  },
  retail: {
    key: 'retail',
    label: 'Retail',
    categories: {
      'ecosystem-map': {
        id: 1,
        key: 'ecosystem-map',
        name: 'Ecosystem Map',
        vertical: 'retail',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] Retail has more vendor choice than healthcare, but that freedom compounds integration debt fast. In 2026 the conversation is rationalization as much as modernization.',
        groups: [
          {
            id: 'merchandising-planning',
            title: 'Merchandising + Planning',
            items: [
              { id: 'oracle_retail', title: 'Oracle Retail', body: 'Legacy leader across RMS / RPAS / MFP / AP, especially in mass and specialty retail.' },
              { id: 'blue_yonder', title: 'Blue Yonder', body: 'Planning, replenishment, and supply-chain execution leader with especially strong grocery and mass footprint.' },
              { id: 'sap_retail', title: 'SAP', body: 'Enterprise-heavy, especially where SAP already anchors ERP and international operations.' },
              { id: 'manhattan', title: 'Manhattan Associates', body: 'WMS, OMS, and supply-chain execution leader reshaped by cloud refactoring.' },
              { id: 'dynamics_commerce', title: 'Microsoft Dynamics 365 Commerce', body: 'Most natural in Microsoft-aligned mid-market retailers.' },
              { id: 'centric_ptc', title: 'Centric Software / PTC FlexPLM', body: 'PLM-heavy footprint in specialty and apparel.' },
            ],
          },
          {
            id: 'commerce',
            title: 'Commerce',
            items: [
              { id: 'shopify_plus', title: 'Shopify Plus', body: 'Dominant in DTC and mid-market with a real enterprise push.' },
              { id: 'sfcc', title: 'Salesforce Commerce Cloud', body: 'Large-enterprise foothold where Salesforce already owns CRM and workflow gravity.' },
              { id: 'adobe_commerce', title: 'Adobe Commerce', body: 'Enterprise presence with a mixed modernization story post-acquisition.' },
              { id: 'commercetools', title: 'commercetools', body: 'Headless composable-commerce leader with growing enterprise traction.' },
              { id: 'bigcommerce', title: 'BigCommerce', body: 'Mid-market SaaS commerce layer.' },
            ],
          },
          {
            id: 'customer-data',
            title: 'Customer Data',
            items: [
              { id: 'salesforce_data_cloud', title: 'Salesforce Data Cloud', body: 'Large-enterprise dominant, especially when Salesforce already has workflow control.' },
              { id: 'adobe_rtcp', title: 'Adobe Real-Time CDP', body: 'Strong alternative in Adobe-aligned content and commerce stacks.' },
              { id: 'composable_cdps', title: 'mParticle / Segment / Tealium', body: 'Composable CDP posture with more flexibility and more integration burden.' },
              { id: 'enterprise_cdps', title: 'ActionIQ / Treasure Data', body: 'Enterprise CDPs with stronger analytical posture.' },
            ],
          },
          {
            id: 'cloud-data-platform',
            title: 'Cloud Data Platform',
            items: [
              { id: 'snowflake_retail', title: 'Snowflake', body: 'Mass merchant and grocery favorite with strong retail data-cloud momentum.' },
              { id: 'databricks_retail', title: 'Databricks', body: 'Stronger in deeper-AI retailers, luxury, DTC, and vertically integrated brands.' },
              { id: 'gcp_retail', title: 'Google Cloud / BigQuery / Retail AI', body: 'Material retail AI footprint with recognizable large-retailer references.' },
              { id: 'azure_retail', title: 'Azure / Microsoft Cloud for Retail', body: 'Strong in Microsoft-aligned retailers with Fabric increasingly relevant.' },
            ],
          },
          {
            id: 'inventory-store-ops',
            title: 'Inventory + Store Ops',
            items: [
              { id: 'newstore_aptos_tulip', title: 'NewStore / Aptos / Tulip', body: 'Store-associate and clienteling platforms.' },
              { id: 'zebra_scandit', title: 'Zebra / Scandit', body: 'Device and scan layer that often underpins in-store computer-vision work.' },
            ],
          },
        ],
      },
      'sub-verticals': {
        id: 2,
        key: 'sub-verticals',
        name: 'Sub-vertical Structure',
        vertical: 'retail',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'static',
        abarvaPov:
          '[ANAND CURATE] A mass merchant and a luxury retailer only share a small slice of the real problem space. Sub-vertical is a required input before any Phase 1 hypothesis is taken seriously.',
        groups: [
          {
            id: 'retail-sub-verticals',
            title: 'Retail Sub-verticals',
            items: [
              { id: 'mass_merchant', title: 'Mass Merchant', body: 'High SKU count, omnichannel maturity, Snowflake-heavy, thin-margin categories, private label rising.' },
              { id: 'grocery', title: 'Grocery', body: 'Thin-margin, perishables complexity, and loyalty-driven data economics.' },
              { id: 'specialty_apparel', title: 'Specialty Apparel', body: 'Fashion-cycle dynamics, inventory-turn pressure, and brand experience centrality.' },
              { id: 'department_store', title: 'Department Store', body: 'Legacy footprint challenges and persistent modernization pressure.' },
              { id: 'luxury', title: 'Luxury', body: 'Clienteling-first, higher-touch journey, more Databricks and DTC-native patterns.' },
              { id: 'dtc_native', title: 'DTC Native', body: 'Vertically integrated, cloud-native by default, and economically different from legacy retail.' },
              { id: 'off_price', title: 'Off-price', body: 'Sourcing-driven economics and a different merchandising rhythm.' },
              { id: 'hard_goods', title: 'Hard Goods / Home Improvement', body: 'Lower turn, trade-customer complexity, and different logistics economics.' },
              { id: 'pharmacy_retail', title: 'Pharmacy Retail', body: 'Hybrid clinical and retail operating model with a HIPAA overlay.' },
              { id: 'convenience_fuel', title: 'Convenience + Fuel', body: 'Different margin and operating model entirely.' },
            ],
          },
        ],
      },
      regulatory: {
        id: 3,
        key: 'regulatory',
        name: 'Regulatory Layer',
        vertical: 'retail',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] Retail regulation is a patchwork, not a single layer. Privacy, AI, accessibility, and trade policy move independently, so documentation discipline has to survive the next audit regime rather than merely comply today.',
        groups: [
          {
            id: 'federal-and-foundational',
            title: 'Federal + Foundational',
            items: [
              { id: 'pci_dss', title: 'PCI-DSS', body: 'Payment-card handling baseline. Compliance is table stakes, not differentiation.' },
              { id: 'ftc_section_5', title: 'FTC Section 5', body: 'Unfairness and deception applied to AI, personalization, and dark patterns.' },
              { id: 'coppa', title: 'COPPA', body: "Children's-data obligations for youth-facing retailers." },
              { id: 'tcpa', title: 'TCPA', body: 'Marketing communications and consent-management requirements.' },
              { id: 'ada_accessibility', title: 'ADA Accessibility', body: 'Increasingly applied to e-commerce in an active litigation environment.' },
            ],
          },
          {
            id: 'state-patchwork',
            title: 'State Patchwork',
            items: [
              { id: 'ccpa_cpra', title: 'California CCPA / CPRA', body: 'Often the effective US privacy baseline because of breadth and influence.' },
              { id: 'vcdpa_cpa_ctdpa_ucpa', title: 'Virginia / Colorado / Connecticut / Utah', body: 'Layered state privacy regimes that compound operationally.' },
              { id: 'wa_my_health_retail', title: 'Washington My Health My Data', body: 'Broad health-data scope relevant even in some health-adjacent retail contexts.' },
              { id: 'state_ai_laws_retail', title: 'State AI Laws Emerging', body: 'Colorado AI Act and other fast-moving state-level AI obligations.' },
            ],
          },
          {
            id: 'international',
            title: 'International',
            items: [
              { id: 'gdpr', title: 'EU / UK GDPR', body: 'Foundational privacy regime for international retailers.' },
              { id: 'dsa', title: 'EU Digital Services Act', body: 'Platform obligations relevant to large online commerce surfaces.' },
              { id: 'eu_ai_act', title: 'EU AI Act', body: 'Risk-tiered AI regulation increasingly relevant to profiling and recommendation systems.' },
            ],
          },
          {
            id: 'vertical-specific',
            title: 'Vertical-specific',
            items: [
              { id: 'fda_usda', title: 'FDA / USDA', body: 'Material for grocery and pharmacy subsets.' },
              { id: 'tariff_and_sourcing_compliance', title: 'Tariff + Sourcing Compliance', body: 'Import documentation, forced-labor rules, and trade-policy volatility matter materially in 2026.' },
            ],
          },
        ],
      },
      'ai-vendor-landscape': {
        id: 7,
        key: 'ai-vendor-landscape',
        name: 'Retail-specific AI Vendor Landscape',
        vertical: 'retail',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] Retail AI vendors proliferate faster than most retailers can evaluate them. Most underperform in isolation because they solve adjacent problems against different data foundations.',
        groups: [
          {
            id: 'personalization',
            title: 'Personalization + Recommendations',
            items: [
              { id: 'bloomreach', title: 'Bloomreach / Algonomy / Dynamic Yield / Movable Ink / Constructor.io', body: 'Dedicated personalization platforms differentiated mostly by data depth and integration posture.' },
              { id: 'salesforce_einstein', title: 'Salesforce Einstein', body: 'Platform-native personalization inside deep Salesforce lock-in.' },
              { id: 'adobe_sensei', title: 'Adobe Sensei / Target / Experience Platform AI', body: 'Adobe-native posture, strong when content and commerce already live there.' },
            ],
          },
          {
            id: 'pricing-promo',
            title: 'Pricing + Promotion',
            items: [
              { id: 'revionics', title: 'Revionics / Blue Yonder Price / dunnhumby PriceStrat', body: 'Enterprise pricing-AI category that matters directly to owned-brand and promo economics.' },
              { id: 'competera', title: 'Competera / Pricer24 / Intelligence Node', body: 'Competitive-pricing intelligence layer.' },
            ],
          },
          {
            id: 'demand-supply',
            title: 'Demand + Supply Chain',
            items: [
              { id: 'luminate_o9_kinaxis_anaplan', title: 'Blue Yonder Luminate / o9 / Kinaxis / Anaplan', body: 'Planning platforms with different philosophies on end-to-end visibility.' },
              { id: 'relex', title: 'Relex', body: 'Especially strong in grocery forecasting.' },
              { id: 'toolsgroup', title: 'ToolsGroup', body: 'Mid-market demand-forecasting posture.' },
            ],
          },
          {
            id: 'assortment-space',
            title: 'Assortment + Space',
            items: [
              { id: 'symphony_dunnhumby_8451', title: 'Symphony RetailAI / dunnhumby / 84.51°', body: 'Merchandising and category-analytics layer.' },
              { id: 'nielseniq_circana', title: 'NielsenIQ / Circana', body: 'Syndicated consumer and retail measurement foundation.' },
            ],
          },
          {
            id: 'marketing-content',
            title: 'Marketing + Content',
            items: [
              { id: 'jasper_writer_copy', title: 'Jasper / Writer / Copy.ai', body: 'GenAI marketing content at scale.' },
              { id: 'persado', title: 'Persado', body: 'AI-generated copy with a more rigorous lift-measurement posture.' },
              { id: 'movable_optimizely_vwo', title: 'Movable Ink / Optimizely / VWO', body: 'Creative optimization and experimentation layer.' },
            ],
          },
          {
            id: 'store-operations',
            title: 'Store Operations',
            items: [
              { id: 'trigo_aifi_standard', title: 'Trigo / AiFi / Standard AI', body: 'Cashierless and computer-vision checkout.' },
              { id: 'shelf_robots', title: 'Bossa Nova / Pensa / Simbe', body: 'Shelf-analytics robotics category where ROI is still contested.' },
              { id: 'theatro_relay', title: 'Theatro / Relay', body: 'Store-associate AI and communications layer.' },
            ],
          },
          {
            id: 'customer-service',
            title: 'Customer Service',
            items: [
              { id: 'ada_kustomer_gladly_zendesk', title: 'Ada / Kustomer / Gladly / Zendesk AI', body: 'Conversational service AI category.' },
            ],
          },
        ],
      },
      'what-is-getting-solved-2026': {
        id: 8,
        key: 'what-is-getting-solved-2026',
        name: "What's Getting Solved in 2026",
        vertical: 'retail',
        contentType: 'opinion',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] Private-label margin recovery and GenAI-driven content reorganization are two of the most important retail shifts in 2026. Chief Merchant is being pulled into data-architecture decisions the seat historically avoided.',
        groups: [
          {
            id: 'mainstream',
            title: 'Mainstream',
            items: [
              { id: 'personalization_scale', title: 'Personalization at Scale', body: 'Product and content personalization now has widely understood ROI patterns.' },
              { id: 'genai_marketing_content', title: 'GenAI Marketing Content Production', body: 'Cost per asset is falling materially and forcing operating-model change.' },
              { id: 'assortment_opt', title: 'Assortment Optimization on Cloud Foundations', body: 'Now established where data foundations are mature.' },
              { id: 'sku_forecasting', title: 'SKU-store-day Forecasting', body: 'A normalized expectation in serious retail supply programs.' },
            ],
          },
          {
            id: 'emerging',
            title: 'Emerging',
            items: [
              { id: 'conversational_commerce', title: 'Conversational Commerce', body: 'Moving from novelty to material adoption, but still not fully settled.' },
              { id: 'hyper_personalized_creative', title: 'Hyper-personalized Messaging', body: 'Persado-class measurement is making this more defensible.' },
              { id: 'agent_customer_service', title: 'Agent-based Customer Service', body: 'Strong momentum in routing, summarization, and resolution support.' },
              { id: 'ai_sourcing', title: 'AI-augmented Sourcing', body: 'Gaining relevance under tariff and supply volatility.' },
            ],
          },
          {
            id: 'experimenting',
            title: 'Experimenting',
            items: [
              { id: 'computer_vision_beyond_cashierless', title: 'In-store Computer Vision Beyond Cashierless', body: 'Shelf analytics, traffic, and shrink remain promising but experimental.' },
              { id: 'agentic_commerce', title: 'Agentic Commerce', body: 'Browser agents buying on behalf of users is still mostly early-stage experimentation.' },
              { id: 'realtime_creative', title: 'Real-time Creative in Performance Marketing', body: 'Pilots are active, but operating model is unsettled.' },
              { id: 'ai_clienteling', title: 'AI Clienteling', body: 'Promising in luxury and specialty but not yet mainstream.' },
            ],
          },
          {
            id: 'overhyped',
            title: 'Immature or Over-hyped',
            items: [
              { id: 'autonomous_replenishment', title: 'Fully Autonomous Replenishment', body: 'Not yet ready end to end.' },
              { id: 'fully_automated_store_ops', title: 'Fully Automated Store Operations', body: 'Exception economics and human reality keep this behind the hype.' },
              { id: 'ai_only_brand_content', title: 'AI-only Brand Content without Review', body: 'Brand-safety and legal exposure make this structurally weak.' },
              { id: 'ai_strategy_slideware', title: '"AI Strategy" without Workflow Ownership', body: 'Too much deckware, not enough operational accountability.' },
            ],
          },
          {
            id: 'reshaping',
            title: 'Reshaping in 2026',
            items: [
              { id: 'private_label_margin_recovery', title: 'Private-label Margin Recovery', body: 'A universal CFO priority across mass and grocery, directly tied to promo, sourcing, and ops.' },
              { id: 'content_ops_reorg', title: 'Marketing + Content Ops Reorganization', body: 'GenAI is forcing content-production operating-model change.' },
              { id: 'merchant_data_decisions', title: 'Chief Merchant in Data Decisions', body: 'Merchants are being forced into architecture choices they historically avoided.' },
            ],
          },
        ],
      },
      'decision-makers': {
        id: 9,
        key: 'decision-makers',
        name: 'Decision-maker Archetypes',
        vertical: 'retail',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'annual',
        abarvaPov:
          '[ANAND CURATE] The Chief Merchant seat is the underrated lever in retail AI programs. Merchants hold authority that IT, CDO, and CMO cannot override once pricing, assortment, and promo are in scope.',
        groups: [
          {
            id: 'archetypes',
            title: 'Retail Decision-makers',
            items: [
              { id: 'cio_retail', title: 'CIO / SVP Technology', body: 'Platform, infrastructure, and enterprise-systems authority.', meta: 'Often carries commerce-platform responsibility.' },
              { id: 'cto_retail', title: 'CTO', body: 'Commerce engineering and developer platform authority.' },
              { id: 'cdo_retail', title: 'CDO', body: 'Data platform, analytics, and AI strategy.' },
              { id: 'cmo_retail', title: 'CMO', body: 'Customer data, personalization, marketing AI, and content.' },
              { id: 'chief_merchant', title: 'Chief Merchant', body: 'Assortment, pricing, promo, and vendor relationships.', meta: 'Increasingly decisive in 2026 because margin pressure makes merchandising data-native.' },
              { id: 'supply_chain', title: 'Chief Supply Chain Officer / COO', body: 'Inventory, forecasting, and logistics ownership.' },
              { id: 'stores_officer', title: 'Chief Stores Officer', body: 'Store operations and in-store AI adoption.' },
              { id: 'digital_officer', title: 'Chief Digital / E-commerce Officer', body: 'Digital-experience and commerce-platform ownership.' },
              { id: 'customer_experience', title: 'Chief Customer / Experience Officer', body: 'Cross-channel customer-experience coordination.' },
              { id: 'cfo_retail', title: 'CFO', body: 'Capex, ROI, margin strategy, and outcome economics.' },
              { id: 'ciso_retail', title: 'CISO', body: 'Security, PCI, privacy, and vendor-risk gatekeeping.' },
            ],
          },
        ],
      },
      'anti-patterns': {
        id: 11,
        key: 'anti-patterns',
        name: "Anti-patterns · What AbarVa Wouldn't Do",
        vertical: 'retail',
        contentType: 'opinion',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'static',
        abarvaPov:
          '[ANAND CURATE] Retail failures repeat because the stack discussion outruns the workflow and data-discipline discussion. These refusals are the guardrails.',
        groups: [
          {
            id: 'refusals',
            title: 'Retail Refusals',
            items: [
              { id: 'personalization_vendor_pick', title: "We wouldn't treat personalization as a vendor pick.", body: 'Identity resolution, event pipeline, and data architecture are the real 90% of the work.' },
              { id: 'generic_cdp_identity', title: "We wouldn't over-rely on a generic CDP for retail identity.", body: 'Retail identity spans online, store, loyalty, service, and email keys; off-the-shelf CDPs rarely close the last 30% where differentiation lives.' },
              { id: 'lift_shift_inventory', title: "We wouldn't lift-and-shift inventory systems without redesigning for real-time visibility.", body: 'Preserving old latency simply recreates the original failure in a more expensive place.' },
              { id: 'item_master_first', title: "We wouldn't chase assortment AI before fixing master item data.", body: 'Duplicate SKUs, stale attributes, and weak vendor hierarchies cap model quality before the model begins.' },
              { id: 'brand_safety_loop', title: "We wouldn't deploy GenAI marketing content without brand-safety and legal review loops.", body: 'Regulatory and brand exposure compound faster than most teams estimate.' },
              { id: 'cashierless_economics', title: "We wouldn't pursue cashierless or shelf vision without honest shrink and exception economics.", body: 'The hidden labor tax often exceeds the promised savings.' },
              { id: 'merchant_consultation_only', title: "We wouldn't treat Chief Merchant as consultation-only on data decisions.", body: 'If the merchant is not a co-owner, the AI layer underperforms the vendor deck.' },
              { id: 'promo_without_ops_loop', title: "We wouldn't embed AI into promo without reconnecting to operational cost.", body: 'Promo decisions that ignore freight, sourcing, and shrink simply automate the same failure faster.' },
              { id: 'coe_without_owners', title: "We wouldn't stand up a Retail AI CoE without workflow-level ownership.", body: 'Retail is too distributed across merchants, marketing, supply chain, and stores for central slideware to hold.' },
            ],
          },
        ],
      },
      'third-party-analytics-services': {
        id: 14,
        key: 'third-party-analytics-services',
        name: 'Third-party Analytics and AI Service Providers',
        vertical: 'retail',
        contentType: 'hybrid',
        lastRefreshed: '2026-Q2',
        refreshCadence: 'quarterly',
        abarvaPov:
          '[ANAND CURATE] Retail increasingly wants the differentiated signal and not the commodified reporting shell. The real question is which external services still bring unique data or IP and which should collapse into the retailer-owned cloud foundation.',
        groups: [
          {
            id: 'providers',
            title: 'Retail Analytics + Signal Providers',
            items: [
              { id: 'dunnhumby', title: 'dunnhumby', body: 'Customer science for grocery and consumer brands.', meta: 'Typical sponsor · CMO / Chief Merchant' },
              { id: '8451', title: '84.51°', body: 'Kroger-owned hybrid captive-commercial analytics layer.', meta: 'Typical sponsor · CMO / CPG Partnerships' },
              { id: 'precima', title: 'Precima', body: 'Loyalty and customer-analytics services.', meta: 'Typical sponsor · CMO / Loyalty' },
              { id: 'symphony_retailai', title: 'Symphony RetailAI', body: 'Merchandising and supply-chain analytics services.', meta: 'Typical sponsor · Chief Merchant / Supply Chain' },
              { id: 'edited', title: 'Edited', body: 'Apparel merchandising intelligence.', meta: 'Typical sponsor · Merchant / Buying' },
              { id: 'circana', title: 'Circana', body: 'Syndicated data and advanced analytics services.', meta: 'Typical sponsor · CMO / Chief Merchant' },
              { id: 'niq', title: 'NielsenIQ', body: 'Household panel and retail measurement.', meta: 'Typical sponsor · CMO / Insights' },
              { id: 'kantar', title: 'Kantar', body: 'Brand and retail analytics services.', meta: 'Typical sponsor · CMO / Brand' },
              { id: 'affinity_placer_similarweb', title: 'Affinity Solutions / Placer.ai / Similarweb', body: 'Third-party signals across card, location, and web traffic.', meta: 'Typical sponsor · Strategy / CMO' },
            ],
          },
        ],
      },
    },
  },
};
