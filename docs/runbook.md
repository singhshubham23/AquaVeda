# AquaVeda Runbook

This runbook covers local startup, common checks, and quick troubleshooting.

## Local Startup

### Server

```bash
cd server
npm install
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```

### Seed Data

```bash
cd server
npm run seed:users
```

## Useful Checks

- `GET /health` for a fast server health signal
- `GET /api/v1/auth/me` to confirm auth is working
- `GET /api/v1/issues/map` to confirm map-ready data is available
- `GET /api/v1/dashboard/user` or `GET /api/v1/dashboard/admin` for dashboard smoke checks

## Common Issues

- **401 on protected routes**: confirm the client is sending the access token and the token has not expired
- **Empty map**: seed issues or create one with coordinates
- **Dashboard blank for admin users**: confirm the account role is `ADMIN`
- **Password reset email not delivered**: the local implementation uses a mock email helper until a provider is configured
- **CORS failures**: confirm the deployed client origin is included in `ALLOWED_ORIGINS`

## Release Notes

- Rebuild the client after UI changes with `npm run build`
- Re-run smoke checks after any auth, issue, or dashboard change
- Update `docs/context.md`, `docs/logs.md`, and `docs/bugs.md` when shipping fixes or new behavior
