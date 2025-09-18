import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { initializeAppWithRetry } from "../services/initialization";

/**
 * Root layout & navigation registry.
 *
 * Splash / onboarding logic now lives in app/index.tsx :
 *  - index.tsx renders the animated "liquid glass" splash card.
 *  - It reads AsyncStorage key 'onboarding_completed' (see utils/onboarding.ts).
 *  - It then router.replace() either '/(onboarding)/welcome' or '/(tabs)/' after a minimum splash duration.
 *
 * Onboarding completion flow:
 *  - markOnboardingCompleted() is invoked on:
 *      • Welcome / HowItWorks "Passer" buttons (skip)
 *      • Experience "Commencer →" (just before navigating to paywall)
 *      • Paywall: on successful purchase OR on "Plus tard" skip
 *  - Once the flag is written, user skips onboarding next launches.
 *
 * Developer / QA tips:
 *  - To force showing onboarding again: call resetOnboarding() (utils/onboarding.ts) or delete the key in AsyncStorage.
 *  - Long‑press on the splash brand title (index.tsx) triggers a dev shortcut to jump to tabs.
 *
 * Rationale for keeping screens declared here:
 *  - Even though index.tsx decides the initial destination, the Stack must still register all routes
 *    so that deep links, back gestures, modals (paywall/settings/history), and future navigation continue to work.
 *  - This also avoids layout jank when the splash finishes and the first real screen mounts.
 */

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    // Initialiser tous les services Firebase avec retry automatique
    initializeAppWithRetry(3, 1000).catch((error) => {
      console.error("Échec de l'initialisation complète de l'app:", error);
    });
  }, []);

  return (
    <>
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
            gestureEnabled: false,
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
    </>
  );
}
