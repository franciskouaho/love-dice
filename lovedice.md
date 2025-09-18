# Love Dice — Cahier des charges (v1)

**Stack cible** : React Native 0.81 • Expo SDK 54 • Firebase (Auth, Firestore, Remote Config, Functions, Analytics, Hosting)

**Pitch** : Un seul bouton. On lance **un dé** qui décide la soirée du couple (qui paie, d’où vient le repas, idée d’activité/bonus). Ultra simple, satisfaisant, partageable. **3 lancers/jour** gratuits, **achat à vie** pour l’illimité + personnalisation + historique.

---

## 1) Vision & objectifs
- **Problème** : Les couples perdent du temps à décider quoi faire le soir.
- **Solution** : **Un seul dé magique** qui offre une décision fun en 2 secondes.
- **Promesse** : *“Lance, décide, profitez.”*
- **Monétisation** : **Lifetime IAP** (pas d’abonnement, pas de pubs).

KPIs initiaux :
- J0 → D1 conversion paywall (view→purchase) ≥ 5–8%.
- Rétention D7 (free) ≥ 12%.
- Temps à la première valeur (tap→résultat) < 3 s.

---

## 2) Public cible
- Couples 18–40 ans (FR d’abord, EN ensuite), usage 19h–22h.
- iOS 15+ (iPhone) • Android 9+ • Portrait only • Offline ready.

---

## 3) Périmètre produit (v1)
- **Écran Home** : bouton **Lancer le dé** → animation → **Résultat** (gros, centré, emoji).
- **Limite gratuite** : 3 lancers/jour (Remote Config).
- **Paywall Lifetime** : plein écran, rouge glamour, CTA massif.
- **Personnalisation (post-achat)** : CRUD des faces du dé (labels + catégorie).
- **Historique (post-achat)** : 10 derniers résultats.
- **Partage** : texte + emoji (image simple en option v1.1).
- **Onboarding** : 3 écrans + redirection paywall ou Home.
- **Sans compte** visible : Auth **anonyme** auto.

**Hors v1** : sync multi-device (hors connexion compte), push, packs premium, backend complexe.

---

## 4) Design — Rouge Glamour (inspiration Egg Timer)

### Palette
- Primaire **Rouge glamour** `#E0115F`
- Rouge profond `#A50848`
- Rose chaud `#FF4F7B`
- Fond crème `#FFF3F6`
- Texte sombre `#0E0E10`
- Accent doré `#F4C869`

**Dégradé principal** : `#A50848 → #E0115F → #FF4F7B`

### Typographie
- Titres/CTA : **DM Sans**
- Corps : **Inter**

### Composants clés
- **Bouton circulaire XXL “Lancer”** (dégradé, glow, ombre douce, rayon ≥ 48).
- **Affichage résultat** : style “timer Egg Timer” (gros, lisible, centré), ex. *Restaurant 🍽️*.
- **Compteur** : “2/3 lancers restants aujourd’hui”.
- **Paywall** : plein écran, visuel simple, 3–4 puces valeur, prix clair.

### Micro-interactions
- Haptique : `selection` au tap, `success` à l’arrêt.
- Dé qui roule : rotation+scale ~800 ms.
- Confettis légers à la révélation (désactivables en Accessibilité).

### Accessibilité
- Contrastes AA, targets ≥ 44 px, libellés VoiceOver, toggle haptique.

---

## 5) Parcours utilisateur

### Onboarding (3 écrans)
1. **Randomisez votre soirée** — *Fini les prises de tête.* → **Commencer**
2. **Un seul dé, une décision** — *Qui paie, où manger, quelle activité.*
3. **Secouez & découvrez** — *Animation satisfaisante, résultat instantané.*
→ **Paywall Lifetime** (option « Plus tard » visible discrètement) ou Home.

### Home
- Header minimal (logo dé + bouton paramètres si acheté).
- Bouton **Lancer** → animation → **Carte Résultat** (emoji + titre + sous-texte).
- Actions rapides contextuelles :
  - *Restaurant* → ouvrir Plans/Maps “restaurants”.
  - *Livraison* → ouvrir UberEats/Deliveroo.
  - *Fait maison* → ouvrir une note/recette (placeholder v1).
- **Relancer** (consomme 1 lancer gratuit) • **Partager** • **Sauvegarder** (post-achat).
- À 0 lancer → **Paywall**.

### Paramètres (post-achat)
- Prénoms partenaires.
- **Éditeur d’idées** (CRUD faces : label, catégorie, poids optionnel).
- Vider historique.
- Haptique on/off, thèmes futurs (flag RC).

### Historique (post-achat)
- Liste (date ISO, emoji, label).

---

## 6) Contenu / Faces par défaut

Catégories & exemples :
- **payer** : *Tu paies 🍷*, *Je paie 💳*, *50/50 🧾*, *Pile ou Face 🪙*.
- **repas** : *Restaurant 🍽️*, *Livraison 🍕*, *Street food 🌮*, *Fait maison 🍝*, *Surprise de l’autre 🎁*.
- **activite** : *Cinéma maison 🎬*, *Jeu de société 🎲*, *Balade nocturne 🌙*, *Tenue chic 👔*, *Budget max 30€ 💶*, *Dessert obligatoire 🍰*, *Pas d’écran 📵*, *Karaoké 🎤*, *Musée 🖼️*, *Bowling 🎳*.

**Pondération v1** (modifiable) : `payer 20% • repas 20% • activite 60%`.
**Anti-répétition** : ne pas renvoyer la dernière face si pool > 5.

---

## 7) Firebase — Architecture

### Services
- **Auth** : Anonyme par défaut (Apple/Google optionnel).
- **Firestore** : profil, quotas, faces custom, historique.
- **Remote Config** : `FREE_ROLLS_PER_DAY`, `LIFETIME_PRICE`, `PAYWALL_TITLE`, `PAYWALL_BULLETS`, `FEATURE_FLAGS`.
- **Functions** : vérification des reçus IAP (Apple/Google) → `hasLifetime=true`.
- **Analytics** : funnel et usage (anonymes, opt‑out possible).
- **Hosting** : pages `/terms` et `/privacy`.

### Modèle de données (Firestore)
- `users/{uid}`
  ```json
  {
    "createdAt": TS,
    "hasLifetime": false,
    "freeRollsUsedToday": 0,
    "freeDayKey": "YYYY-MM-DD",
    "prefs": { "haptics": true, "weights": {"payer":0.2,"repas":0.2,"activite":0.6} }
  }
  ```
- `users/{uid}/history/{rollId}`
  ```json
  { "createdAt": TS, "faceId": "restaurant", "label": "Restaurant 🍽️", "category": "repas" }
  ```
- `users/{uid}/faces/{faceId}`
  ```json
  { "label": "Bowling 🎳", "category": "activite", "weight": 1 }
  ```
- `faces_default/{faceId}` *(lecture publique ou embarqué)*
  ```json
  { "label": "Restaurant 🍽️", "category": "repas", "weight": 1, "actions": ["maps"] }
  ```
- `iapReceipts/{platform}/{token}` *(écrit par Function)*
  ```json
  { "uid": "...", "status": "verified", "productId": "love_dice_lifetime", "purchaseTime": TS }
  ```

### Règles Firestore (brouillon)
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function owner(uid) { return signedIn() && request.auth.uid == uid; }

    match /users/{uid} {
      allow read, update: if owner(uid);
      allow create: if signedIn();
      allow delete: if false;

      match /history/{doc} { allow read, write: if owner(uid); }
      match /faces/{doc}   { allow read, write: if owner(uid); }
    }

    match /faces_default/{doc} { allow read: if true; allow write: if false; }

    match /iapReceipts/{platform}/{token} {
      allow read: if false; // seulement Functions
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Remote Config (défauts)
```json
{
  "FREE_ROLLS_PER_DAY": 3,
  "LIFETIME_PRICE": "12,99 €",
  "PAYWALL_TITLE": "Accès à vie 💕",
  "PAYWALL_BULLETS": "Lancers illimités|Dés personnalisables|Aucune pub",
  "FEATURE_FLAGS": "{\"customFaces\":true,\"history\":true}"
}
```

### Cloud Functions (Node 18)
- `verifyReceipt` : vérifie reçus IAP (Apple/Google), met `hasLifetime=true`, écrit log `iapReceipts`, renvoie `{ok:true}`.
- (Optionnel) Cron **reset quotas** quotidien (sécurité multi‑device) : met `freeRollsUsedToday=0`, `freeDayKey=today`.

---

## 8) Logique produit
- **Randomisation** : `crypto.getRandomValues` si dispo, sinon `Math.random`.
- **Pondération** : respect `weights` par catégorie.
- **Quota** : compare `freeDayKey` au jour courant (locale). Si différent → reset. Sinon incrémente jusqu’à `FREE_ROLLS_PER_DAY`.
- **Offline** : faces par défaut embarquées, quota géré localement + sync Firestore.

---

## 9) Analytics (Firebase)
Événements :
- `onboarding_view`, `paywall_view`, `paywall_purchase_attempt`, `paywall_purchase_success`.
- `dice_roll`, `dice_result_{category}` (param: `label`).
- `free_limit_hit`, `custom_face_add`.

Privacy : pas de PII, opt‑out dans Paramètres.

---

## 10) Textes FR (micro‑copy)

**Home**
- Bouton : **Lancer le dé**
- Compteur : **{n}/{N} lancers restants aujourd’hui**
- Résultat : ex. **Restaurant 🍽️**  
- Under‑result (si lock) : *Gratuit : 3 lancers/jour. Débloquez les lancers illimités 💕*

**Paywall**
- Titre : **Accès à vie 💕**
- Puces : *Lancers illimités • Dés personnalisables • Aucune pub*
- Prix : **{price} — rien de plus.**
- CTA : **Continuer →** • Lien : *Restaurer achats*

**Onboarding**
- S1 : *Randomisez votre soirée — Fini les prises de tête.*
- S2 : *Un seul dé, une décision — Qui paie, où manger, quelle activité.*
- S3 : *Secouez & découvrez — Animation satisfaisante, résultat instantané.*

---

## 11) Critères d’acceptation (QA)
- Temps tap→résultat < 1.5 s.
- Même face ne sort pas 2 fois d’affilée (pool>5).
- Quota free fiable (reset minuit local).
- À quota 0 → Paywall s’affiche systématiquement.
- Achat validé → `hasLifetime=true`, illimité actif immédiatement, restore OK.
- UI conforme (dégradés, gros textes, accessibilité AA, haptique).
- Fonctionne offline (faces par défaut + quota local).

---

## 12) Tâches de dev (tickets Cursor)

**Setup**
- Créer projet Firebase (staging+prod). Activer Auth (anonyme), Firestore, RC, Functions, Analytics, Hosting.
- Intégrer Google Services (iOS/Android) et config Expo.
- `firebase.ts` (init + persistence).
- Seed `faces_default` (JSON embarqué + option lecture Firestore).

**App**
- Onboarding 3 écrans → Paywall.
- Home : bouton **Lancer** + animation + résultat + compteur.
- Gestion quota (RC + Firestore + local).
- Paywall Lifetime (prix via RC) + Restore.
- Personnalisation post‑achat (CRUD faces).
- Historique post‑achat.
- Partage résultat.
- Accessibilité + Dark mode basique (optionnel).

**IAP**
- Intégration StoreKit/Billing (Expo IAP).
- Function `verifyReceipt` (Apple/Google) + update `hasLifetime`.

**Sécurité / Légal**
- Règles Firestore finales + tests unitaires rules.
- Pages Hosting `/privacy` & `/terms`.

**QA / Release**
- Tests offline/online, changement de jour, anti‑répétition.
- Instruments Analytics (événements).
- Screenshots stores (FR), icône app (dé + cœur).

---

## 13) Roadmap post‑v1 (optionnel)
- Thèmes (Romantique / Aventure / Chill) via RC.
- Widget iOS/Android « Lancer ».
- Mode duo (secouer à deux appareils, WebRTC local).
- Packs d’idées additionnels (one‑time micro‑achats).

---

## 14) Naming & Store
- **Nom** : *Love Dice*
- **Sous‑titre FR** : *Le dé magique pour ce soir*
- **EN subtitle** : *One roll to plan tonight*
- **Mots‑clés** : couple, soirée, dé, idées, aléatoire, date

---

## 15) Risques & mitigations
- **IAP** : rejet si vérif serveur manquante → Function de validation et restore fiables.
- **Répétitivité** : enrichir pool d’idées + pondérations.
- **Conversion** : A/B via Remote Config (titre, puces, prix localisé).

---

> **Mantra v1** : *Un écran. Un dé. Une décision.*

