"use client";

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { ActionButton } from "../components/ActionButton";
import { ImageSlider } from "../components/ImageSlider";
import { RestaurantMap } from "../components/RestaurantMap";
import { getRestaurantById } from "../services/restaurants";
import { Restaurant } from "../types/restaurant";

// const { width, height } = Dimensions.get("window");

export default function RestaurantDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurant = useCallback(async () => {
    if (!id) {
      setError("ID du restaurant manquant");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const restaurantData = await getRestaurantById(id);
      if (restaurantData) {
        setRestaurant(restaurantData);
      } else {
        setError("Restaurant non trouvé");
      }
    } catch (err) {
      setError("Erreur lors du chargement du restaurant");
      console.error("❌ Erreur chargement restaurant:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const handleBackPress = useCallback(async () => {
    await Haptics.selectionAsync();
    router.back();
  }, []);

  const handleCall = useCallback(async () => {
    if (!restaurant?.phone || restaurant.phone === "N/A" || restaurant.phone.trim() === "") {
      Alert.alert("Information manquante", "Numéro de téléphone non disponible");
      return;
    }
    
    await Haptics.selectionAsync();
    Linking.openURL(`tel:${restaurant.phone}`);
  }, [restaurant]);

  const handleWebsite = useCallback(async () => {
    if (!restaurant?.website || restaurant.website === "N/A" || restaurant.website.trim() === "") {
      Alert.alert("Information manquante", "Site web non disponible");
      return;
    }
    
    await Haptics.selectionAsync();
    Linking.openURL(restaurant.website);
  }, [restaurant]);

  const handleMaps = useCallback(async () => {
    if (!restaurant?.address) {
      Alert.alert("Information manquante", "Adresse non disponible");
      return;
    }
    
    await Haptics.selectionAsync();
    const address = encodeURIComponent(restaurant.address);
    const url = `https://maps.google.com/?q=${address}`;
    Linking.openURL(url);
  }, [restaurant]);

  const getRatingColor = (rating: string) => {
    const numRating = parseFloat(rating);
    if (numRating >= 4.5) return "#4CAF50";
    if (numRating >= 4.0) return "#8BC34A";
    if (numRating >= 3.5) return "#FFC107";
    if (numRating >= 3.0) return "#FF9800";
    return "#F44336";
  };

  const getPriceRangeText = (priceRange: string) => {
    if (priceRange === "N/A") return "Prix non disponible";
    return `Prix: ${priceRange}`;
  };

  const formatHours = (hours: string) => {
    if (!hours || hours === "N/A") return "Horaires non disponibles";
    return hours.replace(/\|/g, "\n");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient colors={["#A50848", "#E0115F", "#FF4F7B"]} style={styles.backgroundGradient} />
        <BlurView intensity={15} style={styles.backgroundBlur} />
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient colors={["#A50848", "#E0115F", "#FF4F7B"]} style={styles.backgroundGradient} />
        <BlurView intensity={15} style={styles.backgroundBlur} />
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleBackPress}>
            <BlurView intensity={20} style={styles.retryButtonBlur}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retour</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMaps}>
            <BlurView intensity={20} style={styles.actionButtonBlur}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Slider */}
        <View style={styles.imageContainer}>
          <ImageSlider
            images={restaurant.images || []}
            imageCount={restaurant.image_count || 0}
            restaurantName={restaurant.name}
            height={200}
          />
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleSection}>
            <View style={styles.nameAndCuisine}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.cuisineBadge}>
                <Text style={styles.cuisineBadgeText}>{restaurant.cuisine_type}</Text>
              </View>
            </View>
            <View style={styles.ratingCard}>
              <Ionicons name="star" size={18} color="#FFD700" />
              <Text style={[styles.rating, { color: getRatingColor(restaurant.rating) }]}>
                {restaurant.rating}
              </Text>
              <Text style={styles.ratingLabel}>/5</Text>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={16} color="#E0115F" />
              <Text style={styles.detailText}>{restaurant.address}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={16} color="#4CAF50" />
              <Text style={styles.detailText}>{getPriceRangeText(restaurant.price_range)}</Text>
            </View>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Localisation</Text>
          <RestaurantMap restaurant={restaurant} height={250} />
        </View>

        {/* Contact & Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact & Horaires</Text>
          
          {/* Contact Cards */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity 
              style={[styles.contactCard, !(restaurant.phone && restaurant.phone !== "N/A") && styles.disabledCard]} 
              onPress={restaurant.phone && restaurant.phone !== "N/A" ? handleCall : undefined}
              disabled={!(restaurant.phone && restaurant.phone !== "N/A")}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="call" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Téléphone</Text>
                <Text style={styles.cardValue}>
                  {restaurant.phone && restaurant.phone !== "N/A" ? restaurant.phone : "Non disponible"}
                </Text>
              </View>
              {restaurant.phone && restaurant.phone !== "N/A" && (
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactCard, !(restaurant.website && restaurant.website !== "N/A") && styles.disabledCard]} 
              onPress={restaurant.website && restaurant.website !== "N/A" ? handleWebsite : undefined}
              disabled={!(restaurant.website && restaurant.website !== "N/A")}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="globe" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Site web</Text>
                <Text style={styles.cardValue}>
                  {restaurant.website && restaurant.website !== "N/A" ? "Visiter le site" : "Non disponible"}
                </Text>
              </View>
              {restaurant.website && restaurant.website !== "N/A" && (
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.7)" />
              )}
            </TouchableOpacity>
          </View>

          {/* Hours Card */}
          <View style={styles.hoursCard}>
            <View style={styles.cardIcon}>
              <Ionicons name="time" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Horaires d&apos;ouverture</Text>
              <Text style={styles.hoursText}>{formatHours(restaurant.hours)}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <ActionButton
            onPress={handleMaps}
            icon="location"
            label="Voir sur la carte"
            variant="primary"
          />
          
          {restaurant.phone && restaurant.phone !== "N/A" && (
            <ActionButton
              onPress={handleCall}
              icon="call"
              label="Appeler"
              variant="secondary"
              style={styles.actionButtonSpacing}
            />
          )}
          
          {restaurant.website && restaurant.website !== "N/A" && (
            <ActionButton
              onPress={handleWebsite}
              icon="globe"
              label="Site web"
              variant="secondary"
              style={styles.actionButtonSpacing}
            />
          )}
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
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
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  actionButtonBlur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
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
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  nameAndCuisine: {
    flex: 1,
    marginRight: 16,
  },
  restaurantName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    lineHeight: 32,
  },
  cuisineBadge: {
    backgroundColor: "rgba(244, 200, 105, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  cuisineBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ratingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rating: {
    fontSize: 18,
    fontWeight: "bold",
  },
  ratingLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    flex: 1,
    lineHeight: 22,
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  hoursCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(224, 17, 95, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(224, 17, 95, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  contactAction: {
    padding: 8,
  },
  hoursContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 16,
  },
  hoursText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  actionButtonSpacing: {
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
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

