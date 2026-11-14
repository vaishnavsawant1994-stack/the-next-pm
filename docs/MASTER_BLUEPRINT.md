# THE NEXT PM — Master blueprint v1.0

**Domain:** thenextpm.in — DNS, hosting and deployment unverified.
**Vision:** an independent, nonpartisan, source-first Indian election and democracy information ecosystem. No candidate endorsement or official voting service.

## Full 16-module map — 124 planned page templates

A. **Public identity / trust (8):** Homepage; About; How It Works; Sources; Editorial Policy; Corrections; Contact; Accessibility.

B. **Election discovery (8):** All Elections; Calendar; 2027 Hub; 2028 Hub; 2029 Hub; Election Archive; Election Detail; Election Timeline.

C. **States and UTs (7):** State/UT Directory; State Overview; State Elections; State Assembly; State Parties; State Issues; State History.

D. **Constituencies (7):** Constituency Search; Assembly Seat; Lok Sabha Seat; Seat Candidates; Seat Results; Seat History; Local Issues.

E. **People / candidates (8):** People Directory; Person Profile; Election Participation; Affidavit References; Public Statements; Documented Record; Side-by-Side Facts; Correction Request.

F. **Parties / alliances (6):** Party Directory; Party Detail; Party Results; Manifestos; Party Officeholders; Alliance Directory.

G. **Manifestos / public issues (6):** Manifesto Library; Manifesto Detail; Manifesto Comparison; Issue Directory; Issue Explainer; Published Positions.

H. **Results and analysis (8):** Results Home; Election Result; State Results; Constituency Results; Seat Totals; Vote Share; Results Methodology; Archive.

I. **Governance and institutions (7):** Governance Overview; Representatives; Representative Detail; Bills; Bill Detail; Public Data; Government Explainers.

J. **News / fact checks (8):** News Desk; Article; Topic Directory; Topic Feed; Explainers; Explainer Detail; Fact Checks; Fact-Check Detail.

K. **Public participation (7):** Community Home; Discussions; Discussion Detail; Citizen Questions; Issue Board; Issue Surveys; Community Guidelines.

L. **Voter education (7):** Voter Guide; Registration Help; Constituency Help; Polling Day; EVM/VVPAT; FAQ; Official Violation-Reporting Links.

M. **AI and research (6):** Ask AI; Sources for AI; Saved Queries; Research Workspace; Research Dossier; AI Transparency.

N. **Citizen accounts (8):** Sign In; Sign Up; Account Home; Saved; Following; Notification Preferences; Privacy; Security.

O. **Editorial operations (11):** Editorial Dashboard; Election Editor; Constituency Editor; Candidate Editor; Party Editor; Results Operator; Content Editor; Review Queue; Moderation; Corrections; Media Library.

P. **Platform operations (12):** Admin Dashboard; Staff Access; Roles; Sources; Ingestion; Bulk Imports; Data Quality; Audit; Incident Response; Analytics; System Status; Feature Flags.

**Total: 124 templates.** Public state/seat/candidate detail templates generate many records from data; 124 is not the number of pre-authored candidate pages.

## Priority tiers

**P0 / 2027 foundation:** public site, elections/calendar, five early state hubs, basic constituency identifiers, verified candidate/party records as published, official links, results methodology and secure admin/editorial/source workflow. Do not delay launch waiting for community or AI features.

**P1 / 2027–28:** election history, manifestos, factual comparisons, accessible visualizations, regional translations, user alert preferences, privacy systems and additional coverage.

**P2 / 2028–29+:** moderated discussions, optional surveys with methodology, source-constrained AI research, deeper governance and institutional records. All need separate safety reviews.

## Expected election cycles (not official polling dates)
- **Early 2027 planning:** Goa, Manipur, Punjab, Uttarakhand, Uttar Pradesh — 690 Assembly seats.
- **Late 2027 planning:** Gujarat, Himachal Pradesh — 250 seats. Himachal Pradesh's Assembly term ends in January 2028, so its election window is inferred, not announced.
- **2028 planning:** Meghalaya, Nagaland, Tripura, Karnataka, Mizoram, Chhattisgarh, Madhya Pradesh, Rajasthan, Telangana — 1,083 Assembly seats.
- **2029 planning:** Lok Sabha general election, 543 elected parliamentary constituencies as current baseline, subject to official changes.

## Public workflows
1. Find an election → state → constituency → candidate record → official source.
2. Compare attributable candidate declarations/manifesto positions by documented fields, not leader scoring.
3. Follow official results with captured timestamps, provisional/final labeling and revision/correction history.
4. Read voter guides, then go to ECI's official registration and result services.
5. Later, ask citation-based questions and participate in moderated discussions with transparent methods.

## Engineering delivery
- Start with a modular Next.js/TypeScript app; add PostgreSQL and separated editorial API when validated.
- Version all official source references and administrative writes.
- Protect editorial/administrative accounts with MFA, least-privilege permissions and independent approval for result publishing.
- Keep separate staging/production; backups and tested restores; CI unit/integration/e2e/security/accessibility tests; CDN caching and stale-data banners for counting days.
- Aim for WCAG 2.2 AA and strong mobile Web Vitals; set load targets before the live results launch.

## Safeguards
- Independent platform; not affiliated with ECI. No official online voting.
- Explicit sources, date stamps, correction history, legal source/asset reuse checks, ownership/funding disclosures.
- No personal political profiling, paid rankings, unsupported outcome predictions or fabricated political statements.
- Legal review: Representation of the People Act (including exit-poll restrictions), relevant ECI guidance, privacy/DPDP, intermediary rules for UGC, content copyright and defamation.
- Defer exit/opinion polls, political ads, public community and AI publishing until activity-specific legal and operational review passes.

## Acceptance and roadmap
See DELIVERY_PLAN.md, EDITORIAL_STANDARDS.md and ARCHITECTURE.md. Current release is a **starter frontend and planning source**; not an official election dataset, functional vote-count feed, user account system, live editorial system or complete 124-screen implementation.

## Primary references
- https://www.eci.gov.in/
- https://www.eci.gov.in/term-of-the-houses/
- https://results.eci.gov.in/
- https://voters.eci.gov.in/
