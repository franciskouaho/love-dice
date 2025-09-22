import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
} from "react-native-purchases";

const APIKeys = {
  apple: "appl_DsRRqlIIUaHejTFtkinCiqMSqLo",
  google: "",
};

const LIFETIME_PRODUCT_ID = "love_dice_lifetime";

function useRevenueCat() {
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifie si l'utilisateur a acheté l'accès à vie
  const hasLifetime =
    customerInfo?.entitlements?.active?.[LIFETIME_PRODUCT_ID]?.isActive ||
    false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Configuration de l'API key selon la plateforme
        if (Platform.OS === "android") {
          Purchases.configure({ apiKey: APIKeys.google });
        } else {
          Purchases.configure({ apiKey: APIKeys.apple });
        }
        
        // Désactiver les logs de debug
        Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);

        // Récupération des offerings et des infos client
        const [offerings, customerInfo] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getCustomerInfo(),
        ]);

        setCustomerInfo(customerInfo);
        setCurrentOffering(offerings.current);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de RevenueCat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Écoute des mises à jour des infos client
    const customerInfoUpdateListener = (purchaserInfo: CustomerInfo) => {
      setCustomerInfo(purchaserInfo);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      if (Purchases.removeCustomerInfoUpdateListener) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
      }
    };
  }, []);

  const purchaseLifetime = async () => {
    try {
      if (!currentOffering?.lifetime) {
        throw new Error("Aucun produit lifetime disponible");
      }

      const purchaseResult = await Purchases.purchasePackage(
        currentOffering.lifetime,
      );

      if (
        purchaseResult.customerInfo.entitlements.active[LIFETIME_PRODUCT_ID]
          ?.isActive
      ) {
        return { success: true, customerInfo: purchaseResult.customerInfo };
      } else {
        return { success: false, error: "Achat non confirmé" };
      }
    } catch (error) {
      console.error("Erreur lors de l'achat:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      return { success: false, error: errorMessage };
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);

      const hasLifetimeAfterRestore =
        customerInfo.entitlements?.active?.[LIFETIME_PRODUCT_ID]?.isActive ||
        false;
      return { success: true, hasLifetime: hasLifetimeAfterRestore };
    } catch (error) {
      console.error("Erreur lors de la restauration:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      return { success: false, error: errorMessage };
    }
  };

  const getLifetimePrice = () => {
    return currentOffering?.lifetime?.product?.priceString || "5,99 €";
  };

  return {
    currentOffering,
    customerInfo,
    hasLifetime,
    isLoading,
    purchaseLifetime,
    restorePurchases,
    getLifetimePrice,
  };
}

export default useRevenueCat;