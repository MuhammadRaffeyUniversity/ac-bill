# Responsive Motion System Design

## Goal

Make AC Bill feel responsive and polished across sign-in, Data Entry, CEO, supporting staff, and public customer screens without slowing operational work or obscuring financial data.

## Direction

Use subtle operational motion: 120–220ms transitions, 4–8px entrance offsets, restrained stagger timing, and no decorative looping animation. Keep the existing teal, neutral, typography, spacing, and light/dark theme system. The distinctive signature is a short, ordered “system ready” entrance: identity first, then the current work surface, then its actionable records.

## Architecture

- Keep motion CSS-first in `app/globals.css`; do not add a motion dependency or convert server components into client components for visual effects.
- Add reusable semantic classes and `data-motion` hooks for page, panel, list, and item entrances.
- Add a small client submit button using `useFormStatus` so sign-in communicates pending state without delaying authentication.
- Use existing dialog animation hooks for the mobile drawer and preserve accessible focus behavior.
- Disable transforms, transitions, and nonessential animation under `prefers-reduced-motion: reduce`.

## Responsive Rules

- Test widths 320, 360, 768, 1024, and 1440 pixels.
- Never allow page-level horizontal overflow; tables and dense invoice rows may scroll inside their own bounded containers.
- Keep primary tap targets at least 44 pixels on mobile.
- Keep the mobile header hierarchy compact: menu and title first, user/theme/sign-out controls beneath or beside them without clipping.
- Preserve the queue-first, detail-second mobile job workflow.
- Preserve all desktop sidebars and information density at `lg` and above.

## Motion Map

- Sign-in: brand row enters first, card follows, form fields use a short stagger, and the submit button shows an immediate pending state.
- App shells: sidebar and header settle once; main page content uses a single fade-and-lift entrance.
- Workflow and dashboard: stage panels, metric cards, queue records, ledger cards, and operational cards use short staggered entrances.
- Navigation and controls: hover/press motion is limited to 1–2 pixels and never changes layout dimensions.
- Dialogs and mobile drawer: retain directional movement with tuned easing and reduced-motion fallback.

## Verification

- Automated source contract tests cover motion tokens, reduced-motion rules, sign-in pending feedback, and shell hooks.
- Run the full Vitest suite, TypeScript, ESLint, and `next build`.
- Browser-check authenticated Data Entry and sign-in across all target widths, light/dark themes, keyboard focus, drawer navigation, and reduced-motion emulation where supported.
- CEO uses the same shell motion contracts and mobile sidebar component; browser verification requires an authenticated admin session.
