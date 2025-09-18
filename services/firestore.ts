import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
} from "firebase/firestore";
import { DiceRoll } from "../utils/dice";
import { UserPreferences } from "../utils/quota";
import { db, getAuthInstance } from "./firebase";

// Interface pour le profil utilisateur
export interface UserProfile {
  uid: string;
  createdAt: any;
  hasLifetime: boolean;
  freeRollsUsedToday: number;
  freeDayKey: string;
  prefs: UserPreferences;
  lastSyncAt?: any;
  pushToken?: string;
  pushTokenUpdatedAt?: any;
  notificationsEnabled?: boolean;
  notificationPreferences?: {
    enabled: boolean;
    eveningReminders: boolean;
    milestoneAlerts: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
    reminderTime: string;
  };
  notificationPreferencesUpdatedAt?: any;
  playerNames?: {
    player1: string;
    player2: string;
    updatedAt?: any;
  };
}

// Interface pour l'historique des lancers
export interface HistoryEntry {
  id: string;
  createdAt: any;
  faceId: string;
  label: string;
  category: string;
  emoji: string;
}

// Créer ou mettre à jour le profil utilisateur
export const createUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Créer un nouveau profil
      const newProfile: Omit<UserProfile, "uid"> = {
        createdAt: serverTimestamp(),
        hasLifetime: false,
        freeRollsUsedToday: 0,
        freeDayKey: new Date().toISOString().split("T")[0],
        prefs: {
          haptics: true,
          weights: {
            payer: 0.2,
            repas: 0.2,
            activite: 0.6,
          },
        },
        lastSyncAt: serverTimestamp(),
        notificationsEnabled: false,
        notificationPreferences: {
          enabled: true,
          eveningReminders: true,
          milestoneAlerts: true,
          weeklyDigest: false,
          marketingEmails: false,
          reminderTime: "19:00",
        },
      };

      await setDoc(userRef, newProfile);

      return { uid, ...newProfile };
    } else {
      // Retourner le profil existant
      const profileData = userDoc.data() as Omit<UserProfile, "uid">;
      return { uid, ...profileData };
    }
  } catch (error) {
    return null;
  }
};

// Récupérer le profil utilisateur
export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const profileData = userDoc.data() as Omit<UserProfile, "uid">;
      return { uid, ...profileData };
    } else {
      // Créer le profil s'il n'existe pas
      return await createUserProfile(uid);
    }
  } catch (error) {
    return null;
  }
};

// Mettre à jour le profil utilisateur
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<UserProfile, "uid" | "createdAt">>,
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      lastSyncAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Mettre à jour le statut lifetime
export const updateLifetimeStatus = async (
  uid: string,
  hasLifetime: boolean,
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      hasLifetime,
      lastSyncAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Mettre à jour le quota quotidien
export const updateDailyQuota = async (
  uid: string,
  freeRollsUsedToday: number,
  freeDayKey: string,
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      freeRollsUsedToday,
      freeDayKey,
      lastSyncAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Ajouter un lancer à l'historique
export const addToHistory = async (
  uid: string,
  roll: DiceRoll,
): Promise<boolean> => {
  try {
    const historyRef = collection(db, "users", uid, "history");
    const historyEntry: Omit<HistoryEntry, "id"> = {
      createdAt: serverTimestamp(),
      faceId: roll.face.id,
      label: roll.face.label,
      category: roll.face.category,
      emoji: roll.face.emoji,
    };

    await addDoc(historyRef, historyEntry);
    return true;
  } catch (error) {
    return false;
  }
};

// Récupérer l'historique des lancers
export const getHistory = async (
  uid: string,
  limitCount: number = 10,
): Promise<HistoryEntry[]> => {
  try {
    const historyRef = collection(db, "users", uid, "history");
    const q = query(
      historyRef,
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );
    const querySnapshot = await getDocs(q);

    const history: HistoryEntry[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() } as HistoryEntry);
    });

    return history;
  } catch (error) {
    return [];
  }
};

// Vider l'historique
export const clearHistory = async (uid: string): Promise<boolean> => {
  try {
    const historyRef = collection(db, "users", uid, "history");
    const querySnapshot = await getDocs(historyRef);

    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    return true;
  } catch (error) {
    return false;
  }
};

// Écouter les changements du profil utilisateur en temps réel
export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void,
): Unsubscribe => {
  const userRef = doc(db, "users", uid);

  return onSnapshot(
    userRef,
    (doc) => {
      if (doc.exists()) {
        const profileData = doc.data() as Omit<UserProfile, "uid">;
        callback({ uid, ...profileData });
      } else {
        callback(null);
      }
    },
    (error) => {
      callback(null);
    },
  );
};

// Mettre à jour les préférences utilisateur
export const updateUserPreferences = async (
  uid: string,
  prefs: UserPreferences,
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      prefs,
      lastSyncAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Gestion des faces personnalisées
export interface CustomFace {
  id: string;
  label: string;
  category: "payer" | "repas" | "activite";
  emoji: string;
  weight: number;
  createdAt: any;
  updatedAt: any;
  isActive: boolean;
  actions?: string[];
}

// Récupérer les faces personnalisées de l'utilisateur
export const getCustomFaces = async (uid: string): Promise<CustomFace[]> => {
  try {
    const facesRef = collection(db, "users", uid, "faces");
    const q = query(facesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const faces: CustomFace[] = [];
    querySnapshot.forEach((doc) => {
      faces.push({ id: doc.id, ...doc.data() } as CustomFace);
    });

    return faces;
  } catch (error) {
    return [];
  }
};

// Ajouter une face personnalisée
export const addCustomFace = async (
  uid: string,
  face: Omit<CustomFace, "id" | "createdAt" | "updatedAt">,
): Promise<string | null> => {
  try {
    const facesRef = collection(db, "users", uid, "faces");
    const faceData = {
      ...face,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(facesRef, faceData);
    return docRef.id;
  } catch (error) {
    return null;
  }
};

// Mettre à jour une face personnalisée
export const updateCustomFace = async (
  uid: string,
  faceId: string,
  updates: Partial<Omit<CustomFace, "id" | "createdAt">>,
): Promise<boolean> => {
  try {
    const faceRef = doc(db, "users", uid, "faces", faceId);
    await updateDoc(faceRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Supprimer une face personnalisée
export const deleteCustomFace = async (
  uid: string,
  faceId: string,
): Promise<boolean> => {
  try {
    const faceRef = doc(db, "users", uid, "faces", faceId);
    await deleteDoc(faceRef);
    return true;
  } catch (error) {
    return false;
  }
};

// Fonction utilitaire pour obtenir l'UID de l'utilisateur actuel
export const getCurrentUserId = (): string | null => {
  try {
    // Utiliser getAuthInstance() au lieu du proxy auth pour éviter les problèmes d'initialisation
    const authInstance = getAuthInstance();
    const userId = authInstance?.currentUser?.uid;
    if (userId) {
      return userId;
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Sauvegarder les noms des joueurs
export const savePlayerNames = async (
  uid: string,
  playerNames: { player1: string; player2: string },
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      playerNames: {
        player1: playerNames.player1.trim(),
        player2: playerNames.player2.trim(),
        updatedAt: serverTimestamp(),
      },
      lastSyncAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    return false;
  }
};

// Récupérer les noms des joueurs
export const getPlayerNames = async (
  uid: string,
): Promise<{ player1: string; player2: string } | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      if (userData.playerNames) {
        return {
          player1: userData.playerNames.player1 || "",
          player2: userData.playerNames.player2 || "",
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Vérifier la connectivité et gérer le mode offline
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    // Test simple de connectivité Firestore
    const testRef = doc(db, "test", "connectivity");
    await getDoc(testRef);
    return true;
  } catch (error) {
    return false;
  }
};
