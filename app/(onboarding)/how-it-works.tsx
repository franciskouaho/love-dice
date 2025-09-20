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
    // Naviguer explicitement vers la page welcome (page précédente)
    nav.onboarding.welcome();
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
                {/* Étapes d'utilisation */}
                <View style={styles.stepsContainer}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Personnalisez vos noms</Text>
                      <Text style={styles.stepDescription}>
                        Entrez vos prénoms pour des résultats personnalisés
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Secouez votre téléphone</Text>
                      <Text style={styles.stepDescription}>
                        Un geste simple pour lancer le dé magique
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>Découvrez votre soirée</Text>
                      <Text style={styles.stepDescription}>
                        Qui paie, où manger, quelle activité vous attend
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Titre principal */}
                <Text style={styles.title}>Comment ça marche ?</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>
                  Simple, rapide et magique
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                  Love Dice utilise un système de dés intelligents qui combinent 
                  plusieurs catégories : qui paie, où manger, quelle activité. 
                  Chaque lancer est unique et personnalisé à vos noms.
                </Text>

                {/* Indicateurs de progression */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressDot} />
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
  stepsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4C869",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    marginTop: 4,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#A50848",
    fontFamily: "System",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "System",
  },
  stepDescription: {
    fontSize: 14,
    color: "#FFF3F6",
    lineHeight: 20,
    opacity: 0.8,
    fontFamily: "System",
  },
});
