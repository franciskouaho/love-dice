import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConfigValue } from "../services/config";

// Clés pour le stockage local
const STORAGE_KEYS = {
  FREE_ROLLS_USED: "free_rolls_used_today",
  FREE_DAY_KEY: "free_day_key",
  LAST_ROLL: "last_roll",
  HAS_LIFETIME: "has_lifetime",
  USER_PREFS: "user_preferences",
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

// Vérifier si c'est un nouveau jour
export const isNewDay = async (): Promise<boolean> => {
  try {
    const storedDayKey = await AsyncStorage.getItem(STORAGE_KEYS.FREE_DAY_KEY);
    const currentDayKey = getCurrentDayKey();
    return storedDayKey !== currentDayKey;
  } catch (error) {
    // Erreur vérification nouveau jour ignorée
    return true; // En cas d'erreur, considérer comme nouveau jour
  }
};

// Réinitialiser le quota quotidien
export const resetDailyQuota = async (): Promise<void> => {
  try {
    const currentDayKey = getCurrentDayKey();
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.FREE_ROLLS_USED, "0"],
      [STORAGE_KEYS.FREE_DAY_KEY, currentDayKey],
    ]);
    // Quota quotidien réinitialisé
  } catch (error) {
    // Erreur réinitialisation quota ignorée
  }
};

// Obtenir le nombre de lancers gratuits utilisés aujourd'hui
export const getFreeRollsUsed = async (): Promise<number> => {
  try {
    // Vérifier si c'est un nouveau jour
    if (await isNewDay()) {
      await resetDailyQuota();
      return 0;
    }

    const used = await AsyncStorage.getItem(STORAGE_KEYS.FREE_ROLLS_USED);
    return used ? parseInt(used, 10) : 0;
  } catch (error) {
    // Erreur récupération rolls utilisés ignorée
    return 0;
  }
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

// Vérifier si l'utilisateur peut encore lancer le dé
export const canRollDice = async (
  hasLifetime: boolean = false,
): Promise<{ canRoll: boolean; remaining: number }> => {
  if (hasLifetime) {
    return { canRoll: true, remaining: -1 }; // -1 = illimité
  }

  try {
    const used = await getFreeRollsUsed();
    const limit = await getDailyLimit();
    const remaining = Math.max(0, limit - used);

    return {
      canRoll: remaining > 0,
      remaining,
    };
  } catch (error) {
    // Erreur vérification quota ignorée
    return { canRoll: false, remaining: 0 };
  }
};

// Consommer un lancer gratuit
export const consumeFreeRoll = async (): Promise<{
  success: boolean;
  remaining: number;
}> => {
  try {
    const used = await getFreeRollsUsed();
    const limit = await getDailyLimit();

    if (used >= limit) {
      return { success: false, remaining: 0 };
    }

    const newUsed = used + 1;
    await AsyncStorage.setItem(
      STORAGE_KEYS.FREE_ROLLS_USED,
      newUsed.toString(),
    );

    const remaining = Math.max(0, limit - newUsed);
    return { success: true, remaining };
  } catch (error) {
    // Erreur consommation roll gratuit ignorée
    return { success: false, remaining: 0 };
  }
};

// Sauvegarder le statut lifetime
export const saveLifetimeStatus = async (
  hasLifetime: boolean,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.HAS_LIFETIME,
      hasLifetime.toString(),
    );
  } catch (error) {
    // Erreur sauvegarde statut lifetime ignorée
  }
};

// Récupérer le statut lifetime
export const getLifetimeStatus = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem(STORAGE_KEYS.HAS_LIFETIME);
    return status === "true";
  } catch (error) {
    // Erreur récupération statut lifetime ignorée
    return false;
  }
};

// Sauvegarder les préférences utilisateur
export const saveUserPreferences = async (
  preferences: UserPreferences,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFS,
      JSON.stringify(preferences),
    );
  } catch (error) {
    // Erreur sauvegarde préférences ignorée
  }
};

// Récupérer les préférences utilisateur
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const prefs = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFS);
    if (prefs) {
      return { ...defaultPreferences, ...JSON.parse(prefs) };
    }
    return defaultPreferences;
  } catch (error) {
    // Erreur récupération préférences ignorée
    return defaultPreferences;
  }
};

// Sauvegarder le dernier lancer (pour anti-répétition)
export const saveLastRoll = async (rollId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ROLL, rollId);
  } catch (error) {
    // Erreur sauvegarde dernier roll ignorée
  }
};

// Récupérer le dernier lancer
export const getLastRoll = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_ROLL);
  } catch (error) {
    // Erreur récupération dernier roll ignorée
    return null;
  }
};

// Nettoyer toutes les données locales (pour déconnexion/reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    // Toutes les données locales supprimées
  } catch (error) {
    // Erreur suppression données ignorée
  }
};

// Obtenir un résumé du quota actuel
export const getQuotaSummary = async (hasLifetime: boolean = false) => {
  try {
    if (hasLifetime) {
      return {
        hasLifetime: true,
        unlimited: true,
        used: 0,
        limit: -1,
        remaining: -1,
        canRoll: true,
      };
    }

    const used = await getFreeRollsUsed();
    const limit = await getDailyLimit();
    const remaining = Math.max(0, limit - used);

    return {
      hasLifetime: false,
      unlimited: false,
      used,
      limit,
      remaining,
      canRoll: remaining > 0,
    };
  } catch (error) {
    // Erreur résumé quota ignorée
    return {
      hasLifetime: false,
      unlimited: false,
      used: 0,
      limit: 3,
      remaining: 0,
      canRoll: false,
    };
  }
};

// Synchroniser les données locales avec Firestore (si connecté)
export const syncWithFirestore = async (firestoreData: any): Promise<void> => {
  try {
    // Cette fonction sera appelée quand les données Firestore sont disponibles
    if (firestoreData.hasLifetime !== undefined) {
      await saveLifetimeStatus(firestoreData.hasLifetime);
    }

    if (firestoreData.prefs) {
      await saveUserPreferences(firestoreData.prefs);
    }

    // Sync quota seulement si les données Firestore sont plus récentes
    if (
      firestoreData.freeDayKey &&
      firestoreData.freeRollsUsedToday !== undefined
    ) {
      const localDayKey = await AsyncStorage.getItem(STORAGE_KEYS.FREE_DAY_KEY);
      const currentDayKey = getCurrentDayKey();

      // Si Firestore a des données du jour actuel, les utiliser
      if (firestoreData.freeDayKey === currentDayKey) {
        await AsyncStorage.multiSet([
          [
            STORAGE_KEYS.FREE_ROLLS_USED,
            firestoreData.freeRollsUsedToday.toString(),
          ],
          [STORAGE_KEYS.FREE_DAY_KEY, firestoreData.freeDayKey],
        ]);
      }
    }

    // Synchronisation avec Firestore réussie
  } catch (error) {
    // Erreur synchronisation Firestore ignorée
  }
};
