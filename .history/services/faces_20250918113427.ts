import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { DiceFace } from "../utils/dice";

// Interface pour une face stockée dans Firebase
export interface FirebaseDiceFace extends Omit<DiceFace, "id"> {
  id?: string;
  createdAt?: any;
  updatedAt?: any;
  isDefault?: boolean;
  isActive?: boolean;
}

// Configuration par défaut des faces
const DEFAULT_FACES: Omit<FirebaseDiceFace, "id">[] = [
  // Catégorie PAYER (20%)
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

  // Catégorie REPAS (20%)
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

  // Catégorie ACTIVITÉ (60%)
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

// Pondération par catégorie selon les specs
export const categoryWeights = {
  payer: 0.2, // 20%
  repas: 0.2, // 20%
  activite: 0.6, // 60%
};

// Collection de référence pour les faces par défaut (globale)
const DEFAULT_FACES_COLLECTION = "defaultFaces";

// Collection pour les faces personnalisées d'un utilisateur
const getUserFacesCollection = (uid: string) => `users/${uid}/faces`;

// Initialiser les faces par défaut dans Firebase (à faire une seule fois)
export const initializeDefaultFaces = async (): Promise<boolean> => {
  try {
    const batch = writeBatch(db);

    // Vérifier si les faces par défaut existent déjà
    const defaultFacesRef = collection(db, DEFAULT_FACES_COLLECTION);
    const existingFaces = await getDocs(defaultFacesRef);

    if (existingFaces.empty) {
      console.log("Initialisation des faces par défaut...");

      DEFAULT_FACES.forEach((face, index) => {
        const faceRef = doc(defaultFacesRef, `default_${index}`);
        batch.set(faceRef, {
          ...face,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log("Faces par défaut initialisées avec succès");
    } else {
      console.log("Faces par défaut déjà présentes");
    }

    return true;
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation des faces par défaut:",
      error,
    );
    return false;
  }
};

// Récupérer toutes les faces par défaut depuis Firebase
export const getDefaultFaces = async (): Promise<DiceFace[]> => {
  try {
    const defaultFacesRef = collection(db, DEFAULT_FACES_COLLECTION);
    const q = query(defaultFacesRef, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(q);

    const faces: DiceFace[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseDiceFace;
      if (data.isActive !== false) {
        // Inclure si isActive n'est pas explicitement false
        faces.push({
          id: doc.id,
          label: data.label,
          category: data.category,
          emoji: data.emoji,
          weight: data.weight,
          actions: data.actions,
        });
      }
    });
    return faces;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des faces par défaut:",
      error,
    );
    console.log("🔄 Utilisation du fallback vers les faces locales");
    // Fallback vers les faces locales en cas d'erreur
    const fallbackFaces = DEFAULT_FACES.map((face, index) => ({
      id: `fallback_${index}`,
      label: face.label,
      category: face.category,
      emoji: face.emoji,
      weight: face.weight,
      actions: face.actions,
    }));
    console.log("🎯 Faces de fallback créées:", fallbackFaces.length);
    return fallbackFaces;
  }
};

// Récupérer les faces personnalisées d'un utilisateur
export const getUserFaces = async (uid: string): Promise<DiceFace[]> => {
  try {
    const userFacesRef = collection(db, getUserFacesCollection(uid));
    const q = query(userFacesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const faces: DiceFace[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirebaseDiceFace;
      if (data.isActive !== false) {
        faces.push({
          id: doc.id,
          label: data.label,
          category: data.category,
          emoji: data.emoji,
          weight: data.weight,
          actions: data.actions,
        });
      }
    });

    return faces;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des faces utilisateur:",
      error,
    );
    return [];
  }
};

// Récupérer toutes les faces actives (par défaut + personnalisées) pour un utilisateur
export const getAllActiveFaces = async (uid: string): Promise<DiceFace[]> => {
  try {
    const [defaultFaces, userFaces] = await Promise.all([
      getDefaultFaces(),
      getUserFaces(uid),
    ]);

    return [...defaultFaces, ...userFaces];
  } catch (error) {
    console.error("Erreur lors de la récupération de toutes les faces:", error);
    return [];
  }
};

// Ajouter une face personnalisée pour un utilisateur
export const addUserFace = async (
  uid: string,
  face: Omit<DiceFace, "id">,
): Promise<string | null> => {
  try {
    const userFacesRef = collection(db, getUserFacesCollection(uid));

    const faceData: FirebaseDiceFace = {
      ...face,
      isDefault: false,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(userFacesRef, faceData);
    console.log("Face personnalisée ajoutée:", face.label);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de la face personnalisée:", error);
    return null;
  }
};

// Mettre à jour une face personnalisée
export const updateUserFace = async (
  uid: string,
  faceId: string,
  updates: Partial<Omit<DiceFace, "id">>,
): Promise<boolean> => {
  try {
    const faceRef = doc(db, getUserFacesCollection(uid), faceId);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await setDoc(faceRef, updateData, { merge: true });
    console.log("Face personnalisée mise à jour:", faceId);
    return true;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la face:", error);
    return false;
  }
};

// Supprimer (désactiver) une face personnalisée
export const deleteUserFace = async (
  uid: string,
  faceId: string,
): Promise<boolean> => {
  try {
    const faceRef = doc(db, getUserFacesCollection(uid), faceId);

    // Au lieu de supprimer, on désactive la face
    await setDoc(
      faceRef,
      {
        isActive: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    console.log("Face personnalisée désactivée:", faceId);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de la face:", error);
    return false;
  }
};

// Supprimer définitivement une face personnalisée
export const permanentlyDeleteUserFace = async (
  uid: string,
  faceId: string,
): Promise<boolean> => {
  try {
    const faceRef = doc(db, getUserFacesCollection(uid), faceId);

    await deleteDoc(faceRef);
    console.log("Face personnalisée supprimée définitivement:", faceId);
    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la suppression définitive de la face:",
      error,
    );
    return false;
  }
};

// Helper pour obtenir les faces par catégorie
export const getFacesByCategory = (
  faces: DiceFace[],
  category: DiceFace["category"],
): DiceFace[] => {
  return faces.filter((face) => face.category === category);
};

// Helper pour créer un pool pondéré selon les catégories
export const createWeightedPool = (faces: DiceFace[]): DiceFace[] => {
  const pool: DiceFace[] = [];

  Object.entries(categoryWeights).forEach(([category, weight]) => {
    const categoryFaces = faces.filter((face) => face.category === category);
    const count = Math.round(weight * 100); // Sur 100 pour plus de précision

    for (let i = 0; i < count; i++) {
      categoryFaces.forEach((face) => {
        for (let j = 0; j < face.weight; j++) {
          pool.push(face);
        }
      });
    }
  });

  return pool;
};

// Récupérer une face spécifique par son ID
export const getFaceById = async (
  uid: string,
  faceId: string,
): Promise<DiceFace | null> => {
  try {
    // Chercher d'abord dans les faces par défaut
    const defaultFaceRef = doc(db, DEFAULT_FACES_COLLECTION, faceId);
    const defaultFaceDoc = await getDoc(defaultFaceRef);

    if (defaultFaceDoc.exists()) {
      const data = defaultFaceDoc.data() as FirebaseDiceFace;
      return {
        id: defaultFaceDoc.id,
        label: data.label,
        category: data.category,
        emoji: data.emoji,
        weight: data.weight,
        actions: data.actions,
      };
    }

    // Chercher dans les faces personnalisées de l'utilisateur
    const userFaceRef = doc(db, getUserFacesCollection(uid), faceId);
    const userFaceDoc = await getDoc(userFaceRef);

    if (userFaceDoc.exists()) {
      const data = userFaceDoc.data() as FirebaseDiceFace;
      return {
        id: userFaceDoc.id,
        label: data.label,
        category: data.category,
        emoji: data.emoji,
        weight: data.weight,
        actions: data.actions,
      };
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la face:", error);
    return null;
  }
};

// Synchroniser les faces par défaut (mettre à jour si nécessaire)
export const syncDefaultFaces = async (): Promise<boolean> => {
  try {
    const batch = writeBatch(db);

    // Récupérer les faces par défaut existantes
    const defaultFacesRef = collection(db, DEFAULT_FACES_COLLECTION);
    const existingFaces = await getDocs(defaultFacesRef);

    // Créer un map des faces existantes
    const existingFacesMap = new Map();
    existingFaces.forEach((doc) => {
      const data = doc.data();
      existingFacesMap.set(data.label, { id: doc.id, ...data });
    });

    // Ajouter ou mettre à jour les faces
    DEFAULT_FACES.forEach((face, index) => {
      const existing = existingFacesMap.get(face.label);
      const faceRef = existing
        ? doc(defaultFacesRef, existing.id)
        : doc(defaultFacesRef, `default_${index}`);

      if (existing) {
        // Mettre à jour si nécessaire
        batch.set(
          faceRef,
          {
            ...face,
            createdAt: existing.createdAt, // Conserver la date de création
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } else {
        // Créer nouvelle face
        batch.set(faceRef, {
          ...face,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    await batch.commit();
    console.log("Synchronisation des faces par défaut terminée");
    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la synchronisation des faces par défaut:",
      error,
    );
    return false;
  }
};

// Fonction d'initialisation complète du service faces
export const initializeFacesService = async (): Promise<boolean> => {
  try {
    console.log("Initialisation du service faces...");

    // Initialiser les faces par défaut
    await initializeDefaultFaces();

    // Synchroniser les faces par défaut (au cas où il y aurait eu des mises à jour)
    await syncDefaultFaces();

    console.log("Service faces initialisé avec succès");
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation du service faces:", error);
    return false;
  }
};
