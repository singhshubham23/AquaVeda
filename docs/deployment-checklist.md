# AquaVeda Deployment Checklist

Use this checklist before promoting AquaVeda to staging or production.

## Required Environment

- `PORT`
- `MONGO_URI`
- `CLIENT_URL`
- `ALLOWED_ORIGINS`
- `JWT_SECRET`
- `JWT_EXPIRES`
- `REFRESH_TOKEN_EXPIRES`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX`

## Build Verification

- `client`: run `npm run build`
- `server`: verify the app starts cleanly with the target environment variables
- Confirm the MongoDB connection string points to the intended database
- Seed admin or expert users if the target environment needs sample roles

## Smoke Checks

- Register a new user
- Log in and confirm the `me` endpoint returns the current profile
- Log out and confirm the refresh token is cleared
- Load Explore and confirm issues render on the map
- Open a wiki article and confirm public, approved content is visible
- Open Dashboard and confirm user or admin data loads correctly
- Submit a comment and confirm it appears in the thread

## Operational Notes

- Ensure `ALLOWED_ORIGINS` includes the deployed client URL
- Keep `JWT_SECRET` unique per environment
- Keep password-reset email delivery wired to a real provider before public launch
- Store uploads and generated assets on persistent storage if the deployment uses containers

## Rollback

- Revert to the previous image or release artifact
- Restore the previous environment variables if the issue is configuration-related
- Re-run the build and smoke checks after rollback
