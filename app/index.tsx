import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { auth } from "../firebase/firebaseConfig";

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // kalau sudah login → langsung ke tabs
        router.replace("/(tabs)");
      } else {
        // kalau belum login → ke halaman login
        router.replace("/auth/login");
      }
      setChecking(false);
    });

    return unsub;
  }, [router]);

  // Selama cek status login, tampilkan loading sebentar
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={styles.text}>Memeriksa sesi login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 8,
    color: "#e5e7eb",
    fontSize: 14,
  },
});
