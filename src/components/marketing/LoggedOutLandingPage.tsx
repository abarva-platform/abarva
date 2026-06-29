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
    // Telemetry is optional; never block public marketing or lead capture.
  }
}

export function LoggedOutLandingPage({ signedOut = false }: LoggedOutLandingPageProps) {
  const [modalOpen, setModalOpen] = useState(false)
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

  const openReq = () => {
    setError(null)
    trackMarketingEvent('abarva.marketing_request_access_opened')
    setModalOpen(true)
  }

  const closeReq = () => {
    setModalOpen(false)
  }

  const updateField = <K extends keyof RequestForm>(key: K, value: RequestForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (modalOpen) {
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previous
      }
    }
    return undefined
  }, [modalOpen])

  useEffect(() => {
    trackMarketingEvent('abarva.marketing_visit')
  }, [trackMarketingEvent])

  // Close on Escape.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeReq()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Scroll-reveal (.rv) + surfaces light-up — client only.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return

    const observers: IntersectionObserver[] = []

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in')
        }),
      { threshold: 0.16 },
    )
    document.querySelectorAll('.rv').forEach((el) => io.observe(el))
    observers.push(io)

    const row = document.getElementById('surfaces-row')
    if (row) {
      const sIo = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              document
                .querySelectorAll('#surfaces-row .surf')
                .forEach((s, i) => window.setTimeout(() => s.classList.add('lit'), i * 140))
            }
          }),
        { threshold: 0.35 },
      )
      sIo.observe(row)
      observers.push(sIo)
    }

    return () => observers.forEach((observer) => observer.disconnect())
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
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          role: form.role,
          companySize: form.companySize,
          industry: form.industry,
          orgType: form.orgType,
          initiative: form.initiative,
        }),
      })
      if (!response.ok) {
        throw new Error('Request failed')
      }
      trackMarketingEvent('abarva.marketing_request_access_succeeded')
      setSubmitted(true)
    } catch {
      trackMarketingEvent('abarva.marketing_request_access_failed')
      setError('Something went wrong. Please try again, or email admin@abarva.ai.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="abarva-landing">
      <style jsx global>{`
        .abarva-landing {
          --bg: #f8f7f4;
          --paper: #ffffff;
          --paper2: #fbfaf7;
          --ink: #15171c;
          --ink2: #262a33;
          --mute: #6c6f78;
          --soft: #8a8f99;
          --line: #e6e3dc;
          --navy: #0b1422;
          --navy2: #101c30;
          --teal: #37e0c0;
          --teal2: #13a98a;
          --blue: #5b8cff;
          --blue2: #3b6fe0;
          --gold: #c9a35b;
          --shadow: 0 50px 100px -34px rgba(11, 20, 34, 0.55), 0 8px 24px -12px rgba(11, 20, 34, 0.3);
          background: var(--bg);
          color: var(--ink);
          font-family: 'DM Sans', Inter, system-ui, Arial, sans-serif;
          line-height: 1.55;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        .abarva-landing * {
          box-sizing: border-box;
        }
        .abarva-landing h1,
        .abarva-landing h2,
        .abarva-landing h3 {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: normal;
          letter-spacing: -0.55px;
          color: var(--ink);
        }
        .abarva-landing p {
          margin: 0;
        }
        .abarva-landing a {
          color: inherit;
          text-decoration: none;
        }
        .abarva-landing .wrap {
          max-width: 1220px;
          margin: 0 auto;
          padding: 0 34px;
        }
        .abarva-landing .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 24px;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.22s;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .abarva-landing .btn-prime {
          background: linear-gradient(120deg, #5b8cff, #37e0c0);
          color: #06101e;
          box-shadow: 0 10px 34px -12px rgba(91, 140, 255, 0.7);
        }
        .abarva-landing .btn-prime:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 45px -18px rgba(91, 140, 255, 0.85);
        }
        .abarva-landing .btn-line {
          background: #fff;
          color: var(--ink);
          border: 1px solid #cfccc3;
        }
        .abarva-landing .btn-line:hover {
          border-color: #a7a399;
          transform: translateY(-1px);
        }
        .abarva-landing .btn-dark {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.26);
          backdrop-filter: blur(8px);
        }
        .abarva-landing .btn-dark:hover {
          background: rgba(255, 255, 255, 0.16);
          transform: translateY(-1px);
        }

        /* ===== HERO ===== */
        .abarva-landing .shero {
          position: relative;
          background: radial-gradient(900px 500px at 90% -10%, rgba(91, 140, 255, 0.1), transparent 60%),
            radial-gradient(760px 520px at 0% 105%, rgba(55, 224, 192, 0.08), transparent 62%),
            linear-gradient(180deg, #fbfaf7 0%, #f8f7f4 100%);
          border-bottom: 1px solid var(--line);
          overflow: hidden;
        }
        .abarva-landing .shero:before {
          content: '';
          position: absolute;
          right: -180px;
          top: 100px;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(91, 140, 255, 0.12), transparent 66%);
          pointer-events: none;
        }
        .abarva-landing .navlinks {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .abarva-landing .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.065em;
          background: rgba(11, 20, 34, 0.05);
          border: 1px solid var(--line);
          color: #3b4252;
          padding: 7px 14px;
          border-radius: 30px;
          text-transform: uppercase;
        }
        .abarva-landing .pill .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #1bbf9c;
          box-shadow: 0 0 10px #37e0c0;
          animation: abarvaPulse 2.2s infinite;
        }
        @keyframes abarvaPulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.35;
          }
        }
        .abarva-landing .cta {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .abarva-landing .product-frame {
          position: relative;
          margin-top: 34px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--line);
          box-shadow: var(--shadow);
        }
        .abarva-landing .product-frame img {
          display: block;
          width: 100%;
          height: auto;
        }
        .abarva-landing .product-frame .pf-tag {
          position: absolute;
          right: 16px;
          top: 16px;
          background: rgba(8, 15, 26, 0.72);
          backdrop-filter: blur(8px);
          color: #e7eefb;
          font-size: 11.5px;
          letter-spacing: 0.04em;
          padding: 7px 13px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }
        .abarva-landing .video-section {
          background: linear-gradient(180deg, #f8f7f4 0%, #ffffff 48%, #f3f1ec 100%);
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .abarva-landing .video-shell {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(11, 20, 34, 0.14);
          background: #08111f;
          box-shadow: var(--shadow);
        }
        .abarva-landing .video-shell video {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #08111f;
        }
        .abarva-landing .video-shell .pf-tag {
          position: absolute;
          right: 16px;
          top: 16px;
          background: rgba(8, 15, 26, 0.74);
          backdrop-filter: blur(8px);
          color: #e7eefb;
          font-size: 11.5px;
          letter-spacing: 0.04em;
          padding: 7px 13px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          pointer-events: none;
        }
        .abarva-landing .video-caption {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          margin-top: 16px;
          color: var(--mute);
          font-size: 13px;
        }
        .abarva-landing .video-caption b {
          color: var(--ink2);
        }

        /* ===== GENERAL ===== */
        .abarva-landing .rv {
          opacity: 0;
          transform: translateY(34px);
          transition: opacity 0.8s cubic-bezier(0.16, 0.8, 0.3, 1),
            transform 0.8s cubic-bezier(0.16, 0.8, 0.3, 1);
        }
        .abarva-landing .rv.in {
          opacity: 1;
          transform: none;
        }
        .abarva-landing section {
          padding: 96px 0;
          position: relative;
        }
        .abarva-landing .eyebrow {
          font-size: 12px;
          letter-spacing: 0.16em;
          color: var(--mute);
          text-transform: uppercase;
          font-weight: 800;
        }
        .abarva-landing .lead {
          font-size: 42px;
          line-height: 1.12;
          max-width: 860px;
          margin: 12px 0 0;
        }
        .abarva-landing .body {
          font-size: 19px;
          color: #3a3d45;
          max-width: 720px;
          margin: 22px 0 0;
          line-height: 1.58;
        }
        .abarva-landing .body-wide {
          max-width: 920px;
        }
        .abarva-landing .section-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 42px;
          margin-bottom: 36px;
        }
        .abarva-landing .section-head .lead {
          margin-bottom: 0;
        }
        .abarva-landing .section-head .body {
          max-width: 430px;
          margin-bottom: 3px;
          font-size: 16px;
          color: var(--mute);
        }

        /* ===== WHY NOW ===== */
        .abarva-landing .why {
          background: var(--paper);
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .abarva-landing .question-grid {
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 42px;
          align-items: stretch;
          margin-top: 34px;
        }
        .abarva-landing .quote-box {
          background: radial-gradient(700px 300px at 100% 0%, rgba(91, 140, 255, 0.16), transparent 70%),
            linear-gradient(135deg, #0b1422, #101c30);
          border-radius: 20px;
          padding: 42px;
          color: #fff;
          min-height: 350px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 35px 90px -54px rgba(11, 20, 34, 0.8);
        }
        .abarva-landing .quote-box h3 {
          font-size: 36px;
          line-height: 1.12;
          color: #fff;
          margin: 0;
          max-width: 610px;
        }
        .abarva-landing .quote-box p {
          font-size: 16px;
          color: #b7c2d6;
          margin-top: 22px;
          max-width: 560px;
        }
        .abarva-landing .q-list {
          display: grid;
          gap: 12px;
        }
        .abarva-landing .q-line {
          background: #fbfaf7;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .abarva-landing .q-line span {
          font-family: Georgia, serif;
          color: #13a98a;
          font-size: 19px;
          line-height: 1;
        }
        .abarva-landing .q-line b {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 18px;
          color: var(--ink);
          line-height: 1.25;
        }

        /* ===== LEAKS ===== */
        .abarva-landing .quad {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 38px;
        }
        .abarva-landing .qcard {
          background: #fbfaf7;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 25px 22px;
          transition: 0.25s;
        }
        .abarva-landing .qcard:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 55px -34px rgba(11, 20, 34, 0.35);
          background: #fff;
        }
        .abarva-landing .qcard .qn {
          font-family: Georgia, serif;
          font-size: 15px;
          color: #bfb9ac;
          letter-spacing: 0.1em;
        }
        .abarva-landing .qcard b {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 21px;
          display: block;
          margin: 10px 0 8px;
          color: var(--ink);
          letter-spacing: -0.3px;
          line-height: 1.16;
        }
        .abarva-landing .qcard p {
          font-size: 14px;
          color: var(--mute);
          margin: 0;
          line-height: 1.5;
        }
        .abarva-landing .qcard.win {
          background: #fff;
        }
        .abarva-landing .qcard.win .qn {
          color: #13a98a;
          font-size: 22px;
          font-weight: bold;
        }

        /* ===== OPERATING LOOP ===== */
        .abarva-landing .loop {
          background: linear-gradient(180deg, #f8f7f4 0%, #f3f1ec 100%);
        }
        .abarva-landing .loop-board {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-top: 40px;
          position: relative;
        }
        .abarva-landing .loop-step {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 17px;
          padding: 24px 18px;
          min-height: 250px;
          position: relative;
          overflow: hidden;
          transition: 0.25s;
        }
        .abarva-landing .loop-step:before {
          content: '';
          position: absolute;
          left: 18px;
          right: 18px;
          top: 0;
          height: 3px;
          background: linear-gradient(90deg, #5b8cff, #37e0c0);
          opacity: 0.65;
        }
        .abarva-landing .loop-step:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 55px -36px rgba(11, 20, 34, 0.42);
        }
        .abarva-landing .loop-step .num {
          font-family: Georgia, serif;
          font-size: 14px;
          color: #b7b1a5;
          letter-spacing: 0.1em;
          margin-bottom: 24px;
        }
        .abarva-landing .loop-step h3 {
          font-size: 25px;
          line-height: 1.05;
          margin: 0 0 12px;
          color: var(--ink);
        }
        .abarva-landing .loop-step p {
          font-size: 13.5px;
          color: #5e636e;
          line-height: 1.5;
        }
        .abarva-landing .loop-step .outcome {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
          font-size: 12.2px;
          color: #29303a;
          font-weight: 700;
          line-height: 1.35;
        }

        /* ===== PICTURE THIS ===== */
        .abarva-landing .picture {
          background: radial-gradient(900px 520px at 50% -12%, rgba(91, 140, 255, 0.13), transparent 60%), #07101e;
          color: #fff;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .abarva-landing .picture .eyebrow {
          color: #37e0c0;
        }
        .abarva-landing .picture .lead {
          color: #fff;
          max-width: 780px;
        }
        .abarva-landing .picture .body {
          color: #aebbcf;
        }
        .abarva-landing .moments {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 26px;
          margin-top: 46px;
          position: relative;
        }
        .abarva-landing .moment {
          position: relative;
          background: linear-gradient(160deg, rgba(16, 28, 48, 0.7), rgba(8, 16, 28, 0.62));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 22px 24px 26px;
          backdrop-filter: blur(8px);
          transition: 0.3s;
        }
        .abarva-landing .moment:hover {
          transform: translateY(-5px);
          border-color: rgba(91, 140, 255, 0.36);
          box-shadow: 0 32px 72px -42px rgba(0, 0, 0, 0.75);
        }
        .abarva-landing .moment:not(:last-child)::after {
          content: '';
          position: absolute;
          right: -19px;
          top: 84px;
          width: 14px;
          height: 14px;
          border-top: 2px solid #5b8cff;
          border-right: 2px solid #5b8cff;
          transform: rotate(45deg);
          opacity: 0.7;
          z-index: 3;
        }
        .abarva-landing .moment-gfx {
          height: 132px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .abarva-landing .moment-gfx svg {
          width: 90%;
          max-width: 230px;
          height: auto;
        }
        .abarva-landing .moment-k {
          font-size: 11.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #84b3ff;
          font-weight: 800;
        }
        .abarva-landing .moment:nth-child(3) .moment-k {
          color: #5fe6d0;
        }
        .abarva-landing .moment h3 {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 20.5px;
          line-height: 1.3;
          color: #fff;
          margin: 9px 0 0;
          letter-spacing: -0.2px;
        }
        .abarva-landing .moment h3 .hl {
          color: #8fb6ff;
        }
        .abarva-landing .moment .punch {
          font-size: 15px;
          color: #9fb0c8;
          margin-top: 14px;
          line-height: 1.5;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 13px;
        }
        .abarva-landing .moment .punch b {
          color: #fff;
          font-weight: 600;
        }

        /* ===== SURFACES ===== */
        .abarva-landing .surfaces {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          margin-top: 36px;
        }
        .abarva-landing .surf {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 22px 17px;
          transition: 0.5s, transform 0.25s;
          opacity: 0.2;
          transform: translateY(14px);
        }
        .abarva-landing .surf.lit {
          opacity: 1;
          transform: none;
        }
        .abarva-landing .surf:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 50px -24px rgba(11, 20, 34, 0.35);
        }
        .abarva-landing .surf .smg {
          height: 92px;
          border-radius: 10px;
          margin-bottom: 14px;
          background-size: cover;
          background-position: center;
          background-color: #0b1422;
          border: 1px solid var(--line);
        }
        .abarva-landing .surf b {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 18px;
          display: block;
          margin-bottom: 7px;
        }
        .abarva-landing .surf p {
          font-size: 12.5px;
          color: var(--mute);
          margin: 0;
          line-height: 1.5;
        }

        /* ===== ROLES ===== */
        .abarva-landing .roles {
          background: #fff;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .abarva-landing .role-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 13px;
          margin-top: 38px;
        }
        .abarva-landing .role {
          background: #fbfaf7;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 22px 18px;
          min-height: 230px;
        }
        .abarva-landing .role .tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 34px;
          padding: 0 12px;
          border-radius: 30px;
          background: rgba(91, 140, 255, 0.1);
          border: 1px solid rgba(91, 140, 255, 0.18);
          color: #2d57b9;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 18px;
        }
        .abarva-landing .role h3 {
          font-size: 24px;
          line-height: 1.05;
          margin: 0 0 11px;
        }
        .abarva-landing .role p {
          font-size: 13.5px;
          color: #5f6470;
          line-height: 1.5;
        }

        /* ===== PROOF MODEL ===== */
        .abarva-landing .proof-model {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 42px;
          align-items: center;
        }
        .abarva-landing .stack {
          display: grid;
          gap: 12px;
        }
        .abarva-landing .stack-row {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 16px;
          align-items: start;
        }
        .abarva-landing .stack-row b {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 18px;
          line-height: 1.15;
          color: var(--ink);
        }
        .abarva-landing .stack-row p {
          font-size: 13.5px;
          color: #5f6470;
          line-height: 1.48;
        }
        .abarva-landing .board-card {
          background: linear-gradient(135deg, #0b1422, #14243d);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 22px;
          color: #fff;
          padding: 42px;
          box-shadow: 0 36px 90px -58px rgba(11, 20, 34, 0.8);
        }
        .abarva-landing .board-card .eyebrow {
          color: #89a4d8;
        }
        .abarva-landing .board-card h2 {
          color: #fff;
          font-size: 39px;
          line-height: 1.12;
          margin: 12px 0 18px;
        }
        .abarva-landing .board-card p {
          color: #b8c4d8;
          font-size: 16px;
          line-height: 1.58;
        }
        .abarva-landing .board-card .mini {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 26px;
        }
        .abarva-landing .board-card .mini div {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 14px;
          font-size: 12.5px;
          color: #dce6f6;
          line-height: 1.3;
        }
        .abarva-landing .board-card .mini b {
          display: block;
          color: #37e0c0;
          font-size: 17px;
          margin-bottom: 4px;
          font-family: Georgia, serif;
          font-weight: normal;
        }

        /* ===== TRUST / CTA ===== */
        .abarva-landing .trust {
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          margin-top: 26px;
        }
        .abarva-landing .chip {
          font-size: 13.5px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 30px;
          padding: 9px 16px;
          color: var(--navy);
        }
        .abarva-landing .cohort {
          background: radial-gradient(800px 400px at 50% 0%, #13243f, #0b1422);
          color: #fff;
          border-radius: 22px;
          padding: 66px 48px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 40px 95px -64px rgba(11, 20, 34, 0.9);
        }
        .abarva-landing .cohort h2 {
          color: #fff;
          font-size: 40px;
          line-height: 1.13;
          margin: 16px auto 0;
          max-width: 780px;
        }
        .abarva-landing .cohort p {
          color: #aebbcf;
          max-width: 670px;
          margin: 16px auto 28px;
          font-size: 17px;
          line-height: 1.55;
        }
        .abarva-landing .cohort .bring {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
          margin: 0 auto 26px;
          color: #e8f1ff;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.13);
          padding: 11px 16px;
          border-radius: 30px;
          font-size: 13.5px;
        }
        .abarva-landing footer {
          padding: 46px 0 90px;
          color: var(--mute);
          font-size: 13.5px;
        }

        /* ===== REQUEST MODAL ===== */
        .abarva-landing .req-overlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 12, 22, 0.72);
          backdrop-filter: blur(6px);
          z-index: 80;
          display: none;
          align-items: flex-start;
          justify-content: center;
          overflow-y: auto;
          padding: 6vh 20px;
        }
        .abarva-landing .req-overlay.open {
          display: flex;
        }
        .abarva-landing .req-modal {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 20px;
          width: 100%;
          max-width: 548px;
          box-shadow: 0 50px 120px -40px rgba(11, 20, 34, 0.6);
          overflow: hidden;
          animation: abarvaReqIn 0.28s cubic-bezier(0.16, 0.8, 0.3, 1);
        }
        @keyframes abarvaReqIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .abarva-landing .req-head {
          padding: 26px 30px 18px;
          border-bottom: 1px solid var(--line);
          position: relative;
        }
        .abarva-landing .req-head h3 {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 26px;
          margin: 0;
          color: var(--ink);
        }
        .abarva-landing .req-head p {
          font-size: 14px;
          color: var(--mute);
          margin: 7px 0 0;
          line-height: 1.5;
        }
        .abarva-landing .req-close {
          position: absolute;
          right: 18px;
          top: 18px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: #fff;
          cursor: pointer;
          font-size: 17px;
          color: var(--mute);
          line-height: 1;
        }
        .abarva-landing .req-body {
          padding: 22px 30px 26px;
        }
        .abarva-landing .req-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .abarva-landing .req-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .abarva-landing .req-field.full {
          grid-column: 1 / -1;
        }
        .abarva-landing .req-field label {
          font-size: 12px;
          font-weight: 700;
          color: #3a3d45;
        }
        .abarva-landing .req-field input,
        .abarva-landing .req-field select,
        .abarva-landing .req-field textarea {
          font-family: inherit;
          font-size: 14.5px;
          padding: 11px 13px;
          border: 1px solid #d9d6cd;
          border-radius: 10px;
          background: #fbfaf7;
          color: var(--ink);
          outline: none;
          transition: 0.15s;
          width: 100%;
        }
        .abarva-landing .req-field input:focus,
        .abarva-landing .req-field select:focus,
        .abarva-landing .req-field textarea:focus {
          border-color: #5b8cff;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(91, 140, 255, 0.12);
        }
        .abarva-landing .req-field textarea {
          resize: vertical;
          min-height: 72px;
        }
        .abarva-landing .req-radio {
          display: flex;
          gap: 10px;
        }
        .abarva-landing .req-radio label {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #d9d6cd;
          border-radius: 10px;
          padding: 11px 13px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #3a3d45;
          background: #fbfaf7;
        }
        .abarva-landing .req-radio input {
          accent-color: #5b8cff;
        }
        .abarva-landing .req-submit {
          margin-top: 16px;
          width: 100%;
          justify-content: center;
        }
        .abarva-landing .req-submit[disabled] {
          opacity: 0.6;
          cursor: progress;
        }
        .abarva-landing .req-error {
          margin-top: 12px;
          font-size: 12.5px;
          color: #c0392b;
          text-align: center;
          line-height: 1.45;
        }
        .abarva-landing .req-fine {
          font-size: 12px;
          color: var(--mute);
          margin-top: 12px;
          text-align: center;
        }
        .abarva-landing .req-success {
          padding: 50px 30px;
          text-align: center;
        }
        .abarva-landing .req-success .ok {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(55, 224, 192, 0.14);
          border: 1px solid rgba(55, 224, 192, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #13a98a;
          font-size: 26px;
        }
        .abarva-landing .req-success h3 {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 24px;
          margin: 0 0 8px;
          color: var(--ink);
        }
        .abarva-landing .req-success p {
          font-size: 15px;
          color: var(--mute);
          margin: 0;
          line-height: 1.5;
        }
        @media (max-width: 560px) {
          .abarva-landing .req-grid {
            grid-template-columns: 1fr;
          }
          .abarva-landing .req-radio {
            flex-direction: column;
          }
        }

        @media (max-width: 1080px) {
          .abarva-landing .quad {
            grid-template-columns: repeat(2, 1fr);
          }
          .abarva-landing .loop-board,
          .abarva-landing .surfaces,
          .abarva-landing .role-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .abarva-landing .proof-model,
          .abarva-landing .question-grid {
            grid-template-columns: 1fr;
          }
          .abarva-landing .section-head {
            display: block;
          }
          .abarva-landing .section-head .body {
            max-width: 720px;
            margin-top: 18px;
          }
        }
        @media (max-width: 920px) {
          .abarva-landing .lead {
            font-size: 32px;
          }
          .abarva-landing .surfaces {
            grid-template-columns: 1fr;
          }
          .abarva-landing .surf {
            opacity: 1;
            transform: none;
          }
          .abarva-landing .loop-board,
          .abarva-landing .role-grid {
            grid-template-columns: 1fr;
          }
          .abarva-landing .moments {
            grid-template-columns: 1fr;
          }
          .abarva-landing .moment:not(:last-child)::after {
            right: auto;
            left: 50%;
            top: auto;
            bottom: -19px;
            transform: translateX(-50%) rotate(135deg);
          }
        }
        @media (max-width: 640px) {
          .abarva-landing .wrap {
            padding: 0 22px;
          }
          .abarva-landing .navlinks .btn-line {
            display: none;
          }
          .abarva-landing .quad {
            grid-template-columns: 1fr;
          }
          .abarva-landing .body {
            font-size: 17px;
          }
          .abarva-landing .quote-box,
          .abarva-landing .board-card,
          .abarva-landing .cohort {
            padding: 32px 24px;
          }
          .abarva-landing .quote-box h3,
          .abarva-landing .board-card h2,
          .abarva-landing .cohort h2 {
            font-size: 30px;
          }
          .abarva-landing .stack-row {
            grid-template-columns: 1fr;
          }
          .abarva-landing .board-card .mini {
            grid-template-columns: 1fr;
          }
        }

        /* ===== FULL-BLEED HERO (app-root style) ===== */
        .abarva-landing .fbhero {
          position: relative;
          min-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: radial-gradient(900px 540px at 80% 8%, rgba(91, 140, 255, 0.2), transparent 56%),
            radial-gradient(720px 520px at 8% 105%, rgba(55, 224, 192, 0.13), transparent 60%),
            linear-gradient(160deg, #0a1424, #070f1c 55%, #0b1626);
        }
        .abarva-landing .fbhero::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: radial-gradient(circle at 72% 26%, #000, transparent 66%);
        }
        .abarva-landing .fb-nav {
          position: relative;
          z-index: 3;
        }
        .abarva-landing .fb-nav .wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 84px;
        }
        .abarva-landing .fb-content {
          position: relative;
          z-index: 3;
          flex: 1;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          gap: 46px;
          align-items: center;
          padding: 10px 0 30px;
        }
        .abarva-landing .fb-left {
          max-width: 610px;
        }
        .abarva-landing .fb-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.065em;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #dfe7f5;
          padding: 7px 14px;
          border-radius: 30px;
        }
        .abarva-landing .fb-pill .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #37e0c0;
          box-shadow: 0 0 10px #37e0c0;
          animation: abarvaPulse 2.2s infinite;
        }
        .abarva-landing .fb-head {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 58px;
          line-height: 1.03;
          letter-spacing: -0.5px;
          color: #fff;
          margin: 22px 0 0;
          text-shadow: 0 2px 30px rgba(0, 0, 0, 0.5);
        }
        .abarva-landing .fb-head .grad {
          background: linear-gradient(120deg, #8fb6ff, #37e0c0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-style: italic;
        }
        .abarva-landing .fb-sub {
          font-size: 18.5px;
          color: #c4d0e2;
          max-width: 548px;
          margin: 22px 0 26px;
          line-height: 1.55;
        }
        .abarva-landing .fb-cta {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .abarva-landing .fb-micro {
          margin-top: 28px;
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          font-size: 12.5px;
          color: #9fb0c8;
        }
        .abarva-landing .fb-micro span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .abarva-landing .fb-micro i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #5b8cff;
          display: inline-block;
          box-shadow: 0 0 8px #5b8cff;
        }
        .abarva-landing .fb-dims {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .abarva-landing .fb-dim {
          position: relative;
          display: grid;
          grid-template-columns: 40px 1fr;
          gap: 16px;
          align-items: start;
        }
        .abarva-landing .fb-dim-n {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Georgia, serif;
          font-size: 16px;
          color: #eaf1ff;
          background: rgba(91, 140, 255, 0.16);
          border: 1px solid rgba(91, 140, 255, 0.5);
          box-shadow: 0 0 18px rgba(91, 140, 255, 0.28);
          position: relative;
          z-index: 2;
        }
        .abarva-landing .fb-dim:nth-child(2) .fb-dim-n {
          background: rgba(73, 182, 255, 0.16);
          border-color: rgba(73, 182, 255, 0.55);
        }
        .abarva-landing .fb-dim:nth-child(3) .fb-dim-n {
          background: rgba(55, 224, 192, 0.16);
          border-color: rgba(55, 224, 192, 0.55);
          box-shadow: 0 0 18px rgba(55, 224, 192, 0.28);
        }
        .abarva-landing .fb-dim:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 19px;
          top: 40px;
          height: calc(100% + 14px);
          width: 2px;
          background: linear-gradient(180deg, rgba(91, 140, 255, 0.65), rgba(55, 224, 192, 0.45));
          z-index: 1;
        }
        .abarva-landing .fb-dim-card {
          background: linear-gradient(150deg, rgba(18, 30, 52, 0.9), rgba(8, 16, 28, 0.93));
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 15px;
          padding: 16px 19px;
          backdrop-filter: blur(12px);
          box-shadow: 0 28px 64px -40px rgba(0, 0, 0, 0.82);
          transition: 0.25s;
        }
        .abarva-landing .fb-dim-card:hover {
          transform: translateX(5px);
          border-color: rgba(91, 140, 255, 0.42);
        }
        .abarva-landing .fb-dim-k {
          font-size: 11px;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: #84b3ff;
          font-weight: 800;
        }
        .abarva-landing .fb-dim:nth-child(3) .fb-dim-k {
          color: #5fe6d0;
        }
        .abarva-landing .fb-dim-h {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 18.5px;
          line-height: 1.2;
          color: #fff;
          margin: 7px 0 0;
          letter-spacing: -0.2px;
        }
        .abarva-landing .fb-dim-sig {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 12.5px;
          color: #9fb0c8;
        }
        .abarva-landing .fb-dim-sig b {
          color: #37e0c0;
          font-weight: 700;
          white-space: nowrap;
        }
        .abarva-landing .fb-stats {
          position: relative;
          z-index: 3;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(4, 9, 17, 0.45);
          backdrop-filter: blur(8px);
        }
        .abarva-landing .fb-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .abarva-landing .fb-stat {
          padding: 24px 28px 24px 0;
        }
        .abarva-landing .fb-stat + .fb-stat {
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          padding-left: 28px;
        }
        .abarva-landing .fb-stat b {
          font-family: Georgia, serif;
          font-weight: normal;
          font-size: 21px;
          color: #fff;
          display: block;
          letter-spacing: -0.2px;
        }
        .abarva-landing .fb-stat span {
          font-size: 13px;
          color: #9fb0c8;
          display: block;
          margin-top: 4px;
        }
        .abarva-landing .signed-out-note {
          margin-top: 22px;
          max-width: 548px;
          border-left: 3px solid #37e0c0;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 0 10px 10px 0;
          padding: 14px 16px;
          color: #c4d0e2;
          font-size: 13px;
          line-height: 1.55;
        }
        @media (max-width: 920px) {
          .abarva-landing .fb-content {
            grid-template-columns: 1fr;
            gap: 26px;
          }
          .abarva-landing .fb-head {
            font-size: 40px;
          }
          .abarva-landing .fb-stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .abarva-landing .fb-stat + .fb-stat {
            border-left: 0;
            padding-left: 0;
          }
          .abarva-landing .fb-stat {
            padding: 18px 0;
          }
        }
      `}</style>

      {/* ===== FULL-BLEED HERO ===== */}
      <header className="fbhero">
        <nav className="fb-nav">
          <div className="wrap">
            <img
              src="/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-dark-compact.svg"
              alt="AbarVa"
              style={{ height: 24, width: 'auto', display: 'block' }}
            />
            <div className="navlinks">
              <a
                className="btn btn-dark"
                href="#product-tour"
                data-track-click
                data-track-id="marketing-nav-product-tour"
                onClick={() => trackMarketingEvent('abarva.marketing_product_tour_clicked', { location: 'nav' })}
              >
                Watch product tour
              </a>
              <button
                className="btn btn-prime"
                type="button"
                data-track-id="marketing-nav-request-access"
                onClick={openReq}
              >
                Request access
              </button>
            </div>
          </div>
        </nav>
        <div className="wrap fb-content">
          <div className="fb-left">
            <span className="fb-pill">
              <span className="dot" />
              Private preview · founder-led
            </span>
            <h1 className="fb-head">
              If your enterprise is spending on AI, and you&apos;re the CXO accountable,
              <span className="grad"> prove which bets deserve to scale</span>.
            </h1>
            <p className="fb-sub">
              AbarVa helps executives see which AI bets are real, which ones need more evidence,
              and how to move from ambition to governed execution and measurable value.
            </p>
            <div className="fb-cta">
              <button
                className="btn btn-prime"
                type="button"
                data-track-id="marketing-hero-request-access"
                onClick={openReq}
              >
                Request private preview
              </button>
              <a
                className="btn btn-dark"
                href="#product-tour"
                data-track-click
                data-track-id="marketing-hero-product-tour"
                onClick={() => trackMarketingEvent('abarva.marketing_product_tour_clicked', { location: 'hero' })}
              >
                Watch product tour
              </a>
            </div>
            <div className="fb-micro">
              <span>
                <i />
                Evidence before funding
              </span>
              <span>
                <i />
                Human approval at every gate
              </span>
              <span>
                <i />
                Measurable value
              </span>
            </div>
            {signedOut && (
              <div className="signed-out-note">
                You are signed out. The active workspace context has been cleared. Please use the
                access instructions sent to your email.
              </div>
            )}
          </div>
          <div className="fb-dims">
            <div className="fb-dim">
              <span className="fb-dim-n">01</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Decide · before funding</div>
                <div className="fb-dim-h">
                  See the bet that won&rsquo;t land — and move the money to two that will.
                </div>
                <div className="fb-dim-sig">
                  <span>Readiness</span>
                  <b>72% · reshape</b>
                </div>
              </div>
            </div>
            <div className="fb-dim">
              <span className="fb-dim-n">02</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Source · at the table</div>
                <div className="fb-dim-h">Walk into the negotiation already holding the evidence.</div>
                <div className="fb-dim-sig">
                  <span>Leverage</span>
                  <b>comparison ready</b>
                </div>
              </div>
            </div>
            <div className="fb-dim">
              <span className="fb-dim-n">03</span>
              <div className="fb-dim-card">
                <div className="fb-dim-k">Prove · after launch</div>
                <div className="fb-dim-h">Show exactly where the value showed up — and defend it.</div>
                <div className="fb-dim-sig">
                  <span>Value</span>
                  <b>projected → validated</b>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fb-stats">
          <div className="wrap">
            <div className="fb-stats-grid">
              <div className="fb-stat">
                <b>Evidence</b>
                <span>before a dollar is funded</span>
              </div>
              <div className="fb-stat">
                <b>5 surfaces</b>
                <span>one governed loop</span>
              </div>
              <div className="fb-stat">
                <b>Every gate</b>
                <span>human-approved</span>
              </div>
              <div className="fb-stat">
                <b>Value proof</b>
                <span>projected · observed · validated</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== WHY NOW ===== */}
      <section className="why">
        <div className="wrap rv">
          <div className="eyebrow">Why now</div>
          <h2 className="lead">AI spend is moving faster than enterprise control.</h2>
          <p className="body body-wide">
            Boards are asking for AI growth. Business units are launching pilots. Vendors are pushing
            platforms. Transformation teams are trying to scale use cases. But most companies still
            lack one governed system to connect funding decisions, program execution, sourcing
            choices, adoption, risk, and value proof.
          </p>
          <div className="question-grid">
            <div className="quote-box">
              <div>
                <div className="eyebrow" style={{ color: '#8fb6ff' }}>
                  The real failure point
                </div>
                <h3>
                  Enterprise AI is not failing only at the model layer. It is failing at the
                  decision, funding, sourcing, execution, and value-realization layer.
                </h3>
              </div>
              <p>
                The bottleneck is not ambition. It is the missing operating system from board intent
                to measurable outcome.
              </p>
            </div>
            <div className="q-list">
              <div className="q-line">
                <span>→</span>
                <b>Which AI bets should we fund?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Which should we stop early?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Who owns the value?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Are we sourcing the right partners?</b>
              </div>
              <div className="q-line">
                <span>→</span>
                <b>Can we prove the outcome after launch?</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHERE VALUE LEAKS ===== */}
      <section>
        <div className="wrap rv">
          <div className="eyebrow">Where value leaks</div>
          <h2 className="lead">Four places enterprise AI quietly loses its value.</h2>
          <div className="quad">
            <div className="qcard">
              <div className="qn">01</div>
              <b>Wrong bets get funded</b>
              <p>
                AI investments often move forward because they are visible, sponsored, or exciting —
                not because the evidence says they will land.
              </p>
            </div>
            <div className="qcard">
              <div className="qn">02</div>
              <b>Pilots never become programs</b>
              <p>
                Promising prototypes stall because ownership, workflow impact, data readiness,
                compliance, and adoption were never governed upfront.
              </p>
            </div>
            <div className="qcard">
              <div className="qn">03</div>
              <b>Vendors shape the agenda</b>
              <p>
                Enterprises enter platform, SI, and product decisions without a clear comparison
                model, value case, or negotiation leverage.
              </p>
            </div>
            <div className="qcard">
              <div className="qn">04</div>
              <b>Value becomes a story</b>
              <p>
                Benefits are claimed in business cases, but rarely tracked through adoption,
                operational change, financial impact, and accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OPERATING LOOP ===== */}
      <section className="loop" id="loop">
        <div className="wrap rv">
          <div className="section-head">
            <div>
              <div className="eyebrow">What AbarVa does</div>
              <h2 className="lead">
                One governed AI value loop — from &ldquo;which bet?&rdquo; to &ldquo;did it
                land?&rdquo;
              </h2>
            </div>
            <p className="body">
              AbarVa keeps leaders in command while agents do the rigorous work: evidence assembly,
              program shaping, sourcing intelligence, governance signals, and value proof.
            </p>
          </div>

          <div className="loop-board">
            <div className="loop-step">
              <div className="num">01</div>
              <h3>Prioritize</h3>
              <p>
                Score AI opportunities against value potential, readiness, risk, sponsorship, data
                dependency, and execution complexity.
              </p>
              <div className="outcome">Output: ranked bets and kill/reshape signals.</div>
            </div>
            <div className="loop-step">
              <div className="num">02</div>
              <h3>Shape</h3>
              <p>
                Convert the selected bet into an execution-ready program with scope, sponsor,
                milestones, value logic, dependencies, and approval gates.
              </p>
              <div className="outcome">Output: governed program charter.</div>
            </div>
            <div className="loop-step">
              <div className="num">03</div>
              <h3>Source</h3>
              <p>
                Compare vendors, SIs, platforms, and internal build paths using structured evidence
                — not only sales narratives.
              </p>
              <div className="outcome">Output: sourcing leverage and deal risk.</div>
            </div>
            <div className="loop-step">
              <div className="num">04</div>
              <h3>Govern</h3>
              <p>
                Track execution across blockers, decisions, owners, risks, milestones, compliance
                gates, and human approvals.
              </p>
              <div className="outcome">Output: accountable execution rhythm.</div>
            </div>
            <div className="loop-step">
              <div className="num">05</div>
              <h3>Prove</h3>
              <p>
                Connect projected value to observed outcomes, adoption, operational change, and
                defensible executive reporting.
              </p>
              <div className="outcome">Output: value proof the board can trust.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PICTURE THIS — THREE MOMENTS ===== */}
      <section className="picture">
        <div className="wrap rv">
          <div className="eyebrow">Picture this</div>
          <h2 className="lead">Three moments where the outcome changes.</h2>
          <p className="body">
            The same governed loop, seen at the three points where AI value is usually won or lost.
          </p>
          <div className="moments">
            <div className="moment">
              <div className="moment-gfx">
                <svg viewBox="0 0 240 130">
                  <circle cx="24" cy="64" r="8" fill="#5b8cff" />
                  <path
                    d="M32 63 C95 63 120 28 184 28"
                    fill="none"
                    stroke="rgba(255,255,255,.16)"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  />
                  <g transform="translate(196,28)">
                    <circle r="11" fill="rgba(255,122,122,.12)" stroke="#ff7a7a" strokeWidth="2" />
                    <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#ff7a7a" strokeWidth="2.2" />
                  </g>
                  <path
                    d="M32 66 C95 66 128 71 188 65"
                    fill="none"
                    stroke="#37e0c0"
                    strokeWidth="2.6"
                  />
                  <circle cx="197" cy="65" r="8" fill="#37e0c0" />
                  <path
                    d="M32 67 C95 67 132 102 188 100"
                    fill="none"
                    stroke="#5b8cff"
                    strokeWidth="2.6"
                  />
                  <circle cx="197" cy="100" r="8" fill="#5b8cff" />
                </svg>
              </div>
              <div className="moment-k">01 · Before funding</div>
              <h3>
                Before a major AI program is funded, your leaders can see that the business case is
                strong — but{' '}
                <span className="hl">
                  the data readiness, adoption path, and operating model are not.
                </span>
              </h3>
              <p className="punch">
                You do not kill the ambition. <b>You reshape the bet before the money moves.</b>
              </p>
            </div>
            <div className="moment">
              <div className="moment-gfx">
                <svg viewBox="0 0 240 130">
                  <line x1="36" y1="113" x2="204" y2="113" stroke="rgba(255,255,255,.13)" strokeWidth="1.5" />
                  <rect x="56" y="74" width="30" height="38" rx="4" fill="rgba(91,140,255,.4)" />
                  <rect x="106" y="48" width="30" height="64" rx="4" fill="#5b8cff" />
                  <rect x="156" y="84" width="30" height="28" rx="4" fill="rgba(91,140,255,.4)" />
                  <g transform="translate(121,34)">
                    <circle r="13" fill="#37e0c0" />
                    <path d="M-5 0 L-1 4 L6 -5" fill="none" stroke="#06101e" strokeWidth="2.6" />
                  </g>
                </svg>
              </div>
              <div className="moment-k">02 · At the negotiation</div>
              <h3>
                Before a vendor negotiation, you know which capabilities matter, where pricing has
                leverage, and{' '}
                <span className="hl">which implementation risks should be contracted upfront.</span>
              </h3>
              <p className="punch">
                You do not buy the best pitch. <b>You buy the best path to value.</b>
              </p>
            </div>
            <div className="moment">
              <div className="moment-gfx">
                <svg viewBox="0 0 240 130">
                  <defs>
                    <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#37e0c0" stopOpacity=".34" />
                      <stop offset="1" stopColor="#37e0c0" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M26 100 L88 78 L150 56 L210 30"
                    fill="none"
                    stroke="rgba(255,255,255,.22)"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                  />
                  <path
                    d="M26 108 L82 92 L134 70 L188 44 L210 34"
                    fill="none"
                    stroke="#37e0c0"
                    strokeWidth="2.8"
                  />
                  <path
                    d="M26 108 L82 92 L134 70 L188 44 L210 34 L210 116 L26 116 Z"
                    fill="url(#pv)"
                  />
                  <circle cx="82" cy="92" r="6" fill="#5b8cff" />
                  <circle cx="134" cy="70" r="6" fill="#49b6ff" />
                  <g transform="translate(198,40)">
                    <circle r="12" fill="#37e0c0" />
                    <path d="M-5 0 L-1 4 L6 -5" fill="none" stroke="#06101e" strokeWidth="2.4" />
                  </g>
                </svg>
              </div>
              <div className="moment-k">03 · After launch</div>
              <h3>
                Six months after launch, the board does not hear &ldquo;the pilot was
                successful.&rdquo; They see{' '}
                <span className="hl">
                  what was funded, what changed, who adopted it, and what value showed up.
                </span>
              </h3>
              <p className="punch">
                Projected, observed, and validated outcomes — <b>in one governed loop.</b>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FIVE SURFACES ===== */}
      <section>
        <div className="wrap rv">
          <div className="eyebrow">One platform · five connected surfaces</div>
          <h2 className="lead">Five surfaces. One continuous loop.</h2>
          <p className="body">
            Each surface hands the next one evidence — so the decision you make in month one is the
            value you can defend in month twelve.
          </p>
          <div className="surfaces" id="surfaces-row">
            <div className="surf">
              <div
                className="smg"
                style={{ backgroundImage: 'url(/marketing/surf-intelligence.png)' }}
              />
              <b>Intelligence</b>
              <p>Decide which AI bets are worth it — and which to kill or reshape early.</p>
            </div>
            <div className="surf">
              <div className="smg" style={{ backgroundImage: 'url(/marketing/surf-moves.png)' }} />
              <b>Strategic Moves</b>
              <p>Turn a bet into an execution-ready program — sponsor, scope, value logic, gates.</p>
            </div>
            <div className="surf">
              <div className="smg" style={{ backgroundImage: 'url(/marketing/surf-source.png)' }} />
              <b>Source</b>
              <p>Negotiate from evidence on every vendor, SI, and platform decision.</p>
            </div>
            <div className="surf">
              <div className="smg" style={{ backgroundImage: 'url(/marketing/surf-tower.png)' }} />
              <b>Tower</b>
              <p>Govern execution — adoption, decisions, blockers, risk, milestones, outcomes.</p>
            </div>
            <div className="surf">
              <div className="smg" style={{ backgroundImage: 'url(/marketing/surf-context.png)' }} />
              <b>Context</b>
              <p>Grounded in your enterprise evidence — not generic AI recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRODUCT VIDEO ===== */}
      <section className="video-section" id="product-tour">
        <div className="wrap rv">
          <div className="section-head">
            <div>
              <div className="eyebrow">Product walkthrough</div>
              <h2 className="lead">A rapid tour of the AbarVa operating loop.</h2>
            </div>
            <p className="body">
              A short CXO-safe preview of how client context, industry perspective, governed
              execution, sourcing, and value proof connect without exposing implementation details.
            </p>
          </div>
          <div className="video-shell" data-track-click data-track-id="marketing-product-video-shell">
            <video
              controls
              preload="metadata"
              poster="/marketing/abarva-demo-cxo-safe-poster.jpg"
              aria-label="AbarVa product walkthrough video"
              onPlay={() => trackMarketingEvent('abarva.marketing_video_played')}
              onEnded={() => trackMarketingEvent('abarva.marketing_video_completed')}
            >
              <source src="/marketing/abarva-demo-cxo-safe-qa-passed.mp4" type="video/mp4" />
              Your browser does not support embedded video playback.
            </video>
            <span className="pf-tag">Private preview</span>
          </div>
          <div className="video-caption">
            <span>
              <b>What viewers see:</b> Home, Intelligence, Moves, Source, and Tower as one governed
              operating model.
            </span>
            <span>
              <b>What stays private:</b> prompts, proprietary control logic, and tenant-specific
              implementation details.
            </span>
          </div>
        </div>
      </section>

      {/* ===== INSIDE THE PRODUCT ===== */}
      <section style={{ background: 'linear-gradient(180deg,#F8F7F4,#F3F1EC)' }}>
        <div className="wrap rv">
          <div className="section-head">
            <div>
              <div className="eyebrow">Inside the product</div>
              <h2 className="lead">The actual Strategic Moves surface.</h2>
            </div>
            <p className="body">
              A real view of the governed portfolio — moves in flight, value at stake, decision
              gates, and what needs attention. Illustrative data shown.
            </p>
          </div>
          <div className="product-frame">
            <img
              src="/marketing/moves-real.png"
              alt="AbarVa Strategic Moves — illustrative product view"
            />
            <span className="pf-tag">Illustrative</span>
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}
      <section className="roles">
        <div className="wrap rv">
          <div className="eyebrow">Built for executive accountability</div>
          <h2 className="lead">Different leaders. One shared version of AI value.</h2>
          <div className="role-grid">
            <div className="role">
              <span className="tag">CIO</span>
              <h3>Technology investment clarity</h3>
              <p>
                Know which AI programs deserve platform investment, where execution risk is building,
                and which architecture choices create leverage.
              </p>
            </div>
            <div className="role">
              <span className="tag">CDAO</span>
              <h3>From models to adoption</h3>
              <p>
                Move beyond pilots and dashboards into governed data readiness, workflow adoption,
                and measurable business outcomes.
              </p>
            </div>
            <div className="role">
              <span className="tag">CFO</span>
              <h3>Spend tied to proof</h3>
              <p>
                See which AI investments have defensible value logic, accountable ownership, and
                evidence of realized financial impact.
              </p>
            </div>
            <div className="role">
              <span className="tag">CPO</span>
              <h3>Sourcing leverage</h3>
              <p>
                Enter vendor and SI negotiations with structured comparisons, deal risks, and value
                evidence before the terms are shaped.
              </p>
            </div>
            <div className="role">
              <span className="tag">Transformation</span>
              <h3>Programs that land</h3>
              <p>
                Turn scattered AI use cases into governed programs with decisions, gates, owners,
                risks, and value tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROOF MODEL ===== */}
      <section>
        <div className="wrap rv">
          <div className="proof-model">
            <div className="board-card">
              <div className="eyebrow">The board-ready value model</div>
              <h2>Move from AI theater to AI accountability.</h2>
              <p>
                AbarVa creates the evidence trail leaders need to defend AI spend: why the bet was
                funded, what assumptions mattered, how execution was governed, and whether value
                showed up.
              </p>
              <div className="mini">
                <div>
                  <b>Projected</b>Business case, value pool, assumptions.
                </div>
                <div>
                  <b>Observed</b>Adoption, workflow change, operating signals.
                </div>
                <div>
                  <b>Validated</b>Outcome evidence, owner approval, executive proof.
                </div>
              </div>
            </div>
            <div className="stack">
              <div className="stack-row">
                <b>Evidence before funding</b>
                <p>
                  Pressure-test value, readiness, risk, sponsorship, and data dependency before
                  resources are committed.
                </p>
              </div>
              <div className="stack-row">
                <b>Governance during execution</b>
                <p>
                  Keep humans in command with approval gates, decision logs, risk signals, and clear
                  ownership.
                </p>
              </div>
              <div className="stack-row">
                <b>Leverage during sourcing</b>
                <p>
                  Compare vendors, SIs, platforms, and internal build paths against the same value
                  logic.
                </p>
              </div>
              <div className="stack-row">
                <b>Proof after launch</b>
                <p>
                  Connect adoption and operational change back to the value case — not just the
                  launch milestone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT CHANGES ===== */}
      <section style={{ background: '#fff', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap rv">
          <div className="eyebrow">What changes with AbarVa</div>
          <h2 className="lead">A governed path from AI ambition to business value.</h2>
          <div className="quad">
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From AI theater to accountability</b>
              <p>Every funded bet has evidence, ownership, gates, and value logic.</p>
            </div>
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From pilots to programs</b>
              <p>Use cases move through a repeatable path from idea to execution to measurable outcome.</p>
            </div>
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From vendor dependency to leverage</b>
              <p>Platform, SI, and product decisions are shaped by your evidence — not only vendor narratives.</p>
            </div>
            <div className="qcard win">
              <div className="qn">→</div>
              <b>From optimism to proof</b>
              <p>Projected, observed, and validated outcomes are tracked in one continuous loop.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST ===== */}
      <section>
        <div className="wrap rv">
          <div className="eyebrow">Designed for trust and control</div>
          <h2 className="lead">Governed by design. Human in command.</h2>
          <div className="trust">
            <span className="chip">Governed enterprise evidence</span>
            <span className="chip">Source-aware recommendations</span>
            <span className="chip">Human approval at every gate</span>
            <span className="chip">Decision and risk traceability</span>
            <span className="chip">Measurable value</span>
            <span className="chip">Clear accountability</span>
          </div>
          <p className="body" style={{ marginTop: 24 }}>
            Built for CIOs, CDAOs, CFOs, CPOs, and transformation leaders accountable for outcomes.
            Client-specific detail, methodology, and sample value loops are shown only in private
            preview.
          </p>
        </div>
      </section>

      {/* ===== COHORT CTA ===== */}
      <section>
        <div className="wrap rv">
          <div className="cohort">
            <span
              className="pill"
              style={{
                background: 'rgba(255,255,255,.08)',
                borderColor: 'rgba(255,255,255,.16)',
                color: '#cdd8ea',
              }}
            >
              <span className="dot" />
              Limited launch cohort
            </span>
            <h2>Bring one real AI initiative. We will pressure-test the bet together.</h2>
            <p>
              AbarVa is opening a small number of founder-led private previews for enterprise leaders
              preparing to fund, scale, source, or govern major AI programs.
            </p>
            <div className="bring">
              Pressure-test value · expose execution risk · clarify the path to proof
            </div>
            <br />
            <button className="btn btn-prime" type="button" onClick={openReq}>
              Request private preview
            </button>
            <p style={{ marginTop: 20, fontSize: 14, color: '#8493ab' }}>
              Founder-led private previews ·{' '}
              <a href="mailto:admin@abarva.ai" style={{ color: '#8fb6ff' }}>
                admin@abarva.ai
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer>
        <div
          className="wrap"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <img
            src="/brand/abarva-option2-hq-logo-assets/abarva-option2-hq-nav-light-compact.svg"
            alt="AbarVa"
            style={{ height: 26, width: 'auto', display: 'block' }}
          />
          <div>
            The AI value operating system for governed execution and measurable outcomes.
            <br />
            <span style={{ fontSize: 11 }}>© 2026 AbarVa, Inc.</span>
          </div>
        </div>
      </footer>

      {/* ===== REQUEST-ACCESS MODAL ===== */}
      <div
        className={`req-overlay${modalOpen ? ' open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeReq()
        }}
      >
        <div className="req-modal">
          <div className="req-head">
            <button className="req-close" type="button" onClick={closeReq} aria-label="Close">
              ×
            </button>
            <h3>Request a private preview</h3>
            <p>
              Founder-led previews for enterprise leaders. Tell us a little about you and we&rsquo;ll
              be in touch.
            </p>
          </div>
          {submitted ? (
            <div className="req-success">
              <div className="ok">✓</div>
              <h3>Request received</h3>
              <p>We&rsquo;ll review the fit and send next steps and access instructions by email.</p>
            </div>
          ) : (
            <form className="req-body" onSubmit={handleSubmit}>
              <div className="req-grid">
                <div className="req-field">
                  <label htmlFor="req-name">Full name</label>
                  <input
                    id="req-name"
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Jane Rivera"
                  />
                </div>
                <div className="req-field">
                  <label htmlFor="req-email">Work email</label>
                  <input
                    id="req-email"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="jane@company.com"
                  />
                </div>
                <div className="req-field">
                  <label htmlFor="req-company">Company</label>
                  <input
                    id="req-company"
                    required
                    value={form.company}
                    onChange={(e) => updateField('company', e.target.value)}
                    placeholder="Company name"
                  />
                </div>
                <div className="req-field">
                  <label htmlFor="req-role">Role</label>
                  <select
                    id="req-role"
                    required
                    value={form.role}
                    onChange={(e) => updateField('role', e.target.value)}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    <option>CIO</option>
                    <option>CDAO / CDO</option>
                    <option>CFO</option>
                    <option>CPO / Procurement</option>
                    <option>Transformation / AI lead</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="req-field">
                  <label htmlFor="req-size">Company size</label>
                  <select
                    id="req-size"
                    required
                    value={form.companySize}
                    onChange={(e) => updateField('companySize', e.target.value)}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    <option>Under 1,000</option>
                    <option>1,000–5,000</option>
                    <option>5,000–20,000</option>
                    <option>20,000+</option>
                  </select>
                </div>
                <div className="req-field">
                  <label htmlFor="req-industry">Industry</label>
                  <select
                    id="req-industry"
                    required
                    value={form.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    <option>Healthcare</option>
                    <option>Financial services</option>
                    <option>Retail</option>
                    <option>Technology</option>
                    <option>Manufacturing</option>
                    <option>Public sector</option>
                    <option>Diversified / holdings</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="req-field full">
                  <label>You are a…</label>
                  <div className="req-radio">
                    <label>
                      <input
                        type="radio"
                        name="orgtype"
                        value="enterprise"
                        checked={form.orgType === 'enterprise'}
                        onChange={(e) => updateField('orgType', e.target.value)}
                      />{' '}
                      Enterprise / industry buyer
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="orgtype"
                        value="si"
                        checked={form.orgType === 'si'}
                        onChange={(e) => updateField('orgType', e.target.value)}
                      />{' '}
                      System Integrator / advisory
                    </label>
                  </div>
                </div>
                <div className="req-field full">
                  <label htmlFor="req-initiative">
                    Your top AI initiative to pressure-test{' '}
                    <span style={{ fontWeight: 400, color: '#9aa0ab' }}>(optional)</span>
                  </label>
                  <textarea
                    id="req-initiative"
                    value={form.initiative}
                    onChange={(e) => updateField('initiative', e.target.value)}
                    placeholder="e.g. a flagship AI program we're about to fund…"
                  />
                </div>
              </div>
              <button
                className="btn btn-prime req-submit"
                type="submit"
                data-track-id="marketing-request-access-submit"
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Request private preview'}
              </button>
              {error && <div className="req-error">{error}</div>}
              <div className="req-fine">
                We review every request before granting access. Instructions are sent by email.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
