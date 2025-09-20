"use client";

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { RestaurantCard } from "../components/RestaurantCard";
import { RestaurantFilters } from "../components/RestaurantFilters";
import { useCuisineTypes, useRegions, useRestaurants } from "../hooks/useRestaurants";
import { RestaurantFilters as Filters, Restaurant } from "../types/restaurant";

export default function RestaurantsScreen() {
  const { cuisine_type, search_query } = useLocalSearchParams<{ 
    cuisine_type?: string; 
    search_query?: string; 
  }>();
  
  const [filters, setFilters] = useState<Filters>({});

  const { restaurants, loading, error, hasMore, refresh, loadMore } = useRestaurants(filters);
  const { cuisineTypes, loading: cuisineLoading } = useCuisineTypes();
  const { regions, loading: regionsLoading } = useRegions();

  // Appliquer les filtres depuis les paramètres d'URL
  useEffect(() => {
    const urlFilters: Filters = {};
    
    if (cuisine_type) {
      urlFilters.cuisine_type = cuisine_type;
    }
    
    if (search_query) {
      urlFilters.search_query = search_query;
    }
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, [cuisine_type, search_query]);

  const hasActiveFilters = 
    filters.cuisine_type || 
    filters.rating_min || 
    filters.price_range || 
    filters.region || 
    filters.search_query;

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleRestaurantPress = useCallback(async (restaurant: Restaurant) => {
    await Haptics.selectionAsync();
    router.push(`/restaurant-details?id=${restaurant.id}`);
  }, []);

  const handleBackPress = useCallback(async () => {
    await Haptics.selectionAsync();
    router.back();
  }, []);

  const renderRestaurant = useCallback(({ item, index }: { item: Restaurant; index: number }) => (
    <RestaurantCard
      restaurant={item}
      onPress={handleRestaurantPress}
    />
  ), [handleRestaurantPress]);

  const renderHeader = useCallback(() => (
    <RestaurantFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      cuisineTypes={cuisineTypes}
      regions={regions}
      loading={cuisineLoading || regionsLoading}
    />
  ), [filters, handleFiltersChange, cuisineTypes, regions, cuisineLoading, regionsLoading]);

  const renderFooter = useCallback(() => {
    if (!loading || restaurants.length === 0) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#FFFFFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }, [loading, restaurants.length]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="restaurant-outline" size={64} color="rgba(255, 255, 255, 0.5)" />
      <Text style={styles.emptyTitle}>Aucun restaurant trouvé</Text>
      <Text style={styles.emptySubtitle}>
        Essayez de modifier vos filtres ou votre recherche
      </Text>
    </View>
  ), []);

  const renderError = useCallback(() => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text style={styles.errorTitle}>Erreur de chargement</Text>
      <Text style={styles.errorSubtitle}>
        Impossible de charger les restaurants. Vérifiez votre connexion.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={refresh}>
        <BlurView intensity={20} style={styles.retryButtonBlur}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  ), [refresh]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient colors={["#A50848", "#E0115F", "#FF4F7B"]} style={styles.backgroundGradient} />
      
      {/* Background Blur Effect */}
      <BlurView intensity={15} style={styles.backgroundBlur} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <BlurView intensity={20} style={styles.backButtonBlur}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </BlurView>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name="restaurant" size={28} color="#FFD700" />
            <Text style={styles.headerTitle}>Restaurants</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{restaurants.length}</Text>
              <Text style={styles.statLabel}>restaurant{restaurants.length > 1 ? 's' : ''}</Text>
            </View>
            {hasActiveFilters && (
              <View style={styles.filterIndicator}>
                <Ionicons name="funnel" size={12} color="#FFD700" />
                <Text style={styles.filterIndicatorText}>Filtré</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          renderError()
        ) : (
          <FlatList
            data={restaurants}
            renderItem={renderRestaurant}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={!loading ? renderEmpty : null}
            refreshControl={
              <RefreshControl
                refreshing={loading && restaurants.length === 0}
                onRefresh={refresh}
                tintColor="#FFFFFF"
                colors={["#FFFFFF"]}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A50848",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundBlur: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  filterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  filterIndicatorText: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "600",
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  retryButtonBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
