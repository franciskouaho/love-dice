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
    // Erreur crypto random, fallback Math.random
    return Math.random();
  }
};

// Fonction principale de lancer de dé complet (nouvelle version)
export const rollCompleteDice = (
  faces: DiceFace[],
  lastResult?: CompleteDiceResult,
  playerNames?: { player1: string; player2: string },
): CompleteDiceResult => {
  if (!faces || faces.length === 0) {
    throw new Error("Aucune face disponible pour le lancer");
  }

  // Séparer les faces par catégorie
  const payerFaces = faces.filter((f) => f.category === "payer");
  const repasFaces = faces.filter((f) => f.category === "repas");
  const activiteFaces = faces.filter((f) => f.category === "activite");

  if (
    payerFaces.length === 0 ||
    repasFaces.length === 0 ||
    activiteFaces.length === 0
  ) {
    throw new Error(
      "Il faut au moins une face par catégorie (payer, repas, activite)",
    );
  }

  // Lancer pour chaque catégorie
  const payer = rollFromCategory(payerFaces, lastResult?.payer);
  const repas = rollFromCategory(repasFaces, lastResult?.repas);
  const activite = rollFromCategory(activiteFaces, lastResult?.activite);

  // FORCER ABSOLUMENT la personnalisation des noms - PAS DE CONDITIONS
  // TOUJOURS forcer les noms, même si ils sont vides (utiliser des défauts)
  let name1 = "Mon cœur";
  let name2 = "Mon amour";

  if (playerNames && playerNames.player1 && playerNames.player1.trim()) {
    name1 = playerNames.player1.trim();
  }
  if (playerNames && playerNames.player2 && playerNames.player2.trim()) {
    name2 = playerNames.player2.trim();
  }

  // Personnaliser le label du payeur selon son type
  if (payer.label === "Tu paies" || payer.label === "Je paie" || payer.label.includes("paie")) {
    // Pour les faces génériques, utiliser les noms personnalisés
    payer.label = Math.random() < 0.5 ? `${name1} paie` : `${name2} paie`;
  } else {
    // Pour les faces spécialisées ("Celui qui...", "Le plus jeune", etc.), les garder telles quelles
    // Elles sont déjà intéressantes !
    console.log(`🎯 Face spécialisée conservée: "${payer.label}"`);
  }

  const now = new Date();
  return {
    id: `complete_roll_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
    payer,
    repas,
    activite,
    timestamp: now.getTime(),
    date: now.toISOString().split("T")[0],
  };
};

// Fonction pour personnaliser les labels de paiement
const personalizePayerLabel = (
  originalLabel: string,
  playerNames: { player1: string; player2: string },
): string => {
  const { player1, player2 } = playerNames;

  switch (originalLabel) {
    case "Tu paies":
    case "Je paie":
      // Toujours choisir aléatoirement entre les deux joueurs avec leurs vrais noms
      return Math.random() < 0.5 ? `${player1} paie` : `${player2} paie`;
    case "50/50":
      // Pour 50/50, on peut aussi personnaliser
      return "50/50";
    case "Pile ou Face":
      // Pour Pile ou Face, lancer une pièce virtuelle
      return Math.random() < 0.5 ? `${player1} paie` : `${player2} paie`;
    default:
      // Si c'est déjà un nom personnalisé ou autre, garder tel quel
      return originalLabel;
  }
};

// Fonction helper pour lancer dans une catégorie spécifique
const rollFromCategory = (faces: DiceFace[], lastFace?: DiceFace): DiceFace => {
  if (faces.length === 0) {
    throw new Error("Aucune face disponible pour cette catégorie");
  }

  // Anti-répétition : exclure la dernière face si il y a assez de choix
  const availableFaces =
    lastFace && faces.length > 2
      ? faces.filter((face) => face.id !== lastFace.id)
      : faces;

  const finalFaces = availableFaces.length > 0 ? availableFaces : faces;
  const randomIndex = Math.floor(getSecureRandom() * finalFaces.length);
  return finalFaces[randomIndex];
};

// Fonction principale de lancer de dé (legacy - pour compatibilité)
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
