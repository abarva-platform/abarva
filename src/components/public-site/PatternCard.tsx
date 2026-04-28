import Link from 'next/link';
import type { PatternSeed } from '@/lib/public-site/public-patterns';
import { getDomainLabel } from '@/lib/public-site/public-patterns';

interface PatternCardProps {
  pattern: PatternSeed;
}

export function PatternCard({ pattern }: PatternCardProps) {
  const confidencePct = Math.round(pattern.confidence * 100);

  return (
    <Link
      href={`/patterns/${pattern.slug}/`}
      className="pub-pattern-card"
      aria-label={`View pattern: ${pattern.title}`}
    >
      <div className="pub-pattern-card__header">
        <span className="pub-pattern-card__category">
          {getDomainLabel(pattern.domain)}
        </span>
        <span className="pub-pattern-card__confidence" aria-label={`Confidence ${confidencePct}%`}>
          <span
            className="pub-pattern-card__confidence-bar"
            style={{ width: `${confidencePct}%` }}
          />
          <span className="pub-pattern-card__confidence-label">{confidencePct}%</span>
        </span>
      </div>

      <h3 className="pub-pattern-card__title">{pattern.title}</h3>

      <p className="pub-pattern-card__thesis">{pattern.thesis}</p>
    </Link>
  );
}
