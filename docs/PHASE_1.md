# Phase 1 — PostgreSQL, trusted source review and editorial groundwork

**Status:** Data schema, controlled migration and seed scripts, approval logic and operator-only CLI are committed. A hosted database, official source verification, staff-authenticated web CMS and operational live data are NOT yet provisioned.

## Dedicated database
Use an isolated PostgreSQL database for The Next PM, with backups and a managed secret for DATABASE_URL. Never use another project's database.

1. npm install
2. Set DATABASE_URL in your **server/terminal environment**; never expose it in public client variables.
3. npm run db:migrate
4. npm run db:seed
5. npm run db:status
6. npm run test

Migration hashes are tracked in schema_migrations; a modified already-applied migration is refused. Seeds are repeatable, keep existing announced dates, and leave the initial ECI reference **pending verification**. The seed contains only seven state planning records, not 940 seat-by-seat records.

## Editorial workflow: trusted operator CLI

The scripts/editorial.mjs tool is **not a secure user login system**. UUID arguments are audit labels; they are NOT proof of identity. Only run inside a trusted operator shell with controlled database access.

Enable EDITORIAL_OPERATOR_ENABLED=true only in that isolated shell.

- staff:add email name role — roles: admin, operator, reviewer, publisher. Requires temporarily enabling EDITORIAL_STAFF_BOOTSTRAP=true.
- source:add official_https_url title publisher operator_uuid
- source:verify source_uuid reviewer_uuid verified|rejected [notes]
- calendar:propose state_slug YYYY-MM-DD source_uuid operator_uuid
- calendar:review request_uuid reviewer_uuid approved|rejected [notes]
- calendar:publish approved_request_uuid publisher_uuid

Example commands are intentionally omitted to avoid accidentally representing a fictional polling date as official. Every announcement source must be an authenticated official ECI URL, independently inspected by a real reviewer, and checked against the full official notice before publication.

The publish operation re-checks the verified source, review approval and state, and writes an audit record transactionally. A proposal author, reviewer, and publisher must be three different staff UUIDs. The database also enforces structural checks and append-only audit events.

## Production gates not met
- Identity-backed staff authentication, MFA and HTTP authorization.
- Staff administration web dashboard and correction/retraction interface.
- Data ingestion contracts and permission checks, candidate/seat verification data.
- Integration tests against a dedicated test PostgreSQL database.
- Hosted database provisioning, backup and restore rehearsal.
- Production-ready deployment and result-update operations.

**Never expose the operator CLI or enable editorial bootstrap flags on the public website.**
