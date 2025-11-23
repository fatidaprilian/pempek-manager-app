// app/(tabs)/settings/index.tsx
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../../firebase/firebaseConfig";

export default function SettingsScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Error", "Gagal logout. Coba lagi.");
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={styles.container}>
        <Text style={styles.badge}>PENGATURAN</Text>
        <Text style={styles.title}>Pengaturan Aplikasi</Text>
        <Text style={styles.subtitle}>
          Kelola akun dan preferensi aplikasi pempek.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akun</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuTitle}>Logout</Text>
            <Text style={styles.menuSubtitle}>
              Keluar dari aplikasi ini dan kembali ke layar login.
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#020617",
  },
  topGlow: {
    position: "absolute",
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
  },
  bottomGlow: {
    position: "absolute",
    bottom: -120,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(56,189,248,0.10)",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    color: "#9ca3af",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e5e7eb",
  },
  subtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    marginBottom: 18,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  menuItem: {
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  menuTitle: {
    color: "#fecaca",
    fontSize: 14,
    fontWeight: "600",
  },
  menuSubtitle: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },
});
