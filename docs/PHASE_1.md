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


## Better Auth staff login and private editorial administration

A private editorial interface now exists at /staff. It uses verified email/password Better Auth sessions, TOTP second-factor enrollment and confirmation, role-based server authorization and a review/publishing queue. The auth API refuses all traffic if DATABASE_URL, BETTER_AUTH_URL and a high-entropy BETTER_AUTH_SECRET are missing.

### Isolated database onboarding

1. Provision an isolated PostgreSQL database for The Next PM, with backups and least-privilege application credentials.
2. Run npm install, npm run db:migrate, npm run auth:migrate and npm run db:seed.
3. Generate a unique high-entropy BETTER_AUTH_SECRET (at least 32 characters) and configure BETTER_AUTH_URL to the canonical HTTPS site origin. Never put secrets in Git.
4. In a trusted terminal, run npx auth@1.6.30 create-admin --email YOUR_VERIFIED_EMAIL --name YOUR_NAME. Enter the password at the interactive prompt, never in chat or process arguments.
5. In a privileged DB console, look up the new ID using SELECT id,email FROM "user" WHERE email='YOUR_VERIFIED_EMAIL'; . Better Auth creates verified initial admins by default; confirm this.
6. Temporarily enable EDITORIAL_OPERATOR_ENABLED=true and EDITORIAL_STAFF_BOOTSTRAP=true in an isolated operator environment. Run node scripts/editorial.mjs staff:add EMAIL NAME admin, then node scripts/editorial.mjs staff:bind STAFF_UUID BETTER_AUTH_USER_ID. The bind rejects mismatched or unverified identities. Disable both flags immediately afterward.
7. Sign in at /staff/sign-in, enroll an authenticator at /staff/2fa, store recovery codes securely, and continue to /staff.
8. Additional staff accounts require individually provisioned verified Better Auth users with least privilege and explicit binding to the relevant role (operator, reviewer or publisher). Do not make every editor a Better Auth admin.

### Boundaries

- An authenticated user is not an editor unless bound to an active staff_members record whose verified email matches.
- TOTP must be enabled and a valid Better Auth session must exist before protected staff pages or publishing APIs are used.
- Each source and election announcement requires separately identifiable proposer, reviewer and publisher.
- All publishing writes are transactional and add append-only audit records.
- The UI does not verify the truth of a document merely by being clicked. A real reviewer must inspect the actual original ECI notice and record meaningful evidence notes.
- The operator CLI remains a privileged manual tool, not a remotely authenticated service.

### Not yet complete

A database is not provisioned, the first real staff account has not been enrolled, actual official notices have not been reviewed, and a production deployment, backups and monitoring have not been configured. A successful migration in CI does not replace a real production acceptance test.


## Verified constituency batch imports

The public /constituencies directory is read-only and publishes only independently approved records whose source remains verified. Draft or rejected rows are never shown.

The private /staff dashboard includes CSV upload, batch review and publication, and a published-record count. All changes are role-gated, independent, auditable and transactional. A trusted operator CLI is also available:

1. node scripts/constituencies.mjs validate PATH_TO_CSV
2. node scripts/constituencies.mjs submit PATH_TO_CSV VERIFIED_SOURCE_UUID OPERATOR_UUID
3. node scripts/constituencies.mjs review BATCH_UUID REVIEWER_UUID approved REVIEW_NOTES
4. node scripts/constituencies.mjs publish BATCH_UUID PUBLISHER_UUID

For submit/review/publish, a dedicated DATABASE_URL and EDITORIAL_OPERATOR_ENABLED=true are required. Trusted operator UUIDs are not authentication and should be used only in a controlled shell. The browser workflow uses real Better Auth sessions instead.

CSV header must be exactly:

state_slug,seat_number,seat_name,boundary_version

Every CSV contains only one state. Seat numbers must be within that state's authorized Assembly capacity; duplicates, malformed quotes, unknown states and empty names are rejected. The system does not generate fictional records to meet coverage targets. Source ownership/reuse permission must be independently reviewed before importing documents.

There is **no claim of 690 verified seat records** until lawful originals have been obtained, checked and approved. Sample datasets in tests are synthetic and never published to a real environment.
