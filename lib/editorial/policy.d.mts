
export function assertOfficialEciUrl(input: string): string;
export function validatePollDate(value: string): string;
export function requireRole(staff: { active: boolean; role: string } | null, allowed: string[]): void;
export function requireIndependentReviewer(submitterId: string, reviewerId: string): void;
export function assertPublishableAnnouncement(
  change: {kind: string; status: string; submitted_by: string; reviewed_by: string; region_slug: string; payload: {pollDate: string}},
  source: {review_status: string; source_url: string}
): string;
