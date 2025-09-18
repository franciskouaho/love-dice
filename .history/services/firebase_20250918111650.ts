import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from "firebase/remote-config";

// Auth imports will be loaded lazily to avoid Expo Go issues
let authModule: any = null;

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXrDxGHxOgHcFxRfHEL2Qi82KpE29CJMY",
  authDomain: "love-dice-7a878.firebaseapp.com",
  projectId: "love-dice-7a878",
  storageBucket: "love-dice-7a878.firebasestorage.app",
  messagingSenderId: "916106041141",
  appId: "1:916106041141:web:a41b259be98ae885cd9e7c",
  measurementId: "G-7Z5GB9RCT5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth lazily for Expo Go compatibility
let _auth: any = null;
export const getAuthInstance = () => {
  if (!_auth) {
    try {
      _auth = getAuth(app);
    } catch (error) {
      console.warn('Auth not ready yet:', error);
      return null;
    }
  }
  return _auth;
};

// Export auth for backward compatibility
export const auth = new Proxy({} as any, {
  get: (target, prop) => {
    const authInstance = getAuthInstance();
    if (!authInstance) {
      console.warn(`Auth not initialized when accessing ${String(prop)}`);
      return undefined;
    }
    return authInstance[prop];
  }
});

// Initialize Remote Config
export const remoteConfig = getRemoteConfig(app);

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
  if (!remoteConfig) {
    console.log("Remote Config non disponible");
    return;
  }

  try {
    remoteConfig.defaultConfig = remoteConfigDefaults;
    remoteConfig.settings = {
      minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 1 heure en prod, immédiat en dev
      fetchTimeoutMillis: 60000, // 60 secondes
    };

    await fetchAndActivate(remoteConfig);
    console.log("Remote Config activé");
  } catch (error) {
    console.error("Erreur Remote Config:", error);
  }
};

// Helper pour récupérer les valeurs Remote Config
export const getRemoteConfigValue = (key: string) => {
  if (!remoteConfig) {
    return remoteConfigDefaults[key as keyof typeof remoteConfigDefaults] || "";
  }

  try {
    return getValue(remoteConfig, key).asString();
  } catch (error) {
    console.error(`Erreur récupération RC ${key}:`, error);
    return remoteConfigDefaults[key as keyof typeof remoteConfigDefaults] || "";
  }
};

export const getRemoteConfigNumber = (key: string): number => {
  if (!remoteConfig) {
    const defaultValue =
      remoteConfigDefaults[key as keyof typeof remoteConfigDefaults];
    return typeof defaultValue === "number" ? defaultValue : 0;
  }

  try {
    return getValue(remoteConfig, key).asNumber();
  } catch (error) {
    console.error(`Erreur récupération RC ${key}:`, error);
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
    console.error("Erreur parsing feature flags:", error);
    return { customFaces: true, history: true };
  }
};

// Auth anonyme automatique
export const initAuth = () => {
  return new Promise((resolve, reject) => {
    try {
      const authInstance = getAuthInstance();
      if (!authInstance) {
        console.warn("Auth instance not available, skipping auth init");
        resolve(null);
        return;
      }

      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          console.log("Utilisateur connecté:", user.uid);
          unsubscribe();
          resolve(user);
        } else {
          // Connexion anonyme automatique
          signInAnonymously(authInstance)
            .then((result) => {
              console.log("Connexion anonyme réussie:", result.user.uid);
              unsubscribe();
              resolve(result.user);
            })
            .catch((error) => {
              console.error("Erreur connexion anonyme:", error);
              unsubscribe();
              reject(error);
            });
        }
      });
    } catch (error) {
      console.error("Failed to initialize auth for anonymous sign in:", error);
      resolve(null); // Don't reject, just resolve with null for graceful degradation
    }
  });
};

// Initialize Firebase services
export const initFirebase = async () => {
  try {
    console.log("Initialisation Firebase...");

    // Auth anonyme
    await initAuth();

    // Remote Config
    await initRemoteConfig();

    console.log("Firebase initialisé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur initialisation Firebase:", error);
    return false;
  }
};

export default app;
