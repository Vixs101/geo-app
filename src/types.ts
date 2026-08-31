export type Role = "citizen" | "responder" | "dispatcher";
export type EmergencyType = "medical" | "fire" | "security";
export type IncidentStatus =
  | "idle"
  | "locating"
  | "searching"
  | "assigned"
  | "en_route"
  | "arrived"
  | "resolved";

export type Coordinates = [number, number];

export type Facility = {
  id: string;
  name: string;
  type: EmergencyType;
  position: Coordinates;
};

export type Responder = {
  id: string;
  name: string;
  unit: string;
  type: EmergencyType;
  position: Coordinates;
  distance: string;
  eta: string;
  status: "available" | "busy" | "offline";
};

export type IncidentState = {
  type: EmergencyType;
  status: IncidentStatus;
};

export type IncidentAction =
  | { type: "select"; emergency: EmergencyType }
  | { type: "transition"; status: IncidentStatus }
  | { type: "reset" };
