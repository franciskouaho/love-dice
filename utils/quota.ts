import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConfigValue } from "../services/config";
import {
  getCurrentUserId,
  getUserProfile,
  updateDailyQuota,
  updateLifetimeStatus as updateFirebaseLifetimeStatus,
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

// Vérifier si l'utilisateur peut encore lancer le dé
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
    // Essayer Firebase, sinon utiliser cache/défaut
    const userId = getCurrentUserId();
    if (!userId) {
      // Pas de connexion, vérifier cache local ou bloquer
      return {
        canRoll: false,
        remaining: 0,
      };
    }

    // Récupérer le profil Firebase
    const profile = await getUserProfile(userId);
    if (!profile) {
      return {
        canRoll: false,
        remaining: 0,
      };
    }

    // Vérifier si c'est un nouveau jour
    const currentDayKey = getCurrentDayKey();
    const limit = await getDailyLimit();

    // Si nouveau jour, réinitialiser le quota
    if (profile.freeDayKey !== currentDayKey) {
      await updateDailyQuota(userId, 0, currentDayKey);
      return { canRoll: limit > 0, remaining: limit };
    }

    // Calculer les lancers restants
    const remaining = Math.max(0, limit - profile.freeRollsUsedToday);

    return {
      canRoll: remaining > 0,
      remaining,
    };
  } catch (error) {
    // En cas d'erreur, bloquer l'accès pour les gratuits
    return {
      canRoll: false,
      remaining: 0,
    };
  }
};

// Consommer un lancer gratuit
export const consumeFreeRoll = async (): Promise<{
  success: boolean;
  remaining: number;
  error?: string;
}> => {
  try {
    // Essayer Firebase
    const userId = getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        remaining: 0,
      };
    }

    // Récupérer le profil Firebase
    const profile = await getUserProfile(userId);
    if (!profile) {
      return {
        success: false,
        remaining: 0,
      };
    }

    const currentDayKey = getCurrentDayKey();
    const limit = await getDailyLimit();

    // Si nouveau jour, réinitialiser
    let currentUsed = profile.freeRollsUsedToday;
    if (profile.freeDayKey !== currentDayKey) {
      currentUsed = 0;
    }

    if (currentUsed >= limit) {
      return {
        success: false,
        remaining: 0,
      };
    }

    // Incrémenter le compteur dans Firebase
    const newUsed = currentUsed + 1;
    const updateSuccess = await updateDailyQuota(
      userId,
      newUsed,
      currentDayKey,
    );

    if (!updateSuccess) {
      return {
        success: false,
        remaining: 0,
      };
    }

    const remaining = Math.max(0, limit - newUsed);
    return { success: true, remaining };
  } catch (error) {
    // En cas d'erreur, bloquer l'accès
    return {
      success: false,
      remaining: 0,
    };
  }
};

// Sauvegarder le statut lifetime (Firebase + cache local)
export const saveLifetimeStatus = async (
  hasLifetime: boolean,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Toujours sauvegarder en cache local d'abord
    await setCachedLifetimeStatus(hasLifetime);

    // Essayer de sauvegarder dans Firebase si possible
    const userId = getCurrentUserId();
    if (userId) {
      const success = await updateFirebaseLifetimeStatus(userId, hasLifetime);
      if (success) {
        return { success: true };
      }
    }

    // Cache local OK dans tous les cas
    return { success: true };
  } catch (error) {
    return {
      success: false,
    };
  }
};

// Récupérer le statut lifetime (cache local + Firebase sync)
export const getLifetimeStatus = async (): Promise<boolean> => {
  try {
    // D'abord vérifier le cache local
    const cachedStatus = await getCachedLifetimeStatus();

    // Si cached = true, pas besoin de vérifier Firebase
    if (cachedStatus) {
      return true;
    }

    // Si pas de cache lifetime, essayer Firebase
    const userId = getCurrentUserId();
    if (!userId) {
      return false; // Pas de connexion, pas de cache = pas de lifetime
    }

    const profile = await getUserProfile(userId);
    const firebaseStatus = profile?.hasLifetime || false;

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
        limit: 1,
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
    return {
      hasLifetime: false,
      unlimited: false,
      used: 0, // On ne track plus l'used avec le nouveau système
      limit: rollResult.remainingRolls || 0,
      remaining: rollResult.remainingRolls || 0,
      canRoll: rollResult.canRoll,
    };
  } catch (error) {
    console.error("❌ Erreur getQuotaSummary:", error);
    // En cas d'erreur, bloquer l'accès
    return {
      hasLifetime: false,
      unlimited: false,
      used: 0,
      limit: 1,
      remaining: 0,
      canRoll: false,
    };
  }
};
