# AbarVa Mobile App Spec v1

**Version:** 1.0 · April 28 2026
**Status:** Authoritative direction; build deferred until master orchestration completes and Shell Layout V2 stabilizes
**Owner:** Founder
**Companions:** BRAND_VOICE_SPEC_V1 (mandatory pre-read), brand asset pack v1, INTELLIGENCE_DESIGN_SPEC, SHELL_LAYOUT_SPEC_V2

---

## §1 · Position statement

Mobile is for **interrupt scenarios**, not for general use. The user is at a board meeting and needs to approve a vendor BAFO before walking back into the room. The user is on a flight and an executive sponsor needs a critical KPI before landing. The user is on a Saturday call and needs to add a user to Apex's tenant urgently.

The mobile app does **three things** and refuses to do anything else:

1. **Approvals** — gates and decisions waiting on this user
2. **Urgent admin** — the 5% of Setup that genuinely cannot wait until laptop access
3. **Executive insights** — read-only critical metrics, single-glance digests

What mobile is **NOT**:

- A scaled-down core app
- A surface for building (designing programs, authoring patterns, editing RFPs)
- A read surface for long artifacts (open the laptop)
- A general chat surface with Atlas (`app.abarva.ai` does this on desktop)
- A marketing surface (the public site at `abarva.ai` is responsive; mobile app is for paying users only)

The discipline is what makes mobile useful. Most enterprise mobile apps fail because they try to be the desktop app on a small screen. AbarVa mobile succeeds by doing fewer things deliberately.

---

## §2 · The user the app is built for

A senior leader at an AbarVa tenant. Probably C-level or VP-level. Their day is interrupt-driven; their attention is fragmented; their patience for irrelevance is zero.

When they open the mobile app:

- They have ~15 seconds before someone interrupts them again
- They want to know what needs them right now
- They want to act on it in 1-3 taps
- They want the app to close itself when they're done

Every design decision below serves these constraints.

---

## §3 · The three tabs

The bottom tab bar has exactly three tabs. No tab navigation. No drawer. No more tabs ever.

### §3.1 · Tab 1 · Approvals (default)

The default tab. What's waiting on this user.

**Contents:**
- Pending approvals queue, ordered by urgency
- Each approval is a card with: title, context (1 line), elapsed time waiting, the question being asked
- Three actions per card: Approve, Reject, Defer (with optional comment)
- Empty state: "No approvals waiting. You're current."

**Sources:**
- Programs gates (P3 → P4 build readiness, P4 → P5 activate readiness, P5 → P6 operate)
- Source events decisions (RFP cuts to shortlist, BAFO awards, vendor terminations)
- Setup admin (new user requests, integration approvals, role changes)
- Workflow exceptions (escalations from Steward when policy thresholds trigger)

**Card layout:**

```
┌────────────────────────────────────────┐
│ AMS Vendor Consolidation BAFO          │
│ Apex Retail · waiting 4 hours          │
│                                        │
│ Award contract to Vendor B for         │
│ $2.4M annual; deviates from baseline   │
│ by +12% but timeline saves 40 days.    │
│                                        │
│ Atlas: I recommend approve. Confidence │
│ 0.85 based on 4 similar prior events.  │
│                                        │
│ [Reject]  [Defer]  [Approve]           │
└────────────────────────────────────────┘
```

**Atlas voice on every approval card.** One sentence with confidence. The user can tap "More context" for a 150-word synthesis but the default state is the recommendation + confidence. Speed matters more than detail.

### §3.2 · Tab 2 · Urgent

The urgent admin tab. The 5% of Setup that can't wait.

**Contents:**
- Add user (most common: the most-requested mobile workflow)
- Revoke user (security event response)
- Change role (escalation, demotion)
- Toggle integration (disable failing connector, enable urgent workflow)
- Acknowledge incident (when monitoring fires)

**The "Add user" flow specifically:**

1. Tap "Add user"
2. Enter email (autocomplete from contact directory if integrated)
3. Select role from list (4-5 common roles, "Other" for full app access)
4. Select tenants (multi-select)
5. Confirm
6. SSO invite goes out automatically

Five steps, ~30 seconds. The desktop equivalent has more options (custom permissions, team assignment, onboarding flow assignment); mobile has only the urgent path.

**Empty state:** "No urgent admin tasks pending. For routine setup, open AbarVa on desktop."

This is critical. The empty state actively tells the user mobile is the wrong tool for non-urgent work. Re-routes them to the right surface.

### §3.3 · Tab 3 · Insights

Executive-readable digests. Read-only. Single-glance.

**Contents (in this order):**

1. **Today's pressures** — top 3-5 active pressures across all tenants the user has access to. One line each. Tap to expand to full pressure detail.
2. **Critical KPI summary** — for each tenant, one card with 3-5 KPIs. Color-coded (signal blue for on-track, amber for watch, red for breach). Single number per KPI. No charts on this screen.
3. **Atlas summary of the day** — 150-word synthesis of "what changed since you last opened the app." Same Atlas voice as desktop.
4. **Recent contradictions** — newly surfaced or status-changed contradictions. Read-only on mobile; resolution happens on desktop.

**The day-summary Atlas voice example:**

> Three pressures escalated since 8 AM. AI Cloud Spend on Apex Retail crossed $2.5M (+38% over budget). Two vendor BAFOs await your decision; the AMS one has been waiting 4 hours. Customer Churn at Meridian improved 0.3pp. The Contact Center AI rollout is the likely driver, per PAT-IND-CROSS-001.

Atlas stays in operational register. Specific numbers. Citations to patterns.

---

## §4 · Authentication and access

### §4.1 · No public access

The mobile app is enterprise-SSO-only. Same identity model as `app.abarva.ai`. There is no public signup, no trial mode, no demo. The app launches on a sign-in screen that authenticates against the user's enterprise IDP.

### §4.2 · Biometric session lock

After initial SSO sign-in, the app locks to Face ID / Touch ID / device biometrics. Subsequent opens unlock via biometric in <1 second. Session expires after 7 days; user re-SSO.

This is not optional. The mobile app handles approval decisions on enterprise infrastructure; biometric lock is required for the threat model. Any user who refuses biometric setup gets a "this device cannot be used for AbarVa mobile" message and is directed to web.

### §4.3 · No persistent state on device

No tenant data is cached on the device beyond the active session. Approvals, KPIs, pressures all fetch fresh on every open. This is a security posture decision — a lost device should expose minimal information about tenant operations.

The cost is some perceived sluggishness on app open (network round-trip before content shows). Mitigation: aggressive prefetching once the user is authenticated, skeleton screens during the first ~500ms.

---

## §5 · The agent-narrated default state

When the user opens the app, the first screen is the Approvals tab with **Atlas narrating what's waiting** as the top affordance.

### §5.1 · The Atlas opening line

Single line. Operational register. Specific.

Examples:

- "You have 3 approvals waiting. The AMS BAFO has been pending 4 hours."
- "Two pressures escalated since you last opened the app. Tap to see what changed."
- "No urgent items. Apex Retail's Q4 forecast just updated; net effect $1.2M favorable."

The opening line **earns the interrupt**. If the user opens the app and the first thing they see is "No items pending. Have a great day!" — the app loses credibility. Mobile is for interrupts; if there's nothing to interrupt about, Atlas says so plainly and the user closes the app in <5 seconds.

### §5.2 · Push notifications

Push notifications are how Atlas surfaces interrupts to users not currently in the app.

**Triggering events:**

- A new approval lands in your queue
- An approval has been waiting >2 hours and is approaching SLA
- A pressure escalates above threshold (high-severity only)
- A contradiction status changes (resolved, escalated)
- A KPI crosses a configured alert threshold

**Per-notification format:**

- **Subject:** what changed (12-15 words max)
- **Body:** Atlas's one-line context (under 80 chars)
- **Tap action:** opens the relevant tab/card directly

Example:

```
[Subject] AMS Vendor Consolidation BAFO awaiting decision (4hr)
[Body]    Atlas recommends approve. Confidence 0.85.
```

**Notification discipline.** No more than 8 notifications per day per user. The interrupt-economy of mobile demands restraint. AbarVa notifications must always be earned.

### §5.3 · Quiet hours

User-configurable. Default 9 PM - 7 AM local time. Critical-only notifications during quiet hours (P0 escalations from Steward). User can override per-tenant if their org operates 24/7.

---

## §6 · The 12-15 mobile screens

Total screen count is deliberately small. Every screen has a single purpose.

### §6.1 · Onboarding (first-time only, 3 screens)

| Screen | Purpose |
|---|---|
| 1. Sign-in | SSO redirect to enterprise IDP |
| 2. Biometric setup | Enroll Face ID / Touch ID |
| 3. Notification permission | Request push, set initial quiet hours |

After onboarding, the user lands on Approvals tab. The 3 onboarding screens are seen exactly once.

### §6.2 · Approvals tab (4 screens)

| Screen | Purpose |
|---|---|
| 4. Approvals list | Default tab content; queue of pending |
| 5. Approval detail | Full context for one approval, expanded Atlas synthesis |
| 6. Approve confirmation | "Approve and close" with optional comment box |
| 7. Reject confirmation | "Reject and close" with required comment box |

### §6.3 · Urgent tab (3 screens)

| Screen | Purpose |
|---|---|
| 8. Urgent action menu | List of urgent admin actions available |
| 9. Add user flow | The 5-step add-user flow on one scrolling screen |
| 10. Action confirmation | Generic "action completed" + return to menu |

### §6.4 · Insights tab (3 screens)

| Screen | Purpose |
|---|---|
| 11. Insights overview | Pressures + KPIs + Atlas summary of the day |
| 12. Pressure detail | One pressure expanded, full context, navigation to desktop |
| 13. KPI detail | One KPI expanded with sparkline + Atlas attribution |

### §6.5 · Settings (2 screens)

| Screen | Purpose |
|---|---|
| 14. Settings | Notification preferences, quiet hours, sign out |
| 15. About | Version info, support contact, legal links |

**Total: 15 screens.** None of them are dead-ends; every one has a clear next-action affordance.

---

## §7 · Build platform decision

### §7.1 · Recommendation: React Native + Expo

**Reasoning:**
- Codebase reuse: existing app components (TypeScript, Tailwind-equivalent styling) port to React Native with effort ~30% of native rebuild
- Single codebase for iOS and Android cuts maintenance in half
- Expo handles biometric auth, push notifications, and SSO redirects with first-class libraries
- Over-the-air update capability via Expo Updates; can patch critical bugs without App Store / Play Store review cycles
- Brand-tokens.ts file ports directly; same color system, same typography choices

**Trade-offs accepted:**
- Slightly larger app bundle than pure native
- Some platform-specific behaviors require native modules (worth it when it happens; rare)
- Performance ceiling lower than native — but mobile app is mostly text + buttons + simple lists, never approaches the ceiling

### §7.2 · Alternative considered: PWA

Progressive Web App at `app.abarva.ai/mobile`. No app stores. Faster to ship.

**Why rejected:**
- Push notifications on iOS PWAs are unreliable
- Biometric API on iOS PWAs is partial (Face ID via WebAuthn works; user UX is awkward)
- Enterprise customers expect a real app icon on the home screen — PWA install flows are unfamiliar
- Discoverability via App Store / Play Store matters for enterprise procurement processes

PWA is the right answer for v0 (validate the three-tab model with internal users), but v1 is React Native.

### §7.3 · Alternative considered: Native (Swift + Kotlin)

Maximum quality, two codebases.

**Why rejected:**
- Cost of two codebases doubles maintenance for a relatively small app
- The team is JavaScript/TypeScript-fluent; learning Swift + Kotlin slows the build
- The mobile app is intentionally simple (15 screens); native quality ceiling not needed
- Future-flexibility: if AbarVa needs native capabilities later, adopt them then

### §7.4 · Tooling chain

- **Framework:** React Native via Expo (managed workflow)
- **Auth:** `expo-auth-session` for SSO redirects, `expo-local-authentication` for biometrics
- **Push:** `expo-notifications` with Apple Push Notification Service (APNS) and Firebase Cloud Messaging (FCM)
- **State:** React Context + Zustand (same pattern as core app's Atlas state architecture from SHELL_LAYOUT_SPEC_V2)
- **Networking:** fetch + React Query for caching/invalidation
- **Navigation:** React Navigation (bottom tabs + stack within each tab)
- **Styling:** NativeWind (Tailwind-equivalent for React Native) using brand-tokens.ts
- **Testing:** Jest for unit, Detox for end-to-end

---

## §8 · Visual identity on mobile

The brand asset pack and brand voice spec are authoritative. Mobile is **not** a different visual language — same paper aesthetic, same colors, same Atlas voice.

### §8.1 · Color usage

- **Background:** `--abarva-paper` (#faf7f1) — the same warm off-white as desktop
- **Primary text:** `--abarva-ink-black` (#000000)
- **Secondary text:** `--abarva-slate` (#5F5E5A)
- **Brand accent / CTAs:** `--abarva-signal-blue` (#0066CC)
- **Borders, dividers:** `--abarva-stone` (#888780)
- **Atlas voice surfaces:** `--abarva-navy-ink` (#0c1a3a) — same navy as AgentColumn on desktop

### §8.2 · Typography

- **Headlines:** Fraunces (serif), used sparingly — only for screen titles
- **Body:** Inter (sans), default
- **Atlas voice:** Inter italic for synthesis output (same as desktop convention)
- **KPI numbers:** Inter Tabular Numbers (so columns of numbers align)

iOS system font stack: SF Pro for body if Inter loading is slow. Android: Roboto. Brand consistency favors Inter; performance favors system fonts; the spec accepts the trade.

### §8.3 · Buttons and interactive elements

- **Primary action:** signal blue background, white text, full-width, ~52px tall
- **Secondary action:** ghost button (signal blue text, blue border, paper background)
- **Destructive action:** red text on transparent (`--color-text-danger`); only used in confirmations
- **Tap targets:** minimum 44×44 pt per Apple HIG / Material guidelines
- **Card touch state:** subtle background tint (~5% opacity overlay) on tap; no animations beyond standard touch feedback

### §8.4 · The mobile app icon

From the brand asset pack:
- iOS: `monogram-a/abarva-app-icon-1024px.png` (signal-blue rounded square + white "A")
- Android: `monogram-a/abarva-app-icon-512px.png` (same design, adaptive icon variant for Android 8+)

The icon is recognizable on a home screen at 60×60px.

---

## §9 · The voice on mobile

Per BRAND_VOICE_SPEC_V1 §5.3, mobile uses **conversational register**. Second-person, action-oriented, immediate.

### §9.1 · Atlas opening line examples

✓ Do:
- "You have 3 approvals waiting. The AMS BAFO has been pending 4 hours."
- "Two pressures escalated since 8 AM. AI Cloud Spend crossed $2.5M."
- "Apex Retail Q4 forecast updated. Net effect: $1.2M favorable variance."

✗ Don't:
- "Hello! Welcome back to AbarVa. Here's what's been happening..."
- "Some items may need your attention. When you have a moment..."
- "Hi! 👋 Ready to see what's new today?"

### §9.2 · Push notification examples

✓ Do:
- "AMS BAFO awaiting decision · pending 4hr · Atlas: approve, confidence 0.85"
- "AI Cloud Spend crossed $2.5M (+38%). 3 levers active."
- "Now Assist deflection rate dropped to 22%. Below 25% threshold."

✗ Don't:
- "Time to check AbarVa! 📱"
- "We've got some updates for you..."
- "Don't forget about your pending approvals!"

### §9.3 · Empty state examples

✓ Do:
- "No approvals waiting. You're current."
- "No urgent admin tasks. For routine setup, open AbarVa on desktop."
- "All KPIs within their thresholds across all tenants you watch."

✗ Don't:
- "Nothing to see here! 😎"
- "Looks like you're all caught up!"
- "We couldn't find anything for you."

The empty state is information, not entertainment. It tells the user the truth about the system state and, if relevant, redirects them to where the task they wanted to do actually lives.

### §9.4 · Error states

✓ Do:
- "Can't reach AbarVa. Check your connection and try again."
- "This action requires laptop access. Open `app.abarva.ai` to complete it."
- "Approval failed. The program advanced to the next phase before your decision could land."

✗ Don't:
- "Oops! Something went wrong. 😢"
- "Error 500: Internal Server Error"
- "Please try again later."

Errors explain what happened in plain language and tell the user what to do about it.

---

## §10 · Build wave decomposition

Eight waves. Total ~3,500 lines.

### §10.1 · Wave MOB-1 · Project setup + auth

**Scope:** Expo project initialization, brand-tokens import, SSO flow via expo-auth-session, biometric enrollment, sign-in / onboarding screens.
**Output:** ~600 lines. Sonnet.
**Dependency:** core app's auth provider exposes mobile-friendly SSO endpoints.

### §10.2 · Wave MOB-2 · Tab shell + navigation

**Scope:** Bottom tab bar, three tabs (Approvals, Urgent, Insights), tab routing, settings stack.
**Output:** ~400 lines. Sonnet.

### §10.3 · Wave MOB-3 · Approvals tab

**Scope:** Approvals list, approval detail screen, approve/reject confirmation flows. Atlas one-line synthesis on each card.
**Output:** ~700 lines. Sonnet. Depends on MOB-2 + core app's approvals API.

### §10.4 · Wave MOB-4 · Urgent tab + add-user flow

**Scope:** Urgent action menu, add-user 5-step flow, action confirmation, redirect back to menu.
**Output:** ~600 lines. Sonnet.

### §10.5 · Wave MOB-5 · Insights tab

**Scope:** Pressures list, KPI panel per tenant, Atlas summary of the day, pressure detail, KPI detail.
**Output:** ~600 lines. Sonnet. Depends on KF-3 (Atlas synthesis engine) and core app's KPI API.

### §10.6 · Wave MOB-6 · Push notifications

**Scope:** Notification permission flow, APNS + FCM integration, deep-linking from notification to specific approval/pressure card.
**Output:** ~400 lines. Sonnet.

### §10.7 · Wave MOB-7 · Settings + polish

**Scope:** Notification preferences, quiet hours config, sign out, About screen.
**Output:** ~300 lines. Sonnet.

### §10.8 · Wave MOB-8 · Submission to App Store / Play Store

**Scope:** App Store screenshots, Play Store listing, privacy policy, App Store Connect setup, signing certificates, Expo EAS Build configuration. **Largely founder-time, not agent-time.**
**Output:** ~minimal code; mostly configuration and store-listing content.

### §10.9 · Total

~3,600 lines. Roughly 3-4 weeks of agent time. Significantly smaller than the public site work; mobile's discipline of doing fewer things is what keeps the build small.

**Sequencing:** MOB-1 first. MOB-2 second. MOB-3, MOB-4, MOB-5 can run in parallel after MOB-2. MOB-6 after MOB-3 (notification deep-links need approvals). MOB-7 anytime after MOB-2. MOB-8 last.

---

## §11 · Risks and mitigations

**Risk 1 · Mobile creep · users want more features.**
Once mobile ships, users will request more functionality on mobile. Resist. The discipline is the value. Each requested feature should answer: "is this an interrupt scenario?" If yes, consider. If no, decline politely and explain why mobile stays focused.

Mitigation: a "feature requests" log that the founder reviews quarterly. Patterns of requests get aggregated; one-off requests get filed but not actioned.

**Risk 2 · App store review delays.**
Apple and Google review processes can be slow, especially for enterprise apps with biometric handling.
Mitigation: build with Expo Updates from day one so non-critical bug fixes can ship over-the-air without store review.

**Risk 3 · Notification fatigue.**
Too many push notifications and users disable them. Once disabled, users disengage from mobile entirely.
Mitigation: the 8/day limit is the floor; aim for 2-4/day. Atlas's confidence threshold for "send a push" is high. When in doubt, don't send.

**Risk 4 · Biometric authentication failure modes.**
Face ID failed unlocks, biometric not enrolled, device locked, etc.
Mitigation: clear fallback to SSO password re-entry. Failure messages explain what happened in plain language.

**Risk 5 · Data residency / compliance for mobile data caching.**
Some tenants have strict data residency requirements that prohibit caching tenant data on mobile devices.
Mitigation: §4.3 — no persistent state on device. This is a design decision, not just a security posture; it solves the residency concern by structurally not having local data.

---

## §12 · Out-of-scope for v1 (explicit)

These will be requested. Saying no early saves debate later.

- **Multi-tenant tab.** Users with access to multiple tenants will want to switch tenants in the app. v1 shows aggregated data across all accessible tenants. Per-tenant filtering is desktop-only.
- **Atlas chat surface.** v1 has Atlas voice (synthesis, recommendations, confidence) but not free-form Atlas chat. Chat is a desktop affordance.
- **Pattern browsing on mobile.** The corpus is desktop-first. Mobile shows pattern citations in Atlas synthesis but doesn't browse the corpus.
- **Setup admin (full).** v1 has only urgent admin (add user, revoke user, role change, integration toggle). Full Setup is desktop.
- **Multiple programs/sources open simultaneously.** No tabs within tabs. Each approval / pressure is one screen at a time.
- **Cross-tenant comparisons.** Mobile shows per-tenant KPIs side-by-side as cards but doesn't compare them mathematically.
- **Editing of any kind.** Mobile is approve/reject + add-user + view. No editing of programs, sources, patterns, signals, or any content.

If these become requested with sustained pressure, they get scoped into v2. v1 holds the line.

---

## §13 · Document control

- **Authoritative location:** `docs/build/MOBILE_APP_SPEC_V1.md`
- **Build-ready when:** Master orchestration completes, Shell Layout V2 stabilizes, the Atlas state architecture from SHELL-V2-1 is in production
- **Companion artifacts:**
  - BRAND_VOICE_SPEC_V1
  - Brand asset pack v1
  - INTELLIGENCE_DESIGN_SPEC
  - SHELL_LAYOUT_SPEC_V2
- **Owner:** Founder
- **Review cadence:** quarterly
- **Update gate:** v1 ships before v2 is considered. v2 work begins only after at least 90 days of v1 in production with usage data informing what should be added or cut.

---

**End of Mobile App Spec v1.**
