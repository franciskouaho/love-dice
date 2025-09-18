/**
 * Utilitaire de diagnostic Firebase pour débugger les problèmes d'authentification
 */

import { getAuthInstance } from "../services/firebase";
import * as FirestoreService from "../services/firestore";

export interface FirebaseDebugInfo {
  timestamp: string;
  authInstance: boolean;
  currentUser: string | null;
  authState: string;
  firestoreConnected: boolean;
  error?: string;
}

/**
 * Récupère toutes les informations de diagnostic Firebase
 */
export const getFirebaseDebugInfo = async (): Promise<FirebaseDebugInfo> => {
  const timestamp = new Date().toISOString();

  try {
    // Vérifier l'instance Auth
    const authInstance = getAuthInstance();
    const hasAuthInstance = !!authInstance;

    // Vérifier l'utilisateur actuel
    const currentUser = FirestoreService.getCurrentUserId();

    // Vérifier l'état d'authentification
    let authState = "unknown";
    if (authInstance && authInstance.currentUser) {
      authState = authInstance.currentUser.isAnonymous ? "anonymous" : "authenticated";
    } else if (authInstance) {
      authState = "no_user";
    } else {
      authState = "no_auth_instance";
    }

    // Test de connectivité Firestore
    let firestoreConnected = false;
    try {
      await FirestoreService.checkConnectivity();
      firestoreConnected = true;
    } catch (error) {
      firestoreConnected = false;
    }

    return {
      timestamp,
      authInstance: hasAuthInstance,
      currentUser,
      authState,
      firestoreConnected,
    };

  } catch (error) {
    return {
      timestamp,
      authInstance: false,
      currentUser: null,
      authState: "error",
      firestoreConnected: false,
      error: String(error),
    };
  }
};

/**
 * Affiche les informations de diagnostic dans la console
 */
export const logFirebaseDebug = async () => {
  const info = await getFirebaseDebugInfo();

  console.log("🔍 === FIREBASE DEBUG INFO ===");
  console.log("🕐 Timestamp:", info.timestamp);
  console.log("🔧 Auth Instance:", info.authInstance ? "✅" : "❌");
  console.log("👤 Current User:", info.currentUser ? `✅ ${info.currentUser.slice(0, 8)}...` : "❌ Aucun");
  console.log("🔐 Auth State:", info.authState);
  console.log("🔥 Firestore:", info.firestoreConnected ? "✅ Connecté" : "❌ Déconnecté");

  if (info.error) {
    console.error("❌ Erreur:", info.error);
  }

  console.log("🔍 === FIN DEBUG INFO ===");

  return info;
};

/**
 * Force l'initialisation de Firebase Auth avec diagnostic complet
 */
export const forceFirebaseInit = async (): Promise<FirebaseDebugInfo> => {
  console.log("🚀 === FORCE FIREBASE INIT ===");

  // État initial
  console.log("📍 État initial:");
  await logFirebaseDebug();

  try {
    // Import et initialisation
    console.log("🔧 Import et initialisation...");
    const { initAuth } = await import("../services/firebase");

    const authResult = await initAuth();
    console.log("🔧 Résultat initAuth:", authResult);

    // Attendre stabilisation
    console.log("⏳ Attente stabilisation (3s)...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // État final
    console.log("📍 État final:");
    const finalInfo = await logFirebaseDebug();

    console.log("🚀 === FIN FORCE INIT ===");
    return finalInfo;

  } catch (error) {
    console.error("❌ Erreur lors du force init:", error);
    const errorInfo = await getFirebaseDebugInfo();
    console.log("🚀 === FIN FORCE INIT (ERREUR) ===");
    return errorInfo;
  }
};

/**
 * Format les informations de debug pour l'affichage UI
 */
export const formatDebugForUI = (info: FirebaseDebugInfo): string => {
  let text = "";
  text += `Auth: ${info.authInstance ? "✅" : "❌"}\n`;
  text += `User: ${info.currentUser ? "✅" + info.currentUser.slice(0, 8) : "❌"}\n`;
  text += `State: ${info.authState}\n`;
  text += `Firestore: ${info.firestoreConnected ? "✅" : "❌"}\n`;
  text += `Time: ${new Date(info.timestamp).toLocaleTimeString()}`;

  if (info.error) {
    text += `\nError: ${info.error}`;
  }

  return text;
};

/**
 * Teste la création d'un profil utilisateur
 */
export const testUserProfileCreation = async (): Promise<boolean> => {
  try {
    const userId = FirestoreService.getCurrentUserId();
    if (!userId) {
      console.error("❌ Pas d'utilisateur pour créer le profil");
      return false;
    }

    console.log("🧪 Test création profil pour:", userId.slice(0, 8));
    const profile = await FirestoreService.createUserProfile(userId);

    if (profile) {
      console.log("✅ Profil créé avec succès");
      return true;
    } else {
      console.error("❌ Échec création profil");
      return false;
    }
  } catch (error) {
    console.error("❌ Erreur test profil:", error);
    return false;
  }
};

// Export par défaut pour usage simple
export default {
  getInfo: getFirebaseDebugInfo,
  log: logFirebaseDebug,
  forceInit: forceFirebaseInit,
  formatForUI: formatDebugForUI,
  testProfile: testUserProfileCreation,
};
