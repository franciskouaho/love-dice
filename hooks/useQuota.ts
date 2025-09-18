import { useCallback, useEffect, useState } from "react";
import {
  canRollDice,
  consumeFreeRoll,
  getLifetimeStatus,
  getQuotaSummary,
  saveLifetimeStatus,
} from "../utils/quota";

export interface QuotaState {
  hasLifetime: boolean;
  unlimited: boolean;
  used: number;
  limit: number;
  remaining: number;
  canRoll: boolean;
  isLoading: boolean;
  error?: string;
}

export interface QuotaActions {
  checkCanRoll: () => Promise<boolean>;
  consumeRoll: () => Promise<{
    success: boolean;
    remaining: number;
    error?: string;
  }>;
  setLifetimeStatus: (
    hasLifetime: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshQuota: () => Promise<void>;
}

const useQuota = (): QuotaState & QuotaActions => {
  const [quotaState, setQuotaState] = useState<QuotaState>({
    hasLifetime: false,
    unlimited: false,
    used: 0,
    limit: 50,
    remaining: 0,
    canRoll: false,
    isLoading: true,
    error: undefined,
  });

  // Initialiser et charger l'état du quota
  const loadQuotaState = useCallback(async () => {
    try {
      console.log("🔄 useQuota: Chargement des quotas...");
      setQuotaState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      // Récupérer le statut lifetime (cache local + Firebase si possible)
      const hasLifetime = await getLifetimeStatus();

      // Si l'utilisateur a le lifetime, pas besoin de connexion stricte
      if (hasLifetime) {
        setQuotaState({
          hasLifetime: true,
          unlimited: true,
          used: 0,
          limit: -1,
          remaining: -1,
          canRoll: true,
          isLoading: false,
          error: undefined,
        });
        return;
      }

      // Obtenir le résumé complet du quota
      const summary = await getQuotaSummary(hasLifetime);

      setQuotaState({
        hasLifetime: summary.hasLifetime,
        unlimited: summary.unlimited,
        used: summary.used,
        limit: summary.limit,
        remaining: summary.remaining,
        canRoll: summary.canRoll,
        isLoading: false,
        error: summary.error,
      });
    } catch (error) {
      setQuotaState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erreur de connexion",
        canRoll: false,
      }));
    }
  }, []);

  // Vérifier si l'utilisateur peut lancer le dé
  const checkCanRoll = useCallback(async (): Promise<boolean> => {
    try {
      const result = await canRollDice(quotaState.hasLifetime);
      if (result.error) {
        setQuotaState((prev) => ({
          ...prev,
          error: result.error,
          canRoll: false,
        }));
        return false;
      }
      return result.canRoll;
    } catch (error) {
      setQuotaState((prev) => ({
        ...prev,
        error: "Erreur de vérification",
        canRoll: false,
      }));
      return false;
    }
  }, [quotaState.hasLifetime]);

  // Consommer un lancer
  const consumeRoll = useCallback(async (): Promise<{
    success: boolean;
    remaining: number;
    error?: string;
  }> => {
    try {
      // Si l'utilisateur a l'accès à vie, toujours autoriser
      if (quotaState.hasLifetime) {
        return { success: true, remaining: -1 };
      }

      // Consommer un lancer gratuit via Firebase
      const result = await consumeFreeRoll();

      if (result.success) {
        // Mettre à jour l'état local
        setQuotaState((prev) => ({
          ...prev,
          used: prev.used + 1,
          remaining: result.remaining,
          canRoll: result.remaining > 0,
          error: undefined,
        }));
      } else {
        // Mettre à jour l'erreur
        setQuotaState((prev) => ({
          ...prev,
          error: result.error,
          canRoll: false,
        }));
      }

      return result;
    } catch (error) {
      const errorMsg = "Erreur lors de la consommation du lancer";
      setQuotaState((prev) => ({ ...prev, error: errorMsg, canRoll: false }));
      return { success: false, remaining: 0, error: errorMsg };
    }
  }, [quotaState.hasLifetime]);

  // Définir le statut lifetime
  const setLifetimeStatus = useCallback(
    async (
      hasLifetime: boolean,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Sauvegarder dans Firebase
        const result = await saveLifetimeStatus(hasLifetime);

        if (result.success) {
          // Mettre à jour l'état local
          setQuotaState((prev) => ({
            ...prev,
            hasLifetime,
            unlimited: hasLifetime,
            canRoll: hasLifetime || prev.remaining > 0,
            error: undefined,
          }));
        } else {
          setQuotaState((prev) => ({
            ...prev,
            error: result.error,
          }));
        }

        return result;
      } catch (error) {
        const errorMsg = "Erreur lors de la mise à jour du statut";
        setQuotaState((prev) => ({ ...prev, error: errorMsg }));
        return { success: false, error: errorMsg };
      }
    },
    [],
  );

  // Rafraîchir le quota depuis Firebase
  const refreshQuota = useCallback(async (): Promise<void> => {
    await loadQuotaState();
  }, [loadQuotaState]);

  // Charger l'état initial
  useEffect(() => {
    loadQuotaState();
  }, [loadQuotaState]);

  // Rafraîchir périodiquement depuis Firebase (toutes les 2 minutes)
  useEffect(() => {
    const interval = setInterval(
      () => {
        loadQuotaState();
      },
      2 * 60 * 1000,
    ); // 2 minutes

    return () => clearInterval(interval);
  }, [loadQuotaState]);

  return {
    // État
    ...quotaState,

    // Actions
    checkCanRoll,
    consumeRoll,
    setLifetimeStatus,
    refreshQuota,
  };
};

export default useQuota;
