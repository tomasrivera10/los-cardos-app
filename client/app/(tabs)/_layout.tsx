import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: "none" },
        headerShown: false,
      }}
    >
      <Tabs.Screen name='index' options={{ href: null }} />
    </Tabs>
  );
}
