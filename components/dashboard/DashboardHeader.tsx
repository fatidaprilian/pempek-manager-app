import { router } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebase/firebaseConfig";

export default function DashboardHeader() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <View style={styles.headerRow}>
      <View>
        <Text style={styles.appBadge}>DASHBOARD</Text>
        <Text style={styles.title}>Stok Pempek</Text>
        <Text style={styles.subtitle}>
          Pantau stok & nilai persediaan secara ringkas.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  appBadge: {
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
    maxWidth: 220,
  },
  logoutButton: {
    marginLeft: "auto",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#f97316",
  },
  logoutText: {
    color: "#f97316",
    fontSize: 12,
    fontWeight: "600",
  },
});
