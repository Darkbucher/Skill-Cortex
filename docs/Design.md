# Design.md — Visual Design System

## 1. Design Principles
- **Clarity over decoration.** This is a diagnostic tool — the gap breakdown and heatmap are the product. Nothing visual should compete with the data.
- **Calm, clinical, trustworthy.** Avoid alarmist reds for "missing skills" — a gap is a to-do, not a failure. Use warm/neutral tones for gaps, not danger colors.
- **Consistent across all three dashboards.** Student, Mentor, and Admin views share one design language so the product feels like a single system, not three separate apps.

## 2. Color Palette

| Role | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| Primary | Deep Indigo | `#3B3F76` | Headers, primary buttons, nav |
| Primary Light | Soft Indigo | `#6366A8` | Hover states, secondary buttons |
| Accent (progress) | Teal | `#2A9D8F` | Skills acquired, positive progress, approved status |
| Accent (gap) | Amber | `#E9A23B` | Missing skills — a "to-do" tone, not danger |
| Danger (rare use) | Muted Red | `#C15C5C` | Only for actual errors (failed API calls, validation) — never for skill gaps |
| Neutral 900 | `#1F2430` | Body text |
| Neutral 500 | `#6B7280` | Secondary text, captions |
| Neutral 100 | `#F4F5F7` | Page background |
| Surface | White | `#FFFFFF` | Cards, panels |
| Border | `#E2E4E9` | Card borders, dividers |

## 3. Typography

| Use | Font | Weight | Size |
| :--- | :--- | :--- | :--- |
| Headings (H1) | Inter | 700 | 28–32px |
| Headings (H2) | Inter | 600 | 22–24px |
| Headings (H3) | Inter | 600 | 18px |
| Body | Inter | 400 | 15–16px |
| Captions / labels | Inter | 500 | 13px, letter-spacing 0.02em |
| Data / numbers (heatmap %, gap counts) | Inter (tabular numerals) | 600 | matches context |

Inter is used throughout for consistency and readability at small sizes — avoid mixing in a second typeface.

## 4. Layout & Spacing
- Base spacing unit: 4px. Use multiples (8, 12, 16, 24, 32) for margins/padding — no arbitrary values.
- Cards: 12px border radius, 1px `#E2E4E9` border, subtle shadow (`0 1px 3px rgba(0,0,0,0.06)`) — no heavy drop shadows.
- Dashboard layout: fixed left sidebar nav (240px) + fluid content area, consistent across Student/Mentor/Admin.
- Max content width: 1280px, centered, to avoid overly wide text/charts on large screens.

## 5. Component Conventions
- **Buttons:** Primary = filled Indigo, Secondary = outlined Indigo, Destructive = outlined Muted Red. Rounded corners (8px), no all-caps text.
- **Status badges:** Draft = neutral gray, Approved = Teal, Needs Revision = Amber, Rejected = Muted Red.
- **Gap breakdown list:** each missing skill shown as an Amber-bordered chip, each acquired skill as a Teal-filled chip — visually reads as a checklist, not a scorecard.
- **Heatmap (Admin):** sequential color scale from Neutral 100 (0% missing) to Amber (high % missing) — avoid red-to-green scales, which read as "pass/fail" rather than "where to intervene."
- **Charts (Recharts):** consistent color mapping — Teal for "acquired," Amber for "gap," Indigo for neutral/informational series (e.g., cohort size).

## 6. Tone of Voice (UI copy)
- Direct and factual, never guilt-inducing: "You're missing React and Docker for this role" — not "You're falling behind."
- Admin-facing copy is action-oriented: "65% of this batch is missing Docker — schedule a workshop?" rather than just a raw stat.
- Mentor-facing copy respects their time: roadmap review screens lead with a summary, not a wall of text.

## 7. Accessibility
- Minimum contrast ratio 4.5:1 for body text against backgrounds (verify Amber-on-white and Teal-on-white pairings specifically, as mid-tone colors can fail this).
- Never convey status by color alone — pair Amber/Teal/Red with icons or text labels (e.g., a checkmark for acquired, a dash for missing).
- All interactive elements keyboard-navigable; dashboards must be usable without a mouse.
