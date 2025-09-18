import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously
} from "firebase/auth";
import { doc, getFirestore, setDoc, Timestamp } from "firebase/firestore";
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

      // 🔥 Utiliser initializeAuth avec AsyncStorage pour VRAIE persistance
      try {
        _auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        console.log("✅ Auth instance créée avec persistance AsyncStorage");
      } catch (error) {
        console.log("⚠️ initializeAuth échoué, fallback vers getAuth:", error);
        _auth = getAuth(app);
      }
      console.log("✅ Auth app:", _auth?.app?.name);
      
      // Écouter les changements d'authentification pour debug
      onAuthStateChanged(_auth, (user) => {
        if (user) {
          console.log("🔥 Utilisateur persisté détecté:", user.uid);
        } else {
          console.log("👤 Aucun utilisateur persisté");
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

// Auth anonyme automatique avec protection contre les appels multiples
let authPromise: Promise<any> | null = null;

// Fonction pour créer explicitement un nouvel utilisateur anonyme
export const createAnonymousUser = async () => {
  try {
    console.log("🔧 Début création utilisateur anonyme...");
    const authInstance = getAuthInstance();
    console.log("🔍 Auth instance disponible:", !!authInstance);
    
    if (!authInstance) {
      console.error("❌ Instance Auth non disponible");
      throw new Error("Instance Auth non disponible");
    }

    console.log("🔧 Appel signInAnonymously...");
    const result = await signInAnonymously(authInstance);
    console.log("✅ Utilisateur anonyme créé:", result.user.uid);
    console.log("🔍 Utilisateur détails:", {
      uid: result.user.uid,
      isAnonymous: result.user.isAnonymous,
      providerId: result.user.providerId
    });

    // 🔥 CRÉER LE QUOTA IMMÉDIATEMENT
    console.log("🔧 Création du quota pour:", result.user.uid);
    const db = getFirestore();
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
    console.log("✅ Quota de 50 lancers créé pour:", result.user.uid);

    return result.user;
  } catch (error) {
    console.error("❌ Erreur création utilisateur anonyme:", error);
    console.error("❌ Type d'erreur:", error?.constructor?.name);
    console.error("❌ Message:", error?.message);
    throw error;
  }
};

export const initAuth = () => {
  // Si une authentification est déjà en cours, retourner la même promesse
  if (authPromise) {
    console.log("🔄 initAuth déjà en cours, réutilisation de la promesse existante");
    return authPromise;
  }

  authPromise = new Promise((resolve, reject) => {
    try {
      const authInstance = getAuthInstance();
      if (!authInstance) {
        authPromise = null; // Reset pour permettre un retry plus tard
        resolve(null);
        return;
      }

      // Vérifier d'abord si un utilisateur est déjà connecté
      if (authInstance.currentUser) {
        console.log("✅ Utilisateur déjà connecté:", authInstance.currentUser.uid);
        authPromise = null; // Reset pour les futurs appels
        resolve(authInstance.currentUser);
        return;
      }

      let isSigningIn = false;
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          console.log("✅ Utilisateur Firebase après state change:", user.uid);
          unsubscribe();
          authPromise = null; // Reset pour les futurs appels
          resolve(user);
        } else if (!isSigningIn) {
          // NE PLUS créer automatiquement un utilisateur anonyme
          console.log("ℹ️ Aucun utilisateur détecté, mais ne pas créer automatiquement");
          unsubscribe();
          authPromise = null; // Reset pour les futurs appels
          resolve(null);
        }
      });

      // Timeout de sécurité
      setTimeout(() => {
        if (authPromise) {
          console.warn("⚠️ Timeout initAuth, résolution avec null");
          unsubscribe();
          authPromise = null;
          resolve(null);
        }
      }, 10000); // 10 secondes maximum

    } catch (error) {
      console.error("❌ Erreur dans initAuth:", error);
      authPromise = null; // Reset pour permettre un retry
      resolve(null);
    }
  });

  return authPromise;
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
