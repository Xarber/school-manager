// src/sync/backgroundSync.ts
import * as TaskManager from "expo-task-manager";
import * as BackgroundTask from "expo-background-task";
import { AppState } from "react-native";

const SYNC_TASK = "db-sync-task";
let inFlight: Promise<void> | null = null;

async function runSyncOnce() {
    // 1) Read pending local changes from SQLite/AsyncStorage queue
    // 2) Upload to your API
    // 3) Download remote changes since lastSyncToken
    // 4) Apply locally, update lastSyncToken
    // Keep it short + resumable.
}

export function syncNow() {
    if (inFlight) return inFlight;
    inFlight = runSyncOnce().finally(() => (inFlight = null));
    return inFlight;
}

export function startForegroundSync() {
  syncNow(); // initial

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") syncNow();
  });

  return () => sub.remove();
}

TaskManager.defineTask(SYNC_TASK, async () => {
    try {
        await runSyncOnce();
        return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

export async function ensureBackgroundSyncRegistered() {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SYNC_TASK);
    if (!isRegistered) {
        await BackgroundTask.registerTaskAsync(SYNC_TASK, { minimumInterval: 15 }); // minutes (inexact)
    }
}
