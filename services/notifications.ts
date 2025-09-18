import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Types pour les notifications
export interface NotificationData {
  type: "reminder" | "milestone" | "feature" | "promotional";
  title: string;
  body: string;
  data?: any;
}

export interface ScheduledNotification {
  id: string;
  type: string;
  scheduledDate: Date;
  title: string;
  body: string;
}

// Interface pour les préférences de notifications
export interface NotificationPreferences {
  enabled: boolean;
  eveningReminders: boolean;
  milestoneAlerts: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  reminderTime: string; // Format "HH:MM"
}

// Préférences par défaut
const defaultPreferences: NotificationPreferences = {
  enabled: true,
  eveningReminders: true,
  milestoneAlerts: true,
  weeklyDigest: false,
  marketingEmails: false,
  reminderTime: "19:00", // 19h par défaut
};

/**
 * Demander les permissions de notifications
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === "web") {
      console.log("Notifications non supportées sur web");
      return false;
    }

    if (!Device.isDevice) {
      console.log("Notifications non supportées sur simulateur");
      return false;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission de notifications refusée");
      return false;
    }

    // Obtenir le token pour Firebase Cloud Messaging
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: "916106041141", // Notre project ID Firebase
    });

    console.log("Push token obtenu:", pushToken.data);

    // Sauvegarder le token dans Firestore
    await savePushToken(pushToken.data);

    return true;
  } catch (error) {
    console.error("Erreur demande permissions notifications:", error);
    return false;
  }
};

/**
 * Sauvegarder le push token dans Firestore
 */
const savePushToken = async (token: string): Promise<void> => {
  try {
    // For now, just log the token - will be saved when user profile is created
    console.log("Push token obtenu:", token);
  } catch (error) {
    console.error("Erreur sauvegarde push token:", error);
  }
};

/**
 * Programmer une notification locale
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerDate: Date,
  data: any = {},
): Promise<string | null> => {
  try {
    if (Platform.OS === "web") return null;

    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    } as Notifications.DateTriggerInput;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "dice-roll.wav",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: "#E0115F",
      },
      trigger,
    });

    console.log("Notification programmée:", identifier);
    return identifier;
  } catch (error) {
    console.error("Erreur programmation notification:", error);
    return null;
  }
};

/**
 * Programmer un rappel quotidien pour utiliser Love Dice
 */
export const scheduleEveningReminder = async (
  reminderTime: string = "19:00",
): Promise<void> => {
  try {
    if (Platform.OS === "web") return;

    // Annuler les rappels existants
    await cancelNotificationsByType("evening_reminder");

    const [hours, minutes] = reminderTime.split(":").map(Number);

    // Messages de rappel variés
    const reminderMessages = [
      {
        title: "C'est l'heure du dé ! 🎲",
        body: "Que va décider Love Dice pour votre soirée ?",
      },
      {
        title: "Soirée en duo ? 💕",
        body: "Laissez Love Dice choisir votre activité ce soir !",
      },
      {
        title: "Prêts pour une surprise ? ✨",
        body: "Un lancer de dé pour une soirée parfaite !",
      },
      {
        title: "Love Dice vous attend ! 🌙",
        body: "Découvrez ce que le hasard vous réserve ce soir.",
      },
    ];

    // Programmer pour les 7 prochains jours
    for (let day = 1; day <= 7; day++) {
      const triggerDate = new Date();
      triggerDate.setDate(triggerDate.getDate() + day);
      triggerDate.setHours(hours, minutes, 0, 0);

      const message = reminderMessages[day % reminderMessages.length];

      await scheduleLocalNotification(
        message.title,
        message.body,
        triggerDate,
        {
          type: "evening_reminder",
          day,
        },
      );
    }

    console.log("Rappels du soir programmés");
  } catch (error) {
    console.error("Erreur programmation rappels:", error);
  }
};

/**
 * Programmer une notification de milestone
 */
export const scheduleMilestoneNotification = async (
  rollCount: number,
): Promise<void> => {
  try {
    if (Platform.OS === "web") return;

    const milestones = {
      10: {
        title: "10 lancers ! 🎉",
        body: "Bravo ! Love Dice égaye déjà vos soirées !",
      },
      50: {
        title: "50 lancers ! 🌟",
        body: "Vous êtes des pros du hasard romantique !",
      },
      100: {
        title: "100 lancers ! 💯",
        body: "Un siècle de soirées décidées par Love Dice !",
      },
      500: {
        title: "500 lancers ! 🚀",
        body: "Vous êtes devenus des légendes du dé magique !",
      },
    };

    const milestone = milestones[rollCount as keyof typeof milestones];
    if (!milestone) return;

    // Programmer pour dans 5 secondes (notification immédiate)
    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + 5);

    await scheduleLocalNotification(
      milestone.title,
      milestone.body,
      triggerDate,
      {
        type: "milestone",
        rollCount,
      },
    );
  } catch (error) {
    console.error("Erreur notification milestone:", error);
  }
};

/**
 * Annuler les notifications par type
 */
export const cancelNotificationsByType = async (
  type: string,
): Promise<void> => {
  try {
    if (Platform.OS === "web") return;

    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    const toCancel = scheduledNotifications
      .filter((notification) => notification.content.data?.type === type)
      .map((notification) => notification.identifier);

    if (toCancel.length > 0) {
      await Promise.all(
        toCancel.map((id) =>
          Notifications.cancelScheduledNotificationAsync(id),
        ),
      );
      console.log(`${toCancel.length} notifications de type ${type} annulées`);
    }
  } catch (error) {
    console.error("Erreur annulation notifications:", error);
  }
};

/**
 * Annuler toutes les notifications programmées
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    if (Platform.OS === "web") return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Toutes les notifications annulées");
  } catch (error) {
    console.error("Erreur annulation toutes notifications:", error);
  }
};

/**
 * Obtenir les notifications programmées
 */
export const getScheduledNotifications = async (): Promise<
  ScheduledNotification[]
> => {
  try {
    if (Platform.OS === "web") return [];

    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();

    return notifications.map((notification) => {
      let scheduledDate = new Date();

      if (notification.trigger && "date" in notification.trigger) {
        scheduledDate = new Date(notification.trigger.date as number);
      } else if (notification.trigger && "seconds" in notification.trigger) {
        scheduledDate = new Date(
          Date.now() + (notification.trigger.seconds as number) * 1000,
        );
      }

      return {
        id: notification.identifier,
        type: notification.content.data?.type || "unknown",
        scheduledDate,
        title: notification.content.title || "",
        body: notification.content.body || "",
      };
    });
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return [];
  }
};

/**
 * Gérer les préférences de notifications
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>,
): Promise<void> => {
  try {
    // Store preferences locally for now
    console.log("Préférences notifications mises à jour:", preferences);

    // Reprogrammer les notifications selon les nouvelles préférences
    if (preferences.eveningReminders === false) {
      await cancelNotificationsByType("evening_reminder");
    } else if (preferences.eveningReminders === true) {
      await scheduleEveningReminder(preferences.reminderTime);
    }
  } catch (error) {
    console.error("Erreur mise à jour préférences notifications:", error);
  }
};

/**
 * Envoyer une notification push via Firebase Cloud Messaging
 * (Cette fonction serait appelée depuis une Cloud Function)
 */
export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data: any = {},
): Promise<boolean> => {
  try {
    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
      priority: "high",
      channelId: "love-dice-default",
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log("Push notification envoyée:", result);

    return result.data?.status === "ok";
  } catch (error) {
    console.error("Erreur envoi push notification:", error);
    return false;
  }
};

/**
 * Configurer les channels de notification (Android)
 */
export const setupNotificationChannels = async (): Promise<void> => {
  try {
    if (Platform.OS !== "android") return;

    await Notifications.setNotificationChannelAsync("love-dice-default", {
      name: "Love Dice",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E0115F",
      sound: "dice-roll.wav",
      description: "Notifications de Love Dice pour vos soirées romantiques",
    });

    await Notifications.setNotificationChannelAsync("love-dice-reminders", {
      name: "Rappels Love Dice",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: "#FF4F7B",
      description: "Rappels quotidiens pour utiliser Love Dice",
    });

    await Notifications.setNotificationChannelAsync("love-dice-milestones", {
      name: "Succès Love Dice",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250, 250, 250],
      lightColor: "#F4C869",
      description: "Notifications pour vos succès et milestones",
    });

    console.log("Channels de notification configurés");
  } catch (error) {
    console.error("Erreur configuration channels:", error);
  }
};

/**
 * Initialiser le service de notifications
 */
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    // Configurer les channels Android
    await setupNotificationChannels();

    // Demander les permissions
    const hasPermissions = await requestNotificationPermissions();

    if (hasPermissions) {
      // Programmer les rappels du soir par défaut
      await scheduleEveningReminder();
    }

    console.log("Service de notifications initialisé");
    return hasPermissions;
  } catch (error) {
    console.error("Erreur initialisation notifications:", error);
    return false;
  }
};

// Listeners pour les notifications
export const addNotificationListeners = () => {
  // Notification reçue quand l'app est en foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification reçue en foreground:", notification);
      // Gérer l'affichage custom si nécessaire
    },
  );

  // Notification tappée par l'utilisateur
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tappée:", response);

      const data = response.notification.request.content.data;

      // Router selon le type de notification
      switch (data?.type) {
        case "evening_reminder":
          // Naviguer vers l'écran principal
          break;
        case "milestone":
          // Afficher une modal de félicitations
          break;
        default:
          // Action par défaut
          break;
      }
    });

  return {
    foregroundSubscription,
    responseSubscription,
  };
};

export default {
  requestNotificationPermissions,
  scheduleLocalNotification,
  scheduleEveningReminder,
  scheduleMilestoneNotification,
  cancelNotificationsByType,
  cancelAllNotifications,
  getScheduledNotifications,
  updateNotificationPreferences,
  setupNotificationChannels,
  initializeNotifications,
  addNotificationListeners,
  sendPushNotification,
};
