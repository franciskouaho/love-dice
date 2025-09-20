import { DiceFace } from '../utils/dice';
import { cacheService } from './cache';
import {
    AppConfig,
    fetchConfigFromFirebase as fetchAppConfig
} from './config';
import {
    CustomFace,
    fetchCustomFacesFromFirebase as fetchCustomFaces,
    fetchHistoryFromFirebase as fetchUserHistory,
    fetchUserProfileFromFirebase as fetchUserProfile,
    HistoryEntry,
    UserProfile
} from './firestore';

/**
 * Service de synchronisation entre Firebase et le cache local
 * Gère la logique de cache-first avec fallback Firebase
 */
export class SyncService {
  private static instance: SyncService;
  private syncInProgress: Set<string> = new Set();

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private constructor() {}

  /**
   * Vérifier si une synchronisation est en cours
   */
  private isSyncInProgress(key: string): boolean {
    return this.syncInProgress.has(key);
  }

  /**
   * Marquer une synchronisation comme en cours
   */
  private setSyncInProgress(key: string, inProgress: boolean): void {
    if (inProgress) {
      this.syncInProgress.add(key);
    } else {
      this.syncInProgress.delete(key);
    }
  }

  /**
   * Synchroniser les faces par défaut
   */
  async syncDefaultFaces(forceRefresh: boolean = false): Promise<DiceFace[]> {
    const syncKey = 'default_faces';
    
    // Éviter les synchronisations multiples simultanées
    if (this.isSyncInProgress(syncKey)) {
      const cached = await cacheService.getDefaultFaces();
      if (cached) return cached;
    }

    try {
      this.setSyncInProgress(syncKey, true);

      // 1. Essayer de récupérer depuis le cache d'abord
      const cached = await cacheService.getDefaultFaces();

      if (cached && cached.length > 0) {
        return cached;
      }

      // 2. Si pas de cache, retourner un tableau vide (pas de Firebase)
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des faces par défaut:', error);
      
      // Fallback vers le cache même si expiré
      const cached = await cacheService.getDefaultFaces();
      if (cached) {
        return cached;
      }

      // Dernier recours : faces par défaut statiques
      return this.getFallbackDefaultFaces();
    } finally {
      this.setSyncInProgress(syncKey, false);
    }
  }

  /**
   * Synchroniser le profil utilisateur
   */
  async syncUserProfile(uid: string, forceRefresh: boolean = false): Promise<UserProfile | null> {
    const syncKey = `user_profile_${uid}`;
    
    if (this.isSyncInProgress(syncKey)) {
      const cached = await cacheService.getUserProfile(uid);
      if (cached) return cached;
    }

    try {
      this.setSyncInProgress(syncKey, true);

      // 1. Essayer le cache d'abord
      if (!forceRefresh) {
        const cached = await cacheService.getUserProfile(uid);
        if (cached) {
          return cached;
        }
      }

      // 2. Récupérer depuis Firebase
      const profile = await fetchUserProfile(uid);
      
      if (profile) {
        // 3. Mettre en cache
        await cacheService.setUserProfile(uid, profile);
      }

      return profile;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation du profil utilisateur:', error);
      
      // Fallback vers le cache
      const cached = await cacheService.getUserProfile(uid);
      if (cached) {
        return cached;
      }

      return null;
    } finally {
      this.setSyncInProgress(syncKey, false);
    }
  }

  /**
   * Synchroniser les faces personnalisées de l'utilisateur
   */
  async syncUserFaces(uid: string, forceRefresh: boolean = false): Promise<CustomFace[]> {
    const syncKey = `user_faces_${uid}`;
    
    if (this.isSyncInProgress(syncKey)) {
      const cached = await cacheService.getUserFaces(uid);
      if (cached) return cached;
    }

    try {
      this.setSyncInProgress(syncKey, true);

      // 1. Essayer le cache d'abord
      if (!forceRefresh) {
        const cached = await cacheService.getUserFaces(uid);
        if (cached) {
          return cached;
        }
      }

      // 2. Récupérer depuis Firebase
      const faces = await fetchCustomFaces(uid);
      
      // 3. Mettre en cache
      await cacheService.setUserFaces(uid, faces);

      return faces;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des faces personnalisées:', error);
      
      // Fallback vers le cache
      const cached = await cacheService.getUserFaces(uid);
      if (cached) {
        return cached;
      }

      return [];
    } finally {
      this.setSyncInProgress(syncKey, false);
    }
  }

  /**
   * Synchroniser l'historique de l'utilisateur
   */
  async syncUserHistory(uid: string, limit: number = 10, forceRefresh: boolean = false): Promise<HistoryEntry[]> {
    const syncKey = `user_history_${uid}`;
    
    if (this.isSyncInProgress(syncKey)) {
      const cached = await cacheService.getUserHistory(uid);
      if (cached) return cached;
    }

    try {
      this.setSyncInProgress(syncKey, true);

      // 1. Essayer le cache d'abord
      if (!forceRefresh) {
        const cached = await cacheService.getUserHistory(uid);
        if (cached) {
          return cached;
        }
      }

      // 2. Récupérer depuis Firebase
      const history = await fetchUserHistory(uid, limit);
      
      // 3. Mettre en cache
      await cacheService.setUserHistory(uid, history);

      return history;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation de l\'historique:', error);
      
      // Fallback vers le cache
      const cached = await cacheService.getUserHistory(uid);
      if (cached) {
        return cached;
      }

      return [];
    } finally {
      this.setSyncInProgress(syncKey, false);
    }
  }

  /**
   * Synchroniser la configuration de l'app
   */
  async syncAppConfig(forceRefresh: boolean = false): Promise<AppConfig> {
    const syncKey = 'app_config';
    
    if (this.isSyncInProgress(syncKey)) {
      const cached = await cacheService.getAppConfig();
      if (cached) return cached;
    }

    try {
      this.setSyncInProgress(syncKey, true);

      // 1. Essayer le cache d'abord
      if (!forceRefresh) {
        const cached = await cacheService.getAppConfig();
        if (cached) {
          return cached;
        }
      }

      // 2. Récupérer depuis Firebase
      const config = await fetchAppConfig();
      
      // 3. Mettre en cache
      await cacheService.setAppConfig(config);

      return config;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation de la configuration:', error);
      
      // Fallback vers le cache
      const cached = await cacheService.getAppConfig();
      if (cached) {
        return cached;
      }

      // Dernier recours : configuration par défaut
      return this.getFallbackAppConfig();
    } finally {
      this.setSyncInProgress(syncKey, false);
    }
  }

  /**
   * Synchroniser toutes les faces actives (par défaut + personnalisées)
   */
  async syncAllActiveFaces(uid: string, forceRefresh: boolean = false): Promise<DiceFace[]> {
    try {
      const [defaultFaces, userFaces] = await Promise.all([
        this.syncDefaultFaces(forceRefresh),
        this.syncUserFaces(uid, forceRefresh).then(faces => 
          faces.map(face => ({
            id: face.id,
            label: face.label,
            category: face.category,
            emoji: face.emoji,
            weight: face.weight,
            actions: face.actions,
          }))
        ),
      ]);

      return [...defaultFaces, ...userFaces];
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation de toutes les faces:', error);
      return [];
    }
  }

  /**
   * Synchronisation en arrière-plan (sans bloquer l'UI)
   */
  async backgroundSync(uid: string): Promise<void> {
    try {
      
      // Synchroniser toutes les données en parallèle
      await Promise.allSettled([
        this.syncDefaultFaces(true),
        this.syncUserProfile(uid, true),
        this.syncUserFaces(uid, true),
        this.syncUserHistory(uid, 50, true),
        this.syncAppConfig(true),
      ]);

    } catch (error) {
    }
  }

  /**
   * Forcer la synchronisation de toutes les données
   */
  async forceSyncAll(uid: string): Promise<void> {
    
    // Invalider tout le cache
    await cacheService.clearAllCache();
    
    // Recharger toutes les données
    await this.backgroundSync(uid);
  }

  /**
   * Obtenir les faces par défaut de fallback
   */
  private getFallbackDefaultFaces(): DiceFace[] {
    return [
      {
        id: 'fallback_1',
        label: 'Tu paies',
        category: 'payer',
        emoji: '🍷',
        weight: 1,
      },
      {
        id: 'fallback_2',
        label: 'Je paie',
        category: 'payer',
        emoji: '💳',
        weight: 1,
      },
      {
        id: 'fallback_3',
        label: 'Restaurant',
        category: 'repas',
        emoji: '🍽️',
        weight: 1,
        actions: ['maps'],
      },
      {
        id: 'fallback_4',
        label: 'Cinéma maison',
        category: 'activite',
        emoji: '🎬',
        weight: 1,
      },
    ];
  }

  /**
   * Obtenir la configuration par défaut de fallback
   */
  private getFallbackAppConfig(): AppConfig {
    return {
      FREE_ROLLS_PER_DAY: 3,
      LIFETIME_PRICE: '12,99 €',
      PAYWALL_TITLE: 'Accès à vie 💕',
      PAYWALL_BULLETS: 'Lancers illimités|Dés personnalisables|Aucune pub',
      FEATURE_FLAGS: {
        customFaces: true,
        history: true,
        analytics: true,
        sharing: true,
      },
    };
  }
}

// Instance singleton
export const syncService = SyncService.getInstance();
