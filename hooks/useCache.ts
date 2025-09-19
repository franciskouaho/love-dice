import { useCallback, useEffect, useState } from 'react';
import { cacheService } from '../services/cache';
import { AppConfig } from '../services/config';
import { CustomFace, getCurrentUserId, HistoryEntry, UserProfile } from '../services/firestore';
import { initService } from '../services/initialization';
import { syncService } from '../services/sync';
import { DiceFace } from '../utils/dice';

/**
 * Hook pour gérer le cache et la synchronisation des faces par défaut
 */
export const useDefaultFaces = (forceRefresh: boolean = false) => {
  const [faces, setFaces] = useState<DiceFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaces = useCallback(async (refresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await syncService.syncDefaultFaces(refresh);
      setFaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaces(forceRefresh);
  }, [loadFaces, forceRefresh]);

  const refresh = useCallback(() => {
    loadFaces(true);
  }, [loadFaces]);

  return { faces, loading, error, refresh };
};

/**
 * Hook pour gérer le cache et la synchronisation du profil utilisateur
 */
export const useUserProfile = (forceRefresh: boolean = false) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (refresh: boolean = false) => {
    const uid = getCurrentUserId();
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await syncService.syncUserProfile(uid, refresh);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile(forceRefresh);
  }, [loadProfile, forceRefresh]);

  const refresh = useCallback(() => {
    loadProfile(true);
  }, [loadProfile]);

  return { profile, loading, error, refresh };
};

/**
 * Hook pour gérer le cache et la synchronisation des faces personnalisées
 */
export const useUserFaces = (forceRefresh: boolean = false) => {
  const [faces, setFaces] = useState<CustomFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaces = useCallback(async (refresh: boolean = false) => {
    const uid = getCurrentUserId();
    if (!uid) {
      setFaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await syncService.syncUserFaces(uid, refresh);
      setFaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaces(forceRefresh);
  }, [loadFaces, forceRefresh]);

  const refresh = useCallback(() => {
    loadFaces(true);
  }, [loadFaces]);

  return { faces, loading, error, refresh };
};

/**
 * Hook pour gérer le cache et la synchronisation de l'historique
 */
export const useUserHistory = (limit: number = 10, forceRefresh: boolean = false) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (refresh: boolean = false) => {
    const uid = getCurrentUserId();
    if (!uid) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await syncService.syncUserHistory(uid, limit, refresh);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadHistory(forceRefresh);
  }, [loadHistory, forceRefresh]);

  const refresh = useCallback(() => {
    loadHistory(true);
  }, [loadHistory]);

  return { history, loading, error, refresh };
};

/**
 * Hook pour gérer le cache et la synchronisation de la configuration
 */
export const useAppConfig = (forceRefresh: boolean = false) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async (refresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await syncService.syncAppConfig(refresh);
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig(forceRefresh);
  }, [loadConfig, forceRefresh]);

  const refresh = useCallback(() => {
    loadConfig(true);
  }, [loadConfig]);

  return { config, loading, error, refresh };
};

/**
 * Hook pour gérer toutes les faces actives (par défaut + personnalisées)
 */
export const useAllActiveFaces = (forceRefresh: boolean = false) => {
  const [faces, setFaces] = useState<DiceFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaces = useCallback(async (refresh: boolean = false) => {
    const uid = getCurrentUserId();
    if (!uid) {
      setFaces([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await syncService.syncAllActiveFaces(uid, refresh);
      setFaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaces(forceRefresh);
  }, [loadFaces, forceRefresh]);

  const refresh = useCallback(() => {
    loadFaces(true);
  }, [loadFaces]);

  return { faces, loading, error, refresh };
};

/**
 * Hook pour gérer l'initialisation de l'application
 */
export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);
      const success = await initService.initialize();
      setIsInitialized(success);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const forceSync = useCallback(async () => {
    try {
      setError(null);
      await initService.forceSyncAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      setError(null);
      await initService.clearCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, []);

  const getCacheStats = useCallback(async () => {
    try {
      return await initService.getCacheStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    }
  }, []);

  return {
    isInitialized,
    isInitializing,
    error,
    initialize,
    forceSync,
    clearCache,
    getCacheStats,
  };
};

/**
 * Hook pour gérer les statistiques du cache
 */
export const useCacheStats = () => {
  const [stats, setStats] = useState<{
    totalSize: number;
    entries: number;
    metadata: Map<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cacheService.getCacheStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      setError(null);
      await cacheService.clearAllCache();
      await loadStats(); // Recharger les stats après vidage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [loadStats]);

  return { stats, loading, error, loadStats, clearCache };
};
