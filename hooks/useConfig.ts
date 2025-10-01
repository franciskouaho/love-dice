import { useEffect, useState } from "react";
import {
    AppConfig,
    fetchConfig,
    getConfigValue,
    getFeatureFlags,
    isFeatureEnabled,
    refreshConfig,
} from "../services/config";

export interface UseConfigReturn {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;

  // Getters
  getValue: <K extends keyof AppConfig>(key: K) => Promise<AppConfig[K]>;
  getFeatureFlags: () => Promise<AppConfig["FEATURE_FLAGS"]>;
  isFeatureEnabled: (
    feature: keyof AppConfig["FEATURE_FLAGS"],
  ) => Promise<boolean>;

  // Actions
  refresh: () => Promise<void>;

  // Quick access to common values
  freeRollsPerDay: number;
  lifetimePrice: string;
  features: AppConfig["FEATURE_FLAGS"] | null;
}

export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const freshConfig = await fetchConfig();
      setConfig(freshConfig);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement de la configuration";
      setError(errorMessage);
      // Erreur chargement config ignorée
    } finally {
      setLoading(false);
    }
  };

  // Wrapper functions
  const getValue = async <K extends keyof AppConfig>(
    key: K,
  ): Promise<AppConfig[K]> => {
    return await getConfigValue(key);
  };

  const getFlags = async (): Promise<AppConfig["FEATURE_FLAGS"]> => {
    return await getFeatureFlags();
  };

  const checkFeature = async (
    feature: keyof AppConfig["FEATURE_FLAGS"],
  ): Promise<boolean> => {
    return await isFeatureEnabled(feature);
  };

  const refresh = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const freshConfig = await refreshConfig();
      setConfig(freshConfig);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors du rafraîchissement";
      setError(errorMessage);
      // Erreur refresh config ignorée
    } finally {
      setLoading(false);
    }
  };

  // Quick access values
  const freeRollsPerDay = config?.FREE_ROLLS_PER_DAY || 3;
  const lifetimePrice = config?.LIFETIME_PRICE || "12,99 €";
  const features = config?.FEATURE_FLAGS || null;

  return {
    // State
    config,
    loading,
    error,

    // Getters
    getValue,
    getFeatureFlags: getFlags,
    isFeatureEnabled: checkFeature,

    // Actions
    refresh,

    // Quick access
    freeRollsPerDay,
    lifetimePrice,
    features,
  };
};

export default useConfig;
