# Accessibility And Responsive QA

Date: 2026-07-29

## Scope

This QA pass covers the implemented unauthenticated, protected-route, admin-shell, and employee-shell surfaces that can be verified safely without test-only auth shortcuts. Authenticated admin and employee operational flows still require approved real test users.

## Automated Checks

- Protected admin and employee routes remain dynamic and no-store.
- Mutation entry points keep same-origin and role checks.
- Shared progress indicators expose `role="progressbar"` and ARIA value attributes.
- Employee bottom tab navigation has a localized `aria-label` and active tabs expose `aria-current`.
- Employee item selection and completion checkboxes have screen-reader labels.
- Advisory item status never drives `disabled` or `aria-disabled`.
- Source avoids viewport-scaled text classes and large fixed-width utility classes that commonly cause mobile overflow.

## Browser Smoke

- `/de/employee` without a session redirects to `/de/login`.
- `/de/admin/reports` without a session redirects to `/de/login`.
- Browser console showed no errors or warnings.
- No horizontal overflow was observed in the available browser viewport.
- The protected redirect was checked after the employee workflow and QA coverage changes.

## Remaining Manual QA

- Authenticated admin desktop pages need real admin credentials for keyboard traversal, form focus order, dense table/list scanning, and large-data overflow checks.
- Authenticated employee mobile My Day needs real employee credentials with a scheduled client to test checkbox ergonomics, completion controls, and no-overlap behavior on real item names.
- Full accessibility audit with a browser axe-style engine can be added once an approved browser testing dependency or MCP capability is available.
- The current browser control surface did not expose viewport resizing, so true 390px mobile visual inspection remains a manual/tooling gap despite static responsive contracts passing.
