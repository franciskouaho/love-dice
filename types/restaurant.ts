export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine_type: string;
  rating: string;
  price_range: string;
  phone: string;
  website: string;
  hours: string;
  region: string;
  place_id: string;
  image_count: number;
  images: string[];
  scraped_at: string;
  latitude?: number;
  longitude?: number;
}

export interface RestaurantFilters {
  cuisine_type?: string;
  rating_min?: number;
  price_range?: string;
  region?: string;
  search_query?: string;
}

export interface RestaurantSearchResult {
  restaurants: Restaurant[];
  total: number;
  hasMore: boolean;
}
