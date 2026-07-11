# Flexible Team Roster Design

## Goal

Seed the four confirmed teams now while allowing Data Entry operators to add future teams without a fixed six-team constraint.

## Confirmed Initial Roster

| Team | Members | Region and initial service area | Compensation |
| --- | --- | --- | --- |
| JB Team 1 | Nouman and Khan | Johor Bahru | Salary |
| JB Team 2 | Ayaz Khan and Yousaf Khan | Johor Bahru | Salary |
| Melaka Team 1 | Zubair and Rehman | Melaka | Salary |
| Ali & Zeeshan | Ali and Zeeshan | Unspecified | Commission |

The roster intentionally starts with four active teams. It is not a claim that the final operating roster contains four teams; Data Entry may add teams through the existing protected team-setup screen as business needs change.

## Architecture

The Prisma seed owns the initial team and team-member records, using idempotent upserts. Commission rules remain database records seeded by compensation type, so the UI never embeds team names or rates. Team counts used in dashboard/configuration text must be derived from active database records or describe the initial roster accurately; no workflow will block until six teams exist.

Data Entry remains the role that can create teams. CEO stays read-only and operational routes remain unavailable to that role. Team creation retains validation for name, optional region, compensation type, and comma-separated service areas.

## Financial Rules

The initial rules are: salary-team sender share 25%, and commission-team shares of 60% team, 25% sender, and 15% company. These are seeded as effective CommissionRule records and consumed by deterministic server-side calculations.

## Error Handling and Auditability

The seed will not overwrite user-managed teams outside its four stable seed identities. Empty region/service-area values remain explicit rather than guessed; the team setup form can complete them later. The plan records that the two additional teams, final service areas, discount treatment, invoice timing, reconciliation definition, and workbook validation snapshot remain unresolved.

## Testing

Add a seed-data unit test or an extracted pure seed-data test proving there are initially three salary teams and one commission team, named as confirmed. Keep existing team-setup validation tests and add a permission-oriented test if the current coverage does not prove Data Entry can create a fifth team without a six-team cap. Run the full test suite, typecheck, lint, and production build; browser-test team setup under a Data Entry account.

