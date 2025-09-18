import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useAnalytics from "../hooks/useAnalytics";
import useRevenueCat from "../hooks/useRevenueCat";
import useQuota from "../hooks/useQuota";
import { getRemoteConfigValue } from "../services/firebase";
import { markOnboardingCompleted } from "../utils/onboarding";
import { nav } from "../utils/navigation";
import { router } from "expo-router";

export default function PaywallScreen() {
  const {
    logPaywallView,
    logPaywallPurchaseAttempt,
    logPaywallPurchaseSuccess,
    logRestorePurchases,
  } = useAnalytics();
  const {
    hasLifetime,
    purchaseLifetime,
    restorePurchases,
    getLifetimePrice,
    isLoading,
  } = useRevenueCat();
  const { setLifetimeStatus } = useQuota();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Valeurs configurables via Remote Config
  const [paywallTitle, setPaywallTitle] = useState("Accès à vie 💕");
  const [paywallBullets, setPaywallBullets] = useState([
    "Lancers illimités",
    "Dés personnalisables",
    "Aucune pub",
  ]);
  const [price, setPrice] = useState("12,99 €");

  useEffect(() => {
    // Charger les valeurs Remote Config
    const title = getRemoteConfigValue("PAYWALL_TITLE");
    const bulletsRaw = getRemoteConfigValue("PAYWALL_BULLETS");
    const bullets = typeof bulletsRaw === "string" ? bulletsRaw.split("|") : [];
    const rcPrice = getRemoteConfigValue("LIFETIME_PRICE");

    if (title) setPaywallTitle(String(title));
    if (bullets.length > 0 && bullets[0]) setPaywallBullets(bullets);
    if (rcPrice) setPrice(String(rcPrice));

    // Utiliser le prix RevenueCat si disponible
    const rcLifetimePrice = getLifetimePrice();
    if (rcLifetimePrice && rcLifetimePrice !== "12,99 €") {
      setPrice(rcLifetimePrice);
    }

    // Logger l'événement paywall view
    logPaywallView({
      source: "onboarding",
      price: price,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rediriger si l'utilisateur a déjà l'accès à vie
  useEffect(() => {
    if (hasLifetime) {
      nav.goTabs();
    }
  }, [hasLifetime]);

  const handlePurchase = async () => {
    if (isPurchasing) return;

    try {
      setIsPurchasing(true);
      await Haptics.selectionAsync();

      logPaywallPurchaseAttempt({
        source: "onboarding",
        price,
      });

      const result = await purchaseLifetime();

      if (result.success) {
        await setLifetimeStatus(true);
        // Marquer l'onboarding comme complété après un achat réussi
        await markOnboardingCompleted();
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        logPaywallPurchaseSuccess({
          product_id: "love_dice_lifetime",
          price,
          currency: "EUR",
          success: true,
        });

        // Rediriger vers l'app principale
        nav.goTabs();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Erreur d'achat",
          "Impossible de finaliser l'achat. Veuillez réessayer.",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Erreur achat:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Erreur",
        "Une erreur est survenue. Veuillez vérifier votre connexion et réessayer.",
        [{ text: "OK" }],
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;

    try {
      setIsRestoring(true);
      await Haptics.selectionAsync();

      const result = await restorePurchases();

      if (result.success && result.hasLifetime) {
        await setLifetimeStatus(true);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        logRestorePurchases(true, true);

        Alert.alert(
          "Restauration réussie",
          "Vos achats ont été restaurés avec succès !",
          [{ text: "OK", onPress: () => nav.goTabs() }],
        );
      } else {
        logRestorePurchases(false, false);
        Alert.alert(
          "Aucun achat trouvé",
          "Aucun achat précédent n'a été trouvé pour ce compte.",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Erreur restauration:", error);
      logRestorePurchases(false, false);
      Alert.alert(
        "Erreur de restauration",
        "Impossible de restaurer vos achats. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSkip = async () => {
    await Haptics.selectionAsync();
    // Marquer l'onboarding comme complété quand l'utilisateur passe le paywall
    await markOnboardingCompleted();
    nav.goTabs();
  };

  const handleClose = async () => {
    await Haptics.selectionAsync();
    // Fermer le paywall et aller directement aux tabs sans passer par le splash
    router.replace("/(tabs)/" as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#A50848" />
        <LinearGradient
          colors={["#A50848", "#A50848", "#E0115F", "#FF4F7B"]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A50848" />

      <LinearGradient
        colors={["#A50848", "#A50848", "#E0115F", "#FF4F7B"]}
        style={styles.gradient}
      >
        {/* Bouton close en haut à droite */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* En-tête avec icône */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.diceIcon}>🎲</Text>
              <Text style={styles.heartIcon}>💕</Text>
            </View>
          </View>

          {/* Titre principal */}
          <Text style={styles.title}>{paywallTitle}</Text>

          {/* Liste des avantages */}
          <View style={styles.benefitsContainer}>
            {paywallBullets.map((benefit, index) => (
              <View key={index} style={styles.glassCard}>
                <View style={styles.cardGlass}>
                  <View style={styles.cardHighlight} />
                  <View style={styles.benefitItem}>
                    <View style={styles.checkIcon}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Prix et CTA */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{price} — rien de plus.</Text>
            <Text style={styles.priceSubtext}>Achat unique, accès à vie</Text>
          </View>

          {/* Bouton principal */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              isPurchasing && styles.buttonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing}
            activeOpacity={0.8}
          >
            <View style={styles.buttonGlassBackground}>
              <View style={styles.buttonGlassInner}>
                <View style={styles.buttonGlassHighlight} />
                <Text style={styles.buttonText}>
                  {isPurchasing ? "Achat en cours..." : "Continuer →"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Bouton restaurer */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
            activeOpacity={0.7}
          >
            <Text style={styles.restoreText}>
              {isRestoring ? "Restauration..." : "Restaurer achats"}
            </Text>
          </TouchableOpacity>

          {/* Informations légales */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              En achetant, vous acceptez nos conditions d&apos;utilisation et
              notre politique de confidentialité.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A50848",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "System",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
  },
  diceIcon: {
    fontSize: 80,
  },
  heartIcon: {
    fontSize: 32,
    position: "absolute",
    top: -8,
    right: -16,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 48,
    fontFamily: "System",
  },
  benefitsContainer: {
    marginBottom: 48,
  },
  glassCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: "relative",
    shadowColor: "rgba(255, 255, 255, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F4C869",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  checkText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#A50848",
  },
  benefitText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontFamily: "System",
    fontWeight: "500",
    flex: 1,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  priceText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#F4C869",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "System",
  },
  priceSubtext: {
    fontSize: 16,
    color: "#FFF3F6",
    textAlign: "center",
    opacity: 0.8,
    fontFamily: "System",
  },
  purchaseButton: {
    borderRadius: 48,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGlassBackground: {
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
  buttonGlassInner: {
    paddingVertical: 20,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    position: "relative",
  },
  buttonGlassHighlight: {
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "System",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 10,
  },
  restoreButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  restoreText: {
    fontSize: 16,
    color: "#FFF3F6",
    fontFamily: "System",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  legalContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 16,
    fontFamily: "System",
  },
});
