'use client'

import { useCallback, useEffect, useState } from 'react'

type LoggedOutLandingPageProps = {
  signedOut?: boolean
}

type RequestForm = {
  name: string
  email: string
  company: string
  role: string
  companySize: string
  industry: string
  orgType: string
  initiative: string
}

const EMPTY_FORM: RequestForm = {
  name: '',
  email: '',
  company: '',
  role: '',
  companySize: '',
  industry: '',
  orgType: 'enterprise',
  initiative: '',
}

const PUBLIC_MARKETING_POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_sBWeBFtt6CTivNZPxXArcognZKe5zHMAzm5qjmfdVQKj'
const PUBLIC_MARKETING_POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const PUBLIC_MARKETING_DISTINCT_ID_KEY = 'abarva_public_marketing_distinct_id'

const DEMO_VIDEO_SRC = '/marketing/abarva-demo-cxo-safe-qa-passed.mp4'
const DEMO_POSTER_SRC = '/marketing/abarva-demo-cxo-safe-poster.jpg'

function getPublicMarketingDistinctId() {
  if (typeof window === 'undefined') return null

  try {
    const existing = window.localStorage.getItem(PUBLIC_MARKETING_DISTINCT_ID_KEY)
    if (existing) return existing

    const generated =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `public-${Date.now()}-${Math.random().toString(16).slice(2)}`
    window.localStorage.setItem(PUBLIC_MARKETING_DISTINCT_ID_KEY, generated)
    return generated
  } catch {
    return `public-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

function sendPublicMarketingEvent(event: string, properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (!PUBLIC_MARKETING_POSTHOG_KEY) return

  try {
    const distinctId = getPublicMarketingDistinctId()
    if (!distinctId) return

    const host = PUBLIC_MARKETING_POSTHOG_HOST.replace(/\/$/, '')
    const payload = {
      api_key: PUBLIC_MARKETING_POSTHOG_KEY,
      event,
      properties: {
        distinct_id: distinctId,
        surface: 'public_marketing',
        route: window.location.pathname,
        signed_in: false,
        $current_url: window.location.href,
        $host: window.location.host,
        $pathname: window.location.pathname,
        $referrer: document.referrer || undefined,
        $process_person_profile: false,
        ...properties,
      },
    }

    void fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'cors',
    }).catch(() => undefined)
  } catch {
    // Marketing telemetry is optional; never block public page rendering.
  }
}

export function LoggedOutLandingPage({ signedOut = false }: LoggedOutLandingPageProps) {
  const [demoOpen, setDemoOpen] = useState(false)
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trackMarketingEvent = useCallback(
    (event: string, properties: Record<string, unknown> = {}) => {
      sendPublicMarketingEvent(event, properties)
    },
    [],
  )

  const openDemo = useCallback(
    (placement: string) => {
      setDemoOpen(true)
      trackMarketingEvent('abarva.marketing_demo_opened', { placement })
    },
    [trackMarketingEvent],
  )

  const closeDemo = useCallback(() => setDemoOpen(false), [])

  const updateField = <K extends keyof RequestForm>(key: K, value: RequestForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    trackMarketingEvent('abarva.marketing_visit', { signed_out_reason: signedOut ? 'explicit' : null })
  }, [signedOut, trackMarketingEvent])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDemo()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [closeDemo])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const previous = document.body.style.overflow
    if (demoOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [demoOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in')
        }),
      { threshold: 0.15 },
    )
    document.querySelectorAll('.rv').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    trackMarketingEvent('abarva.marketing_request_access_submitted', {
      role: form.role || null,
      company_size: form.companySize || null,
      industry: form.industry || null,
      org_type: form.orgType || null,
      has_initiative: Boolean(form.initiative.trim()),
    })

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error('Request failed')
      setSubmitted(true)
      trackMarketingEvent('abarva.marketing_request_access_succeeded')
    } catch {
      setError('Something went wrong. Please try again, or email admin@abarva.ai.')
      trackMarketingEvent('abarva.marketing_request_access_failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="marketing-page">
      <header className="nav">
        <a className="brand" href="#top" aria-label="AbarVa home">
          <img src="/marketing/final/abarva-logo.svg" alt="AbarVa" />
        </a>
        <nav className="navlinks" aria-label="Public page sections">
          <a href="#platform">Platform</a>
          <a href="#ava">aVa</a>
          <a href="#leaders">For leaders</a>
          <a href="#about">About</a>
        </nav>
        <div className="nav-actions">
          <button
            className="btn ghost"
            type="button"
            data-track-id="marketing-nav-watch-demo"
            onClick={() => openDemo('nav')}
          >
            Watch product demo
          </button>
          <a
            className="btn primary"
            href="#request"
            data-track-id="marketing-nav-request-access"
            onClick={() => trackMarketingEvent('abarva.marketing_request_access_clicked', { placement: 'nav' })}
          >
            Request access
          </a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="inner">
          <div className="hero-copy rv">
            <div className="eyebrow">The operating platform for AI-era business change</div>
            <h1>
              Turn AI ambition into a <span>new way of working</span>.
            </h1>
            <p className="lead">
              AbarVa is the AI Success Platform. It helps leaders decide where AI fits, shape
              and govern the change, and prove the value, so teams and delivery partners execute
              the right thing.
            </p>
            <div className="cta-row">
              <a
                className="btn primary large"
                href="#request"
                data-track-id="marketing-hero-request-access"
                onClick={() =>
                  trackMarketingEvent('abarva.marketing_request_access_clicked', { placement: 'hero' })
                }
              >
                Request private preview
              </a>
              <button
                className="btn large"
                type="button"
                data-track-id="marketing-hero-watch-demo"
                onClick={() => openDemo('hero')}
              >
                Watch product demo
              </button>
              <a className="btn text" href="#platform">
                See how it works
              </a>
            </div>
            <div className="trust">
              <span>Evidence before funding</span>
              <span>Human-approved gates</span>
              <span>Value leaders can defend</span>
            </div>
          </div>

          <div className="path-card rv">
            <div className="card-eyebrow">The path</div>
            <h2>Decide. Shape. Govern. Prove.</h2>
            {[
              ['Decide · where AI fits', "See which bets are real before a dollar is funded."],
              ['Shape · the Move', 'Turn the opportunity into an owned work package.'],
              ['Govern · execution', 'Hold gates, evidence, risks, and decisions together.'],
              ['Prove · the value', 'Show where value showed up, and what still needs work.'],
            ].map(([title, text], index) => (
              <div className="step" key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section light rv">
        <div className="shell">
          <div className="eyebrow">The bigger problem</div>
          <h2>
            AI is not the outcome. A <span className="teal">new way of working</span> is.
          </h2>
          <p className="section-lead">
            Models, agents, and data only create value when they change how decisions get made,
            how work flows, and how outcomes are measured.
          </p>
          <div className="grid four">
            {[
              ['Wrong bets funded', 'AI aimed at attractive ideas, not the highest-value problems.'],
              ['Pilots do not scale', 'Demos work; ownership, workflow, and adoption are missing.'],
              ['No one owns it', 'Technology moves; business accountability stays unclear.'],
              ['Value is only claimed', 'ROI lives in slides, never in operating metrics.'],
            ].map(([title, text]) => (
              <article className="tile warning" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark center rv" id="platform">
        <div className="shell">
          <div className="eyebrow centered">The missing layer</div>
          <h2>Between AI capability and business value, a layer has been missing.</h2>
          <div className="bridge">
            <div>AI capability · models · agents · data</div>
            <span>↓</span>
            <strong>
              AbarVa&apos;s operating layer sits here
              <small>Decide · Shape · Govern · Prove</small>
            </strong>
            <span>↓</span>
            <div>Business value · measurable · defensible</div>
          </div>
        </div>
      </section>

      <section className="section light rv">
        <div className="shell">
          <div className="eyebrow">One platform</div>
          <h2>Five connected surfaces. One governed loop.</h2>
          <p className="section-lead">
            Not five tools. One continuous operating loop, with aVa as the advisor across all of it.
          </p>
          <div className="loop" aria-label="AbarVa product surfaces">
            {[
              ['grounds', 'Context', 'Grounds every answer in enterprise evidence.'],
              ['finds', 'Intelligence', 'Finds the highest-value opportunity, with evidence.'],
              ['shapes', 'Moves', 'Shapes it into a governed, owned move.'],
              ['sources', 'Source', 'Turns it into partner and sourcing leverage.'],
              ['proves', 'Tower', 'Tracks execution, adoption, and proven value.'],
            ].map(([verb, title, text]) => (
              <article className="surface" key={title}>
                <span>{verb}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark rv" id="ava">
        <div className="shell">
          <div className="ava-lockup">
            <span className="ava-disc">
              <img src="/marketing/final/ava-mark.png" alt="" />
            </span>
            <div className="eyebrow">The advisor</div>
          </div>
          <h2>aVa is not a chatbot. It is the advisor across the loop.</h2>
          <p className="section-lead">
            Every answer is grounded in enterprise evidence and presented with the right lens:
            answer, industry signal, trend, play, decision, or proof.
          </p>
          <div className="grid four">
            {[
              ['your data', 'Answer', 'The direct answer from what the enterprise has loaded.'],
              ['industry context', 'Industry signal', 'Outside-in context without pretending it is client proof.'],
              ['directional', 'Trends', 'Charts and patterns labeled for how they are grounded.'],
              ['candidate', 'Plays', 'Adjacent moves that leaders can review, not blindly accept.'],
            ].map(([badge, title, text]) => (
              <article className="lens" key={title}>
                <span>{badge}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark center tight rv">
        <div className="shell">
          <div className="eyebrow centered">The boundary</div>
          <h2>AbarVa is not your implementation team.</h2>
          <p className="section-lead centered-text">
            It is the operating layer that helps leaders decide, shape, govern, and prove.
            Detailed design, build, rollout, and adoption happen through your teams and partners.
            AbarVa helps make sure they build the right thing, and that value gets proven.
          </p>
        </div>
      </section>

      <section className="section light rv" id="leaders">
        <div className="shell">
          <div className="eyebrow">One shared version of AI value</div>
          <h2>Different leaders. Same source of truth.</h2>
          <div className="grid three">
            {[
              ['For the CIO / CTO', 'From models to adoption, with clarity on what must change so technology actually lands.'],
              ['For the CFO', 'Spend tied to proof, with every dollar traceable to projected and validated value.'],
              ['For the COO / CDAO', 'Programs that land, with sourcing leverage and outcomes the business can feel.'],
            ].map(([title, text]) => (
              <article className="tile" key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark rv" id="about">
        <div className="shell">
          <div className="eyebrow">About AbarVa</div>
          <h2>
            AI only matters when it becomes <span className="teal">a new way of working</span>.
          </h2>
          <p className="section-lead">
            AbarVa is an AI Success Platform: the operating layer where leaders decide where AI
            should change the business, govern the change, and prove the value. We are a product,
            not a consulting services firm.
          </p>
          <div className="quote">
            <span aria-hidden="true">&ldquo;</span>
            <p>
              I kept watching brilliant AI stall, not because the technology failed, but because
              the business never changed how it runs. AbarVa is built to help CXOs aim AI at the
              right problems and turn it into a new way of working.
            </p>
          </div>
          <div className="founder">
            <span>AS</span>
            <div>
              <strong>Anand Sundaram</strong>
              <p>Founder &amp; CEO, AbarVa</p>
            </div>
          </div>
          <div className="credentials">
            <span>Consulting Magazine Top Consultant, 2024</span>
            <span>Former Managing Director, Accenture</span>
            <span>Global CTO, Dell Technologies</span>
            <span>Global IT and data leadership across Fortune 100 enterprises</span>
          </div>
          <p className="disclaimer">
            AbarVa is an independent company, not affiliated with, endorsed by, or sponsored by
            Accenture, Dell Technologies, or any former employer. Roles shown are prior professional
            experience.
          </p>
        </div>
      </section>

      <section className="demo-band rv" aria-label="Product demo">
        <div className="shell demo-shell">
          <div>
            <div className="eyebrow">Product tour</div>
            <h2>See the operating loop in motion.</h2>
            <p>
              A short product walkthrough shows how Context, Intelligence, Moves, Source, and Tower
              work together without exposing private tenant data.
            </p>
          </div>
          <button
            className="btn primary large"
            type="button"
            data-track-id="marketing-bottom-watch-demo"
            onClick={() => openDemo('bottom')}
          >
            Watch product demo
          </button>
        </div>
      </section>

      <section className="section dark rv" id="request">
        <div className="shell request-grid">
          <div>
            <div className="eyebrow">Founder-led private preview</div>
            <h2>Bring one real business problem.</h2>
            <p className="section-lead">
              Tell us where you are accountable for AI value, and we will be in touch. AbarVa
              will help show where AI fits, what work must change, and what value can be proven.
            </p>
            <div className="checks">
              <span>A working session on one real business problem.</span>
              <span>Where AI fits, and where it does not.</span>
              <span>A governed path from decision to provable value.</span>
            </div>
          </div>

          {submitted ? (
            <div className="form success" role="status">
              <h3>Request received.</h3>
              <p>
                Thank you. The AbarVa team will review your request and follow up from
                admin@abarva.ai.
              </p>
            </div>
          ) : (
            <form className="form" onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
              <label>
                Work email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@enterprise.com"
                  autoComplete="email"
                />
              </label>
              <label>
                Company
                <input
                  required
                  value={form.company}
                  onChange={(event) => updateField('company', event.target.value)}
                  placeholder="Company name"
                  autoComplete="organization"
                />
              </label>
              <label>
                Your role
                <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
                  <option value="">Select one</option>
                  <option>CIO / CTO</option>
                  <option>CFO</option>
                  <option>COO</option>
                  <option>CDAO / Head of AI</option>
                  <option>Business transformation leader</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Where AI value matters most
                <input
                  value={form.initiative}
                  onChange={(event) => updateField('initiative', event.target.value)}
                  placeholder="e.g. operations, finance, customer, technology"
                />
              </label>
              <button
                className="btn primary large full"
                type="submit"
                disabled={submitting}
                data-track-id="marketing-request-access-submit"
              >
                {submitting ? 'Sending...' : 'Request private preview'}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
              <p className="form-note">Requests are reviewed by AbarVa. Product access is invite-only.</p>
            </form>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="shell footer-shell">
          <div>
            <img src="/marketing/final/abarva-logo.svg" alt="AbarVa" />
            <p>The AI Success Platform for enterprise change.</p>
          </div>
          <div className="footer-links">
            <a href="#platform">Platform</a>
            <a href="#ava">aVa</a>
            <a href="#request">Request access</a>
            <button type="button" onClick={() => openDemo('footer')}>
              Product demo
            </button>
          </div>
        </div>
      </footer>

      {demoOpen ? (
        <div
          className="demo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="AbarVa product demo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDemo()
          }}
        >
          <div className="demo-frame">
            <button className="close" type="button" onClick={closeDemo} aria-label="Close product demo">
              ×
            </button>
            <video
              controls
              playsInline
              preload="metadata"
              poster={DEMO_POSTER_SRC}
              onPlay={() => trackMarketingEvent('abarva.marketing_demo_played')}
              onEnded={() => trackMarketingEvent('abarva.marketing_demo_completed')}
            >
              <source src={DEMO_VIDEO_SRC} type="video/mp4" />
            </video>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        :global(html) {
          scroll-behavior: smooth;
        }

        :global(body) {
          margin: 0;
          background: #070d16;
        }

        .marketing-page {
          --ink: #070d16;
          --paper: #efece3;
          --paper-2: #f6f2e9;
          --line: #1d2c43;
          --paper-line: #dcd4c3;
          --muted: #9fb0c6;
          --text: #dbe7f5;
          --teal: #2bbee9;
          --teal-2: #0e9fc4;
          --mint: #37e0c0;
          --gold: #c99a3f;
          min-height: 100vh;
          background: var(--ink);
          color: #f3f8ff;
          font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 16px clamp(20px, 5vw, 72px);
          border-bottom: 1px solid var(--line);
          background: rgba(7, 13, 22, 0.9);
          backdrop-filter: blur(14px);
        }

        .brand img,
        .footer img {
          display: block;
          height: 28px;
          width: auto;
        }

        .navlinks {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-left: auto;
        }

        .navlinks a,
        .footer-links a,
        .footer-links button {
          color: var(--muted);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .footer-links button {
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .navlinks a:hover,
        .footer-links a:hover,
        .footer-links button:hover {
          color: white;
        }

        .nav-actions,
        .cta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 11px 18px;
          background: rgba(255, 255, 255, 0.03);
          color: #dce7f4;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 160ms ease,
            border-color 160ms ease;
        }

        .btn:hover {
          border-color: #33506f;
          transform: translateY(-1px);
        }

        .btn.primary {
          border: 0;
          color: #06222e;
          background: linear-gradient(120deg, var(--mint), var(--teal));
          box-shadow: 0 16px 32px -18px rgba(43, 190, 234, 0.8);
        }

        .btn.large {
          min-height: 50px;
          padding-inline: 24px;
          font-size: 15px;
        }

        .btn.text {
          border: 0;
          background: transparent;
          color: var(--muted);
        }

        .btn.full {
          width: 100%;
        }

        .hero {
          position: relative;
          overflow: hidden;
          min-height: calc(100vh - 75px);
          background:
            linear-gradient(100deg, #070d16 0%, #0a1422 36%, #1d2b39 50%, #b8b4a8 68%, #efece3 82%),
            #070d16;
        }

        .hero:before,
        .section.dark:before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(159, 176, 198, 0.14) 1px, transparent 1px),
            linear-gradient(90deg, rgba(159, 176, 198, 0.14) 1px, transparent 1px);
          background-size: 84px 84px;
          opacity: 0.16;
          mask-image: radial-gradient(90% 70% at 30% 20%, #000 20%, transparent 75%);
        }

        .hero-glow {
          position: absolute;
          top: 7%;
          left: 10%;
          width: 680px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20, 48, 79, 0.58), transparent 62%);
        }

        .inner,
        .shell {
          width: min(1220px, calc(100% - 44px));
          margin: 0 auto;
        }

        .inner {
          position: relative;
          z-index: 1;
          display: grid;
          min-height: calc(100vh - 75px);
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.85fr);
          align-items: center;
          gap: clamp(36px, 8vw, 90px);
          padding: 56px 0;
        }

        .hero-copy {
          max-width: 660px;
        }

        .eyebrow,
        .card-eyebrow {
          display: flex;
          align-items: center;
          gap: 11px;
          color: var(--teal);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .eyebrow:before {
          content: '';
          width: 8px;
          height: 8px;
          flex: none;
          border-radius: 2px;
          background: var(--mint);
          box-shadow: 0 0 13px rgba(55, 224, 192, 0.85);
        }

        .section.light .eyebrow,
        .demo-band .eyebrow {
          color: #005f73;
        }

        .section.light .eyebrow:before,
        .demo-band .eyebrow:before {
          background: #007a66;
          box-shadow: none;
        }

        .centered {
          justify-content: center;
        }

        h1,
        h2,
        h3 {
          margin: 0;
          font-family: Georgia, 'Times New Roman', serif;
          letter-spacing: -0.02em;
        }

        h1 {
          max-width: 12ch;
          margin-top: 24px;
          color: #f3f8ff;
          font-size: clamp(42px, 6vw, 76px);
          font-weight: 500;
          line-height: 0.98;
        }

        h1 span,
        .teal {
          color: var(--teal);
        }

        .section.light .teal {
          color: #005f73;
        }

        .lead,
        .section-lead,
        .demo-band p {
          color: #c4d2e3;
          font-size: 18px;
          line-height: 1.62;
        }

        .lead {
          max-width: 590px;
          margin: 25px 0 0;
        }

        .cta-row {
          margin-top: 32px;
        }

        .trust {
          display: flex;
          flex-wrap: wrap;
          gap: 17px;
          margin-top: 24px;
          color: #6f839d;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          font-weight: 700;
        }

        .trust span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .trust span:before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--teal);
        }

        .path-card {
          border: 1px solid var(--paper-line);
          border-radius: 18px;
          padding: 28px;
          background: rgba(255, 255, 255, 0.86);
          color: #0b131c;
          box-shadow: 0 28px 70px -42px rgba(8, 18, 31, 0.6);
        }

        .path-card h2 {
          margin: 8px 0 20px;
          font-size: 25px;
        }

        .step {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 14px;
          padding: 14px 0;
          border-top: 1px solid #ded7c8;
        }

        .step span {
          display: grid;
          width: 28px;
          height: 28px;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(120deg, var(--mint), var(--teal));
          color: #06222e;
          font-weight: 800;
        }

        .step strong {
          display: block;
          color: #0e9fc4;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .step p {
          margin: 5px 0 0;
          color: #28333e;
          font-size: 14px;
          line-height: 1.45;
        }

        .section {
          position: relative;
          overflow: hidden;
          padding: 104px 0;
        }

        .section.tight {
          padding: 78px 0;
        }

        .section.light {
          background: var(--paper);
          color: #0b131c;
        }

        .section.dark {
          background:
            radial-gradient(1000px 600px at 85% -10%, #14304f 0, transparent 60%),
            linear-gradient(168deg, #0b1626, #070d16 78%);
        }

        .section .shell {
          position: relative;
          z-index: 1;
        }

        .section h2,
        .demo-band h2 {
          max-width: 880px;
          margin-top: 17px;
          font-size: clamp(31px, 4vw, 48px);
          font-weight: 500;
          line-height: 1.08;
        }

        .section.light .section-lead,
        .demo-band p {
          color: #28333e;
        }

        .section-lead {
          max-width: 680px;
          margin: 22px 0 0;
        }

        .center {
          text-align: center;
        }

        .center .section-lead,
        .centered-text,
        .center h2 {
          margin-left: auto;
          margin-right: auto;
        }

        .grid {
          display: grid;
          gap: 18px;
          margin-top: 42px;
        }

        .grid.four {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .grid.three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .tile,
        .lens,
        .surface,
        .form {
          border-radius: 14px;
          padding: 24px;
        }

        .tile,
        .surface {
          border: 1px solid var(--paper-line);
          background: #fff;
          box-shadow: 0 18px 42px -32px rgba(40, 40, 60, 0.35);
        }

        .tile.warning {
          border-left: 3px solid #d9714f;
        }

        .tile h3,
        .lens h3,
        .surface h3 {
          font-size: 19px;
          font-weight: 700;
        }

        .tile p,
        .surface p {
          color: #28333e;
          font-size: 14px;
          line-height: 1.5;
        }

        .bridge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          margin-top: 46px;
          color: #6f839d;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .bridge strong {
          display: block;
          width: min(760px, 100%);
          border: 1px solid rgba(43, 190, 234, 0.42);
          border-radius: 16px;
          padding: 28px 32px;
          background: linear-gradient(120deg, rgba(43, 190, 234, 0.17), rgba(55, 224, 192, 0.1));
          color: #fff;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: -0.01em;
          text-transform: none;
          box-shadow: 0 0 50px -10px rgba(43, 190, 234, 0.34);
        }

        .bridge small {
          display: block;
          margin-top: 8px;
          color: var(--teal);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .loop {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin-top: 42px;
        }

        .surface span {
          color: #65788f;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .surface:first-child {
          border-color: var(--teal-2);
        }

        .ava-lockup {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .ava-disc {
          display: grid;
          width: 56px;
          height: 56px;
          place-items: center;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 36%, #2bbee9, #0e9fc4);
          box-shadow: 0 16px 36px -12px rgba(14, 159, 196, 0.6);
        }

        .ava-disc img {
          height: 22px;
          width: auto;
        }

        .lens {
          border: 1px solid var(--line);
          background: rgba(13, 24, 40, 0.55);
        }

        .lens span {
          display: inline-block;
          margin-bottom: 13px;
          border-radius: 999px;
          padding: 5px 10px;
          background: rgba(43, 190, 234, 0.12);
          color: var(--teal);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .lens p {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.5;
        }

        .quote {
          display: flex;
          gap: 19px;
          max-width: 920px;
          margin-top: 30px;
        }

        .quote > span {
          color: var(--teal);
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 62px;
          line-height: 0.75;
        }

        .quote p {
          margin: 0;
          color: #eef4fc;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 24px;
          line-height: 1.42;
        }

        .founder {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 26px 0 0 40px;
        }

        .founder > span {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 36%, #2bbee9, #0e9fc4);
          color: #06222e;
          font-weight: 900;
        }

        .founder strong {
          display: block;
          font-size: 18px;
        }

        .founder p,
        .disclaimer {
          margin: 3px 0 0;
          color: var(--muted);
          font-size: 13px;
        }

        .credentials {
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          margin-top: 34px;
          border-top: 1px solid var(--line);
          padding-top: 24px;
        }

        .credentials span {
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 11px 14px;
          background: rgba(13, 24, 40, 0.54);
          color: #dbe7f5;
          font-size: 13px;
        }

        .disclaimer {
          max-width: 840px;
          margin-top: 17px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          line-height: 1.55;
        }

        .demo-band {
          padding: 64px 0;
          background: var(--paper);
          color: #0b131c;
          border-top: 1px solid var(--paper-line);
          border-bottom: 1px solid var(--paper-line);
        }

        .demo-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        .demo-band h2 {
          margin-top: 12px;
          font-size: clamp(28px, 3vw, 38px);
        }

        .demo-band p {
          max-width: 700px;
          margin: 14px 0 0;
          font-size: 16px;
        }

        .request-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 0.78fr);
          gap: 58px;
          align-items: start;
        }

        .checks {
          display: grid;
          gap: 12px;
          margin-top: 28px;
          max-width: 500px;
        }

        .checks span {
          display: flex;
          gap: 12px;
          color: #dfe8f3;
          font-size: 15px;
          line-height: 1.5;
        }

        .checks span:before {
          content: '✓';
          display: grid;
          width: 21px;
          height: 21px;
          flex: none;
          place-items: center;
          border-radius: 6px;
          background: linear-gradient(120deg, var(--mint), var(--teal));
          color: #06222e;
          font-size: 12px;
          font-weight: 900;
        }

        .form {
          border: 1px solid var(--line);
          background: rgba(13, 24, 40, 0.6);
        }

        .form label {
          display: block;
          margin-bottom: 15px;
          color: var(--muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .form input,
        .form select {
          display: block;
          width: 100%;
          margin-top: 8px;
          border: 1px solid var(--line);
          border-radius: 11px;
          padding: 13px 15px;
          background: #0c1626;
          color: #eaf1fa;
          font: inherit;
          font-size: 15px;
        }

        .form input::placeholder {
          color: #53667f;
        }

        .form-note,
        .form-error {
          margin: 11px 0 0;
          font-size: 12px;
          line-height: 1.45;
        }

        .form-note {
          color: #70849d;
        }

        .form-error {
          color: #ffb5a8;
        }

        .form.success h3 {
          color: #fff;
          font-size: 26px;
        }

        .form.success p {
          color: var(--muted);
          line-height: 1.55;
        }

        .footer {
          padding: 52px 0;
          border-top: 1px solid var(--line);
          background: #070d16;
        }

        .footer-shell {
          display: flex;
          justify-content: space-between;
          gap: 36px;
        }

        .footer p {
          max-width: 340px;
          color: var(--muted);
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
        }

        .demo-modal {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(2, 6, 12, 0.78);
          backdrop-filter: blur(10px);
        }

        .demo-frame {
          position: relative;
          width: min(1080px, 100%);
          border: 1px solid rgba(159, 176, 198, 0.28);
          border-radius: 18px;
          background: #050b12;
          box-shadow: 0 38px 100px -30px rgba(0, 0, 0, 0.85);
          overflow: hidden;
        }

        .demo-frame video {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #050b12;
        }

        .close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 50%;
          background: rgba(7, 13, 22, 0.82);
          color: white;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
        }

        .rv,
        .rv.in {
          opacity: 1;
          transform: none;
        }

        @media (max-width: 1020px) {
          .navlinks {
            display: none;
          }

          .inner,
          .request-grid,
          .demo-shell {
            grid-template-columns: 1fr;
          }

          .inner {
            min-height: auto;
          }

          .path-card {
            max-width: 640px;
          }

          .grid.four,
          .loop {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .nav {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
          }

          .nav-actions,
          .nav-actions .btn {
            width: 100%;
          }

          .brand img,
          .footer img {
            height: 24px;
          }

          .hero {
            min-height: auto;
            background: linear-gradient(180deg, #070d16 0%, #0a1422 58%, #efece3 135%);
          }

          .inner {
            width: min(100% - 32px, 1220px);
            padding: 42px 0 58px;
          }

          h1 {
            max-width: none;
            font-size: 40px;
          }

          .section {
            padding: 68px 0;
          }

          .grid.four,
          .grid.three,
          .loop {
            grid-template-columns: 1fr;
          }

          .demo-shell,
          .footer-shell {
            align-items: flex-start;
            flex-direction: column;
          }

          .request-grid {
            gap: 34px;
          }

          .quote {
            margin-top: 24px;
          }

          .quote p {
            font-size: 20px;
          }

          .founder {
            margin-left: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(html) {
            scroll-behavior: auto;
          }

          .rv,
          .btn {
            transition: none;
          }
        }
      `}</style>
    </main>
  )
}
