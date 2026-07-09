# CEO Command Center Dashboard Design

## Purpose

Give Ali an immediate, calm view of jobs that need a decision. This replaces the current all-at-once dashboard with an exception-first command center; finance remains visible as a health signal, not a competing report surface.

## Scope

This design changes the CEO dashboard at `/` only. It preserves the existing role gate, sign-out action, theme control, navigation destinations, sample data, and business calculations. It does not change the underlying job, payment, expense, or reporting models.

## Layout

- A narrow fixed desktop sidebar contains the AC Bill wordmark and six plain navigation links. `Today` is the only selected state; setup counts and decorative status pills are removed.
- The page header contains `Today`, the current date, a compact authenticated user control, and one teal `New job` action. Reporting, theme, and sign-out controls move into a quiet utility cluster so they do not compete with primary work.
- A single amber exception band directly below the header summarizes the count and type of attention items, with one `Review now` action.
- `Needs attention` is the dominant table. Each row shows customer, job ID and area, scheduled time, assigned team, and one actionable issue state. Rows are ordered by urgency.
- A horizontal financial pulse follows the priority table. It contains only jobs completed, cash to deposit, and daily profit.
- `On track` comes last as a short supporting list, not a second full dashboard.

## Visual System

- Palette: paper `#F7F9F8`, ink `#11231F`, border `#D8E0DC`, teal `#087F78`, amber `#B96808`, issue red `#C94D43`.
- Typography: existing sans-serif stack; page title is strong but compact, table labels are small utility text, and numbers only receive emphasis in the financial pulse.
- Containers: 8px radius maximum, subtle 1px borders, almost no shadows. The main table is a purposeful framed data surface; the rest of the page relies on spacing and dividers.
- Icon treatment: restrained Lucide outline icons only when they clarify an action or state.

## Responsive Behavior

- Desktop retains the sidebar and data tables.
- Tablet collapses the utility cluster cleanly and allows the priority table to scroll horizontally only when needed.
- Mobile converts the `Needs attention` and `On track` tables to stacked job rows. The `New job` action remains visible, while lower-priority utility controls move into a compact overflow pattern.

## Interactions

- `Review now` focuses the attention queue.
- Issue tags are visually actionable and will later route to the corresponding job workflow.
- The primary `New job` action leads to intake.
- Theme and sign-out remain available but visually secondary.

## Validation

- Verify the desktop first viewport at the accepted concept size.
- Verify the authenticated CEO view at mobile width without text collisions or horizontal page overflow.
- Verify navigation, `New job`, theme toggle, and sign-out retain their current behavior.
- Run typecheck and lint, then compare the rendered desktop dashboard against the approved visual concept.
