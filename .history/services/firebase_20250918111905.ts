import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
} from "firebase/remote-config";

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

// Auth will be initialized lazily to avoid Expo Go issues
let _auth: any = null;

export const getAuthInstance = () => {
  if (!_auth) {
    try {
      console.log('Initializing Firebase Auth...');
      _auth = getAuth(app);
      console.log('Firebase Auth initialized successfully');
    } catch (error) {
      console.warn('Firebase Auth initialization failed:', error);
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
      console.warn(`Trying to access auth.${String(prop)} but auth is not available`);
      return undefined;
    }
    return authInstance[prop];
  }
});

// Remote Config will be initialized lazily to avoid Expo Go issues
let _remoteConfig: any = null;

export const getRemoteConfigInstance = () => {
  if (!_remoteConfig) {
    try {
      console.log('Initializing Firebase Remote Config...');
      _remoteConfig = getRemoteConfig(app);
      console.log('Firebase Remote Config initialized successfully');
    } catch (error) {
      console.warn('Firebase Remote Config initialization failed:', error);
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
      console.warn(`Trying to access remoteConfig.${String(prop)} but remoteConfig is not available`);
      return undefined;
    }
    return configInstance[prop];
  }
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
    console.log("Remote Config non disponible, utilisation des valeurs par défaut");
    return;
  }

  try {
    configInstance.defaultConfig = remoteConfigDefaults;
    configInstance.settings = {
      minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 1 heure en prod, immédiat en dev
      fetchTimeoutMillis: 60000, // 60 secondes
    };

    await fetchAndActivate(configInstance);
    console.log("Remote Config activé");
  } catch (error) {
    console.error("Erreur Remote Config:", error);
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
    console.error(`Erreur récupération RC ${key}:`, error);
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
        console.warn("Auth not available, skipping authentication");
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
              // Don't reject, resolve with null for graceful degradation
              resolve(null);
            });
        }
      });
    } catch (error) {
      console.error("Failed to initialize auth for anonymous sign in:", error);
      // Don't reject, resolve with null for graceful degradation
      resolve(null);
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
