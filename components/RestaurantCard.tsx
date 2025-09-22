import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Restaurant } from "../types/restaurant";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: (restaurant: Restaurant) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  onPress,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(restaurant);
    } else {
      // Navigation par défaut vers la page de détails
      router.push(`/restaurant-details?id=${restaurant.id}`);
    }
  };

  const handleCall = () => {
    if (restaurant.phone && restaurant.phone !== "N/A" && restaurant.phone.trim() !== "") {
      Linking.openURL(`tel:${restaurant.phone}`);
    }
  };

  const handleWebsite = () => {
    if (restaurant.website && restaurant.website !== "N/A" && restaurant.website.trim() !== "") {
      Linking.openURL(restaurant.website);
    }
  };

  const handleMaps = () => {
    const address = encodeURIComponent(restaurant.address);
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  };

  const getRatingColor = (rating: string) => {
    const numRating = parseFloat(rating);
    if (numRating >= 4.5) return "#4CAF50"; // Vert
    if (numRating >= 4.0) return "#8BC34A"; // Vert clair
    if (numRating >= 3.5) return "#FFC107"; // Jaune
    if (numRating >= 3.0) return "#FF9800"; // Orange
    return "#F44336"; // Rouge
  };

  const getPriceRangeText = (priceRange: string) => {
    if (priceRange === "N/A") return "Prix non disponible";
    return `Prix: ${priceRange}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.card}>
        {/* Image du restaurant */}
        <View style={styles.imageContainer}>
          {restaurant.images && restaurant.images.length > 0 ? (
            <>
              <Image
                source={{ uri: restaurant.images[0] }}
                style={styles.restaurantImage}
                resizeMode="cover"
              />
              {/* Overlay gradient pour améliorer la lisibilité */}
              <LinearGradient
                colors={["transparent", "rgba(0, 0, 0, 0.3)"]}
                style={styles.imageOverlay}
              />
            </>
          ) : (
            <LinearGradient
              colors={["#F4C869", "#E0115F"]}
              style={styles.imageGradient}
            >
              <View style={styles.imagePlaceholder}>
                <Ionicons name="restaurant" size={40} color="#FFFFFF" />
              </View>
            </LinearGradient>
          )}
          
          {/* Badge rating dans le coin */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingBadgeText}>{restaurant.rating}</Text>
          </View>
          
          {/* Badge nombre d'images si > 1 */}
          {restaurant.images && restaurant.images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Ionicons name="images" size={12} color="#FFFFFF" />
              <Text style={styles.imageCountText}>{restaurant.images.length}</Text>
            </View>
          )}
        </View>

        {/* Contenu de la carte */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={2}>
              {restaurant.name}
            </Text>
            <View style={styles.cuisineBadge}>
              <Text style={styles.cuisineBadgeText} numberOfLines={1}>
                {restaurant.cuisine_type}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.address} numberOfLines={2}>
              {restaurant.address}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceRange}>
              {getPriceRangeText(restaurant.price_range)}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {restaurant.phone && restaurant.phone !== "N/A" && restaurant.phone.trim() !== "" && (
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <BlurView intensity={20} style={styles.actionBlur}>
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            )}

            {restaurant.website && restaurant.website !== "N/A" && restaurant.website.trim() !== "" && (
              <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
                <BlurView intensity={20} style={styles.actionBlur}>
                  <Ionicons name="globe" size={16} color="#FFFFFF" />
                </BlurView>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={handleMaps}>
              <BlurView intensity={20} style={styles.actionBlur}>
                <Ionicons name="location" size={16} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    height: 140,
    position: "relative",
  },
  restaurantImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  imageCountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  imageCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    padding: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  cuisineBadge: {
    backgroundColor: "rgba(244, 200, 105, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 120,
  },
  cuisineBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 6,
  },
  address: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    flex: 1,
    lineHeight: 20,
  },
  priceRow: {
    marginBottom: 16,
  },
  priceRange: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
});

export default RestaurantCard;
