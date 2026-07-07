# CallBlick Marketing Website — Complete Plan

## Brand System

### Color Palette

| Token | Dark Mode | Light Mode |
|---|---|---|
| Background | `#020912` | `#EEF3FA` |
| Surface | `#0A1931` | `#FFFFFF` |
| Card | `#0D1F35` | `#F4F8FF` |
| Accent | `#2C8FFF` | `#1A6FD4` |
| Accent Glow | `rgba(44,143,255,0.18)` | `rgba(26,111,212,0.12)` |
| Text Primary | `#EEF4FF` | `#0D1B2E` |
| Text Secondary | `#B3CFE5` | `rgba(20,60,120,0.65)` |
| Border | `rgba(255,255,255,0.07)` | `rgba(26,111,212,0.12)` |
| Success Green | `#22c55e` | `#16a34a` |
| Danger Red | `#ef4444` | `#dc2626` |
| Warning Amber | `#eab308` | `#ca8a04` |

### Typography

| Role | Size | Weight | Tracking |
|---|---|---|---|
| H1 Hero | 72px | 900 | -0.04em |
| H2 Section | 48px | 800 | -0.03em |
| H3 Card | 28px | 700 | -0.02em |
| Body | 16px | 500 | normal |
| Label / Badge | 10px | 900 | 0.14em uppercase |

**Font:** Geist Sans (same as app)

### Visual Motifs
- Deep ocean radial glows behind headlines
- Subtle 1px grid overlay (`rgba(44,143,255,0.04)`)
- Glassmorphism cards: `backdrop-blur-xl` + `bg-white/[0.04]` + `border border-white/[0.07]`
- Waveform SVG animation in hero background (looping, 8s)
- Blue accent glow on hover: `box-shadow: 0 0 32px rgba(44,143,255,0.35)`

---

## Pages

### 1. `/` — Home (Landing)

#### Navbar (sticky)
- **Left:** CallBlick full logo
- **Center:** Home · Features · Pricing · Use Cases · Blog
- **Right:** `Sign In` (ghost button) + `Get Started Free` (solid blue pill)
- On scroll: `backdrop-blur-xl` + border appears + height shrinks

#### Hero Section
```
[ ⚡ AI-POWERED CALL INTELLIGENCE ]     ← eyebrow pill

Intelligence
at every                                ← "every" in #2C8FFF
conversation.

Unlock deep insights from your calls with AI-powered
transcription, QA scoring, and compliance monitoring.

[ Get Started Free → ]   [ ▶ Watch Demo ]

99.4% Accuracy  ·  24/7 Uptime  ·  10x Faster Reviews
```
- Animated waveform SVG background (subtle, looping)
- Radial blue glow centred behind headline
- 3 stat counters animate up on page load
- App dashboard screenshot below hero, slightly clipped at bottom

#### Social Proof Bar
```
Trusted by teams at →  [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]
```
- Greyscale logos, auto-scrolling marquee, fades at edges

#### Feature Showcase (alternating left/right)

| # | Feature | Icon | Headline | Sub-copy |
|---|---|---|---|---|
| 1 | Real-time Transcription | Mic | "Every word captured. Instantly." | STT with speaker diarization, timestamps, confidence scores |
| 2 | QA Scoring | BarChart3 | "Objective scores. Zero bias." | Questionnaire-driven AI scoring per call, weighted answers |
| 3 | Red Flag Detection | ShieldAlert | "Catch risks before they escalate." | Automatic flagging of compliance violations in real time |
| 4 | Campaign Analytics | Layers | "See what's working across every campaign." | Aggregated performance by batch, campaign, and agent |
| 5 | Sentiment Timeline | TrendingUp | "Read the room, sentence by sentence." | Per-utterance sentiment score charted over call duration |
| 6 | Human-in-the-Loop | CheckCircle2 | "AI suggests. Humans confirm." | Override and correct AI answers with full audit trail |

Each row: app UI mockup screenshot on one side, copy + 3-bullet list on the other. Alternates L/R.

#### How It Works (3-step)
```
01 Upload or connect     →     02 AI analyzes     →     03 Act on insights
   your call recordings            in seconds                with full evidence
```
- Horizontal connector line
- Icon per step
- Short paragraph beneath each

#### Results / Metrics Grid
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    99.4%     │  │     10x      │  │    < 60s     │  │    100%      │
│  Accuracy    │  │  Faster QA   │  │  Per Call    │  │  Auditable   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```
- Count-up animation on scroll-enter
- Glass cards on dark navy background

#### Testimonials
- 3-card carousel
- Quote · Name · Role · Company logo
- Blue glow border on active card
- Auto-advances every 5s

#### CTA Banner
```
Start analyzing your calls today.
No setup fees. No long-term contracts.

[ Start Free Trial ]     [ Book a Demo ]
```
- Full-width section
- Gradient: `from-[#0A1931] via-[#0D2A4A] to-[#020912]`
- Subtle radial glow behind text

#### Footer
- **Left:** Logo + "Advanced intelligence for conversation analysis"
- **4 columns:** Product · Company · Resources · Legal
- **Bottom bar:** © 2025 CallBlick · Privacy Policy · Terms of Service · Status

---

### 2. `/features` — Features Deep Dive

**Hero:** "Everything you need to run a world-class call center QA"

6 feature cards in a `3×2` grid — clicking expands into full detail section:
- Large app screenshot / animation
- Bullet list of sub-capabilities
- "See it in action →" CTA

#### Comparison Table

| | Manual QA | CallBlick AI |
|---|---|---|
| Review speed | Hours per call | < 60 seconds |
| Coverage | 5–10% of calls | 100% of calls |
| Consistency | Varies by reviewer | Objective every time |
| Red flag detection | Reactive | Automatic |
| Audit trail | Manual notes | Full history |
| Cost per review | High | 90% lower |

---

### 3. `/pricing`

**Toggle:** Monthly / Annual (annual saves 20%)

#### 3 Tiers

| | Starter | Professional ⭐ | Enterprise |
|---|---|---|---|
| Price | $49/mo | $149/mo | Custom |
| Calls/mo | 500 | 2,500 | Unlimited |
| Users | 1 | 10 | Unlimited |
| QA Scoring | Basic | Full | Full |
| Red Flag Detection | — | ✓ | ✓ |
| Campaign Analytics | — | ✓ | ✓ |
| API Access | — | ✓ | ✓ |
| SSO / SAML | — | — | ✓ |
| Dedicated CSM | — | — | ✓ |
| SLA Guarantee | — | — | ✓ |

- Professional card: blue border glow + "Most Popular" badge
- FAQ accordion below pricing cards
- Enterprise: "Contact Sales" CTA

---

### 4. `/use-cases`

**3 vertical tabs** — each reveals tailored copy + app screenshot:

#### Insurance Sales
- Compliance disclosure verification
- Script adherence scoring
- Objection handling detection
- Red flag: missing required disclosures

#### Financial Services
- Regulatory QA automation
- PCI / sensitive data detection
- Agent performance benchmarking
- Full audit trail for regulators

#### Customer Support
- CSAT correlation with call quality
- Agent coaching with evidence clips
- Escalation pattern detection
- SLA breach risk flagging

Each tab: industry headline · 3 pain points solved · 1 customer quote · CTA

---

### 5. `/blog`

- **Top:** Featured post (full-width hero card)
- **Grid:** Article cards — title, excerpt, date, reading time, tag pill
- **Tags:** Product Update · Tutorial · Industry · AI Research
- **Sidebar:** Tag filter + newsletter signup

---

### 6. `/docs` (or external link)

- Quick Start Guide
- API Reference
- Webhook Setup
- Questionnaire Schema Format
- Authentication

---

## Layout System

### Grid & Spacing
```
max-w-7xl  mx-auto  px-6
12-column grid, 24px gap
Section padding: py-32 (desktop) / py-20 (mobile)
```

### Component Specs

| Component | Classes |
|---|---|
| Section card | `rounded-3xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-xl` |
| Primary button | `bg-[#2C8FFF] rounded-2xl px-8 py-3.5 font-bold shadow-[0_0_32px_rgba(44,143,255,0.35)]` |
| Ghost button | `border border-white/[0.12] rounded-2xl px-8 py-3.5 font-bold hover:bg-white/[0.05]` |
| Badge / pill | `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border` |
| Section divider | `1px solid rgba(255,255,255,0.06)` |

### Responsive Breakpoints
| Breakpoint | Layout |
|---|---|
| `< 768px` | Single column, stacked sections |
| `768–1024px` | 2-column grid, collapsed nav |
| `> 1024px` | Full layout, sticky nav |

---

## Animations

| Element | Animation | Duration |
|---|---|---|
| Hero headline | Fade up + stagger per word | 600ms |
| Stat counters | Count up on scroll-enter | 1200ms |
| Feature cards | Fade-in + translateY(20px) | 400ms stagger |
| App mockup | Subtle parallax float | continuous |
| Waveform background | CSS keyframe loop | 8s |
| Navbar | Blur + border on scroll | 200ms |
| CTA buttons | Pulse glow on hover | 300ms |
| Testimonial cards | Slide + fade on advance | 400ms |

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | Matches existing codebase |
| Styling | Tailwind v4 | Matches existing codebase |
| Animations | Framer Motion | Scroll-enter, stagger, parallax |
| Icons | Lucide React | Matches existing app |
| Blog / CMS | Contentlayer or Notion API | Easy content management |
| Analytics | Vercel Analytics | Zero-config with Vercel deploy |
| Demo booking | Cal.com embed | No custom backend needed |
| Deployment | Vercel | Same org, instant previews |

---

## Page Priority Order (Build Sequence)

1. `/` — Home (hero + features + CTA)
2. `/pricing` — Highest conversion impact
3. `/features` — SEO + depth
4. `/use-cases` — Targeted landing pages
5. `/blog` — Long-term SEO
6. `/docs` — Developer trust
