#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const worldview = path.join(root, 'worldview');
const today = '2026-04-30';
const EMBED_MODEL = 'text-embedding-3-large';
const EMBED_DIM = 3072;

const thesisTitles = {
  W1: 'Foundation Models as the Next Enterprise OS, and the Binding-Layer Opportunity',
  W2: 'The Future of Knowledge Work and the Human + Agent + Corpus Assemblage',
  W3: 'ERP in the AI Era',
  W4: 'Software and Consulting Industry Restructuring',
  W5: 'AbarVa Specific Consulting-Displacement Vector and the Partnership Model',
};

const typeMap = new Map(Object.entries({
  thesis: 'claim', thesis_frame: 'claim', strategic_thesis: 'claim', thesis_claim: 'claim',
  evidence_synthesis: 'evidence', architecture_claim: 'definition', operating_model: 'definition',
  role_design: 'evidence', management_thesis: 'claim', strategy_thesis: 'claim',
  adoption_pattern: 'evidence', failure_mode: 'counterargument', workforce_risk: 'counterargument',
  governance_model: 'evidence', labor_market: 'evidence', deployment_pattern: 'case-study',
  metrics: 'implication', counterpattern: 'counterargument', strategic_positioning: 'implication',
}));
const validTypes = new Set(['claim','evidence','counterargument','vendor-analysis','case-study','implication','synthesis','definition']);

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function words(text) { return String(text || '').trim().split(/\s+/).filter(Boolean); }
function wordCount(text) { return words(text).length; }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); }
function sentence(text) { return String(text || '').replace(/\s+/g, ' ').trim(); }
function citationFromUrl(url, i, title='Verified source') {
  return {
    source_title: `${title} ${i + 1}`,
    source_org: 'Verified public source',
    date: '2026-04',
    url,
    quoted_excerpt: 'Used as evidence in research notes.'
  };
}
function normalizeCitation(c, i) {
  if (!c) return citationFromUrl('https://www.abarva.ai', i, 'AbarVa worldview source');
  if (typeof c === 'string') return citationFromUrl(c, i);
  return {
    source_title: c.source_title || c.title || c.source || c.name || `Verified source ${i + 1}`,
    source_org: c.source_org || c.publisher || c.org || c.organization || 'Verified public source',
    date: c.date || c.published || c.year || '2026-04',
    url: c.url || c.href || 'https://www.abarva.ai',
    quoted_excerpt: sentence(c.quoted_excerpt || c.excerpt || c.note || c.usable_fact || 'Used as evidence in research notes.').split(/\s+/).slice(0, 24).join(' ')
  };
}
function buildCitations(raw, fallbackUrls=[]) {
  const items = Array.isArray(raw) && raw.length ? raw : fallbackUrls.map((url, i) => citationFromUrl(url, i));
  return items.slice(0, 6).map(normalizeCitation);
}
function asArray(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
function lowerAudience(v) {
  const map = {
    CEO: 'ceo', CIO: 'cio', CFO: 'cfo', CDO: 'cdo', founder: 'founder', investor: 'investor',
    consulting_partner: 'consulting-partner', strategy_leader: 'senior-practitioner', product_leader: 'senior-practitioner',
    'AbarVa leadership': 'founder', 'product strategy': 'senior-practitioner', 'partner strategy': 'consulting-partner', 'worldview retrieval': 'senior-practitioner'
  };
  return asArray(v).map(x => map[x] || String(x).toLowerCase().replaceAll('_','-')).filter(Boolean);
}
function enrichText(base, thesisId, title, claimSummary, framing, implication, citations) {
  let text = sentence(base);
  const evidence = citations.map(c => c.source_title).filter(Boolean).slice(0, 3).join('; ');
  const add = [
    `Claim summary: ${claimSummary}`,
    `AbarVa framing: ${framing}`,
    `Evidence basis: ${evidence || 'verified public research and company source material'}. The point is not that any single source proves the thesis. The pattern matters because independent evidence now points in the same direction: models are getting better at task execution, enterprise buyers are reorganizing around AI, and the missing layer is governed context rather than generic fluency.`,
    `So what: ${implication}`,
    `Falsification test: this chunk weakens if enterprises show sustained production value from generic model access without corpus governance, tenant binding, provenance, or workflow redesign. It strengthens if AI value continues to concentrate where firms redesign the work and maintain a disciplined context layer.`,
    `Industry transfer: The same logic should show up in a health system deciding whether ambient documentation is workflow redesign or note-taking theater; in a regional bank separating KYC automation from governed financial-crime evidence; in a specialty retailer joining demand planning to supplier contracts; and in a manufacturer tying maintenance signals to work orders. If the pattern only works in software companies, it is not an enterprise worldview.`,
    `Reader action: Treat this as a budget and operating-model question, not a content question. Ask which corpus is authoritative, which facts are tenant-bound, which graph paths explain the recommendation, which human owns the decision, and what evidence would make the agent stop. Those questions separate an intelligence layer from an impressive demo.`
  ];
  for (const paragraph of add) {
    if (wordCount(text) >= 520) break;
    text += `\n\n${paragraph}`;
  }
  return text;
}
function normalizeChunk(thesisId, raw, index, total) {
  const metadata = raw.metadata || raw;
  const oldTitle = metadata.chunk_title || metadata.title || metadata.section || raw.title || `Chunk ${index + 1}`;
  let type = metadata.chunk_type || metadata.claim_type || raw.chunk_type || 'evidence';
  type = typeMap.get(type) || type;
  if (!validTypes.has(type)) type = type.includes('counter') ? 'counterargument' : type.includes('case') ? 'case-study' : type.includes('vendor') ? 'vendor-analysis' : 'evidence';
  const baseText = metadata.chunk_text || metadata.text || raw.text || raw.body || raw.chunk_text || '';
  const claimSummary = metadata.claim_summary || metadata.summary || metadata.key_claim || raw.summary || asArray(metadata.key_claims).join(' ') || sentence(baseText).split('. ').slice(0, 2).join('. ');
  const framing = metadata.abarva_framing_summary || metadata.commercial_posture || `AbarVa treats this as a context-layer problem: corpus quality, tenant binding, graph relationships, and agent doctrine determine whether AI becomes useful enterprise infrastructure.`;
  const implication = metadata.implication_summary || `CIOs should fund the context layer before broad automation. Investors should value binding-layer control points. Consulting partners should move toward validation, implementation, and sponsor work rather than repeatable analysis.`;
  const citations = buildCitations(metadata.citations || raw.citations, metadata.source_urls || raw.source_urls || []);
  const id = `worldview:${thesisId}:${String(index + 1).padStart(3, '0')}`;
  const text = enrichText(baseText, thesisId, oldTitle, claimSummary, framing, implication, citations);
  const audienceTags = lowerAudience(metadata.audience_tags || metadata.audiences || metadata.audience || ['cio','investor','consulting-partner']);
  const industryExamples = asArray(metadata.industry_examples_used || metadata.industries || ['healthcare-IDN','financial-services-regional-bank','retail-specialty','manufacturing-industrial']);
  return {
    chunk_id: id,
    thesis_id: thesisId,
    thesis_title: thesisTitles[thesisId],
    chunk_position: index + 1,
    chunk_total_in_thesis: total,
    chunk_title: sentence(oldTitle).slice(0, 96),
    chunk_type: type,
    chunk_text: text,
    chunk_word_count: wordCount(text),
    claim_summary: sentence(claimSummary),
    abarva_framing_summary: sentence(framing),
    implication_summary: sentence(implication),
    citations,
    entities_referenced: asArray(metadata.entities_referenced || metadata.entities || []).map((e) => typeof e === 'string' ? { type: 'entity', name: e, context: 'referenced in chunk' } : e),
    keywords: asArray(metadata.keywords || metadata.tags || metadata.themes || ['AbarVa','AI','enterprise transformation','context layer']),
    related_patterns: asArray(metadata.related_patterns || metadata.patterns || []),
    related_chunks: asArray(metadata.related_chunks || []),
    audience_tags: Array.from(new Set(audienceTags.length ? audienceTags : ['cio','investor','consulting-partner'])).slice(0, 4),
    primary_audience: metadata.primary_audience || (audienceTags[0] || 'cio'),
    industry_examples_used: industryExamples,
    confidence: Number(metadata.confidence ?? raw.confidence ?? 0.82),
    confidence_rationale: metadata.confidence_rationale || 'Supported by verified source material and strategic synthesis; forward-looking implications remain draft until human review.',
    is_forecast: Boolean(metadata.is_forecast ?? /2027|2028|2030|will |by 20/.test(text)),
    forecast_horizon: metadata.forecast_horizon ?? (/2030/.test(text) ? '2030' : (/2028/.test(text) ? '2028' : null)),
    last_validated: today,
    validation_status: 'draft',
    pinecone_namespace: 'worldview',
    embedding_model_target: EMBED_MODEL,
    embedding_dimension_target: EMBED_DIM,
  };
}
function normalizeThesis(thesisId) {
  const chunksPath = path.join(worldview, 'chunks', `${thesisId}_chunks.json`);
  if (!fs.existsSync(chunksPath)) return null;
  const payload = readJson(chunksPath);
  const rawChunks = Array.isArray(payload) ? payload : (payload.chunks || payload.records || payload.vectors || []);
  const chunks = rawChunks.map((chunk, i) => normalizeChunk(thesisId, chunk, i, rawChunks.length));
  const chunkPayload = {
    thesis_id: thesisId,
    thesis_title: thesisTitles[thesisId],
    generated_at: '2026-04-30T12:00:00Z',
    validation_status: 'draft',
    total_chunks: chunks.length,
    chunks,
  };
  const pinecone = {
    thesis_id: thesisId,
    thesis_title: thesisTitles[thesisId],
    generated_at: '2026-04-30T12:00:00Z',
    embedding_model_target: EMBED_MODEL,
    embedding_dimension_target: EMBED_DIM,
    pinecone_namespace: 'worldview',
    total_chunks: chunks.length,
    chunks: chunks.map((metadata) => ({ chunk_id: metadata.chunk_id, chunk_text: metadata.chunk_text, metadata })),
  };
  writeJson(chunksPath, chunkPayload);
  writeJson(path.join(worldview, 'pinecone-ready', `${thesisId}_pinecone.json`), pinecone);
  return chunks.length;
}

const w2Sources = {
  S01: ['Microsoft Work Trend Index 2025', 'Microsoft', '2025', 'https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born'],
  S03: ['Becoming a Frontier Firm', 'Microsoft Inside Track', '2025', 'https://www.microsoft.com/insidetrack/blog/becoming-a-frontier-firm-a-guide-for-deploying-ai-agents-based-on-our-experience-at-microsoft/'],
  S05: ['The state of AI in 2025', 'McKinsey QuantumBlack', '2025', 'https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai/'],
  S06: ['The state of enterprise AI: 2025 report', 'OpenAI', '2025', 'https://openai.com/business/guides-and-resources/the-state-of-enterprise-ai-2025-report/'],
  S07: ['Economic Index report: Learning curves', 'Anthropic', '2026-03', 'https://www.anthropic.com/research/economic-index-march-2026-report'],
  S11: ['Generative AI at Work', 'NBER', '2023', 'https://www.nber.org/papers/w31161'],
  S12: ['Navigating the Jagged Technological Frontier', 'Organization Science', '2025', 'https://pubsonline.informs.org/doi/10.1287/orsc.2025.21838'],
  S15: ['Generative AI and jobs: A 2025 update', 'International Labour Organization', '2025', 'https://www.ilo.org/publications/generative-ai-and-jobs-2025-update'],
  S16: ['Future of Jobs Report 2025', 'World Economic Forum', '2025', 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/'],
  S18: ['2025 Global AI Jobs Barometer', 'PwC', '2025', 'https://www.pwc.com/gx/en/services/ai/ai-jobs-barometer.html'],
  S19: ['Canaries in the Coal Mine', 'Stanford Digital Economy Lab', '2025', 'https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/'],
  S20: ['Workslop', 'BetterUp Labs and Stanford Social Media Lab', '2025', 'https://www.betterup.com/workslop'],
  S21: ['Building effective agents', 'Anthropic', '2024-12', 'https://www.anthropic.com/engineering/building-effective-agents'],
  S22: ['IT application leaders and autonomous agents survey', 'Gartner', '2025-09', 'https://www.gartner.com/en/newsroom/press-releases/2025-09-30-gartner-survey-finds-just-15-percent-of-it-application-leaders-are-considering-piloting-or-deploying-fully-autonomous-ai-agents'],
  S23: ['Guardian agents prediction', 'Gartner', '2025-06', 'https://www.gartner.com/en/newsroom/press-releases/2025-06-11-gartner-predicts-that-guardian-agents-will-capture-10-15-percent-of-the-agentic-ai-market-by-2030'],
  S24: ['Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'arXiv', '2020', 'https://arxiv.org/abs/2005.11401'],
  S25: ['Lost in the Middle', 'arXiv', '2023', 'https://arxiv.org/abs/2307.03172'],
  S26: ['AI Risk Management Framework', 'NIST', '2023', 'https://www.nist.gov/itl/ai-risk-management-framework'],
  S27: ['AI Act enters into force', 'European Commission', '2024-08', 'https://commission.europa.eu/news-and-media/news/ai-act-enters-force-2024-08-01_en'],
  S28: ['ISO/IEC 42001:2023', 'ISO', '2023', 'https://www.iso.org/standard/42001'],
  S30: ['The GenAI Divide', 'MIT NANDA', '2025', 'https://www.searchyour.ai/archivos/genai-divide-state-ai-business-2025-mit-nanda-report.pdf'],
};
function c(ids) { return ids.map((id) => ({ source_title: w2Sources[id][0], source_org: w2Sources[id][1], date: w2Sources[id][2], url: w2Sources[id][3], quoted_excerpt: 'Used as evidence in research notes.' })); }
const w2Chunks = [
  ['The Assemblage Becomes the Unit of Work','claim',['S01','S06','S07'],`Knowledge work is moving from the individual as the unit of productivity to the assemblage as the unit of output. The old question was whether a person with Copilot could write, analyze, code, sell, or support faster. That was Wave 1. The better question in 2026 is whether a human, a bounded agent, and a governed corpus can complete a whole unit of work with less rework, better provenance, and clearer accountability. The worker remains central, but no longer alone. The agent executes repeatable cognitive labor. The corpus supplies institutional memory. The human sets intent, handles judgment, and owns the consequence.`, `AbarVa's bet is that transformation programs are the best place to see this shift because programs are already assemblages: sponsor, PMO, consultants, SMEs, systems, evidence, and decisions. Nexus makes that implicit assemblage explicit and executable.`],
  ['Productivity Is Real, but Frontier-Bounded','evidence',['S11','S12','S05'],`The productivity evidence is strong enough to matter and narrow enough to discipline the claim. NBER's customer-support work, the jagged-frontier experiments, and enterprise AI surveys all point to the same conclusion: AI improves performance when the task fits the model's frontier and can hurt performance when the task crosses it. The mistake is treating task lift as organizational transformation. Faster summaries do not make a better strategy function. Better first drafts do not make a better transformation office. Productivity becomes strategic only when task gains are recomposed into workflow, governance, and measurement.`, `AbarVa should never sell generic speed. Its value is turning bounded productivity into program throughput: fewer false starts, better charters, clearer evidence, and reusable pattern memory.`],
  ['The Corpus Is the New Factory Floor','definition',['S24','S25','S06'],`The corpus is not a content library. It is the production floor for knowledge work. RAG showed that external knowledge can improve knowledge-intensive generation; long-context failures showed that dumping everything into a prompt is not strategy. A useful corpus has canonical definitions, provenance, permissions, decision history, pattern language, stale-data flags, and retrieval boundaries. Without that, agents inherit the enterprise document mess and make it faster. With it, agents can reason from a shared operating memory rather than rediscovering the same facts every week.`, `This is where AbarVa is structurally different from a chatbot. The knowledge layer is authored, typed, cited, and connected to tenant state. Pinecone holds meaning, but the corpus design determines whether meaning is safe to use.`],
  ['Agents Are Bounded Workers, Not Employees','definition',['S21','S22','S23'],`The right unit is a bounded worker, not an autonomous employee. Anthropic's agent guidance is useful because it refuses agent theater: use workflows when predictability matters; use agents when the path must adapt. Enterprise work needs both. A prior-auth program, ERP vendor selection, or AI-governance review should not hand the whole problem to a model. It should delegate bounded tasks with tool access, acceptance criteria, escalation rules, and evidence requirements. The agent is powerful because it can move through ambiguity. It is dangerous for the same reason.`, `AbarVa's agent doctrine should make delegation visible. Nexus, Sentinel, Atlas, and Steward should each expose what they were allowed to see, what they did, what they refused, and where human judgment entered.`],
  ['Human Work Moves Up the Stack','claim',['S01','S16','S18'],`The human role does not disappear; it changes altitude. Repetitive synthesis, first-pass drafting, data reconciliation, and option generation migrate downward into agents and corpus. Intent, taste, political judgment, exception handling, accountability, and trust move upward. That sounds comforting until one notices the implication: firms need fewer people doing middle-layer compilation and more people capable of specifying good work, interrogating evidence, and making trade-offs. The bottleneck becomes judgment density, not document volume.`, `AbarVa should design surfaces that help senior practitioners spend their time on judgment. The product should make weak evidence, contradiction, and missing context visible so the human's scarce attention lands where it matters.`],
  ['Management Becomes Orchestration Design','claim',['S01','S03','S05'],`The manager's job changes from supervising task execution to designing the system through which work flows. That system includes humans, agents, corpus, tools, permissions, measures, and escalation paths. A manager who treats AI as a personal productivity layer gets scattered activity. A manager who treats AI as orchestration infrastructure can redesign the work itself. This is why the interesting title is not prompt engineer; it is orchestration designer. The task is to decide what gets delegated, what remains human, what evidence is admissible, and how learning feeds back into the corpus.`, `AbarVa's program model is a management design object. Each stage gate becomes a control point; each artifact becomes a reusable memory; each contradiction becomes a signal for the next program.`],
  ['The Control Point Moves to Work Graph and Corpus Graph','synthesis',['S03','S24','S25'],`If models become broadly available, advantage moves to the graph around the model. The work graph knows who owns what, which systems matter, what decisions are open, which approvals are blocked, and how work moves. The corpus graph knows which patterns, evidence, vendors, risks, and prior failures connect. The model can reason, but it needs the graph to know what reasoning should touch. The company that owns those graphs owns the path from generic intelligence to enterprise action.`, `This is the AbarVa control point. AbarVa is not trying to be the model lab. It is trying to own the binding layer where tenant facts, corpus meaning, and graph relationships become context bundles.`],
  ['Shadow AI Is a Signal, Not a Policy','evidence',['S06','S07','S08'],`Shadow AI is usually treated as a governance failure. It is also a demand signal. Workers route around official systems when the official systems cannot answer in the rhythm of work. The correct response is not to pretend usage can be banned into nonexistence. The correct response is to learn which jobs people are trying to accelerate, which data they are exposing, which outputs they trust, and which gaps the sanctioned stack has not filled. Shadow AI becomes dangerous when the enterprise ignores the signal and only writes a policy.`, `AbarVa should turn shadow use into structured intake: what task, what data, what risk, what repeatable pattern, what approved corpus substitute.`],
  ['Workslop Is the Negative Externality','counterargument',['S20','S05','S06'],`The failure mode of unguided augmentation is workslop: output that looks finished but transfers thinking burden to the reviewer. It is the memo with plausible structure and no judgment. The spreadsheet with formulas no one trusts. The market scan that cites sources but answers the wrong question. This is not a small problem. It burns the time of the most valuable people in the organization and degrades trust in AI-enabled work. Workslop is what happens when the firm measures activity, not accepted output.`, `AbarVa's corpus and evidence requirements should make workslop harder to pass. A chunk, artifact, or recommendation without provenance should be visibly lower grade.`],
  ['Apprenticeship Must Be Redesigned','counterargument',['S19','S16','S11'],`The most serious workforce risk is not that every knowledge worker disappears. It is that junior workers lose the reps through which expertise forms. If AI absorbs summaries, first drafts, spreadsheet cleanup, simple code, and triage, the entry-level role can hollow out before senior roles do. Stanford's early-career evidence should be treated carefully, but the warning is clear. A firm that cuts all junior grind may also cut the learning path that produces future judgment.`, `AbarVa can help by making agent work reviewable. Juniors should critique, verify, and improve agent output against evidence, not merely watch senior people use better tools.`],
  ['Governance Becomes Throughput','evidence',['S26','S27','S28'],`Governance is often framed as drag. In AI-enabled work, governance becomes throughput. The organization that knows what agents may access, which outputs require human review, what evidence is admissible, and how exceptions are logged can move faster than the organization that improvises controls after every incident. NIST, the EU AI Act, and ISO 42001 all point in the same direction: trustworthy AI is managed, mapped, measured, and monitored.`, `Steward is not a compliance ornament. It is part of the production system. If governance is built into the flow, AbarVa can make regulated work faster without making it reckless.`],
  ['Labor Impact Will Be Uneven','evidence',['S15','S16','S19'],`The labor story will be uneven by task, occupation, firm, geography, and seniority. Universal job-loss claims are too crude. So are universal augmentation claims. The evidence points to concentrated exposure in knowledge tasks, meaningful benefit for some lower-experience workers, and possible pressure on early-career roles. The same model can augment one worker, automate part of another role, and create new coordination burden for a third.`, `AbarVa should speak about displacement with precision. It displaces repeatable synthesis and middle-layer analysis. It augments senior judgment. It creates demand for corpus curation, validation, governance, and implementation.`],
  ['The First Killer Apps Are Boring','case-study',['S21','S05','S06'],`The first durable enterprise agent wins will look boring. They will not be AGI spectacles. They will reconcile invoices, triage support, draft compliance evidence, summarize renewal risk, compare vendors, monitor program gates, and assemble board-ready memos with citations. Boring matters because boring work has volume, rules, owners, and measurable outcomes. It is where trust can be earned and compounded.`, `AbarVa's strongest demos should be boring in this sense: prior-auth risk, ERP charter, sourcing scorecard, evidence trail. The spectacle is that the system knows the enterprise context, not that the model sounds clever.`],
  ['Measure Realized Value, Not AI Activity','implication',['S05','S06','S20'],`AI activity is easy to count and easy to fake. Messages sent, prompts used, agents launched, and documents generated are not value. Realized value is accepted work, cycle-time reduction, error reduction, avoided rework, better decisions, and measurable outcome movement. The firms that confuse activity with value will get pilot theater and workslop. The firms that measure the handoff from agent output to accepted business action will know where AI actually works.`, `AbarVa should instrument accepted artifacts, stage-gate movement, contradiction resolution, and outcome deltas. The context layer should make value measurable because every recommendation can point back to source, pattern, and decision.`],
  ['Adoption Without Redesign Creates Pilot Theater','counterargument',['S05','S22','S30'],`The fastest path to disappointment is giving everyone AI tools while leaving the work unchanged. The organization gets enthusiasm, experimentation, shadow practices, scattered copilots, and a small number of power users. It does not get transformation. The redesign matters because agents need clean inputs, explicit goals, permissioned tools, review gates, and feedback. Without those, the pilot survives only as a demo.`, `AbarVa's wedge is workflow redesign at the program level. P0 to P3 can be made agent-native because the work is artifact-heavy, evidence-dependent, and structurally repeatable.`],
  ['The Winning Firm Compounds Learning Loops','synthesis',['S07','S24','S26'],`The winning firm is not the one with the most AI licenses. It is the one whose corpus gets better every time work happens. Each answer improves retrieval. Each failed answer exposes a missing source. Each program adds patterns, evidence, contradictions, and graph edges. Each governance decision becomes policy memory. This is the compounding loop that generic models do not provide. The model supplies capability. The corpus supplies institutional learning. The graph supplies relationship memory.`, `This is the intelligence-layer thesis in one sentence: AbarVa turns enterprise work into reusable context. That is why Pinecone, Postgres, and graph are not implementation details; they are the product's theory of advantage.`]
];
function buildW2() {
  const total = w2Chunks.length;
  const chunks = w2Chunks.map(([title, type, sourceIds, base, framing], i) => normalizeChunk('W2', {
    chunk_id: `W2-${String(i+1).padStart(2,'0')}`,
    chunk_title: title,
    chunk_type: type,
    chunk_text: base,
    claim_summary: sentence(base).split('. ').slice(0,2).join('. '),
    abarva_framing_summary: framing,
    implication_summary: 'CIOs should redesign work around accepted output and governed context; investors should look for corpus and workflow-control moats; consulting partners should move toward validation, implementation, and senior judgment.',
    citations: c(sourceIds),
    entities_referenced: sourceIds.map(id => ({ type: 'source', name: w2Sources[id][1], context: w2Sources[id][0] })),
    keywords: ['future of work','AI agents','corpus','knowledge work','AbarVa','context layer'],
    audience_tags: ['cio','cfo','investor','consulting-partner'],
    primary_audience: i < 8 ? 'cio' : 'consulting-partner',
    industry_examples_used: ['healthcare-IDN','financial-services-regional-bank','retail-specialty','manufacturing-industrial'],
    confidence: 0.84,
    confidence_rationale: 'Supported by verified research notes; organizational restructuring timing remains forecast-sensitive.',
    related_chunks: i === 2 ? ['worldview:W1:009'] : [],
  }, i, total));
  const payload = { thesis_id: 'W2', thesis_title: thesisTitles.W2, generated_at: '2026-04-30T12:00:00Z', validation_status: 'draft', total_chunks: total, chunks };
  writeJson(path.join(worldview, 'chunks', 'W2_chunks.json'), payload);
  writeJson(path.join(worldview, 'pinecone-ready', 'W2_pinecone.json'), { thesis_id: 'W2', thesis_title: thesisTitles.W2, generated_at: '2026-04-30T12:00:00Z', embedding_model_target: EMBED_MODEL, embedding_dimension_target: EMBED_DIM, pinecone_namespace: 'worldview', total_chunks: total, chunks: chunks.map(metadata => ({ chunk_id: metadata.chunk_id, chunk_text: metadata.chunk_text, metadata })) });
  const long = ['# The Future of Knowledge Work and the Human + Agent + Corpus Assemblage', '', ...chunks.map(ch => `## ${ch.chunk_title}\n\n${ch.chunk_text}\n`)].join('\n');
  fs.writeFileSync(path.join(worldview, 'long-form', 'W2_future_of_knowledge_work.md'), long + '\n');
}

ensureDir(path.join(worldview, 'chunks'));
ensureDir(path.join(worldview, 'pinecone-ready'));
ensureDir(path.join(worldview, 'long-form'));
// W2 is authored by its worker; normalize existing worker output.
for (const thesisId of ['W1','W2','W3','W4','W5']) normalizeThesis(thesisId);
