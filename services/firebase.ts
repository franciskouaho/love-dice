import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  User
} from 'firebase/auth';
import {
  doc,
  getFirestore,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue
} from 'firebase/remote-config';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXrDxGHxOgHcFxRfHEL2Qi82KpE29CJMY",
  authDomain: "love-dice-7a878.firebaseapp.com",
  projectId: "love-dice-7a878",
  storageBucket: "love-dice-7a878.firebasestorage.app",
  messagingSenderId: "916106041141",
  appId: "1:916106041141:web:a41b259be98ae885cd9e7c",
  measurementId: "G-7Z5GB9RCT5"
};

// Initialiser Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialiser Firestore
export const db = getFirestore(app);

// Initialiser Firebase Auth avec persistence
let auth: any = null;

try {
  // Essayer d'initialiser Auth avec persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log("✅ Firebase Auth initialisé avec AsyncStorage persistence");
} catch {
  // Si l'Auth est déjà initialisé, récupérer l'instance existante
  console.log("ℹ️ Firebase Auth déjà initialisé, récupération de l'instance");
  auth = getAuth(app);
}

export { auth };

// Initialiser Remote Config
export const remoteConfig = getRemoteConfig(app);

// Fonction pour créer un utilisateur anonyme
export const createAnonymousUser = async (): Promise<User> => {
  try {
    console.log("🔄 Création utilisateur anonyme...");
    const result = await signInAnonymously(auth);
    console.log("✅ Utilisateur anonyme créé:", result.user.uid);
    
    // Créer les données utilisateur dans Firestore
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
    
    console.log("✅ Données utilisateur créées dans Firestore");
    return result.user;
  } catch (error) {
    console.error("❌ Erreur création utilisateur anonyme:", error);
    throw error;
  }
};

// Promise pour l'initialisation de l'auth
let authPromise: Promise<User | null> | null = null;

// Fonction d'initialisation de l'auth
export const initAuth = (): Promise<User | null> => {
  if (authPromise) {
    return authPromise;
  }
  
  authPromise = new Promise((resolve) => {
    try {
      console.log("🔄 Initialisation de l'Auth...");
      
      // Vérifier si un utilisateur est déjà connecté
      if (auth.currentUser) {
        console.log("✅ Utilisateur déjà connecté:", auth.currentUser.uid);
        authPromise = null;
        resolve(auth.currentUser);
        return;
      }
      
      // Écouter les changements d'état d'authentification
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("✅ Utilisateur connecté via onAuthStateChanged:", user.uid);
          unsubscribe();
          authPromise = null;
          resolve(user);
        } else {
          console.log("ℹ️ Aucun utilisateur connecté");
          unsubscribe();
          authPromise = null;
          resolve(null);
        }
      });
      
      // Timeout de sécurité
      setTimeout(() => {
        if (authPromise) {
          unsubscribe();
          authPromise = null;
          resolve(null);
        }
      }, 5000);
      
    } catch (error) {
      console.error("❌ Erreur dans initAuth:", error);
      authPromise = null;
      resolve(null);
    }
  });
  
  return authPromise;
};

// Fonction pour récupérer l'instance Auth
export const getAuthInstance = () => {
  return auth;
};

// Configuration Remote Config
export const setupRemoteConfig = async () => {
  try {
    remoteConfig.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 heure
      fetchTimeoutMillis: 60000, // 60 secondes
    };

    remoteConfig.defaultConfig = {
      maintenance_mode: false,
      feature_custom_faces: true,
      feature_premium: true,
    };

    await fetchAndActivate(remoteConfig);
    console.log("✅ Remote Config initialisé");
  } catch (error) {
    console.error("❌ Erreur Remote Config:", error);
  }
};

// Fonction pour récupérer une valeur Remote Config
export const getRemoteConfigValue = (key: string) => {
  try {
    return getValue(remoteConfig, key);
  } catch (error) {
    console.error(`❌ Erreur récupération Remote Config ${key}:`, error);
    return null;
  }
};

export default app;