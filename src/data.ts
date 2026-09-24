import type {
  Coordinates,
  EmergencyType,
  Facility,
  IncidentRecord,
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

export const incidentRecords: IncidentRecord[] = [
  {
    id: "INC-2026-1041",
    citizen: "Ibrahim Musa",
    coordinates: "8.9052, 11.3784",
    location: "Hammaruwa Way, Jalingo",
    emergency: "security",
    unit: "POL-11",
    reportedAt: "31 Aug, 14:16",
    resolvedAt: "—",
    duration: "In progress",
    status: "active",
  },
  {
    id: "INC-2026-1040",
    citizen: "Janet Audu",
    coordinates: "8.8871, 11.3669",
    location: "Roadblock, Jalingo",
    emergency: "fire",
    unit: "FIRE-02",
    reportedAt: "31 Aug, 14:05",
    resolvedAt: "—",
    duration: "On scene",
    status: "active",
  },
  {
    id: "INC-2026-1039",
    citizen: "Salamatu Bello",
    coordinates: "8.8996, 11.3621",
    location: "Palace Way, Jalingo",
    emergency: "medical",
    unit: "MED-04",
    reportedAt: "31 Aug, 13:42",
    resolvedAt: "31 Aug, 14:01",
    duration: "19 min",
    status: "resolved",
  },
  {
    id: "INC-2026-1038",
    citizen: "Emmanuel Danjuma",
    coordinates: "8.9144, 11.3695",
    location: "Mayo Gwoi, Jalingo",
    emergency: "medical",
    unit: "MED-07",
    reportedAt: "31 Aug, 12:56",
    resolvedAt: "31 Aug, 13:24",
    duration: "28 min",
    status: "resolved",
  },
  {
    id: "INC-2026-1037",
    citizen: "Maryam Sani",
    coordinates: "8.8792, 11.3820",
    location: "Nukkai, Jalingo",
    emergency: "security",
    unit: "POL-08",
    reportedAt: "31 Aug, 11:38",
    resolvedAt: "31 Aug, 12:02",
    duration: "24 min",
    status: "resolved",
  },
  {
    id: "INC-2026-1036",
    citizen: "Yakubu Peter",
    coordinates: "8.8940, 11.3901",
    location: "Magami, Jalingo",
    emergency: "fire",
    unit: "FIRE-05",
    reportedAt: "31 Aug, 10:17",
    resolvedAt: "31 Aug, 10:49",
    duration: "32 min",
    status: "resolved",
  },
  {
    id: "INC-2026-1035",
    citizen: "Aisha Hamman",
    coordinates: "8.9065, 11.3518",
    location: "Sabon Gari, Jalingo",
    emergency: "medical",
    unit: "—",
    reportedAt: "31 Aug, 09:44",
    resolvedAt: "31 Aug, 09:47",
    duration: "3 min",
    status: "cancelled",
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
    title: "Using sample location",
    description: "This demo uses a fixed location in Jalingo.",
  },
  searching: {
    title: "Showing sample responders",
    description: "No real responder has been notified.",
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
