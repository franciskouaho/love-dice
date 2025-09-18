import { initFirebase } from "./firebase";

/**
 * Service d'initialisation simplifié pour Firebase
 * Firebase est maintenant initialisé directement à l'import
 */

let isInitialized = false;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Initialise les services Firebase (auth anonyme, remote config)
 */
export const initializeApp = async (): Promise<boolean> => {
  // Si déjà initialisé, retourner true
  if (isInitialized) {
    return true;
  }

  // Si une initialisation est en cours, attendre qu'elle se termine
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = performInitialization();
  return initializationPromise;
};

/**
 * Effectue l'initialisation des services Firebase
 */
const performInitialization = async (): Promise<boolean> => {
  try {
    console.log("🚀 Initialisation des services Firebase...");

    const firebaseInitialized = await initFirebase();
    if (!firebaseInitialized) {
      console.error("Les services Firebase n'ont pas pu être initialisés");
      return false;
    }

    isInitialized = true;
    console.log("✅ Services Firebase initialisés");
    return true;
  } catch (error) {
    console.error("❌ Erreur initialisation des services Firebase:", error);

    // Reset l'état en cas d'erreur
    isInitialized = false;
    initializationPromise = null;

    return false;
  }
};

/**
 * Vérifie si l'application est initialisée
 */
export const isAppInitialized = (): boolean => {
  return isInitialized;
};

/**
 * Force la réinitialisation (utile pour les tests ou le debug)
 */
export const resetInitialization = (): void => {
  isInitialized = false;
  initializationPromise = null;
  console.log("🔄 État d'initialisation réinitialisé");
};

/**
 * Initialisation avec retry automatique
 */
export const initializeAppWithRetry = async (
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<boolean> => {
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;

    try {
      const success = await initializeApp();
      if (success) {
        return true;
      }
    } catch (error) {
      console.error(`Tentative ${attempts}/${maxRetries} échouée:`, error);
    }

    if (attempts < maxRetries) {
      console.log(`⏳ Nouvelle tentative dans ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));

      // Reset pour permettre une nouvelle tentative
      resetInitialization();
    }
  }

  console.error(`❌ Échec de l'initialisation après ${maxRetries} tentatives`);
  return false;
};

/**
 * Attend que les services Firebase soient initialisés
 * Firebase core est maintenant toujours disponible
 */
export const waitForFirebaseInitialization = async (
  timeoutMs: number = 5000,
): Promise<boolean> => {
  // Si déjà initialisé, retourner immédiatement
  if (isInitialized) {
    return true;
  }

  // Si une initialisation est en cours, l'attendre
  if (initializationPromise) {
    return initializationPromise;
  }

  // Sinon, démarrer l'initialisation et l'attendre
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn(
        "⚠️ Timeout en attendant l'initialisation des services Firebase",
      );
      resolve(false);
    }, timeoutMs);

    initializeApp()
      .then((success) => {
        clearTimeout(timeout);
        resolve(success);
      })
      .catch((error) => {
        clearTimeout(timeout);
        console.error("❌ Erreur en attendant l'initialisation:", error);
        resolve(false);
      });
  });
};

export default {
  initializeApp,
  isAppInitialized,
  resetInitialization,
  initializeAppWithRetry,
  waitForFirebaseInitialization,
};
