import type { AuthMode, IncidentRecord } from "./types.ts";

export type AuthValues = {
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export function validateAuth(mode: AuthMode, values: AuthValues) {
  const errors: Partial<Record<keyof AuthValues, string>> = {};
  const phone = values.phone.replace(/[\s-]/g, "");

  if (mode === "register" && values.fullName.trim().length < 3) {
    errors.fullName = "Enter your full name.";
  }
  if (!/^\+?\d{10,14}$/.test(phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (values.password.length < 6) {
    errors.password = "Password must contain at least 6 characters.";
  }
  if (mode === "register" && values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function filterIncidents(
  incidents: IncidentRecord[],
  query: string,
  status: "all" | IncidentRecord["status"],
) {
  const term = query.trim().toLowerCase();
  return incidents.filter(
    (incident) =>
      (status === "all" || incident.status === status) &&
      (!term ||
        [incident.id, incident.citizen, incident.location, incident.coordinates, incident.unit]
          .join(" ")
          .toLowerCase()
          .includes(term)),
  );
}
