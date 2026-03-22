# Implementation Plan: Notification & Password Rotation

**Status:** ACTIVE
**PRD Reference:** .agents/prd/features/notification-password-rotation.md
**Model Used:** Gemini 3 Pro
**Last Updated:** 2026-03-21

## Overview
Implement a local notification reminder system for SecureVaultX that monitors secrets for upcoming expiry dates or scheduled password rotation deadlines. Users interact via a global toggle, an Auto-Rotate configuration inside `ViewSecretScreen`, and deep-linked local notifications pushed through `expo-notifications`.

## Requirements
- Support scheduled local notifications based on secret expiry or rotation cycles.
- Rely entirely on local `expo-notifications` (no external push server).
- Retain deep-link routing functionality to open specific secrets on tap.
- Update rotation cycle metrics when the user updates the payload directly.
- Ensure strict adherence to zero-knowledge policies by abstracting all PII from the unencrypted storage.

## Architecture Changes
- New Drizzle table: `notification_schedule` safely holds `item_id` (UUID), `item_type`, and timestamps.
- New Service: `NotificationScheduleService` manages row persistence and Expo scheduling.
- New Context/Provider: `NotificationProvider` initializes the service and binds route listeners.
- Enhancements to `ViewSecretScreen` to display notification metadata visually (`RotationSection`).

## Implementation Steps

### Phase 1: Database & Background Logic (2 files)
1. **Create notification migration** (File: `apps/mobile/src/libs/database/schema.ts`)
   - Action: Define `notification_schedule` table including unencrypted `item_id`, `item_type`, `status`, and timestamps.
   - Why: Store scheduling capability while maintaining zero-knowledge of secret contents.
   - Dependencies: None
   - Risk: Medium — Ensure absolutely no sensitive secret value or PII is typed into the DB schema here.

2. **Create notification service** (File: `apps/mobile/src/services/NotificationScheduleService.ts`)
   - Action: Build class for `scheduleForItem()`, `cancelForItem()`, `cancelAll()`, and `reconcile()`.
   - Why: Centralize OS logic and database writes for notifications.
   - Dependencies: Step 1
   - Risk: High — Logic heavily interacts with external OS APIs, requiring strict idempotency and silent fallback on denied permissions.

### Phase 2: Providers & Connectivity (3 files)
3. **Build Notification Provider** (File: `apps/mobile/src/components/providers/notification/index.tsx`)
   - Action: Define `NotificationProvider` rendering `<NotificationContext.Provider>`. Include `addNotificationResponseReceivedListener` for routing exactly to `/secret/[id]`.
   - Why: Decouple routing and OS listeners from rendering tree logic.
   - Dependencies: Step 2
   - Risk: Low

4. **Prepare Notification Hooks** (Files: `apps/mobile/src/hooks/useNotificationSchedule.ts`, `apps/mobile/src/hooks/useNotificationToggle.ts`)
   - Action: Expose abstracted hooks for interacting with the service state and the `sync_meta` notification toggle.
   - Why: Ensure components can easily fetch or mutate schedules.
   - Dependencies: Step 3
   - Risk: Low

### Phase 3: Setup UI Infrastructure (3 files)
5. **Implement Settings Toggle** (File: `apps/mobile/src/components/screens/settings/index.tsx`)
   - Action: Provide a global toggle wired to `sync_meta` using `useNotificationToggle()`.
   - Why: The user must be able to halt reminders entirely at will.
   - Dependencies: Step 4
   - Risk: Low

6. **Create Rotation UI Components** (Files: `apps/mobile/src/components/screens/secret/RotationSection.tsx`, `apps/mobile/src/components/screens/secret/UrgencyBadge.tsx`)
   - Action: Design the visual `[edit]` states, next rotation dates, and green/amber/red warning indicators.
   - Why: Componentize the complexity out of the main screen.
   - Dependencies: None
   - Risk: Low

### Phase 4: Data Integration & Core Secret Screen (2 files)
7. **Integrate Rotation UI and Mark Logic** (File: `apps/mobile/src/components/screens/secret/ViewSecretScreen.tsx`)
   - Action: Append `RotationSection` logically. Add the "Mark as Rotated Now" handler to adjust `last_rotated_at` and execute `updateVaultItem()`.
   - Why: Fulfills the primary interactive loop for updating rotations.
   - Dependencies: Step 4, Step 6
   - Risk: Medium — Database updates must securely re-encrypt the entire secret structure.

8. **Automate Update Password Form Tracking** (File: `apps/mobile/src/components/screens/secret/update/index.tsx` or similar form)
   - Action: Adjust password save procedures: If the password field is explicitly changed, automatically push `last_rotated_at` = now, and trigger `scheduleForItem()`.
   - Why: User interaction naturally aligns rotation counters without dual manual inputs.
   - Dependencies: Step 4
   - Risk: Medium — Must ensure `scheduleForItem` removes old pending hooks so no duplicate Expo notifications fire.

### Phase 5: Complete Security Lifecycle
9. **Run Comprehensive Security Check**
   - Action: Execute `@agents/skills/security-reviewer.md` protocols across the newly implemented codebase, covering OWASP items, Drizzle schema, Expo notification payloads, and Context handlers.
   - Why: Enforce security validation systematically before closing the branch.
   - Dependencies: Steps 1-8
   - Risk: Low

## Testing Strategy
- **Unit Logic**: `NotificationScheduleService` parsing arithmetic (ensuring -7 and -4 dates align correctly relative to `next_rotation_at`).
- **Feature Check**: Re-encrypting payloads accurately triggers scheduling updates locally.
- **Deep Link Pathing**: Sending a mock OS push response accurately loads the DB entry unencrypted id and pushes the Expo Router dynamically.

## Risks & Mitigations
- **Risk**: User explicitly denies OS notification permissions.
  - Mitigation: Catch blocks and status checks within `scheduleForItem` guarantee no crashing loops. Warning surfaced via UI.
- **Risk**: Decryption leak.
  - Mitigation: `notification_schedule` table retains unencrypted ID identifiers only. All labels within the OS payload exist uniquely within that OS envelope and not on permanent local databases unencrypted.

## Success Criteria
- [ ] Schema added and `NotificationScheduleService` functions independently.
- [ ] `addNotificationResponseReceivedListener` routes perfectly inside `NotificationProvider`.
- [ ] Direct credential edits implicitly rotate the local schedule.
- [ ] OWASP zero-knowledge principles hold up to security-reviewer standards.
