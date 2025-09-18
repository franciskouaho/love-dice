import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

// Initialiser Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Interfaces
interface AppleReceiptData {
  "receipt-data": string;
  password?: string;
  "exclude-old-transactions"?: boolean;
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
    // TODO: Implémenter la vérification Google Play Developer API
    // Pour l'instant, simulation basique pour les tests

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
    return {
      success: false,
      error: "Erreur de vérification Google",
    };
  }
}

/**
 * Cloud Function pour vérifier les reçus IAP
 */
export const verifyReceipt = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Utilisateur non authentifié",
      );
    }

    const uid = context.auth.uid;
    const { platform, receiptData, packageName, productId, purchaseToken } =
      data;

    // Validation des paramètres
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

        // Enregistrer le reçu pour audit
        const receiptRef = db
          .collection("iapReceipts")
          .doc(platform)
          .collection("receipts")
          .doc(`${uid}_${Date.now()}`);

        await receiptRef.set({
          uid,
          platform,
          productId: verificationResult.productId,
          purchaseTime: verificationResult.purchaseTime,
          status: "verified",
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          receiptData:
            platform === "apple"
              ? { receiptData }
              : {
                  packageName,
                  productId,
                  purchaseToken,
                },
        });

        return {
          success: true,
          productId: verificationResult.productId,
        };
      } else {
        throw new functions.https.HttpsError(
          "invalid-argument",
          verificationResult.error || "Vérification échouée",
        );
      }
    } catch (error) {
      // Log l'erreur pour le monitoring (sans exposer les détails)
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "Erreur interne de vérification",
      );
    }
  });

/**
 * Fonction de reset quotidien des quotas
 */
export const resetDailyQuotas = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "512MB",
  })
  .pubsub.schedule("0 0 * * *") // Tous les jours à minuit UTC
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    const today = new Date().toISOString().split("T")[0];

    try {
      // Récupérer tous les utilisateurs non-premium par batch
      const batchSize = 500;
      let lastDoc = null;
      let totalUpdated = 0;

      do {
        let query = db
          .collection("users")
          .where("hasLifetime", "==", false)
          .limit(batchSize);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const usersSnapshot = await query.get();

        if (usersSnapshot.empty) {
          break;
        }

        const batch = db.batch();
        let batchUpdateCount = 0;

        usersSnapshot.docs.forEach((doc) => {
          const userData = doc.data();

          // Réinitialiser seulement si ce n'est pas déjà fait aujourd'hui
          if (userData.freeDayKey !== today) {
            batch.update(doc.ref, {
              freeRollsUsedToday: 0,
              freeDayKey: today,
              lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            batchUpdateCount++;
          }
        });

        if (batchUpdateCount > 0) {
          await batch.commit();
          totalUpdated += batchUpdateCount;
        }

        lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
      } while (lastDoc);

      return { success: true, usersUpdated: totalUpdated };
    } catch (error) {
      throw error;
    }
  });

/**
 * Fonction de nettoyage des données anciennes
 */
export const cleanupOldData = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "512MB",
  })
  .pubsub.schedule("0 2 * * 0") // Tous les dimanches à 2h
  .timeZone("Europe/Paris")
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 jours

    try {
      const usersSnapshot = await db.collection("users").get();
      let totalCleaned = 0;

      for (const userDoc of usersSnapshot.docs) {
        const historyRef = userDoc.ref.collection("history");
        let hasMore = true;

        while (hasMore) {
          const oldHistoryQuery = historyRef
            .where("createdAt", "<", cutoffDate)
            .limit(500); // Traiter par batch pour éviter les timeouts

          const oldHistorySnapshot = await oldHistoryQuery.get();

          if (!oldHistorySnapshot.empty) {
            const batch = db.batch();
            oldHistorySnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            totalCleaned += oldHistorySnapshot.size;
          } else {
            hasMore = false;
          }
        }
      }

      return { success: true, documentsDeleted: totalCleaned };
    } catch (error) {
      throw error;
    }
  });

/**
 * Webhook RevenueCat (optionnel)
 */
export const revenueCatWebhook = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .https.onRequest(async (req, res) => {
    // TODO: Vérifier la signature RevenueCat en production
    // const signature = req.headers['authorization'];

    try {
      const event = req.body;

      if (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL") {
        const appUserId = event.event?.app_user_id;
        const productId = event.event?.product_id;

        if (productId === "love_dice_lifetime" && appUserId) {
          // Mettre à jour le statut lifetime
          const userRef = db.collection("users").doc(appUserId);
          await userRef.set(
            {
              hasLifetime: true,
              lifetimeActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      res.status(500).send("Erreur interne");
    }
  });

/**
 * Cloud Function pour envoyer des notifications push
 */
export const sendPushNotification = functions
  .runWith({
    timeoutSeconds: 300,
    memory: "512MB",
  })
  .https.onCall(async (data, context) => {
    // Vérifier l'authentification admin pour cette fonction
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Accès réservé aux administrateurs",
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

      // Envoyer par chunks de 100 (limite Expo)
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

      return {
        success: true,
        sent: tokens.length,
        results,
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur interne d'envoi",
      );
    }
  });

/**
 * Fonction programmée pour envoyer des rappels du soir
 */
export const sendEveningReminders = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "512MB",
  })
  .pubsub.schedule("0 19 * * *") // Tous les jours à 19h
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
        return { success: true, sent: 0 };
      }

      const tokens: string[] = [];
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        if (userData.pushToken && typeof userData.pushToken === "string") {
          tokens.push(userData.pushToken);
        }
      });

      if (tokens.length === 0) {
        return { success: true, sent: 0 };
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

      return { success: true, sent: totalSent };
    } catch (error) {
      throw error;
    }
  });

/**
 * Fonction pour envoyer des notifications de milestone
 */
export const sendMilestoneNotification = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .firestore.document("users/{userId}/history/{historyId}")
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
          rollCount: rollCount.toString(),
        },
        priority: "high",
        channelId: "love-dice-milestones",
      };

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification),
      });

      return null;
    } catch (error) {
      return null;
    }
  });

/**
 * Fonction utilitaire pour créer un utilisateur admin
 * À utiliser une seule fois pour créer le premier admin
 */
export const createAdminUser = functions
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB",
  })
  .https.onCall(async (data, context) => {
    // Cette fonction ne doit être appelée que par un super admin
    // En production, la désactiver ou ajouter une clé secrète
    const { uid } = data;

    if (!uid) {
      throw new functions.https.HttpsError("invalid-argument", "UID requis");
    }

    try {
      // Définir les custom claims pour admin
      await admin.auth().setCustomUserClaims(uid, { admin: true });

      return {
        success: true,
        message: `Utilisateur ${uid} est maintenant admin`,
      };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        "Erreur lors de la création de l'admin",
      );
    }
  });
