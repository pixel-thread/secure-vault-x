# Feature PRD: Secret Expiry & Password Rotation Notifications

**Version:** 1.1  
**Status:** In Progress  
**Last Updated:** 2026-03-15

---

## 1. Overview

Adds a **local notification reminder system** to SecureVaultX that monitors saved secrets for upcoming expiry dates or scheduled password rotation deadlines. When a reminder fires, the user receives an Expo local notification. Tapping it opens the app and navigates directly to the correct `ViewSecretScreen` for that item. The `ViewSecretScreen` also gains an **Auto-Rotate** section that displays the rotation or expiry schedule and lets users update it.

---

## 2. Goals

- Remind users to rotate passwords, renew cards, or renew identity documents before they expire.
- Support all secret types defined in `SECRET_TEMPLATES` with type-appropriate expiry and rotation fields.
- Store notification schedules in a dedicated local SQLite table (`notification_schedule`) — item IDs are stored unencrypted to support deep-link navigation without requiring vault decryption.
- Deliver notifications entirely locally via `expo-notifications` — no server required.
- Tapping any notification navigates the user to the correct `ViewSecretScreen` for that item.
- Surface the rotation/expiry schedule inside `ViewSecretScreen` as an **Auto-Rotate** section.
- Provide a **global notification toggle** in Settings that defaults to `on`. When turned off, all scheduled notifications are cancelled and no new ones are created until re-enabled.

---

## 3. Non-Goals

- Server-push notifications.
- Bulk rotation across multiple items at once.
- Automatic password generation and save on expiry (user must manually update the value).
- Notifications for `secure_note` and `crypto` types (no time-sensitive fields apply).

---

## 4. Secret Template — Expiry & Rotation Fields

Each secret type that supports time-sensitive data gets additional fields added to its encrypted payload. These fields are stored inside the encrypted blob (never plaintext) alongside existing fields. The `notification_schedule` table stores only the `item_id`, `item_type`, and the next fire timestamp — never the expiry value itself.

### 4.1 Field Additions per Template Type

#### `login` — Password Rotation

| New Field                | Type             | Description                                                        |
| ------------------------ | ---------------- | ------------------------------------------------------------------ |
| `rotation_interval_days` | `number \| null` | Rotation frequency in days (e.g. 90). Null = no rotation.          |
| `last_rotated_at`        | `number \| null` | Unix timestamp of last password change.                            |
| `next_rotation_at`       | `number \| null` | Computed: `last_rotated_at + (rotation_interval_days * 86400000)`. |

Notification fires 7 days before `next_rotation_at`, again at 4 days before, and finally on the day.

---

#### `card` — Card Expiry

| New Field            | Type     | Description                                                |
| -------------------- | -------- | ---------------------------------------------------------- |
| `expiry_date`        | `string` | Already exists in template (`MM/YY`). Used for scheduling. |
| `notify_days_before` | `number` | Days before expiry to send reminder. Default: 30.          |

Notification fires `notify_days_before` days before the first day of the expiry month.

---

#### `api_key` — Key Rotation

| New Field                | Type             | Description                                     |
| ------------------------ | ---------------- | ----------------------------------------------- |
| `rotation_interval_days` | `number \| null` | Rotation frequency in days. Null = no rotation. |
| `last_rotated_at`        | `number \| null` | Unix timestamp of last key rotation.            |
| `next_rotation_at`       | `number \| null` | Computed from last rotation + interval.         |
| `key_expires_at`         | `number \| null` | Hard expiry date if the provider sets one.      |

Notification fires 7 days before whichever of `next_rotation_at` or `key_expires_at` is sooner, and again at 4 days before.

---

#### `database` — Credential Rotation

| New Field                | Type             | Description                      |
| ------------------------ | ---------------- | -------------------------------- |
| `rotation_interval_days` | `number \| null` | Password rotation frequency.     |
| `last_rotated_at`        | `number \| null` | Unix timestamp of last rotation. |
| `next_rotation_at`       | `number \| null` | Computed.                        |

Same notification logic as `login`.

---

#### `identity` — Document Expiry

| New Field            | Type     | Description                                       |
| -------------------- | -------- | ------------------------------------------------- |
| `expiry_date`        | `string` | Already exists in template (`date` type).         |
| `notify_days_before` | `number` | Days before expiry to send reminder. Default: 60. |

Notification fires `notify_days_before` days before `expiry_date`, again 7 days before, and finally 4 days before.

---

#### `crypto` — No Change

Crypto wallets have no time-sensitive rotation requirement. No notification fields added.

---

#### `secure_note` — No Change

Secure notes have no expiry or rotation concept. No notification fields added.

---

### 4.2 Updated `SECRET_TEMPLATES` Fields Summary

```ts
// Rotation/expiry fields are added to the Zod schema for each type
// and included in the encrypted payload — never stored plaintext.

type RotationMeta = {
  rotation_interval_days: number | null;
  last_rotated_at: number | null;
  next_rotation_at: number | null;
};

type ExpiryMeta = {
  expiry_date: string | null; // ISO date string or MM/YY
  notify_days_before: number; // default varies by type
};

// login, api_key, database → RotationMeta
// card, identity           → ExpiryMeta
// crypto, secure_note      → no additions
```

---

## 5. Data Layer — `notification_schedule` Table

A new table is created inside `DBProvider` as part of the migration sequence. It is the only place where `item_id` appears outside of the encrypted vault blob — intentionally, because navigation on notification tap requires knowing the target item without vault decryption.

### 5.1 Schema

```sql
CREATE TABLE IF NOT EXISTS notification_schedule (
  id                TEXT PRIMARY KEY,         -- UUID for this schedule row
  item_id           TEXT NOT NULL,            -- Vault item ID (unencrypted — for navigation)
  item_type         TEXT NOT NULL,            -- 'login' | 'card' | 'api_key' | 'database' | 'identity'
  notification_type TEXT NOT NULL,            -- 'rotation' | 'expiry'
  scheduled_for     INTEGER NOT NULL,         -- Unix timestamp when notification should fire
  expo_notif_id     TEXT,                     -- Expo notification identifier (from scheduleNotificationAsync)
  fired_at          INTEGER,                  -- Unix timestamp when notification was actually sent
  dismissed_at      INTEGER,                  -- Unix timestamp when user dismissed or snoozed
  status            TEXT NOT NULL DEFAULT 'pending', -- 'pending' (internal tracking), 'fired', 'cancelled'
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

> [!NOTE]
> The `status` column is for **internal app tracking** and reconciliation. The actual notification delivery is handled by the **OS's notification system**. Once scheduled via `expo-notifications`, the OS will fire the notification even if the app is closed, force-quit, or the device is locked.

CREATE INDEX IF NOT EXISTS idx_notif_item_id ON notification_schedule(item_id);
CREATE INDEX IF NOT EXISTS idx_notif_scheduled ON notification_schedule(scheduled_for);
```

### 5.2 Why `item_id` is Unencrypted

`item_id` is a UUID with no semantic content — it reveals nothing about the user or the secret. Encrypting it would require decrypting the vault every time a notification tap arrives, which is not possible in cold-start scenarios. Storing `item_id` unencrypted is the correct trade-off.

### 5.3 `notification_schedule` Service

A `NotificationScheduleService` manages all reads and writes to this table. It is initialised inside `DBProvider` alongside `VaultService`.

```ts
class NotificationScheduleService {
  // Called after any secret is saved or updated
  async scheduleForItem(item: VaultItem): Promise<void>;

  // Cancel and delete all scheduled notifications for an item
  async cancelForItem(itemId: string): Promise<void>;

  // Called on app launch — reschedule any notifications whose expo_notif_id is stale
  async reconcile(): Promise<void>;

  // Mark a notification as fired
  async markFired(scheduleId: string): Promise<void>;

  // Fetch all upcoming schedules (for display in settings)
  async getUpcoming(): Promise<NotificationScheduleRow[]>;
}
```

---

## 6. Notification Scheduling Logic

### 6.1 When Scheduling Runs

Scheduling is triggered in these situations:

- When a secret is **created** — `NotificationScheduleService.scheduleForItem(item)` is called after `saveVaultItem` succeeds.
- When a secret is **updated** — existing future schedules for that `item_id` are cancelled (set status to `cancelled`) and rescheduled based on new values.
- When a secret is **deleted** — `cancelForItem(itemId)` is called after `deleteVaultItem` succeeds. This marks all associated schedules as `cancelled` and cancels any pending OS-level notifications.
- On **app launch** — `reconcile()` re-registers any schedule whose `expo_notif_id` has been cleared by the OS (e.g. after app reinstall or OS notification permission reset).

### 6.2 Scheduling Rules per Type

```
login / api_key / database (rotation):
  if next_rotation_at is set:
    schedule at next_rotation_at - 7 days  → "Rotation due in 7 days"
    schedule at next_rotation_at - 4 days  → "Rotation due in 4 days"
    schedule at next_rotation_at           → "Password rotation overdue"

card (expiry MM/YY):
  parse expiry to first day of that month
  schedule at expiry_date - notify_days_before days → "Card expiring soon"
  schedule at expiry_date - 7 days                  → "Card expiring in 7 days"
  schedule at expiry_date - 4 days                  → "Card expiring in 4 days"

identity (expiry date):
  schedule at expiry_date - notify_days_before days → "Document expiring soon"
  schedule at expiry_date - 7 days                  → "Document expiring in 7 days"
  schedule at expiry_date - 4 days                  → "Document expiring in 4 days"
```

### 6.3 Notification Content

```ts
// Notification payload — data field carries item_id and item_type for navigation
{
  title: "🔑 Password Rotation Due",           // varies by type and urgency
  body: "Your login for GitHub is due for rotation.",
  data: {
    item_id: "uuid-of-vault-item",             // unencrypted
    item_type: "login",                        // for screen routing
    action: "open_item",
  }
}
```

| Secret Type | Notification Title       | Body                                                |
| ----------- | ------------------------ | --------------------------------------------------- |
| `login`     | 🔑 Password Rotation Due | "Your login for {serviceName} is due for rotation." |
| `api_key`   | 🔑 API Key Rotation Due  | "Your API key for {serviceName} should be rotated." |
| `database`  | 🔑 Database Password Due | "Rotate the password for {dbName}."                 |
| `card`      | 💳 Card Expiring Soon    | "Your card ending {last4} expires {MM/YY}."         |
| `identity`  | 🪪 Document Expiring     | "Your {documentType} expires on {date}."            |

Note: `serviceName`, `dbName`, `last4`, and `documentType` are stored inside the encrypted blob and are **not** included in the `notification_schedule` table. The notification body is composed from the decrypted payload when scheduling — it is baked into the Expo notification at schedule time.

---

## 7. Deep-Link Navigation on Notification Tap

When the user taps a notification, Expo's `addNotificationResponseReceivedListener` fires with the notification's `data` payload. The router reads `item_id` and `item_type` and navigates to the correct screen.

### 7.1 Notification Listener Setup

Registered inside the root layout or `DBProvider` after the DB is ready:

```ts
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { item_id, item_type, action } =
        response.notification.request.content.data;

      if (action === "open_item" && item_id) {
        router.push({
          pathname: "/secret/[id]",
          params: { id: item_id, type: item_type },
        });
      }
    },
  );

  return () => subscription.remove();
}, []);
```

### 7.2 Navigation Target

| `item_type` | Route         | Screen                                 |
| ----------- | ------------- | -------------------------------------- |
| `login`     | `/secret/[id]` | `ViewSecretScreen` (login template)    |
| `card`      | `/vault/[id]` | `ViewSecretScreen` (card template)     |
| `api_key`   | `/vault/[id]` | `ViewSecretScreen` (API key template)  |
| `database`  | `/vault/[id]` | `ViewSecretScreen` (database template) |
| `identity`  | `/vault/[id]` | `ViewSecretScreen` (identity template) |

The `ViewSecretScreen` receives `item_id`, fetches the item from local SQLite, decrypts it, and renders the appropriate template — including the new **Auto-Rotate** section.

---

## 8. `ViewSecretScreen` — Auto-Rotate Section

A new **Auto-Rotate** collapsible section is added to the bottom of `ViewSecretScreen` for all secret types that support rotation or expiry. It is shown below the existing read-only fields and above the Delete button.

### 8.1 Section Anatomy

```
┌─────────────────────────────────────────────────────────┐
│  AUTO-ROTATE                                     [edit]  │
├─────────────────────────────────────────────────────────┤
│  Rotation Interval       Every 90 days                   │
│  Last Rotated            March 1, 2026                   │
│  Next Rotation Due       May 30, 2026        ⚠ 7 days  │
├─────────────────────────────────────────────────────────┤
│  [  Mark as Rotated Now  ]                               │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Fields by Secret Type

**`login`, `api_key`, `database` — Rotation view:**

| Field             | Display                                                   |
| ----------------- | --------------------------------------------------------- |
| Rotation Interval | "Every N days" or "Not set"                               |
| Last Rotated      | Human-readable date or "Never"                            |
| Next Rotation Due | Human-readable date + urgency badge (green / amber / red) |

**`card` — Expiry view:**

| Field             | Display                 |
| ----------------- | ----------------------- |
| Card Expires      | MM/YYYY                 |
| Days Until Expiry | Countdown badge         |
| Notify Before     | "30 days before expiry" |

**`identity` — Document expiry view:**

| Field             | Display                 |
| ----------------- | ----------------------- |
| Document Expires  | Human-readable date     |
| Days Until Expiry | Countdown badge         |
| Notify Before     | "60 days before expiry" |

### 8.3 Urgency Badge Logic

| Days Remaining | Badge Colour  | Label           |
| -------------- | ------------- | --------------- |
| > 30           | Green         | "On schedule"   |
| 8 – 30         | Amber         | "Due soon"      |
| 1 – 7          | Red           | "Due this week" |
| 0 or overdue   | Red + pulsing | "Overdue"       |

### 8.4 "Mark as Rotated Now" Action

For rotation types (`login`, `api_key`, `database`), a **Mark as Rotated Now** button is shown. Tapping it:

1. Sets `last_rotated_at = Date.now()`.
2. Recomputes `next_rotation_at = now + (rotation_interval_days * 86400000)`.
3. Calls `updateVaultItem` to re-encrypt and save.
4. Calls `NotificationScheduleService.cancelForItem` then `scheduleForItem` to reschedule notifications.
5. Shows a toast: `"Rotation logged. Next reminder set for {date}."`.

### 8.5 Editing the Rotation Schedule

Tapping the `[edit]` button in the Auto-Rotate section header enters inline edit mode for that section only. The user can change:

- **Rotation interval** (days selector for rotation types)
- **Notify days before** (for expiry types)

On save, `updateVaultItem` is called and notifications are rescheduled. The Save button follows the same `isDirty` pattern — only visible when a value has changed.

---

## 9. Permissions

`expo-notifications` requires the user to grant notification permissions on first use. Permission is requested the first time the user saves a secret that has a rotation or expiry field populated.

```ts
const { status } = await Notifications.requestPermissionsAsync();
if (status !== "granted") {
  toast.info("Enable notifications to receive rotation reminders.");
  // Scheduling is skipped silently — no crash, no forced prompt
}
```

Permission state is stored in `sync_meta` under key `notifications_permission_status` so the prompt is not shown again if already denied.

---

## 10. Settings — Notification Toggle

A global toggle for rotation and expiry notifications is added to the **Settings screen** under a **Notifications** section. It defaults to `on` on first install.

### 10.1 UI

```
┌─────────────────────────────────────────────────────────┐
│  NOTIFICATIONS                                           │
├─────────────────────────────────────────────────────────┤
│  Rotation & Expiry Reminders               [ ●──── ]    │
│  Get notified before passwords, cards,                   │
│  and documents expire or need rotating.                  │
└─────────────────────────────────────────────────────────┘
```

The toggle uses React Native's `Switch` component (or a styled equivalent) with the emerald active colour consistent with the rest of the app. The description subtitle is always visible beneath the label.

### 10.2 Persistence

The toggle state is stored in `sync_meta` under key `notifications_enabled`. It is read synchronously from the local DB on settings screen mount.

| Key                     | Default value | Type                  |
| ----------------------- | ------------- | --------------------- |
| `notifications_enabled` | `"true"`      | `"true"` \| `"false"` |

```ts
// Read on mount
const enabled = (await syncMeta.get("notifications_enabled")) ?? "true";

// Write on toggle
await syncMeta.set("notifications_enabled", value ? "true" : "false");
```

### 10.3 Toggle Behaviour

**Turning OFF (`true` → `false`):**

1. Set `notifications_enabled = "false"` in `sync_meta`.
2. Call `NotificationScheduleService.cancelAll()` — cancels every pending Expo notification and clears all `expo_notif_id` values in `notification_schedule` (rows are kept so schedules can be restored).
3. Show a toast: `"Rotation reminders turned off."`.

**Turning ON (`false` → `true`):**

1. Set `notifications_enabled = "true"` in `sync_meta`.
2. Re-request OS notification permission if not already granted.
3. Call `NotificationScheduleService.reconcile()` — re-registers all existing schedule rows that have a future `scheduled_for` timestamp and a null `expo_notif_id`.
4. Show a toast: `"Rotation reminders turned on."`.

### 10.4 Guard in `scheduleForItem`

Every call to `scheduleForItem` must check the toggle before scheduling:

```ts
async scheduleForItem(item: VaultItem): Promise<void> {
  const enabled = await syncMeta.get('notifications_enabled') ?? 'true';
  if (enabled !== 'true') return; // silently skip
  // ... rest of scheduling logic
}
```

### 10.5 `cancelAll` Method (New)

Added to `NotificationScheduleService`:

```ts
/** Cancel every pending notification and clear their expo_notif_id. */
async cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await this.db
    .update(schema.notificationSchedule)
    .set({ expo_notif_id: null, updated_at: Date.now() })
    .where(isNull(schema.notificationSchedule.fired_at));

  logger.info('[NotificationScheduleService] All notifications cancelled');
}
```

### 10.6 Interaction with OS Permission State

| OS Permission | Toggle State | Effective Behaviour                                                                                                                          |
| ------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Granted       | On           | Notifications fire normally                                                                                                                  |
| Granted       | Off          | No notifications — all cancelled                                                                                                             |
| Denied        | On           | Scheduling skipped silently; toggle shows on but a warning subtitle appears: "Enable notifications in system settings to receive reminders." |
| Denied        | Off          | No notifications — consistent                                                                                                                |

When OS permission is denied and the toggle is `on`, the Settings row shows an additional inline warning:

```
┌─────────────────────────────────────────────────────────┐
│  Rotation & Expiry Reminders               [ ●──── ]    │
│  ⚠ Notifications are disabled in system settings.       │
│  Tap to open settings.                                   │
└─────────────────────────────────────────────────────────┘
```

Tapping the warning row calls `Linking.openSettings()` to take the user to the app's system notification settings.

---

## 11. `DBProvider` Integration

The `notification_schedule` table is created during the same migration pass as all other tables. `NotificationScheduleService` is initialised inside `DBProvider` alongside `VaultService` and exposed via context.

```ts
export function DBProvider({ children }) {
  useEffect(() => {
    async function init() {
      const db = await openDatabase("app.db");
      await runPendingMigrations(db); // creates notification_schedule table
      initPrismaClient(db);
      initVaultService(db);
      initNotificationScheduleService(db); // new
      registerNotificationResponseListener(); // deep-link handler
      setReady(true);
    }
    init();
  }, []);
  // ...
}
```

---

## 12. Execution Workflow

### 1. Code Review (`code-reviewer.md`)

Before merging, verify:

- **`item_id` unencrypted rationale is documented:** Confirm no other PII or secret value is stored in `notification_schedule`.
- **Notification body composition:** Confirm the human-readable body (service name, card digits, document type) is composed from the decrypted payload at schedule time — not stored in the schedule table.
- **`scheduleForItem` is idempotent:** Calling it twice for the same item must cancel old schedules before creating new ones — no duplicate notifications.
- **`scheduleForItem` toggle guard:** Confirm the `notifications_enabled` check is the first thing evaluated — no scheduling code runs if toggle is off.
- **`cancelAll` on toggle off:** Confirm it cancels all OS-level notifications via `Notifications.cancelAllScheduledNotificationsAsync()` and nulls `expo_notif_id` in the DB — rows must be preserved for restoration.
- **`reconcile()` on toggle on:** Confirm it only re-registers rows with a future `scheduled_for` and a null `expo_notif_id` — no duplicate scheduling.
- **Permission guard:** Scheduling must silently skip (not crash) if OS notification permission is denied. Toggle can remain `on` — the inline warning handles communication.
- **OS denied + toggle on warning:** Confirm the Settings row shows the system settings link when permission is denied regardless of toggle state.
- **`cancelForItem` on delete:** Confirm the delete mutation in `VaultService` also calls `NotificationScheduleService.cancelForItem`.
- **`reconcile()` on app launch:** Verify it is called inside `DBProvider.init()` after the DB is ready and before the UI renders.
- **Deep-link handler registered once:** Confirm the `addNotificationResponseReceivedListener` is only registered once and properly cleaned up.

### 2. Refactoring (`refactor-cleaner.md`)

- **`useNotificationSchedule` hook:** Expose `scheduleForItem`, `cancelForItem`, `cancelAll`, and `getUpcoming` from a hook rather than calling the service directly from form components.
- **`useNotificationToggle` hook:** Encapsulate reading and writing `notifications_enabled` from `sync_meta`, calling `cancelAll` or `reconcile` on change, and checking OS permission state — so the Settings screen component stays lean.
- **`computeNextRotation` utility:** Extract the timestamp arithmetic for `next_rotation_at` into a pure utility function shared between `NotificationScheduleService` and the `ViewSecretScreen` Auto-Rotate display.
- **`UrgencyBadge` component:** Extract the countdown + colour badge logic into a standalone presentational component reused across all template types in `ViewSecretScreen`.
- **`RotationSection` component:** The Auto-Rotate section in `ViewSecretScreen` should be its own component, receiving the decrypted rotation meta as props, keeping `ViewSecretScreen` lean.

### 3. Finalization (`simplified.md`)

Produce a `simplified.md` containing:

- `notification_schedule` migration SQL
- `NotificationScheduleService` implementation including `cancelAll` and updated `scheduleForItem` with toggle guard
- `scheduleForItem` logic with per-type scheduling rules
- `useNotificationToggle` hook
- Settings screen **Notifications** section with toggle + OS denied warning row
- Deep-link navigation handler
- `ViewSecretScreen` Auto-Rotate section (`RotationSection` component)
- `UrgencyBadge` component
- Summary of unencrypted `item_id` security decision

---

## 13. Acceptance Criteria

- [ ] `notification_schedule` table is created during `DBProvider` migration with correct schema and indexes.
- [ ] Creating a secret with rotation/expiry fields schedules the correct Expo local notifications.
- [ ] Updating a secret cancels old notifications and reschedules based on new values.
- [ ] Deleting a secret cancels all associated notifications via `cancelForItem`.
- [ ] `reconcile()` re-registers stale notifications on app launch.
- [ ] Tapping a notification opens the app and navigates to the correct `ViewSecretScreen` for that `item_id`.
- [ ] `ViewSecretScreen` displays the Auto-Rotate section for `login`, `card`, `api_key`, `database`, and `identity` types.
- [ ] Urgency badge displays correct colour and label based on days remaining.
- [ ] "Mark as Rotated Now" updates `last_rotated_at`, recomputes `next_rotation_at`, re-encrypts via `updateVaultItem`, and reschedules notifications.
- [ ] Inline edit of rotation interval or notify days triggers `isDirty`-gated Save, re-encrypts, and reschedules.
- [ ] No rotation or expiry value is stored in `notification_schedule` — only `item_id`, `item_type`, and fire timestamp.
- [ ] Scheduling silently skips without crash if notification permission is denied.
- [ ] `crypto` and `secure_note` types have no Auto-Rotate section and no notifications scheduled.
- [ ] Settings screen shows a **Notifications** section with a toggle defaulting to `on`.
- [ ] Toggle state is persisted in `sync_meta` under key `notifications_enabled`.
- [ ] Turning the toggle **off** calls `cancelAll()` — all OS notifications cancelled, `expo_notif_id` nulled in DB, rows preserved.
- [ ] Turning the toggle **on** calls `reconcile()` — all future schedule rows re-registered with Expo.
- [ ] `scheduleForItem` is a no-op when `notifications_enabled === "false"`.
- [ ] When OS notification permission is denied and toggle is `on`, the Settings row shows a "disabled in system settings" warning with a link to `Linking.openSettings()`.

---

## 14. Out of Scope

- Server-push or remote notifications.
- Automatic password rotation (system changes the credential — user must do this manually).
- Bulk notification management UI.
- Per-item notification toggle (global toggle only in this version).
- `file` type (commented out in `SECRET_TEMPLATES`).
- Snooze / defer notification action (future roadmap).
