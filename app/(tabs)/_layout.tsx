import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Text, View } from "react-native";

// --- Komponen Icon Custom ---
type TabIconProps = {
  label: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  focused: boolean;
};

function TabIcon({ label, iconName, color, focused }: TabIconProps) {
  return (
    <View
      style={{
        width: 80,              // slot tiap tab, cukup lebar buat teks
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ICON BULAT, POSISI TENGAH */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? "rgba(34,197,94,0.15)" : "transparent",
        }}
      >
        <MaterialCommunityIcons name={iconName} size={22} color={color} />
      </View>

      {/* LABEL – boleh 2 baris, TIDAK di-ellipsis */}
      <Text
        numberOfLines={2} // biar kalau "Pengaturan" / "Laporan" cukup
        style={{
          marginTop: 4,
          fontSize: 11,
          color: color,
          fontWeight: focused ? "600" : "400",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#6b7280",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 10,
          backgroundColor: "rgba(15,23,42,0.98)",
          borderRadius: 24,
          height: 90,
          borderWidth: 1,
          borderColor: "#1e293b",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          paddingTop: 20,
          paddingBottom: Platform.OS === "ios" ? 18 : 14,
        },
        tabBarItemStyle: {
          justifyContent: "flex-end", // konten agak dikebawahin
          alignItems: "center",
        },
      }}
    >
      {/* 1. DASHBOARD */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              label="Beranda"
              iconName="view-dashboard-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* 2. TRANSAKSI */}
      <Tabs.Screen
        name="transactions/index"
        options={{
          title: "Transaksi",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              label="Kasir"
              iconName="calculator-variant"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* 3. LAPORAN */}
      <Tabs.Screen
        name="reports/index"
        options={{
          title: "Laporan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              label="Laporan"
              iconName="chart-line"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* 4. PENGATURAN */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Pengaturan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              label="Akun"
              iconName="cog-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      {/* Sembunyikan tab hantu */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
