# Vesper

Vesper is a premium, free QR studio. Anyone can open the site, pick a QR type, fill in fields, style the code, and download PNG or SVG immediately. There is no account, no sign-in, no email gate, and no subscription. Static codes are generated entirely in the browser. Dynamic (editable) codes are anonymous: creating one returns a public short slug and a secret edit token.

## Requirements

- Node.js 20 or newer (see `.nvmrc`)

## Develop

```bash
npm install && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8787 (proxied under `/api`)

## Production

```bash
npm run build && PUBLIC_BASE_URL=https://your.domain npm start
```

Serves the SPA and API on `PORT` (default `8787`).

## Configuration

### Backend env

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | HTTP port |
| `PUBLIC_BASE_URL` | `http://localhost:5173` in dev; **required in production** | Origin used to build `publicUrl` and `editUrl` |
| `DATA_DIR` | `backend/data` | DB + uploads |
| `TRUST_PROXY` | `false` | If `true`, client IP = first `X-Forwarded-For` entry |
| `IP_SALT` | auto | Persisted to `DATA_DIR/ip_salt` on first boot if unset |

### Frontend

Set your Buy Me a Coffee username in `frontend/src/config.ts` (`BMC_USERNAME`).

To rename the product, change `APP_NAME` in both `frontend/src/config.ts` and `backend/src/config.ts`, and the title in `frontend/index.html`.

### Phone testing in dev

Set `PUBLIC_BASE_URL` to your LAN URL (for example `http://192.168.1.20:5173`) so scanned codes open the right host.

## Data

- SQLite database: `backend/data/vesper.db`
- Uploads: `backend/data/uploads/`
- Back up by copying `backend/data/`
- Take down an abusive code (no admin UI in v1):

```sql
UPDATE codes SET disabled_reason='abuse' WHERE slug='…';
```

## Scripts

- `npm run dev` — API + Vite
- `npm run build` — compile backend + frontend
- `npm start` — production server
- `npm test` — vitest in both packages
- `npm run typecheck` — TypeScript strict check

## Decisions

- Resolver is an SPA route (`/r/:slug`); the backend returns JSON only (no HTML 302). Documented and locked in the build spec.
- API key second secret is named `manageToken` (not `editToken`) to avoid confusion with code edit tokens.
- PNG frame text relies on embedded `@font-face` woff2 data URLs inside composed SVGs; if a browser fails to rasterize the font, canvas `fillText` after `document.fonts.ready` is the intended fallback (Chromium/Firefox should render the embedded face).
- Legal pages are short original drafts — mark reviewed for your jurisdiction before launch (`content/legal.tsx`).
- `BMC_USERNAME` defaults to `vesper` as a placeholder; change before launch.
- Vite `?inline` imports are used for frame font woff2 files so SVG/PNG exports stay self-contained offline.
- Rate-limit middleware skips the small JSON body limit for multipart asset uploads; per-kind limits are enforced in the upload handler.
- My codes falls back to in-memory storage when `localStorage` is blocked (private mode).
