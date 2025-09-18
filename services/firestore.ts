import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { DiceRoll } from "../utils/dice";
import { UserPreferences } from "../utils/quota";

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
      console.log("Profil utilisateur créé:", uid);

      return { uid, ...newProfile };
    } else {
      // Retourner le profil existant
      const profileData = userDoc.data() as Omit<UserProfile, "uid">;
      return { uid, ...profileData };
    }
  } catch (error) {
    console.error("Erreur création profil utilisateur:", error);
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
    console.error("Erreur récupération profil:", error);
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
    console.error("Erreur mise à jour profil:", error);
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
    console.log("Statut lifetime mis à jour:", hasLifetime);
    return true;
  } catch (error) {
    console.error("Erreur mise à jour lifetime:", error);
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
    console.error("Erreur mise à jour quota:", error);
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
    console.log("Lancer ajouté à l'historique");
    return true;
  } catch (error) {
    console.error("Erreur ajout historique:", error);
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
    console.error("Erreur récupération historique:", error);
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

    console.log("Historique vidé");
    return true;
  } catch (error) {
    console.error("Erreur suppression historique:", error);
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
      console.error("Erreur écoute profil utilisateur:", error);
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
    console.error("Erreur mise à jour préférences:", error);
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
    console.error("Erreur récupération faces personnalisées:", error);
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
    console.log("Face personnalisée ajoutée:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Erreur ajout face personnalisée:", error);
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
    console.log("Face personnalisée mise à jour:", faceId);
    return true;
  } catch (error) {
    console.error("Erreur mise à jour face personnalisée:", error);
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
    console.log("Face personnalisée supprimée:", faceId);
    return true;
  } catch (error) {
    console.error("Erreur suppression face personnalisée:", error);
    return false;
  }
};

// Fonction utilitaire pour obtenir l'UID de l'utilisateur actuel
export const getCurrentUserId = (): string | null => {
  try {
    return auth?.currentUser?.uid || null;
  } catch (error) {
    console.error("Auth not initialized yet:", error);
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
    console.log("Mode offline détecté");
    return false;
  }
};
