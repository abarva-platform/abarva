'use client';

import { useMemo, useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AvaAskMark } from '@/components/agent-answer/AvaAskMark';

interface BriefSection {
  id: string;
  title: string;
  summary: string;
  facts: string[];
  citationIds: string[];
}

interface BriefCitation {
  id: string;
  label: string;
  sourceBasis: string;
  confidence?: string;
}

interface BriefingPayload {
  generatedAt: string;
  executiveRead: string;
  sections: BriefSection[];
  recommendedQuestions: string[];
  citations: BriefCitation[];
  brokerWarnings: string[];
}

interface AnswerPayload {
  question: string;
  answer: string;
  facts: string[];
  citationIds: string[];
  confidence: 'high' | 'medium' | 'low';
  missingContext: string[];
}

interface Props {
  moveId: string;
}

function citationLabel(citations: BriefCitation[], id: string): string {
  return citations.find((citation) => citation.id === id)?.label ?? id;
}

export function NexusCurrentStateBriefingPanel({ moveId }: Props) {
  const [briefing, setBriefing] = useState<BriefingPayload | null>(null);
  const [answer, setAnswer] = useState<AnswerPayload | null>(null);
  const [question, setQuestion] = useState('What should the CXO decide next?');
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const citationsById = useMemo(() => {
    const map = new Map<string, BriefCitation>();
    for (const citation of briefing?.citations ?? []) map.set(citation.id, citation);
    return map;
  }, [briefing]);

  async function generateBrief() {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch(`/api/v1/programs/${moveId}/nexus/current-state-brief`, {
        method: 'GET',
      });
      if (!res.ok) throw new Error(`Briefing failed (${res.status})`);
      const json = (await res.json()) as { briefing: BriefingPayload };
      setBriefing(json.briefing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Briefing failed');
    } finally {
      setLoading(false);
    }
  }

  async function askQuestion(nextQuestion = question) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;
    setAsking(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/programs/${moveId}/nexus/current-state-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });
      if (!res.ok) throw new Error(`Question failed (${res.status})`);
      const json = (await res.json()) as { answer: AnswerPayload };
      setQuestion(trimmed);
      setAnswer(json.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Question failed');
    } finally {
      setAsking(false);
    }
  }

  return (
    <section
      aria-labelledby="nexus-current-state-brief-heading"
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        background: SHELL.PAPER,
        borderRadius: 8,
        padding: 18,
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: SHELL.INK_SOFT,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Ava current-state briefing
          </div>
          <h2
            id="nexus-current-state-brief-heading"
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 22,
              lineHeight: 1.2,
              color: SHELL.INK,
            }}
          >
            Ask Ava what is true right now.
          </h2>
        </div>
        <button
          type="button"
          onClick={generateBrief}
          disabled={loading}
          style={{
            minHeight: 36,
            border: 'none',
            borderRadius: 8,
            background: SHELL.INK,
            color: SHELL.PAPER,
            padding: '0 14px',
            fontFamily: SHELL.SANS,
            fontSize: 12,
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Generating...' : 'Generate brief'}
        </button>
      </div>

      <p style={{ margin: '10px 0 0', color: SHELL.INK_SOFT, fontFamily: SHELL.SANS, fontSize: 13, lineHeight: 1.55 }}>
        Produces a cited CXO read across org structure, programs, systems, vendors, financials, evidence, and Move-shaping guidance.
      </p>

      {error ? (
        <div style={{ marginTop: 12, color: '#B8443A', fontFamily: SHELL.SANS, fontSize: 13 }}>{error}</div>
      ) : null}

      {briefing ? (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              borderLeft: `3px solid ${SHELL.BLUE_LINE}`,
              paddingLeft: 12,
              color: SHELL.INK,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {briefing.executiveRead}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
            {briefing.sections.map((section) => (
              <article
                key={section.id}
                style={{
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  background: SHELL.PAPER_SOFT,
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <h3 style={{ margin: '0 0 6px', fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK }}>
                  {section.title}
                </h3>
                <p style={{ margin: '0 0 8px', fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.45 }}>
                  {section.summary}
                </p>
                <ul style={{ margin: 0, paddingLeft: 16, color: SHELL.INK, fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.45 }}>
                  {section.facts.slice(0, 3).map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                {section.citationIds.length > 0 ? (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {section.citationIds.slice(0, 3).map((id) => (
                      <span
                        key={`${section.id}-${id}`}
                        title={citationsById.get(id)?.sourceBasis}
                        style={{
                          border: `1px solid ${SHELL.CARD_LINE}`,
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontFamily: SHELL.MONO,
                          fontSize: 9,
                          color: SHELL.INK_SOFT,
                          background: SHELL.PAPER,
                        }}
                      >
                        {citationLabel(briefing.citations, id)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void askQuestion();
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}
          >
            <AvaAskMark style={{ minWidth: 38, fontSize: 22 }} />
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              aria-label="Ask Ava a current-state question"
              style={{
                flex: 1,
                minHeight: 36,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 8,
                padding: '0 10px',
                fontFamily: SHELL.SANS,
                fontSize: 13,
              }}
            />
            <button
              type="submit"
              disabled={asking}
              style={{
                minHeight: 36,
                borderRadius: 8,
                border: `1px solid ${SHELL.CARD_LINE}`,
                background: SHELL.PAPER_SOFT,
                color: SHELL.INK,
                padding: '0 12px',
                fontFamily: SHELL.SANS,
                fontSize: 12,
                fontWeight: 700,
                cursor: asking ? 'wait' : 'pointer',
              }}
            >
              {asking ? 'Asking...' : 'Ask'}
            </button>
          </form>

          {briefing.recommendedQuestions.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {briefing.recommendedQuestions.slice(0, 4).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuestion(q);
                    void askQuestion(q);
                  }}
                  style={{
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 999,
                    background: SHELL.PAPER,
                    color: SHELL.INK_SOFT,
                    padding: '5px 9px',
                    fontFamily: SHELL.SANS,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          {answer ? (
            <div
              style={{
                marginTop: 12,
                border: `1px solid ${SHELL.CARD_LINE}`,
                borderRadius: 8,
                background: SHELL.PAPER_SOFT,
                padding: 12,
              }}
            >
              <div style={{ fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_SOFT, marginBottom: 6 }}>
                Answer · confidence {answer.confidence}
              </div>
              <p style={{ margin: 0, fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK, lineHeight: 1.55 }}>
                {answer.answer}
              </p>
              {answer.citationIds.length > 0 ? (
                <div style={{ marginTop: 8, fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_SOFT }}>
                  Cites: {answer.citationIds.slice(0, 4).map((id) => citationLabel(briefing.citations, id)).join(' · ')}
                </div>
              ) : null}
            </div>
          ) : null}

          {briefing.brokerWarnings.length > 0 ? (
            <div style={{ marginTop: 12, fontFamily: SHELL.MONO, fontSize: 10, color: SHELL.INK_SOFT }}>
              {briefing.brokerWarnings.join(' ')}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
