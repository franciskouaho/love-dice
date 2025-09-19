import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    GestureHandlerRootView,
    PanGestureHandler,
} from "react-native-gesture-handler";
import { nav } from "../../utils/navigation";

import * as Haptics from "expo-haptics";
import useAnalytics from "../../hooks/useAnalytics";
import { createAnonymousUser, initAuth } from "../../services/firebase";
import * as FirestoreService from "../../services/firestore";
import { markOnboardingCompleted } from "../../utils/onboarding";

export default function OnboardingStep3() {
  const { logOnboardingView } = useAnalytics();

  useEffect(() => {
    logOnboardingView(3, "Secouez & découvrez");
  }, [logOnboardingView]);

  const handleCommencer = async () => {
    await Haptics.selectionAsync();

    console.log("🚀 DEBUT handleCommencer");

    try {
      // Vérifier l'état initial
      console.log("🔍 État initial Firebase...");
      const initialUserId = FirestoreService.getCurrentUserId();
      console.log("📍 UserId initial:", initialUserId || "AUCUN");

      // Vérifier l'état Firebase sans forcer la création d'un nouvel utilisateur
      console.log("🔧 Vérification Firebase Auth...");
      const authResult = await initAuth();
      console.log("🔧 Résultat initAuth:", authResult);

      // Si pas d'utilisateur, l'app peut fonctionner en mode "offline" ou avec des valeurs par défaut
      const userId = FirestoreService.getCurrentUserId();
      console.log(
        "✅ Utilisateur Firebase:",
        userId || "AUCUN (mode par défaut)",
      );

      // Créer un utilisateur Firebase à la fin de l'onboarding
      if (!userId) {
        console.log("🔧 Fin d'onboarding - création d'un utilisateur Firebase...");
        try {
          const newUser = await createAnonymousUser();
          console.log("✅ Utilisateur créé à la fin de l'onboarding:", newUser?.uid);
          // Attendre que l'auth se propage
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn("⚠️ Erreur création utilisateur onboarding:", error);
          console.log("ℹ️ L'app continuera quand même");
        }
      } else {
        console.log("ℹ️ Utilisateur déjà existant, pas de création nécessaire");
      }

      // Marquer l'onboarding comme complété
      console.log("📝 Marquage onboarding complété...");
      await markOnboardingCompleted();

      // Rediriger vers la page des fonctionnalités
      console.log("🎨 Redirection vers features...");
      nav.onboarding.features();
    } catch (error) {
      console.error("❌ Erreur initialisation Firebase:", error);
      console.error("❌ Stack trace:", (error as Error).stack);
      // En cas d'erreur, aller quand même vers l'app
      await markOnboardingCompleted();
      nav.goTabs();
    }
  };

  const handleSwipeRight = async () => {
    await Haptics.selectionAsync();
    nav.back();
  };

  const onGestureEvent = (event: any) => {
    if (
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
                    <Text style={styles.diceEmoji}>🎲</Text>
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
                      Secouez d'avant en arrière
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
                </View>
              </View>

              {/* Bouton Commencer */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.commencerButton}
                  onPress={handleCommencer}
                  activeOpacity={0.8}
                >
                  <View style={styles.glassBackground}>
                    <View style={styles.glassInner}>
                      <View style={styles.glassHighlight} />
                      <Text style={styles.buttonText}>Commencer</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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

  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  commencerButton: {
    borderRadius: 48,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  glassBackground: {
    borderRadius: 48,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "rgba(255, 255, 255, 0.5)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    overflow: "hidden",
  },
  glassInner: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    position: "relative",
  },
  glassHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "System",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
