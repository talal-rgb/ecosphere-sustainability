# Terrnix Assessment UI Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** UX Design System

---

## Design Philosophy

The assessment experience must feel like completing an executive evaluation at a top-tier consulting firm. Every screen should reinforce Terrnix's positioning as a premium sustainability intelligence and advisory platform.

**Experience Goals:**
1. **Confidence:** Users trust the assessment's credibility
2. **Clarity:** Every step is intuitive and well-explained
3. **Progress:** Users feel momentum and accomplishment
4. **Value:** Results feel like a consulting deliverable, not a quiz score
5. **Action:** Clear next steps drive engagement and conversion

---

## User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│   Intro     │────▶│  Question   │────▶│   Review    │
│    Page     │     │   Screen    │     │   Flow      │     │   Screen    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│   Results   │◀────│   Lead      │◀────│  Submit     │◀──────────┘
│   Page      │     │   Capture   │     │  Confirm    │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       ├──▶ Download Report
       ├──▶ Download Certificate
       ├──▶ Share Results
       ├──▶ Book Consultation
       └──▶ Explore Recommendations
```

---

## Screen Specifications

### 1. Landing Page

**URL:** `/assessments/{slug}/`

**Purpose:** SEO-optimised entry point. Convert visitors into participants.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Terrnix Logo]                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  {Assessment Title}                                         │
│  {Subtitle}                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  {Hero Image / Illustration}                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Start Assessment]  [Learn More]                          │
│                                                             │
│  ⏱ {Duration}  📊 {Question Count}  🎯 {Difficulty}       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  What You'll Receive                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Maturity │ │ Detailed │ │ Action   │ │ Verified │     │
│  │ Score    │ │ Report   │ │ Plan     │ │ Certificate│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
├─────────────────────────────────────────────────────────────┤
│  Who This Is For                                            │
│  • {Target audience 1}                                      │
│  • {Target audience 2}                                      │
│  • {Target audience 3}                                      │
├─────────────────────────────────────────────────────────────┤
│  FAQ                                                        │
│  Q: {Question 1}                                            │
│  A: {Answer 1}                                              │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│  [Footer]                                                   │
└─────────────────────────────────────────────────────────────┘
```

**SEO Elements:**
- Title: `{Assessment Title} | Terrnix Sustainability Assessment`
- Meta description: `{metadata.description}`
- OG image: `{metadata.ogImage}`
- Schema.org Quiz markup
- BreadcrumbList markup
- Canonical URL

**CTA:**
- Primary: "Start Assessment" (gradient emerald button)
- Secondary: "Learn More" (scrolls to details)

---

### 2. Introduction Screen

**Purpose:** Set expectations, build trust, motivate completion.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  {Assessment Icon}                                          │
│                                                             │
│  {Assessment Title}                                         │
│  {Subtitle}                                                 │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  What to Expect                                             │
│                                                             │
│  1. {Question Count} questions across {Category Count}     │
│     categories                                              │
│  2. Takes approximately {Duration}                          │
│  3. Receive instant results and personalised report         │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Your Results Will Include                                  │
│                                                             │
│  ✓ Overall maturity score (0-100)                          │
│  ✓ Category breakdown with radar chart                      │
│  ✓ Personalised action plan                                 │
│  ✓ 30-60-90 day roadmap                                     │
│  ✓ Professional PDF report                                  │
│  ✓ Verified certificate of achievement                      │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  [Start Assessment]                                         │
│                                                             │
│  🔒 Your responses are confidential and used only to        │
│     generate your personalised results.                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Animations:**
- Fade in elements staggered 100ms apart
- Icon: subtle pulse on load
- CTA button: hover lift (-2px) + shadow increase

---

### 3. Question Screen

**Purpose:** Clear, focused question presentation. Minimise cognitive load.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                              Question {N} of {Total}│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Progress: ████████████░░░░░░░░░░  {Percentage}%    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  {Category Badge}  {Difficulty Badge}                      │
│                                                             │
│  {Question Text}                                            │
│                                                             │
│  [?] {Help Text (tooltip on hover)}                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ○ {Option 1}                                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ {Option 2}                                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ {Option 3}                                       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ {Option 4}                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                    [Next Question →]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Question Card:**
- Background: `bg-slate-800/60` with `backdrop-blur-xl`
- Border: `border-slate-700/50`
- Border radius: `rounded-2xl`
- Padding: `p-8` (desktop), `p-6` (mobile)
- Shadow: `shadow-xl`

**Option Buttons:**
- Default: `bg-slate-700/50`, `border-slate-600/50`
- Hover: `bg-slate-600/50`, `border-emerald-500/30`
- Selected: `bg-emerald-500/10`, `border-emerald-500`, `ring-2 ring-emerald-500/20`
- Transition: `transition-all duration-200`
- Padding: `p-4`
- Border radius: `rounded-xl`

**Progress Bar:**
- Height: `h-2`
- Background: `bg-slate-700/50`
- Fill: `bg-gradient-to-r from-emerald-500 to-teal-400`
- Border radius: `rounded-full`
- Transition: `transition-all duration-500`

**Category Badge:**
- Background: category colour at 10% opacity
- Border: 1px solid category colour at 20% opacity
- Text: category colour
- Font: `text-xs font-semibold uppercase tracking-wider`
- Padding: `px-3 py-1`
- Border radius: `rounded-full`

**Navigation:**
- "Back" button: left-aligned, text only with arrow
- "Next" button: right-aligned, primary CTA
- Disabled state: `opacity-50 cursor-not-allowed`

**Keyboard Navigation:**
- `Tab`: Move between options
- `Space`/`Enter`: Select option
- `Arrow Up`/`Arrow Down`: Navigate options
- `→`/`N`: Next question (when answered)
- `←`/`P`: Previous question

**Accessibility:**
- `role="radiogroup"` on options container
- `role="radio"` on each option
- `aria-checked` on selected option
- `aria-label` on question text
- `aria-describedby` linking to help text
- Focus trap within question card
- Live region for progress updates

---

### 4. Review Screen

**Purpose:** Allow users to review and modify answers before submission.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                                          Edit Mode  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Review Your Answers                                        │
│                                                             │
│  You can edit any answer before submitting.                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Q1: {Question text}                                │   │
│  │  Your answer: {Selected option}                     │   │
│  │  [Edit]                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Q2: {Question text}                                │   │
│  │  Your answer: {Selected option}                     │   │
│  │  [Edit]                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ...                                                        │
│                                                             │
│  [Submit Assessment]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Collapsible question cards
- "Edit" button jumps to that question
- Summary: "{Answered}/{Total} questions answered"
- Warning if required questions unanswered

---

### 5. Lead Capture Form

**Purpose:** Collect participant details. Maximise completion rate while gathering lead data.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Almost Done                                                │
│                                                             │
│  Enter your details to receive your personalised results,  │
│  professional report, and verified certificate.            │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Full Name *                                                │
│  [________________________________________]                │
│                                                             │
│  Email Address *                                            │
│  [________________________________________]                │
│                                                             │
│  Company (optional)                                         │
│  [________________________________________]                │
│                                                             │
│  Job Title (optional)                                       │
│  [________________________________________]                │
│                                                             │
│  Industry (optional)                                        │
│  [▼ Select Industry]                                        │
│                                                             │
│  Country (optional)                                         │
│  [▼ Select Country]                                         │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  [ ] I agree to receive my personalised assessment results │
│    and certificate. I have read and agree to the            │
│    [Privacy Policy]. *                                      │
│                                                             │
│  [ ] I would like to receive Terrnix Sustainability        │
│    Intelligence and product updates. (Optional)             │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  [Get My Results]                                           │
│                                                             │
│  🔒 Your information is secure and will never be shared.   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Full Name | text | Yes | Min 2 chars, max 100 |
| Email | email | Yes | Valid email format, MX check |
| Company | text | No | Max 100 chars |
| Job Title | text | No | Max 100 chars |
| Industry | select | No | From predefined list |
| Country | select | No | ISO 3166 list |

**Consent Checkboxes:**
- **Required checkbox:** Unchecked by default. Must be checked to submit.
- **Newsletter checkbox:** Unchecked by default. Optional.

**Validation:**
- Real-time validation on blur
- Error messages below fields
- Submit button disabled until valid
- Loading state during submission

**Privacy Notice:**
- Small text below form
- Links to Privacy Policy and Terms

---

### 6. Results Page

**Purpose:** Deliver value. Make results feel like a consulting deliverable.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Your Assessment Results                                    │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              {Score}/100                            │   │
│  │                                                     │   │
│  │         {Maturity Level Badge}                      │   │
│  │                                                     │   │
│  │    {Maturity Description}                           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Category Breakdown                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              [Radar Chart]                          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Governance        ████████████░░░░  80%                  │
│  Data Collection   █████████░░░░░░░  65%                  │
│  Reporting         ██████████░░░░░░  70%                  │
│  Targets           ███████████░░░░░  75%                  │
│  Engagement        ███████░░░░░░░░░  60%                  │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Executive Summary                                          │
│                                                             │
│  {Auto-generated summary based on scores}                  │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Your Strengths                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  {Category 1}  {Score}%                             │   │
│  │  {Strength description}                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  {Category 2}  {Score}%                             │   │
│  │  {Strength description}                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Priority Gaps                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  {Category 3}  {Score}%                             │   │
│  │  {Gap description + risk}                           │   │
│  │  [Recommended Action]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Recommended Actions                                        │
│                                                             │
│  1. {Action Title}                                        │
│     {Description}                                          │
│     Impact: {High/Medium/Low} | Difficulty: {Easy/Hard}   │
│     [Learn More]                                           │
│                                                             │
│  2. {Action Title}                                        │
│     ...                                                    │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  30-60-90 Day Roadmap                                       │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │   30 Days    │ │   60 Days    │ │   90 Days    │       │
│  │  Foundation  │ │ Development  │ │   Maturity   │       │
│  │              │ │              │ │              │       │
│  │ • Action 1   │ │ • Action 3   │ │ • Action 5   │       │
│  │ • Action 2   │ │ • Action 4   │ │ • Action 6   │       │
│  └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Recommended Resources                                      │
│                                                             │
│  Articles                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  {Article Title}                                    │   │
│  │  {Description}                    [Read →]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Calculators                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  {Calculator Title}                                 │   │
│  │  {Description}                    [Try →]           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  [Download Report]  [Download Certificate]  [Share]        │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Need Expert Guidance?                                      │
│                                                             │
│  Book a free 30-minute consultation with a Terrnix         │
│  sustainability expert.                                    │
│                                                             │
│  [Book Consultation]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Score Display:**
- Large score: `text-7xl font-bold`
- Maturity badge: `px-4 py-2 rounded-full` with level colour
- Description: `text-lg text-slate-300`

**Radar Chart:**
- Library: Chart.js (already loaded)
- Colours: Category colours from config
- Grid: `rgba(255,255,255,0.1)`
- Labels: White text
- Animation: 1s ease-out on load

**Category Bars:**
- Horizontal bars with percentage
- Colour-coded by score range
- Label + score on right

**Action Cards:**
- Border left: 4px solid priority colour
- Priority 1: emerald, Priority 2: teal, Priority 3: blue
- Impact + Difficulty badges

**Roadmap:**
- Three columns: 30 / 60 / 90 days
- Each column: title + 2-3 actions
- Staggered animation on scroll

**Download Buttons:**
- Primary: "Download Report" (emerald gradient)
- Secondary: "Download Certificate" (amber gradient)
- Tertiary: "Share Results" (outline)

**Share Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│  Share Your Results                                    [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Share this link with your team:                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  https://terrnix.com/a/r/{token}          [Copy]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Or share directly:                                         │
│                                                             │
│  [LinkedIn]  [Twitter]  [Email]  [WhatsApp]               │
│                                                             │
│  ⚠️ This link does not contain any personal information.   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|---------------|
| Mobile | < 640px | Single column, stacked cards, full-width buttons |
| Tablet | 640–1024px | Two columns for some sections |
| Desktop | > 1024px | Full layout, side-by-side where appropriate |

**Mobile Optimisations:**
- Touch targets: min 44px height
- Font size: min 16px for inputs (prevents zoom)
- Swipe gestures: swipe left/right for navigation (optional)
- Bottom sheet: for share modal
- Sticky CTA: "Next" button fixed at bottom

---

## Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Page fade in | 300ms | ease-out | Page load |
| Question slide | 400ms | cubic-bezier(0.4, 0, 0.2, 1) | Next/Previous |
| Option select | 200ms | ease-out | Click |
| Progress bar | 500ms | ease-out | Question change |
| Score count up | 1500ms | ease-out | Results load |
| Radar chart | 1000ms | ease-out | Results load |
| Card hover | 200ms | ease-out | Mouse enter |
| Button hover | 150ms | ease-out | Mouse enter |
| Modal open | 250ms | cubic-bezier(0.4, 0, 0.2, 1) | Click |
| Stagger children | 100ms delay each | ease-out | Parent visible |

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Colour System

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--emerald-500` | #059669 | Primary accent, CTAs, links |
| `--emerald-400` | #34d399 | Hover states, highlights |
| `--teal-500` | #0d9488 | Secondary accent |
| `--slate-900` | #0f172a | Background |
| `--slate-800` | #1e293b | Card background |
| `--slate-700` | #334155 | Borders, dividers |
| `--slate-400` | #94a3b8 | Secondary text |
| `--slate-300` | #cbd5e1 | Primary text |
| `--white` | #ffffff | Headings, emphasis |

### Score Colours

| Range | Hex | Usage |
|-------|-----|-------|
| 0–49 | #ef4444 | Critical, Foundation |
| 50–69 | #f59e0b | Warning, Developing |
| 70–84 | #10b981 | Good, Practitioner |
| 85–100 | #059669 | Excellent, Advanced |

### Category Colours

Defined per assessment in JSON config. Default palette:

| Category | Hex |
|----------|-----|
| Governance | #059669 |
| Data | #0d9488 |
| Reporting | #0891b2 |
| Targets | #2563eb |
| Engagement | #7c3aed |

---

## Typography

| Element | Font | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---------|------|---------------|---------------|--------|-------------|
| H1 (title) | Inter | 48px | 32px | 700 | 1.1 |
| H2 (section) | Inter | 32px | 24px | 700 | 1.2 |
| H3 (card title) | Inter | 24px | 20px | 600 | 1.3 |
| Body | Inter | 16px | 16px | 400 | 1.6 |
| Small | Inter | 14px | 14px | 400 | 1.5 |
| Caption | Inter | 12px | 12px | 500 | 1.4 |
| Score | Inter | 72px | 56px | 800 | 1.0 |
| Button | Inter | 16px | 16px | 600 | 1.0 |

---

## Component Library

### Buttons

**Primary:**
```
Background: gradient from emerald-500 to teal-500
Text: white, font-semibold
Padding: px-8 py-4
Border radius: rounded-xl
Shadow: shadow-lg shadow-emerald-500/20
Hover: -translate-y-0.5, shadow increase
Active: translate-y-0
Disabled: opacity-50, cursor-not-allowed
```

**Secondary:**
```
Background: transparent
Border: 2px solid emerald-500
Text: emerald-400
Hover: bg-emerald-500/10
```

**Tertiary:**
```
Background: slate-700/50
Text: slate-300
Hover: bg-slate-600/50
```

### Cards

**Standard Card:**
```
Background: slate-800/60
Border: 1px solid slate-700/50
Border radius: rounded-2xl
Padding: p-6
Shadow: shadow-xl
Hover: border-emerald-500/30
```

**Score Card:**
```
Background: gradient from emerald-500/20 to teal-500/20
Border: 4px solid emerald-500/30
Border radius: rounded-full (circle)
Size: 160px × 160px
```

### Badges

**Category Badge:**
```
Background: category-colour/10
Border: 1px solid category-colour/20
Text: category-colour, uppercase, text-xs, font-semibold
Padding: px-3 py-1
Border radius: rounded-full
```

**Maturity Badge:**
```
Background: level-colour/10
Border: 1px solid level-colour/30
Text: level-colour, font-bold
Padding: px-4 py-2
Border radius: rounded-full
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|---------------|
| Colour contrast | All text ≥ 4.5:1 against background |
| Focus indicators | 2px solid emerald-400 outline, 2px offset |
| Keyboard navigation | All interactive elements accessible via Tab |
| Screen reader | All questions, options, and results announced |
| ARIA labels | `aria-label`, `aria-describedby`, `role` attributes |
| Error identification | Errors announced via `aria-live="polite"` |
| Form labels | All inputs have associated `<label>` |
| Skip links | "Skip to main content" link on landing page |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate interactive elements |
| Space/Enter | Select option / Activate button |
| Arrow Up/Down | Navigate options |
| Arrow Right | Next question |
| Arrow Left | Previous question |
| Escape | Close modal / Cancel action |

---

## Loading States

### Skeleton Screens

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ████████████████████░░░░░░░░░░                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ██████████████░░░░░░░░░░░░░░░░                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ██████████████████████████░░░░                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ████████████████████████░░░░░░                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [████████████████████████████]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Skeleton styling:**
- Background: `bg-slate-700/30`
- Animation: `animate-pulse`
- Border radius: matches content

### Loading Spinner

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────┐                               │
│                    │  ⟳      │  Generating your report...   │
│                    └─────────┘                               │
│                                                             │
│                    This may take a few seconds.             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Error States

### Network Error

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ⚠️                                       │
│                                                             │
│         Unable to load assessment                           │
│                                                             │
│         Please check your connection and try again.        │
│                                                             │
│              [Retry]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Validation Error

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Full Name *                                                │
│  [________________________________________]                │
│  ⚠️ Please enter your full name                            │
│                                                             │
│  Email Address *                                            │
│  [________________________________________]                │
│  ⚠️ Please enter a valid email address                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Error styling:**
- Border: `border-red-500`
- Text: `text-red-400`
- Icon: `text-red-400`
- Aria: `aria-invalid="true"`, `aria-describedby="error-id"`

---

## Empty States

### No Recommendations

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  No specific recommendations                                │
│                                                             │
│  Your scores are balanced across all categories.           │
│  Consider exploring our advanced resources.                │
│                                                             │
│  [Browse Resources]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### CSS Architecture

```css
/* assessment.css */

/* Base */
.assessment { }
.assessment--loading { }
.assessment--error { }

/* Screens */
.assessment-intro { }
.assessment-question { }
.assessment-review { }
.assessment-lead-capture { }
.assessment-results { }

/* Components */
.assessment-card { }
.assessment-option { }
.assessment-option--selected { }
.assessment-progress { }
.assessment-score { }
.assessment-badge { }
.assessment-badge--maturity { }
.assessment-roadmap { }
.assessment-action { }

/* Utilities */
.assessment-sr-only { }
.assessment-focus-ring { }
```

### JavaScript Architecture

```javascript
// index.js - Entry point
import { AssessmentEngine } from './core.js';
import { AssessmentUI } from './ui.js';

const engine = new AssessmentEngine('assessment-container', {
  assessmentSlug: 'carbon-accounting-readiness',
  theme: 'dark',
  language: 'en'
});

engine.load().then(() => {
  engine.start();
});
```

---

## Testing Checklist

### Visual
- [ ] All screens match design specifications
- [ ] Colours match palette exactly
- [ ] Typography matches specifications
- [ ] Spacing matches 8px grid
- [ ] Animations are smooth and performant

### Responsive
- [ ] Mobile (< 640px): all screens usable
- [ ] Tablet (640–1024px): optimised layout
- [ ] Desktop (> 1024px): full experience
- [ ] Landscape orientation works

### Accessibility
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content
- [ ] Focus indicators visible
- [ ] Colour contrast ≥ 4.5:1
- [ ] Reduced motion respected

### Performance
- [ ] First paint < 1.5s
- [ ] Interactive < 3.5s
- [ ] Animations at 60fps
- [ ] No layout shift during load
