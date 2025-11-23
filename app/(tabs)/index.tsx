import { Redirect } from "expo-router";

export default function TabsIndex() {
  // Setelah login, route "/(tabs)" akan otomatis diarahkan ke dashboard utama
  return <Redirect href="/(tabs)/dashboard" />;
}