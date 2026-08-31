import { useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import {
  Activity,
  Ambulance,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Crosshair,
  Flame,
  HeartPulse,
  History,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Route,
  Search,
  Shield,
  ShieldCheck,
  Siren,
  UserRound,
  Wifi,
} from "lucide-react";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import {
  emergencyCopy,
  facilities,
  INCIDENT_POSITION,
  JALINGO_CENTER,
  responders,
  statusCopy,
} from "./data.ts";
import { hasReached, incidentReducer, initialIncident } from "./state.ts";
import type {
  Coordinates,
  EmergencyType,
  IncidentStatus,
  Responder,
  Role,
} from "./types.ts";

const roles: { id: Role; label: string; icon: typeof UserRound }[] = [
  { id: "citizen", label: "Citizen", icon: UserRound },
  { id: "responder", label: "Responder", icon: Ambulance },
  { id: "dispatcher", label: "Command centre", icon: Radio },
];

function markerIcon(kind: "incident" | "responder" | "facility", color: string) {
  return divIcon({
    className: "map-marker-wrapper",
    html: `<span class="map-marker map-marker--${kind}" style="--marker-color:${color}"><span></span></span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function MapSizer({ dependency }: { dependency: string }) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(timer);
  }, [dependency, map]);
  return null;
}

function midpoint(a: Coordinates, b: Coordinates): Coordinates {
  return [(a[0] + b[0]) / 2 + 0.0015, (a[1] + b[1]) / 2 - 0.001];
}

function positionFor(responder: Responder, status: IncidentStatus): Coordinates {
  if (status === "arrived" || status === "resolved") return INCIDENT_POSITION;
  if (status === "en_route") return midpoint(responder.position, INCIDENT_POSITION);
  return responder.position;
}

function EmergencyMap({
  status,
  emergency,
  compact = false,
  dependency,
  assetFilter = "all",
}: {
  status: IncidentStatus;
  emergency: EmergencyType;
  compact?: boolean;
  dependency: string;
  assetFilter?: "all" | EmergencyType;
}) {
  const primary = responders.find((unit) => unit.type === emergency) ?? responders[0];
  const active = status !== "idle" && status !== "locating";
  const assigned = hasReached(status, "assigned");
  const currentPosition = positionFor(primary, status);
  const route: Coordinates[] = [
    primary.position,
    midpoint(primary.position, INCIDENT_POSITION),
    INCIDENT_POSITION,
  ];
  const shownFacilities = assetFilter === "all" ? facilities : facilities.filter((facility) => facility.type === assetFilter);
  const shownResponders = assetFilter === "all" ? responders : responders.filter((unit) => unit.type === assetFilter);

  return (
    <div className={`map-shell ${compact ? "map-shell--compact" : ""}`} aria-label="Interactive map of emergency assets in Jalingo">
      <MapContainer center={JALINGO_CENTER} zoom={14} zoomControl={!compact} scrollWheelZoom className="map">
        <MapSizer dependency={`${dependency}-${status}`} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shownFacilities.map((facility) => (
          <Marker
            key={facility.id}
            position={facility.position}
            icon={markerIcon("facility", emergencyCopy[facility.type].color)}
          >
            <Popup>
              <strong>{facility.name}</strong>
              <br />
              {emergencyCopy[facility.type].short} facility
            </Popup>
          </Marker>
        ))}
        {shownResponders.map((unit) => {
          const isPrimary = unit.id === primary.id && assigned;
          const position = isPrimary ? currentPosition : unit.position;
          return (
            <Marker
              key={unit.id}
              position={position}
              icon={markerIcon(
                "responder",
                unit.status === "offline" ? "#8090a3" : isPrimary ? "#0b8f79" : "#2563eb",
              )}
            >
              <Popup>
                <strong>{unit.unit}</strong>
                <br />
                {unit.name} · {isPrimary ? "Assigned" : unit.status}
              </Popup>
            </Marker>
          );
        })}
        {active && (
          <>
            <Circle center={INCIDENT_POSITION} radius={180} pathOptions={{ color: emergencyCopy[emergency].color, fillOpacity: 0.1 }} />
            <Marker position={INCIDENT_POSITION} icon={markerIcon("incident", emergencyCopy[emergency].color)}>
              <Popup>
                <strong>Active {emergencyCopy[emergency].short.toLowerCase()} emergency</strong>
                <br />
                Palace Way, Jalingo
              </Popup>
            </Marker>
          </>
        )}
        {assigned && status !== "resolved" && (assetFilter === "all" || assetFilter === emergency) && (
          <Polyline positions={route} pathOptions={{ color: "#0b8f79", weight: 5, dashArray: "9 9", opacity: 0.9 }} />
        )}
      </MapContainer>
      <div className="map-legend" aria-hidden="true">
        <span><i className="legend-dot legend-dot--incident" /> Incident</span>
        <span><i className="legend-dot legend-dot--unit" /> Responder</span>
        <span><i className="legend-dot legend-dot--facility" /> Facility</span>
      </div>
      <div className="map-live"><Wifi size={13} /> Live</div>
    </div>
  );
}

function Logo() {
  return (
    <div className="brand">
      <span className="brand__mark"><Siren size={23} /></span>
      <span><strong>RapidAid</strong><small>Taraba emergency network</small></span>
    </div>
  );
}

function AppHeader({ role, setRole }: { role: Role; setRole: (role: Role) => void }) {
  return (
    <>
      <div className="system-banner">
        <span><Radio size={14} /> Taraba State Emergency Network</span>
        <p>Jalingo response zone</p>
        <strong><i /> All systems operational</strong>
      </div>
      <header className="app-header">
        <Logo />
        <nav className="role-switcher" aria-label="Preview application as">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={role === item.id ? "active" : ""}
                aria-pressed={role === item.id}
                aria-label={`View as ${item.label}`}
                onClick={() => setRole(item.id)}
              >
                <Icon size={17} /> <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="header-meta">
          <span className="network"><i /> Network operational</span>
          <button className="avatar" type="button" aria-label="Open account"><CircleUserRound size={21} /></button>
        </div>
      </header>
    </>
  );
}

function EmergencyIcon({ type, size = 25 }: { type: EmergencyType; size?: number }) {
  if (type === "medical") return <HeartPulse size={size} />;
  if (type === "fire") return <Flame size={size} />;
  return <Shield size={size} />;
}

function StatusPill({ status }: { status: IncidentStatus }) {
  return <span className={`status-pill status-pill--${status}`}>{status.replace("_", " ")}</span>;
}

function CitizenView({
  emergency,
  status,
  selectEmergency,
  begin,
  reset,
}: {
  emergency: EmergencyType;
  status: IncidentStatus;
  selectEmergency: (type: EmergencyType) => void;
  begin: () => void;
  reset: () => void;
}) {
  const primary = responders.find((unit) => unit.type === emergency) ?? responders[0];
  const active = status !== "idle";

  return (
    <main className="citizen-page">
      <section className="citizen-intro">
        <div>
          <span className="eyebrow"><ShieldCheck size={15} /> Verified emergency network</span>
          <h1>{active ? statusCopy[status].title : "Emergency help, without the guesswork."}</h1>
          <p>{active ? statusCopy[status].description : "Share your precise location and reach the closest verified responder in a few simple steps."}</p>
        </div>
        <div className="emergency-number"><Phone size={18} /><span><small>Voice emergency line</small><strong>112</strong></span></div>
      </section>

      {!active ? (
        <section className="citizen-grid">
          <div className="request-card panel">
            <div className="section-heading">
              <span className="step-number">1</span>
              <div><h2>What kind of help do you need?</h2><p>Select one option to alert the right response team.</p></div>
            </div>
            <div className="emergency-options">
              {(["medical", "fire", "security"] as EmergencyType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`emergency-option emergency-option--${type} ${emergency === type ? "selected" : ""}`}
                  aria-pressed={emergency === type}
                  onClick={() => selectEmergency(type)}
                >
                  <span className="emergency-option__icon"><EmergencyIcon type={type} /></span>
                  <span><strong>{emergencyCopy[type].short}</strong><small>{type === "medical" ? "Injury or illness" : type === "fire" ? "Fire or smoke" : "Threat or danger"}</small></span>
                  <i>{emergency === type && <Check size={14} />}</i>
                </button>
              ))}
            </div>
            <div className="location-preview">
              <span><LocateFixed size={20} /></span>
              <div><strong>Your current location</strong><p>Palace Way, Jalingo · Accuracy 12 m</p></div>
              <button type="button">Edit</button>
            </div>
            <button className="primary-action primary-action--danger" type="button" onClick={begin}>
              <Siren size={20} /> Request emergency help <ChevronRight size={19} />
            </button>
            <p className="privacy-note"><ShieldCheck size={14} /> Your location is only shared with the assigned response team.</p>
          </div>
          <div className="citizen-side">
            <EmergencyMap status={status} emergency={emergency} compact dependency="citizen-idle" />
            <div className="confidence-row">
              <article><span><Crosshair size={20} /></span><strong>Precise location</strong><p>No need to explain nearby landmarks.</p></article>
              <article><span><ShieldCheck size={20} /></span><strong>Verified responders</strong><p>Only authorized units receive alerts.</p></article>
            </div>
          </div>
        </section>
      ) : (
        <section className="tracking-grid">
          <div className="tracking-panel panel">
            <div className={`tracking-signal tracking-signal--${status}`}>
              {status === "resolved" ? <CheckCircle2 size={32} /> : status === "locating" ? <LocateFixed size={32} /> : <Radio size={32} />}
            </div>
            <StatusPill status={status} />
            <h2>{statusCopy[status].title}</h2>
            <p>{statusCopy[status].description}</p>

            {hasReached(status, "assigned") && (
              <div className="responder-card">
                <span className="responder-avatar"><Ambulance size={24} /></span>
                <div><small>Your responder</small><strong>{primary.name}</strong><p>{primary.unit} · {primary.id}</p></div>
                <span className="eta"><small>ETA</small><strong>{status === "arrived" || status === "resolved" ? "Here" : status === "en_route" ? "4 min" : primary.eta}</strong></span>
              </div>
            )}

            <div className="progress-list">
              {[
                ["searching", "Request shared", "Your location and emergency type were received."],
                ["assigned", "Responder assigned", `${primary.unit} accepted your request.`],
                ["en_route", "Travelling to you", "Live location sharing is active."],
                ["arrived", "Help arrived", "The response team reached your location."],
              ].map(([step, label, description]) => {
                const done = hasReached(status, step as IncidentStatus);
                return (
                  <div key={step} className={done ? "done" : ""}>
                    <i>{done ? <Check size={14} /> : null}</i>
                    <span><strong>{label}</strong><small>{description}</small></span>
                  </div>
                );
              })}
            </div>

            {status !== "resolved" ? (
              <div className="safety-note"><ShieldCheck size={20} /><span><strong>Stay safe while you wait</strong><p>Move away from immediate danger and keep your phone available.</p></span></div>
            ) : (
              <div className="resolved-note"><CheckCircle2 size={20} /><span><strong>Incident closed</strong><p>Your emergency request was resolved successfully.</p></span></div>
            )}
            {status === "resolved" && <button type="button" className="primary-action return-action" onClick={reset}>Return home</button>}
          </div>
          <EmergencyMap status={status} emergency={emergency} dependency="citizen-active" />
        </section>
      )}
    </main>
  );
}

function ResponderView({
  emergency,
  status,
  transition,
}: {
  emergency: EmergencyType;
  status: IncidentStatus;
  transition: (status: IncidentStatus) => void;
}) {
  const [available, setAvailable] = useState(true);
  const primary = responders.find((unit) => unit.type === emergency) ?? responders[0];
  const incoming = status === "searching";
  const assigned = hasReached(status, "assigned") && status !== "resolved";
  const nextAction =
    status === "assigned"
      ? { label: "Start response", status: "en_route" as IncidentStatus, icon: Navigation }
      : status === "en_route"
        ? { label: "Mark as arrived", status: "arrived" as IncidentStatus, icon: MapPin }
        : status === "arrived"
          ? { label: "Resolve incident", status: "resolved" as IncidentStatus, icon: CheckCircle2 }
          : null;
  const NextActionIcon = nextAction?.icon;

  return (
    <main className="operations-page">
      <div className="page-title-row">
        <div><span className="eyebrow"><Radio size={15} /> Responder application</span><h1>Good afternoon, {primary.name.split(" ")[0]}</h1><p>{primary.unit} · Jalingo response zone</p></div>
        <button type="button" className={`availability ${available ? "on" : ""}`} onClick={() => setAvailable((value) => !value)} aria-pressed={available}>
          <i /><span><small>Duty status</small><strong>{available ? "Available" : "Off duty"}</strong></span>
        </button>
      </div>

      {incoming && (
        <section className="incoming-alert">
          <div className="incoming-alert__pulse"><BellRing size={27} /></div>
          <div className="incoming-alert__copy">
            <span>New request · just now</span>
            <h2>{emergencyCopy[emergency].label}</h2>
            <p><MapPin size={16} /> Palace Way, Jalingo · {primary.distance} away</p>
          </div>
          <div className="incoming-alert__eta"><small>Estimated arrival</small><strong>{primary.eta}</strong><span>Light traffic</span></div>
          <div className="incoming-alert__actions">
            <button type="button" className="primary-action" onClick={() => transition("assigned")}><Check size={18} /> Accept request</button>
          </div>
        </section>
      )}

      <section className="responder-grid">
        <div className="responder-main">
          <EmergencyMap status={status} emergency={emergency} dependency="responder" />
          {assigned && (
            <div className="trip-bar">
              <div><span className="trip-icon"><Navigation size={21} /></span><span><small>Current assignment</small><strong>Palace Way, Jalingo</strong></span></div>
              <div className="trip-stats"><span><small>Distance</small><strong>{status === "en_route" ? "1.1 km" : status === "arrived" ? "0 m" : primary.distance}</strong></span><span><small>ETA</small><strong>{status === "arrived" ? "Arrived" : status === "en_route" ? "4 min" : primary.eta}</strong></span></div>
              {nextAction && NextActionIcon && <button type="button" className="primary-action" onClick={() => transition(nextAction.status)}><NextActionIcon size={18} /> {nextAction.label}</button>}
            </div>
          )}
        </div>
        <aside className="responder-sidebar">
          <section className="panel assignment-card">
            <div className="panel-title"><h2>{assigned ? "Incident details" : "Current assignment"}</h2>{assigned && <StatusPill status={status} />}</div>
            {assigned ? (
              <>
                <div className={`incident-type incident-type--${emergency}`}><EmergencyIcon type={emergency} /><span><strong>{emergencyCopy[emergency].label}</strong><small>Priority response</small></span></div>
                <dl className="detail-list">
                  <div><dt>Caller</dt><dd>Fatima Bello <span>Verified</span></dd></div>
                  <div><dt>Location</dt><dd>Palace Way, Jalingo</dd></div>
                  <div><dt>Reported</dt><dd>2 minutes ago</dd></div>
                  <div><dt>Notes</dt><dd>Caller is conscious and in a safe position.</dd></div>
                </dl>
                <button type="button" className="contact-button"><Phone size={17} /> Contact caller</button>
              </>
            ) : (
              <div className="empty-state"><span><Route size={27} /></span><strong>No active assignment</strong><p>{incoming ? "Review the new request to begin." : "Stay available for nearby requests."}</p></div>
            )}
          </section>
          <section className="panel shift-card">
            <div className="panel-title"><h2>Today’s shift</h2><span>08:00–18:00</span></div>
            <div className="shift-stats"><span><strong>4</strong><small>Completed</small></span><span><strong>6m</strong><small>Avg. arrival</small></span><span><strong>4.9</strong><small>Rating</small></span></div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon metric-icon--${tone}`}>{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function DispatcherView({ emergency, status, transition }: { emergency: EmergencyType; status: IncidentStatus; transition: (status: IncidentStatus) => void }) {
  const primary = responders.find((unit) => unit.type === emergency) ?? responders[0];
  const active = status !== "idle" && status !== "resolved";
  const [filter, setFilter] = useState<"all" | EmergencyType>("all");
  const visibleResponders = filter === "all" ? responders : responders.filter((unit) => unit.type === filter);
  const events = [
    { time: "14:32", text: "Medical unit MED-04 returned to available", tone: "green" },
    { time: "14:27", text: "Incident INC-2026-1038 resolved", tone: "blue" },
    { time: "14:16", text: "Police Patrol 11 accepted an assignment", tone: "violet" },
    { time: "14:05", text: "Fire Response 02 completed safety check", tone: "orange" },
  ];

  return (
    <main className="operations-page dispatcher-page">
      <div className="page-title-row">
        <div><span className="eyebrow"><Activity size={15} /> Live operations</span><h1>Emergency command centre</h1><p>Jalingo response zone · Monday, 31 August</p></div>
        <div className="dispatch-actions"><button type="button" className="icon-button" aria-label="Search"><Search size={19} /></button><button type="button" className="icon-button notification" aria-label="Notifications"><BellRing size={19} /><i /></button><button type="button" className="primary-action"><Siren size={18} /> Create incident</button></div>
      </div>

      <section className="metrics-grid">
        <Metric icon={<Siren size={21} />} label="Active incidents" value={active ? "4" : "3"} detail={active ? "+1 in the last hour" : "Across Jalingo"} tone="red" />
        <Metric icon={<Ambulance size={21} />} label="Units available" value="12" detail="of 18 total units" tone="teal" />
        <Metric icon={<Clock3 size={21} />} label="Average response" value="6m 24s" detail="8% faster this week" tone="blue" />
        <Metric icon={<CheckCircle2 size={21} />} label="Resolved today" value={status === "resolved" ? "29" : "28"} detail="94% within target" tone="violet" />
      </section>

      <section className="command-grid">
        <div className="command-map panel">
          <div className="panel-toolbar">
            <div><h2>Live response map</h2><p>{responders.filter((unit) => unit.status !== "offline").length} units reporting location</p></div>
            <div className="map-filters">
              {(["all", "medical", "fire", "security"] as const).map((item) => (
                <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All assets" : emergencyCopy[item].short}</button>
              ))}
            </div>
          </div>
          <EmergencyMap status={status} emergency={emergency} dependency={`dispatcher-${filter}`} assetFilter={filter} />
        </div>

        <aside className="incident-queue panel">
          <div className="panel-title"><div><h2>Incident queue</h2><p>{active ? "4" : "3"} currently active</p></div><button type="button">View all</button></div>
          {status !== "idle" && (
            <article className="queue-item queue-item--featured">
              <div className="queue-top"><span className={`queue-icon queue-icon--${emergency}`}><EmergencyIcon type={emergency} size={18} /></span><span><strong>INC-2026-1042</strong><small>Just now</small></span><StatusPill status={status} /></div>
              <h3>{emergencyCopy[emergency].label}</h3>
              <p><MapPin size={14} /> Palace Way, Jalingo</p>
              {status === "searching" ? (
                <button className="queue-assign" type="button" onClick={() => transition("assigned")}><Ambulance size={16} /> Assign {primary.id}</button>
              ) : hasReached(status, "assigned") ? (
                <div className="assigned-unit"><span><Ambulance size={15} /></span><p><strong>{primary.id}</strong><small>{primary.name} · {primary.eta}</small></p></div>
              ) : null}
            </article>
          )}
          <article className="queue-item">
            <div className="queue-top"><span className="queue-icon queue-icon--security"><Shield size={18} /></span><span><strong>INC-2026-1041</strong><small>4 min ago</small></span><StatusPill status="en_route" /></div>
            <h3>Security assistance</h3><p><MapPin size={14} /> Hammaruwa Way</p>
            <div className="assigned-unit"><span><Shield size={15} /></span><p><strong>POL-11</strong><small>Musa Garba · 6 min</small></p></div>
          </article>
          <article className="queue-item">
            <div className="queue-top"><span className="queue-icon queue-icon--fire"><Flame size={18} /></span><span><strong>INC-2026-1040</strong><small>11 min ago</small></span><StatusPill status="arrived" /></div>
            <h3>Smoke reported</h3><p><MapPin size={14} /> Roadblock, Jalingo</p>
          </article>
        </aside>
      </section>

      <section className="dispatch-bottom">
        <div className="panel units-panel">
          <div className="panel-title"><div><h2>Response units</h2><p>Live availability and assignments</p></div><button type="button">Manage units</button></div>
          <div className="units-table" role="table" aria-label="Response units">
            <div className="units-row units-row--head" role="row"><span>Unit</span><span>Responder</span><span>Type</span><span>Status</span><span>Distance</span></div>
            {visibleResponders.map((unit) => (
              <div className="units-row" role="row" key={unit.id}>
                <span><strong>{unit.id}</strong><small>{unit.unit}</small></span>
                <span>{unit.name}</span><span>{emergencyCopy[unit.type].short}</span>
                <span><i className={`unit-status unit-status--${unit.status}`} /> {unit.status}</span><span>{unit.distance}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel activity-panel">
          <div className="panel-title"><div><h2>Activity feed</h2><p>Latest network updates</p></div><History size={19} /></div>
          <div className="activity-list">
            {events.map((event) => <div key={event.time}><i className={`event-dot event-dot--${event.tone}`} /><span><strong>{event.text}</strong><small>{event.time}</small></span></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}

export function App() {
  const [role, setRole] = useState<Role>("citizen");
  const [incident, dispatch] = useReducer(incidentReducer, initialIncident);
  const announcement = useMemo(() => statusCopy[incident.status].title, [incident.status]);

  function beginIncident() {
    dispatch({ type: "transition", status: "locating" });
    window.setTimeout(() => dispatch({ type: "transition", status: "searching" }), 900);
  }

  function reset() {
    dispatch({ type: "reset" });
    setRole("citizen");
  }

  return (
    <div className="app">
      <AppHeader role={role} setRole={setRole} />
      <div className="sr-only" aria-live="polite">{announcement}</div>
      {role === "citizen" && (
        <CitizenView
          emergency={incident.type}
          status={incident.status}
          selectEmergency={(emergency) => dispatch({ type: "select", emergency })}
          begin={beginIncident}
          reset={reset}
        />
      )}
      {role === "responder" && (
        <ResponderView emergency={incident.type} status={incident.status} transition={(status) => dispatch({ type: "transition", status })} />
      )}
      {role === "dispatcher" && (
        <DispatcherView emergency={incident.type} status={incident.status} transition={(status) => dispatch({ type: "transition", status })} />
      )}
      <footer className="app-footer"><Logo /><p>Connecting citizens, responders and emergency operations across Taraba State.</p><span>© 2026 RapidAid</span></footer>
    </div>
  );
}
