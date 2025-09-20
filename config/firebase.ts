import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  User
} from "firebase/auth";
import { doc, Firestore, getFirestore, setDoc, Timestamp } from "firebase/firestore";
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  RemoteConfig
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
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Auth will be initialized lazily to avoid Expo Go issues
let _auth: Auth | null = null;

export const getAuthInstance = (): Auth | null => {
  if (!_auth) {
    try {
      // 🔥 Utiliser initializeAuth avec AsyncStorage pour VRAIE persistance
      try {
        _auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } catch {
        _auth = getAuth(app);
      }
      // Écouter les changements d'authentification pour debug
      onAuthStateChanged(_auth, (user: User | null) => {
        if (user) {
        } else {
        }
      });
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
export const auth = new Proxy({} as Auth, {
  get(target, prop) {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      return undefined;
    }
    return authInstance[prop as keyof Auth];
  },
});

// Remote Config will be initialized lazily to avoid Expo Go issues
let _remoteConfig: RemoteConfig | null = null;

export const getRemoteConfigInstance = (): RemoteConfig | null => {
  if (!_remoteConfig) {
    try {
      _remoteConfig = getRemoteConfig(app);
    } catch {
      return null;
    }
  }
  return _remoteConfig;
};

// Legacy export for backward compatibility
export const remoteConfig = new Proxy({} as RemoteConfig, {
  get(target, prop) {
    const configInstance = getRemoteConfigInstance();
    if (!configInstance) {
      return undefined;
    }
    return configInstance[prop as keyof RemoteConfig];
  },
});

// Remote Config defaults
const remoteConfigDefaults: Record<string, string | number> = {
  FREE_ROLLS_PER_DAY: 3,
  LIFETIME_PRICE: "12,99 €",
  PAYWALL_TITLE: "Accès à vie 💕",
  PAYWALL_BULLETS: "Lancers illimités|Dés personnalisables|Aucune pub",
  FEATURE_FLAGS: '{"customFaces":true,"history":true}',
};

// Initialize Remote Config
export const initRemoteConfig = async (): Promise<void> => {
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
  } catch {
    // Erreur Remote Config ignorée
  }
};

// Helper pour récupérer les valeurs Remote Config
export const getRemoteConfigValue = (key: string): string => {
  const configInstance = getRemoteConfigInstance();
  if (!configInstance) {
    return (remoteConfigDefaults[key] as string) || "";
  }

  try {
    return getValue(configInstance, key).asString();
  } catch {
    return (remoteConfigDefaults[key] as string) || "";
  }
};

export const getRemoteConfigNumber = (key: string): number => {
  const configInstance = getRemoteConfigInstance();
  if (!configInstance) {
    const defaultValue = remoteConfigDefaults[key];
    return typeof defaultValue === "number" ? defaultValue : 0;
  }

  try {
    return getValue(configInstance, key).asNumber();
  } catch {
    const defaultValue = remoteConfigDefaults[key];
    return typeof defaultValue === "number" ? defaultValue : 0;
  }
};

export const getFeatureFlags = (): Record<string, boolean> => {
  try {
    const flags = getRemoteConfigValue("FEATURE_FLAGS");
    return JSON.parse(String(flags));
  } catch {
    return { customFaces: true, history: true };
  }
};

// Auth anonyme automatique avec protection contre les appels multiples
let authPromise: Promise<User | null> | null = null;

// Fonction pour créer explicitement un nouvel utilisateur anonyme
export const createAnonymousUser = async (): Promise<User> => {
  try {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      console.error("❌ Instance Auth non disponible");
      throw new Error("Instance Auth non disponible");
    }
    const result = await signInAnonymously(authInstance);
    const docRef = doc(db, 'user_settings', result.user.uid);
    await setDoc(docRef, {
      hasLifetime: false,
      unlimited: false,
      dailyQuota: 50,
      remainingRolls: 50,
      lastReset: Timestamp.now(),
      grantedAt: Timestamp.now(),
      source: 'anonymous_signup',
    }, { merge: true });
    return result.user;
  } catch (error) {
    console.error("❌ Erreur création utilisateur anonyme:", error);
    console.error("❌ Type d'erreur:", (error as Error)?.constructor?.name);
    console.error("❌ Message:", (error as Error)?.message);
    throw error;
  }
};

export const initAuth = (): Promise<User | null> => {
  if (authPromise) {
    return authPromise;
  }
  authPromise = new Promise<User | null>((resolve) => {
    try {
      const authInstance = getAuthInstance();
      if (!authInstance) {
        authPromise = null;
        resolve(null);
        return;
      }
      if (authInstance.currentUser) {
        authPromise = null;
        resolve(authInstance.currentUser);
        return;
      }
      let isSigningIn = false;
      const unsubscribe = onAuthStateChanged(authInstance, (user: User | null) => {
        if (user) {
          unsubscribe();
          authPromise = null;
          resolve(user);
        } else if (!isSigningIn) {
          unsubscribe();
          authPromise = null;
          resolve(null);
        }
      });
      setTimeout(() => {
        if (authPromise) {
          unsubscribe();
          authPromise = null;
          resolve(null);
        }
      }, 10000);
    } catch (error) {
      console.error("❌ Erreur dans initAuth:", error);
      authPromise = null;
      resolve(null);
    }
  });
  return authPromise;
};

// Initialize Firebase services
export const initFirebase = async (): Promise<boolean> => {
  try {
    const authInstance = getAuthInstance();
    if (authInstance) {
      await initAuth();
    }

    await initRemoteConfig();

    return true;
  } catch {
    return false;
  }
};

export default app;
