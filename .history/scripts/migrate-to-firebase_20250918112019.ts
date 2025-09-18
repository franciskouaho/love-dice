#!/usr/bin/env ts-node

/**
 * Script de migration vers Firebase
 * Ce script initialise Firebase et migre les données par défaut vers Firestore
 */

import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, Auth, signInAnonymously } from "firebase/auth";

// Types
interface DiceFace {
  label: string;
  category: "payer" | "repas" | "activite";
  emoji: string;
  weight: number;
  actions?: string[];
  isDefault: boolean;
  isActive: boolean;
}

interface ConfigDefaults {
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

interface FirebaseContext {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

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

const DEFAULT_FACES: DiceFace[] = [
  {
    label: "Tu paies",
    category: "payer",
    emoji: "🍷",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Je paie",
    category: "payer",
    emoji: "💳",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "50/50",
    category: "payer",
    emoji: "🧾",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Pile ou Face",
    category: "payer",
    emoji: "🪙",
    weight: 1,
    isDefault: true,
    isActive: true,
  },

  {
    label: "Restaurant",
    category: "repas",
    emoji: "🍽️",
    weight: 1,
    actions: ["maps"],
    isDefault: true,
    isActive: true,
  },
  {
    label: "Livraison",
    category: "repas",
    emoji: "🍕",
    weight: 1,
    actions: ["delivery"],
    isDefault: true,
    isActive: true,
  },
  {
    label: "Street food",
    category: "repas",
    emoji: "🌮",
    weight: 1,
    actions: ["maps"],
    isDefault: true,
    isActive: true,
  },
  {
    label: "Fait maison",
    category: "repas",
    emoji: "🍝",
    weight: 1,
    actions: ["recipe"],
    isDefault: true,
    isActive: true,
  },
  {
    label: "Surprise de l'autre",
    category: "repas",
    emoji: "🎁",
    weight: 1,
    isDefault: true,
    isActive: true,
  },

  {
    label: "Cinéma maison",
    category: "activite",
    emoji: "🎬",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Jeu de société",
    category: "activite",
    emoji: "🎲",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Balade nocturne",
    category: "activite",
    emoji: "🌙",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Tenue chic",
    category: "activite",
    emoji: "👔",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Budget max 30€",
    category: "activite",
    emoji: "💶",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Dessert obligatoire",
    category: "activite",
    emoji: "🍰",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Pas d'écran",
    category: "activite",
    emoji: "📵",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Karaoké",
    category: "activite",
    emoji: "🎤",
    weight: 1,
    isDefault: true,
    isActive: true,
  },
  {
    label: "Musée",
    category: "activite",
    emoji: "🖼️",
    weight: 1,
    actions: ["maps"],
    isDefault: true,
    isActive: true,
  },
  {
    label: "Bowling",
    category: "activite",
    emoji: "🎳",
    weight: 1,
    actions: ["maps"],
    isDefault: true,
    isActive: true,
  },
];

const CONFIG_DEFAULTS: ConfigDefaults = {
  FREE_ROLLS_PER_DAY: 3,
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

async function initializeFirebase(): Promise<FirebaseContext> {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  await signInAnonymously(auth);
  return { app, db, auth };
}

async function migrateDefaultFaces(db: Firestore): Promise<void> {
  const defaultFacesRef = collection(db, "defaultFaces");
  const batch = writeBatch(db);

  DEFAULT_FACES.forEach((face, index) => {
    const faceRef = doc(defaultFacesRef, `default_${index}`);
    batch.set(faceRef, {
      ...face,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

async function initializeAppConfig(db: Firestore): Promise<void> {
  const configRef = doc(db, "appConfig", "main");
  await setDoc(configRef, {
    ...CONFIG_DEFAULTS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function initializeRemoteConfig(db: Firestore): Promise<void> {
  const configRef = collection(db, "remoteConfig");
  const batch = writeBatch(db);

  Object.entries(CONFIG_DEFAULTS).forEach(([key, value]) => {
    const configDocRef = doc(configRef, key);
    batch.set(configDocRef, {
      value,
      type: typeof value === "object" ? "json" : typeof value,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

async function createSampleUserData(db: Firestore, auth: Auth): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    createdAt: serverTimestamp(),
    hasLifetime: false,
    freeRollsUsedToday: 0,
    freeDayKey: new Date().toISOString().split("T")[0],
    prefs: {
      haptics: true,
      weights: { payer: 0.2, repas: 0.2, activite: 0.6 },
    },
    notificationsEnabled: false,
    notificationPreferences: {
      enabled: true,
      eveningReminders: true,
      milestoneAlerts: true,
      weeklyDigest: false,
      marketingEmails: false,
      reminderTime: "19:00",
    },
    lastSyncAt: serverTimestamp(),
  });
}

async function checkFirestoreRules(): Promise<void> {
  // Rules will be deployed separately
}

async function createStatistics(db: Firestore): Promise<void> {
  const statsRef = doc(db, "stats", "global");
  await setDoc(statsRef, {
    totalUsers: 0,
    totalRolls: 0,
    totalLifetimePurchases: 0,
    dailyActiveUsers: 0,
    monthlyActiveUsers: 0,
    lastUpdated: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

async function createFirestoreIndexes(): Promise<void> {
  console.log("📋 Firestore indexes should be created via firebase deploy --only firestore:indexes");
  console.log("   Using the firestore.indexes.json file in the project root");
  console.log("   Indexes will be automatically created when you deploy to Firebase");
  
  // Note: Indexes are typically managed through firestore.indexes.json and Firebase CLI
  // This function is a placeholder for the migration script
}

async function runMigration(): Promise<void> {
  try {
    const { db, auth } = await initializeFirebase();
    await migrateDefaultFaces(db);
    await initializeAppConfig(db);
    await initializeRemoteConfig(db);
    await createStatistics(db);
    await createFirestoreIndexes();
    await createSampleUserData(db, auth);
    await checkFirestoreRules();
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Point d'entrée du script
if (require.main === module) {
  runMigration();
}

export { runMigration, DEFAULT_FACES, CONFIG_DEFAULTS };
export type { DiceFace, ConfigDefaults, FirebaseContext };
