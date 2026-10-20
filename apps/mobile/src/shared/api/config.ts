// Android emulator: run `adb reverse tcp:4000 tcp:4000` so localhost reaches
// the API on the host (also makes the absolute upload URLs the API returns
// load). A physical device needs EXPO_PUBLIC_API_URL set to the host's LAN IP.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";
