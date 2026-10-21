import { RefreshControl } from "react-native";

interface RefreshableQuery {
  isRefetching: boolean;
  refetch: () => Promise<unknown>;
}

// Pull-to-refresh bound to one or more React Query results.
export function queryRefreshControl(...queries: RefreshableQuery[]) {
  return (
    <RefreshControl
      refreshing={queries.some((query) => query.isRefetching)}
      onRefresh={() => queries.forEach((query) => void query.refetch())}
    />
  );
}
