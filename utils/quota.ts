import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConfigValue } from "../services/config";
import {
    getCurrentUserId
} from "../services/firestore";

// Clés pour le stockage local (cache + lifetime status)
const STORAGE_KEYS = {
  LAST_ROLL: "last_roll",
  HAS_LIFETIME_CACHE: "has_lifetime_cache",
  LAST_FIREBASE_SYNC: "last_firebase_sync",
} as const;

// Interface pour les préférences utilisateur
export interface UserPreferences {
  haptics: boolean;
  weights: {
    payer: number;
    repas: number;
    activite: number;
  };
  partnerNames?: {
    user: string;
    partner: string;
  };
}

// Préférences par défaut
const defaultPreferences: UserPreferences = {
  haptics: true,
  weights: {
    payer: 0.2,
    repas: 0.2,
    activite: 0.6,
  },
};

// Clés pour les préférences utilisateur
const PREFERENCES_KEY = "user_preferences";

// Récupérer les préférences utilisateur
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const prefsJson = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (prefsJson) {
      return JSON.parse(prefsJson);
    }
    return defaultPreferences;
  } catch (error) {
    return defaultPreferences;
  }
};

// Sauvegarder les préférences utilisateur
export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
  }
};

// Obtenir la clé du jour actuel
export const getCurrentDayKey = (): string => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
};

// Obtenir la limite quotidienne depuis la configuration
export const getDailyLimit = async (): Promise<number> => {
  try {
    return await getConfigValue("FREE_ROLLS_PER_DAY");
  } catch (error) {
    // Erreur récupération limite quotidienne ignorée
    return 3; // Valeur par défaut
  }
};

// Cache local pour le statut lifetime
const getCachedLifetimeStatus = async (): Promise<boolean> => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.HAS_LIFETIME_CACHE);
    return cached === "true";
  } catch (error) {
    return false;
  }
};

const setCachedLifetimeStatus = async (hasLifetime: boolean): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.HAS_LIFETIME_CACHE, hasLifetime.toString()],
      [STORAGE_KEYS.LAST_FIREBASE_SYNC, Date.now().toString()],
    ]);
  } catch (error) {
    // Erreur cache ignorée
  }
};

// Vérifier si l'utilisateur peut encore lancer le dé - NOUVEAU SYSTÈME user_settings
export const canRollDice = async (
  hasLifetime: boolean = false,
): Promise<{ canRoll: boolean; remaining: number; error?: string }> => {
  // Si lifetime passé en paramètre, autoriser directement
  if (hasLifetime) {
    return { canRoll: true, remaining: -1 }; // -1 = illimité
  }

  // Vérifier le cache local pour le lifetime
  const cachedLifetime = await getCachedLifetimeStatus();
  if (cachedLifetime) {
    return { canRoll: true, remaining: -1 }; // -1 = illimité
  }

  try {
    // 🔥 NOUVEAU : Utiliser le système user_settings via canUserRoll
    const userId = getCurrentUserId();
    if (!userId) {
      return {
        canRoll: false,
        remaining: 0,
      };
    }

    // Importer et utiliser la fonction du nouveau système
    const { canUserRoll } = await import("../hooks/useFirebase");
    const result = await canUserRoll(userId);

    return {
      canRoll: result.canRoll,
      remaining: result.remainingRolls || 0,
      error: result.reason === 'error' ? result.reason : undefined,
    };
  } catch (error) {
    // En cas d'erreur, bloquer l'accès pour les gratuits
    return {
      canRoll: false,
      remaining: 0,
      error: "Erreur de connexion",
    };
  }
};

// Consommer un lancer gratuit - NOUVEAU SYSTÈME user_settings
export const consumeFreeRoll = async (): Promise<{
  success: boolean;
  remaining: number;
  error?: string;
}> => {
  try {
    // 🔥 NOUVEAU : Utiliser decrementQuota du système user_settings
    const userId = getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        remaining: 0,
        error: "Utilisateur non connecté",
      };
    }

    // Importer et utiliser la fonction du nouveau système
    const { useFirestore } = await import("../hooks/useFirebase");
    
    // Créer une instance temporaire pour accéder à decrementQuota
    const firestore = useFirestore();
    const result = await firestore.decrementQuota(userId);

    return {
      success: result.success,
      remaining: result.remainingRolls || 0,
      error: result.error,
    };
  } catch (error) {
    // En cas d'erreur, bloquer l'accès
    return {
      success: false,
      remaining: 0,
      error: "Erreur de connexion",
    };
  }
};

// Sauvegarder le statut lifetime - NOUVEAU SYSTÈME user_settings
export const saveLifetimeStatus = async (
  hasLifetime: boolean,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Toujours sauvegarder en cache local d'abord
    await setCachedLifetimeStatus(hasLifetime);

    // 🔥 NOUVEAU : Utiliser grantLifetimeAccess du système user_settings
    const userId = getCurrentUserId();
    if (userId && hasLifetime) {
      const { grantLifetimeAccess } = await import("../hooks/useFirebase");
      const result = await grantLifetimeAccess(userId);
      if (result.success) {
        return { success: true };
      }
    } else if (userId) {
      // Si on retire le lifetime, il faudrait une fonction pour ça
      // Pour l'instant on met juste le cache local
      return { success: true };
    }

    // Cache local OK dans tous les cas
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Erreur de sauvegarde",
    };
  }
};

// Récupérer le statut lifetime - NOUVEAU SYSTÈME user_settings
export const getLifetimeStatus = async (): Promise<boolean> => {
  try {
    // D'abord vérifier le cache local
    const cachedStatus = await getCachedLifetimeStatus();

    // Si cached = true, pas besoin de vérifier Firebase
    if (cachedStatus) {
      return true;
    }

    // 🔥 NOUVEAU : Vérifier user_settings via canUserRoll
    const userId = getCurrentUserId();
    if (!userId) {
      return false; // Pas de connexion, pas de cache = pas de lifetime
    }

    const { canUserRoll } = await import("../hooks/useFirebase");
    const result = await canUserRoll(userId);
    
    // Si remainingRolls = -1, c'est l'accès illimité
    const firebaseStatus = result.remainingRolls === -1 || result.reason === "Accès illimité";

    // Mettre à jour le cache si Firebase dit true
    if (firebaseStatus) {
      await setCachedLifetimeStatus(true);
    }

    return firebaseStatus;
  } catch (error) {
    // En cas d'erreur Firebase, retourner le cache local
    return await getCachedLifetimeStatus();
  }
};

// Préférences utilisateur maintenant gérées via Firebase uniquement
// Ces fonctions sont supprimées pour forcer l'utilisation de Firebase

// Sauvegarder le dernier lancer (pour anti-répétition) - Cache local uniquement
export const saveLastRoll = async (rollId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ROLL, rollId);
  } catch (error) {
    // Erreur sauvegarde dernier roll ignorée
  }
};

// Récupérer le dernier lancer - Cache local uniquement
export const getLastRoll = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_ROLL);
  } catch (error) {
    // Erreur récupération dernier roll ignorée
    return null;
  }
};

// Nettoyer le cache local (garde seulement LAST_ROLL)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.LAST_ROLL]);
  } catch (error) {
    // Erreur suppression données ignorée
  }
};

// Obtenir un résumé du quota actuel - NOUVEAU SYSTÈME user_settings
export const getQuotaSummary = async (hasLifetime: boolean = false) => {
  try {
    // Vérifier le lifetime (paramètre ou cache)
    const actualLifetime = hasLifetime || (await getCachedLifetimeStatus());

    if (actualLifetime) {
      return {
        hasLifetime: true,
        unlimited: true,
        used: 0,
        limit: -1,
        remaining: -1,
        canRoll: true,
        error: null,
      };
    }

    // 🔥 NOUVEAU : Utiliser le système user_settings 
    const userId = getCurrentUserId();
    if (!userId) {
      return {
        hasLifetime: false,
        unlimited: false,
        used: 0,
        limit: 50,
        remaining: 0,
        canRoll: false,
      };
    }

    // 🔥 Importer la fonction de vérification du nouveau système
    const { canUserRoll } = await import("../hooks/useFirebase");
    const rollResult = await canUserRoll(userId);

    if (!rollResult.canRoll) {
      return {
        hasLifetime: false,
        unlimited: false,
        used: 0,
        limit: 0,
        remaining: rollResult.remainingRolls || 0,
        canRoll: false,
      };
    }

    // Si accès illimité (-1)
    if (rollResult.remainingRolls === -1) {
      return {
        hasLifetime: true,
        unlimited: true,
        used: 0,
        limit: -1,
        remaining: -1,
        canRoll: true,
      };
    }

    // Quotas normaux
    const finalResult = {
      hasLifetime: false,
      unlimited: false,
      used: 0, // On ne track plus l'used avec le nouveau système
      limit: rollResult.remainingRolls || 0,
      remaining: rollResult.remainingRolls || 0,
      canRoll: rollResult.canRoll,
    };
    return finalResult;
  } catch (error) {
    // En cas d'erreur, bloquer l'accès
    return {
      hasLifetime: false,
      unlimited: false,
      used: 0,
      limit: 50,
      remaining: 0,
      canRoll: false,
    };
  }
};
