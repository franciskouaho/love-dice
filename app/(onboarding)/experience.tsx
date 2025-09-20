import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { nav } from "../../utils/navigation";

import * as Haptics from "expo-haptics";
import useAnalytics from "../../hooks/useAnalytics";

export default function OnboardingStep3() {
  const { logOnboardingView } = useAnalytics();

  useEffect(() => {
    logOnboardingView(3, "Secouez & découvrez");
  }, [logOnboardingView]);


  const handleSwipeLeft = async () => {
    await Haptics.selectionAsync();
    nav.onboarding.notifications();
  };

  const handleSwipeRight = async () => {
    await Haptics.selectionAsync();
    // Naviguer explicitement vers la page how-it-works (page précédente)
    nav.onboarding.howItWorks();
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
                {/* Animation du dé */}
                <View style={styles.diceContainer}>
                  <View style={styles.diceAnimation}>
                    <Image
                      source={require("../../assets/images/image-splash.png")}
                      style={styles.diceImage}
                      contentFit="contain"
                    />
                    <View style={styles.sparkles}>
                      <Text style={styles.sparkle}>✨</Text>
                      <Text style={styles.sparkle}>✨</Text>
                      <Text style={styles.sparkle}>✨</Text>
                    </View>
                  </View>

                  {/* Résultat simulé */}
                  <View style={styles.resultCard}>
                    <Text style={styles.resultEmoji}>🍽️</Text>
                    <Text style={styles.resultText}>Restaurant</Text>
                  </View>
                </View>

                {/* Instructions d'utilisation */}
                <View style={styles.instructionsContainer}>
                  <View style={styles.instructionItem}>
                    <Text style={styles.instructionEmoji}>📱</Text>
                    <Text style={styles.instructionText}>
                      Tenez votre téléphone fermement
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Text style={styles.instructionEmoji}>📳</Text>
                    <Text style={styles.instructionText}>
                      Secouez d&apos;avant en arrière
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Text style={styles.instructionEmoji}>🎯</Text>
                    <Text style={styles.instructionText}>
                      Découvrez votre soirée !
                    </Text>
                  </View>
                </View>

                {/* Titre principal */}
                <Text style={styles.title}>Prêt à commencer ?</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>
                  Votre aventure vous attend
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                  Vous avez maintenant toutes les clés pour transformer vos soirées. 
                  Chaque secousse révèlera une nouvelle surprise et créera des 
                  souvenirs inoubliables à deux.
                </Text>

                {/* Indicateurs de progression */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressDot} />
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
  diceContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  diceAnimation: {
    position: "relative",
    alignItems: "center",
    marginBottom: 24,
  },
  diceEmoji: {
    fontSize: 80,
    textAlign: "center",
  },
  diceImage: {
    width: 80,
    height: 80,
  },
  sparkles: {
    position: "absolute",
    top: -10,
    left: -20,
    right: -20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sparkle: {
    fontSize: 20,
    opacity: 0.8,
  },
  resultCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  resultEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "System",
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 20,
    color: "#FFF3F6",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "System",
    opacity: 0.9,
  },
  description: {
    fontSize: 16,
    color: "#FFF3F6",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: "System",
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

  instructionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  instructionItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  instructionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 11,
    color: "#FFF3F6",
    textAlign: "center",
    fontFamily: "System",
    opacity: 0.9,
    fontWeight: "500",
    lineHeight: 14,
  },
});
