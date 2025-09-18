import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';

// Hook pour gérer l'authentification anonyme
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const signInAnonymous = async () => {
    try {
      const result = await signInAnonymously(auth);
      
      // Attribuer automatiquement un quota de 2 lancers au nouvel utilisateur
      if (result.user) {
        await grantStarterQuota(result.user.uid);
      }
      
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Fonction pour attribuer un quota de lancers à un utilisateur (AUGMENTÉ POUR TEST)
  const grantStarterQuota = async (userId: string) => {
    try {
      const docRef = doc(db, 'user_settings', userId);
      await setDoc(docRef, {
        hasLifetime: false,
        unlimited: false,
        dailyQuota: 50, // 🧪 AUGMENTÉ POUR TEST (était 2)
        remainingRolls: 50, // 🧪 AUGMENTÉ POUR TEST (était 2)
        lastReset: Timestamp.now(),
        grantedAt: Timestamp.now(),
        source: 'anonymous_signup',
      }, { merge: true });
      console.log('✅ Quota de 50 lancers attribué à:', userId);
    } catch (error) {
      console.error('❌ Erreur attribution quota:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Initialisation automatique de l'auth anonyme - UNIQUEMENT si nécessaire
  const initAuth = async () => {
    try {
      // NE PAS créer automatiquement un nouvel utilisateur
      // Seulement si c'est explicitement demandé
      if (user) {
        // Pour les utilisateurs existants, vérifier s'ils ont déjà un quota configuré
        await ensureUserHasQuota(user.uid);
        return { success: true, user };
      }
      
      // Retourner un état "pas d'utilisateur" au lieu de créer automatiquement
      console.log("⚠️ Aucun utilisateur Firebase détecté, mais ne pas créer automatiquement");
      return { success: false, error: "Aucun utilisateur connecté", needsSignIn: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Fonction pour s'assurer qu'un utilisateur a un quota configuré
  const ensureUserHasQuota = async (userId: string) => {
    try {
      const docRef = doc(db, 'user_settings', userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists() || !docSnap.data()?.dailyQuota) {
        // L'utilisateur n'a pas encore de quota configuré, on lui attribue le quota de base
        await grantStarterQuota(userId);
      }
    } catch (error) {
      console.error('❌ Erreur vérification quota:', error);
    }
  };

  // Fonction explicite pour créer un utilisateur uniquement quand c'est voulu
  const createNewUser = async () => {
    try {
      console.log("🔧 Création explicite d'un nouvel utilisateur...");
      return await signInAnonymous();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // 🧪 FONCTION DE TEST : Donner l'accès illimité à un utilisateur
  const grantUnlimitedAccess = async (userId: string) => {
    try {
      const docRef = doc(db, 'user_settings', userId);
      await setDoc(docRef, {
        hasLifetime: true,
        unlimited: true,
        dailyQuota: 999999,
        remainingRolls: 999999,
        lastReset: Timestamp.now(),
        grantedAt: Timestamp.now(),
        source: 'test_unlimited',
      }, { merge: true });
      console.log('🧪 Accès illimité accordé pour test à:', userId);
    } catch (error) {
      console.error('❌ Erreur accès illimité:', error);
    }
  };

  return {
    user,
    loading,
    signInAnonymous,
    logout,
    initAuth,
    createNewUser,
    grantStarterQuota,
    grantUnlimitedAccess, // 🧪 FONCTION DE TEST
  };
}

// Hook pour gérer Firestore spécifique à Love Dice
export function useFirestore() {
  // Sauvegarder un lancer de dés et décrémenter le quota
  const saveDiceRoll = async (userId: string, rollData: any) => {
    try {
      // Sauvegarder le lancer
      const docRef = await addDoc(collection(db, 'dice_rolls'), {
        userId,
        ...rollData,
        createdAt: Timestamp.now(),
      });
      
      // Décrémenter le quota (sauf si l'utilisateur a l'accès illimité)
      await decrementQuota(userId);
      
      return { success: true, id: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Décrémenter le quota d'un utilisateur
  const decrementQuota = async (userId: string) => {
    try {
      const docRef = doc(db, 'user_settings', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Ne pas décrémenter si l'utilisateur a l'accès illimité
        if (data.hasLifetime && data.unlimited) {
          return { success: true, message: 'Utilisateur avec accès illimité' };
        }
        
        // Décrémenter le quota restant
        const newRemainingRolls = Math.max(0, (data.remainingRolls || 0) - 1);
        
        await setDoc(docRef, {
          remainingRolls: newRemainingRolls,
          lastUsed: Timestamp.now(),
        }, { merge: true });
        
        console.log(`✅ Quota décrémenté pour ${userId}: ${newRemainingRolls} restants`);
        return { success: true, remainingRolls: newRemainingRolls };
      }
      
      return { success: false, error: 'Utilisateur non trouvé' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Récupérer l'historique des lancers d'un utilisateur
  const getUserDiceHistory = async (userId: string, limit?: number) => {
    try {
      const colRef = collection(db, 'dice_rolls');
      let q = query(
        colRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      if (limit) {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const rolls = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, data: rolls };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Sauvegarder les paramètres utilisateur avec quota de base par défaut
  const saveUserSettings = async (userId: string, settings: any) => {
    try {
      const docRef = doc(db, 'user_settings', userId);
      
      // Si pas de quota défini dans les settings, appliquer le quota de base
      const quotaSettings = settings.hasLifetime ? {
        hasLifetime: settings.hasLifetime,
        unlimited: settings.unlimited,
      } : {
        hasLifetime: false,
        unlimited: false,
        dailyQuota: 2,
        remainingRolls: settings.remainingRolls ?? 2,
      };
      
      await setDoc(
        docRef,
        {
          ...settings,
          ...quotaSettings,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Récupérer les paramètres utilisateur
  const getUserSettings = async (userId: string) => {
    try {
      const docRef = doc(db, 'user_settings', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        // Retourner des paramètres par défaut avec quota de base
        return { 
          success: true, 
          data: { 
            customFaces: [], 
            playerNames: { player1: '', player2: '' },
            preferences: {},
            hasLifetime: false,
            unlimited: false,
            dailyQuota: 2,
            remainingRolls: 2
          } 
        };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Sauvegarder des faces personnalisées
  const saveCustomFaces = async (userId: string, faces: any[]) => {
    try {
      const docRef = doc(db, 'custom_faces', userId);
      await setDoc(docRef, {
        faces,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Récupérer les faces personnalisées
  const getCustomFaces = async (userId: string) => {
    try {
      const docRef = doc(db, 'custom_faces', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { success: true, data: docSnap.data().faces || [] };
      } else {
        return { success: true, data: [] };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    // Fonctions spécifiques à Love Dice
    saveDiceRoll,
    decrementQuota,
    getUserDiceHistory,
    saveUserSettings,
    getUserSettings,
    saveCustomFaces,
    getCustomFaces,
  };
}

// Fonction utilitaire pour vérifier si un utilisateur peut faire un lancer
export const canUserRoll = async (userId: string) => {
  try {
    const docRef = doc(db, 'user_settings', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { canRoll: false, reason: 'Utilisateur non trouvé' };
    }
    
    const data = docSnap.data();
    
    // Si l'utilisateur a l'accès illimité
    if (data.hasLifetime && data.unlimited) {
      return { canRoll: true, remainingRolls: -1, reason: 'Accès illimité' };
    }
    
    // Vérifier les quotas restants
    const remainingRolls = data.remainingRolls || 0;
    
    if (remainingRolls > 0) {
      return { canRoll: true, remainingRolls, reason: 'Quota disponible' };
    }
    
    return { canRoll: false, remainingRolls: 0, reason: 'Quota épuisé' };
    
  } catch (error: any) {
    return { canRoll: false, reason: error.message };
  }
};

// Fonction utilitaire pour attribuer l'accès à vie (pour les utilisateurs premium)
export const grantLifetimeAccess = async (userId: string) => {
  try {
    const docRef = doc(db, 'user_settings', userId);
    await setDoc(docRef, {
      hasLifetime: true,
      unlimited: true,
      grantedAt: Timestamp.now(),
      source: 'premium_purchase',
    }, { merge: true });
    
    console.log('✅ Accès à vie accordé à:', userId);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur attribution accès à vie:', error);
    return { success: false, error: error.message };
  }
};