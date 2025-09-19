import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import useAnalytics from "../hooks/useAnalytics";
import useQuota from "../hooks/useQuota";
import useRevenueCat from "../hooks/useRevenueCat";
import { getRemoteConfigValue } from "../services/firebase";
import { nav } from "../utils/navigation";
import { markOnboardingCompleted } from "../utils/onboarding";

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
  const [paywallTitle, setPaywallTitle] = useState("Débloquez l'amour illimité 💕");
  const [paywallBullets, setPaywallBullets] = useState([
    "🎲 Lancers illimités à vie",
    "💕 Dés personnalisables pour vous deux",
    "✨ Nouvelles faces ajoutées régulièrement",
    "🍽️ Restaurants chics de Paris & environs",
    "🎭 Activités insolites bientôt disponibles",
    "💎 Accès prioritaire aux nouvelles fonctionnalités",
  ]);
  const [price, setPrice] = useState("5,99 €");

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
      // Erreur achat ignorée
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
      // Erreur restauration ignorée
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
    // Fermer la modal du paywall
    router.dismiss();
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

          {/* Message d'information système strict */}
          <View style={styles.infoCard}>
            <View style={styles.cardGlass}>
              <View style={styles.cardHighlight} />
              <View style={styles.infoContent}>
                <Text style={styles.infoIcon}>⚠️</Text>
                <Text style={styles.infoText}>
                  Vous avez utilisé votre lancer gratuit du jour. Pour continuer à créer des soirées magiques, débloquez l'accès illimité !
                </Text>
              </View>
            </View>
          </View>

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
                         <View style={styles.benefitTextContainer}>
                           <Text style={styles.benefitText}>{benefit}</Text>
                           {(benefit.includes("Restaurants chics") || benefit.includes("Activités insolites")) && (
                             <View style={styles.soonBadge}>
                               <Text style={styles.soonBadgeText}>Bientôt</Text>
                             </View>
                           )}
                         </View>
                       </View>
                     </View>
                   </View>
                 ))}
               </View>

          {/* Prix et CTA */}
          <View style={styles.priceContainer}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>OFFRE LIMITÉE</Text>
            </View>
            <Text style={styles.priceText}>{price}</Text>
            <Text style={styles.priceSubtext}>Achat unique • Accès à vie • Aucun renouvellement</Text>
            <View style={styles.savingsContainer}>
              <Text style={styles.savingsText}>Économisez 70% par rapport aux abonnements mensuels</Text>
            </View>
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
                  {isPurchasing ? "Achat en cours..." : "Débloquer maintenant →"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Témoignages */}
          <View style={styles.testimonialsContainer}>
            <Text style={styles.testimonialsTitle}>💕 Ce qu'ils disent</Text>
            <View style={styles.testimonialCard}>
              <Text style={styles.testimonialText}>
                "Love Dice a transformé nos soirées ! On ne se demande plus jamais quoi faire. C'est devenu notre rituel quotidien !"
              </Text>
              <Text style={styles.testimonialAuthor}>- Sarah & Marc</Text>
            </View>
            <View style={styles.testimonialCard}>
              <Text style={styles.testimonialText}>
                "5,99€ pour des années de soirées parfaites ? C'est le meilleur investissement qu'on ait fait !"
              </Text>
              <Text style={styles.testimonialAuthor}>- Emma & Tom</Text>
            </View>
          </View>

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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
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
    marginBottom: 16,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
  },
  diceIcon: {
    fontSize: 50,
  },
  heartIcon: {
    fontSize: 20,
    position: "absolute",
    top: -4,
    right: -10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "System",
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  glassCard: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F4C869",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#A50848",
  },
  benefitTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  benefitText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: "System",
    fontWeight: "500",
    flex: 1,
  },
  soonBadge: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  soonBadgeText: {
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  priceBadge: {
    backgroundColor: "#F4C869",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  priceBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#A50848",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F4C869",
    textAlign: "center",
    marginBottom: 4,
    fontFamily: "System",
  },
  priceSubtext: {
    fontSize: 12,
    color: "#FFF3F6",
    textAlign: "center",
    opacity: 0.8,
    fontFamily: "System",
  },
  savingsContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(244, 200, 105, 0.2)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(244, 200, 105, 0.3)",
  },
  savingsText: {
    fontSize: 12,
    color: "#F4C869",
    textAlign: "center",
    fontWeight: "600",
  },
  purchaseButton: {
    borderRadius: 48,
    overflow: "hidden",
    marginBottom: 12,
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
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "System",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 10,
  },
  testimonialsContainer: {
    marginBottom: 16,
  },
  testimonialsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  testimonialCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  testimonialText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontStyle: "italic",
    lineHeight: 14,
    marginBottom: 4,
  },
  testimonialAuthor: {
    fontSize: 9,
    color: "#F4C869",
    fontWeight: "600",
    textAlign: "right",
  },
  restoreButton: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  restoreText: {
    fontSize: 12,
    color: "#FFF3F6",
    fontFamily: "System",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  legalContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 16,
    fontFamily: "System",
  },
  infoCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    fontSize: 12,
    color: "#F4C869",
    fontFamily: "System",
    fontWeight: "600",
    flex: 1,
    lineHeight: 16,
  },
});