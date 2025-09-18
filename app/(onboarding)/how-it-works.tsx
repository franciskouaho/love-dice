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

export default function OnboardingStep2() {
  const { logOnboardingView } = useAnalytics();

  useEffect(() => {
    logOnboardingView(2, "Un seul dé, une décision");
  }, [logOnboardingView]);

  const handleSwipeLeft = async () => {
    await Haptics.selectionAsync();
    nav.onboarding.experience();
  };

  const handleSwipeRight = async () => {
    await Haptics.selectionAsync();
    nav.back();
  };

  const onGestureEvent = (event: any) => {
    if (
      event.nativeEvent.translationX < -100 &&
      event.nativeEvent.velocityX < -500
    ) {
      handleSwipeLeft();
    } else if (
      event.nativeEvent.translationX > 100 &&
      event.nativeEvent.velocityX > 500
    ) {
      handleSwipeRight();
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
                {/* Illustration des catégories */}
                <View style={styles.categoriesContainer}>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryEmoji}>🍷</Text>
                    <Text style={styles.categoryText}>Qui paie</Text>
                  </View>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryEmoji}>🍽️</Text>
                    <Text style={styles.categoryText}>Où manger</Text>
                  </View>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryEmoji}>🎬</Text>
                    <Text style={styles.categoryText}>Quelle activité</Text>
                  </View>
                </View>

                {/* Titre principal */}
                <Text style={styles.title}>Un seul dé, une décision</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>
                  Qui paie, où manger, quelle activité.
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                  Love Dice transforme les moments d&apos;hésitation en instants
                  de découverte. Un lancer, et votre soirée prend forme
                  naturellement.
                </Text>

                {/* Indicateurs de progression */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressDot} />
                  <View style={[styles.progressDot, styles.activeDot]} />
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
  categoriesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  categoryItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    color: "#FFF3F6",
    textAlign: "center",
    fontFamily: "System",
    opacity: 0.9,
    fontWeight: "500",
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
