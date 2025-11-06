# Scam Dunk Marketing Execution Plan (+ Prompt Library)

This is a step‑by‑step, zero/lean‑budget execution plan with ready‑to‑use prompts for fast creation.

---

## A) 2‑Week Sprint Plan

### Week 0–1: Foundation (Pre‑Public Beta)
- Brand & Trust
  - Create lightweight brand kit (logo/colors/type). 
  - Publish Privacy, Terms, and Disclaimers (diagnostic, not advisory).
- Web & Tracking
  - Ship core landing page with interactive “Scam Checker” demo (paste chat/url/address or select ticker).
  - Implement GA4 + GSC + Tag Manager; define events: sign_up, start_scan, complete_scan, start_trial, subscribe, referral_share.
- Content
  - Publish 5 blog posts (2 long‑form price‑manipulation explainers; 3 "Is X a scam?" posts).
  - Produce 3 YouTube videos (10–12 min) + 6–9 Shorts/Reels.
- Social
  - Secure handles; daily posts on TikTok/Shorts/X; 2 Reddit contributions (value‑first).
- Email
  - ESP setup (Brevo/Customer.io). Implement Welcome (Day 0,2,5), First‑Scan Guide (triggered), Weekly Scam Watch.

### Weeks 2–3: Public Beta
- Launch
  - Announce beta on socials; friendly communities; Product Hunt prep (copy/assets/Q&A).
- Distribution
  - Seed 5–10 creators with demo + talking points; enable referral program v1 (+3 scans per referral, +1 to referee).
- Demand Gen
  - 2 lead magnets (Pump‑and‑Dump Checklist, Scam Risk Quiz) + dedicated LPs.
- Nurture
  - 4‑part “Market Manipulation 101” drip; retargeting pixels; low‑spend retargeting ads (if any budget appears).

### Weeks 4–5: Launch
- PR
  - Data story with methodology appendix. Pitch consumer finance, crypto, and tech media.
- Social Proof
  - Testimonials request from engaged beta users; social proof strip on LP.
- ASO (mobile readiness)
  - Keywords: scam detector, pump and dump detector, crypto scam check. Visuals demonstrating 3‑step flow and alert.

---

## B) Ownership, Cadence, and Checklists

- Daily (60–90 min): Post TikTok/Shorts + X thread; 1 Reddit value reply; engage comments; review GA4 dashboard.
- Weekly: Publish 1 long‑form blog + 1 YouTube; send Weekly Scam Watch; outreach to 10 creators/journalists; iterate top LP section via A/B.
- Monthly: Release one data report; publish 6–8 programmatic SEO pages; host AMA/Spaces.

---

## C) KPI Targets & Dashboards

- Awareness: Sessions, branded search, video views, PR pickups.
- Activation: Visit→signup (>35%), signup→first scan (>60%), TTF <2 min.
- Conversion: Trial start rate, trial→paid (12–18%), pricing CVR.
- Retention: 30/90‑day retention, referral %, churn.
- Dashboard: GA4 + a lightweight Notion/Sheet snapshot; annotate launches.

---

## D) Event Schema (GA4 Examples)

```json
{
  "events": [
    {"name": "sign_up", "params": {"method": "email"}},
    {"name": "start_scan", "params": {"test_type": "price|chat|contact|veracity"}},
    {"name": "complete_scan", "params": {"risk_level": "low|med|high", "duration_ms": 1200}},
    {"name": "start_trial", "params": {"plan": "starter|pro"}},
    {"name": "subscribe", "params": {"plan": "starter|pro", "billing": "monthly|annual"}},
    {"name": "referral_share", "params": {"channel": "x|tiktok|discord|email"}}
  ]
}
```

---

## E) Templates & SOPs

### 1) Editorial Content Brief (Template)
- Goal: [educate/convert/announce]
- Persona: [Retail Trader/Caregiver/Privacy‑Conscious]
- Primary keyword: [e.g., pump and dump detector]
- Outline: H1/H2s, FAQ, schema (FAQPage/HowTo if relevant)
- CTA: [Start free scan / Get checklist]

### 2) Landing Page Structure (Core LP)
- Hero: Outcome‑focused headline + interactive demo CTA.
- Proof: How it works (4 tests), privacy microcopy, trust badges.
- Social: Testimonials (as available), creator quotes.
- Pricing: Free 3 scans; Starter/Pro; Family add‑on; refund window.
- FAQ: Diagnostic stance; data handling; accuracy language.

### 3) Crisis & Moderation SOP
- Detect: Spike in negative sentiment → create internal incident doc.
- Respond: Acknowledge, clarify diagnostic nature, share methodology page.
- Lockdown: Rate‑limit brigading vectors; escalate abusive content on platforms.

---

## F) Outreach Scripts

### 1) Creator DM/Email
Subject: Can we co‑analyze a trending scam for your audience?

Hi [Name],
We built a fast, multi‑signal scam screener that flags price manipulation patterns. I’d love to share a demo and co‑analyze a trending case for your channel—purely educational, no hype. If you’re open, I can send a short brief and assets. 

— [Your Name], Scam Dunk

### 2) Journalist/Data Story Pitch
Subject: Exclusive data: early indicators behind pump‑and‑dump surges

Hi [Name],
We analyzed [N] price events and found [X] repeatable pre‑surge signals. Happy to share the dataset, methodology, and a neutral expert quote. Timely for readers avoiding scams. Embargo friendly.

— [Your Name]

### 3) Referral Program Announcement (Users)
“Invite friends, get +3 extra scans. They get +1. Protect your circle in minutes.”

---

## G) Prompt Library (Copy/Paste‑Ready)

Use placeholders like [PERSONA], [KEYWORD], [ASSET], [DATA_POINT], [TONE].

### 1) Brand Voice & Messaging
"""
You are a copywriter for Scam Dunk, a diagnostic, privacy‑first, senior‑friendly scam screener. Tone: confident, clear, educational; avoid guarantees; include subtle privacy reassurance. Write 5 headline options communicating: fast multi‑signal checks and price‑manipulation detection. Output: headlines (≤10 words) + one‑line subheads.
"""

### 2) Landing Page Copy (Core LP)
"""
Write hero, subhead, 3 benefit bullets, and a CTA for Scam Dunk’s homepage. Audience: [PERSONA]. Emphasize instant multi‑signal diagnostics and price‑manipulation detection. Include a short privacy reassurance line. Avoid superlatives like “guaranteed” or “only.”
"""

### 3) SEO Long‑Form Article
"""
Create a 2,000‑word SEO article targeting [KEYWORD] (searcher intent: [INTENT]). Include H1/H2 structure, examples, a checklist, FAQs with schema‑friendly Q&A, and a non‑promissory CTA to try a free diagnostic scan.
"""

### 4) YouTube Script (10–12 min)
"""
Write a 10–12 minute YouTube script: “How to Spot Price Manipulation Before It Hits.” Include hook, visual beats with chart callouts, 3 case studies, and a neutral CTA to try Scam Dunk’s diagnostic scan.
"""

### 5) Shorts/TikTok Hooks (10 options)
"""
Generate 10 snappy hooks (≤8 seconds) warning about a trending scam tactic related to [TOPIC]. Each should tease a single red flag and end with “check before you act.”
"""

### 6) X/Twitter Thread
"""
Draft a 10‑tweet thread explaining [SCAM_PATTERN], with 3 actionable checks and one mini‑case. Keep claims diagnostic. End with a soft CTA to a free scan or checklist.
"""

### 7) Reddit Value Post (r/scams / r/personalfinance)
"""
Write a non‑promotional, educational Reddit post titled: “[TITLE]”. Provide step‑by‑step checks (include price/manipulation angle where relevant). Add a small footer disclosure: “I help build a diagnostic tool; happy to share methodology if useful.”
"""

### 8) PR Press Release (Launch)
"""
Draft a 500–700 word press release announcing Scam Dunk’s public beta. Angle: diagnostic multi‑signal screening; price‑manipulation detection; privacy‑first. Include quotes, boilerplate, and a link to the methodology page. Avoid “guaranteed/only/first.”
"""

### 9) Email Sequences
- Welcome (Day 0):
"""
Subject: Welcome to safer decisions
Write a concise welcome email that explains the diagnostic nature, shows the 3‑step first scan, and sets expectations (no guarantees). CTA: “Run your first diagnostic scan.”
"""

- First‑Scan Guide (triggered after sign‑up):
"""
Create a short walkthrough email: how to run a price‑manipulation check, what the risk levels mean, and how to set a watchlist alert.
"""

- Trial Nurture (Day 2/5/9):
"""
Write a 3‑email sequence demonstrating use cases (chat paste, contact lookup, ticker check) with screenshots placeholders and neutral CTAs.
"""

- Churn Risk (inactive 14 days):
"""
Draft a re‑engagement email offering a checklist or a saved alert template. Keep copy supportive and non‑alarmist.
"""

### 10) ASO (when mobile ships)
"""
Produce App Store listing copy: title (≤30 chars), subtitle, 3 bullets, privacy note, and 5 screenshot captions emphasizing diagnostic speed and clarity for seniors and traders.
"""

---

## H) Compliance & Disclaimers (Copy Blocks)

- Short: “Scam Dunk provides informational diagnostic risk signals. It is not financial advice. No tool can guarantee outcomes.”
- Long (LP footer/email): “Results reflect probabilistic risk assessments from multiple data sources and heuristics. They are not guarantees. Always verify independently before acting. See Terms & Privacy for details.”

---

## I) Source References (for content team)
- FTC fraud losses (2023); FBI IC3 reports; Chainalysis Crypto Crime reports; consumer protection orgs.
- Competitors to monitor: Bitdefender Scamio; Trend Micro Check; ScamAdviser; TradingView; LunarCrush; Santiment; Chainabuse.

---

## J) Backlog (Next Up)
- Programmatic SEO templates (“Is [token] a scam?”; “Pump‑and‑dump detector for [ticker]”).
- Quarterly industry report (original analysis + viz). 
- Community AMA calendar.
