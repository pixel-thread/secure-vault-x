# PRD: Local-First Sync with Expo SQLite + Prisma (Mobile)

## Overview

Implement a **local-first data layer** using **Expo SQLite** with **Prisma ORM** that allows the app to function offline and automatically sync with the backend when connectivity is available.

Synchronization is based on **`updated_at` timestamps**. The system will only update records when a newer timestamp exists.

The system also supports **automatic database migrations**, ensuring that any new migration files are executed locally if they have not yet been applied.

---

# Goals

- Enable **offline-first application behavior**
- Maintain **data consistency between local SQLite and server database**
- Ensure **minimal sync operations** by comparing timestamps
- Support **bidirectional sync (local → server, server → local)**
- Automatically **run pending migrations on app startup**

---

# Non-Goals

- Real-time collaborative editing
- Complex merge strategies beyond timestamp resolution
- Multi-device CRDT or operational transforms

---

# Architecture

## Local Database

- Database: **Expo SQLite**
- ORM: **Drizzle ORM** (sync with the web schema.prisma and ony vault data)
- Storage: device-local SQLite database
- Schema mirrors server schema.

## DBProvider

All database initialization and migration logic is encapsulated in a single **`DBProvider`** component. This is the single entry point for the database lifecycle — no other part of the app opens the SQLite connection or runs migrations directly.

`DBProvider` is mounted at the root of the app and completes the following before rendering children:

```
<DBProvider>
  └── opens SQLite connection
  └── runs pending migrations
  └── initializes Prisma Client
  └── exposes db context to the app
  └── renders children only when DB is ready
</DBProvider>
```

Pseudocode:

```ts
export function DBProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const db = await openDatabase("app.db");
      await runPendingMigrations(db);
      initPrismaClient(db);
      setReady(true);
    }
    init();
  }, []);

  if (!ready) return <SplashScreen />;
  return <DBContext.Provider value={db}>{children}</DBContext.Provider>;
}
```

---

# Database Migration System

## Overview

The app must **automatically detect and run pending migrations** when it starts.

This ensures the local database schema is always compatible with the current application version.

---

## Migration Storage

Migrations are stored in the application bundle.

Example structure:

```
/libs/db
        /migrations
            0001_init.sql
            0002_add_notes_table.sql
            0003_add_deleted_at.sql
```

---

## Migration Tracking Table

Create a table to track applied migrations.

```ts
migrations;
```

Schema:

```
id: text primary key
executed_at: integer
```

Example record:

```
0001_init
0002_add_notes_table
```

---

## Migration Execution Flow

On app startup:

```
1. Initialize SQLite connection
2. Read migration files from /db/migrations
3. Check migrations table
4. Identify migrations not yet executed
5. Run missing migrations in order
6. Record each migration after success
```

Pseudocode:

```
for migration in sorted(migration_files):
    if migration.id not in migrations_table:
        run migration.sql
        insert into migrations (id, executed_at)
```

---

## Startup Flow

All DB steps are handled inside `DBProvider`. Sync runs asynchronously after the app is interactive.

```
App Start
   ↓
DBProvider mounts
   ├── Open SQLite DB
   ├── Run pending migrations
   └── Initialize Prisma Client
   ↓
App renders (UI is immediately usable)
   ↓
Background SyncService starts (non-blocking)
   ├── Load last_synced_at from sync_meta
   ├── Pull new changes from server (since last_synced_at)
   └── Push local changes to server
```

---

# Required Fields for Sync Tables

Every syncable table must include:

```
id: string
created_at: number
updated_at: number
deleted_at?: number | null
```

---

# Field Definitions

| Field        | Description               |
| ------------ | ------------------------- |
| `id`         | Unique identifier (UUID)  |
| `created_at` | Record creation timestamp |
| `updated_at` | Last update timestamp     |
| `deleted_at` | Soft delete timestamp     |

---

# Sync Strategy

Sync is **timestamp-based delta sync** — only records with an `updated_at` newer than `last_synced_at` are ever transferred in either direction. Full-table scans never occur.

---

# Data Access

**All data reads come exclusively from the local SQLite database.** The app never queries the server for display purposes.

```
UI → reads from local SQLite (via Prisma)
SyncService → silently updates SQLite in the background
UI → reactively reflects changes as SQLite updates
```

This guarantees:

- **Instant reads** — no network latency on any screen
- **Full offline functionality** — the app is usable regardless of connectivity
- **No loading spinners** for data already synced locally

The server is only ever contacted by `SyncService` for push/pull operations, never by the UI layer directly.

---

# Server → Local

Fetch **only records updated after the last sync**.

```
GET /api/sync?since=<last_synced_at>
```

Server query (Prisma):

```ts
const changes = await prisma.note.findMany({
  where: { updated_at: { gt: since } },
});
```

Client applies only when the server record is newer:

```
if server.updated_at > local.updated_at:
    upsert local record
else:
    ignore
```

After a successful pull, update `last_synced_at = now()` in `sync_meta`.

---

# Local → Server

Push **only records modified since the last sync**.

```
POST /api/sync/push
```

Client query before pushing:

```ts
const localChanges = await prisma.note.findMany({
  where: { updated_at: { gt: lastSyncedAt } },
});
```

Payload example:

```json
{
  "changes": [
    {
      "id": "uuid",
      "updated_at": 1710000000,
      "data": {}
    }
  ]
}
```

Server logic (Next.js Route Handler + Prisma):

```ts
// app/api/sync/push/route.ts
export async function POST(req: Request) {
  const { changes } = await req.json();
  for (const change of changes) {
    const existing = await prisma.record.findUnique({
      where: { id: change.id },
    });
    if (!existing || change.updated_at > existing.updated_at) {
      await prisma.record.upsert({
        where: { id: change.id },
        update: { ...change.data, updated_at: change.updated_at },
        create: {
          id: change.id,
          ...change.data,
          updated_at: change.updated_at,
        },
      });
    }
  }
  return Response.json({ success: true });
}
```

---

# Conflict Resolution

Strategy: **Last Write Wins (LWW)**

Rule:

```
newer updated_at wins
```

Example:

| Local | Server | Result      |
| ----- | ------ | ----------- |
| 100   | 200    | server wins |
| 300   | 200    | local wins  |

---

# Sync Triggers

All sync runs **asynchronously in the background** and never blocks or interrupts the user. The UI renders immediately from local SQLite — sync updates are applied silently once complete.

Sync is triggered when:

1. **App launch** — fires after `DBProvider` is ready, non-blocking
2. **App foreground** — re-fires when the app returns from background
3. **Network reconnect** — fires when connectivity is restored after being offline
4. **Manual refresh** — user-initiated pull-to-refresh
5. **Periodic interval** — optional, e.g. every 30 seconds while app is active and the app or is open when it not it should only run once every 5 minutes

Background sync contract:

```
SyncService.run() is always fire-and-forget
- never awaited by the UI
- errors are caught and logged, never surfaced as crashes
- UI state is updated reactively when local DB changes
```

Pseudocode:

```ts
// Non-blocking — called after DBProvider is ready
SyncService.run().catch(console.error);
```

---

# Sync State Tracking

Local metadata table:

```
sync_meta
```

Schema:

```
key: string
value: string
```

Example:

```
last_synced_at = 1710000000
```

---

# Example Table

```
notes
```

Schema example:

```
id: text primary key
title: text
content: text
created_at: integer
updated_at: integer
deleted_at: integer
```

Prisma schema equivalent:

```prisma
model Note {
  id         String  @id
  title      String
  content    String
  created_at Int
  updated_at Int
  deleted_at Int?
}
```

---

# Example Sync Flow

### Create Record Offline

```
local.updated_at = now()
insert into sqlite
```

### Sync Up

```
push record to /api/sync/push
server (Next.js + Prisma) compares timestamps
server upserts record
```

### Sync Down

```
GET /api/sync?since=last_synced_at
server returns newer records
client updates SQLite
```

---

# Edge Cases

### Device Offline

- Writes always succeed locally
- Sync queued until network available

### Simultaneous Updates

- Timestamp resolution applies

### Deleted Records

Use **soft delete**

```
deleted_at != null
```

---

# Performance Considerations

- Sync only **changed records**
- Batch requests
- Use **indexed `updated_at` fields**
- Limit sync payload size

---

# Observability

Log:

- sync start
- records pushed
- records pulled
- conflicts resolved
- migrations executed

---

# Future Improvements

- Per-table sync cursors
- WebSocket live sync
- Partial field merge
- CRDT support
- Background sync workers
- Server-driven migrations

---

# Execution Workflow

### 1. Code Review (`code-reviewer.md`)

Before merging, verify:

- **DBProvider:** Confirm it is the sole place where SQLite is opened, migrations run, and Prisma is initialized. No other module may call these directly.
- **Delta Sync Correctness:** Both pull and push queries filter strictly by `updated_at > last_synced_at` — no full-table scans.
- **Background Safety:** `SyncService.run()` is always fire-and-forget; errors are caught internally and never propagate to the UI layer.
- **Prisma Schema Integrity:** All syncable models include `id`, `created_at`, `updated_at`, and optional `deleted_at`.
- **Route Handler Safety:** Next.js Route Handlers (`/api/sync/*`) validate session/auth tokens before processing payloads.
- **Input Sanitization:** Incoming `changes` payloads are validated via Zod before reaching Prisma.
- **Soft Delete Handling:** `deleted_at` is respected — records are never hard-deleted during sync.

### 2. Refactoring (`refactor-cleaner.md`)

- **DBProvider as single source of truth:** Remove any direct SQLite or Prisma initialization outside of `DBProvider`.
- **SyncService isolation:** All push/pull/timestamp logic lives in `SyncService` — Route Handlers and UI components call it; they do not implement it.
- **Prisma Client Singleton:** One instance, initialized inside `DBProvider`, shared via context.
- **DTOs:** Standardize the `SyncChange` type across mobile client and Next.js API.
- **last_synced_at hygiene:** Only update `last_synced_at` after both push and pull succeed in the same cycle.

### 3. Finalization (`simplified.md`)

Produce a `simplified.md` containing:

- `DBProvider` implementation (SQLite open + migration runner + Prisma init)
- Final Next.js Route Handlers for `GET /api/sync` and `POST /api/sync/push`
- `SyncService` implementation with delta filtering and background fire-and-forget pattern
- Prisma schema for all syncable models
- Summary of LWW conflict resolution decisions

---

# Acceptance Criteria

- App works fully offline; UI never waits on sync to render
- `DBProvider` is the sole entry point for DB initialization and migrations
- Sync runs entirely in the background without blocking or interrupting the user
- Only records with `updated_at > last_synced_at` are pushed or pulled (no full scans)
- Local changes sync when network returns
- No duplicate records
- Timestamp conflict resolution (LWW) works correctly
- Pending migrations run automatically inside `DBProvider`
- Database always matches latest schema
- Sync completes under **2 seconds for 500 records**

---

# Tech Stack

| Layer               | Technology               |
| ------------------- | ------------------------ |
| Local DB            | Expo SQLite              |
| ORM                 | Prisma ORM (Web/Edge)    |
| Migrations          | SQL migration files      |
| Backend             | Next.js (Route Handlers) |
| Sync API            | REST                     |
| Conflict Resolution | Timestamp (LWW)          |
