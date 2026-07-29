---
name: Operational Clarity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#42474d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#72787e'
  outline-variant: '#c2c7ce'
  surface-tint: '#3a6283'
  primary: '#001f34'
  on-primary: '#ffffff'
  primary-container: '#003554'
  on-primary-container: '#779ec2'
  inverse-primary: '#a3cbf1'
  secondary: '#00677c'
  on-secondary: '#ffffff'
  secondary-container: '#57dcff'
  on-secondary-container: '#005e72'
  tertiary: '#311600'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f2801'
  on-tertiary-container: '#c88e5d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#a3cbf1'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#1f4a6a'
  secondary-fixed: '#b1ecff'
  secondary-fixed-dim: '#4ed6f9'
  on-secondary-fixed: '#001f27'
  on-secondary-fixed-variant: '#004e5e'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#fab985'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#683c13'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  surface-accent: '#EBFAFC'
  status-critical: '#E11D48'
  status-warning: '#F59E0B'
  status-success: '#10B981'
  status-recent: '#87CBA1'
typography:
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for internal operational excellence, emphasizing high-throughput efficiency and data integrity. The brand personality is **trustworthy, organized, and precise**, designed to support staff in managing complex cleaning operations without cognitive fatigue.

The visual style follows a **Corporate / Modern** aesthetic with a strong emphasis on **Minimalism**. It utilizes expansive white space to separate dense data points, subtle depth to indicate interactivity, and a rigorous hierarchical structure. The interface prioritizes clarity over decoration, ensuring that status indicators and operational metrics are the primary focus of the user's attention.

## Colors

This design system uses a professional palette rooted in deep navy and bright cyan to establish authority and cleanliness.

- **Primary Deep Navy (`#003554`):** Used for persistent navigation, headers, and primary branding to convey stability.
- **Secondary Cyan (`#00B2D4`):** Used for primary actions, active states, and highlighting key progress metrics.
- **Operational Statuses:** A semantic set of colors is strictly reserved for system health and task urgency. **Red** denotes high priority or immediate action required; **Amber** signifies complaints or pending issues; **Green/Mint** represents recent completions or healthy states.
- **Background Tones:** The system primarily uses white and a very light cyan-tinted neutral (`#EBFAFC`) for surface differentiation, maintaining a fresh and clinical appearance.

## Typography

Typography is used to build a clear information hierarchy in data-heavy views.

**Montserrat** is reserved for headlines and brand-level identifiers to provide a modern, geometric structure. **Hanken Grotesk** is used for all functional text, body copy, and labels due to its exceptional legibility and professional, sharp letterforms.

- Use **Label Bold** in all-caps for section headers within lists or small metadata tags.
- Ensure **Body SM** is the default for dense table data to maximize information density without sacrificing readability.
- Maintain a high contrast ratio between text and backgrounds to support use in varied lighting conditions (e.g., on-site operations).

## Layout & Spacing

The layout follows a **Fixed Grid** model for the desktop dashboard to ensure predictable data visualization, switching to a **Fluid Grid** for mobile views to support on-the-go operational updates.

- **Desktop:** 12-column grid with 24px gutters. Content is housed in cards that span logical groupings (e.g., 4 columns for small metrics, 8 columns for lists).
- **Mobile:** Single column layout with 16px side margins. Cards stack vertically.
- **Rhythm:** An 8px linear scale governs all padding and margins. Vertical rhythm is critical in lists; use consistent 16px padding within list items to maintain scannability.

## Elevation & Depth

This design system utilizes **Tonal Layers** combined with **Ambient Shadows** to create a structured hierarchy.

- **Level 0 (Background):** Neutral light gray (`#F8FAFC`).
- **Level 1 (Cards/Containers):** Pure white background with a 1px border (`#E2E8F0`) and a soft, low-opacity shadow (0px 4px 12px rgba(0, 53, 84, 0.05)).
- **Level 2 (Modals/Overlays):** Higher elevation with a more pronounced shadow to pull the element forward.
- **Interactivity:** Elements like buttons or clickable list items should use a subtle vertical lift (shadow increase) on hover to indicate tactility.

## Shapes

The shape language is **Rounded**, using an 8px (0.5rem) base radius. This softens the professional aesthetic, making the tool feel more approachable and modern.

- **Standard Elements:** Buttons, input fields, and small cards use 8px corners.
- **Large Containers:** Main dashboard cards or modals use 16px (`rounded-lg`) to define distinct content areas.
- **Indicators:** Status pills and badges use a full pill shape (999px) to distinguish them from interactive buttons.

## Components

### Buttons & Actions
- **Primary:** Solid Cyan (`#00B2D4`) with white text. Rounded (8px).
- **Secondary:** Transparent with Primary Navy border and text.
- **Ghost:** No background or border, used for utility actions in lists (e.g., "Edit").

### Status Indicators
- **Priority Badges:** Small pill-shaped containers with a colored dot (Red/Amber/Green) and bold label text.
- **Operational Progress:** Use circular progress rings for task completion percentages within cards.

### Lists & Tables
- **Object Tree:** Indented list items using subtle icons (folders, location pins). Active items receive a light cyan (`#EBFAFC`) background and a left-side 4px accent bar in Primary Navy.
- **Task Items:** Large cards with a title, priority badge, and "Time Elapsed" indicator.

### Input Fields
- **Search:** Clean white background, 1px gray border, with a leading magnifying glass icon.
- **Forms:** Labels positioned above the field in **Label-SM**. Borders turn Secondary Cyan on focus.

### Cards
- Dashboard "Metric Cards" should feature a large bold number (Montserrat) with a descriptive label below it. Use a subtle gradient or light background tint (`#EBFAFC`) to differentiate summary metrics from list data.
