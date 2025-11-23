// app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

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
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <View
        style={{
          paddingHorizontal: focused ? 12 : 10,
          paddingVertical: focused ? 6 : 4,
          borderRadius: 999,
          backgroundColor: focused
            ? "rgba(34,197,94,0.16)"
            : "rgba(15,23,42,0.96)",
          borderWidth: focused ? 1 : 0,
          borderColor: focused ? "#22c55e" : "transparent",
        }}
      >
        <MaterialCommunityIcons name={iconName} size={20} color={color} />
      </View>
      <Text
        style={{
          fontSize: 11,
          color: focused ? "#bbf7d0" : "#6b7280",
          fontWeight: focused ? "600" : "400",
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
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#6b7280",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 20, // naik dikit dari nav 3 tombol
          borderRadius: 999,
          backgroundColor: "rgba(15,23,42,0.98)",
          borderWidth: 1,
          borderColor: "#1f2937",
          height: 70,
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 18,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
      }}
    >
      {/* NOTE:
         Karena file kamu adalah app/(tabs)/dashboard/index.tsx
         nama route-nya "dashboard/index", bukan "dashboard" */}
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              label="Dashboard"
              iconName="view-dashboard-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

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

      {/* TAB 3: Pengaturan */}
      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Pengaturan",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              label="Pengaturan"
              iconName="cog-outline"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
