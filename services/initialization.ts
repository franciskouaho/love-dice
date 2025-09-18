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
    const firebaseInitialized = await initFirebase();
    if (!firebaseInitialized) {
      return false;
    }

    isInitialized = true;
    return true;
  } catch (error) {
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
      // Tentative échouée, retry automatique
    }

    if (attempts < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay));

      // Reset pour permettre une nouvelle tentative
      resetInitialization();
    }
  }

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
      resolve(false);
    }, timeoutMs);

    initializeApp()
      .then((success) => {
        clearTimeout(timeout);
        resolve(success);
      })
      .catch((error) => {
        clearTimeout(timeout);
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
