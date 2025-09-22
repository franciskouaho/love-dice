import {
    collection,
    DocumentSnapshot,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
} from "firebase/firestore";
import { Restaurant, RestaurantFilters, RestaurantSearchResult } from "../types/restaurant";
import { db } from "./firebase";

const RESTAURANTS_COLLECTION = "restaurants";
const PAGE_SIZE = 20;

// Récupérer tous les restaurants avec pagination
export const getRestaurants = async (
  lastDoc?: DocumentSnapshot,
  filters?: RestaurantFilters
): Promise<RestaurantSearchResult> => {
  try {
    let q = query(
      collection(db, RESTAURANTS_COLLECTION),
      orderBy("name", "asc"),
      limit(PAGE_SIZE)
    );

    // Appliquer les filtres
    if (filters?.cuisine_type) {
      q = query(q, where("cuisine_type", "==", filters.cuisine_type));
    }
    if (filters?.rating_min) {
      q = query(q, where("rating", ">=", filters.rating_min.toString()));
    }
    if (filters?.price_range && filters.price_range !== "N/A") {
      q = query(q, where("price_range", "==", filters.price_range));
    }
    if (filters?.region) {
      q = query(q, where("region", "==", filters.region));
    }

    // Pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const restaurants: Restaurant[] = [];
    const seenIds = new Set<string>();
    let lastDocument: DocumentSnapshot | undefined;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const restaurantId = doc.id;
      
      // Éviter les doublons
      if (seenIds.has(restaurantId)) {
        return;
      }
      seenIds.add(restaurantId);
      
      restaurants.push({
        id: restaurantId,
        name: data.name || "",
        address: data.address || "",
        cuisine_type: data.cuisine_type || "",
        rating: data.rating || "0",
        price_range: data.price_range || "N/A",
        phone: data.phone || "",
        website: data.website || "",
        hours: data.hours || "",
        region: data.region || "",
        place_id: data.place_id || "",
        image_count: data.image_count || 0,
        images: data.images || [],
        scraped_at: data.scraped_at || "",
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
      });
      lastDocument = doc;
    });

    // Filtrer par recherche textuelle si nécessaire
    let filteredRestaurants = restaurants;
    if (filters?.search_query) {
      const searchQuery = filters.search_query.toLowerCase();
      filteredRestaurants = restaurants.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(searchQuery) ||
          restaurant.address.toLowerCase().includes(searchQuery) ||
          restaurant.cuisine_type.toLowerCase().includes(searchQuery)
      );
    }

    return {
      restaurants: filteredRestaurants,
      total: filteredRestaurants.length,
      hasMore: querySnapshot.size === PAGE_SIZE,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des restaurants:", error);
    return {
      restaurants: [],
      total: 0,
      hasMore: false,
    };
  }
};

// Récupérer les types de cuisine uniques
export const getCuisineTypes = async (): Promise<string[]> => {
  try {
    const q = query(
      collection(db, RESTAURANTS_COLLECTION),
      orderBy("cuisine_type", "asc")
    );
    const querySnapshot = await getDocs(q);
    
    const cuisineTypes = new Set<string>();
    querySnapshot.forEach((doc) => {
      const cuisineType = doc.data().cuisine_type;
      if (cuisineType) {
        cuisineTypes.add(cuisineType);
      }
    });

    return Array.from(cuisineTypes).sort();
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des types de cuisine:", error);
    return [];
  }
};

// Récupérer les régions uniques
export const getRegions = async (): Promise<string[]> => {
  try {
    const q = query(
      collection(db, RESTAURANTS_COLLECTION),
      orderBy("region", "asc")
    );
    const querySnapshot = await getDocs(q);
    
    const regions = new Set<string>();
    querySnapshot.forEach((doc) => {
      const region = doc.data().region;
      if (region) {
        regions.add(region);
      }
    });

    return Array.from(regions).sort();
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des régions:", error);
    return [];
  }
};

// Récupérer un restaurant par ID
export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
  try {
    const q = query(
      collection(db, RESTAURANTS_COLLECTION),
      where("place_id", "==", id)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        address: data.address || "",
        cuisine_type: data.cuisine_type || "",
        rating: data.rating || "0",
        price_range: data.price_range || "N/A",
        phone: data.phone || "",
        website: data.website || "",
        hours: data.hours || "",
        region: data.region || "",
        place_id: data.place_id || "",
        image_count: data.image_count || 0,
        images: data.images || [],
        scraped_at: data.scraped_at || "",
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du restaurant:", error);
    return null;
  }
};
