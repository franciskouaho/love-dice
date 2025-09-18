import React from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Platform } from "react-native";

// Interface pour la configuration
export interface AppConfig {
  FREE_ROLLS_PER_DAY: number;
  LIFETIME_PRICE: string;
  PAYWALL_TITLE: string;
  PAYWALL_BULLETS: string;
  FEATURE_FLAGS: {
    customFaces: boolean;
    history: boolean;
    analytics: boolean;
    sharing: boolean;
  };
}

// Configuration par défaut
const DEFAULT_CONFIG: AppConfig = {
  FREE_ROLLS_PER_DAY: 1,
  LIFETIME_PRICE: "12,99 €",
  PAYWALL_TITLE: "Accès à vie 💕",
  PAYWALL_BULLETS: "Lancers illimités|Dés personnalisables|Aucune pub",
  FEATURE_FLAGS: {
    customFaces: true,
    history: true,
    analytics: true,
    sharing: true,
  },
};

// Cache local de la configuration
let configCache: AppConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Collection Firestore pour la configuration
const CONFIG_COLLECTION = "appConfig";
const CONFIG_DOC_ID = "main";

// Initialiser la configuration par défaut dans Firestore
export const initializeConfig = async (): Promise<boolean> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists()) {
      await setDoc(configRef, {
        ...DEFAULT_CONFIG,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        platform: Platform.OS,
      });
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Récupérer la configuration depuis Firestore
export const fetchConfig = async (): Promise<AppConfig> => {
  try {
    // Vérifier le cache
    const now = Date.now();
    if (configCache && now - lastFetchTime < CACHE_DURATION) {
      return configCache;
    }

    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      const data = configDoc.data();
      configCache = {
        FREE_ROLLS_PER_DAY:
          data.FREE_ROLLS_PER_DAY || DEFAULT_CONFIG.FREE_ROLLS_PER_DAY,
        LIFETIME_PRICE: data.LIFETIME_PRICE || DEFAULT_CONFIG.LIFETIME_PRICE,
        PAYWALL_TITLE: data.PAYWALL_TITLE || DEFAULT_CONFIG.PAYWALL_TITLE,
        PAYWALL_BULLETS: data.PAYWALL_BULLETS || DEFAULT_CONFIG.PAYWALL_BULLETS,
        FEATURE_FLAGS: data.FEATURE_FLAGS || DEFAULT_CONFIG.FEATURE_FLAGS,
      };
      lastFetchTime = now;
      return configCache;
    } else {
      // Créer la configuration si elle n'existe pas
      await initializeConfig();
      configCache = DEFAULT_CONFIG;
      lastFetchTime = now;
      return configCache;
    }
  } catch (error) {
    // Retourner la configuration en cache ou par défaut
    return configCache || DEFAULT_CONFIG;
  }
};

// Récupérer une valeur de configuration spécifique
export const getConfigValue = async <K extends keyof AppConfig>(
  key: K,
): Promise<AppConfig[K]> => {
  try {
    const config = await fetchConfig();
    return config[key];
  } catch (error) {
    return DEFAULT_CONFIG[key];
  }
};

// Récupérer les feature flags
export const getFeatureFlags = async (): Promise<
  AppConfig["FEATURE_FLAGS"]
> => {
  try {
    const config = await fetchConfig();
    return config.FEATURE_FLAGS;
  } catch (error) {
    return DEFAULT_CONFIG.FEATURE_FLAGS;
  }
};

// Vérifier si une feature est activée
export const isFeatureEnabled = async (
  featureName: keyof AppConfig["FEATURE_FLAGS"],
): Promise<boolean> => {
  try {
    const flags = await getFeatureFlags();
    return flags[featureName] || false;
  } catch (error) {
    return DEFAULT_CONFIG.FEATURE_FLAGS[featureName] || false;
  }
};

// Mettre à jour la configuration (admin uniquement)
export const updateConfig = async (
  updates: Partial<AppConfig>,
): Promise<boolean> => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);

    await setDoc(
      configRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // Invalider le cache
    configCache = null;
    lastFetchTime = 0;

    return true;
  } catch (error) {
    return false;
  }
};

// Forcer la mise à jour du cache
export const refreshConfig = async (): Promise<AppConfig> => {
  configCache = null;
  lastFetchTime = 0;
  return await fetchConfig();
};

// Obtenir la configuration avec des valeurs par défaut immédiates (synchrone)
export const getConfigSync = (): AppConfig => {
  return configCache || DEFAULT_CONFIG;
};

// Hooks pour React
export const useConfig = () => {
  const [config, setConfig] = React.useState<AppConfig>(getConfigSync());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const freshConfig = await fetchConfig();
        setConfig(freshConfig);
      } catch (error) {
        // Erreur chargement config ignorée
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return {
    config,
    loading,
    refreshConfig: async () => {
      const freshConfig = await refreshConfig();
      setConfig(freshConfig);
    },
  };
};

// Export des valeurs par défaut pour compatibilité
export const FREE_ROLLS_PER_DAY = DEFAULT_CONFIG.FREE_ROLLS_PER_DAY;
export const LIFETIME_PRICE = DEFAULT_CONFIG.LIFETIME_PRICE;
export const PAYWALL_TITLE = DEFAULT_CONFIG.PAYWALL_TITLE;
export const PAYWALL_BULLETS = DEFAULT_CONFIG.PAYWALL_BULLETS;
export const FEATURE_FLAGS = DEFAULT_CONFIG.FEATURE_FLAGS;

export default {
  initializeConfig,
  fetchConfig,
  getConfigValue,
  getFeatureFlags,
  isFeatureEnabled,
  updateConfig,
  refreshConfig,
  getConfigSync,
  DEFAULT_CONFIG,
};
