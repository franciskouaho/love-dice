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
      console.log('📱 Application déjà initialisée');
      return true;
    }

    try {
      console.log('🚀 Initialisation de l\'application avec cache...');
      
      // 1. Charger les données publiques (faces par défaut, config) même sans utilisateur
      console.log('📱 Chargement des données publiques depuis le cache...');
      await this.loadPublicDataFromCache();

      // 2. Si un utilisateur est connecté, charger ses données personnelles
      const uid = getCurrentUserId();
      if (uid) {
        console.log('📱 Utilisateur connecté, chargement des données personnelles...');
        await this.loadUserDataFromCache(uid);
        this.startBackgroundSync(uid);
      } else {
        console.log('ℹ️ Aucun utilisateur connecté, données publiques seulement');
      }

      this.isInitialized = true;
      console.log('✅ Application initialisée avec succès');
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
        console.log(`📱 ${defaultFaces.value.length} faces par défaut chargées`);
        
        // Si pas de faces dans le cache, charger depuis Firebase
        if (defaultFaces.value.length === 0) {
          console.log('🔄 Cache vide, chargement depuis Firebase...');
          await this.loadDefaultFacesFromFirebase();
        }
      } else if (defaultFaces.status === 'rejected') {
        console.error('❌ Erreur chargement faces par défaut:', defaultFaces.reason);
      }
      
      if (appConfig.status === 'fulfilled') {
        console.log('📱 Configuration chargée');
      } else if (appConfig.status === 'rejected') {
        console.error('❌ Erreur chargement config:', appConfig.reason);
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
      console.log('🔥 Chargement des faces par défaut depuis Firebase...');
      
      // Importer la fonction de récupération depuis Firebase
      const { fetchDefaultFacesFromFirebase } = await import('./faces');
      
      // Récupérer depuis Firebase
      const faces = await fetchDefaultFacesFromFirebase();
      console.log(`🔥 ${faces.length} faces récupérées depuis Firebase`);
      
      // Mettre en cache
      await cacheService.setDefaultFaces(faces);
      console.log('💾 Faces mises en cache local');
      
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
        console.log('📱 Profil utilisateur chargé');
      } else if (userProfile.status === 'rejected') {
        console.error('❌ Erreur chargement profil:', userProfile.reason);
      }
      
      if (userFaces.status === 'fulfilled') {
        console.log(`📱 ${userFaces.value.length} faces personnalisées chargées`);
      } else if (userFaces.status === 'rejected') {
        console.error('❌ Erreur chargement faces utilisateur:', userFaces.reason);
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
        console.log('📱 Application active - synchronisation...');
        // Synchroniser quand l'app redevient active
        syncService.backgroundSync(uid);
        break;
      case 'background':
        console.log('📱 Application en arrière-plan');
        // Optionnel : arrêter la sync périodique en arrière-plan
        // this.stopBackgroundSync();
        break;
      case 'inactive':
        console.log('📱 Application inactive');
        break;
    }
  }

  /**
   * Forcer la synchronisation de toutes les données
   */
  async forceSyncAll(): Promise<void> {
    const uid = getCurrentUserId();
    if (!uid) {
      console.warn('⚠️ Aucun utilisateur connecté pour la synchronisation forcée');
      return;
    }

    console.log('🔄 Synchronisation forcée de toutes les données...');
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
    console.log('🗑️ Vidage du cache...');
    await cacheService.clearAllCache();
    console.log('✅ Cache vidé');
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
    console.log('🔄 Ré-initialisation de l\'application...');
    this.cleanup();
    return await this.initialize();
  }

  /**
   * Initialiser les données utilisateur après connexion
   */
  async initializeUserData(): Promise<void> {
    const uid = getCurrentUserId();
    if (!uid) {
      console.log('⚠️ Aucun utilisateur connecté pour l\'initialisation des données');
      return;
    }

    try {
      console.log('👤 Initialisation des données utilisateur...');
      await this.loadUserDataFromCache(uid);
      this.startBackgroundSync(uid);
      console.log('✅ Données utilisateur initialisées');
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