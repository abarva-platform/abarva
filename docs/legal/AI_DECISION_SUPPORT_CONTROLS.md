# AI Decision Support Controls

Status: pilot control baseline  
Owner: AbarVa platform owner  
Last updated: 2026-06-01

## Operating Position

AbarVa provides AI-assisted decision support. Nexus, Sentinel, Atlas, and Steward may recommend, summarize, challenge, and explain evidence. They do not approve, authorize, award, fund, terminate, renew, diagnose, underwrite, or otherwise make consequential decisions.

The client decision owner makes the final business decision after reviewing evidence, assumptions, missing data, alternatives, and applicable approvals.

## Required Controls

1. Every consequential recommendation must identify a client decision owner or state that the owner is missing.
2. Every approval, export, or board-pack workflow must carry the human decision attestation.
3. Every recommendation must expose missing inputs, assumptions, and what would change the recommendation.
4. AI output must use advisor wording. Autonomous-decision wording is blocked or rewritten.
5. Exports must carry the AI-assisted decision-support watermark.
6. High-risk uses require legal/admin escalation before action.
7. Users must be able to accept, modify, reject, or request more evidence; that disposition is part of the decision evidence packet.
8. The model risk register must identify intended use, risk domains, human oversight, monitoring, limitations, owner, cadence, and NIST AI RMF mapping.

## High-Risk Uses

High-risk domains include employment, healthcare treatment, credit, insurance, legal determinations, regulated consumer decisions, safety, and individual-rights impacts. These uses require legal/admin escalation or are prohibited by default until counsel approves the pilot policy.

## Counsel Checklist

Counsel should review the MSA/SOW for decision-support positioning, client validation duty, decision ownership, prohibited high-risk uses, warranty and reliance disclaimers, indemnity, limitation of liability, and export/attestation language.

Canonical implementation: `src/lib/ai-liability/human-decision-controls.ts`.
