import { QueryClient, onlineManager } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const DAY_MS = 24 * 60 * 60 * 1000;

// gcTime must be at least the persister's maxAge or cached queries are
// dropped from memory before they can be saved.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000, gcTime: DAY_MS } },
});

// React Query pauses fetches while offline and resumes (and refetches stale
// data) the moment the connection returns.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

export const queryPersister = createAsyncStoragePersister({ storage: AsyncStorage, key: "petcare.query-cache", throttleTime: 1_000 });
export const QUERY_CACHE_MAX_AGE = DAY_MS;

// Only content that is fine to keep unencrypted on the device is persisted:
// pets, posts and appointments. Medical records, chats and notifications are
// deliberately left out — AsyncStorage isn't encrypted.
const PERSISTED_ROOTS = new Set(["pets", "posts", "appointments"]);
export function shouldPersistQuery(queryKey: readonly unknown[], status: string): boolean {
  return status === "success" && PERSISTED_ROOTS.has(String(queryKey[0]));
}

// Called on every sign-out so one account's data never shows for the next.
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  await queryPersister.removeClient();
}
