import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiceFace } from '../utils/dice';
import { AppConfig } from './config';
import { CustomFace, HistoryEntry, UserProfile } from './firestore';

// Types pour le cache
export interface CacheMetadata {
  lastUpdated: number;
  version: string;
  source: 'firebase' | 'local';
}

export interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

// Clés de stockage AsyncStorage
const CACHE_KEYS = {
  DEFAULT_FACES: 'cache_default_faces',
  USER_PROFILE: 'cache_user_profile',
  USER_FACES: 'cache_user_faces',
  USER_HISTORY: 'cache_user_history',
  APP_CONFIG: 'cache_app_config',
  CACHE_METADATA: 'cache_metadata',
} as const;

// Durée de validité du cache (en millisecondes)
const CACHE_DURATION = {
  DEFAULT_FACES: 24 * 60 * 60 * 1000, // 24 heures
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  USER_FACES: 10 * 60 * 1000, // 10 minutes
  USER_HISTORY: 2 * 60 * 1000, // 2 minutes
  APP_CONFIG: 30 * 60 * 1000, // 30 minutes
} as const;

// Version du cache pour invalidation
const CACHE_VERSION = '1.0.0';

/**
 * Service de cache local avec AsyncStorage
 * Gère la persistance locale des données Firebase
 */
export class LocalCacheService {
  private static instance: LocalCacheService;
  private cacheMetadata: Map<string, CacheMetadata> = new Map();

  static getInstance(): LocalCacheService {
    if (!LocalCacheService.instance) {
      LocalCacheService.instance = new LocalCacheService();
    }
    return LocalCacheService.instance;
  }

  private constructor() {
    this.loadCacheMetadata();
  }

  /**
   * Charger les métadonnées du cache depuis AsyncStorage
   */
  private async loadCacheMetadata(): Promise<void> {
    try {
      const metadataJson = await AsyncStorage.getItem(CACHE_KEYS.CACHE_METADATA);
      if (metadataJson) {
        const metadata = JSON.parse(metadataJson);
        this.cacheMetadata = new Map(Object.entries(metadata));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des métadonnées du cache:', error);
    }
  }

  /**
   * Sauvegarder les métadonnées du cache
   */
  private async saveCacheMetadata(): Promise<void> {
    try {
      const metadataObj = Object.fromEntries(this.cacheMetadata);
      await AsyncStorage.setItem(CACHE_KEYS.CACHE_METADATA, JSON.stringify(metadataObj));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des métadonnées du cache:', error);
    }
  }

  /**
   * Vérifier si le cache est valide pour une clé donnée
   */
  private isCacheValid(key: string, maxAge: number): boolean {
    const metadata = this.cacheMetadata.get(key);
    if (!metadata) return false;

    const now = Date.now();
    const age = now - metadata.lastUpdated;
    
    return age < maxAge && metadata.version === CACHE_VERSION;
  }

  /**
   * Mettre à jour les métadonnées du cache
   */
  private updateCacheMetadata(key: string, source: 'firebase' | 'local' = 'firebase'): void {
    this.cacheMetadata.set(key, {
      lastUpdated: Date.now(),
      version: CACHE_VERSION,
      source,
    });
    this.saveCacheMetadata();
  }

  /**
   * Sauvegarder des données dans le cache
   */
  async setCache<T>(key: string, data: T, source: 'firebase' | 'local' = 'firebase'): Promise<void> {
    try {
      const cachedData: CachedData<T> = {
        data,
        metadata: {
          lastUpdated: Date.now(),
          version: CACHE_VERSION,
          source,
        },
      };

      await AsyncStorage.setItem(key, JSON.stringify(cachedData));
      this.updateCacheMetadata(key, source);
    } catch (error) {
      console.warn(`Erreur lors de la sauvegarde du cache pour ${key}:`, error);
    }
  }

  /**
   * Récupérer des données du cache
   */
  async getCache<T>(key: string, maxAge: number): Promise<T | null> {
    try {
      console.log(`🔍 getCache - Recherche de la clé: ${key}`);
      const cachedDataJson = await AsyncStorage.getItem(key);
      console.log(`🔍 getCache - Données trouvées:`, !!cachedDataJson, 'taille:', cachedDataJson?.length || 0);
      
      if (!cachedDataJson) {
        console.log(`❌ getCache - Aucune donnée pour la clé: ${key}`);
        return null;
      }

      const cachedData: CachedData<T> = JSON.parse(cachedDataJson);
      console.log(`🔍 getCache - Données parsées:`, {
        hasData: !!cachedData.data,
        dataLength: Array.isArray(cachedData.data) ? cachedData.data.length : 'N/A',
        metadata: cachedData.metadata
      });
      
      // Vérifier la validité du cache
      const isValid = this.isCacheValid(key, maxAge);
      console.log(`🔍 getCache - Cache valide:`, isValid);
      
      if (!isValid) {
        console.log(`❌ getCache - Cache expiré pour la clé: ${key}`);
        return null;
      }

      console.log(`✅ getCache - Retour des données du cache pour: ${key}`);
      return cachedData.data;
    } catch (error) {
      console.warn(`❌ getCache - Erreur pour ${key}:`, error);
      return null;
    }
  }

  /**
   * Supprimer des données du cache
   */
  async removeCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      this.cacheMetadata.delete(key);
      this.saveCacheMetadata();
    } catch (error) {
      console.warn(`Erreur lors de la suppression du cache pour ${key}:`, error);
    }
  }

  /**
   * Vider tout le cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = Object.values(CACHE_KEYS);
      await AsyncStorage.multiRemove(keys);
      this.cacheMetadata.clear();
      this.saveCacheMetadata();
    } catch (error) {
      console.warn('Erreur lors du vidage du cache:', error);
    }
  }

  /**
   * Obtenir la taille du cache
   */
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      let totalSize = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.warn('Erreur lors du calcul de la taille du cache:', error);
      return 0;
    }
  }

  // ==================== MÉTHODES SPÉCIFIQUES ====================

  /**
   * Sauvegarder les faces par défaut
   */
  async setDefaultFaces(faces: DiceFace[]): Promise<void> {
    await this.setCache(CACHE_KEYS.DEFAULT_FACES, faces);
  }

  /**
   * Récupérer les faces par défaut
   */
  async getDefaultFaces(): Promise<DiceFace[] | null> {
    return await this.getCache<DiceFace[]>(CACHE_KEYS.DEFAULT_FACES, CACHE_DURATION.DEFAULT_FACES);
  }

  /**
   * Sauvegarder le profil utilisateur
   */
  async setUserProfile(uid: string, profile: UserProfile): Promise<void> {
    const key = `${CACHE_KEYS.USER_PROFILE}_${uid}`;
    await this.setCache(key, profile);
  }

  /**
   * Récupérer le profil utilisateur
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const key = `${CACHE_KEYS.USER_PROFILE}_${uid}`;
    return await this.getCache<UserProfile>(key, CACHE_DURATION.USER_PROFILE);
  }

  /**
   * Sauvegarder les faces personnalisées de l'utilisateur
   */
  async setUserFaces(uid: string, faces: CustomFace[]): Promise<void> {
    const key = `${CACHE_KEYS.USER_FACES}_${uid}`;
    await this.setCache(key, faces);
  }

  /**
   * Récupérer les faces personnalisées de l'utilisateur
   */
  async getUserFaces(uid: string): Promise<CustomFace[] | null> {
    const key = `${CACHE_KEYS.USER_FACES}_${uid}`;
    return await this.getCache<CustomFace[]>(key, CACHE_DURATION.USER_FACES);
  }

  /**
   * Sauvegarder l'historique de l'utilisateur
   */
  async setUserHistory(uid: string, history: HistoryEntry[]): Promise<void> {
    const key = `${CACHE_KEYS.USER_HISTORY}_${uid}`;
    await this.setCache(key, history);
  }

  /**
   * Récupérer l'historique de l'utilisateur
   */
  async getUserHistory(uid: string): Promise<HistoryEntry[] | null> {
    const key = `${CACHE_KEYS.USER_HISTORY}_${uid}`;
    return await this.getCache<HistoryEntry[]>(key, CACHE_DURATION.USER_HISTORY);
  }

  /**
   * Sauvegarder la configuration de l'app
   */
  async setAppConfig(config: AppConfig): Promise<void> {
    await this.setCache(CACHE_KEYS.APP_CONFIG, config);
  }

  /**
   * Récupérer la configuration de l'app
   */
  async getAppConfig(): Promise<AppConfig | null> {
    return await this.getCache<AppConfig>(CACHE_KEYS.APP_CONFIG, CACHE_DURATION.APP_CONFIG);
  }

  /**
   * Forcer la synchronisation (invalider le cache)
   */
  async invalidateCache(keys?: string[]): Promise<void> {
    if (keys) {
      for (const key of keys) {
        await this.removeCache(key);
      }
    } else {
      await this.clearAllCache();
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getCacheStats(): Promise<{
    totalSize: number;
    entries: number;
    metadata: Map<string, CacheMetadata>;
  }> {
    const totalSize = await this.getCacheSize();
    const entries = this.cacheMetadata.size;
    
    return {
      totalSize,
      entries,
      metadata: new Map(this.cacheMetadata),
    };
  }
}

// Instance singleton
export const cacheService = LocalCacheService.getInstance();

// Export des clés pour usage externe
export { CACHE_DURATION, CACHE_KEYS };

