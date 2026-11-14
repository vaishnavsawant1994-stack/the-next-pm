# The Next PM

**The Next Prime Minister — India's independent election and democracy information platform.**

Domain: **thenextpm.in** (owned, not deployed/connected by this commit)

The Next PM is an independent civic information project. It is **not an official Government of India or Election Commission of India website**, not a political party, and not an online voting system.

## Mission
Make Indian elections easier to understand through trustworthy sources, accessible constituency information, documented candidate and party records, and clearly labeled official results. The platform will not endorse or rank political candidates or tell citizens how to vote.

## Roadmap
- **2026 foundation:** responsive website, election/constituency directory, sources, editorial policy, verification workflow.
- **2027:** state-election coverage as official notices become available; prioritize Goa, Manipur, Punjab, Uttarakhand and Uttar Pradesh, then Gujarat and Himachal Pradesh.
- **2028:** additional state elections, historical records and source-backed comparisons.
- **2029:** Lok Sabha election coverage; counting status, results, official-source links.
- **Long term:** civic education, verified historical archives, moderated discussion and citation-based AI research.

This repository is being initialized as a Next.js/TypeScript web application. See `docs/MASTER_BLUEPRINT.md` and `docs/EDITORIAL_STANDARDS.md` for implementation scope and source policies.

## Local development

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run `npm run lint`, `npm run typecheck`, and `npm run build` before release.

**Data integrity:** Planning dates are not polling dates. Always check official Election Commission notices before publishing confirmed election schedules or final results.

## Phase 1 database groundwork

PostgreSQL schema, migration and seed scripts, reviewed announcement workflow and a protected **operator-only CLI** are available. Public election/state pages read the PostgreSQL catalog when `DATABASE_URL` is configured; without it, a planning-only fixture remains available. The operator CLI is NOT a staff login or public administrative interface.

```bash
npm install
# Set DATABASE_URL through an isolated backend environment / secret store
npm run db:migrate
npm run db:seed
npm run db:status
npm run test
```

See [Phase 1 implementation notes](docs/PHASE_1.md). There is no provisioned/live database or web-based editorial login as part of this commit.
