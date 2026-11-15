# The Next PM — Independent Democracy Platform — Project Handbook

> Owner: `vaishnavsawant1994-stack` · Repository: `the-next-pm` · Reviewed: 15 November 2026  
> Documentation maturity: repo/source/manifest inspection; **not** an independent live release certification.

## Project overview and audience
Independent, nonpartisan Indian election and civic-information product focused on constituencies, candidates, parties and verified official results.

**Intended users:** Indian voters, researchers and editorial staff.

## Main features / user journeys
1. Public election/constituency content and responsive presentation.
2. Data import/migration foundations for structured civic records.
3. Editorial console and source-verification workflow foundation.
4. Future state-election and 2029 Lok Sabha information planning.

These items are code areas and project goals; individual end-to-end flows must be qualified separately.

## Architecture, stack and repository layout
Next.js/React/TypeScript with PostgreSQL (`pg`) and Better Auth package, `app/`, `components/`, `data/`, `db/`, `lib/`, `scripts/`, `tests/` and docs. Domain `thenextpm.in` is identified in README as owned but not deployed/connected by that commit.

## What is actually qualified or still outstanding
Website starter and Phase 1 database/editorial source work exist. Presence of candidate data/schema does not prove current, certified ECI results or an operational voting service.

Source code and historical QA reports are distinct from passing current CI, real integrations, live deployment and production acceptance.

## Installation and developer operations
`npm install`, `npm run dev` for frontend; `npm run check` runs tests/typecheck/lint/build. Database migration/seed scripts must target an approved isolated database.

Before running migrations, scripts or providers, verify environment, branches, private credentials, target database and rollback. Do not use actual user/customer records in unqualified development.

## Security and quality requirements
- Do not impersonate the Election Commission, government or political parties.
- Show citations, published dates and correction history for election claims.
- Separate factual information from opinion and do not manipulate voter choices.
Release acceptance also requires role/session auditing, dependency/security review, accessible interaction, observability, backups, restore and a controlled rollback where applicable.

## Prioritized roadmap
1. Define official-source ingestion and verification audit.
2. Test editor roles, corrections and immutable provenance.
3. Add dated 2027 state and 2029 national election timelines from official calendars.
4. Qualify mobile accessibility and nonpartisan presentation.

## Source-of-truth documents
- [`README.md`](../README.md)
- [`package.json`](../package.json)
- [`docs/`](../docs/)
- [`db/`](../db/)
- [`tests/`](../tests/)

**Maintenance:** Revisit this guide when functional implementation, project boundaries or deployment gates change. For precise status, read qualified exact-commit test and release artifacts.
