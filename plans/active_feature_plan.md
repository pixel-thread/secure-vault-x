# Plan: App Version Download
**Status:** ACTIVE
**PRD Reference:** core_prd.md
**Model Used:** Gemini 3 Pro
**Last Updated:** 2026-03-23

## Overview
Implement an API route and service on the Next.js web backend to fetch the latest AppVersion record (specifically the APK download URL) from the database, and hook this up to the "Download App" button on the landing page.

## Tasks
- [ ] [SEC] Verify no sensitive data is exposed in the AppVersion API response.
- [ ] [DESIGN] AppVersionServices to fetch latest ACTIVE version for Android.
- [ ] [TEST] Write a simple functional API test.
- [ ] [IMPL] Implement `appVersion.service.ts`.
- [ ] [IMPL] Implement Next.js API route `/api/appVersion/latest/route.ts`.
- [ ] [IMPL] Connect landing page `Download App` button to the API route.
- [ ] [REVIEW] Security review gate.

## Architecture Changes
- **New Service:** `apps/web/src/services/appVersion/appVersion.service.ts`
  - `getLatestAppVersion(platform?: AppVersionPlatform)`: Queries Prisma for the latest `AppVersion` with status `ACTIVE`.
- **New API Route:** `apps/web/src/app/api/appVersion/latest/route.ts`
  - Exposes a GET endpoint `/api/appVersion/latest`. Queries the service and returns the `downloadUrl`.
- **Modify Landing Page:** `apps/web/src/app/page.tsx`
  - Add a client-side click handler to the `Download App` `<GlassButton>` that fetches the latest version and redirects the window to `downloadUrl`.

## Security Flags
> OWASP categories and Antigravity-specific threats identified:
> - A01: Broken Access Control (This endpoint is public by design, but only returns public APK links).
> - Rate Limiting: We should consider if this endpoint needs rate limiting.
> No secrets or PII are involved.

## Verification Plan

### Automated Tests
Currently, `apps/web` has functional tests. We could write a small functional test for this public endpoint, but the primary verification is manual testing the download flow.

### Manual Verification
1. Open the landing page at `http://localhost:3000`.
2. Click the "Download App" button.
3. Observe if an API request is made to `/api/appVersion/latest`.
4. The browser should receive the `downloadUrl` and attempt to navigate to it or trigger a download.
