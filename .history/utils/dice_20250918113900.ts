import * as Crypto from "expo-crypto";

// Re-export DiceFace interface for backward compatibility
export interface DiceFace {
  id: string;
  label: string;
  category: "payer" | "repas" | "activite";
  emoji: string;
  weight: number;
  actions?: string[];
}

// Interface pour un résultat complet de soirée
export interface CompleteDiceResult {
  id: string;
  payer: DiceFace;
  repas: DiceFace;
  activite: DiceFace;
  timestamp: number;
  date: string;
}

// Interface pour l'historique des lancers (legacy)
export interface DiceRoll {
  id: string;
  face: DiceFace;
  timestamp: number;
  date: string;
}

// Générateur de nombres aléatoires sécurisé
const getSecureRandom = (): number => {
  try {
    // Utilise crypto.getRandomValues si disponible
    const array = new Uint32Array(1);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      return array[0] / (0xffffffff + 1);
    } else {
      // Fallback sur Expo Crypto
      const randomBytes = Crypto.getRandomBytes(4);
      const view = new DataView(randomBytes.buffer);
      return view.getUint32(0) / (0xffffffff + 1);
    }
  } catch (error) {
    console.warn("Erreur crypto random, fallback Math.random:", error);
    return Math.random();
  }
};

// Fonction principale de lancer de dé
export const rollDice = (
  faces: DiceFace[],
  lastRoll?: DiceFace,
  excludeLastRoll: boolean = true,
): DiceFace => {
  if (!faces || faces.length === 0) {
    throw new Error("Aucune face disponible pour le lancer");
  }

  const pool = createWeightedPoolLocal(faces);

  // Anti-répétition : exclure la dernière face si le pool est assez grand
  const availableFaces =
    excludeLastRoll && lastRoll && pool.length > 5
      ? pool.filter((face) => face.id !== lastRoll.id)
      : pool;

  if (availableFaces.length === 0) {
    // Sécurité : si pas de faces disponibles, utiliser le pool complet
    const randomIndex = Math.floor(getSecureRandom() * pool.length);
    return pool[randomIndex];
  }

  const randomIndex = Math.floor(getSecureRandom() * availableFaces.length);
  return availableFaces[randomIndex];
};

// Créer un objet DiceRoll complet
export const createDiceRoll = (face: DiceFace): DiceRoll => {
  const now = new Date();
  return {
    id: `roll_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
    face,
    timestamp: now.getTime(),
    date: now.toISOString().split("T")[0], // YYYY-MM-DD
  };
};

// Formatter la date pour l'affichage
export const formatRollDate = (roll: DiceRoll): string => {
  const date = new Date(roll.timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return `Aujourd'hui ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Hier ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

// Obtenir la clé du jour actuel pour les quotas
export const getCurrentDayKey = (): string => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

// Vérifier si c'est un nouveau jour
export const isNewDay = (lastDayKey: string): boolean => {
  return getCurrentDayKey() !== lastDayKey;
};

// Valider une face personnalisée
export const validateCustomFace = (
  face: Partial<DiceFace>,
): { valid: boolean; error?: string } => {
  if (!face.label || face.label.trim().length === 0) {
    return { valid: false, error: "Le libellé est requis" };
  }

  if (face.label.length > 50) {
    return {
      valid: false,
      error: "Le libellé est trop long (max 50 caractères)",
    };
  }

  if (
    !face.category ||
    !["payer", "repas", "activite"].includes(face.category)
  ) {
    return { valid: false, error: "Catégorie invalide" };
  }

  if (!face.emoji || face.emoji.trim().length === 0) {
    return { valid: false, error: "Un emoji est requis" };
  }

  if (face.weight !== undefined && (face.weight < 1 || face.weight > 10)) {
    return { valid: false, error: "Le poids doit être entre 1 et 10" };
  }

  return { valid: true };
};

// Créer une nouvelle face personnalisée
export const createCustomFace = (
  label: string,
  category: DiceFace["category"],
  emoji: string,
  weight: number = 1,
): DiceFace => {
  const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    label: label.trim(),
    category,
    emoji: emoji.trim(),
    weight: Math.max(1, Math.min(10, weight)), // Clamp entre 1 et 10
  };
};

// Statistiques sur les faces
export const getFaceStats = (faces: DiceFace[]) => {
  const stats = {
    total: faces.length,
    byCategory: {
      payer: faces.filter((f) => f.category === "payer").length,
      repas: faces.filter((f) => f.category === "repas").length,
      activite: faces.filter((f) => f.category === "activite").length,
    },
    totalWeight: faces.reduce((sum, face) => sum + face.weight, 0),
  };

  return stats;
};

// Mélanger un tableau (algorithme Fisher-Yates)
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(getSecureRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Obtenir des suggestions de faces basées sur la catégorie
export const getSuggestedFaces = (category: DiceFace["category"]): string[] => {
  const suggestions = {
    payer: [
      "Le plus jeune paie 👶",
      "Le perdant paie 😅",
      "Celui qui a mangé en dernier 🍽️",
      "Tirage au sort 🎯",
    ],
    repas: [
      "Cuisine du monde 🌍",
      "Végétarien ce soir 🥗",
      "Comfort food 🍕",
      "Nouvelle adresse 🆕",
    ],
    activite: [
      "Sortie culturelle 🎭",
      "Sport ensemble 🏃‍♂️",
      "Créativité 🎨",
      "Détente spa 🧘‍♀️",
      "Jeux vidéo 🎮",
      "Cours de danse 💃",
    ],
  };

  return suggestions[category] || [];
};

// Local weighted pool creation (Firebase version is in services/faces.ts)
const createWeightedPoolLocal = (faces: DiceFace[]): DiceFace[] => {
  const categoryWeights = {
    payer: 0.2, // 20%
    repas: 0.2, // 20%
    activite: 0.6, // 60%
  };

  const pool: DiceFace[] = [];

  Object.entries(categoryWeights).forEach(([category, weight]) => {
    const categoryFaces = faces.filter((face) => face.category === category);
    const count = Math.round(weight * 100); // Sur 100 pour plus de précision

    for (let i = 0; i < count; i++) {
      categoryFaces.forEach((face) => {
        for (let j = 0; j < face.weight; j++) {
          pool.push(face);
        }
      });
    }
  });

  return pool;
};
