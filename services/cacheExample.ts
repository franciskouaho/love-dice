/**
 * Exemple d'utilisation du système de cache
 * Ce fichier montre comment utiliser les différents services de cache
 */

import { cacheService } from './cache';
import { getCurrentUserId } from './firestore';
import { initService } from './initialization';
import { syncService } from './sync';

/**
 * Exemple d'utilisation basique du cache
 */
export const basicCacheExample = async () => {
  console.log('🚀 Exemple d\'utilisation basique du cache');

  try {
    // 1. Initialiser l'application
    console.log('1. Initialisation de l\'application...');
    const initialized = await initService.initialize();
    console.log('✅ Application initialisée:', initialized);

    // 2. Récupérer les faces par défaut (utilise le cache)
    console.log('2. Récupération des faces par défaut...');
    const defaultFaces = await syncService.syncDefaultFaces();
    console.log(`✅ ${defaultFaces.length} faces par défaut récupérées`);

    // 3. Récupérer la configuration (utilise le cache)
    console.log('3. Récupération de la configuration...');
    const config = await syncService.syncAppConfig();
    console.log('✅ Configuration récupérée:', config.FREE_ROLLS_PER_DAY, 'lancers gratuits');

    // 4. Récupérer le profil utilisateur (si connecté)
    const uid = getCurrentUserId();
    if (uid) {
      console.log('4. Récupération du profil utilisateur...');
      const profile = await syncService.syncUserProfile(uid);
      console.log('✅ Profil utilisateur récupéré:', profile?.uid);
    }

    // 5. Obtenir les statistiques du cache
    console.log('5. Statistiques du cache...');
    const stats = await cacheService.getCacheStats();
    console.log('✅ Statistiques du cache:', {
      entries: stats.entries,
      totalSize: `${(stats.totalSize / 1024).toFixed(2)} KB`,
    });

  } catch (error) {
    console.error('❌ Erreur dans l\'exemple basique:', error);
  }
};

/**
 * Exemple de synchronisation forcée
 */
export const forceSyncExample = async () => {
  console.log('🔄 Exemple de synchronisation forcée');

  try {
    // Forcer la synchronisation de toutes les données
    await initService.forceSyncAll();
    console.log('✅ Synchronisation forcée terminée');

    // Vérifier les nouvelles données
    const defaultFaces = await syncService.syncDefaultFaces();
    console.log(`✅ ${defaultFaces.length} faces synchronisées`);

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation forcée:', error);
  }
};

/**
 * Exemple de gestion du cache
 */
export const cacheManagementExample = async () => {
  console.log('🗂️ Exemple de gestion du cache');

  try {
    // 1. Obtenir les statistiques du cache
    const stats = await cacheService.getCacheStats();
    console.log('📊 Statistiques du cache:', {
      entries: stats.entries,
      totalSize: `${(stats.totalSize / 1024).toFixed(2)} KB`,
    });

    // 2. Lister les métadonnées du cache
    console.log('📋 Métadonnées du cache:');
    stats.metadata.forEach((metadata, key) => {
      const age = Date.now() - metadata.lastUpdated;
      const ageMinutes = Math.floor(age / (1000 * 60));
      console.log(`  - ${key}: ${ageMinutes}min, source: ${metadata.source}`);
    });

    // 3. Vider le cache
    console.log('🗑️ Vidage du cache...');
    await cacheService.clearAllCache();
    console.log('✅ Cache vidé');

    // 4. Vérifier que le cache est vide
    const emptyStats = await cacheService.getCacheStats();
    console.log('📊 Cache après vidage:', {
      entries: emptyStats.entries,
      totalSize: `${(emptyStats.totalSize / 1024).toFixed(2)} KB`,
    });

  } catch (error) {
    console.error('❌ Erreur dans la gestion du cache:', error);
  }
};

/**
 * Exemple de test de performance
 */
export const performanceTestExample = async () => {
  console.log('⚡ Test de performance du cache');

  try {
    const uid = getCurrentUserId();
    if (!uid) {
      console.log('⚠️ Aucun utilisateur connecté pour le test');
      return;
    }

    // Test 1: Premier chargement (depuis Firebase)
    console.log('1. Premier chargement (depuis Firebase)...');
    const start1 = Date.now();
    const faces1 = await syncService.syncDefaultFaces(true);
    const time1 = Date.now() - start1;
    console.log(`✅ Premier chargement: ${time1}ms pour ${faces1.length} faces`);

    // Test 2: Deuxième chargement (depuis le cache)
    console.log('2. Deuxième chargement (depuis le cache)...');
    const start2 = Date.now();
    const faces2 = await syncService.syncDefaultFaces(false);
    const time2 = Date.now() - start2;
    console.log(`✅ Deuxième chargement: ${time2}ms pour ${faces2.length} faces`);

    // Test 3: Chargement du profil utilisateur
    console.log('3. Chargement du profil utilisateur...');
    const start3 = Date.now();
    const profile = await syncService.syncUserProfile(uid, false);
    const time3 = Date.now() - start3;
    console.log(`✅ Profil utilisateur: ${time3}ms`);

    // Calcul de l'amélioration
    const improvement = ((time1 - time2) / time1) * 100;
    console.log(`📈 Amélioration avec le cache: ${improvement.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Erreur dans le test de performance:', error);
  }
};

/**
 * Exemple d'utilisation avec les hooks React
 */
export const reactHooksExample = () => {
  console.log('⚛️ Exemple d\'utilisation avec les hooks React');
  console.log(`
// Dans un composant React :

import { useDefaultFaces, useUserProfile, useAppInitialization } from '../hooks/useCache';

function MyComponent() {
  // Initialisation de l'app
  const { isInitialized, initialize } = useAppInitialization();
  
  // Faces par défaut
  const { faces, loading, error, refresh } = useDefaultFaces();
  
  // Profil utilisateur
  const { profile } = useUserProfile();
  
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return (
    <View>
      <Text>Faces chargées: {faces.length}</Text>
      <Button title="Actualiser" onPress={refresh} />
    </View>
  );
}
  `);
};

/**
 * Exécuter tous les exemples
 */
export const runAllExamples = async () => {
  console.log('🎯 Exécution de tous les exemples de cache');
  
  try {
    await basicCacheExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await performanceTestExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await cacheManagementExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    reactHooksExample();
    
    console.log('\n✅ Tous les exemples terminés');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des exemples:', error);
  }
};

// Export des exemples individuels
export {
    basicCacheExample, cacheManagementExample, forceSyncExample, performanceTestExample,
    reactHooksExample
};

