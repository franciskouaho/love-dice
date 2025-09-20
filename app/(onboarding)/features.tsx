import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import useAnalytics from "../../hooks/useAnalytics";
import { createAnonymousUser, initAuth } from "../../services/firebase";
import * as FirestoreService from "../../services/firestore";
import { nav } from "../../utils/navigation";
import { markOnboardingCompleted } from "../../utils/onboarding";

export default function OnboardingFeatures() {
  const { logOnboardingView } = useAnalytics();

  useEffect(() => {
    logOnboardingView(4, "Fonctionnalités avancées");
  }, [logOnboardingView]);

  const handleStartAdventure = async () => {
    await Haptics.selectionAsync();

    try {
      // Vérifier l'état initial
      FirestoreService.getCurrentUserId();

      // Vérifier l'état Firebase
      await initAuth();

      // Vérifier si un utilisateur existe déjà
      const userId = FirestoreService.getCurrentUserId();

      // Créer un utilisateur Firebase si nécessaire
      if (!userId) {
        try {
          await createAnonymousUser();
          // Attendre que l'auth se propage
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch {
          // Erreur création utilisateur ignorée
        }
      }

      // Marquer l'onboarding comme terminé
      await markOnboardingCompleted();
      
      // Rediriger vers l'app principale
      nav.goTabs();
    } catch {
      // Marquer l'onboarding comme terminé même en cas d'erreur
      await markOnboardingCompleted();
      // Rediriger quand même vers l'app principale
      nav.goTabs();
    }
  };

  const handleSwipeRight = async () => {
    await Haptics.selectionAsync();
    // Naviguer explicitement vers la page notifications (page précédente)
    nav.onboarding.notifications();
  };

  const onGestureEvent = (event: any) => {
    // Seul le swipe à droite est autorisé (pour revenir en arrière)
    if (
      event.nativeEvent.translationX > 150 &&
      event.nativeEvent.velocityX > 800
    ) {
      handleSwipeRight();
    }
    // Swipe à gauche bloqué - seul le bouton peut terminer l'onboarding
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
        hidden={false}
      />

      <LinearGradient
        colors={["#A50848", "#A50848", "#E0115F", "#FF4F7B"]}
        style={styles.gradient}
      >
        <View style={styles.safeArea}>
          <PanGestureHandler onGestureEvent={onGestureEvent}>
            <View style={styles.main}>
              <View style={styles.content}>
                {/* Fonctionnalités avancées */}
                <View style={styles.featuresContainer}>
                  <View style={styles.featureCard}>
                    <Text style={styles.featureEmoji}>🎨</Text>
                    <Text style={styles.featureTitle}>Personnalisation</Text>
                    <Text style={styles.featureDescription}>
                      Créez vos propres faces de dé personnalisées
                    </Text>
                  </View>

                  <View style={styles.featureCard}>
                    <Text style={styles.featureEmoji}>📊</Text>
                    <Text style={styles.featureTitle}>Historique</Text>
                    <Text style={styles.featureDescription}>
                      Retrouvez tous vos lancers précédents
                    </Text>
                  </View>

                  <View style={styles.featureCard}>
                    <Text style={styles.featureEmoji}>⚙️</Text>
                    <Text style={styles.featureTitle}>Paramètres</Text>
                    <Text style={styles.featureDescription}>
                      Ajustez l&apos;expérience à vos préférences
                    </Text>
                  </View>

                  <View style={styles.featureCard}>
                    <Text style={styles.featureEmoji}>💎</Text>
                    <Text style={styles.featureTitle}>Premium</Text>
                    <Text style={styles.featureDescription}>
                      Débloquez des fonctionnalités exclusives
                    </Text>
                  </View>
                </View>

                {/* Titre principal */}
                <Text style={styles.title}>Fonctionnalités avancées</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>
                  Découvrez tout le potentiel de Love Dice
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                  Au-delà du simple lancer de dé, Love Dice vous offre une 
                  expérience complète avec personnalisation, historique et 
                  bien plus encore.
                </Text>

                {/* Indicateurs de progression */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                  <View style={[styles.progressDot, styles.activeDot]} />
                </View>

                {/* Instruction de navigation */}
                <View style={styles.instructionContainer}>
                  <Text style={styles.instructionText}>
                    👆 Cliquez sur le bouton pour commencer
                  </Text>
                  <Text style={styles.instructionText}>
                    👈 Glissez vers la droite pour revenir en arrière
                  </Text>
                </View>
              </View>

              {/* Bouton Commencer */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.commencerButton}
                  onPress={handleStartAdventure}
                  activeOpacity={0.8}
                >
                  <View style={styles.glassBackground}>
                    <View style={styles.glassInner}>
                      <View style={styles.glassHighlight} />
                      <Text style={styles.buttonText}>Commencer l&apos;aventure</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </PanGestureHandler>
        </View>
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
    paddingTop: 0,
    marginTop: 0,
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
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 32,
  },
  featureCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "System",
  },
  featureDescription: {
    fontSize: 11,
    color: "#FFF3F6",
    textAlign: "center",
    lineHeight: 16,
    opacity: 0.8,
    fontFamily: "System",
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
  instructionContainer: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: "#FFF3F6",
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.8,
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
});
