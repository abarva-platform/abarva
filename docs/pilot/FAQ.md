# AbarVa — Pilot Client FAQ

**Audience:** Enterprise pilot clients — advisors and executive sponsors  
**Version:** 1.0 — 2026-04-26

---

## Platform and Access

**Q1: How do I log in?**

Go to `https://nexus-vert-kappa.vercel.app`, enter your email address, and enter the 6-digit one-time code sent to your inbox. You do not need a password. If you do not receive the code within 2 minutes, check your spam folder.

---

**Q2: I received an error when logging in. What should I do?**

Contact your AbarVa advisor or email anand.sundaram@thesundaram.com. Include the error message and the email address you used. We respond within 4 business hours.

---

**Q3: Can I share my login with a colleague?**

No. Each user account is tied to a specific email address and role. Ask your AbarVa advisor to create an account for any additional team members who need access.

---

**Q4: What devices does AbarVa work on?**

AbarVa is a web application and works on any modern browser (Chrome, Safari, Firefox, Edge) on laptop or desktop. Mobile browsers are supported but the layout is optimised for desktop screens.

---

## Data and Security

**Q5: Where is our data stored?**

Your organisation's data is stored in a Postgres database hosted by Neon (AWS us-east-1, United States). For clients with EU or private data residency requirements, AbarVa offers an Azure Private Data Plane where your data stays entirely within your Azure subscription. Ask your AbarVa advisor if this applies to you.

---

**Q6: What data does AbarVa have access to?**

During the pilot, AbarVa only has access to data you explicitly provide: programme information, sourcing event data, and any documents you share for the evidence layer. AbarVa does not connect to your internal systems, pull data from external sources, or retain any data beyond what you provide.

---

**Q7: Is AbarVa SOC2 certified?**

Not yet. AbarVa is an early-stage platform in enterprise pilot phase. We have conducted an internal security self-assessment (see `docs/pilot/SECURITY_POSTURE.md`) and are on track to engage a SOC2 auditor after the first paid pilot. We will share our self-assessment on request.

---

**Q8: Has AbarVa been penetration-tested?**

No external penetration test has been conducted. We disclose this openly. An internal OWASP Top 10 review has been completed. External penetration testing is planned before the first paid commercial contract.

---

## What the Platform Shows

**Q9: Is the data in the platform real-time?**

During the pilot, the platform shows either your provided pilot data or deterministic seed data. It is not a live integration with your internal systems in the current phase. Real-time data integration is a post-pilot roadmap item.

---

**Q10: The platform shows data for "Apex Retail" — is that my organisation?**

If your organisation's data has not yet been seeded, you may see the Apex Retail demonstration environment, which is AbarVa's reference example. Your AbarVa advisor will confirm whether you are viewing your organisation's data or a demonstration environment. When your data is loaded, the Apex Retail data will no longer appear in your view.

---

## Features and Roadmap

**Q11: Can AbarVa connect to our existing project management tools (Jira, ServiceNow, etc.)?**

Not in the current pilot phase. Integrations with project management, ITSM, and procurement tools are on the post-pilot roadmap. Your feedback on which integrations would be most valuable will directly inform prioritisation.

---

**Q12: Can AbarVa process documents we upload (contracts, RFP responses)?**

Document upload and processing is planned but not yet live in the pilot. The current evidence layer accepts structured data provided by your AbarVa advisor. File upload is a Wave 30+ feature.

---

## Pilot Process

**Q13: How long is the pilot?**

The pilot duration is agreed with your AbarVa advisor — typically 4–8 weeks. The goal is to validate whether AbarVa delivers measurable value for your specific programmes before moving to a commercial arrangement.

---

**Q14: What do we need to provide for the pilot to be useful?**

At minimum: one or two programme names, their current phase, and a brief description of their business objective. The more information you provide, the more relevant the intelligence signals will be. Your AbarVa advisor will guide you through the data sharing process.

---

_AbarVa Pilot FAQ — v1.0 — 2026-04-26_
