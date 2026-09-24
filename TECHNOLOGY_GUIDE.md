# RapidAid Geo-App: Technology Guide

## 1. System overview

RapidAid is a Real-Time Emergency Response and Asset Mapping System for Taraba State. It connects the three groups involved in an emergency response:

- Citizens report medical, fire, or security emergencies and track the assigned response team.
- Responders receive requests, accept assignments, navigate to incidents, record arrival, and close completed incidents.
- Dispatchers monitor active incidents, facilities, response units, availability, and operational performance.

Account access uses stored users and sessions. Administrators can move between demo operations and a searchable sample incident archive.

The current application shares incident state only within one browser tab. Incidents and responder locations are demo data, not a live emergency service.

## 2. Technology stack

### Vite

Vite is the development server and frontend build tool. It starts the local development environment, transforms TypeScript and JSX during development, and produces optimized static files for deployment.

Why it is used:

- Fast development startup and browser updates.
- Minimal configuration for React and TypeScript.
- Optimized static assets that can be hosted on Vercel, Netlify, Cloudflare Pages, GitHub Pages, or a conventional web server.
- Vercel Functions in `api/` provide the authentication backend.

Project commands:

```bash
npm run dev
npm run lint
npm test
npm run build
```

`npm run dev` starts the local application. `npm run lint` performs static code checks. `npm test` validates the emergency workflow. `npm run build` performs TypeScript compilation and creates deployable assets in `dist/`.

### React

React renders the user interface and keeps each role synchronized with the same incident state. The citizen, responder, and command-centre experiences are components within one application.

The principal React features are:

- `useReducer` for the emergency workflow.
- `useState` for authentication, the active role, responder duty state, administrative navigation, and table filters.
- `useMemo` for derived accessibility announcements.
- `useEffect` to resize Leaflet correctly when responsive layouts change.

Routes use browser navigation and the authenticated account role: `/` for citizens, `/responder` for responders, and `/admin` for administrators.

### TypeScript

TypeScript provides compile-time checks for React components and emergency-domain data. The application defines explicit types for roles, authentication modes, emergency categories, incident states, historical records, facilities, responders, and geographic coordinates.

An incident follows this controlled sequence:

```text
idle → locating → searching → assigned → en_route → arrived → resolved
```

Restricting the allowed values prevents different screens from using conflicting status names. TypeScript also checks component properties, action payloads, and Leaflet coordinate values.

### Leaflet and React Leaflet

Leaflet is the interactive mapping engine. React Leaflet provides React components that manage the Leaflet map lifecycle.

They provide:

- Panning and zooming.
- Facility, responder, and incident markers.
- Marker information popups.
- An incident-radius overlay.
- A route line between the assigned responder and incident.
- Correct map resizing when the role or screen size changes.
- Asset filtering in the command centre.

The map background comes from OpenStreetMap, an openly licensed geographic dataset. Its tiles display streets and place labels without requiring a Google Maps API key. OpenStreetMap attribution remains visible on every map.

For high-volume deployment, the application should use a suitable commercial or self-hosted tile provider and follow the selected provider’s usage policy.

### Lucide React

Lucide React supplies SVG icons for emergency types, navigation, statuses, calls, facilities, accounts, and dashboard actions.

It is used because the icons:

- Scale cleanly from mobile screens to command-centre displays.
- Inherit interface colors without separate image variants.
- Remain sharp at all pixel densities.
- Work with accessible text labels on interactive controls.

### Native CSS

The visual system is implemented with native CSS custom properties, Grid, Flexbox, media queries, transitions, and reduced-motion rules. No component library or styling framework is required.

The core palette assigns clear meaning to color:

- Navy for navigation, headings, and high-trust surfaces.
- Teal for operational, available, and successful states.
- Red for urgent emergency actions.
- Orange for fire-related information.
- Violet for security-related information.
- Neutral colors for borders, secondary information, and application backgrounds.

Responsive behavior is defined around 1120 px, 850 px, and 620 px:

- Desktop displays wide maps, side panels, operational metrics, and incident tables.
- Tablet layouts stack map and detail regions while preserving readable information density.
- Mobile places the role tabs inside the application header, puts emergency actions before supporting maps, converts dense tables into compact rows, and enlarges touch targets.

Fluid `clamp()` values provide balanced typography and spacing between the main breakpoints.

### Node test runner

The emergency workflow is tested with `node:test` and `node:assert`. No separate test framework is necessary for the current state logic.

The test verifies that:

- An emergency type can be selected while the incident is idle.
- Invalid skipped transitions are rejected.
- Every valid transition reaches the correct state.
- A declined request remains unassigned and returns to the dispatch queue.
- Reset returns the workflow to its initial state.
- Login and Registration fields return the appropriate validation errors.
- Incident records can be searched and filtered by status.

### ESLint

ESLint checks the TypeScript and React source for common mistakes. The configuration applies the recommended JavaScript, TypeScript, React Hooks, and React Refresh rules.

It detects unused values, incorrect hook behavior, and code patterns that could produce unpredictable rendering.

## 3. Application architecture

The demo incident workflow follows a compact unidirectional data flow within each browser tab:

```text
Login / Registration ── Vercel Function ── Turso users and sessions
                                              │
                                      Role-gated route
                                              │
                            Citizen / Responder / Admin view
                                              │
                           Local demo incident reducer and map
```

There is one source of truth for the active demo emergency in each tab. When a citizen submits a request, the reducer moves from `idle` to `locating`, then to `searching`. Responder and dispatcher actions work only in the same tab and do not reach other users.

Within one tab, the demo UI reads the same reducer state, which ensures that:

- Visible status panels agree within that tab.
- The assigned responder category matches the emergency category.
- Map markers, route visibility, status badges, metrics, and timelines update together.
- Invalid state transitions are ignored.

Authentication validation and incident filtering are pure functions. This keeps form and table behavior consistent while allowing both to be tested without rendering the interface.

These rules must move server-side when real incident synchronization is added.

## 4. Mapping and location flow

The map is centred on Jalingo and displays sample facilities and response units. Demo incidents use a fixed position, search radius, and illustrative route.

Available response units are green, engaged or assigned units are red, and offline units are grey. The same status meaning appears in the map legend and adjacent operational information.

The current route line connects the response unit to the incident coordinates. Road-aware navigation can be connected through OSRM, Valhalla, GraphHopper, Mapbox Directions, or Google Routes.

Device location support should account for:

- Permission granted, rejected, or unavailable.
- Coordinate accuracy and collection time.
- Poor GPS reception and stale positions.
- Background location restrictions.
- Battery and mobile-data consumption.
- Secure location retention and deletion.

## 5. Accessibility and user experience

The application includes these accessibility foundations:

- Native buttons for all interactions.
- Visible keyboard focus indicators.
- `aria-pressed` for selected role, emergency, and duty-state controls.
- A polite live region that announces incident-status changes.
- Text labels alongside critical icons.
- Mobile-sized touch targets.
- Status text in addition to color.
- `prefers-reduced-motion` support.
- A semantic label for the response-unit table.
- Inline form errors connected to their fields with `aria-describedby`.
- Mobile incident cards that preserve every table label without horizontal page overflow.

Important map information is repeated in adjacent text panels so emergency progress does not depend on seeing a marker.

## 6. Project structure

```text
geo-app/
├── index.html                 Browser entry document
├── package.json               Dependencies and scripts
├── vite.config.ts             Vite React configuration
├── vercel.json                Direct-link rewrites for role routes
├── api/auth.ts                Vercel authentication function
├── server/auth.ts             Turso queries, schema, password hashing
├── server/dev.ts              Local API server for Vite proxy
├── scripts/create-staff.ts    Staff account creation command
├── tsconfig*.json             Browser and tool TypeScript settings
├── eslint.config.js           Static-analysis rules
├── TECHNOLOGY_GUIDE.md        System technology documentation
└── src/
    ├── main.tsx               React startup and global CSS imports
    ├── App.tsx                Role views, map, and user interactions
    ├── data.ts                Facilities, responders, coordinates, and copy
    ├── state.ts               Incident reducer and transition rules
    ├── state.test.ts          Workflow state test
    ├── validation.ts          Authentication validation and incident filtering
    ├── validation.test.ts     Validation and filtering tests
    ├── styles.css             Visual system and responsive layouts
    ├── types.ts               Domain types
    └── vite-env.d.ts          Vite browser type declarations
```

The structure separates domain state, system data, visual styles, and interface behavior while avoiding unnecessary layers.

## 7. Running locally

Requirements:

- A current Node.js installation.
- npm.
- Internet access for OpenStreetMap tiles.

From the `geo-app` directory:

```bash
npm install
npm run dev:api
# in another terminal:
npm run dev
```

Vite prints the local application address, commonly `http://localhost:5173`. See `README.md` for Turso and Vercel setup.

## 8. Service integrations

The following infrastructure completes the full emergency network:

- Account identity, role-based screen access, sessions, and a hosted SQLite-compatible database are implemented.
- Operational audit logs and authoritative server-side incident permissions remain future work.
- Device geolocation with accuracy and failure handling.
- PostgreSQL with PostGIS for nearest-unit searches.
- WebSocket communication for incident and responder updates.
- Firebase Cloud Messaging or native push services for background alerts.
- Road-aware routing and navigation handoff.
- Retry, offline, poor-network, and duplicate-request handling.
- Encryption, abuse prevention, rate limiting, monitoring, backups, and disaster recovery.
- Privacy, data-retention, and emergency-service operating agreements.

The current component boundaries and shared incident model provide clear integration points for these services.
