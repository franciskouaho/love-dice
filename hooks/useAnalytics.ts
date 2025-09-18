import { useCallback } from "react";

// Types d'événements selon les spécifications
export type AnalyticsEvent =
  | "onboarding_view"
  | "paywall_view"
  | "paywall_purchase_attempt"
  | "paywall_purchase_success"
  | "dice_roll"
  | "dice_result_payer"
  | "dice_result_repas"
  | "dice_result_activite"
  | "free_limit_hit"
  | "custom_face_add"
  | "app_opened"
  | "share_result"
  | "settings_opened"
  | "history_viewed"
  | "face_edited"
  | "face_deleted"
  | "restore_purchases"
  | "offline_mode"
  | "review_prompted"
  | "review_opened"
  | "review_completed";

// Interface pour les paramètres d'événements
export interface AnalyticsParams {
  [key: string]: string | number | boolean | undefined;
}

// Interface pour les événements spécifiques
export interface DiceRollParams extends AnalyticsParams {
  category: "payer" | "repas" | "activite";
  label: string;
  face_id: string;
  is_custom: boolean;
  roll_number_today: number;
}

export interface PaywallParams extends AnalyticsParams {
  source: "onboarding" | "quota_limit" | "settings" | "home";
  price: string;
}

export interface PurchaseParams extends AnalyticsParams {
  product_id: string;
  price: string;
  currency: string;
  success: boolean;
  error?: string;
}

const useAnalytics = () => {
  // Fonction générique pour logger un événement
  const logAnalyticsEvent = useCallback(
    (eventName: AnalyticsEvent, parameters?: AnalyticsParams) => {
      try {
        // Log en développement pour debugging
        if (__DEV__) {
          console.log("📊 Analytics Event:", eventName, parameters);
        }

        // Analytics désactivé - remplacé par console logs
        console.log("Analytics Event:", eventName, parameters);
      } catch (error) {
        console.error("Erreur envoi analytics:", error);
      }
    },
    [],
  );

  // Événements spécifiques de l'onboarding
  const logOnboardingView = useCallback(
    (step: number, title: string) => {
      logAnalyticsEvent("onboarding_view", {
        step,
        title,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événements du paywall
  const logPaywallView = useCallback(
    (params: PaywallParams) => {
      logAnalyticsEvent("paywall_view", {
        ...params,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  const logPaywallPurchaseAttempt = useCallback(
    (params: PaywallParams) => {
      logAnalyticsEvent("paywall_purchase_attempt", {
        ...params,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  const logPaywallPurchaseSuccess = useCallback(
    (params: PurchaseParams) => {
      logAnalyticsEvent("paywall_purchase_success", {
        ...params,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événements du dé
  const logDiceRoll = useCallback(
    (params: DiceRollParams) => {
      // Événement général
      logAnalyticsEvent("dice_roll", {
        ...params,
        timestamp: Date.now(),
      });

      // Événement spécifique par catégorie
      const categoryEvent = `dice_result_${params.category}` as AnalyticsEvent;
      logAnalyticsEvent(categoryEvent, {
        label: params.label,
        face_id: params.face_id,
        is_custom: params.is_custom,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement limite gratuite atteinte
  const logFreeLimitHit = useCallback(
    (rollsUsed: number, source: string) => {
      logAnalyticsEvent("free_limit_hit", {
        rolls_used: rollsUsed,
        source,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement face personnalisée ajoutée
  const logCustomFaceAdd = useCallback(
    (category: string, isFirstCustom: boolean) => {
      logAnalyticsEvent("custom_face_add", {
        category,
        is_first_custom: isFirstCustom,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement ouverture de l'app
  const logAppOpened = useCallback(
    (isFirstOpen: boolean, daysSinceInstall?: number) => {
      logAnalyticsEvent("app_opened", {
        is_first_open: isFirstOpen,
        days_since_install: daysSinceInstall || 0,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement partage de résultat
  const logShareResult = useCallback(
    (category: string, label: string, method: string) => {
      logAnalyticsEvent("share_result", {
        category,
        label,
        share_method: method,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement ouverture des paramètres
  const logSettingsOpened = useCallback(
    (hasLifetime: boolean) => {
      logAnalyticsEvent("settings_opened", {
        has_lifetime: hasLifetime,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement consultation de l'historique
  const logHistoryViewed = useCallback(
    (entriesCount: number) => {
      logAnalyticsEvent("history_viewed", {
        entries_count: entriesCount,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement modification de face
  const logFaceEdited = useCallback(
    (faceId: string, category: string, isCustom: boolean) => {
      logAnalyticsEvent("face_edited", {
        face_id: faceId,
        category,
        is_custom: isCustom,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement suppression de face
  const logFaceDeleted = useCallback(
    (faceId: string, category: string) => {
      logAnalyticsEvent("face_deleted", {
        face_id: faceId,
        category,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement restauration d'achats
  const logRestorePurchases = useCallback(
    (success: boolean, hasLifetimeAfter: boolean) => {
      logAnalyticsEvent("restore_purchases", {
        success,
        has_lifetime_after: hasLifetimeAfter,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événement mode offline détecté
  const logOfflineMode = useCallback(
    (isOffline: boolean) => {
      logAnalyticsEvent("offline_mode", {
        is_offline: isOffline,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Événements de review
  const logReviewPrompted = useCallback(
    (triggerCount: number, source: string) => {
      logAnalyticsEvent("review_prompted", {
        trigger_count: triggerCount,
        source,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  const logReviewOpened = useCallback(
    (method: "in_app" | "store_redirect") => {
      logAnalyticsEvent("review_opened", {
        method,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  const logReviewCompleted = useCallback(
    (presumedCompleted: boolean) => {
      logAnalyticsEvent("review_completed", {
        presumed_completed: presumedCompleted,
        timestamp: Date.now(),
      });
    },
    [logAnalyticsEvent],
  );

  // Fonction utilitaire pour créer des événements personnalisés
  const logCustomEvent = useCallback(
    (eventName: string, parameters?: AnalyticsParams) => {
      try {
        if (__DEV__) {
          console.log("📊 Custom Analytics Event:", eventName, parameters);
        }

        // Analytics désactivé - remplacé par console logs
        console.log("Custom Analytics Event:", eventName, {
          ...parameters,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Erreur événement analytics personnalisé:", error);
      }
    },
    [],
  );

  return {
    // Fonction générique
    logEvent: logAnalyticsEvent,

    // Événements spécifiques
    logOnboardingView,
    logPaywallView,
    logPaywallPurchaseAttempt,
    logPaywallPurchaseSuccess,
    logDiceRoll,
    logFreeLimitHit,
    logCustomFaceAdd,
    logAppOpened,
    logShareResult,
    logSettingsOpened,
    logHistoryViewed,
    logFaceEdited,
    logFaceDeleted,
    logRestorePurchases,
    logOfflineMode,
    logReviewPrompted,
    logReviewOpened,
    logReviewCompleted,

    // Fonction personnalisée
    logCustomEvent,
  };
};

export default useAnalytics;
