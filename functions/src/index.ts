import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

// Initialiser Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Interfaces
interface AppleReceiptData {
  receipt_data: string;
  password?: string;
  exclude_old_transactions?: boolean;
}

interface GoogleReceiptData {
  packageName: string;
  productId: string;
  purchaseToken: string;
}

interface VerificationResult {
  success: boolean;
  productId?: string;
  purchaseTime?: number;
  error?: string;
}

// URLs Apple
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const APPLE_PRODUCTION_URL = "https://buy.itunes.apple.com/verifyReceipt";

// Configuration
const APPLE_SHARED_SECRET = functions.config().apple?.shared_secret || "";
const GOOGLE_SERVICE_ACCOUNT = functions.config().google?.service_account || "";

/**
 * Vérifie un reçu Apple Store
 */
async function verifyAppleReceipt(
  receiptData: string,
): Promise<VerificationResult> {
  try {
    const payload: AppleReceiptData = {
      "receipt-data": receiptData,
      password: APPLE_SHARED_SECRET,
      "exclude-old-transactions": true,
    };

    // Essayer d'abord la production
    let response = await fetch(APPLE_PRODUCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let result = await response.json();

    // Si erreur sandbox, essayer sandbox
    if (result.status === 21007) {
      response = await fetch(APPLE_SANDBOX_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      result = await response.json();
    }

    if (result.status === 0) {
      // Vérification réussie
      const receipt = result.receipt;
      const inAppPurchases = receipt.in_app || [];

      // Chercher l'achat Love Dice lifetime
      const lifetimePurchase = inAppPurchases.find(
        (purchase: any) => purchase.product_id === "love_dice_lifetime",
      );

      if (lifetimePurchase) {
        return {
          success: true,
          productId: lifetimePurchase.product_id,
          purchaseTime: parseInt(lifetimePurchase.purchase_date_ms),
        };
      } else {
        return {
          success: false,
          error: "Aucun achat lifetime trouvé",
        };
      }
    } else {
      return {
        success: false,
        error: `Erreur Apple: ${result.status}`,
      };
    }
  } catch (error) {
    console.error("Erreur vérification Apple:", error);
    return {
      success: false,
      error: "Erreur de vérification Apple",
    };
  }
}

/**
 * Vérifie un reçu Google Play
 */
async function verifyGoogleReceipt(
  packageName: string,
  productId: string,
  purchaseToken: string,
): Promise<VerificationResult> {
  try {
    // Note: En production, utiliser Google Play Developer API
    // Pour ce prototype, on simule la vérification

    if (productId === "love_dice_lifetime" && purchaseToken && packageName) {
      return {
        success: true,
        productId,
        purchaseTime: Date.now(),
      };
    }

    return {
      success: false,
      error: "Token invalide",
    };
  } catch (error) {
    console.error("Erreur vérification Google:", error);
    return {
      success: false,
      error: "Erreur de vérification Google",
    };
  }
}

/**
 * Cloud Function pour vérifier les reçus IAP
 */
export const verifyReceipt = functions.https.onCall(async (data, context) => {
  // Vérifier l'authentification
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Utilisateur non authentifié",
    );
  }

  const uid = context.auth.uid;
  const { platform, receiptData, packageName, productId, purchaseToken } = data;

  if (!platform || !["apple", "google"].includes(platform)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Plateforme invalide",
    );
  }

  let verificationResult: VerificationResult;

  try {
    if (platform === "apple") {
      if (!receiptData) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Receipt data manquant pour Apple",
        );
      }
      verificationResult = await verifyAppleReceipt(receiptData);
    } else {
      if (!packageName || !productId || !purchaseToken) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Données manquantes pour Google",
        );
      }
      verificationResult = await verifyGoogleReceipt(
        packageName,
        productId,
        purchaseToken,
      );
    }

    if (verificationResult.success) {
      // Mettre à jour le profil utilisateur
      const userRef = db.collection("users").doc(uid);
      await userRef.update({
        hasLifetime: true,
        lifetimeActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Enregistrer le reçu
      const receiptRef = db
        .collection("iapReceipts")
        .doc(`${platform}_${uid}_${Date.now()}`);
      await receiptRef.set({
        uid,
        platform,
        productId: verificationResult.productId,
        purchaseTime: verificationResult.purchaseTime,
        status: "verified",
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        receiptData:
          platform === "apple"
            ? receiptData
            : {
                packageName,
                productId,
                purchaseToken,
              },
      });

      console.log(`Achat vérifié pour ${uid}: ${verificationResult.productId}`);

      return {
        success: true,
        productId: verificationResult.productId,
      };
    } else {
      console.warn(
        `Échec vérification pour ${uid}: ${verificationResult.error}`,
      );
      throw new functions.https.HttpsError(
        "invalid-argument",
        verificationResult.error || "Vérification échouée",
      );
    }
  } catch (error) {
    console.error("Erreur dans verifyReceipt:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Erreur interne de vérification",
    );
  }
});

/**
 * Fonction de reset quotidien des quotas (optionnelle)
 */
export const resetDailyQuotas = functions.pubsub
  .schedule("0 0 * * *") // Tous les jours à minuit UTC
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    const today = new Date().toISOString().split("T")[0];

    try {
      // Récupérer tous les utilisateurs non-premium
      const usersSnapshot = await db
        .collection("users")
        .where("hasLifetime", "==", false)
        .get();

      const batch = db.batch();
      let updateCount = 0;

      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();

        // Réinitialiser seulement si ce n'est pas déjà fait aujourd'hui
        if (userData.freeDayKey !== today) {
          batch.update(doc.ref, {
            freeRollsUsedToday: 0,
            freeDayKey: today,
            lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(
          `Reset quotidien effectué pour ${updateCount} utilisateurs`,
        );
      } else {
        console.log("Aucun quota à réinitialiser");
      }

      return null;
    } catch (error) {
      console.error("Erreur reset quotidien:", error);
      throw error;
    }
  });

/**
 * Fonction de nettoyage des données anciennes (optionnelle)
 */
export const cleanupOldData = functions.pubsub
  .schedule("0 2 * * 0") // Tous les dimanches à 2h
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 jours

    try {
      // Nettoyer l'historique ancien (garder seulement 90 jours)
      const usersSnapshot = await db.collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const historyRef = userDoc.ref.collection("history");
        const oldHistoryQuery = historyRef
          .where("createdAt", "<", cutoffDate)
          .limit(500); // Traiter par batch

        const oldHistorySnapshot = await oldHistoryQuery.get();

        if (!oldHistorySnapshot.empty) {
          const batch = db.batch();
          oldHistorySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();

          console.log(
            `Supprimé ${oldHistorySnapshot.size} entrées d'historique ancien pour ${userDoc.id}`,
          );
        }
      }

      console.log("Nettoyage des données anciennes terminé");
      return null;
    } catch (error) {
      console.error("Erreur nettoyage:", error);
      throw error;
    }
  });

/**
 * Fonction de synchronisation des utilisateurs (webhook RevenueCat optionnel)
 */
export const revenueCatWebhook = functions.https.onRequest(async (req, res) => {
  // Vérifier la signature RevenueCat en production

  try {
    const event = req.body;

    if (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL") {
      const appUserId = event.event.app_user_id;
      const productId = event.event.product_id;

      if (productId === "love_dice_lifetime" && appUserId) {
        // Mettre à jour le statut lifetime
        const userRef = db.collection("users").doc(appUserId);
        await userRef.update({
          hasLifetime: true,
          lifetimeActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Webhook RevenueCat: Lifetime activé pour ${appUserId}`);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Erreur webhook RevenueCat:", error);
    res.status(500).send("Erreur interne");
  }
});

/**
 * Cloud Function pour envoyer des notifications push
 */
export const sendPushNotification = functions.https.onCall(
  async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Utilisateur non authentifié",
      );
    }

    const { tokens, title, body, data: notificationData, type } = data;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Tokens de notification requis",
      );
    }

    if (!title || !body) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Titre et message requis",
      );
    }

    try {
      const messages = tokens.map((token: string) => ({
        to: token,
        sound: "default",
        title,
        body,
        data: {
          ...notificationData,
          type: type || "general",
        },
        priority: "high",
        channelId: "love-dice-default",
        badge: 1,
      }));

      const chunks = [];
      for (let i = 0; i < messages.length; i += 100) {
        chunks.push(messages.slice(i, i + 100));
      }

      const results = [];
      for (const chunk of chunks) {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(chunk),
        });

        const result = await response.json();
        results.push(result);
      }

      console.log(`Notifications envoyées à ${tokens.length} utilisateurs`);

      return {
        success: true,
        sent: tokens.length,
        results,
      };
    } catch (error) {
      console.error("Erreur envoi notifications:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erreur interne d'envoi",
      );
    }
  },
);

/**
 * Fonction programmée pour envoyer des rappels du soir
 */
export const sendEveningReminders = functions.pubsub
  .schedule("0 19 * * *") // Tous les jours à 19h
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    try {
      // Récupérer tous les utilisateurs qui ont activé les rappels
      const usersSnapshot = await db
        .collection("users")
        .where("notificationsEnabled", "==", true)
        .where("notificationPreferences.eveningReminders", "==", true)
        .get();

      if (usersSnapshot.empty) {
        console.log("Aucun utilisateur avec rappels activés");
        return null;
      }

      const tokens: string[] = [];
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        if (userData.pushToken) {
          tokens.push(userData.pushToken);
        }
      });

      if (tokens.length === 0) {
        console.log("Aucun token de notification trouvé");
        return null;
      }

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

      const dayOfWeek = new Date().getDay();
      const message = reminderMessages[dayOfWeek % reminderMessages.length];

      // Envoyer les notifications par chunks
      const chunks = [];
      for (let i = 0; i < tokens.length; i += 100) {
        chunks.push(tokens.slice(i, i + 100));
      }

      let totalSent = 0;
      for (const chunk of chunks) {
        const messages = chunk.map((token) => ({
          to: token,
          sound: "default",
          title: message.title,
          body: message.body,
          data: {
            type: "evening_reminder",
          },
          priority: "normal",
          channelId: "love-dice-reminders",
        }));

        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        });

        if (response.ok) {
          totalSent += chunk.length;
        }
      }

      console.log(
        `Rappels du soir envoyés à ${totalSent}/${tokens.length} utilisateurs`,
      );

      return null;
    } catch (error) {
      console.error("Erreur envoi rappels du soir:", error);
      throw error;
    }
  });

/**
 * Fonction pour envoyer des notifications de milestone
 */
export const sendMilestoneNotification = functions.firestore
  .document("users/{userId}/history/{historyId}")
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;

    try {
      // Compter le nombre total de lancers pour cet utilisateur
      const historySnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("history")
        .get();

      const rollCount = historySnapshot.size;

      // Vérifier si c'est un milestone
      const milestones = [10, 50, 100, 500, 1000];
      if (!milestones.includes(rollCount)) {
        return null;
      }

      // Récupérer le profil utilisateur
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      if (
        !userData?.pushToken ||
        !userData?.notificationPreferences?.milestoneAlerts
      ) {
        return null;
      }

      const milestoneMessages = {
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
        1000: {
          title: "1000 lancers ! 👑",
          body: "Vous êtes officiellement des maîtres du hasard !",
        },
      };

      const message =
        milestoneMessages[rollCount as keyof typeof milestoneMessages];

      const notification = {
        to: userData.pushToken,
        sound: "default",
        title: message.title,
        body: message.body,
        data: {
          type: "milestone",
          rollCount,
        },
        priority: "high",
        channelId: "love-dice-milestones",
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification),
      });

      console.log(`Notification milestone ${rollCount} envoyée à ${userId}`);

      return null;
    } catch (error) {
      console.error("Erreur notification milestone:", error);
      return null;
    }
  });
