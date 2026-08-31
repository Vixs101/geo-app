import type {
  IncidentAction,
  IncidentState,
  IncidentStatus,
} from "./types.ts";

export const initialIncident: IncidentState = {
  type: "medical",
  status: "idle",
};

const allowedTransitions: Record<IncidentStatus, IncidentStatus[]> = {
  idle: ["locating"],
  locating: ["searching"],
  searching: ["assigned"],
  assigned: ["en_route"],
  en_route: ["arrived"],
  arrived: ["resolved"],
  resolved: [],
};

export function incidentReducer(
  state: IncidentState,
  action: IncidentAction,
): IncidentState {
  if (action.type === "reset") return initialIncident;
  if (action.type === "select" && state.status === "idle") {
    return { ...state, type: action.emergency };
  }
  if (
    action.type === "transition" &&
    allowedTransitions[state.status].includes(action.status)
  ) {
    return { ...state, status: action.status };
  }
  return state;
}

export function hasReached(
  current: IncidentStatus,
  target: IncidentStatus,
): boolean {
  return Object.keys(allowedTransitions).indexOf(current) >=
    Object.keys(allowedTransitions).indexOf(target);
}
