import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import useAnalytics from "../../hooks/useAnalytics";

import { useInAppReview } from "../../hooks/useInAppReview";
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from "../../utils/quota";
import useNotifications from "../../hooks/useNotifications";
import { quickNotificationDiagnostic } from "../../utils/notifications-test";

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
      console.error("Erreur chargement préférences:", error);
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
      console.error("Erreur sauvegarde préférences:", error);
      if (preferences.haptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleHapticsToggle = async (value: boolean) => {
    const newPrefs = { ...preferences, haptics: value };
    await savePrefs(newPrefs);
  };

  const handleCustomFaces = async () => {
    if (preferences.haptics) {
      await Haptics.selectionAsync();
    }
    onClose();
    router.push("/custom-faces");
  };

  const handleHistory = async () => {
    if (preferences.haptics) {
      await Haptics.selectionAsync();
    }
    onClose();
    router.push("/history");
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

    await updateNotificationPreferences({ enabled: value });
    if (preferences.haptics) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      const diagnostic = await quickNotificationDiagnostic();

      Alert.alert("Diagnostic Notifications 🔔", diagnostic, [{ text: "OK" }], {
        style: "default",
      });
    } catch (error) {
      console.error("Erreur test notifications:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'effectuer le diagnostic des notifications.",
        [{ text: "OK" }],
      );
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
      console.error("Erreur demande review:", error);
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

        {/* Personnalisation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Apparence</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name="color-palette" size={20} color="#E0115F" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>
                  Thème de l&apos;application
                </Text>
                <Text style={styles.settingSubtext}>
                  Personnalisez l&apos;apparence
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A50848" />
          </TouchableOpacity>
        </View>

        {/* Contenu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎲 Contenu</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleCustomFaces}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name="create" size={20} color="#E0115F" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Personnaliser les faces</Text>
                <Text style={styles.settingSubtext}>
                  Créez vos propres idées
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A50848" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleHistory}
            activeOpacity={0.7}
          >
            <View style={styles.settingContent}>
              <View style={styles.settingIcon}>
                <Ionicons name="time" size={20} color="#E0115F" />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Historique</Text>
                <Text style={styles.settingSubtext}>
                  Consultez vos derniers lancers
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A50848" />
          </TouchableOpacity>
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
            onPress={() => {}}
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
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.versionText}>Love Dice v1.1.1 (3)</Text>
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
});
