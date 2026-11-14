import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const states = JSON.parse(readFileSync(new URL("../data/states-2027.json", import.meta.url), "utf8"));

test("seven expected states cover 940 Assembly constituencies", () => {
  assert.equal(states.length, 7);
  assert.equal(states.reduce((sum, state) => sum + state.seats, 0), 940);
});

test("state identifiers are unique, safe and complete", () => {
  assert.equal(new Set(states.map((state) => state.slug)).size, states.length);
  for (const state of states) {
    assert.match(state.slug, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(state.name && Number.isInteger(state.seats) && state.seats > 0);
    assert.ok(["early-2027", "late-2027"].includes(state.wave));
  }
});

test("planning data cannot masquerade as ECI-announced polling dates", () => {
  for (const state of states) {
    assert.equal(state.status, "expected");
    assert.equal(state.pollDate, null);
  }
});
