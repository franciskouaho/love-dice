import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import {
  initializeNotifications,
  scheduleEveningReminder,
  scheduleMilestoneNotification,
  updateNotificationPreferences,
  cancelAllNotifications,
  getScheduledNotifications,
  addNotificationListeners,
  NotificationPreferences,
  ScheduledNotification,
} from "../services/notifications";
import { getCurrentUserId } from "../services/firestore";

interface NotificationState {
  isInitialized: boolean;
  hasPermissions: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences;
  scheduledNotifications: ScheduledNotification[];
  error: string | null;
}

interface NotificationActions {
  requestPermissions: () => Promise<boolean>;
  scheduleReminder: (time?: string) => Promise<void>;
  notifyMilestone: (rollCount: number) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  cancelAll: () => Promise<void>;
  refreshScheduled: () => Promise<void>;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  eveningReminders: true,
  milestoneAlerts: true,
  weeklyDigest: false,
  marketingEmails: false,
  reminderTime: "19:00",
};

export const useNotifications = (): NotificationState & NotificationActions => {
  const [state, setState] = useState<NotificationState>({
    isInitialized: false,
    hasPermissions: false,
    isLoading: true,
    preferences: defaultPreferences,
    scheduledNotifications: [],
    error: null,
  });

  // Initialiser les notifications au montage du hook
  useEffect(() => {
    let mounted = true;

    // Attendre que Firebase soit prêt avant d'initialiser
    const checkFirebaseAndInit = async () => {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts && mounted) {
        try {
          const userId = getCurrentUserId();
          if (userId !== null) {
            // Firebase est prêt
            await initializeNotificationService();
            break;
          }
        } catch (error) {
          // Firebase pas encore prêt
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (attempts >= maxAttempts && mounted) {
        // Initialiser quand même avec les valeurs par défaut
        await initializeNotificationService();
      }
    };

    checkFirebaseAndInit();

    // Configurer les listeners
    const listeners = addNotificationListeners();

    // Gérer les changements d'état de l'app
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      mounted = false;
      listeners.foregroundSubscription?.remove();
      listeners.responseSubscription?.remove();
      appStateSubscription?.remove();
    };
  }, []);

  // Initialiser le service de notifications
  const initializeNotificationService = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const hasPermissions = await initializeNotifications();

      // Charger les préférences sauvegardées
      await loadUserPreferences();

      // Charger les notifications programmées
      const scheduled = await getScheduledNotifications();

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        hasPermissions,
        isLoading: false,
        scheduledNotifications: scheduled,
      }));

      // Logger l'initialisation
      console.log("Notifications initialisées", {
        hasPermissions,
        scheduledCount: scheduled.length,
      });
    } catch (error) {
      console.error("Erreur initialisation notifications:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erreur initialisation",
      }));
    }
  }, []);

  // Charger les préférences utilisateur depuis Firestore
  const loadUserPreferences = useCallback(async () => {
    try {
      // Vérifier que Firebase est initialisé avant d'accéder à l'auth
      const userId = getCurrentUserId();
      if (!userId) {
        console.log(
          "📱 Pas d'utilisateur connecté, utilisation des préférences par défaut",
        );
        // Utiliser les préférences par défaut si pas d'utilisateur
        setState((prev) => ({
          ...prev,
          preferences: defaultPreferences,
        }));
        return;
      }

      // Les préférences sont stockées dans le profil utilisateur
      // On utilise les valeurs par défaut si pas encore définies
      setState((prev) => ({
        ...prev,
        preferences: defaultPreferences,
      }));
    } catch (error) {
      console.error("Erreur chargement préférences notifications:", error);
      // En cas d'erreur, utiliser les préférences par défaut
      setState((prev) => ({
        ...prev,
        preferences: defaultPreferences,
      }));
    }
  }, []);

  // Rafraîchir la liste des notifications programmées
  const refreshScheduled = useCallback(async (): Promise<void> => {
    try {
      const scheduled = await getScheduledNotifications();
      setState((prev) => ({
        ...prev,
        scheduledNotifications: scheduled,
      }));
    } catch (error) {
      console.error("Erreur rafraîchissement notifications:", error);
    }
  }, []);

  // Programmer un rappel quotidien
  const scheduleReminder = useCallback(
    async (time?: string): Promise<void> => {
      try {
        if (!state.hasPermissions) {
          console.log("Pas de permissions pour programmer rappel");
          return;
        }

        const reminderTime = time || state.preferences.reminderTime;
        await scheduleEveningReminder(reminderTime);

        // Rafraîchir la liste des notifications programmées
        await refreshScheduled();

        console.log("Rappel programmé", {
          time: reminderTime,
        });
      } catch (error) {
        console.error("Erreur programmation rappel:", error);
        setState((prev) => ({
          ...prev,
          error: "Impossible de programmer le rappel",
        }));
      }
    },
    [state.hasPermissions, state.preferences.reminderTime],
  );

  // Gérer les changements d'état de l'application
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      // Rafraîchir les notifications programmées quand l'app revient au premier plan
      getScheduledNotifications()
        .then((scheduled) => {
          setState((prev) => ({
            ...prev,
            scheduledNotifications: scheduled,
          }));
        })
        .catch((error) => {
          console.error("Erreur rafraîchissement notifications:", error);
        });
    }
  }, []);

  // Demander les permissions de notifications
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === "granted";

      setState((prev) => ({
        ...prev,
        hasPermissions: granted,
        isLoading: false,
      }));

      if (granted) {
        // Programmer les rappels par défaut
        await scheduleReminder();
      }

      console.log("Permissions demandées", {
        granted,
        status,
      });

      return granted;
    } catch (error) {
      console.error("Erreur demande permissions:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Impossible de demander les permissions",
      }));
      return false;
    }
  }, [scheduleReminder]);

  // Notifier un milestone
  const notifyMilestone = useCallback(
    async (rollCount: number): Promise<void> => {
      try {
        if (!state.hasPermissions || !state.preferences.milestoneAlerts) {
          return;
        }

        await scheduleMilestoneNotification(rollCount);

        console.log("Notification milestone envoyée", {
          rollCount,
        });
      } catch (error) {
        console.error("Erreur notification milestone:", error);
      }
    },
    [state.hasPermissions, state.preferences.milestoneAlerts],
  );

  // Mettre à jour les préférences
  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>): Promise<void> => {
      try {
        const newPreferences = { ...state.preferences, ...prefs };

        // Sauvegarder dans Firestore
        await updateNotificationPreferences(newPreferences);

        // Mettre à jour l'état local
        setState((prev) => ({
          ...prev,
          preferences: newPreferences,
        }));

        // Reprogrammer les rappels si nécessaire
        if (prefs.eveningReminders !== undefined || prefs.reminderTime) {
          if (newPreferences.eveningReminders && newPreferences.enabled) {
            await scheduleReminder(newPreferences.reminderTime);
          } else {
            // Annuler les rappels si désactivés
            const { cancelNotificationsByType } = await import(
              "../services/notifications"
            );
            await cancelNotificationsByType("evening_reminder");
          }
        }

        console.log("Préférences notifications mises à jour", {
          ...prefs,
        });
      } catch (error) {
        console.error("Erreur mise à jour préférences:", error);
        setState((prev) => ({
          ...prev,
          error: "Impossible de sauvegarder les préférences",
        }));
      }
    },
    [state.preferences, scheduleReminder],
  );

  // Annuler toutes les notifications
  const cancelAll = useCallback(async (): Promise<void> => {
    try {
      await cancelAllNotifications();

      setState((prev) => ({
        ...prev,
        scheduledNotifications: [],
      }));

      console.log("Toutes les notifications annulées");
    } catch (error) {
      console.error("Erreur annulation notifications:", error);
      setState((prev) => ({
        ...prev,
        error: "Impossible d'annuler les notifications",
      }));
    }
  }, []);

  // Méthodes utilitaires
  const isReminderEnabled =
    state.preferences.enabled && state.preferences.eveningReminders;
  const isMilestoneEnabled =
    state.preferences.enabled && state.preferences.milestoneAlerts;
  const reminderCount = state.scheduledNotifications.filter(
    (n) => n.type === "evening_reminder",
  ).length;

  return {
    // État
    isInitialized: state.isInitialized,
    hasPermissions: state.hasPermissions,
    isLoading: state.isLoading,
    preferences: state.preferences,
    scheduledNotifications: state.scheduledNotifications,
    error: state.error,

    // Actions
    requestPermissions,
    scheduleReminder,
    notifyMilestone,
    updatePreferences,
    cancelAll,
    refreshScheduled,

    // Helpers
    isReminderEnabled,
    isMilestoneEnabled,
    reminderCount,
  } as NotificationState &
    NotificationActions & {
      isReminderEnabled: boolean;
      isMilestoneEnabled: boolean;
      reminderCount: number;
    };
};

export default useNotifications;
