import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deterministicUuid } from './contradiction-engine-lib';
import { createSeedClient, loadSeedEnv, slugify } from './seed-wave-lib';

type KnowledgeContentType =
  | 'regulation'
  | 'framework'
  | 'benchmark'
  | 'research_report'
  | 'vendor_doc'
  | 'vendor_posture'
  | 'news_article'
  | 'case_study'
  | 'enforcement_action';

type KnowledgeLicenseClass =
  | 'public_domain'
  | 'attribution'
  | 'registration'
  | 'fair_use_excerpt'
  | 'licensed';

interface RetailKnowledgeSource {
  sourceKey: string;
  title: string;
  publisher: string;
  publisherUrl: string;
  sourceUrl: string;
  contentType: KnowledgeContentType;
  licenseClass: KnowledgeLicenseClass;
  publishedAt: string;
  topicTags: string[];
  summary: string;
  relatedPatterns: string[];
}

const SOURCES: RetailKnowledgeSource[] = [
  {
    sourceKey: 'retail_nrf_ai_trends_2025',
    title: 'Retail AI Trends 2025',
    publisher: 'National Retail Federation',
    publisherUrl: 'https://nrf.com',
    sourceUrl: 'https://nrf.com/research/retail-ai-trends-2025',
    contentType: 'research_report',
    licenseClass: 'registration',
    publishedAt: '2025-12-01',
    topicTags: ['ai_adoption', 'retail_operations', 'governance'],
    summary: 'NRF frames retail AI as an operating-model shift rather than a narrow automation wave, with leaders investing across customer experience, stores, supply chain, and risk. The key finding for AbarVa is that data readiness, governance, and practical workflow integration determine whether retailers move beyond pilots.',
    relatedPatterns: ['F202', 'F207', 'F236'],
  },
  {
    sourceKey: 'retail_nrf_trends_watch_2025',
    title: 'Retail Trends to Watch in 2025',
    publisher: 'National Retail Federation',
    publisherUrl: 'https://nrf.com',
    sourceUrl: 'https://nrf.com/blog/retail-trends-to-watch-in-2025',
    contentType: 'research_report',
    licenseClass: 'attribution',
    publishedAt: '2025-01-01',
    topicTags: ['consumer_trends', 'agentic_ai', 'shopping_experience'],
    summary: 'NRF highlights AI agents, changing shopper expectations, and operational adaptability as important retail themes for 2025. For Apex Retail, this supports CXO questions about whether customer-facing AI has enough product, inventory, and service context to be trusted.',
    relatedPatterns: ['F203', 'F204', 'F208'],
  },
  {
    sourceKey: 'retail_gartner_ai_impact_radar_2025',
    title: 'Emerging Tech Impact Radar: Artificial Intelligence in Retail',
    publisher: 'Gartner',
    publisherUrl: 'https://www.gartner.com',
    sourceUrl: 'https://www.gartner.com/en/documents/6355379',
    contentType: 'research_report',
    licenseClass: 'licensed',
    publishedAt: '2025-04-11',
    topicTags: ['ai_adoption', 'retail_ai', 'technology_radar'],
    summary: 'Gartner positions retail AI as a portfolio of emerging capabilities with different impact horizons, which means executives should not treat every use case as equally mature. The practical implication is to sequence personalization, store operations, pricing, and supply chain AI by readiness and decision rights.',
    relatedPatterns: ['F209', 'F215', 'F233'],
  },
  {
    sourceKey: 'retail_gartner_supply_chain_ai_strategy_2025',
    title: 'Gartner Supply Chain AI Strategy Survey, 2025',
    publisher: 'Gartner',
    publisherUrl: 'https://www.gartner.com',
    sourceUrl: 'https://www.gartner.com/en/newsroom/2025-06-11-gartner-survey-shows-just-23-percent-of-supply-chain-organizations-have-a-formal-ai-strategy',
    contentType: 'benchmark',
    licenseClass: 'attribution',
    publishedAt: '2025-06-11',
    topicTags: ['supply_chain', 'ai_strategy', 'benchmarks'],
    summary: 'Gartner reports that only a minority of surveyed supply chain organizations had a formal AI strategy, despite strong pressure for short-term ROI. The finding gives Sentinel a benchmark for challenging supply chain AI plans that promise transformation but lack portfolio governance.',
    relatedPatterns: ['F218', 'F226', 'F228'],
  },
  {
    sourceKey: 'retail_mckinsey_llm_to_roi_2024',
    title: 'LLM to ROI: How to Scale Gen AI in Retail',
    publisher: 'McKinsey & Company',
    publisherUrl: 'https://www.mckinsey.com',
    sourceUrl: 'https://www.mckinsey.com/industries/retail/our-insights/llm-to-roi-how-to-scale-gen-ai-in-retail',
    contentType: 'research_report',
    licenseClass: 'attribution',
    publishedAt: '2024-08-05',
    topicTags: ['genai', 'roi', 'retail_operations'],
    summary: 'McKinsey emphasizes that retail GenAI value comes from disciplined scaling, operating-model changes, and capabilities in data, technology, and adoption. This is directly relevant to Apex use cases where executive ambition is ahead of workflow integration or measurement design.',
    relatedPatterns: ['F204', 'F231', 'F239'],
  },
  {
    sourceKey: 'retail_mckinsey_state_of_ai_2025',
    title: 'The State of AI in 2025',
    publisher: 'McKinsey & Company',
    publisherUrl: 'https://www.mckinsey.com',
    sourceUrl: 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
    contentType: 'benchmark',
    licenseClass: 'attribution',
    publishedAt: '2025-11-01',
    topicTags: ['ai_adoption', 'operating_model', 'benchmarks'],
    summary: 'McKinsey finds AI usage is widespread but many organizations remain early in rewiring workflows, governance, and value capture. For retail executives, the benchmark separates tool adoption from production value and supports sharper questions about ownership, adoption, and ROI.',
    relatedPatterns: ['F233', 'F236', 'F239'],
  },
  {
    sourceKey: 'retail_deloitte_genai_value',
    title: 'Unlocking Value in Generative AI for Retail',
    publisher: 'Deloitte',
    publisherUrl: 'https://www.deloitte.com',
    sourceUrl: 'https://www.deloitte.com/us/en/what-we-do/capabilities/applied-artificial-intelligence/articles/unlocking-value-generative-ai-retail.html',
    contentType: 'research_report',
    licenseClass: 'attribution',
    publishedAt: '2025-01-01',
    topicTags: ['genai', 'marketing', 'customer_service', 'ecommerce'],
    summary: 'Deloitte describes GenAI in retail as most useful where creativity, interpretation, and contextual decisions shape the customer or employee experience. The retriever can use this source to ground questions about marketing content, service automation, ecommerce experience, and product innovation.',
    relatedPatterns: ['F201', 'F204', 'F207'],
  },
  {
    sourceKey: 'retail_deloitte_state_genai_enterprise_q4',
    title: 'State of Generative AI in the Enterprise, Q4',
    publisher: 'Deloitte',
    publisherUrl: 'https://www.deloitte.com',
    sourceUrl: 'https://www2.deloitte.com/us/en/pages/about-deloitte/articles/press-releases/state-of-generative-ai.html',
    contentType: 'benchmark',
    licenseClass: 'attribution',
    publishedAt: '2024-12-01',
    topicTags: ['genai', 'enterprise_adoption', 'value_realization'],
    summary: 'Deloitte reports that enterprise GenAI leaders balance speed with pragmatism, governance, and patience as they move from experiments to scaled value. For Apex Retail, this helps Sentinel challenge unrealistic AI timelines and missing adoption plans.',
    relatedPatterns: ['F233', 'F236', 'F239'],
  },
  {
    sourceKey: 'retail_bcg_personalization_index_2025',
    title: 'BCG Personalization Index Report 2025',
    publisher: 'Boston Consulting Group',
    publisherUrl: 'https://www.bcg.com',
    sourceUrl: 'https://www.bcg.com/publications/2025/how-consumer-experience-is-changing-across-industries-in-the-age-of-ai',
    contentType: 'research_report',
    licenseClass: 'attribution',
    publishedAt: '2025-06-11',
    topicTags: ['personalization', 'customer_experience', 'ai'],
    summary: 'BCG argues that AI is changing customer experience expectations and that personalization quality increasingly separates leaders from laggards. This supports Apex questions about whether personalization is tied to customer identity, lifecycle economics, and retail media activation.',
    relatedPatterns: ['F200', 'F205', 'F214'],
  },
  {
    sourceKey: 'retail_bcg_personalization_action_2024',
    title: 'Retail Spotlight: Personalization in Action',
    publisher: 'Boston Consulting Group',
    publisherUrl: 'https://www.bcg.com',
    sourceUrl: 'https://www.bcg.com/publications/2024/personalization-in-action',
    contentType: 'benchmark',
    licenseClass: 'attribution',
    publishedAt: '2024-10-01',
    topicTags: ['personalization', 'promotions', 'retail_media'],
    summary: 'BCG states that personalized offers can materially outperform mass promotions while many retailers still underinvest in personalization. For AbarVa, the key is to distinguish personalization ROI from activity metrics by testing incrementality, media yield, and margin impact.',
    relatedPatterns: ['F201', 'F205', 'F214'],
  },
  {
    sourceKey: 'retail_ftc_dark_patterns_report',
    title: 'Bringing Dark Patterns to Light',
    publisher: 'Federal Trade Commission',
    publisherUrl: 'https://www.ftc.gov',
    sourceUrl: 'https://www.ftc.gov/reports/bringing-dark-patterns-light',
    contentType: 'regulation',
    licenseClass: 'public_domain',
    publishedAt: '2022-09-15',
    topicTags: ['dark_patterns', 'consumer_protection', 'subscription'],
    summary: 'The FTC report explains how deceptive interfaces can hide terms, make cancellation difficult, bury fees, or manipulate consent. Retail CX programs should treat conversion optimization, subscription flows, and loyalty enrollment as regulated design surfaces, not just growth experiments.',
    relatedPatterns: ['F205', 'F212', 'F236'],
  },
  {
    sourceKey: 'retail_ftc_amazon_prime_settlement_2025',
    title: 'FTC v. Amazon.com, Inc. ROSCA Case',
    publisher: 'Federal Trade Commission',
    publisherUrl: 'https://www.ftc.gov',
    sourceUrl: 'https://www.ftc.gov/legal-library/browse/cases-proceedings/2123050-amazoncom-inc-rosca-ftc-v',
    contentType: 'enforcement_action',
    licenseClass: 'public_domain',
    publishedAt: '2025-09-25',
    topicTags: ['dark_patterns', 'subscription', 'enforcement'],
    summary: 'The FTC Amazon Prime action is a retail-scale example of subscription enrollment and cancellation design becoming a board-level compliance issue. It gives Sentinel concrete grounding for challenging loyalty, membership, and checkout experiences that optimize conversion at the expense of informed consent.',
    relatedPatterns: ['F205', 'F212', 'F214'],
  },
  {
    sourceKey: 'retail_pci_dss_v4_0_1',
    title: 'PCI DSS v4.0.1 Standard',
    publisher: 'PCI Security Standards Council',
    publisherUrl: 'https://www.pcisecuritystandards.org',
    sourceUrl: 'https://www.pcisecuritystandards.org/standards/pci-dss/',
    contentType: 'framework',
    licenseClass: 'attribution',
    publishedAt: '2025-03-31',
    topicTags: ['payments', 'pci', 'cybersecurity', 'compliance'],
    summary: 'PCI DSS v4.0.1 raises expectations for payment security, including stronger controls over payment pages, access, monitoring, and ongoing risk management. For retailers, checkout AI, tag managers, fraud tools, and third-party scripts must be included in the control surface.',
    relatedPatterns: ['F237', 'F235', 'F208'],
  },
  {
    sourceKey: 'retail_ccpa_consumer_data',
    title: 'California Consumer Privacy Act Consumer Data Rights',
    publisher: 'California Office of the Attorney General',
    publisherUrl: 'https://oag.ca.gov',
    sourceUrl: 'https://oag.ca.gov/privacy/ccpa',
    contentType: 'regulation',
    licenseClass: 'public_domain',
    publishedAt: '2025-01-01',
    topicTags: ['privacy', 'consumer_data', 'ccpa', 'consent'],
    summary: 'CCPA gives California consumers rights over personal information, including access, deletion, correction, opt-out, and limits on sensitive data use. Retail personalization, CDP, loyalty, and retail media programs need consent and preference handling built into activation logic.',
    relatedPatterns: ['F200', 'F205', 'F207'],
  },
  {
    sourceKey: 'retail_forrester_cdp_b2c_2024',
    title: 'The State of Customer Data Platforms for B2C, 2024',
    publisher: 'Forrester',
    publisherUrl: 'https://www.forrester.com',
    sourceUrl: 'https://www.forrester.com/report/the-state-of-customer-data-platforms-for-b2c-2024/RES181967',
    contentType: 'research_report',
    licenseClass: 'licensed',
    publishedAt: '2024-09-01',
    topicTags: ['cdp', 'customer_data', 'b2c', 'personalization'],
    summary: 'Forrester positions CDPs as a benchmarkable capability for B2C marketers, not simply a data repository. For Apex Retail, the relevance is whether the CDP supports identity, activation, governance, and measurement across ecommerce, stores, loyalty, and media.',
    relatedPatterns: ['F200', 'F205', 'F207'],
  },
  {
    sourceKey: 'retail_idc_ai_spending_guide_2025',
    title: 'Worldwide AI and Generative AI Spending Guide, 2025',
    publisher: 'IDC',
    publisherUrl: 'https://www.idc.com',
    sourceUrl: 'https://www.idc.com/eu/data-analytics/spending-guide/',
    contentType: 'benchmark',
    licenseClass: 'licensed',
    publishedAt: '2025-03-01',
    topicTags: ['ai_spend', 'investment_benchmark', 'retail_it'],
    summary: 'IDC spending-guide coverage frames AI and GenAI investment by industry, geography, and use case, which helps compare retail ambition against market spend patterns. The useful synthesis point is that investment benchmarks should be read with use-case readiness, not as permission to fund every pilot.',
    relatedPatterns: ['F233', 'F234', 'F239'],
  },
  {
    sourceKey: 'retail_niq_commerce_trends_ai_2026',
    title: 'The Commerce Revolution: Where East Meets West',
    publisher: 'NielsenIQ',
    publisherUrl: 'https://nielseniq.com',
    sourceUrl: 'https://nielseniq.com/global/en/insights/report/2026/commerce-trends-intelligence/',
    contentType: 'research_report',
    licenseClass: 'registration',
    publishedAt: '2026-05-01',
    topicTags: ['demand_sensing', 'commerce', 'shopper_ai'],
    summary: 'NielsenIQ describes commerce models where AI captures purchase intent and stimulates demand across social, live, quick, and retail media channels. For Apex Retail, the source grounds questions about demand sensing, product discovery, and whether planning signals reflect the new shopper journey.',
    relatedPatterns: ['F203', 'F215', 'F221'],
  },
  {
    sourceKey: 'retail_oliver_wyman_workforce_ai',
    title: 'Transforming Retail Workforce: From AI to Pay and Skills',
    publisher: 'Oliver Wyman',
    publisherUrl: 'https://www.oliverwyman.com',
    sourceUrl: 'https://www.oliverwyman.com/our-expertise/journals/boardroom/future-of-the-workforce-retail-consumer-goods.html',
    contentType: 'research_report',
    licenseClass: 'attribution',
    publishedAt: '2025-01-01',
    topicTags: ['workforce', 'skills', 'automation', 'store_operations'],
    summary: 'Oliver Wyman argues retail workforce models must evolve as AI and blended roles change the skills expected in stores, logistics, marketing, and customer engagement. This gives Sentinel grounding for store associate copilots and workforce scheduling plans that lack change management.',
    relatedPatterns: ['F202', 'F217', 'F231'],
  },
  {
    sourceKey: 'retail_kearney_consumer_goods_ai_ops',
    title: 'AI-Powered Solutions for Consumer Goods Operations',
    publisher: 'Kearney',
    publisherUrl: 'https://www.kearney.com',
    sourceUrl: 'https://www.kearney.com/service/digital-analytics/customer-and-growth/ai-powered-solutions-for-consumer-goods-operations',
    contentType: 'research_report',
    licenseClass: 'attribution',
    publishedAt: '2025-01-01',
    topicTags: ['supply_chain', 'consumer_goods', 'predictive_operations'],
    summary: 'Kearney describes AI-powered operations use cases spanning retail real estate, supply chain risk visibility, and predictive analysis. The core point for AbarVa is that operational AI needs decision workflows and intervention paths, not only dashboards or forecasts.',
    relatedPatterns: ['F218', 'F226', 'F228'],
  },
  {
    sourceKey: 'retail_ey_genai_strategy_governance',
    title: 'Five GenAI Focus Areas for Consumer and Retail Strategy',
    publisher: 'EY',
    publisherUrl: 'https://www.ey.com',
    sourceUrl: 'https://www.ey.com/en_us/retail/five-genai-focus-areas-for-consumer-retail-strategy',
    contentType: 'framework',
    licenseClass: 'attribution',
    publishedAt: '2025-01-01',
    topicTags: ['genai', 'governance', 'strategy', 'cybersecurity'],
    summary: 'EY frames retail GenAI success around strategy, governance, technology, data, and cybersecurity, with cross-functional leadership alignment. This is useful for surfacing contradictions where business sponsors push AI timelines while IT, data, privacy, and cyber prerequisites remain unresolved.',
    relatedPatterns: ['F234', 'F236', 'F237'],
  },
];

async function upsertRows(
  sb: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  onConflict: string,
): Promise<void> {
  const batchSize = 50;
  for (let index = 0; index < rows.length; index += batchSize) {
    const { error } = await sb.from(table).upsert(rows.slice(index, index + batchSize), { onConflict });
    if (error) throw error;
  }
}

function sourceRows() {
  return SOURCES.map((source) => ({
    source_key: source.sourceKey,
    title: source.title,
    publisher: source.publisher,
    publisher_url: source.publisherUrl,
    source_url: source.sourceUrl,
    content_type: source.contentType,
    license_class: source.licenseClass,
    license_notes: 'Seeded public metadata and short AbarVa-authored summary; retrieve source content only under applicable license terms.',
    industry_tags: ['RETAIL'],
    topic_tags: source.topicTags,
    published_at: source.publishedAt,
    half_life_days: source.contentType === 'regulation' || source.contentType === 'framework' ? 730 : 365,
    pinecone_namespace: 'retail-knowledge-sources',
    status: 'active',
    summary: source.summary,
    ingestion_notes: {
      seeded_by: 'seed-retail-knowledge-sources',
      summary_source: 'AbarVa-authored synthesis from public source metadata',
    },
  }));
}

function graphEdges() {
  return SOURCES.flatMap((source) => [
    ...source.topicTags.slice(0, 4).map((topic) => ({
      id: deterministicUuid(`edge:${source.sourceKey}:supports_topic:${topic}`),
      from_node_type: 'knowledge_source',
      from_node_id: source.sourceKey,
      edge_type: 'supports_topic',
      to_node_type: 'retail_capability',
      to_node_id: `retail:${slugify(topic)}`,
      vertical: 'retail',
      weight: 0.74,
      evidence: { seeded_by: 'seed-retail-knowledge-sources', publisher: source.publisher },
      source_key: source.sourceKey,
    })),
    ...source.relatedPatterns.map((patternCode) => ({
      id: deterministicUuid(`edge:${patternCode}:sourced_from:${source.sourceKey}`),
      from_node_type: 'genome_pattern',
      from_node_id: patternCode,
      edge_type: 'sourced_from',
      to_node_type: 'knowledge_source',
      to_node_id: source.sourceKey,
      vertical: 'retail',
      weight: 0.8,
      evidence: { seeded_by: 'seed-retail-knowledge-sources', publisher: source.publisher },
      source_key: source.sourceKey,
    })),
  ]);
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();

  await upsertRows(sb, 'knowledge_sources', sourceRows(), 'source_key');
  await upsertRows(
    sb,
    'intelligence_graph_edges',
    graphEdges(),
    'from_node_type,from_node_id,edge_type,to_node_type,to_node_id',
  );

  const { count: sourceCount, error: sourceCountError } = await sb
    .from('knowledge_sources')
    .select('id', { count: 'exact', head: true })
    .eq('pinecone_namespace', 'retail-knowledge-sources')
    .eq('status', 'active');
  if (sourceCountError) throw sourceCountError;

  const { count: edgeCount, error: edgeCountError } = await sb
    .from('intelligence_graph_edges')
    .select('id', { count: 'exact', head: true })
    .eq('vertical', 'retail')
    .in('source_key', SOURCES.map((source) => source.sourceKey));
  if (edgeCountError) throw edgeCountError;

  console.log(`Seeded retail knowledge sources: ${sourceCount ?? 0}`);
  console.log(`Seeded retail knowledge graph edges: ${edgeCount ?? 0}`);
}

const isDirect = process.argv[1] ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href : false;
if (isDirect) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
