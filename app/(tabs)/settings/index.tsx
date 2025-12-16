import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import { auth } from "../../../firebase/firebaseConfig";

export default function SettingsScreen() {
  const userEmail = auth.currentUser?.email || "User";

  return (
    <View style={styles.root}>
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      <View style={styles.container}>
        <DashboardHeader 
          badge="PENGATURAN"
          title="Akun & Aplikasi"
          subtitle="Kelola preferensi aplikasi pempek Anda."
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userEmail.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Admin Pempek</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
            </View>
          </View>

          {/* MENU SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferensi</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <MaterialCommunityIcons name="theme-light-dark" size={20} color="#3b82f6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Tampilan</Text>
                <Text style={styles.menuSubtext}>Mode Gelap (Aktif)</Text>
              </View>
              {/* Ikon check menandakan ini sudah aktif/default */}
              <MaterialCommunityIcons name="check" size={20} color="#22c55e" />
            </TouchableOpacity>

            {/* TOMBOL PRINTER SUDAH DIHAPUS */}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi</Text>
            <View style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: 'rgba(148,163,184,0.15)' }]}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#94a3b8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Versi Aplikasi</Text>
                <Text style={styles.menuSubtext}>v1.0.0 (Siap Demo)</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
  topGlow: {
    position: "absolute", top: -100, right: -50, width: 300, height: 300,
    borderRadius: 999, backgroundColor: "rgba(56,189,248,0.08)",
  },
  bottomGlow: {
    position: "absolute", bottom: -100, left: -50, width: 300, height: 300,
    borderRadius: 999, backgroundColor: "rgba(168,85,247,0.08)",
  },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 32 },
  
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: "#0f172a", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#1e293b", marginBottom: 24,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  profileInfo: { flex: 1 },
  profileName: { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  profileEmail: { color: "#94a3b8", fontSize: 12, marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: {
    color: "#64748b", fontSize: 12, fontWeight: "600", 
    textTransform: "uppercase", marginBottom: 8, marginLeft: 4 
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#0f172a", borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#1e293b",
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  menuText: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" },
  menuSubtext: { color: "#64748b", fontSize: 11, marginTop: 2 },
});