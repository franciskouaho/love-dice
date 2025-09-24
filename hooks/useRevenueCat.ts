import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';

const APIKeys = {
    apple: 'appl_DsRRqlIIUaHejTFtkinCiqMSqLo',
    google: '',
};

const typesOfMembership = {
    lifetime: 'love_dice_lifetime',
};

function useRevenueCat() {
    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

    const isProMember =
        customerInfo?.activeSubscriptions?.includes(typesOfMembership.lifetime) ||
        customerInfo?.entitlements?.active?.[typesOfMembership.lifetime]?.isActive;

    useEffect(() => {
        /*Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);*/

        const fetchData = async () => {
            if (Platform.OS === 'android') {
                Purchases.configure({apiKey: APIKeys.google});
            } else {
                Purchases.configure({apiKey: APIKeys.apple});
            }
            const offerings = await Purchases.getOfferings();
            const customerInfo = await Purchases.getCustomerInfo();
            setCustomerInfo(customerInfo);
            setCurrentOffering(offerings.current);
        };

        fetchData().catch(console.error);
    }, []);

    useEffect(() => {
        const customerInfoUpdated = async (purchaserInfo: CustomerInfo) => {
            setCustomerInfo(purchaserInfo);
        };
        Purchases.addCustomerInfoUpdateListener(customerInfoUpdated);
        return () => {
            Purchases.removeCustomerInfoUpdateListener && Purchases.removeCustomerInfoUpdateListener(customerInfoUpdated);
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
                purchaseResult.customerInfo.entitlements.active[typesOfMembership.lifetime]
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
                customerInfo.entitlements?.active?.[typesOfMembership.lifetime]?.isActive ||
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
        isProMember,
        hasLifetime: isProMember,
        purchaseLifetime,
        restorePurchases,
        getLifetimePrice,
        isLoading: false
    };
}

export default useRevenueCat;