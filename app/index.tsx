import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { hasCompletedOnboarding } from "../utils/onboarding";

export default function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate loading time for a smooth experience
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if user has completed onboarding
        const onboardingCompleted = await hasCompletedOnboarding();

        if (onboardingCompleted) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(onboarding)/welcome");
        }
      } catch (error) {
        // Error during app initialization - default to onboarding on error
        router.replace("/(onboarding)/welcome");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      {/* Simple gradient background */}
      <LinearGradient
        colors={["#FF6B9D", "#C44569", "#8B3A62"]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Simple dice icon */}
        <View style={styles.diceContainer}>
          <View style={styles.dice}>
            <View style={[styles.dot, styles.dotCenter]} />
          </View>
        </View>

        {/* App title */}
        <Text style={styles.title}>Love Dice</Text>
        <Text style={styles.subtitle}>Randomisez vos soirées</Text>

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color="rgba(255,255,255,0.8)"
            style={styles.loader}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  diceContainer: {
    marginBottom: 40,
  },
  dice: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#333",
  },
  dotCenter: {
    position: "absolute",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
