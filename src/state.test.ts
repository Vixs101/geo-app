import assert from "node:assert/strict";
import test from "node:test";
import { incidentReducer, initialIncident } from "./state.ts";
import type { IncidentStatus } from "./types.ts";

test("incident follows the complete workflow and rejects skipped states", () => {
  let state = incidentReducer(initialIncident, {
    type: "select",
    emergency: "fire",
  });
  assert.equal(state.type, "fire");

  const skipped = incidentReducer(state, {
    type: "transition",
    status: "assigned",
  });
  assert.deepEqual(skipped, state);

  const flow: IncidentStatus[] = [
    "locating",
    "searching",
  ];
  for (const status of flow) {
    state = incidentReducer(state, { type: "transition", status });
    assert.equal(state.status, status);
  }

  state = incidentReducer(state, { type: "decline" });
  assert.equal(state.status, "searching");
  assert.equal(state.declined, true);

  for (const status of ["assigned", "en_route", "arrived", "resolved"] as IncidentStatus[]) {
    state = incidentReducer(state, { type: "transition", status });
    assert.equal(state.status, status);
    assert.equal(state.declined, false);
  }

  assert.deepEqual(incidentReducer(state, { type: "reset" }), initialIncident);
});
