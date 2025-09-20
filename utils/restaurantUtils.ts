/**
 * Utilitaires pour extraire des informations des résultats de dés vers les filtres restaurants
 */

/**
 * Extrait le type de cuisine depuis un label de dé
 * Ex: "Restaurant Italien" -> "Italien"
 * Ex: "Cuisine Japonaise" -> "Japonaise"
 * Ex: "Fast Food" -> "Fast Food"
 */
export const extractCuisineFromDiceLabel = (label: string): string | null => {
  if (!label) return null;
  
  // Nettoyer le label
  const cleanLabel = label.trim();
  
  // Patterns courants pour extraire le type de cuisine
  const patterns = [
    /^Restaurant\s+(.+)$/i,        // "Restaurant Italien" -> "Italien"
    /^Cuisine\s+(.+)$/i,          // "Cuisine Japonaise" -> "Japonaise"
    /^(.+)\s+Restaurant$/i,       // "Italien Restaurant" -> "Italien"
    /^(.+)\s+Cuisine$/i,          // "Japonaise Cuisine" -> "Japonaise"
  ];
  
  // Essayer chaque pattern
  for (const pattern of patterns) {
    const match = cleanLabel.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Si aucun pattern ne matche, essayer quelques cas spéciaux
  const specialCases: Record<string, string> = {
    'Fast Food': 'Fast Food',
    'Street Food': 'Street Food',
    'Food Truck': 'Food Truck',
    'Bistrot': 'Bistrot',
    'Brasserie': 'Brasserie',
    'Pizzeria': 'Pizzeria',
    'Sushi': 'Japonaise',
    'Burger': 'Fast Food',
    'Pizza': 'Pizzeria',
  };
  
  // Chercher une correspondance exacte
  if (specialCases[cleanLabel]) {
    return specialCases[cleanLabel];
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(specialCases)) {
    if (cleanLabel.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Si on ne trouve rien, retourner le label original (il pourrait être déjà un type de cuisine)
  return cleanLabel;
};

/**
 * Crée une URL pour naviguer vers la liste des restaurants avec des filtres
 */
export const createRestaurantFilterUrl = (options: {
  cuisine_type?: string;
  search_query?: string;
}): string => {
  const params = new URLSearchParams();
  
  if (options.cuisine_type) {
    params.append('cuisine_type', options.cuisine_type);
  }
  
  if (options.search_query) {
    params.append('search_query', options.search_query);
  }
  
  const queryString = params.toString();
  return `/restaurants${queryString ? `?${queryString}` : ''}`;
};
