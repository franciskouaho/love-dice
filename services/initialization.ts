import { AppState, AppStateStatus } from 'react-native';
import { cacheService } from './cache';
import { getCurrentUserId } from './firestore';
import { syncService } from './sync';

/**
 * Service d'initialisation et de gestion du cache
 * Gère le chargement initial et la synchronisation en arrière-plan
 */
export class InitializationService {
  private static instance: InitializationService;
  private isInitialized = false;
  private backgroundSyncInterval: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: any = null;

  static getInstance(): InitializationService {
    if (!InitializationService.instance) {
      InitializationService.instance = new InitializationService();
    }
    return InitializationService.instance;
  }

  private constructor() {
    this.setupAppStateListener();
  }

  /**
   * Initialiser l'application avec le système de cache
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      
      // 1. Charger les données publiques (faces par défaut, config) même sans utilisateur
      await this.loadPublicDataFromCache();

      // 2. Si un utilisateur est connecté, charger ses données personnelles
      const uid = getCurrentUserId();
      if (uid) {
        await this.loadUserDataFromCache(uid);
        this.startBackgroundSync(uid);
      } else {
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  /**
   * Charger les données publiques depuis le cache (faces par défaut, config)
   * Si le cache est vide, charger depuis Firebase
   */
  private async loadPublicDataFromCache(): Promise<void> {
    try {
      // Charger les données publiques en parallèle depuis le cache
      const [
        defaultFaces,
        appConfig
      ] = await Promise.allSettled([
        syncService.syncDefaultFaces(false), // Utilise le cache d'abord
        syncService.syncAppConfig(false),
      ]);

      // Log des résultats
      if (defaultFaces.status === 'fulfilled') {
        
        // Si pas de faces dans le cache, charger depuis Firebase
        if (defaultFaces.value.length === 0) {
          await this.loadDefaultFacesFromFirebase();
        }
      } else if (defaultFaces.status === 'rejected') {
        console.error('❌ Erreur chargement faces par défaut:', defaultFaces.reason);
      }
      
      if (appConfig.status === 'fulfilled') {
      } else if (appConfig.status === 'rejected') {
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données publiques:', error);
    }
  }

  /**
   * Charger les faces par défaut depuis Firebase et les mettre en cache
   */
  private async loadDefaultFacesFromFirebase(): Promise<void> {
    try {
      
      // Importer la fonction de récupération depuis Firebase
      const { fetchDefaultFacesFromFirebase } = await import('./faces');
      
      // Récupérer depuis Firebase
      const faces = await fetchDefaultFacesFromFirebase();
      
      // Mettre en cache
      await cacheService.setDefaultFaces(faces);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement depuis Firebase:', error);
    }
  }

  /**
   * Charger les données utilisateur depuis le cache
   */
  private async loadUserDataFromCache(uid: string): Promise<void> {
    try {
      // Charger les données utilisateur en parallèle depuis le cache
      const [
        userProfile,
        userFaces
      ] = await Promise.allSettled([
        syncService.syncUserProfile(uid, false),
        syncService.syncUserFaces(uid, false),
      ]);

      // Log des résultats
      if (userProfile.status === 'fulfilled' && userProfile.value) {
      } else if (userProfile.status === 'rejected') {
      }
      
      if (userFaces.status === 'fulfilled') {
      } else if (userFaces.status === 'rejected') {
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données utilisateur:', error);
    }
  }

  /**
   * Démarrer la synchronisation en arrière-plan
   */
  private startBackgroundSync(uid: string): void {
    // Synchronisation immédiate
    syncService.backgroundSync(uid);

    // Synchronisation périodique (toutes les 5 minutes)
    this.backgroundSyncInterval = setInterval(() => {
      syncService.backgroundSync(uid);
    }, 5 * 60 * 1000);
  }

  /**
   * Arrêter la synchronisation en arrière-plan
   */
  private stopBackgroundSync(): void {
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }

  /**
   * Configurer l'écoute des changements d'état de l'app
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  /**
   * Gérer les changements d'état de l'application
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const uid = getCurrentUserId();
    if (!uid) return;

    switch (nextAppState) {
      case 'active':
        // Synchroniser quand l'app redevient active
        syncService.backgroundSync(uid);
        break;
      case 'background':
        // Optionnel : arrêter la sync périodique en arrière-plan
        // this.stopBackgroundSync();
        break;
      case 'inactive':
        break;
    }
  }

  /**
   * Forcer la synchronisation de toutes les données
   */
  async forceSyncAll(): Promise<void> {
    const uid = getCurrentUserId();
    if (!uid) {
      return;
    }

    await syncService.forceSyncAll(uid);
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getCacheStats(): Promise<{
    totalSize: number;
    entries: number;
    metadata: Map<string, any>;
  }> {
    return await cacheService.getCacheStats();
  }

  /**
   * Vider le cache
   */
  async clearCache(): Promise<void> {
    await cacheService.clearAllCache();
  }

  /**
   * Nettoyer les ressources
   */
  cleanup(): void {
    this.stopBackgroundSync();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.isInitialized = false;
  }

  /**
   * Vérifier si l'application est initialisée
   */
  isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Re-initialiser l'application (utile après connexion utilisateur)
   */
  async reinitialize(): Promise<boolean> {
    this.cleanup();
    return await this.initialize();
  }

  /**
   * Initialiser les données utilisateur après connexion
   */
  async initializeUserData(): Promise<void> {
    const uid = getCurrentUserId();
    if (!uid) {
      return;
    }

    try {
      await this.loadUserDataFromCache(uid);
      this.startBackgroundSync(uid);
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des données utilisateur:', error);
    }
  }
}

// Instance singleton
export const initService = InitializationService.getInstance();

// Fonction d'initialisation simple pour usage externe
export const initializeApp = async (): Promise<boolean> => {
  return await initService.initialize();
};

// Fonction de synchronisation forcée pour usage externe
export const forceSync = async (): Promise<void> => {
  return await initService.forceSyncAll();
};

// Fonction de nettoyage pour usage externe
export const cleanupApp = (): void => {
  initService.cleanup();
};