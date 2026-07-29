# NobleClean-Ops — Product Requirements Document
Internal Operations Tool for nobleclean (nobleclean.de)
Version 1.1 — Draft for Management Review (Design Refinement Pass)
Prepared by: [Employee Name], Cleaning Operations Staff

**Document notes / assumptions to confirm:**
This PRD is written in English for presentation to company management, since the product itself has no Arabic UI (German/English only). Let us know if a German or Arabic version is preferred instead. For leaf items with a quantity greater than 1 (e.g., "3 mirrors + tables" entered as one item with quantity = 3), the estimated time field is assumed to represent the total combined cleaning time for all units, not a per-unit time that gets multiplied automatically. Please confirm this before development starts, as it affects the admin data-entry logic.

*Design refinement note (v1.1): This revision incorporates the company's "Operational Clarity" design system (colors, typography, spacing, components) and early product reference visuals into the design-facing sections of this document (Section 6, new Section 7, and light additions to Sections 5 and 10). No functional, data-model, security, or architectural requirement from v1.0 has been changed. Where the reference visuals conflicted with an already-agreed requirement — specifically, Arabic-language marketing copy shown in the visuals versus the German/English-only product scope in Section 8.3 — the reference content was excluded rather than incorporated; see Section 7.7.*

## 1. Executive Summary
nobleclean is a German cleaning services company (nobleclean.de) providing recurring building cleaning, facade/glass cleaning, light technical maintenance, green space care, post-construction cleaning, and express cleaning to clients including offices, medical/legal practices, property management firms (WEG), construction companies, fitness & wellness clubs, car/furniture showrooms, and public institutions. Large clients are often served by a small, fixed team (e.g., 3 employees × 3 hours/day) that cannot realistically cover every detail of a large facility daily. Today there is no system to prioritize what gets cleaned, track when something was last cleaned, or flag urgent/complaint-driven areas — resulting in recurring client complaints about neglected areas.

NobleClean-Ops is a proposed internal tool (Admin + Employees only, no public access) that models each client's facility as a detailed, unlimited-depth section tree down to individual cleanable items, calculates required cleaning time automatically, and helps employees choose a smart, priority-aware daily task list that fits their allocated hours. The MVP will launch with nobleclean's real, current large client — John Reed Fitness — while the underlying system is fully generic and multi-tenant, allowing the admin to onboard additional clients at any time without code changes.

## 2. Problem Statement & Goals
**Problem**
Large clients (e.g., a fitness club with cardio zones, weight rooms, men's/women's locker rooms) receive a fixed, limited daily staffing allocation. Employees have no structured way to prioritize what to clean within their limited hours. There is no record of when any specific area or item was last cleaned. Client complaints about neglected areas (unclean for 1–2 weeks) occur repeatedly, damaging the client relationship.

**Goals**
- Give employees a clear, prioritized, time-bounded task list for each work day.
- Ensure complaint-driven and daily-critical items are never silently deprioritized.
- Track "last cleaned" timestamps per item to give visibility without adding admin overhead.
- Keep the system flexible enough to scale to more clients and, later, sub-managers — without re-architecting.
- Zero ongoing cost, minimal data collection, GDPR-aligned by design.

## 3. Users & Roles
| Role | Description |
|---|---|
| Admin | Currently a single person (company owner/manager). Full control over clients, section trees, leaf items, employee-client assignments, work calendar, and reporting. The data model and RLS policies must be designed so that future "Sub-managers" (each responsible for exactly one client) can be added later without restructuring the core schema. No sub-manager UI is required in the MVP — only the underlying extensibility. |
| Employee | A cleaning staff member. Logs in via email + password (Supabase Auth). Works for one client only, for the duration of their contract/assignment with nobleclean. Sees only the section tree, items, and schedule relevant to their assigned client and day. Has no visibility into other employees' schedules or completion history. |

## 4. Data Model (Entities & Relationships)
The database is Postgres via Supabase. All tables use UUID primary keys and created_at/updated_at timestamps unless noted.

| Table | Purpose | Key Fields | Relationships |
|---|---|---|---|
| profiles | Extends Supabase auth.users with app-specific data | id (= auth.users.id), full_name, role (admin \| employee) | 1:1 with auth.users |
| clients | Companies nobleclean serves | id, name, address, contact_info, is_active | Parent of sections, referenced by assignments |
| employee_client_assignments | Which employee works for which client, for how long | id, employee_id (FK profiles), client_id (FK clients), start_date, end_date (nullable = active) | Enforces "one active client per employee" at the application layer |
| sections | Unlimited-depth tree of areas/sub-areas per client | id, client_id, parent_section_id (self-FK, nullable = root), name, sort_order, reference_image_url (nullable) | Self-referencing tree; scoped to one client |
| leaf_items | Smallest actionable cleaning unit (e.g., "bathroom mirror") | id, section_id (FK sections), name, quantity (int, default 1), estimated_minutes, recurrence_days (nullable), tag (normal \| complaint \| high_priority), reference_image_url (nullable) | Belongs to exactly one section node |
| work_schedule | Admin-defined calendar: which employee works which day, for which client, for how many hours | id, employee_id, client_id, work_date, allocated_hours | References profiles and clients; drives daily plan minimum time |
| daily_plans | An employee's task selection for one work day | id, employee_id, client_id, work_date, status (in_progress \| submitted), submitted_at | One per employee per work day |
| daily_plan_items | The specific leaf items selected within a daily plan | id, daily_plan_id (FK), leaf_item_id (FK), is_completed (bool), completed_at (nullable) | Join table; drives "last cleaned" and completion tracking |

"Last cleaned" per item is computed (not manually tracked) as MAX(completed_at) across all daily_plan_items rows where is_completed = true for that leaf_item_id. No separate log table is needed.

Recursive time aggregation: the total estimated cleaning time shown for any section (at any depth) is the recursive sum of estimated_minutes across all descendant leaf_items, computed automatically via a recursive query/view — never entered manually.

Extensibility for future Sub-managers: a future client_managers table (client_id, user_id) can be added independently, with new RLS policies scoping a sub-manager's access to their assigned client — without altering any existing table.

## 5. Functional Requirements

### 5.1 Admin
- Client management: create/edit/deactivate clients (name, address, contact info). Fully generic — no client is hardcoded; John Reed Fitness is simply the first real entry.
- Employee-client assignment: assign an employee to a client for the duration of their contract; reassign if needed.
- Section tree builder: create, edit, reorder, and nest sections to unlimited depth per client; attach one reference image per section node (optional). Rendered using the **Object Tree Row** component (Section 7.5) so deep nesting stays scannable.
- Leaf item management: create/edit items with name, estimated time (minutes), recurrence interval (days), priority tag (normal / ⚠️ complaint / 🔴 high_priority — daily), quantity, and one optional reference image. Each item's tag is surfaced via the shared **Priority/Status Badge** component (Section 7.5), consistent everywhere the tag appears.
- Work calendar: assign an employee's working hours per specific day, with full flexibility to view/edit past and future months.
- Completion dashboard: for each employee/day, view whether the submitted daily plan was fully completed or partially completed (flag incomplete days for follow-up). Summary counts (e.g., assigned employees, open complaints, items due) are presented via **Metric Cards** (Section 7.5) on the Admin Home view.
- "Last cleaned" visibility: view the last-cleaned timestamp for any leaf item, per client.

### 5.2 Employee
- Login: email + password via Supabase Auth.
- Daily view ("My Day"): see today's (or a scheduled day's) allocated hours and the full item list for their assigned client, with visual priority indicators (see Section 6 for logic), rendered as **Task/Item Cards** with an allocated-vs-planned progress indicator (Section 7.5).
- Build a daily plan: select leaf items so that the sum of estimated_minutes ≥ allocated hours for the day. No item is ever locked — any item can be selected regardless of its visual indicator.
- Submit completion (after finishing the physical work): "Mark all as done" — one action marks the entire selected plan complete, or Individual toggling — mark/unmark specific items if the plan wasn't fully completed or was adjusted on the ground.
- Scope restriction: an employee never sees other employees' schedules, plans, or completion history — visibility is admin-only.

## 6. Visual Indicator Logic (Not a Lock)
⚠️ There is no hard lock anywhere in the system. Every leaf item remains selectable by any employee at any time, without exception. Only a visual/advisory status changes, per this logic:

| Tag | Indicator | Behavior |
|---|---|---|
| 🔴 High priority — daily | Always shown as "important/priority" | Never affected by last-cleaned date |
| ⚠️ Complaint | Always shown as a clear attention flag | Never affected by the recurrence schedule |
| Normal | If cleaned recently and still within its recurrence window → shown as "not urgent / recently cleaned" (advisory only). Once the recurrence window passes → automatically returns to normal/available | — |

The employee remains free to select any item regardless of its indicator — e.g., a "not urgent" item may need re-cleaning due to unexpected mess, even before its scheduled interval.

### 6.1 Design Token Mapping (added in v1.1)
The three advisory states above map to fixed color tokens from the "Operational Clarity" design system, so the same visual language is used everywhere a tag appears (item cards, object tree rows, item detail forms):

| Tag / State | Design Token | Hex | Badge Style |
|---|---|---|---|
| 🔴 High priority — daily | `status-critical` | `#E11D48` | Red dot + bold label, pill shape |
| ⚠️ Complaint | `status-warning` | `#F59E0B` | Amber dot + bold label, pill shape |
| Normal, within recurrence window ("recently cleaned") | `status-recent` | `#87CBA1` | Mint dot + bold label, pill shape |
| Normal, outside recurrence window (fully available, no advisory) | — | — | No badge shown (absence of a badge is itself the signal) |

`status-success` (`#10B981`) is reserved separately for system confirmations — e.g., a "submitted / fully completed" state on the admin's completion dashboard — and is not used as a leaf-item tag color, to avoid confusing "task completed today" with "not urgent to re-clean."

## 7. UI/Design System & Component Library

This section defines the frontend visual language for NobleClean-Ops. It is derived from the company's "Operational Clarity" design system and cross-checked against early product reference visuals, and exists so every screen is assembled from a small set of shared, reusable components rather than one-off styling — improving consistency, development speed, and long-term maintainability, per the project's component-library requirement.

**Design principles:** trustworthy, organized, precise; corporate/modern minimalism; generous white space to separate dense operational data; clarity prioritized over decoration; status indicators and operational metrics kept as the primary visual focus — directly supporting the goal in Section 2 that no complaint or high-priority item is ever silently lost in the noise.

### 7.1 Color System
| Role | Token(s) | Hex | Usage |
|---|---|---|---|
| Primary | `primary` / `primary-container` | `#001f34` / `#003554` | Persistent navigation, headers, primary branding — conveys stability |
| Secondary | `secondary` / `secondary-container` | `#00677c` / `#57dcff` | Primary action buttons, active states, key metric highlights |
| Surface | `surface`, `surface-container-*` | `#f7f9fb` … `#e0e3e5` | Page background and card surface layering |
| Status: High priority | `status-critical` | `#E11D48` | See 6.1 |
| Status: Complaint | `status-warning` | `#F59E0B` | See 6.1 |
| Status: Recently cleaned | `status-recent` | `#87CBA1` | See 6.1 |
| Status: System success | `status-success` | `#10B981` | Completion confirmations only (not leaf-item tags) |
| Error | `error` / `error-container` | `#ba1a1a` / `#ffdad6` | Form validation, destructive actions (e.g., deactivate client) |

### 7.2 Typography
- **Montserrat** — headline-lg/md/sm — dashboard/section titles, Metric Card numbers, brand wordmark.
- **Hanken Grotesk** — body-lg/md/sm, label-bold, label-sm — all functional text: lists, tables, forms, badges.
- **Label-Bold (all caps)** for section/category headers within lists (e.g., area names in the Object Tree).
- **Body-SM** as the default for dense table/list data, to maximize information density without hurting readability — important given the deep, unlimited-nesting section trees in Section 4.

### 7.3 Layout & Grid
- **Desktop (Admin-primary surface):** 12-column fixed grid, 24px gutters, 1440px max container width — supports predictable placement of Metric Cards (e.g., 4-column spans) and list/tree panels (e.g., 8-column spans).
- **Mobile (Employee-primary surface):** single-column fluid grid, 16px side margins, cards stacked vertically — matches the on-the-go "My Day" flow employees use in the field.
- **Rhythm:** 8px base spacing scale governs all padding/margins; list and task items use consistent 16px internal padding for scannability.

### 7.4 Elevation & Shape
- **Level 0 (background):** light neutral surface.
- **Level 1 (cards/containers):** white background, 1px border, soft low-opacity shadow.
- **Level 2 (modals/overlays):** more pronounced shadow to sit above page content.
- **Radius:** 8px on standard controls (buttons, inputs, small cards); 16px on large containers (dashboard cards, modals); full pill (999px) reserved for status badges, so an informational badge is never visually confused with a clickable button.

### 7.5 Component Library
The following reusable components cover every repeated UI element implied by the functional requirements in Section 5 and confirmed against the reference visuals:

1. **Button** — Primary (solid cyan, white text), Secondary (navy outline, transparent fill), Ghost (no border/background, for inline row actions like "Edit" or "Reassign"). Used across all admin CRUD forms and the employee's "Mark all as done" action.
2. **Priority/Status Badge** — pill-shaped, colored dot + bold all-caps label. The single component that implements Section 6's Visual Indicator Logic everywhere a tag is shown (daily item list, admin leaf-item form, object tree row).
3. **Metric Card** — large bold Montserrat number with a descriptive label underneath, light tinted background. Used on the Admin Home view for aggregate figures already present in the data model — e.g., active employee assignments, open complaint/high-priority counts, most recent completion — no new fields required.
4. **Task/Item Card (list row)** — one shared component for both the employee's daily item list and the admin's leaf-item view: title, Priority Badge, estimated time, last-cleaned indicator, optional thumbnail (`reference_image_url`).
5. **Object Tree Row** — indented row with folder/location icons for the self-referencing `sections` hierarchy; the active/selected row gets a 4px left accent bar (Primary Navy) plus a light cyan background, so deep trees stay navigable at any depth.
6. **Search Input** — white background, 1px border, leading search icon; used for client/employee/section search across admin screens.
7. **Form Input** — label positioned above the field (Label-SM), border turns Secondary Cyan on focus; used across all admin CRUD forms (clients, sections, leaf items, work calendar entries).
8. **Progress Indicator** — circular ring for per-section/per-day completion percentage on admin views; linear bar for the employee's "allocated hours vs. planned hours" indicator on the daily view.
9. **Mobile Bottom Tab Navigation (Employee only)** — Tasks / Notifications / History / Profile. A mobile-only pattern for the employee surface, separate from the admin's persistent sidebar (admin work is treated as desktop-primary, consistent with the office/management context in Section 3).

### 7.6 Screen-Level Navigation Mapping
Admin sidebar navigation is derived directly from the six Section 5.1 responsibilities, condensed to avoid ambiguous or duplicate entries seen in early concept visuals:

**Home** (Metric Cards + recent activity) · **Clients** · **Staff** (employee-client assignments) · **Sections & Items** (tree builder + leaf item management, combined since they're edited together) · **Schedule** (work calendar) · **Reports** (completion dashboard + last-cleaned visibility, combined).

### 7.7 Note on Localization & Reference Assets
Early marketing/concept visuals for the product contain Arabic marketing copy (e.g., tagline text) and bilingual DE/EN feature callouts. Per Section 8.3 of this PRD, the product ships in **German and English only — no Arabic in the UI**. That requirement is unchanged and takes precedence: all Arabic text in the reference visuals has been treated as external marketing material and excluded from the design system. Only the underlying layout, structural, and component patterns (navigation grouping, card types, badge treatment) were extracted for this section; all actual in-product copy continues to live in `locales/de.json` / `locales/en.json` per Section 8.3, with zero hardcoded strings.

### 7.8 Branding Assets
The `nobleclean` wordmark (navy "noble" + cyan "clean") is the only branding asset provided; no separate icon/symbol mark exists. It should be used at a compact size in the admin sidebar header and at a larger size on the login/auth screen. Since no icon set is specified, a single consistent icon library (matching the minimalist aesthetic) should be chosen once and reused for tree-node icons, badges, and navigation icons.

## 8. User Flows

### 8.1 Admin — Onboarding a New Client
1. Admin creates the client record.
2. Admin builds the section tree (rooms → sub-areas → sub-sub-areas, as deep as needed), optionally attaching one reference photo per node.
3. Admin adds leaf items under the relevant section nodes: name, estimated time, recurrence, tag, quantity, optional photo.
4. Admin assigns one or more employees to the client (for the duration of their engagement).
5. Admin uses the calendar to set daily allocated hours per employee.

### 8.2 Employee — Daily Work Flow
1. Employee logs in and sees today's assigned client and allocated hours.
2. Employee reviews the item list, guided by visual priority indicators.
3. Employee selects items until the total estimated time ≥ allocated hours, then proceeds to do the physical cleaning work (no connectivity required during this phase).
4. After finishing, employee returns to the app and submits completion — either "Mark all as done" or by toggling specific items.
5. The system timestamps each completed item, updating its "last cleaned" status and feeding the admin's completion dashboard.

## 9. Non-Functional Requirements

### 9.1 Security
- Password hashing and session management fully handled by Supabase Auth (no custom credential handling in application code).
- Row Level Security (RLS) is the primary authorization layer:
  - Employees can only read clients/sections/items they are actively assigned to.
  - Employees can only create/update their own daily_plans and daily_plan_items.
  - Admin has full read/write across all tables.
  - Client data is fully isolated from other clients at the query level.
- All traffic served over HTTPS via Vercel; no secrets exposed to the client bundle.
- Admin-only routes protected server-side (not merely hidden in the UI).

### 9.2 Performance
- Recursive time totals computed via a recursive SQL query/materialized view rather than client-side recursion, to stay fast even on deep trees.
- Expected traffic is low (small internal team), so default Supabase/Vercel free-tier limits are more than sufficient at MVP scale.

### 9.3 Internationalization (i18n)
- UI available in German and English only (no Arabic in the product).
- All UI strings live in separate locale files (e.g., `locales/de.json`, `locales/en.json`) using a standard Next.js i18n library (e.g., next-intl).
- No hardcoded UI text is permitted anywhere in the codebase.
- Adding a new language in the future = adding one new locale file, with zero code changes.

### 9.4 GDPR & Data Protection
- Data minimization: employee profiles store only name, email, role, and client assignment — no unnecessary personal data.
- Access control: enforced via RLS as described in 9.1, ensuring each employee only ever accesses their own scope.
- Backups: rely on Supabase's default automatic backup policy; free-tier backup retention limits should be reviewed and flagged as usage grows (see Risks).
- Right to access/erasure: admin can deactivate or remove an employee profile; completion history can be retained in aggregate/anonymized form if needed for operational continuity.
- Alignment with existing policy: nobleclean.de already publishes a Datenschutzerklärung; any new data collected by this tool should be reviewed against that existing policy — a formal legal review is recommended before launch (technical GDPR alignment alone is not a substitute for legal sign-off).

## 10. Technical Architecture
| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (App Router) | Server components for admin CRUD-heavy views; client components for interactive item selection |
| Backend / DB / Auth / Storage | Supabase (Postgres + Auth + Storage) | Storage bucket holds reference images; RLS enforces all authorization |
| Hosting | Vercel (Free Tier) | Best-fit for Next.js; direct integration, strong performance |
| Cost | $0 | Low-traffic internal tool; no paid tier required at MVP scale |
| Authorization | Supabase Row Level Security (RLS) | Designed from day one to support a future per-client "sub-manager" role via an additive client_managers table, without restructuring existing tables |
| Styling / Design system | Tailwind CSS, tokens sourced from the "Operational Clarity" design system | Colors, type scale, spacing, and radii (Section 7) implemented as a shared theme config so every component in Section 7.5 pulls from one source of truth |

High-level data flow: Browser → Next.js app (Vercel) → Supabase (Auth + Postgres + Storage), all authorization enforced at the database layer via RLS.

## 11. Phased Plan

### MVP (Phase 1)
- Real, live client: John Reed Fitness — while the system remains fully generic and multi-tenant (admin can add/edit any client at any time; nothing is hardcoded).
- Admin: client management, section tree builder, leaf item management (time, recurrence, tag, quantity, single reference image), work calendar, completion dashboard (complete/incomplete flag per day).
- Employee: login, prioritized item view, daily plan building (≥ allocated hours), post-work completion submission (bulk "mark all done" + individual toggling).
- Full German/English i18n coverage.
- RLS policies for admin/employee/client isolation, with schema already structured for future sub-manager support (UI not yet built).
- Shared component library (Section 7.5) built as the frontend foundation, so Phase 2 features reuse existing components rather than introducing new patterns.
- Hosting on Vercel + Supabase free tiers.

### Future Enhancements (Phase 2+)
- Sub-manager role and dedicated UI, scoped to one client each.
- Offline/PWA support, if real-world usage later reveals connectivity issues during work.
- Deeper reporting: employee performance stats, lateness/delay analytics, historical trend charts.
- Support for an employee working across multiple clients per day, if the business model changes.
- Employee-facing historical transparency, if desired later.
- Additional (multi-image) reference galleries per item, if a single image proves insufficient.
- Proactive admin notifications (push/email) for incomplete days, beyond the dashboard view.
- Automated recurring alerts for chronically under-cleaned areas.

## 12. Open Questions & Risks
| # | Item | Type | Notes |
|---|---|---|---|
| 1 | Whether estimated_minutes for items with quantity > 1 is total time or per-unit | Open Question | Assumed total combined time for this draft — please confirm before development |
| 2 | Supabase/Vercel free-tier limits (storage size, backup retention, connection limits) | Risk | Monitor as the tool scales to more clients; may require a paid tier later |
| 3 | Very deep/wide section trees at scale | Risk | Mitigated via recursive CTEs and an indexed parent_section_id; should remain performant at current scale |
| 4 | No offline reminder for employees to log completion after work | Risk | Could lead to under-reporting if forgotten; a simple end-of-day reminder is a low-cost Phase 2 candidate |
| 5 | Legal GDPR review | Risk | Technical alignment (this PRD) should be followed by a formal legal review against nobleclean's existing Datenschutzerklärung before launch |
| 6 | Document language | Note | Written in English for management presentation; can be translated to German or Arabic on request |
| 7 | Design token implementation | Note | Confirm the Section 7 color/typography/spacing tokens should be implemented as a single central theme config (e.g., Tailwind theme extension) rather than per-component values, to keep the Component Library maintainable |
| 8 | `status-success` vs `status-recent` usage | Open Question | This draft reserves `status-success` for system/completion confirmations and `status-recent` for the "recently cleaned" item tag (Section 6.1) — confirm this split matches intent before implementation |
