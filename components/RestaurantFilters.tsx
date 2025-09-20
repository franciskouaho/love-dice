import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { RestaurantFilters as Filters } from "../types/restaurant";

interface RestaurantFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  cuisineTypes: string[];
  regions: string[];
  loading?: boolean;
}

export const RestaurantFilters: React.FC<RestaurantFiltersProps> = ({
  filters,
  onFiltersChange,
  cuisineTypes,
  regions,
  loading = false,
}) => {
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search_query || "");

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    onFiltersChange({ ...filters, search_query: text });
  };

  const handleCuisineSelect = (cuisine: string) => {
    onFiltersChange({
      ...filters,
      cuisine_type: filters.cuisine_type === cuisine ? undefined : cuisine,
    });
    setShowCuisineModal(false);
  };

  const handleRegionSelect = (region: string) => {
    onFiltersChange({
      ...filters,
      region: filters.region === region ? undefined : region,
    });
    setShowRegionModal(false);
  };

  const handleRatingFilter = (rating: number) => {
    onFiltersChange({
      ...filters,
      rating_min: filters.rating_min === rating ? undefined : rating,
    });
  };

  const handlePriceFilter = (priceRange: string) => {
    onFiltersChange({
      ...filters,
      price_range: filters.price_range === priceRange ? undefined : priceRange,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSearchQuery("");
  };

  const hasActiveFilters = 
    filters.cuisine_type || 
    filters.rating_min || 
    filters.price_range || 
    filters.region || 
    filters.search_query;

  const FilterChip = ({ 
    label, 
    isActive, 
    onPress 
  }: { 
    label: string; 
    isActive: boolean; 
    onPress: () => void; 
  }) => (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.activeFilterChip]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const BottomDrawer = ({ 
    visible, 
    onClose, 
    title, 
    data, 
    onSelect, 
    selectedValue 
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    data: string[];
    onSelect: (item: string) => void;
    selectedValue?: string;
  }) => {
    const slideAnim = useRef(new Animated.Value(0)).current;
    const { height } = Dimensions.get('window');

    useEffect(() => {
      if (visible) {
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    }, [visible, slideAnim]);

    const translateY = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [height * 0.6, 0],
    });

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={onClose}>
          <Animated.View 
            style={[
              styles.drawerContainer,
              { transform: [{ translateY }] }
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              {/* Handle */}
              <View style={styles.drawerHandle} />
              
              {/* Header */}
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>{title}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color="#0E0E10" />
                </TouchableOpacity>
              </View>
              
              {/* Content */}
              <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
                {data.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.drawerItem,
                      selectedValue === item && styles.selectedDrawerItem
                    ]}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={[
                      styles.drawerItemText,
                      selectedValue === item && styles.selectedDrawerItemText
                    ]}>
                      {item}
                    </Text>
                    {selectedValue === item && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIconContainer}>
            <Ionicons name="search" size={18} color="#FFD700" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un restaurant..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearSearchButton} onPress={() => handleSearchChange("")}>
              <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {/* Type de cuisine */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.cuisine_type && styles.activeFilterButton
          ]}
          onPress={() => setShowCuisineModal(true)}
        >
          <View style={[
            styles.filterIconContainer,
            filters.cuisine_type && styles.activeFilterIconContainer
          ]}>
            <Ionicons 
              name="restaurant" 
              size={14} 
              color={filters.cuisine_type ? "#FFFFFF" : "#FFD700"} 
            />
          </View>
          <Text style={[
            styles.filterButtonText,
            filters.cuisine_type && styles.activeFilterButtonText
          ]}>
            {filters.cuisine_type || "Cuisine"}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={12} 
            color={filters.cuisine_type ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"} 
          />
        </TouchableOpacity>

        {/* Région */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.region && styles.activeFilterButton
          ]}
          onPress={() => setShowRegionModal(true)}
        >
          <View style={[
            styles.filterIconContainer,
            filters.region && styles.activeFilterIconContainer
          ]}>
            <Ionicons 
              name="location" 
              size={14} 
              color={filters.region ? "#FFFFFF" : "#FFD700"} 
            />
          </View>
          <Text style={[
            styles.filterButtonText,
            filters.region && styles.activeFilterButtonText
          ]}>
            {filters.region || "Région"}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={12} 
            color={filters.region ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)"} 
          />
        </TouchableOpacity>

        {/* Note minimum */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[4.5, 4.0, 3.5, 3.0].map((rating) => (
            <FilterChip
              key={rating}
              label={`${rating}+ ⭐`}
              isActive={filters.rating_min === rating}
              onPress={() => handleRatingFilter(rating)}
            />
          ))}
        </ScrollView>

        {/* Fourchette de prix */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["€", "€€", "€€€", "€€€€"].map((price) => (
            <FilterChip
              key={price}
              label={price}
              isActive={filters.price_range === price}
              onPress={() => handlePriceFilter(price)}
            />
          ))}
        </ScrollView>

        {/* Effacer les filtres */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
            <Text style={styles.clearButtonText}>Effacer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Drawers */}
      <BottomDrawer
        visible={showCuisineModal}
        onClose={() => setShowCuisineModal(false)}
        title="Type de cuisine"
        data={cuisineTypes}
        onSelect={handleCuisineSelect}
        selectedValue={filters.cuisine_type}
      />

      <BottomDrawer
        visible={showRegionModal}
        onClose={() => setShowRegionModal(false)}
        title="Région"
        data={regions}
        onSelect={handleRegionSelect}
        selectedValue={filters.region}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "400",
    minHeight: 20,
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activeFilterButton: {
    backgroundColor: "rgba(224, 17, 95, 0.9)",
    borderColor: "rgba(224, 17, 95, 1)",
  },
  filterIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilterIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  filterButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    flex: 1,
  },
  activeFilterButtonText: {
    color: "#FFFFFF",
  },
  filterChip: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterChip: {
    backgroundColor: "rgba(224, 17, 95, 0.9)",
    borderColor: "rgba(224, 17, 95, 1)",
    shadowOpacity: 0.2,
  },
  filterChipText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  activeFilterChipText: {
    color: "#FFFFFF",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.9)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  clearButtonText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0E0E10",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  drawerContent: {
    paddingHorizontal: 24,
    maxHeight: 300,
  },
  drawerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  selectedDrawerItem: {
    backgroundColor: "#E0115F",
    shadowColor: "#E0115F",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  drawerItemText: {
    fontSize: 16,
    color: "#0E0E10",
    fontWeight: "500",
  },
  selectedDrawerItemText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default RestaurantFilters;
