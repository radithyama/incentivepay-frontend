# incentivepay-frontend

[![CI](https://github.com/radithyama/incentivepay-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/radithyama/incentivepay-frontend/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Ops dashboard for [IncentivePay](https://github.com/radithyama/incentivepay-platform) - React + Vite +
TypeScript. Part of a 5-repo system; see the
[platform repo](https://github.com/radithyama/incentivepay-platform) for the full architecture, the PRD, and
how to run everything together.

Deliberately thin (per the PRD - this is an internal ops tool, not a polished consumer app): four tabs, no
router, no state management library, just `fetch` + component state.

## What it does

- **Approvals** - the pending-disbursement queue, approve/reject as an `approver`
- **Bulk import** - upload a CSV, watch the Spring Batch job's audit summary (imported/skipped/failed, with
  reasons)
- **Rules** - create FLAT/PERCENTAGE/TIERED incentive rules as an `incentive-admin`
- **Ledger** - look up a participant's payout history

Every screen shows a role badge from the current Keycloak token, and every action is gated the same way the
backend gates it - the RBAC story is meant to be visible in the UI, not just enforced invisibly server-side
(log in as `viewer-demo` and the approve/reject buttons are still there, but the server returns 403).

## Quickstart

This is a frontend for a backend that doesn't exist standalone here - it needs `incentive-api`,
`ledger-service`, and Keycloak reachable. Two ways to run it:

### Against the full stack (recommended)

Use [`incentivepay-platform`](https://github.com/radithyama/incentivepay-platform)'s `docker-compose.yml`,
which builds this repo (as a sibling directory) along with everything else, wired together.

### Standalone dev server

```bash
npm install
cp .env.example .env   # then edit if your backend isn't on the default localhost ports
npm run dev
```

Opens on **http://localhost:5173**. Requires `incentive-api` (default `:8080`), `ledger-service` (default
`:8082`), and Keycloak (default `:8081`) already running and reachable - bring those up via
`incentivepay-incentive-api`'s and `incentivepay-ledger-service`'s own standalone `docker-compose.yml` files,
or the platform repo's full stack.

## Environment variables

See `.env.example`. All are `VITE_*`, which Vite inlines into the built JS bundle - see "Known
simplification" below for why that matters for one of them.

| Variable | Default | What |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | `incentive-api` |
| `VITE_LEDGER_BASE_URL` | `http://localhost:8082` | `ledger-service` |
| `VITE_KEYCLOAK_URL` | `http://localhost:8081` | Keycloak |
| `VITE_KEYCLOAK_REALM` | `incentivepay` | Realm name |
| `VITE_KEYCLOAK_CLIENT_ID` | `incentivepay-client` | Public client, PKCE-enabled |
| `VITE_HMAC_SECRET` | `dev-only-shared-secret-change-me` | See below |

## Building / linting

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```

CI runs `npm ci && npm run build` on every push/PR.

## Known simplification: HMAC secret in the browser

`incentive-api` requires an HMAC-SHA256 signature on every mutating request (see its README). This frontend
computes that signature client-side via the Web Crypto API (`src/api.ts`), using `VITE_HMAC_SECRET` - which
means the secret ships inside the built JS bundle, readable by anyone who opens dev tools. That's fine for a
local demo and explicitly documented rather than hidden; it is **not** how you'd do this in production. A
real deployment would either put a backend-for-frontend in between (it holds the secret, signs server-side,
the browser never sees it) or restrict HMAC-signed mutations to server-to-server integrations and have the
dashboard's writes go through a different, session-based path. See the platform repo's `AI_USAGE.md`/`BACKLOG.md`
for more on this tradeoff.

Multipart CSV uploads (the bulk-import tab) are *not* signed at all - `incentive-api` exempts that specific
path, since a whole-body-hash scheme doesn't fit a large file payload well.

## Repo layout

```
src/
  api.ts                    fetch wrapper: bearer token + HMAC signing for mutating requests
  keycloak.ts                Keycloak JS adapter init/role helpers
  types.ts                   TS types mirroring the backend DTOs
  App.tsx                     Login gate, tab nav, role badge
  components/
    ApprovalsPanel.tsx
    ImportPanel.tsx
    RulesPanel.tsx
    LedgerPanel.tsx
```

## License

MIT - see [LICENSE](LICENSE).
