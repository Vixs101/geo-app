import assert from "node:assert/strict";
import test from "node:test";
import { filterIncidents, validateAuth } from "./validation.ts";
import type { IncidentRecord } from "./types.ts";

test("authentication validates registration fields", () => {
  const errors = validateAuth("register", {
    fullName: "A",
    phone: "123",
    password: "123",
    confirmPassword: "456",
  });
  assert.deepEqual(Object.keys(errors), ["fullName", "phone", "password", "confirmPassword"]);
  assert.deepEqual(
    validateAuth("login", {
      fullName: "",
      phone: "+234 803 123 4567",
      password: "secure1",
      confirmPassword: "",
    }),
    {},
  );
});

test("incident records can be searched and filtered", () => {
  const records = [
    { id: "INC-1", citizen: "Amina Yusuf", location: "Jalingo", coordinates: "8.9, 11.3", unit: "MED-04", status: "active" },
    { id: "INC-2", citizen: "Musa Bello", location: "Nukkai", coordinates: "8.8, 11.4", unit: "POL-11", status: "resolved" },
  ] as IncidentRecord[];
  assert.equal(filterIncidents(records, "amina", "all").length, 1);
  assert.equal(filterIncidents(records, "", "resolved")[0].id, "INC-2");
});
