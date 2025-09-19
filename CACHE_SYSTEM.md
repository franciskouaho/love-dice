# Système de Cache Local avec Firebase

Ce document décrit le système de cache local implémenté pour l'application Love Dice, qui permet d'avoir un accès instantané aux données tout en gardant la synchronisation avec Firebase.

## 🎯 Objectifs

- **Performance** : Accès instantané aux données via le cache local
- **Fiabilité** : Fallback vers Firebase en cas de problème
- **Synchronisation** : Mise à jour automatique en arrière-plan
- **Offline** : Fonctionnement même sans connexion internet

## 🏗️ Architecture

### Services Principaux

1. **`cache.ts`** - Service de cache local avec AsyncStorage
2. **`sync.ts`** - Service de synchronisation Firebase ↔ Cache
3. **`initialization.ts`** - Service d'initialisation et gestion du cycle de vie
4. **`useCache.ts`** - Hooks React pour faciliter l'utilisation

### Flux de Données

```
App Launch → Cache Check → Firebase (if needed) → Cache Update → UI Update
     ↓
Background Sync → Firebase → Cache Update
```

## 📱 Utilisation

### Initialisation de l'Application

```typescript
import { initializeApp } from './services/initialization';

// Dans votre App.tsx ou point d'entrée
useEffect(() => {
  initializeApp();
}, []);
```

### Utilisation avec les Hooks React

```typescript
import { useDefaultFaces, useUserProfile, useAllActiveFaces } from './hooks/useCache';

function MyComponent() {
  // Faces par défaut
  const { faces, loading, error, refresh } = useDefaultFaces();
  
  // Profil utilisateur
  const { profile } = useUserProfile();
  
  // Toutes les faces actives
  const { faces: allFaces } = useAllActiveFaces();
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return (
    <View>
      <Text>Faces: {faces.length}</Text>
      <Button title="Actualiser" onPress={refresh} />
    </View>
  );
}
```

### Utilisation Directe des Services

```typescript
import { syncService, cacheService } from './services';

// Récupérer des données (utilise le cache d'abord)
const faces = await syncService.syncDefaultFaces();
const profile = await syncService.syncUserProfile(uid);

// Forcer la synchronisation
const freshFaces = await syncService.syncDefaultFaces(true);

// Synchronisation en arrière-plan
await syncService.backgroundSync(uid);

// Gestion du cache
const stats = await cacheService.getCacheStats();
await cacheService.clearAllCache();
```

## ⚙️ Configuration

### Durées de Cache

```typescript
const CACHE_DURATION = {
  DEFAULT_FACES: 24 * 60 * 60 * 1000, // 24 heures
  USER_PROFILE: 5 * 60 * 1000,        // 5 minutes
  USER_FACES: 10 * 60 * 1000,         // 10 minutes
  USER_HISTORY: 2 * 60 * 1000,        // 2 minutes
  APP_CONFIG: 30 * 60 * 1000,         // 30 minutes
};
```

### Synchronisation Automatique

- **Au lancement** : Chargement depuis le cache + sync en arrière-plan
- **App active** : Sync automatique quand l'app redevient active
- **Périodique** : Sync toutes les 5 minutes en arrière-plan

## 🔄 Stratégie de Cache

### Cache-First Strategy

1. **Vérifier le cache** - Si valide, retourner les données
2. **Fallback Firebase** - Si cache invalide ou absent
3. **Mise à jour cache** - Sauvegarder les nouvelles données
4. **Retour données** - Retourner les données à l'utilisateur

### Gestion des Erreurs

- **Cache invalide** → Firebase
- **Firebase indisponible** → Cache expiré
- **Aucune donnée** → Valeurs par défaut

## 📊 Types de Données Cachées

### Faces par Défaut
- **Durée** : 24 heures
- **Source** : Collection `defaultFaces`
- **Usage** : Faces disponibles pour tous les utilisateurs

### Profil Utilisateur
- **Durée** : 5 minutes
- **Source** : Document `users/{uid}`
- **Usage** : Préférences, quota, statut lifetime

### Faces Personnalisées
- **Durée** : 10 minutes
- **Source** : Collection `users/{uid}/faces`
- **Usage** : Faces créées par l'utilisateur

### Historique
- **Durée** : 2 minutes
- **Source** : Collection `users/{uid}/history`
- **Usage** : Historique des lancers

### Configuration App
- **Durée** : 30 minutes
- **Source** : Document `appConfig/main`
- **Usage** : Configuration globale de l'app

## 🛠️ API des Services

### CacheService

```typescript
class LocalCacheService {
  // Sauvegarder des données
  async setCache<T>(key: string, data: T): Promise<void>
  
  // Récupérer des données
  async getCache<T>(key: string, maxAge: number): Promise<T | null>
  
  // Supprimer des données
  async removeCache(key: string): Promise<void>
  
  // Vider tout le cache
  async clearAllCache(): Promise<void>
  
  // Obtenir les statistiques
  async getCacheStats(): Promise<CacheStats>
}
```

### SyncService

```typescript
class SyncService {
  // Synchroniser les faces par défaut
  async syncDefaultFaces(forceRefresh?: boolean): Promise<DiceFace[]>
  
  // Synchroniser le profil utilisateur
  async syncUserProfile(uid: string, forceRefresh?: boolean): Promise<UserProfile | null>
  
  // Synchroniser les faces personnalisées
  async syncUserFaces(uid: string, forceRefresh?: boolean): Promise<CustomFace[]>
  
  // Synchroniser l'historique
  async syncUserHistory(uid: string, limit: number, forceRefresh?: boolean): Promise<HistoryEntry[]>
  
  // Synchroniser la configuration
  async syncAppConfig(forceRefresh?: boolean): Promise<AppConfig>
  
  // Synchronisation en arrière-plan
  async backgroundSync(uid: string): Promise<void>
  
  // Synchronisation forcée
  async forceSyncAll(uid: string): Promise<void>
}
```

### InitializationService

```typescript
class InitializationService {
  // Initialiser l'application
  async initialize(): Promise<boolean>
  
  // Forcer la synchronisation
  async forceSyncAll(): Promise<void>
  
  // Obtenir les statistiques du cache
  async getCacheStats(): Promise<CacheStats>
  
  // Vider le cache
  async clearCache(): Promise<void>
  
  // Nettoyer les ressources
  cleanup(): void
}
```

## 🧪 Tests et Exemples

### Exemple Basique

```typescript
import { runAllExamples } from './services/cacheExample';

// Exécuter tous les exemples
await runAllExamples();
```

### Test de Performance

```typescript
import { performanceTestExample } from './services/cacheExample';

// Tester les performances du cache
await performanceTestExample();
```

## 🚀 Avantages

1. **Performance** : Accès instantané aux données
2. **Fiabilité** : Fonctionnement même offline
3. **Efficacité** : Réduction des appels Firebase
4. **UX** : Interface réactive et fluide
5. **Économie** : Réduction des coûts Firebase

## 🔧 Maintenance

### Nettoyage du Cache

```typescript
// Vider tout le cache
await cacheService.clearAllCache();

// Vider un type spécifique
await cacheService.removeCache('cache_default_faces');
```

### Surveillance

```typescript
// Obtenir les statistiques
const stats = await cacheService.getCacheStats();
console.log(`Cache: ${stats.entries} entrées, ${stats.totalSize} bytes`);
```

### Debug

```typescript
// Activer les logs détaillés
console.log('Cache stats:', await cacheService.getCacheStats());
console.log('Sync status:', await syncService.getSyncStatus());
```

## 📝 Notes Importantes

1. **AsyncStorage** : Le cache utilise AsyncStorage pour la persistance
2. **Versioning** : Le cache est versionné pour l'invalidation automatique
3. **Mémoire** : Les données sont chargées à la demande
4. **Concurrence** : Protection contre les synchronisations multiples
5. **Fallback** : Toujours un fallback vers les données par défaut

## 🔮 Évolutions Futures

- [ ] Compression des données en cache
- [ ] Cache intelligent basé sur l'usage
- [ ] Synchronisation différentielle
- [ ] Cache partagé entre utilisateurs
- [ ] Métriques de performance détaillées
