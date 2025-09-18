import * as StoreReview from "expo-store-review";
import { Linking, Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";
import useAnalytics from "./useAnalytics";

const HAS_REVIEWED_KEY = "@love_dice_has_reviewed";
const LAST_REVIEW_ATTEMPT_KEY = "@love_dice_last_review_attempt";
const REVIEW_TRIGGER_COUNT_KEY = "@love_dice_review_trigger_count";

export const useInAppReview = () => {
  const { logReviewPrompted, logReviewOpened, logReviewCompleted } =
    useAnalytics();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // L'application est revenue au premier plan
        checkIfReviewWasSubmitted();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const hasUserReviewed = async (): Promise<boolean> => {
    try {
      const hasReviewed = await AsyncStorage.getItem(HAS_REVIEWED_KEY);
      return hasReviewed === "true";
    } catch (error) {
      // Erreur lors de la vérification du statut de review ignorée
      return false;
    }
  };

  const checkIfReviewWasSubmitted = async () => {
    try {
      const lastAttempt = await AsyncStorage.getItem(LAST_REVIEW_ATTEMPT_KEY);
      if (!lastAttempt) return;

      const now = Date.now();
      const timeSinceLastAttempt = now - parseInt(lastAttempt);

      // Si l'utilisateur est revenu à l'app après avoir ouvert le store
      // et qu'il a passé plus de 30 secondes, on considère qu'il a peut-être fait une review
      if (timeSinceLastAttempt > 30000) {
        await markReviewAsDone();
        await AsyncStorage.removeItem(LAST_REVIEW_ATTEMPT_KEY);
        // Review considérée comme effectuée après retour du store
      }
    } catch (error) {
      // Erreur lors de la vérification de la review ignorée
    }
  };

  const incrementTriggerCount = async (): Promise<number> => {
    try {
      const currentCount = await AsyncStorage.getItem(REVIEW_TRIGGER_COUNT_KEY);
      const count = currentCount ? parseInt(currentCount) + 1 : 1;
      await AsyncStorage.setItem(REVIEW_TRIGGER_COUNT_KEY, count.toString());
      return count;
    } catch (error) {
      // Erreur lors de l'incrémentation du compteur ignorée
      return 0;
    }
  };

  const shouldRequestReview = async (
    triggerCount: number,
  ): Promise<boolean> => {
    try {
      // Ne pas demander si l'utilisateur a déjà review
      const hasReviewed = await hasUserReviewed();
      if (hasReviewed) return false;

      // Demander la review après le 5ème lancer réussi, puis tous les 20 lancers
      if (triggerCount === 5 || (triggerCount > 5 && triggerCount % 20 === 0)) {
        return true;
      }

      return false;
    } catch (error) {
      // Erreur lors de la vérification des conditions de review ignorée
      return false;
    }
  };

  const requestReview = async () => {
    try {
      const hasReviewed = await hasUserReviewed();
      if (hasReviewed) {
        // Review déjà effectuée, pas de nouvelle demande
        return;
      }

      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        // Demande de review in-app
        logReviewOpened("in_app");
        await StoreReview.requestReview();
        // On ne marque pas comme fait ici car on ne sait pas si l'utilisateur a vraiment reviewé
      } else {
        // Review in-app non disponible, ouverture du store
        await openStoreReview();
      }
    } catch (error) {
      // Erreur lors de la demande de review ignorée
    }
  };

  const openStoreReview = async () => {
    try {
      const hasReviewed = await hasUserReviewed();
      if (hasReviewed) {
        // Review déjà effectuée, pas d'ouverture du store
        return;
      }

      // On enregistre le moment où l'utilisateur ouvre le store
      await AsyncStorage.setItem(
        LAST_REVIEW_ATTEMPT_KEY,
        Date.now().toString(),
      );

      if (Platform.OS === "ios") {
        // TODO: Remplacer par l'ID réel de l'app Love Dice sur l'App Store
        const itunesItemId = "LOVE_DICE_APP_ID";
        const url = `https://apps.apple.com/app/apple-store/id${itunesItemId}?action=write-review`;
        // Ouverture App Store pour review
        logReviewOpened("store_redirect");
        await Linking.openURL(url);
      } else if (Platform.OS === "android") {
        // TODO: Remplacer par le package name réel de l'app Love Dice
        const androidPackageName = "com.lovedice.app";
        const url = `https://play.google.com/store/apps/details?id=${androidPackageName}&showAllReviews=true`;
        // Ouverture Google Play pour review
        logReviewOpened("store_redirect");
        await Linking.openURL(url);
      }
    } catch (error) {
      // Erreur lors de l'ouverture du store ignorée
    }
  };

  const markReviewAsDone = async () => {
    try {
      await AsyncStorage.setItem(HAS_REVIEWED_KEY, "true");
      logReviewCompleted(true);
      // Review marquée comme effectuée
    } catch (error) {
      // Erreur lors du marquage de la review ignorée
    }
  };

  const triggerReviewAfterSuccess = async () => {
    try {
      // Incrémenter le compteur de déclencheurs
      const triggerCount = await incrementTriggerCount();

      // Vérifier si on doit demander une review
      const shouldRequest = await shouldRequestReview(triggerCount);

      if (shouldRequest) {
        logReviewPrompted(triggerCount, "after_dice_roll");
        // Petite temporisation pour que l'animation se termine
        setTimeout(() => {
          requestReview();
        }, 1500);
      }
    } catch (error) {
      // Erreur lors du déclenchement de review ignorée
    }
  };

  const resetReviewData = async () => {
    try {
      await AsyncStorage.multiRemove([
        HAS_REVIEWED_KEY,
        LAST_REVIEW_ATTEMPT_KEY,
        REVIEW_TRIGGER_COUNT_KEY,
      ]);
      // Données de review réinitialisées
    } catch (error) {
      // Erreur lors de la réinitialisation des données de review ignorée
    }
  };

  return {
    requestReview,
    openStoreReview,
    hasUserReviewed,
    markReviewAsDone,
    triggerReviewAfterSuccess,
    resetReviewData,
  };
};
