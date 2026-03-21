

# Feature PRD: Update Password Form

**Version:** 1.1  
**Status:** In Progress  
**Last Updated:** 2026-03-15

---

## Overview

Adds **inline edit capability** to the existing **`VaultItemDialog`** component. The dialog currently shows a read-only view of a vault item with a Delete button. This feature adds an **Edit button** (pencil icon) in the dialog header. Tapping it switches the dialog into edit mode, rendering the **`AddPasswordForm`** pre-filled with the selected item's decrypted values. The Save button on the form is only visible when the user has changed at least one field. On save, `VaultService.updateVaultItem` updates the record in local SQLite by `id`, and a background sync is triggered.

---

## Context: Existing Codebase

| File                  | Role                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------- |
| `VaultItemDialog.tsx` | Modal that displays a vault item read-only + handles delete                            |
| `AddPasswordForm.tsx` | Create form — `react-hook-form` + Zod + `useMutation`                                  |
| `VaultService.ts`     | Drizzle ORM local DB service — has `saveVaultItem`, `deleteVaultItem`, `getVaultItems` |
| `useVaultService`     | Hook providing the `VaultService` instance                                             |
| `useSyncService`      | Hook providing the `SyncService` instance                                              |

---

## User Requirements

- The dialog opens in **read-only view mode** (current behaviour, unchanged).
- A **pencil (Edit) icon button** is added to the dialog header, next to the existing close button.
- Tapping Edit **switches the dialog body** from the read-only field display to the `AddPasswordForm` pre-filled with the item's current values.
- The **Save button is hidden** until the user modifies at least one field (`isDirty === true`).
- If the user opens edit mode but makes no changes, a **Cancel** option returns to the read-only view — no Save shown.
- On Save, the record is re-encrypted and updated in local SQLite by `id`.
- A **background sync fires** after a successful save (fire-and-forget).

---

## Component Changes: `VaultItemDialog`

### New Local State

```ts
const [isEditing, setIsEditing] = useState(false);
```

Reset `isEditing` to `false` whenever the dialog closes:

```ts
const handleClose = () => {
  setIsEditing(false);
  onValueChange(false);
};
```

### Header: Add Edit Button

Add the pencil button to the existing header row, alongside the close button. Only shown for `password` type items (card editing is out of scope).

```tsx
<View className="mb-6 flex-row items-center justify-between">
  <Text className="text-2xl font-bold capitalize text-zinc-900 dark:text-white">
    {selectedSecret.serviceName}
  </Text>

  <View className="flex-row items-center gap-2">
    {/* Edit button — password type only */}
    {selectedSecret.type === "password" && !isEditing && (
      <TouchableOpacity
        onPress={() => setIsEditing(true)}
        className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-800/80"
      >
        <Ionicons name="pencil-outline" size={20} color="#10b981" />
      </TouchableOpacity>
    )}

    {/* Close button — unchanged */}
    <TouchableOpacity
      onPress={handleClose}
      className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-800/80"
    >
      <Ionicons
        name="close"
        size={24}
        color={isDarkMode ? "#a1a1aa" : "#71717a"}
      />
    </TouchableOpacity>
  </View>
</View>
```

### Body: Toggle Between Read-Only and Edit Form

Replace the existing `ScrollView` content block with a conditional:

```tsx
<ScrollView showsVerticalScrollIndicator={false} className="mb-2">
  {isEditing ? (
    <AddPasswordForm
      mode="edit"
      initialValues={{
        id: selectedSecret.id,
        serviceName: selectedSecret.serviceName,
        url: selectedSecret.website ?? "",
        username: selectedSecret.username ?? "",
        password: selectedSecret.secretInfo ?? "",
        note: selectedSecret.note ?? "",
      }}
      onSuccess={handleClose}
      onCancel={() => setIsEditing(false)}
    />
  ) : (
    <>
      {/* existing read-only field rows — unchanged */}
      {/* existing Delete button — unchanged */}
    </>
  )}
</ScrollView>
```

---

## Component Changes: `AddPasswordForm`

Minimal additions — only what is needed to support being rendered inside `VaultItemDialog`.

### New Props

```ts
type Props = {
  onSuccess?: () => void;
  onCancel?: () => void; // new — back to read-only
  mode?: "create" | "edit"; // new — default: 'create'
  initialValues?: PasswordFormValues & { id: string }; // new — required when mode = 'edit'
};
```

### `defaultValues` Seeded from `initialValues` in Edit Mode

`react-hook-form`'s `formState.isDirty` diffs current values against `defaultValues`. Seeding `defaultValues` from `initialValues` makes this work correctly with no extra logic.

```ts
useForm<PasswordFormValues>({
  resolver: zodResolver(passwordSchema),
  defaultValues:
    mode === "edit" && initialValues
      ? {
          serviceName: initialValues.serviceName,
          url: initialValues.url ?? "https://",
          username: initialValues.username,
          password: initialValues.password,
          note: initialValues.note ?? "",
        }
      : {
          serviceName: "",
          url: "https://",
          username: "",
          password: generatePassword(32),
          note: "",
        },
});
```

### Save / Cancel Button Swap

Replace the static Save button at the bottom of the form:

```tsx
{/* In edit mode: Save only when dirty, Cancel always */}
{mode === 'edit' ? (
  <View className="mt-4 gap-3">
    {isDirty && (
      <TouchableOpacity
        disabled={isPending}
        className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
        onPress={handleSubmit(onSubmitForm)}>
        <Ionicons name="save-outline" size={20} color="#022c22" />
        <Text className="ml-2 text-lg font-bold text-[#022c22]">
          {isPending ? 'Updating...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    )}
    <TouchableOpacity
      onPress={onCancel}
      className="w-full items-center py-3">
      <Text className="text-sm text-zinc-400">Cancel</Text>
    </TouchableOpacity>
  </View>
) : (
  // Existing create-mode Save to Vault button — unchanged
  <TouchableOpacity ...>...</TouchableOpacity>
)}
```

### Submit Handler: Route by Mode

```ts
const onSubmitForm: SubmitHandler<PasswordFormValues> = async (data) => {
  const mek = await DeviceStoreManager.getMek();
  if (!mek) {
    toast.error("Encryption Error", {
      description: "Master Encryption Key not found.",
    });
    return;
  }

  try {
    const { encryptedData, iv } = await encryptData(data, mek);

    if (mode === "edit" && initialValues?.id) {
      mutate({ id: initialValues.id, encryptedData, iv }); // → updateVaultItem
    } else {
      mutate({ id: Crypto.randomUUID(), encryptedData, iv }); // → saveVaultItem
    }
  } catch (err) {
    toast.error("Encryption Failed", {
      description: "Could not secure your data.",
    });
  }
};
```

### `useMutation`: Route to `updateVaultItem` in Edit Mode

```ts
const { mutate, isPending } = useMutation({
  mutationFn: async (data: SaveDTO) => {
    if (mode === "edit") {
      return await vaultService?.updateVaultItem(data); // new method
    }
    return await vaultService?.saveVaultItem(data); // existing
  },
  onSuccess: () => {
    const message =
      mode === "edit"
        ? "Password updated successfully"
        : "Password added successfully";
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["vault"] });
    onSuccess?.();

    if (syncService) {
      syncService
        .sync()
        .catch((err) =>
          logger.error("[AddPasswordForm] Background sync failed", {
            error: err,
          }),
        );
    }
  },
  onError: (error: any) => {
    toast.error("Failed to save secret", {
      description: error.message || "Please try again.",
    });
  },
});
```

---

## Service Changes: `VaultService`

### New Method: `updateVaultItem`

Added alongside `saveVaultItem`. Mirrors the same `WHERE id AND userId` IDOR protection already used in `deleteVaultItem`.

```ts
/**
 * Update an existing vault item by id.
 * Re-stores the encrypted blob and refreshes updatedAt.
 * userId is intentionally excluded from .set() to prevent IDOR.
 */
async updateVaultItem(input: unknown) {
  logger.info('Attempting to update vault item', { userId: !!this.userId });

  try {
    const data = VaultItemSchema.parse(input);

    const result = await this.db
      .update(schema.vault)
      .set({
        encryptedData: data.encryptedData,
        iv: data.iv,
        updatedAt: new Date(),
        // userId intentionally excluded — IDOR protection
      })
      .where(
        and(
          eq(schema.vault.id, data.id),
          eq(schema.vault.userId, this.userId) // user may only update their own records
        )
      );

    logger.info('Vault item updated successfully', { id: data.id });
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation failed for updateVaultItem', { errors: error.errors });
      throw new Error('Invalid vault data');
    }

    logger.error('Failed to update vault item', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

---

## Full Interaction Flow

```
User opens VaultItemDialog
   ↓
Dialog renders in read-only view (current behaviour)
   ↓
User taps pencil icon
   ↓
isEditing = true → AddPasswordForm renders pre-filled
   ↓
User edits a field → isDirty = true → Save button appears
   ↓
User taps Save
   ↓
encryptData(formValues, mek) → { encryptedData, iv }
   ↓
updateVaultItem({ id, encryptedData, iv })
   ↓
Drizzle UPDATE WHERE id AND userId → updatedAt = now()
   ↓
queryClient.invalidateQueries(['vault'])
   ↓
syncService.sync() fires in background
   ↓
Dialog closes → read-only view reset
```

---

## Execution Workflow

### 1. Code Review (`code-reviewer.md`)

Before merging, verify:

- **IDOR in `updateVaultItem`:** `WHERE` clause must include both `eq(schema.vault.id, data.id)` and `eq(schema.vault.userId, this.userId)` — same pattern as `deleteVaultItem`.
- **`userId` immutability:** `.set()` in `updateVaultItem` must never include `userId`.
- **`isDirty` gate:** Save button must not render when `isDirty === false`. Verify `defaultValues` are correctly seeded from `initialValues`.
- **Mode isolation:** `edit` path calls `updateVaultItem` only; `create` path calls `saveVaultItem` only.
- **`isEditing` reset on close:** `handleClose` must set `isEditing(false)` before calling `onValueChange(false)` — otherwise the dialog reopens in edit mode.
- **Card type guard:** Edit button must only appear for `type === 'password'` items.
- **No plaintext in logs:** Decrypted `initialValues` (password, username) must not appear in any `logger.*` call.

### 2. Refactoring (`refactor-cleaner.md`)

- **`usePasswordMutation` hook:** Extract the `useMutation` block from `AddPasswordForm` into a `usePasswordMutation(mode, vaultService, syncService)` hook.
- **`useEditMode` hook:** Extract `isEditing` / `setIsEditing` state and the edit/cancel button visibility logic into a standalone `useEditMode()` hook, callable from `VaultItemDialog`.
- **`VaultService` naming:** `saveVaultItem` is an upsert today — consider renaming to `createVaultItem` once `updateVaultItem` exists to avoid ambiguity.

### 3. Finalization (`simplified.md`)

Produce a `simplified.md` containing:

- Final `VaultItemDialog` with `isEditing` state and header edit button
- Final `AddPasswordForm` with `mode`, `initialValues`, `isDirty` Save/Cancel wiring
- Complete `updateVaultItem` method for `VaultService`
- `usePasswordMutation` hook
- Summary of IDOR protection decisions

---

## Acceptance Criteria

- [ ] Dialog opens in read-only view (current behaviour unchanged).
- [ ] Pencil icon is visible in the dialog header for `type === 'password'` items only.
- [ ] Tapping pencil renders `AddPasswordForm` pre-filled inside the dialog body.
- [ ] Save button is hidden until at least one field is changed (`isDirty === true`).
- [ ] Cancel returns to read-only view without saving.
- [ ] Save calls `updateVaultItem` with the correct `id` — never `saveVaultItem`.
- [ ] `updateVaultItem` uses `WHERE id AND userId` — no IDOR risk.
- [ ] `userId` is never in the Drizzle `.set()` call.
- [ ] `updatedAt` is refreshed on every successful update.
- [ ] `queryClient.invalidateQueries({ queryKey: ['vault'] })` fires on success.
- [ ] Background sync fires after save (fire-and-forget, never blocks UI).
- [ ] `isEditing` resets to `false` when the dialog closes.
- [ ] No decrypted field values appear in logs.

---

## Out of Scope

- Card entry editing (`type === 'card'` — separate PRD).
- Creating new password entries (`AddPasswordForm` create mode — unchanged).
- Deleting password entries (`deleteVaultItem` — unchanged).
- Conflict resolution for the same record edited on two devices simultaneously.
