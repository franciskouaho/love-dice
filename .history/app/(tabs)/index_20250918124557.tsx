import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RealDice3D } from "../../components/RealDice3D";
import BottomDrawer from "../../components/ui/BottomDrawer";
import SettingsDrawerContent from "../../components/ui/SettingsDrawerContent";
import useAnalytics from "../../hooks/useAnalytics";
import { useFaces } from "../../hooks/useFaces";
import { useInAppReview } from "../../hooks/useInAppReview";
import useNotifications from "../../hooks/useNotifications";
import useQuota from "../../hooks/useQuota";
import useRevenueCat from "../../hooks/useRevenueCat";
import { getCurrentUserId } from "../../services/firestore";
import { CompleteDiceResult, rollCompleteDice } from "../../utils/dice";
import { getLastRoll, saveLastRoll } from "../../utils/quota";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const { logDiceRoll, logFreeLimitHit } = useAnalytics();
  const { remaining, canRoll, consumeRoll, hasLifetime, refreshQuota } =
    useQuota();
  const { hasLifetime: rcHasLifetime } = useRevenueCat();
  const { triggerReviewAfterSuccess } = useInAppReview();
  const { allFaces, loading: facesLoading, getRandomFace } = useFaces();
  const {
    hasPermissions,
    notifyMilestone,
    requestPermissions,
    isInitialized: notificationsInitialized,
  } = useNotifications();

  const [currentRoll, setCurrentRoll] = useState<CompleteDiceResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isDiceAnimating, setIsDiceAnimating] = useState(false);
  const [lastFaceId, setLastFaceId] = useState<string | null>(null);
  const [isSettingsDrawerVisible, setIsSettingsDrawerVisible] = useState(false);
  const [isNamesModalVisible, setIsNamesModalVisible] = useState(false);
  const [playerNames, setPlayerNames] = useState({ player1: "", player2: "" });
  const [rollCount, setRollCount] = useState(0);

  // Animation refs
  const diceRotation = useRef(new Animated.Value(0)).current;
  const diceScale = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Charger le dernier lancer au démarrage
    loadLastRoll();
    refreshQuota();

    // Demander les permissions de notifications si pas encore accordées
    if (notificationsInitialized && !hasPermissions) {
      // Attendre un peu avant de demander pour ne pas être intrusif
      setTimeout(() => {
        requestPermissions();
      }, 3000);
    }

    // Start floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Start glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const loadLastRoll = async () => {
    try {
      const lastRollId = await getLastRoll();
      if (lastRollId) {
        setLastFaceId(lastRollId);
      }
    } catch (error) {
      console.error("Erreur chargement dernier roll:", error);
    }
  };

  const handleRoll = async () => {
    if (isRolling) return;

    // Vérifier si les faces sont chargées
    if (facesLoading || allFaces.length === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Vérifier si l'utilisateur peut lancer
    if (!hasLifetime && !rcHasLifetime && !canRoll) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logFreeLimitHit(0, "home_button");
      router.push("/paywall");
      return;
    }

    // Demander les noms si pas encore renseignés
    if (!playerNames.player1.trim() || !playerNames.player2.trim()) {
      setIsNamesModalVisible(true);
      return;
    }

    performRoll();
  };

  const handleDiceAnimationComplete = () => {
    setIsDiceAnimating(false);
    setIsRolling(false);
  };

  const performRoll = async () => {
    try {
      setIsRolling(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Masquer le résultat précédent
      Animated.timing(resultOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animation de rotation du dé
      diceRotation.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(diceRotation, {
            toValue: 360 * 3, // 3 tours complets
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(diceScale, {
              toValue: 1.15,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(diceScale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(async () => {
        // Lancer le dé complet
        if (allFaces.length === 0) {
          console.error("Aucune face disponible");
          return;
        }

        const completeResult = rollCompleteDice(allFaces, currentRoll || undefined, playerNames);

        setCurrentRoll(completeResult);
        setLastFaceId(completeResult.id);
        
        // Déclencher l'animation des dés 3D
        setIsDiceAnimating(true);

        // Sauvegarder le dernier lancer
        await saveLastRoll(completeResult.id);

        // Consommer un lancer si pas d'accès à vie
        if (!hasLifetime && !rcHasLifetime) {
          await consumeRoll();
        }

        // Ajouter à l'historique si connecté (TODO: adapter pour le résultat complet)
        const userId = getCurrentUserId();
        if (userId && (hasLifetime || rcHasLifetime)) {
          // Pour l'instant, on log juste l'activité principale
          // await addToHistory(userId, completeResult);
        }

        // Analytics - log chaque catégorie
        logDiceRoll({
          category: "payer",
          label: completeResult.payer.label,
          face_id: completeResult.payer.id,
          is_custom: false,
          roll_number_today: 3 - remaining + 1,
        });
        logDiceRoll({
          category: "repas", 
          label: completeResult.repas.label,
          face_id: completeResult.repas.id,
          is_custom: false,
          roll_number_today: 3 - remaining + 1,
        });
        logDiceRoll({
          category: "activite",
          label: completeResult.activite.label, 
          face_id: completeResult.activite.id,
          is_custom: false,
          roll_number_today: 3 - remaining + 1,
        });

        // Haptic feedback de succès
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        // Afficher le résultat
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        // Déclencher potentiellement une demande de review après un lancer réussi
        triggerReviewAfterSuccess();

        // Incrémenter le compteur de lancers et vérifier les milestones
        const newRollCount = rollCount + 1;
        setRollCount(newRollCount);

        // Vérifier les milestones pour les notifications
        if (hasPermissions && [10, 50, 100, 500].includes(newRollCount)) {
          await notifyMilestone(newRollCount);
        }
      });
    } catch (error) {
      console.error("Erreur lancer de dé:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsRolling(false);
      setIsDiceAnimating(false);
    }
  };

  const handleNamesSubmit = async () => {
    if (!playerNames.player1.trim() || !playerNames.player2.trim()) {
      Alert.alert(
        "Noms requis",
        "Veuillez saisir les deux prénoms pour continuer.",
      );
      return;
    }

    setIsNamesModalVisible(false);
    await Haptics.selectionAsync();
    performRoll();
  };

  const handleSkipNames = async () => {
    setPlayerNames({ player1: "Mon cœur", player2: "Mon amour" });
    setIsNamesModalVisible(false);
    await Haptics.selectionAsync();
    performRoll();
  };


  const openSettings = async () => {
    await Haptics.selectionAsync();
    setIsSettingsDrawerVisible(true);
  };

  const closeSettingsDrawer = () => {
    setIsSettingsDrawerVisible(false);
  };

  const openHistory = () => {
    if (hasLifetime || rcHasLifetime) {
      router.push("/history");
    }
  };

  const getDiceRotation = () => {
    return diceRotation.interpolate({
      inputRange: [0, 360],
      outputRange: ["0deg", "360deg"],
    });
  };

  const getFloatTransform = () => {
    return floatAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -15],
    });
  };


  const remainingText = hasLifetime || rcHasLifetime ? "∞" : `${remaining}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#A50848", "#E0115F", "#FF4F7B"]}
        style={styles.backgroundGradient}
      />

      {/* Background Blur Effect */}
      <BlurView intensity={15} style={styles.backgroundBlur} />

      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.controlButton}>
            <View style={styles.blurContainer}>
              <Text style={styles.remainingText}>{remainingText}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.controlButton} onPress={openSettings}>
            <View style={styles.blurContainer}>
              <Ionicons name="settings" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Main Display */}
        <View style={styles.mainDisplayContainer}>
          <View style={styles.mainDisplay}>
            {currentRoll ? (
              <RealDice3D
                result={currentRoll}
                isAnimating={isDiceAnimating}
                onAnimationComplete={handleDiceAnimationComplete}
              />
            ) : (
              <RealDice3D
                result={{
                  id: 'default',
                  payer: { label: 'Tu paies', emoji: '💰', category: 'payer' },
                  repas: { label: 'Livraison', emoji: '🍕', category: 'repas' },
                  activite: { label: 'Jeu de société', emoji: '🎲', category: 'activite' },
                  timestamp: Date.now(),
                  date: new Date().toISOString().split('T')[0]
                }}
                isAnimating={false}
                onAnimationComplete={() => {}}
              />
            )}
          </View>
        </View>

        {/* Side Controls */}
        <View style={styles.sideControls}>
          {/* Left Side */}
          <View style={styles.leftControls}>
            {(hasLifetime || rcHasLifetime) && (
              <>
                <TouchableOpacity
                  style={styles.sideButton}
                  onPress={openHistory}
                >
                  <View style={styles.sideBlur}>
                    <Text style={styles.sideEmoji}>📝</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sideButton}>
                  <View style={styles.sideBlur}>
                    <Text style={styles.sideEmoji}>💕</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Right Side */}
          <View style={styles.rightControls}>
          </View>
        </View>
      </View>

      {/* Quota Display */}
      {!hasLifetime && !rcHasLifetime && (
        <View style={styles.quotaContainer}>
          <View style={styles.quotaBlur}>
            <Text style={styles.quotaText}>
              {remaining}/3 lancers restants aujourd&apos;hui
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push("/paywall")}
        >
          <View style={styles.bottomBlur}>
            <Text style={styles.bottomButtonText}>💎</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomButton, styles.mainActionButton]}
          onPress={handleRoll}
          disabled={isRolling}
        >
          <View style={[styles.bottomBlur, styles.mainActionBlur]}>
            <Text style={styles.mainActionText}>
              {isRolling ? "Lancement..." : "Lancer"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomButton}>
          <View style={styles.bottomBlur}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Tab Bar with Love Dice Logo */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBarContent}></View>
      </View>

      {/* Floating Particles */}
      <View style={styles.particlesContainer}>
        {[...Array(8)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: `${10 + index * 10}%`,
                top: `${20 + (index % 3) * 20}%`,
                opacity: 0.6,
              },
            ]}
          />
        ))}
      </View>

      {/* Names Input Modal */}
      <Modal
        visible={isNamesModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>👫 Prénoms des joueurs</Text>
            <Text style={styles.modalSubtitle}>
              Pour personnaliser vos résultats
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="Prénom du premier joueur"
                placeholderTextColor="#A50848"
                value={playerNames.player1}
                onChangeText={(text) =>
                  setPlayerNames((prev) => ({ ...prev, player1: text }))
                }
                maxLength={20}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="Prénom du second joueur"
                placeholderTextColor="#A50848"
                value={playerNames.player2}
                onChangeText={(text) =>
                  setPlayerNames((prev) => ({ ...prev, player2: text }))
                }
                maxLength={20}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.skipButton]}
                onPress={handleSkipNames}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>Passer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleNamesSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Drawer */}
      <BottomDrawer
        visible={isSettingsDrawerVisible}
        onClose={closeSettingsDrawer}
      >
        <SettingsDrawerContent onClose={closeSettingsDrawer} />
      </BottomDrawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A50848",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundBlur: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 4 : 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    gap: 16,
  },
  headerRight: {
    flexDirection: "row",
    gap: 16,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  blurContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  remainingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  mainDisplayContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  mainDisplay: {
    width: "100%",
    height: width * 0.8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  diceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  diceEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  diceLabel: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "600",
  },
  resultContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  resultEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  completeResult: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  resultTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
    width: "100%",
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: 12,
    width: 40,
    textAlign: "center",
  },
  compactLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    flex: 1,
    textAlign: "left",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sideControls: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  leftControls: {
    alignItems: "center",
    gap: 24,
  },
  rightControls: {
    alignItems: "center",
    gap: 24,
    marginTop: 320,
  },
  sideButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  sideBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  sideEmoji: {
    fontSize: 24,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 20,
    gap: 20,
  },
  bottomButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
  },
  bottomBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  mainActionButton: {
    width: 140,
    height: 70,
    borderRadius: 35,
  },
  mainActionBlur: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  bottomButtonText: {
    fontSize: 24,
  },
  mainActionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  quotaContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  quotaBlur: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  quotaText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 1)",
    fontWeight: "500",
  },
  particlesContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  particle: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
  tabBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 30,
  },
  tabBarContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabBarEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabBarText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0E0E10",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#A50848",
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: "#FFF3F6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0E0E10",
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.2)",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  skipButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  confirmButton: {
    backgroundColor: "#E0115F",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
