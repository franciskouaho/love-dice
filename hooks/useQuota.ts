import { useCallback, useEffect, useRef, useState } from "react";
import {
    canRollDice,
    consumeFreeRoll,
    getLifetimeStatus,
    getQuotaSummary,
    saveLifetimeStatus,
} from "../utils/quota";
import { useAuth } from "./useFirebase";

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
  const { user, loading: authLoading } = useAuth();
  const [quotaState, setQuotaState] = useState<QuotaState>({
    hasLifetime: false,
    unlimited: false,
    used: 0,
    limit: 50,
    remaining: 50, // 🔧 CHANGÉ: 0 → 50 par défaut
    canRoll: true,  // 🔧 CHANGÉ: false → true par défaut
    isLoading: true,
    error: undefined,
  });

  // Initialiser et charger l'état du quota
  const loadQuotaState = useCallback(async () => {
    try {
      console.log("🔄 useQuota: Chargement des quotas...");
      console.log("🔄 useQuota: État auth - user:", !!user, "loading:", authLoading);
      
      // Attendre que l'authentification soit complète
      if (authLoading) {
        console.log("⏳ useQuota: En attente de l'authentification...");
        return;
      }
      
      // Si pas d'utilisateur après l'auth, utiliser getCurrentUserId directement
      if (!user) {
        console.log("🔧 useQuota: Pas d'utilisateur dans useAuth, vérification directe...");
        const { getCurrentUserId } = await import("../services/firestore");
        const currentUserId = getCurrentUserId();
        
        if (!currentUserId) {
          console.log("🔧 useQuota: Vraiment pas d'utilisateur, création en cours...");
          const { createAnonymousUser } = await import("../services/firebase");
          await createAnonymousUser();
          console.log("✅ useQuota: Utilisateur créé, on recharge...");
          // Attendre que l'état se mette à jour puis recharger
          setTimeout(() => loadQuotaState(), 2000);
          return;
        } else {
          console.log("✅ useQuota: Utilisateur trouvé directement:", currentUserId);
          // Continuer avec le chargement normal
        }
      }
      
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
      console.log("🔄 useQuota: Mise à jour état avec:", summary);

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
      
      console.log("✅ useQuota: État mis à jour - canRoll:", summary.canRoll, "remaining:", summary.remaining);
    } catch (error) {
      setQuotaState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erreur de connexion",
        canRoll: false,
      }));
    }
  }, [user, authLoading]);

  // Charger les quotas quand l'authentification change
  useEffect(() => {
    loadQuotaState();
  }, [loadQuotaState]);

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

  // SUPPRIMÉ - on charge via l'effet de dépendance auth ci-dessus

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

  // Log de l'état final retourné (seulement si changement significatif)
  const prevStateRef = useRef<QuotaState | null>(null);
  useEffect(() => {
    if (!quotaState.isLoading && prevStateRef.current) {
      const prev = prevStateRef.current;
      const current = quotaState;
      
      // Log seulement si changement significatif
      if (prev.canRoll !== current.canRoll || 
          prev.remaining !== current.remaining || 
          prev.hasLifetime !== current.hasLifetime) {
        console.log("📤 useQuota: État mis à jour:", {
          canRoll: current.canRoll,
          remaining: current.remaining,
          hasLifetime: current.hasLifetime
        });
      }
    }
    prevStateRef.current = quotaState;
  }, [quotaState]);

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
