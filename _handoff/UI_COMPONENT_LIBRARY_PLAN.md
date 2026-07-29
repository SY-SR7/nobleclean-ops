# NobleClean-Ops UI Foundation and Component Library Plan

Date: 2026-07-28

## Purpose

This file defines the implementation plan for Beads epic `nobleclean-21f` before shared UI code is written. It must be used by frontend agents when `nobleclean-21f.1`, `nobleclean-21f.2`, `nobleclean-21f.3`, or `nobleclean-21f.4` become unblocked.

No feature screen should introduce one-off colors, spacing, typography, card styles, badge styles, navigation labels, or form patterns. Admin and employee screens must be assembled from the shared foundation below.

## Current Beads State

- `nobleclean-21f.1` is implemented: Operational Clarity tokens live in `src/app/globals.css`, with token semantics exported from `src/lib/design-tokens.ts`.
- `nobleclean-21f.3` is implemented: shared UI primitives live under `src/components/ui`.
- `nobleclean-21f.2` is implemented: admin and employee layout shells live under `src/components/layout` and are mounted by the protected localized route layouts.
- `nobleclean-21f.4` is implemented: German and English locale routing/messages are in place.

Blocked issues must not be closed until their acceptance criteria are fully implemented and verified.

## Token Strategy

Tokens from `_handoff/DESIGN.md` and PRD Section 7 must become the only source of visual constants.

Required token groups:

- Color: `primary`, `primary-container`, `secondary`, `secondary-container`, surfaces, outlines, text, error, and semantic statuses.
- Status: `status-critical`, `status-warning`, `status-recent`, `status-success`.
- Typography: Montserrat for headlines and metric numbers; Hanken Grotesk for body, labels, controls, badges, tables, and dense operational text.
- Spacing: 8px base scale, 16px list/card padding, 24px desktop gutters, 16px mobile margins, 1440px desktop max container.
- Radius: 8px controls/small cards, 16px large containers/modals, full pill only for badges.
- Elevation: Level 0 background, Level 1 card/container, Level 2 modal/overlay.

Status semantics:

- `status-critical`: high-priority daily cleaning advisory.
- `status-warning`: complaint advisory.
- `status-recent`: recently cleaned advisory for normal items still inside recurrence.
- `status-success`: system completion/submission success only.
- Normal available items outside recurrence show no badge.

This status split was confirmed before implementation. `status-success` must not be emitted as a leaf-item advisory color.

## Proposed File Architecture

When implementation is unblocked, use this structure:

```text
src/
  components/
    ui/
      button.tsx
      form-input.tsx
      metric-card.tsx
      mobile-bottom-tabs.tsx
      object-tree-row.tsx
      priority-status-badge.tsx
      progress-indicator.tsx
      search-input.tsx
      task-item-card.tsx
      index.ts
    layout/
      admin-shell.tsx
      employee-shell.tsx
      index.ts
  lib/
    design-tokens.ts
    status.ts
    cn.ts
  i18n/
    messages/
      de.json
      en.json
```

If Tailwind is used through CSS variables, `src/app/globals.css` should define variables from `design-tokens.ts` or a single equivalent source of truth. Do not duplicate raw hex values in components.

Current implementation note: `src/app/globals.css` is the CSS source of truth for raw color values and Tailwind theme variables. `src/lib/design-tokens.ts` exports token class names and status semantics without duplicating hex values. Unit tests fail if raw hex colors appear elsewhere under `src`.

## Shared Components

Current implementation note: all shared primitives are exported from `src/components/ui/index.ts`. Components are prop-driven and do not embed German/English visible copy. Feature screens must pass translated labels from locale files.

### Button

Variants: `primary`, `secondary`, `ghost`, and `danger` if destructive admin actions require it. Buttons should share size, radius, focus, disabled, loading, and icon placement behavior.

### Priority/Status Badge

One badge component must render all advisory and system states. Leaf-item urgency logic must never emit `status-success`.

Allowed visual states:

- `critical`
- `warning`
- `recent`
- `success`

Labels must come from `de.json` and `en.json`, never hardcoded UI strings.

### Metric Card

Used for admin operational summaries only. It should support number, label, optional trend/metadata, and optional status accent while using Montserrat for the main value.

### Task/Item Card

Shared row/card for employee daily selection and admin leaf-item inspection. It should accept item title, optional badge, estimated minutes, last-cleaned display, optional thumbnail, and selection/completion affordances supplied by feature code.

### Object Tree Row

Reusable row for unlimited-depth section trees. It must support indentation level, active state, optional reference image marker, aggregate minutes, and accessible expand/collapse state.

### Search Input

Shared search field with leading icon, clear action when needed, label/aria support, and tokenized focus state.

### Form Input

Shared admin form control for text, number, date, select wrappers, validation state, help text, and translated error messages.

### Progress Indicator

Two modes: `linear` for employee allocated-vs-planned minutes and `ring` for admin completion percentages.

### Employee Mobile Bottom Tabs

Employee-only mobile navigation. Labels must be Tasks, Notifications, History, Profile in locale files. It must not be reused for admin desktop navigation.

## Layout Shells

Admin shell:

- Desktop-primary, 12-column layout, persistent sidebar, compact logo placement.
- Navigation entries: Home, Clients, Staff, Sections & Items, Schedule, Reports.
- Built for dense operational scanning, not a marketing landing page.

Employee shell:

- Mobile-primary, single-column content, bottom tabs.
- Focused on daily work, selected minutes, priority indicators, and completion submission.

Current implementation note: admin navigation and employee bottom-tab labels are supplied from `src/i18n/messages/de.json` and `src/i18n/messages/en.json`. The protected route layouts remain server-side guarded by role checks before the shells render. Unauthenticated browser verification of `/de/admin` and `/de/employee` must therefore land on `/de/login`; authenticated visual checks require real admin/employee sessions and must not bypass auth.

## i18n Rules

- German and English only.
- No Arabic UI text.
- No hardcoded visible strings in components, pages, navigation, validation, empty states, button labels, or badge labels.
- Feature agents must add keys to both locale files in the same change.
- Validation errors should use stable codes and translate those codes in locale files.

## Security Rules Relevant To UI Foundation

- Do not store secrets or tokens in localStorage.
- Do not read `.env` or secret files.
- Components that render user-provided text must rely on React escaping and must not use `dangerouslySetInnerHTML`.
- File/image UI must not trust client-side validation as security; server/storage validation and policies remain mandatory.
- Hidden buttons or client-side route guards are not authorization controls.

## Verification Required When Implemented

For every UI foundation implementation issue:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Browser inspection for layout/console errors once a route renders.
- Responsive screenshot checks for admin desktop and employee mobile.
- Search for raw color hex duplication outside the token source.
- Search for hardcoded UI strings in components/pages.

## How This Prevents Duplicated Visual Code

- Every visual primitive is implemented once under `src/components/ui`.
- Layout composition lives under `src/components/layout`.
- Feature folders consume shared components instead of defining local buttons, badges, cards, inputs, or progress indicators.
- Colors, spacing, radii, typography, and status semantics come from one token layer.
- Locale files are the only source of user-facing strings.

Component library verification currently includes `tests/unit/component-library.test.mjs`, which fails if any PRD Section 7.5 primitive is missing or if shared components embed known locale copy directly.
