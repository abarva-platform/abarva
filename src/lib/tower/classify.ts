import { getAnthropicClient } from '@/lib/agent/stream';

export type TowerDataType =
  | 'portfolio'
  | 'usage'
  | 'value'
  | 'risk'
  | 'cost'
  | 'engagement_doc'
  | 'mixed'
  | 'unknown';

export interface ClassifierResult {
  data_type: TowerDataType;
  confidence: number;
  detected_columns: string[];
  period_hint: string | null;
  reasoning: string;
}

const ALLOWED: TowerDataType[] = [
  'portfolio',
  'usage',
  'value',
  'risk',
  'cost',
  'engagement_doc',
  'mixed',
  'unknown',
];

export async function classifyUploadContent(args: {
  filename: string;
  mimeType: string | null;
  sample: string;
}): Promise<ClassifierResult> {
  const prompt = `You are classifying a file uploaded to AbarVa's Control Tower. Determine which of these data types best fits, based on filename + sample content:

- portfolio: AI use case inventory (one row per use case, with name, owner, stage, systems, etc.)
- usage: Adoption metrics (DAU, WAU, interactions, drop-off)
- value: Business value data (baseline, target, observed for cost/revenue/efficiency)
- risk: Risk & compliance data (data classification, governance approvals, bias incidents)
- cost: Spend data (cloud billing, vendor invoices, LLM usage costs)
- engagement_doc: Engagement-context document (policy PDF, org chart, contract) → routes to Pinecone
- mixed: Multi-dimension export
- unknown: Can't determine

FILENAME: ${args.filename}
MIME TYPE: ${args.mimeType ?? 'unknown'}
SAMPLE (first 2KB):
"""
${args.sample.slice(0, 2000)}
"""

Return ONLY JSON:
{
  "data_type": "portfolio"|"usage"|"value"|"risk"|"cost"|"engagement_doc"|"mixed"|"unknown",
  "confidence": 0.0 to 1.0,
  "detected_columns": ["col1","col2"],
  "period_hint": "YYYY-MM range or null",
  "reasoning": "1-sentence why"
}`;

  try {
    const response = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('classifier: no JSON in response');
    const parsed = JSON.parse(match[0]) as Partial<ClassifierResult>;
    const data_type = ALLOWED.includes(parsed.data_type as TowerDataType)
      ? (parsed.data_type as TowerDataType)
      : 'unknown';
    return {
      data_type,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      detected_columns: Array.isArray(parsed.detected_columns) ? parsed.detected_columns : [],
      period_hint: typeof parsed.period_hint === 'string' ? parsed.period_hint : null,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  } catch (err) {
    console.error('[classify-upload]', err);
    return {
      data_type: 'unknown',
      confidence: 0,
      detected_columns: [],
      period_hint: null,
      reasoning: 'classifier failed',
    };
  }
}
