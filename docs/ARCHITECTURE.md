# Architecture decision 001 — Start with a modular Next.js web app

**Status:** Accepted for the foundation; not a claim of production readiness.

## Initial implementation
- Next.js App Router with TypeScript and server-rendered public pages.
- CSS and accessible native navigation. No decorative application dependencies.
- Read-only source-labeled planning data in data/states-2027.json, validated by node:test.
- Separate election logic in lib/elections.ts and reusable components.
- Public pages: /, /elections, /states, /states/[slug], /voter-guide, /sources, /about.
- No database credentials, OAuth tokens, secret environment values or scraper access committed.

## Evolution
1. Add PostgreSQL migrations for election, stage, constituency, party, person, candidate, source, publication and result revisions.
2. Add secure editorial/admin application, staff MFA, least privilege, dual reviews for results and versioned audit events.
3. Add approved ingestion adapters with source-rights registry, manual CSV workflow, conflict detection and rollback.
4. Add search, object storage and carefully invalidated CDN/Redis cache when traffic and datasets justify it.
5. Add citizen accounts, AI retrieval and community only after privacy, citation and moderation controls pass.

## Design constraints
- Source and revision metadata are required for future public records.
- A planning state must never be silently promoted to a confirmed election.
- An unavailable official feed must show the last approved snapshot with a stale warning, not fabricated numbers.
- Every election reference is time-bounded. Constituency boundary changes, bypolls and disqualified nominations require explicit model support.
- Include performance and accessibility budgets in CI and release gates.

## Local commands
- npm install
- npm run dev
- npm run test
- npm run typecheck
- npm run lint
- npm run build
