import { useState, useEffect, useCallback } from "react";
import { DiceFace } from "../utils/dice";
import {
  getUserFaces,
  getDefaultFaces,
  addUserFace,
  updateUserFace,
  deleteUserFace,
  getFacesByCategory,
  createWeightedPool,
} from "../services/faces";
import { getCurrentUserId } from "../services/firestore";

export interface UseFacesReturn {
  // Données
  allFaces: DiceFace[];
  defaultFaces: DiceFace[];
  userFaces: DiceFace[];
  weightedPool: DiceFace[];

  // États
  loading: boolean;
  error: string | null;

  // Actions
  refreshFaces: () => Promise<void>;
  addCustomFace: (face: Omit<DiceFace, "id">) => Promise<boolean>;
  updateCustomFace: (
    faceId: string,
    updates: Partial<Omit<DiceFace, "id">>,
  ) => Promise<boolean>;
  deleteCustomFace: (faceId: string) => Promise<boolean>;

  // Helpers
  getFacesByCategory: (category: DiceFace["category"]) => DiceFace[];
  getRandomFace: () => DiceFace | null;
  getCategoryStats: () => {
    payer: { count: number; percentage: number };
    repas: { count: number; percentage: number };
    activite: { count: number; percentage: number };
  };
}

export const useFaces = (): UseFacesReturn => {
  const [allFaces, setAllFaces] = useState<DiceFace[]>([]);
  const [defaultFaces, setDefaultFaces] = useState<DiceFace[]>([]);
  const [userFaces, setUserFaces] = useState<DiceFace[]>([]);
  const [weightedPool, setWeightedPool] = useState<DiceFace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les faces
  const loadFaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error("Utilisateur non connecté");
      }

      // Charger les faces en parallèle
      const [defaultFacesData, userFacesData] = await Promise.all([
        getDefaultFaces(),
        getUserFaces(userId),
      ]);

      const allFacesData = [...defaultFacesData, ...userFacesData];
      const pool = createWeightedPool(allFacesData);

      setDefaultFaces(defaultFacesData);
      setUserFaces(userFacesData);
      setAllFaces(allFacesData);
      setWeightedPool(pool);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des faces";
      setError(errorMessage);
      console.error("Erreur lors du chargement des faces:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualiser les faces
  const refreshFaces = useCallback(async () => {
    await loadFaces();
  }, [loadFaces]);

  // Ajouter une face personnalisée
  const addCustomFace = useCallback(
    async (face: Omit<DiceFace, "id">): Promise<boolean> => {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          throw new Error("Utilisateur non connecté");
        }

        const result = await addUserFace(userId, face);
        const success = result !== null;
        if (success) {
          await refreshFaces();
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'ajout de la face";
        setError(errorMessage);
        console.error("Erreur lors de l'ajout de la face:", err);
        return false;
      }
    },
    [refreshFaces],
  );

  // Mettre à jour une face personnalisée
  const updateCustomFace = useCallback(
    async (
      faceId: string,
      updates: Partial<Omit<DiceFace, "id">>,
    ): Promise<boolean> => {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          throw new Error("Utilisateur non connecté");
        }

        const success = await updateUserFace(userId, faceId, updates);
        if (success) {
          await refreshFaces();
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la mise à jour de la face";
        setError(errorMessage);
        console.error("Erreur lors de la mise à jour de la face:", err);
        return false;
      }
    },
    [refreshFaces],
  );

  // Supprimer une face personnalisée
  const deleteCustomFace = useCallback(
    async (faceId: string): Promise<boolean> => {
      try {
        const userId = getCurrentUserId();
        if (!userId) {
          throw new Error("Utilisateur non connecté");
        }

        const success = await deleteUserFace(userId, faceId);
        if (success) {
          await refreshFaces();
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors de la suppression de la face";
        setError(errorMessage);
        console.error("Erreur lors de la suppression de la face:", err);
        return false;
      }
    },
    [refreshFaces],
  );

  // Helper pour obtenir les faces par catégorie
  const getFacesByCategoryHelper = useCallback(
    (category: DiceFace["category"]): DiceFace[] => {
      return getFacesByCategory(allFaces, category);
    },
    [allFaces],
  );

  // Helper pour obtenir une face aléatoire du pool pondéré
  const getRandomFace = useCallback((): DiceFace | null => {
    if (weightedPool.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
  }, [weightedPool]);

  // Helper pour obtenir les statistiques par catégorie
  const getCategoryStats = useCallback(() => {
    const payerFaces = getFacesByCategory(allFaces, "payer");
    const repasFaces = getFacesByCategory(allFaces, "repas");
    const activiteFaces = getFacesByCategory(allFaces, "activite");
    const total = allFaces.length;

    return {
      payer: {
        count: payerFaces.length,
        percentage:
          total > 0 ? Math.round((payerFaces.length / total) * 100) : 0,
      },
      repas: {
        count: repasFaces.length,
        percentage:
          total > 0 ? Math.round((repasFaces.length / total) * 100) : 0,
      },
      activite: {
        count: activiteFaces.length,
        percentage:
          total > 0 ? Math.round((activiteFaces.length / total) * 100) : 0,
      },
    };
  }, [allFaces]);

  // Charger les faces au montage
  useEffect(() => {
    loadFaces();
  }, [loadFaces]);

  return {
    // Données
    allFaces,
    defaultFaces,
    userFaces,
    weightedPool,

    // États
    loading,
    error,

    // Actions
    refreshFaces,
    addCustomFace,
    updateCustomFace,
    deleteCustomFace,

    // Helpers
    getFacesByCategory: getFacesByCategoryHelper,
    getRandomFace,
    getCategoryStats,
  };
};

export default useFaces;
