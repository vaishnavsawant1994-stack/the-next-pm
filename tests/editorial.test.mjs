import test from "node:test";
import assert from "node:assert/strict";
import {
  assertOfficialEciUrl, validatePollDate, requireRole,
  requireIndependentReviewer, assertPublishableAnnouncement
} from "../lib/editorial/policy.mjs";

test("official source guard rejects spoofed and insecure URLs", () => {
  assert.ok(assertOfficialEciUrl("https://www.eci.gov.in/term-of-the-houses/"));
  for (const url of [
    "https://eci.gov.in.fake.test/", "https://fake-eci.gov.in/", "http://www.eci.gov.in/",
    "https://elsewhere.example/", "not-a-url"
  ]) assert.throws(() => assertOfficialEciUrl(url));
});

test("dates must be real ISO calendar dates", () => {
  assert.equal(validatePollDate("2027-03-01"),"2027-03-01");
  for (const bad of ["2027-02-29","2027-13-01","2027-3-1","unknown"]) assert.throws(() => validatePollDate(bad));
});

test("separate reviewer and role checks are enforced", () => {
  assert.throws(() => requireIndependentReviewer("a","a"));
  assert.doesNotThrow(() => requireIndependentReviewer("a","b"));
  assert.throws(() => requireRole({active:false,role:"admin"},["admin"]));
  assert.throws(() => requireRole({active:true,role:"operator"},["reviewer"]));
  assert.doesNotThrow(() => requireRole({active:true,role:"reviewer"},["reviewer"]));
});

test("publishing requires approval, separate review and a verified official source", () => {
  const request={kind:"calendar_announcement",status:"approved",submitted_by:"a",reviewed_by:"b",
    region_slug:"goa",payload:{pollDate:"2027-03-01"}};
  const source={review_status:"verified",source_url:"https://www.eci.gov.in/"};
  assert.equal(assertPublishableAnnouncement(request,source),"2027-03-01");
  assert.throws(() => assertPublishableAnnouncement({...request,status:"pending"},source));
  assert.throws(() => assertPublishableAnnouncement({...request,reviewed_by:"a"},source));
  assert.throws(() => assertPublishableAnnouncement(request,{...source,review_status:"pending"}));
  assert.throws(() => assertPublishableAnnouncement(request,{...source,source_url:"https://fake.test/"}));
});
