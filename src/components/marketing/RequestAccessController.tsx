"use client";

import { useCallback, useEffect, useState } from "react";

type RequestForm = {
  name: string;
  email: string;
  company: string;
  role: string;
  companySize: string;
  industry: string;
  orgType: string;
  initiative: string;
};

const EMPTY_FORM: RequestForm = {
  name: "",
  email: "",
  company: "",
  role: "",
  companySize: "",
  industry: "",
  orgType: "enterprise",
  initiative: "",
};

export function RequestAccessController() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openReq = useCallback(() => {
    setError(null);
    setModalOpen(true);
  }, []);

  const closeReq = useCallback(() => {
    setModalOpen(false);
  }, []);

  const updateField = <K extends keyof RequestForm>(
    key: K,
    value: RequestForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-request-access]")) return;
      event.preventDefault();
      openReq();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openReq]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeReq();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeReq]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observers: IntersectionObserver[] = [];

    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in");
        }),
      { threshold: 0.16 },
    );
    document.querySelectorAll(".rv").forEach((el) => revealObserver.observe(el));
    observers.push(revealObserver);

    const row = document.getElementById("surfaces-row");
    if (row) {
      const surfaceObserver = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              document
                .querySelectorAll("#surfaces-row .surf")
                .forEach((surface, index) =>
                  window.setTimeout(
                    () => surface.classList.add("lit"),
                    index * 140,
                  ),
                );
            }
          }),
        { threshold: 0.35 },
      );
      surfaceObserver.observe(row);
      observers.push(surfaceObserver);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      });
      if (!response.ok) {
        let message = "Something went wrong. Please try again.";
        try {
          const data = (await response.json()) as { error?: unknown };
          if (typeof data.error === "string" && data.error.trim()) {
            message = data.error.trim();
          }
        } catch {
          // Keep the generic fallback when the server does not return JSON.
        }
        throw new Error(message);
      }
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`req-overlay${modalOpen ? " open" : ""}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeReq();
      }}
    >
      <div className="req-modal">
        <div className="req-head">
          <button
            className="req-close"
            type="button"
            onClick={closeReq}
            aria-label="Close"
          >
            x
          </button>
          <h3>Request a private preview</h3>
          <p>
            Founder-led previews for enterprise leaders. Tell us a little about
            you and we&rsquo;ll be in touch.
          </p>
        </div>
        {submitted ? (
          <div className="req-success">
            <div className="ok">&#10003;</div>
            <h3>Request received</h3>
            <p>We&rsquo;ll be in touch.</p>
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
                  onChange={(e) => updateField("name", e.target.value)}
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
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="jane@company.com"
                />
              </div>
              <div className="req-field">
                <label htmlFor="req-company">Company</label>
                <input
                  id="req-company"
                  required
                  value={form.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="req-field">
                <label htmlFor="req-role">Role</label>
                <select
                  id="req-role"
                  required
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                >
                  <option value="" disabled>
                    Select...
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
                  onChange={(e) => updateField("companySize", e.target.value)}
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  <option>Under 1,000</option>
                  <option>1,000-5,000</option>
                  <option>5,000-20,000</option>
                  <option>20,000+</option>
                </select>
              </div>
              <div className="req-field">
                <label htmlFor="req-industry">Industry</label>
                <select
                  id="req-industry"
                  required
                  value={form.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                >
                  <option value="" disabled>
                    Select...
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
                <label>You are a...</label>
                <div className="req-radio">
                  <label>
                    <input
                      type="radio"
                      name="orgtype"
                      value="enterprise"
                      checked={form.orgType === "enterprise"}
                      onChange={(e) => updateField("orgType", e.target.value)}
                    />{" "}
                    Enterprise / industry buyer
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="orgtype"
                      value="si"
                      checked={form.orgType === "si"}
                      onChange={(e) => updateField("orgType", e.target.value)}
                    />{" "}
                    System Integrator / advisory
                  </label>
                </div>
              </div>
              <div className="req-field full">
                <label htmlFor="req-initiative">
                  Your top AI initiative to pressure-test{" "}
                  <span style={{ fontWeight: 400, color: "#9aa0ab" }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  id="req-initiative"
                  value={form.initiative}
                  onChange={(e) => updateField("initiative", e.target.value)}
                  placeholder="e.g. a flagship AI program we're about to fund..."
                />
              </div>
            </div>
            <button
              className="btn btn-prime req-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Request access"}
            </button>
            {error && <div className="req-error">{error}</div>}
            <div className="req-fine">
              We review every request before granting access. No spam, ever.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
