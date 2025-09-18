# Love Dice 🎲💕

**Le dé magique pour ce soir** - Une application mobile React Native pour aider les couples à prendre des décisions aléatoires pour leurs soirées.

## 📱 Stack Technique

- **React Native 0.81** avec Expo SDK 54
- **Firebase** (Auth, Firestore, Remote Config, Functions, Analytics, Hosting)
- **RevenueCat** pour les achats in-app
- **TypeScript** pour la sécurité des types
- **Expo Router** pour la navigation

## 🚀 Installation et Configuration

### 1. Prérequis

```bash
# Node.js 18+
node -v

# Yarn
yarn -v

# Expo CLI
npm install -g @expo/cli

# Firebase CLI
npm install -g firebase-tools
```

### 2. Installation des dépendances

```bash
# Dépendances principales
yarn install

# Dépendances des Cloud Functions
cd functions && npm install && cd ..
```

### 3. Configuration Firebase

#### Créer le projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet "love-dice-app"
3. Activez les services :
   - **Authentication** (Anonyme)
   - **Firestore Database**
   - **Remote Config**
   - **Functions**
   - **Analytics**
   - **Hosting**

#### Configuration des clés

1. Téléchargez les fichiers de configuration :
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)

2. Mettez à jour `services/firebase.ts` avec vos vraies clés :

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "love-dice-app.firebaseapp.com",
  projectId: "love-dice-app",
  storageBucket: "love-dice-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

### 4. Configuration RevenueCat

1. Créez un compte sur [RevenueCat](https://www.revenuecat.com/)
2. Configurez le produit IAP `love_dice_lifetime`
3. Mettez à jour les clés dans `hooks/useRevenueCat.ts` :

```typescript
const APIKeys = {
    apple: 'VOTRE_CLE_APPLE',
    google: 'VOTRE_CLE_GOOGLE',
};
```

### 5. Déploiement Firebase

```bash
# Connexion à Firebase
firebase login

# Initialisation du projet
firebase use --add love-dice-app

# Déploiement des règles Firestore
firebase deploy --only firestore:rules

# Déploiement des index
firebase deploy --only firestore:indexes

# Déploiement Remote Config
firebase deploy --only remoteconfig

# Déploiement des Functions
firebase deploy --only functions

# Déploiement du site web
firebase deploy --only hosting
```

## 🧪 Développement

### Démarrer en mode développement

```bash
# Démarrer l'app
yarn start

# iOS
yarn ios

# Android
yarn android

# Émulateurs Firebase (optionnel)
firebase emulators:start
```

### Scripts disponibles

```bash
# Linting
yarn lint

# Reset du projet (si nécessaire)
yarn reset-project

# Build des Functions
cd functions && npm run build

# Tests des Functions
cd functions && npm test
```

## 📁 Structure du Projet

```
love-dice/
├── app/                          # Écrans de l'app (Expo Router)
│   ├── (onboarding)/             # Onboarding 3 étapes
│   ├── (tabs)/                   # App principale
│   ├── paywall.tsx               # Paywall IAP
│   ├── history.tsx               # Historique premium
│   └── custom-faces.tsx          # Éditeur de faces
├── components/                   # Composants réutilisables
├── hooks/                        # Hooks personnalisés
│   ├── useRevenueCat.ts          # Gestion IAP
│   ├── useQuota.ts               # Gestion quotas
│   └── useAnalytics.ts           # Events analytics
├── services/                     # Services externes
│   ├── firebase.ts               # Configuration Firebase
│   └── firestore.ts              # Opérations Firestore
├── utils/                        # Utilitaires
│   ├── dice.ts                   # Logique de dé
│   └── quota.ts                  # Gestion quotas local
├── data/                         # Données statiques
│   └── defaultFaces.ts           # Faces par défaut
├── functions/                    # Cloud Functions
│   └── src/index.ts              # Vérification IAP
├── hosting/                      # Site web statique
├── firestore.rules               # Règles sécurité
├── firestore.indexes.json        # Index Firestore
└── remoteconfig.template.json    # Configuration Remote Config
```

## 🎯 Fonctionnalités Implémentées

### ✅ Core Features (v1)

- [x] **Onboarding** 3 écrans + redirection paywall
- [x] **Home** avec bouton de lancer + animation + résultat
- [x] **Système de quota** (3 lancers/jour gratuits)
- [x] **Paywall Lifetime** avec IAP RevenueCat
- [x] **Logic de dé** avec pondération et anti-répétition
- [x] **23 faces par défaut** (payer/repas/activité)
- [x] **Auth anonyme** automatique Firebase
- [x] **Mode offline** avec sync Firestore

### ✅ Premium Features

- [x] **Paramètres** complets avec préférences
- [x] **Historique** des 20 derniers lancers
- [x] **Faces personnalisées** (CRUD complet)
- [x] **Partage** des résultats
- [x] **Sync multi-device** Firestore

### ✅ Backend & Infrastructure

- [x] **Cloud Functions** pour vérification IAP
- [x] **Règles Firestore** sécurisées
- [x] **Remote Config** pour A/B testing
- [x] **Analytics Firebase** avec événements métier
- [x] **Site web** avec pages légales
- [x] **Reset quotas** automatique (cron)

## 🎨 Design System

### Palette Rouge Glamour

```scss
$primary: #E0115F;     // Rouge glamour
$primary-dark: #A50848; // Rouge profond  
$primary-light: #FF4F7B; // Rose chaud
$background: #FFF3F6;   // Fond crème
$text: #0E0E10;         // Texte sombre
$accent: #F4C869;       // Accent doré
```

### Dégradés

- **Principal** : `#A50848 → #E0115F → #FF4F7B`
- **Boutons** : `#F4C869 → #E0115F`

## 📊 Analytics Events

Les événements suivants sont trackés :

- `onboarding_view` - Vue des écrans d'onboarding
- `paywall_view` / `paywall_purchase_success` - Funnel paywall
- `dice_roll` / `dice_result_{category}` - Usage du dé
- `free_limit_hit` - Limite gratuite atteinte
- `custom_face_add` - Création face personnalisée

## 🔒 Sécurité

### Règles Firestore

- **Users** : Lecture/écriture owner seulement
- **Faces par défaut** : Lecture publique, écriture admin
- **IAP Receipts** : Accès Functions uniquement
- **Validation** complète des données

### IAP Security

- Vérification server-side des reçus Apple/Google
- Protection contre la fraude
- Logs complets des transactions

## 🚀 Prêt pour Production

### Checklist avant release

#### Configuration
- [ ] Remplacer les clés Firebase par les vraies
- [ ] Configurer RevenueCat avec les vrais produits
- [ ] Mettre à jour les URLs dans Remote Config
- [ ] Tester IAP en sandbox puis production

#### App Store / Google Play
- [ ] Créer les fiches store
- [ ] Screenshots avec le design rouge glamour
- [ ] Icône app (dé + cœur)
- [ ] Configurer les produits IAP
- [ ] Review guidelines compliance

#### Monitoring
- [ ] Activer Analytics en production
- [ ] Configurer les alertes Crashlytics
- [ ] Dashboard de monitoring des KPIs
- [ ] Tests A/B via Remote Config

## 📈 KPIs à Suivre

### Objectifs v1
- **J0 → D1 conversion paywall** : ≥ 5-8%
- **Rétention D7 (free)** : ≥ 12%
- **Temps première valeur** : < 3s (tap→résultat)

### Métriques Importantes
- Taux de conversion paywall par source
- Distribution des catégories de résultats
- Engagement (lancers par session)
- Rétention par cohorte

## 🛠 Développement Futur

### Roadmap v1.1+
- [ ] **Thèmes** (Romantique/Aventure/Chill)
- [ ] **Widget iOS/Android** "Lancer"
- [ ] **Mode duo** (secouer à deux)
- [ ] **Packs premium** additionnels
- [ ] **Push notifications** contextuelles

### Optimisations Techniques
- [ ] **Animations Lottie** pour le dé
- [ ] **Confettis** à la révélation
- [ ] **Haptique avancé** (patterns)
- [ ] **Dark mode** complet

## 📞 Support

- **Email Support** : support@lovedice.app
- **Documentation** : [Firebase Docs](https://firebase.google.com/docs)
- **RevenueCat Docs** : [RevenueCat Documentation](https://docs.revenuecat.com/)

---

> **Mantra v1** : *Un écran. Un dé. Une décision.* 🎲💕

**Status** : ✅ **Prêt pour production** - Toutes les fonctionnalités core et premium sont implémentées selon le cahier des charges.