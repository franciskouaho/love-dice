import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    GestureHandlerRootView,
    PanGestureHandler,
} from "react-native-gesture-handler";
import useAnalytics from "../../hooks/useAnalytics";
import useNotifications from "../../hooks/useNotifications";
import { nav } from "../../utils/navigation";

export default function OnboardingNotifications() {
  const { logOnboardingView } = useAnalytics();
  const { requestPermissions, hasPermissions } = useNotifications();

  useEffect(() => {
    logOnboardingView(4, "Notifications");
  }, [logOnboardingView]);

  const handleSwipeLeft = async () => {
    await Haptics.selectionAsync();
    nav.onboarding.features();
  };

  const handleSwipeRight = async () => {
    await Haptics.selectionAsync();
    nav.back();
  };

  const handleEnableNotifications = async () => {
    await Haptics.selectionAsync();
    
    try {
      console.log("🔔 Demande des permissions de notifications...");
      await requestPermissions();
      console.log("✅ Permissions de notifications accordées");
      
      // Continuer vers features après un court délai
      setTimeout(() => {
        nav.onboarding.features();
      }, 1000);
    } catch (error) {
      console.error("❌ Erreur lors de la demande de permissions:", error);
      // Continuer quand même vers features
      nav.onboarding.features();
    }
  };

  const handleSkip = async () => {
    await Haptics.selectionAsync();
    nav.onboarding.features();
  };

  const onGestureEvent = (event: any) => {
    if (
      event.nativeEvent.translationX < -150 &&
      event.nativeEvent.velocityX < -800
    ) {
      handleSwipeLeft();
    } else if (
      event.nativeEvent.translationX > 150 &&
      event.nativeEvent.velocityX > 800
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
                {/* Icône notifications */}
                <View style={styles.iconContainer}>
                  <Text style={styles.notificationIcon}>🔔</Text>
                  <View style={styles.sparkles}>
                    <Text style={styles.sparkle}>✨</Text>
                    <Text style={styles.sparkle}>✨</Text>
                    <Text style={styles.sparkle}>✨</Text>
                  </View>
                </View>

                {/* Titre principal */}
                <Text style={styles.title}>Ne ratez rien !</Text>

                {/* Sous-titre */}
                <Text style={styles.subtitle}>
                  Activez les notifications pour des rappels personnalisés
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                  Recevez des rappels quotidiens pour vos soirées en couple et 
                  des notifications spéciales pour vos jalons importants. 
                  Vos données restent privées et sécurisées.
                </Text>

                {/* Avantages des notifications */}
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitEmoji}>⏰</Text>
                    <Text style={styles.benefitText}>Rappels quotidiens</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitEmoji}>🎉</Text>
                    <Text style={styles.benefitText}>Jalons spéciaux</Text>
                  </View>
                  <View style={styles.benefitItem}>
                    <Text style={styles.benefitEmoji}>🔒</Text>
                    <Text style={styles.benefitText}>100% privé</Text>
                  </View>
                </View>

                {/* Indicateurs de progression */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                  <View style={[styles.progressDot, styles.activeDot]} />
                  <View style={styles.progressDot} />
                </View>
              </View>

              {/* Boutons d'action */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.enableButton}
                  onPress={handleEnableNotifications}
                  activeOpacity={0.8}
                >
                  <View style={styles.glassBackground}>
                    <View style={styles.glassInner}>
                      <View style={styles.glassHighlight} />
                      <Text style={styles.buttonText}>Activer les notifications</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipButtonText}>Passer pour l'instant</Text>
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
  iconContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 48,
  },
  notificationIcon: {
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
  benefitsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  benefitItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  benefitEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 12,
    color: "#FFF3F6",
    textAlign: "center",
    fontFamily: "System",
    opacity: 0.9,
    fontWeight: "500",
    lineHeight: 16,
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
  enableButton: {
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
    marginBottom: 16,
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
  skipButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: "#FFF3F6",
    fontFamily: "System",
    opacity: 0.8,
    textDecorationLine: "underline",
  },
});
