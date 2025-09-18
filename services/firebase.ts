import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from "firebase/remote-config";

// Configuration Firebase - Expo va automatiquement utiliser les credentials natifs
const firebaseConfig = {
  apiKey: "AIzaSyAXrDxGHxOgHcFxRfHEL2Qi82KpE29CJMY",
  authDomain: "love-dice-7a878.firebaseapp.com",
  projectId: "love-dice-7a878",
  storageBucket: "love-dice-7a878.firebasestorage.app",
  messagingSenderId: "916106041141",
  appId: "1:916106041141:web:a41b259be98ae885cd9e7c",
  measurementId: "G-7Z5GB9RCT5",
};

// Initialize Firebase avec protection contre les multiples initialisations
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db = getFirestore(app);

// Auth will be initialized lazily to avoid Expo Go issues
let _auth: any = null;

export const getAuthInstance = () => {
  if (!_auth) {
    try {
      console.log("🔧 Tentative d'initialisation getAuth...");
      console.log("🔧 App instance:", app ? "✅" : "❌");
      console.log("🔧 App name:", app?.name);
      console.log("🔧 App options:", app?.options?.projectId);

      _auth = getAuth(app);
      console.log("✅ getAuth réussi, instance créée");
      console.log("✅ Auth app:", _auth?.app?.name);
    } catch (error) {
      console.error("❌ Erreur getAuth:", error);
      console.error("❌ Type d'erreur:", typeof error);
      console.error("❌ Message:", (error as Error)?.message);
      console.error("❌ Stack:", (error as Error)?.stack);
      return null;
    }
  }
  return _auth;
};

// Legacy export for backward compatibility - but this will be lazy loaded
export const auth = new Proxy({} as any, {
  get(target, prop) {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      return undefined;
    }
    return authInstance[prop];
  },
});

// Remote Config will be initialized lazily to avoid Expo Go issues
let _remoteConfig: any = null;

export const getRemoteConfigInstance = () => {
  if (!_remoteConfig) {
    try {
      _remoteConfig = getRemoteConfig(app);
    } catch (error) {
      return null;
    }
  }
  return _remoteConfig;
};

// Legacy export for backward compatibility
export const remoteConfig = new Proxy({} as any, {
  get(target, prop) {
    const configInstance = getRemoteConfigInstance();
    if (!configInstance) {
      return undefined;
    }
    return configInstance[prop];
  },
});

// Remote Config defaults
const remoteConfigDefaults = {
  FREE_ROLLS_PER_DAY: 3,
  LIFETIME_PRICE: "12,99 €",
  PAYWALL_TITLE: "Accès à vie 💕",
  PAYWALL_BULLETS: "Lancers illimités|Dés personnalisables|Aucune pub",
  FEATURE_FLAGS: '{"customFaces":true,"history":true}',
};

// Initialize Remote Config
export const initRemoteConfig = async () => {
  const configInstance = getRemoteConfigInstance();
  if (!configInstance) {
    return;
  }

  try {
    configInstance.defaultConfig = remoteConfigDefaults;
    configInstance.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 heure
      fetchTimeoutMillis: 60000, // 60 secondes
    };

    await fetchAndActivate(configInstance);
  } catch (error) {
    // Erreur Remote Config ignorée
  }
};

// Helper pour récupérer les valeurs Remote Config
export const getRemoteConfigValue = (key: string) => {
  const configInstance = getRemoteConfigInstance();
  if (!configInstance) {
    return remoteConfigDefaults[key as keyof typeof remoteConfigDefaults] || "";
  }

  try {
    return getValue(configInstance, key).asString();
  } catch (error) {
    return remoteConfigDefaults[key as keyof typeof remoteConfigDefaults] || "";
  }
};

export const getRemoteConfigNumber = (key: string): number => {
  const configInstance = getRemoteConfigInstance();
  if (!configInstance) {
    const defaultValue =
      remoteConfigDefaults[key as keyof typeof remoteConfigDefaults];
    return typeof defaultValue === "number" ? defaultValue : 0;
  }

  try {
    return getValue(configInstance, key).asNumber();
  } catch (error) {
    const defaultValue =
      remoteConfigDefaults[key as keyof typeof remoteConfigDefaults];
    return typeof defaultValue === "number" ? defaultValue : 0;
  }
};

export const getFeatureFlags = () => {
  try {
    const flags = getRemoteConfigValue("FEATURE_FLAGS");
    return JSON.parse(String(flags));
  } catch (error) {
    return { customFaces: true, history: true };
  }
};

// Auth anonyme automatique
export const initAuth = () => {
  return new Promise((resolve, reject) => {
    try {
      const authInstance = getAuthInstance();
      if (!authInstance) {
        resolve(null);
        return;
      }

      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        } else {
          // Connexion anonyme automatique
          signInAnonymously(authInstance)
            .then((result) => {
              unsubscribe();
              resolve(result.user);
            })
            .catch((error) => {
              unsubscribe();
              resolve(null);
            });
        }
      });
    } catch (error) {
      resolve(null);
    }
  });
};

// Initialize Firebase services
export const initFirebase = async () => {
  try {
    const authInstance = getAuthInstance();
    if (authInstance) {
      await initAuth();
    }

    await initRemoteConfig();

    return true;
  } catch (error) {
    return false;
  }
};

export default app;
