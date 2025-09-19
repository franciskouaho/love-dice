import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import {
    GestureHandlerRootView,
    PanGestureHandler,
} from "react-native-gesture-handler";
import useAnalytics from "../../hooks/useAnalytics";
import { nav } from "../../utils/navigation";

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
                <Text style={styles.title}>Bienvenue dans Love Dice</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>Votre assistant décisionnel amoureux</Text>

                {/* Description */}
                <Text style={styles.description}>
                  Fini les "Qu'est-ce qu'on fait ce soir ?" et "Qui paie ?". 
                  Love Dice transforme vos hésitations en aventures spontanées 
                  et vos soirées en moments magiques.
                </Text>

                {/* Fonctionnalités clés */}
                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureEmoji}>🎲</Text>
                    <Text style={styles.featureText}>Secouez pour décider</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureEmoji}>💕</Text>
                    <Text style={styles.featureText}>Personnalisez vos noms</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Text style={styles.featureEmoji}>✨</Text>
                    <Text style={styles.featureText}>Découvrez l'inattendu</Text>
                  </View>
                </View>

                {/* Indicateurs de progression */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressDot, styles.activeDot]} />
                  <View style={styles.progressDot} />
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
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: "#FFF3F6",
    textAlign: "center",
    fontFamily: "System",
    opacity: 0.9,
    fontWeight: "500",
  },
});
