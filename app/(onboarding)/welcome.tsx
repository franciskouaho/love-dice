import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { nav } from "../../utils/navigation";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useAnalytics from "../../hooks/useAnalytics";

export default function OnboardingStep1() {
  const { logOnboardingView } = useAnalytics();

  useEffect(() => {
    logOnboardingView(1, "Randomisez votre soirée");
  }, [logOnboardingView]);

  const handleSwipeLeft = async () => {
    await Haptics.selectionAsync();
    nav.onboarding.howItWorks();
  };

  const onGestureEvent = (event: any) => {
    if (
      event.nativeEvent.translationX < -100 &&
      event.nativeEvent.velocityX < -500
    ) {
      handleSwipeLeft();
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={["#A50848", "#A50848", "#E0115F", "#FF4F7B"]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <PanGestureHandler onGestureEvent={onGestureEvent}>
            <View style={styles.main}>
              <View style={styles.content}>
                {/* Icône principale */}
                <View style={styles.iconContainer}>
                  <Text style={styles.diceIcon}>🎲</Text>
                  <Text style={styles.heartIcon}>💕</Text>
                </View>

                {/* Titre principal */}
                <Text style={styles.title}>Randomisez votre soirée</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>Fini les prises de tête.</Text>

                {/* Description */}
                <Text style={styles.description}>
                  Une soirée parfaite commence par une décision simple. Laissez
                  Love Dice choisir pour vous et découvrez de nouveaux moments
                  magiques ensemble.
                </Text>

                {/* Indicateurs de progression */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressDot, styles.activeDot]} />
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                </View>
              </View>
            </View>
          </PanGestureHandler>
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A50848",
  },
  gradient: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  main: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 48,
    alignItems: "center",
    position: "relative",
  },
  diceIcon: {
    fontSize: 80,
    marginBottom: 8,
  },
  heartIcon: {
    fontSize: 32,
    position: "absolute",
    top: -8,
    right: -16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "System", // DM Sans serait idéal
  },
  subtitle: {
    fontSize: 20,
    color: "#FFF3F6",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "System", // Inter serait idéal
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    color: "#FFF3F6",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: "System", // Inter serait idéal
    opacity: 0.8,
    paddingHorizontal: 16,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#F4C869",
    width: 24,
  },
});
