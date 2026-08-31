import type {
  Coordinates,
  EmergencyType,
  Facility,
  IncidentStatus,
  Responder,
} from "./types.ts";

export const JALINGO_CENTER: Coordinates = [8.8927, 11.3772];
export const INCIDENT_POSITION: Coordinates = [8.9008, 11.3658];

export const facilities: Facility[] = [
  {
    id: "f-1",
    name: "Federal Medical Centre",
    type: "medical",
    position: [8.9019, 11.3597],
  },
  {
    id: "f-2",
    name: "Jalingo Fire Station",
    type: "fire",
    position: [8.889, 11.3715],
  },
  {
    id: "f-3",
    name: "Police Area Command",
    type: "security",
    position: [8.8962, 11.3828],
  },
];

export const responders: Responder[] = [
  {
    id: "MED-04",
    name: "Amina Yusuf",
    unit: "RapidAid Ambulance 04",
    type: "medical",
    position: [8.8918, 11.381],
    distance: "2.4 km",
    eta: "7 min",
    status: "available",
  },
  {
    id: "FIRE-02",
    name: "Daniel Ishaya",
    unit: "Fire Response 02",
    type: "fire",
    position: [8.8854, 11.3698],
    distance: "3.1 km",
    eta: "9 min",
    status: "available",
  },
  {
    id: "POL-11",
    name: "Musa Garba",
    unit: "Police Patrol 11",
    type: "security",
    position: [8.897, 11.3872],
    distance: "3.8 km",
    eta: "10 min",
    status: "busy",
  },
  {
    id: "MED-07",
    name: "Grace Danladi",
    unit: "RapidAid Ambulance 07",
    type: "medical",
    position: [8.91, 11.389],
    distance: "4.7 km",
    eta: "12 min",
    status: "offline",
  },
];

export const emergencyCopy: Record<
  EmergencyType,
  { label: string; short: string; color: string }
> = {
  medical: {
    label: "Medical emergency",
    short: "Medical",
    color: "#e53e4d",
  },
  fire: { label: "Fire emergency", short: "Fire", color: "#ed7b2f" },
  security: {
    label: "Security emergency",
    short: "Security",
    color: "#5b6fe8",
  },
};

export const statusCopy: Record<
  IncidentStatus,
  { title: string; description: string }
> = {
  idle: {
    title: "Ready when you need us",
    description: "Choose the kind of help you need to begin.",
  },
  locating: {
    title: "Locating you",
    description: "Securely confirming your precise GPS coordinates.",
  },
  searching: {
    title: "Contacting nearby units",
    description: "The closest available responder has been notified.",
  },
  assigned: {
    title: "Help has been assigned",
    description: "Your responder is preparing to leave.",
  },
  en_route: {
    title: "Help is on the way",
    description: "Your responder is travelling to your location.",
  },
  arrived: {
    title: "Responder has arrived",
    description: "Make yourself visible if it is safe to do so.",
  },
  resolved: {
    title: "Incident resolved",
    description: "This emergency request has been closed successfully.",
  },
};

export const routePoints: Coordinates[] = [
  responders[0].position,
  [8.894, 11.3783],
  [8.8961, 11.3742],
  [8.8981, 11.3698],
  INCIDENT_POSITION,
];
