import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { AnimatedDice } from "../../components/AnimatedDice";
import BottomDrawer from "../../components/ui/BottomDrawer";
import SettingsDrawerContent from "../../components/ui/SettingsDrawerContent";
import useAnalytics from "../../hooks/useAnalytics";
import { useFaces } from "../../hooks/useFaces";
import { useAuth } from "../../hooks/useFirebase";
import { useInAppReview } from "../../hooks/useInAppReview";
import useNotifications from "../../hooks/useNotifications";
import useQuota from "../../hooks/useQuota";
import useRevenueCat from "../../hooks/useRevenueCat";
import { useShake } from "../../hooks/useShake";

import { createAnonymousUser } from "../../services/firebase";
import * as FirestoreService from "../../services/firestore";
import { CompleteDiceResult, rollCompleteDice } from "../../utils/dice";
import { getLastRoll, saveLastRoll } from "../../utils/quota";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { user, loading: authLoading, grantUnlimitedAccess } = useAuth();
  const { logDiceRoll, logFreeLimitHit } = useAnalytics();
  const { remaining, canRoll, consumeRoll, hasLifetime, refreshQuota } =
    useQuota();
  const { hasLifetime: rcHasLifetime } = useRevenueCat();
  const { triggerReviewAfterSuccess } = useInAppReview();
  const { allFaces, loading: facesLoading } = useFaces();
  const {
    hasPermissions,
    notifyMilestone,
    requestPermissions,
    isInitialized: notificationsInitialized,
  } = useNotifications();

  const [currentRoll, setCurrentRoll] = useState<CompleteDiceResult | null>(
    null,
  );
  const [isRolling, setIsRolling] = useState(false);
  const [isShakingDice, setIsShakingDice] = useState(false);
  const [isSettingsDrawerVisible, setIsSettingsDrawerVisible] = useState(false);
  const [isNamesModalVisible, setIsNamesModalVisible] = useState(false);
  const [playerNames, setPlayerNames] = useState({ player1: "", player2: "" });
  const [playerNamesLoaded, setPlayerNamesLoaded] = useState(false);
  const [defaultPayerName, setDefaultPayerName] = useState("");
  const [rollCount, setRollCount] = useState(0);
  const [hasSeenPaywallToday, setHasSeenPaywallToday] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const safetyTimeoutRef = useRef<number | null>(null);


  // Animation refs
  const diceRotation = useRef(new Animated.Value(0)).current;
  const diceScale = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  // Fonction pour charger les noms sauvegardés depuis Firebase
  const loadPlayerNames = async () => {
    try {
      // Utiliser l'utilisateur du hook useAuth au lieu de getCurrentUserId
      if (!user?.uid) {
        console.log("ℹ️ Pas d'utilisateur connecté, utilisation des noms par défaut");
        const defaultNames = { player1: "Mon cœur", player2: "Mon amour" };
        setPlayerNames(defaultNames);
        const randomName =
          Math.random() < 0.5 ? defaultNames.player1 : defaultNames.player2;
        setDefaultPayerName(`${randomName} paie`);
        setPlayerNamesLoaded(true);
        return;
      }

      const firebaseNames = await FirestoreService.getPlayerNames(user.uid);
      if (firebaseNames && firebaseNames.player1 && firebaseNames.player2) {
        // Nettoyer les noms dès le chargement
        const cleanNames = {
          player1: firebaseNames.player1.trim(),
          player2: firebaseNames.player2.trim(),
        };
        setPlayerNames(cleanNames);
        // Créer un nom par défaut stable pour l'affichage
        const randomName =
          Math.random() < 0.5 ? cleanNames.player1 : cleanNames.player2;
        setDefaultPayerName(`${randomName} paie`);
      } else {
        // Pas de noms sauvegardés, utiliser des noms par défaut
        const defaultNames = { player1: "Mon cœur", player2: "Mon amour" };
        setPlayerNames(defaultNames);
        // Créer un nom par défaut stable
        const randomName =
          Math.random() < 0.5 ? defaultNames.player1 : defaultNames.player2;
        setDefaultPayerName(`${randomName} paie`);
      }
    } catch (error) {
      // Erreur lors du chargement des noms depuis Firebase - utiliser des noms par défaut
      const defaultNames = { player1: "Mon cœur", player2: "Mon amour" };
      setPlayerNames(defaultNames);
      const randomName =
        Math.random() < 0.5 ? defaultNames.player1 : defaultNames.player2;
      setDefaultPayerName(`${randomName} paie`);
    } finally {
      setPlayerNamesLoaded(true);
    }
  };

  // Fonction pour sauvegarder les noms dans Firebase
  const savePlayerNamesLocal = async (names: {
    player1: string;
    player2: string;
  }) => {
    try {
      if (!user?.uid) {
        // Pas d'utilisateur connecté pour sauvegarder les noms
        return;
      }

      const success = await FirestoreService.savePlayerNames(user.uid, names);
      // Sauvegarde réalisée
    } catch (error) {
      // Erreur lors de la sauvegarde des noms
    }
  };

  useEffect(() => {
    // Charger le dernier lancer au démarrage
    loadLastRoll();
    refreshQuota();

    // Afficher automatiquement la modal des noms SEULEMENT au premier lancement
    const checkFirstLaunch = async () => {
      try {
        const hasSeenNamesModal = await AsyncStorage.getItem(
          "has_seen_names_modal",
        );

        // Vérifier si l'utilisateur a des noms dans Firebase
        let hasNames = false;
        if (user?.uid) {
          const firebaseNames = await FirestoreService.getPlayerNames(user.uid);
          hasNames = !!(
            firebaseNames &&
            firebaseNames.player1.trim() &&
            firebaseNames.player2.trim()
          );
        }

        if (!hasSeenNamesModal && !hasNames) {
          setTimeout(() => {
            setIsNamesModalVisible(true);
          }, 1000);
          // Marquer comme vu pour ne plus jamais le reproposer automatiquement
          await AsyncStorage.setItem("has_seen_names_modal", "true");
        }
      } catch (error) {
        // Erreur vérification premier lancement ignorée
      }
    };

    checkFirstLaunch();

    // Réinitialiser le flag paywall chaque jour
    const checkPaywallFlag = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const lastPaywallDate = await AsyncStorage.getItem("last_paywall_date");

        if (lastPaywallDate !== today) {
          setHasSeenPaywallToday(false);
          await AsyncStorage.setItem("last_paywall_date", today);
        } else {
          const hasSeenToday = await AsyncStorage.getItem(
            "has_seen_paywall_today",
          );
          setHasSeenPaywallToday(hasSeenToday === "true");
        }
      } catch (error) {
        // Erreur gestion paywall flag ignorée
      }
    };
    checkPaywallFlag();

    // Demander les permissions de notifications si pas encore accordées
    if (notificationsInitialized && !hasPermissions) {
      requestPermissions();
    }
  }, [hasPermissions, notificationsInitialized, requestPermissions]);

  // Charger les noms des joueurs quand l'utilisateur est disponible
  useEffect(() => {
    if (!authLoading) {
      loadPlayerNames();
    }
  }, [user?.uid, authLoading]);

  // Animation effects
  useEffect(() => {
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
      await getLastRoll();
    } catch (error) {
      // Erreur chargement dernier roll ignorée
    }
  };

  // Hook pour détecter la secousse du téléphone
  // Hook pour détecter la secousse et lancer le dé
  useShake({
    threshold: 1.5, // Seuil moins sensible pour éviter les faux positifs
    timeWindow: 5000, // Délai plus long entre les secousses (5 secondes)
    onShake: async () => {
      // Éviter les multiples secousses pendant un lancement ou si déjà bloqué
      if (isRolling || isBlocked) {
        return;
      }

      // VÉRIFIER LES QUOTAS AVANT DE PERMETTRE LE SECOUER
      if (!hasLifetime && !rcHasLifetime && !canRoll) {
        // Bloquer pour une durée plus longue pour éviter le spam
        setIsBlocked(true);
        setTimeout(() => setIsBlocked(false), 8000); // 8 secondes de blocage

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        logFreeLimitHit(0, "shake");

        // Ne rediriger vers le paywall que si pas encore vu aujourd'hui
        if (!hasSeenPaywallToday) {
          setHasSeenPaywallToday(true);
          AsyncStorage.setItem("has_seen_paywall_today", "true");
          router.push("/paywall");
        }
        // Si déjà vu le paywall aujourd'hui, ne rien faire du tout
        // Pas d'alerte supplémentaire pour éviter le spam
        return;
      }

      // Déclencher l'animation de secousse des dés
      setIsShakingDice(true);
      setTimeout(() => setIsShakingDice(false), 300);

      // Ajouter un feedback haptique spécial pour la secousse
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // TOUJOURS relire les noms depuis Firebase au moment de la secousse
      // pour éviter les problèmes d'état React
      let finalNames = { player1: "Mon cœur", player2: "Mon amour" };

      try {
        // Utiliser l'utilisateur du hook au lieu de getCurrentUserId
        if (user?.uid) {
          const firebaseNames = await FirestoreService.getPlayerNames(user.uid);
          if (firebaseNames && firebaseNames.player1 && firebaseNames.player2) {
            finalNames = {
              player1: firebaseNames.player1.trim() || "Mon cœur",
              player2: firebaseNames.player2.trim() || "Mon amour",
            };
          }
        } else {
          console.log("⚠️ Utilisateur pas encore connecté, utilisation des noms par défaut");
        }
      } catch (error) {
        // Erreur lecture Firebase
        console.warn("⚠️ Erreur lors de la lecture des noms Firebase:", error);
      }

      handleRollWithNames(finalNames);
    },
  });

  const handleRollWithNames = async (customNames?: {
    player1: string;
    player2: string;
  }) => {
    const namesToUse = customNames || playerNames;
    return performRollWithNames(namesToUse);
  };

  const handleRoll = async () => {
    if (isRolling || isBlocked) {
      return;
    }

    // Vérifier si les faces sont chargées (mais ne pas bloquer)
    if (facesLoading || allFaces.length === 0) {
      // Ne pas bloquer, continuer avec des faces par défaut
    }

    // Vérifier si l'utilisateur peut lancer
    if (!hasLifetime && !rcHasLifetime && !canRoll) {
      // Bloquer temporairement pour éviter le spam
      setIsBlocked(true);
      setTimeout(() => setIsBlocked(false), 3000); // 3 secondes de blocage

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logFreeLimitHit(0, "home_button");

      // Ne rediriger vers le paywall que si pas encore vu aujourd'hui
      if (!hasSeenPaywallToday) {
        setHasSeenPaywallToday(true);
        AsyncStorage.setItem("has_seen_paywall_today", "true");
        router.push("/paywall");
      } else {
        // Afficher un message simple si déjà vu le paywall
        Alert.alert(
          "Quota épuisé",
          "Vous avez utilisé votre lancer gratuit quotidien. Achetez l'accès illimité pour continuer !",
          [
            { text: "Plus tard" },
            { text: "Acheter", onPress: () => router.push("/paywall") },
          ],
        );
      }
      return;
    }

    // Les noms sont maintenant gérés avant l'appel à handleRoll
    performRollWithNames(playerNames);
  };

  const handleDiceAnimationComplete = () => {
    setIsRolling(false);
  };

  const performRollWithNames = async (namesToUse: {
    player1: string;
    player2: string;
  }) => {
    try {
      setIsRolling(true);

      // Créer un utilisateur Firebase si nécessaire SEULEMENT au moment du premier lancer
      console.log("🔍 État avant création utilisateur:", { user: !!user, authLoading, userUid: user?.uid });
      if (!user && !authLoading) {
        console.log("🔧 Premier lancer détecté - création d'un utilisateur Firebase...");
        try {
          const newUser = await createAnonymousUser();
          console.log("✅ Utilisateur créé pour le premier lancer:", newUser?.uid);
          // Attendre un peu que l'auth se propage
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log("🔍 État après création:", { user: !!user, userUid: user?.uid });
        } catch (error) {
          console.error("❌ Erreur création utilisateur:", error);
          console.warn("⚠️ Continuer quand même avec l'action");
        }
      } else {
        console.log("ℹ️ Pas besoin de créer d'utilisateur:", { hasUser: !!user, isLoading: authLoading });
      }

      // Timeout de sécurité pour débloquer isRolling
      safetyTimeoutRef.current = setTimeout(() => {
        setIsRolling(false);
      }, 5000);

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
        // Utiliser Firebase si disponible, sinon faces par défaut AVEC noms forcés
        let facesToUse = allFaces;
        if (allFaces.length === 0) {
          // Noms forcés
          const name1 = namesToUse.player1?.trim() || "Mon cœur";
          const name2 = namesToUse.player2?.trim() || "Mon amour";

          facesToUse = [
            {
              id: "default-payer-1",
              label: `${name1} paie`,
              emoji: "💰",
              category: "payer",
              weight: 1,
            },
            {
              id: "default-payer-2",
              label: `${name2} paie`,
              emoji: "💝",
              category: "payer",
              weight: 1,
            },
            {
              id: "default-repas-1",
              label: "Pizza",
              emoji: "🍕",
              category: "repas",
              weight: 1,
            },
            {
              id: "default-repas-2",
              label: "Sushi",
              emoji: "🍣",
              category: "repas",
              weight: 1,
            },
            {
              id: "default-activite-1",
              label: "Cinéma",
              emoji: "🎬",
              category: "activite",
              weight: 1,
            },
            {
              id: "default-activite-2",
              label: "Balade",
              emoji: "🚶",
              category: "activite",
              weight: 1,
            },
          ];
        }

        const completeResult = rollCompleteDice(
          facesToUse,
          currentRoll || undefined,
          namesToUse,
        );

        setCurrentRoll(completeResult);

        // Sauvegarder le résultat
        await saveLastRoll(completeResult.id);

        // Afficher le résultat avec une animation
        setTimeout(() => {
          Animated.timing(resultOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            if (safetyTimeoutRef.current) {
              clearTimeout(safetyTimeoutRef.current);
            }
            setIsRolling(false);
          });
        }, 200);

        // Analytics - log chaque catégorie séparément
        logDiceRoll({
          category: "payer",
          label: completeResult.payer.label,
          face_id: completeResult.payer.id,
          is_custom: false,
          roll_number_today: rollCount + 1,
        });
        logDiceRoll({
          category: "repas",
          label: completeResult.repas.label,
          face_id: completeResult.repas.id,
          is_custom: false,
          roll_number_today: rollCount + 1,
        });
        logDiceRoll({
          category: "activite",
          label: completeResult.activite.label,
          face_id: completeResult.activite.id,
          is_custom: false,
          roll_number_today: rollCount + 1,
        });

        // Consommer un lancer si pas premium
        if (!hasLifetime && !rcHasLifetime) {
          const consumed = await consumeRoll();
          if (!consumed) {
            router.push("/paywall");
            return;
          }
        }

        // Trigger notification pour milestones
        const newCount = rollCount + 1;
        setRollCount(newCount);
        notifyMilestone(newCount);

        // Trigger review après succès
        triggerReviewAfterSuccess();
      });
    } catch (error) {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      setIsRolling(false);
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

    // Créer un utilisateur Firebase si nécessaire pour sauvegarder les noms
    if (!user && !authLoading) {
      console.log("🔧 Sauvegarde des noms - création d'un utilisateur Firebase...");
      try {
        await createAnonymousUser();
        console.log("✅ Utilisateur créé pour sauvegarder les noms");
        // Attendre un peu que l'auth se propage
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn("⚠️ Erreur création utilisateur, continuer quand même:", error);
      }
    }

    // Sauvegarder les noms dans Firebase
    await savePlayerNamesLocal(playerNames);

    // Noms sauvegardés avec succès
    setIsNamesModalVisible(false);
    await Haptics.selectionAsync();

    // NE PAS lancer les dés ici - seulement sauvegarder
    // Les dés se lancent uniquement en secouant le téléphone
  };

  const handleSkipNames = async () => {
    const defaultNames = { player1: "Mon cœur", player2: "Mon amour" };
    setPlayerNames(defaultNames);

    // Créer un utilisateur Firebase si nécessaire pour sauvegarder les noms par défaut
    if (!user && !authLoading) {
      console.log("🔧 Sauvegarde des noms par défaut - création d'un utilisateur Firebase...");
      try {
        await createAnonymousUser();
        console.log("✅ Utilisateur créé pour sauvegarder les noms par défaut");
        // Attendre un peu que l'auth se propage
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn("⚠️ Erreur création utilisateur, continuer quand même:", error);
      }
    }

    // Sauvegarder les noms par défaut
    await savePlayerNamesLocal(defaultNames);

    setIsNamesModalVisible(false);
    await Haptics.selectionAsync();

    // NE PAS lancer les dés ici non plus - seulement sauvegarder
    // Les dés se lancent uniquement en secouant le téléphone
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
        <View style={styles.headerLeft}>{/* Espace vide à gauche */}</View>

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
        {/* Main Display Area */}
        <View style={styles.mainDisplayContainer}>
          <View style={styles.mainDisplay}>
            {currentRoll ? (
              <AnimatedDice
                result={currentRoll}
                isShaking={isShakingDice}
                isRolling={isRolling}
                onAnimationComplete={handleDiceAnimationComplete}
              />
            ) : playerNamesLoaded ? (
              <AnimatedDice
                result={{
                  id: "default",
                  payer: {
                    id: "default-payer",
                    label: defaultPayerName || "Tu paies",
                    emoji: "💰",
                    category: "payer",
                    weight: 1,
                  },
                  repas: {
                    id: "default-repas",
                    label: "Livraison",
                    emoji: "🍕",
                    category: "repas",
                    weight: 1,
                  },
                  activite: {
                    id: "default-activite",
                    label: "Jeu de société",
                    emoji: "🎲",
                    category: "activite",
                    weight: 1,
                  },
                  timestamp: Date.now(),
                  date: new Date().toISOString().split("T")[0],
                }}
                isShaking={false}
                isRolling={false}
              />
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            )}
          </View>

          {/* Instruction de secousse */}
          <Animated.View
            style={[styles.shakeInstruction, { opacity: floatAnimation }]}
          >
            <Text style={styles.shakeText} numberOfLines={1}>
              Secouez pour lancer
            </Text>
          </Animated.View>
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
          <View style={styles.rightControls}></View>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Bouton Premium à gauche */}
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={async () => {
            await Haptics.selectionAsync();
            router.push("/paywall");
          }}
        >
          <View style={styles.bottomBlur}>
            <Text style={styles.bottomButtonText}>💎</Text>
          </View>
        </TouchableOpacity>

        {/* 🧪 BOUTON TEST TEMPORAIRE : Accès illimité */}
        {user && (
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: 'rgba(0, 255, 0, 0.3)' }]}
            onPress={async () => {
              console.log("🧪 Activation accès illimité pour test...");
              await grantUnlimitedAccess(user.uid);
              await refreshQuota();
              console.log("✅ Accès illimité activé ! Quotas rafraîchis.");
            }}
          >
            <View style={styles.bottomBlur}>
              <Text style={styles.bottomButtonText}>🧪</Text>
            </View>
          </TouchableOpacity>
        )}


        {/* Bouton Noms au milieu */}
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => setIsNamesModalVisible(true)}
        >
          <View style={styles.bottomBlur}>
            <Ionicons name="people" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Bouton compteur de lancers à droite */}
        <TouchableOpacity style={styles.bottomButton}>
          <View style={[styles.bottomBlur, isBlocked && styles.blockedBlur]}>
            <Text
              style={[styles.remainingText, isBlocked && styles.blockedText]}
            >
              {isBlocked ? "⏳" : remainingText}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  shakeInstruction: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  shakeText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 300,
  },
  blockedBlur: {
    backgroundColor: "rgba(255, 107, 107, 0.3)",
    borderColor: "rgba(255, 107, 107, 0.5)",
  },
  blockedText: {
    color: "#FF6B6B",
  },
});
