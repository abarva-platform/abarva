import Link from 'next/link';
import type { PatternSeed } from '@/lib/public-site/public-patterns';
import { getDomainLabel } from '@/lib/public-site/public-patterns';
import { PatternMetadataSidebar } from './PatternMetadataSidebar';
import { AskAtlasInline } from './AskAtlasInline';

interface PatternDetailProps {
  pattern: PatternSeed;
}

export function PatternDetail({ pattern }: PatternDetailProps) {
  const confidencePct = Math.round(pattern.confidence * 100);

  return (
    <main className="pub-pattern-detail">
      <div className="pub-pattern-detail__container">
        {/* Back navigation */}
        <nav className="pub-pattern-detail__breadcrumb" aria-label="Breadcrumb">
          <Link href="/patterns/" className="pub-pattern-detail__back">
            ← All patterns
          </Link>
        </nav>

        <div className="pub-pattern-detail__layout">
          {/* Main content */}
          <article className="pub-pattern-detail__main" aria-label={pattern.title}>
            <header className="pub-pattern-detail__header">
              <div className="pub-pattern-detail__meta-row">
                <span className="pub-pattern-detail__category-badge">
                  {getDomainLabel(pattern.domain)}
                </span>
                <span
                  className="pub-pattern-detail__confidence-chip"
                  aria-label={`Confidence ${confidencePct}%`}
                >
                  {confidencePct}% confidence
                </span>
              </div>

              <h1 className="pub-pattern-detail__title">{pattern.title}</h1>

              <p className="pub-pattern-detail__thesis">{pattern.thesis}</p>
            </header>

            <section className="pub-pattern-detail__applicability">
              <h2 className="pub-pattern-detail__section-heading">When to apply</h2>
              <p>{pattern.applicability}</p>
            </section>

            {pattern.body && (
              <section className="pub-pattern-detail__body">
                <div className="pub-pattern-detail__body-content">
                  {pattern.body.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return (
                        <h2 key={i} className="pub-pattern-detail__body-heading">
                          {line.slice(3)}
                        </h2>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={i} className="pub-pattern-detail__body-li">
                          {line.slice(2)}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    return (
                      <p key={i} className="pub-pattern-detail__body-p">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </section>
            )}

            {pattern.regulatoryChips.length > 0 && (
              <section className="pub-pattern-detail__regulatory">
                <h2 className="pub-pattern-detail__section-heading">Regulatory scope</h2>
                <ul className="pub-pattern-detail__chips" role="list">
                  {pattern.regulatoryChips.map((chip) => (
                    <li key={chip} className="pub-pattern-detail__chip">
                      {chip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <AskAtlasInline />
          </article>

          {/* Sidebar */}
          <PatternMetadataSidebar pattern={pattern} />
        </div>
      </div>
    </main>
  );
}
