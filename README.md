# RapidAid

React/Vite emergency response demo with real account storage. Incident activity, maps, metrics, and history are sample data and do not sync between users.

## Local development

Requires Node 22+, npm, and a Turso database for deployment. Without Turso environment variables, the API uses an ignored `local.db` file for local development.

```bash
npm install
npm run dev:api # terminal 1, port 3001
npm run dev     # terminal 2, Vite
```

Open the Vite URL and register a citizen account. Public registration cannot create staff accounts. To create one locally:

```bash
npm run staff:create -- admin
npm run staff:create -- responder
```

The command prompts for name, phone, and password. Each staff account needs a phone number that is not already registered, including as a citizen or another staff role. To create staff in Turso, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the command's environment first. Never put these credentials in `VITE_` variables, which are exposed to the browser.

## Vercel deployment

1. Connect the repository to Vercel as a Vite project. Keep the build command `npm run build` and output directory `dist`.
2. Add a Turso database through the Vercel Marketplace. Make `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` available to the project in Production (and in Preview if preview login is needed). Use a separate preview database to avoid test accounts in production.
3. Deploy, then run `npm run staff:create -- admin` locally with the production Turso credentials to create the first admin. Create responder accounts the same way.

Routes: `/login`, `/register`, `/` (citizen), `/responder`, `/admin`. The API is `/api/auth`: `GET` returns the current user; `POST` accepts `action` values `register`, `login`, or `logout`. Registration and login send `{ action, values: { fullName, phone, password, confirmPassword } }`. Sessions use an HTTP-only cookie.

Run `npm run check` before deployment. The Turso database stores accounts and sessions; `local.db` is excluded from Git because it contains private, changing data and cannot persist writes on Vercel.
