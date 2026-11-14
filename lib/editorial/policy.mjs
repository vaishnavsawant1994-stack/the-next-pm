export function assertOfficialEciUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error("Invalid official-source URL"); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || (host !== "eci.gov.in" && !host.endsWith(".eci.gov.in"))) {
    throw new Error("A calendar announcement requires an official ECI HTTPS source");
  }
  return url.toString();
}

export function validatePollDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Date must be YYYY-MM-DD");
  const date = new Date(value + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new Error("Invalid Gregorian calendar date");
  return value;
}

export function requireRole(staff, allowed) {
  if (!staff?.active || !allowed.includes(staff.role)) throw new Error("Inactive staff or insufficient permissions");
}

export function requireIndependentReviewer(submitterId, reviewerId) {
  if (!submitterId || !reviewerId || submitterId === reviewerId) throw new Error("A different person must review");
}

export function assertPublishableAnnouncement(change, source) {
  if (!change || change.kind !== "calendar_announcement" || change.status !== "approved") {
    throw new Error("Change must be an approved calendar announcement");
  }
  requireIndependentReviewer(change.submitted_by,change.reviewed_by);
  if (source?.review_status !== "verified") throw new Error("Source must be verified");
  assertOfficialEciUrl(source.source_url);
  if (!change.region_slug) throw new Error("Region is required");
  return validatePollDate(change.payload.pollDate);
}
