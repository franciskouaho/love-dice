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
    const initRevenueCat = async () => {
      try {
        // Configuration de l'API key selon la plateforme
        if (Platform.OS === "android") {
          Purchases.configure({ apiKey: APIKeys.google });
        } else {
          Purchases.configure({ apiKey: APIKeys.apple });
        }

        // Récupération des offerings et des infos client
        const [offerings, customerInfo] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getCustomerInfo(),
        ]);

        setCustomerInfo(customerInfo);
        setCurrentOffering(offerings.current);
      } catch (error) {
        // Erreur lors de l'initialisation de RevenueCat ignorée
      } finally {
        setIsLoading(false);
      }
    };

    initRevenueCat();
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
      // Erreur lors de l'achat ignorée
      return { success: false, error };
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
      // Erreur lors de la restauration ignorée
      return { success: false, error };
    }
  };

  const getLifetimePrice = () => {
    return currentOffering?.lifetime?.product?.priceString || "12,99 €";
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
