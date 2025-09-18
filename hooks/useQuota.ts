import { useState, useEffect, useCallback } from "react";
import { getConfigValue } from "../services/config";
import {
  canRollDice,
  consumeFreeRoll,
  getQuotaSummary,
  saveLifetimeStatus,
  getLifetimeStatus,
  syncWithFirestore,
} from "../utils/quota";
import {
  updateDailyQuota,
  getCurrentUserId,
  getUserProfile,
} from "../services/firestore";

export interface QuotaState {
  hasLifetime: boolean;
  unlimited: boolean;
  used: number;
  limit: number;
  remaining: number;
  canRoll: boolean;
  isLoading: boolean;
}

export interface QuotaActions {
  checkCanRoll: () => Promise<boolean>;
  consumeRoll: () => Promise<{ success: boolean; remaining: number }>;
  setLifetimeStatus: (hasLifetime: boolean) => Promise<void>;
  refreshQuota: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const useQuota = (): QuotaState & QuotaActions => {
  const [quotaState, setQuotaState] = useState<QuotaState>({
    hasLifetime: false,
    unlimited: false,
    used: 0,
    limit: 3,
    remaining: 0,
    canRoll: false,
    isLoading: true,
  });

  // Initialiser et charger l'état du quota
  const loadQuotaState = useCallback(async () => {
    try {
      setQuotaState((prev) => ({ ...prev, isLoading: true }));

      // Récupérer le statut lifetime depuis le stockage local
      const hasLifetime = await getLifetimeStatus();

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
      });
    } catch (error) {
      // Erreur chargement quota ignorée
      setQuotaState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Vérifier si l'utilisateur peut lancer le dé
  const checkCanRoll = useCallback(async (): Promise<boolean> => {
    try {
      const { canRoll } = await canRollDice(quotaState.hasLifetime);
      return canRoll;
    } catch (error) {
      // Erreur vérification quota ignorée
      return false;
    }
  }, [quotaState.hasLifetime]);

  // Consommer un lancer
  const consumeRoll = useCallback(async (): Promise<{
    success: boolean;
    remaining: number;
  }> => {
    try {
      // Si l'utilisateur a l'accès à vie, toujours autoriser
      if (quotaState.hasLifetime) {
        return { success: true, remaining: -1 };
      }

      // Consommer un lancer gratuit
      const result = await consumeFreeRoll();

      if (result.success) {
        // Mettre à jour l'état local
        setQuotaState((prev) => ({
          ...prev,
          used: prev.used + 1,
          remaining: result.remaining,
          canRoll: result.remaining > 0,
        }));

        // Synchroniser avec Firestore si possible
        await syncWithServer();
      }

      return result;
    } catch (error) {
      // Erreur consommation roll ignorée
      return { success: false, remaining: 0 };
    }
  }, [quotaState.hasLifetime]);

  // Définir le statut lifetime
  const setLifetimeStatus = useCallback(
    async (hasLifetime: boolean): Promise<void> => {
      try {
        // Sauvegarder localement
        await saveLifetimeStatus(hasLifetime);

        // Mettre à jour l'état
        setQuotaState((prev) => ({
          ...prev,
          hasLifetime,
          unlimited: hasLifetime,
          canRoll: hasLifetime || prev.remaining > 0,
        }));

        // Synchroniser avec Firestore si possible
        await syncWithServer();
      } catch (error) {
        // Erreur mise à jour statut lifetime ignorée
      }
    },
    [],
  );

  // Rafraîchir le quota depuis le stockage local
  const refreshQuota = useCallback(async (): Promise<void> => {
    await loadQuotaState();
  }, [loadQuotaState]);

  // Synchroniser avec le serveur Firestore
  const syncWithServer = useCallback(async (): Promise<void> => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      // Récupérer le profil depuis Firestore
      const profile = await getUserProfile(userId);
      if (!profile) return;

      // Synchroniser avec les données Firestore
      await syncWithFirestore({
        hasLifetime: profile.hasLifetime,
        freeRollsUsedToday: profile.freeRollsUsedToday,
        freeDayKey: profile.freeDayKey,
        prefs: profile.prefs,
      });

      // Mettre à jour Firestore avec les données locales si nécessaire
      const currentDayKey = new Date().toISOString().split("T")[0];
      if (
        profile.freeDayKey !== currentDayKey ||
        profile.freeRollsUsedToday !== quotaState.used
      ) {
        await updateDailyQuota(userId, quotaState.used, currentDayKey);
      }

      // Recharger l'état après la sync
      await loadQuotaState();
    } catch (error) {
      // Erreur synchronisation serveur ignorée
    }
  }, [quotaState.used, loadQuotaState]);

  // Charger l'état initial
  useEffect(() => {
    loadQuotaState();
  }, [loadQuotaState]);

  // Synchroniser périodiquement avec le serveur (toutes les 5 minutes)
  useEffect(() => {
    const interval = setInterval(
      () => {
        syncWithServer();
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [syncWithServer]);

  return {
    // État
    ...quotaState,

    // Actions
    checkCanRoll,
    consumeRoll,
    setLifetimeStatus,
    refreshQuota,
    syncWithServer,
  };
};

export default useQuota;
