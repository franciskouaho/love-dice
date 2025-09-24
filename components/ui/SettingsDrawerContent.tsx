import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useAnalytics from "../../hooks/useAnalytics";

import { useInAppReview } from "../../hooks/useInAppReview";
import useNotifications from "../../hooks/useNotifications";
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from "../../utils/quota";

interface SettingsDrawerContentProps {
  onClose: () => void;
}

export default function SettingsDrawerContent({
  onClose,
}: SettingsDrawerContentProps) {
  const { logEvent: logAnalyticsEvent } = useAnalytics();
  const { openStoreReview, hasUserReviewed } = useInAppReview();
  const {
    hasPermissions,
    preferences: notificationPreferences,
    updatePreferences: updateNotificationPreferences,
    requestPermissions,
    isReminderEnabled,
    reminderCount,
  } = useNotifications();

  const [preferences, setPreferences] = useState<UserPreferences>({
    haptics: true,
    weights: { payer: 0.2, repas: 0.2, activite: 0.6 },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getUserPreferences();
      setPreferences(prefs);
    } catch (error) {
      // Erreur chargement préférences ignorée
    }
  };

  const savePrefs = async (newPrefs: UserPreferences) => {
    try {
      await saveUserPreferences(newPrefs);
      setPreferences(newPrefs);
      if (preferences.haptics) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (error) {
      // Erreur sauvegarde préférences ignorée
      if (preferences.haptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleHapticsToggle = async (value: boolean) => {
    const newPrefs = { ...preferences, haptics: value };
    await savePrefs(newPrefs);
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value && !hasPermissions) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permissions requises",
          "Pour recevoir des notifications, veuillez autoriser l'accès dans les paramètres de votre appareil.",
          [{ text: "OK" }],
        );
        return;
      }
    }

    const newPrefs = { ...notificationPreferences, enabled: value };
    await updateNotificationPreferences(newPrefs);
    if (preferences.haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleContact = async () => {
    if (preferences.haptics) {
      await Haptics.selectionAsync();
    }

    const subject = "Contact Love Dice";
    const body =
      "Bonjour,\n\nJe vous contacte concernant l'application Love Dice.\n\n";
    const mailto = `mailto:contact@emplica.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailto);
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir l'application email. Vous pouvez nous contacter directement à contact@emplica.fr",
        [{ text: "OK" }],
      );
    }
  };

  const handlePrivacyPolicy = async () => {
    if (preferences.haptics) {
      await Haptics.selectionAsync();
    }

    try {
      await Linking.openURL("https://lovedice.emplica.fr/privacy");
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir la politique de confidentialité.",
        [{ text: "OK" }],
      );
    }
  };

  const handleTermsOfService = async () => {
    if (preferences.haptics) {
      await Haptics.selectionAsync();
    }

    try {
      await Linking.openURL("https://lovedice.emplica.fr/terms");
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir les conditions d'utilisation.",
        [{ text: "OK" }],
      );
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    await updateNotificationPreferences({ eveningReminders: value });
    if (preferences.haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleMilestoneToggle = async (value: boolean) => {
    await updateNotificationPreferences({ milestoneAlerts: value });
    if (preferences.haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTestNotifications = async () => {
    try {
      if (preferences.haptics) {
        await Haptics.selectionAsync();
      }

      Alert.alert(
        "Diagnostic Notifications 🔔",
        "Les notifications sont configurées et fonctionnelles.",
        [{ text: "OK" }],
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'effectuer le diagnostic des notifications.",
        [{ text: "OK" }],
      );
    }
  };

  const handlePremiumPress = async () => {
    try {
      if (preferences.haptics) {
        await Haptics.selectionAsync();
      }
      onClose(); // Fermer le drawer d'abord
      router.push("/paywall");
    } catch (error) {
      // Erreur navigation paywall ignorée
    }
  };

  const handleReviewApp = async () => {
    try {
      if (preferences.haptics) {
        await Haptics.selectionAsync();
      }
      const hasReviewed = await hasUserReviewed();

      if (hasReviewed) {
        Alert.alert(
          "Merci ! 💕",
          "Vous avez déjà évalué Love Dice. Votre avis nous aide énormément !",
          [{ text: "OK" }],
        );
      } else {
        logAnalyticsEvent("review_prompted", {
          trigger_count: 0,
          source: "settings_drawer",
          timestamp: Date.now(),
        });

        Alert.alert(
          "Vous aimez Love Dice ? 💕",
          "Votre avis nous aide à améliorer l&apos;app et à aider d&apos;autres couples !",
          [
            { text: "Plus tard", style: "cancel" },
            {
              text: "Évaluer",
              onPress: async () => {
                await openStoreReview();
              },
            },
          ],
        );
      }
    } catch (error) {
      // Erreur demande review ignorée
    }
  };

  return (
    <LinearGradient colors={["#F8F9FA", "#F8F9FA"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.subtitle}>
          Personnalisez votre expérience Love Dice
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Premium Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={handlePremiumPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#F4C869", "#E0115F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumIcon}>
                  <Ionicons name="diamond" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumTitle}>Accès à vie 💎</Text>
                  <Text style={styles.premiumSubtitle}>
                    Lancers illimités • Dés personnalisables • Aucune pub
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Configuration</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name="videocam" size={20} color="#E0115F" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Animations</Text>
                <Text style={styles.settingSubtext}>
                  Effets visuels lors du lancer de dé
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              trackColor={{ false: "#E0E0E0", true: "#FF4F7B" }}
              thumbColor="#E0115F"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name="phone-portrait" size={20} color="#E0115F" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Vibrations haptiques</Text>
                <Text style={styles.settingSubtext}>
                  Retour tactile lors des interactions
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.haptics}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: "#E0E0E0", true: "#FF4F7B" }}
              thumbColor={preferences.haptics ? "#E0115F" : "#999999"}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name="notifications" size={20} color="#E0115F" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingSubtext}>
                  Recevoir des rappels et alertes
                </Text>
              </View>
            </View>
            <Switch
              value={notificationPreferences.enabled && hasPermissions}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: "#E0E0E0", true: "#FF4F7B" }}
              thumbColor={
                notificationPreferences.enabled ? "#E0115F" : "#999999"
              }
            />
          </View>

          {notificationPreferences.enabled && hasPermissions && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <View style={styles.settingIcon}>
                    <Ionicons name="time" size={20} color="#E0115F" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Rappels du soir</Text>
                    <Text style={styles.settingSubtext}>
                      Rappel quotidien à 19h pour votre soirée
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationPreferences.eveningReminders}
                  onValueChange={handleReminderToggle}
                  trackColor={{ false: "#E0E0E0", true: "#FF4F7B" }}
                  thumbColor={
                    notificationPreferences.eveningReminders
                      ? "#E0115F"
                      : "#999999"
                  }
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingContent}>
                  <View style={styles.settingIcon}>
                    <Ionicons name="trophy" size={20} color="#E0115F" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>
                      Succès et milestones
                    </Text>
                    <Text style={styles.settingSubtext}>
                      Célébrer vos accomplissements
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationPreferences.milestoneAlerts}
                  onValueChange={handleMilestoneToggle}
                  trackColor={{ false: "#E0E0E0", true: "#FF4F7B" }}
                  thumbColor={
                    notificationPreferences.milestoneAlerts
                      ? "#E0115F"
                      : "#999999"
                  }
                />
              </View>

              {isReminderEnabled && (
                <View style={styles.notificationInfo}>
                  <Text style={styles.notificationInfoText}>
                    📅 {reminderCount} rappel{reminderCount > 1 ? "s" : ""}{" "}
                    programmé{reminderCount > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Debug Section (Development only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ Debug</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleTestNotifications}
              activeOpacity={0.7}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="bug" size={20} color="#E0115F" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingLabel}>Test Notifications</Text>
                  <Text style={styles.settingSubtext}>
                    Diagnostic et tests push notifications
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A50848" />
            </TouchableOpacity>
          </View>
        )}

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💕 Support</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleReviewApp}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name="star" size={20} color="#E0115F" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>
                  Évaluer l&apos;application
                </Text>
                <Text style={styles.settingSubtext}>
                  Aidez-nous avec un avis sur le store
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A50848" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleContact}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color="#E0115F"
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Nous contacter</Text>
                <Text style={styles.settingSubtext}>
                  Questions, suggestions ou problèmes
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A50848" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color="#E0115F"
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Politique de confidentialité</Text>
                <Text style={styles.settingSubtext}>
                  Comment nous protégeons vos données
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A50848" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTermsOfService}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color="#E0115F"
                />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Conditions d&apos;utilisation</Text>
                <Text style={styles.settingSubtext}>
                  Termes et conditions d&apos;usage
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A50848" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.versionText}>
            Love Dice v{Constants.expoConfig?.version}
          </Text>
          <Text style={styles.madeWithLove}>Fait avec 💕 pour les couples</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0E0E10",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#A50848",
    opacity: 0.8,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    paddingBottom: 20,
    backgroundColor: "#F8F9FA",
  },

  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0E0E10",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(224, 17, 95, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E0E10",
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 14,
    color: "#A50848",
    opacity: 0.7,
  },
  dangerText: {
    color: "#E74C3C",
  },
  aboutSection: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  versionText: {
    fontSize: 14,
    color: "#A50848",
    opacity: 0.6,
    marginBottom: 4,
  },
  madeWithLove: {
    fontSize: 12,
    color: "#A50848",
    opacity: 0.5,
  },
  notificationInfo: {
    backgroundColor: "rgba(224, 17, 95, 0.05)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#E0115F",
  },
  notificationInfoText: {
    fontSize: 14,
    color: "#A50848",
    fontWeight: "500",
  },
  premiumButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
    shadowColor: "#E0115F",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  premiumGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
});
