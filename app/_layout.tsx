import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { initializeAppWithRetry } from "../services/initialization";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    // Initialiser tous les services Firebase avec retry automatique
    initializeAppWithRetry(3, 1000).catch((error) => {
      // Échec de l'initialisation complète de l'app
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        {/* Onboarding Screens */}
        <Stack.Screen
          name="(onboarding)/welcome"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(onboarding)/how-it-works"
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="(onboarding)/experience"
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />

        {/* Paywall */}
        <Stack.Screen
          name="paywall"
          options={{
            headerShown: false,
            presentation: "modal",
            gestureEnabled: true,
          }}
        />

        {/* Main App */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Premium Features */}
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="custom-faces"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
