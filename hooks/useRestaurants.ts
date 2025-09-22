import { DocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { getCuisineTypes, getRegions, getRestaurants } from "../services/restaurants";
import { Restaurant, RestaurantFilters } from "../types/restaurant";

export const useRestaurants = (filters?: RestaurantFilters) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>(undefined);

  const loadRestaurants = useCallback(async (reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getRestaurants(reset ? undefined : lastDoc, filters);
      
      if (reset) {
        setRestaurants(result.restaurants);
        setLastDoc(undefined);
      } else {
        setRestaurants(prev => [...prev, ...result.restaurants]);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      setError("Erreur lors du chargement des restaurants");
      console.error("❌ Erreur useRestaurants:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, lastDoc, loading]);

  const refresh = useCallback(() => {
    loadRestaurants(true);
  }, [loadRestaurants]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadRestaurants(false);
    }
  }, [loadRestaurants, loading, hasMore]);

  // Recharger quand les filtres changent
  useEffect(() => {
    refresh();
  }, [filters?.cuisine_type, filters?.rating_min, filters?.price_range, filters?.region, filters?.search_query]);

  return {
    restaurants,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
  };
};

export const useCuisineTypes = () => {
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCuisineTypes = async () => {
      setLoading(true);
      try {
        const types = await getCuisineTypes();
        setCuisineTypes(types);
      } catch (error) {
        console.error("❌ Erreur chargement types de cuisine:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCuisineTypes();
  }, []);

  return { cuisineTypes, loading };
};

export const useRegions = () => {
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRegions = async () => {
      setLoading(true);
      try {
        const regionsList = await getRegions();
        setRegions(regionsList);
      } catch (error) {
        console.error("❌ Erreur chargement régions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRegions();
  }, []);

  return { regions, loading };
};
