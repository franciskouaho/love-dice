import { Tabs } from "expo-router";
import React from "react";
import { Platform, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";

// Composant de tab avec retour haptique
function HapticTab(props: any) {
  return (
    <TouchableOpacity
      {...props}
      onPressIn={(ev) => {
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "transparent",
        tabBarInactiveTintColor: "transparent",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 0,
          display: "none",
        },
        tabBarBackground: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Love Dice",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 28, color }}>🎲</Text>
          ),
        }}
      />
    </Tabs>
  );
}
