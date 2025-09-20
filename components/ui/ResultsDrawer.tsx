import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CompleteDiceResult } from "../../utils/dice";
import { createRestaurantFilterUrl, extractCuisineFromDiceLabel } from "../../utils/restaurantUtils";

const { height } = Dimensions.get("window")

interface ResultsDrawerProps {
  visible: boolean
  onClose: () => void
  result: CompleteDiceResult | null
}

export default function ResultsDrawer({ visible, onClose, result }: ResultsDrawerProps) {
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const buttonGlow = React.useRef(new Animated.Value(0)).current;
  const buttonPulse = React.useRef(new Animated.Value(1)).current;

  // Animation de pulsation continue
  React.useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [buttonPulse]);

  if (!visible || !result) return null

  const handleShowRestaurants = () => {
    // Animation de pressage
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 0.92,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlow, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Feedback haptique premium
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const cuisineType = extractCuisineFromDiceLabel(result.repas.label);
    
    if (cuisineType) {
      const url = createRestaurantFilterUrl({ cuisine_type: cuisineType });
      router.push(url as any);
    } else {
      // Si on ne peut pas extraire le type de cuisine, faire une recherche générale
      const url = createRestaurantFilterUrl({ search_query: result.repas.label });
      router.push(url as any);
    }
    
    // Fermer le drawer après navigation
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.drawer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Handle avec shadow */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        
        {/* Header amélioré */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#A50848', '#E0115F']}
            style={styles.titleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.title}>✨ Votre soirée ✨</Text>
          </LinearGradient>
          <Text style={styles.subtitle}>Voici ce qui vous attend</Text>
        </View>

        {/* Grid modernisée */}
        <View style={styles.resultsGrid}>
          {/* Carte Payer */}
          <View style={[styles.resultCard, styles.payerCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.resultEmoji}>{result.payer.emoji}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.resultCategory}>QUI PAIE</Text>
              </View>
            </View>
            <Text style={styles.resultLabel}>{result.payer.label}</Text>
          </View>

          {/* Carte Repas avec bouton amélioré */}
          <View style={[styles.resultCard, styles.repasCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.resultEmoji}>{result.repas.emoji}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.resultCategory}>REPAS</Text>
              </View>
            </View>
            <Text style={styles.resultLabel}>{result.repas.label}</Text>
            
            {/* Bouton restaurants ultra modernisé avec animations */}
            <Animated.View
              style={[
                styles.restaurantButtonContainer,
                {
                  transform: [
                    { scale: Animated.multiply(buttonScale, buttonPulse) },
                  ],
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.restaurantButton} 
                onPress={handleShowRestaurants}
                activeOpacity={1}
              >
                <BlurView intensity={25} style={styles.restaurantButtonBlur}>
                  <LinearGradient
                    colors={['#FFD700', '#FF8C00', '#FF4500']}
                    style={styles.restaurantButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Animated.View 
                      style={[
                        styles.restaurantButtonContent,
                        {
                          opacity: buttonGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0.8],
                          }),
                        },
                      ]}
                    >
                      <View style={styles.iconContainer}>
                        <Ionicons name="restaurant" size={16} color="#FFFFFF" />
                        <View style={styles.sparkle}>
                          <Text style={styles.sparkleText}>✨</Text>
                        </View>
                      </View>
                      <Text style={styles.restaurantButtonText}>Voir restaurants</Text>
                      <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                    </Animated.View>
                  </LinearGradient>
                </BlurView>
                
                {/* Effet de glow animé */}
                <Animated.View
                  style={[
                    styles.glowEffect,
                    {
                      opacity: buttonGlow,
                      transform: [
                        {
                          scale: buttonGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Carte Activité */}
          <View style={[styles.resultCard, styles.activiteCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.resultEmoji}>{result.activite.emoji}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.resultCategory}>ACTIVITÉ</Text>
              </View>
            </View>
            <Text style={styles.resultLabel}>{result.activite.label}</Text>
          </View>
        </View>

        {/* Bouton fermer amélioré */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <LinearGradient
            colors={['#A50848', '#E0115F']}
            style={styles.closeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
            <Text style={styles.closeButtonText}>Fermer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    maxHeight: height * 0.7,
    minHeight: 350,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 50,
    height: 5,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  titleGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: "#A50848",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  resultsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 32,
  },
  resultCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  payerCard: {
    backgroundColor: "rgba(224, 17, 95, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(224, 17, 95, 0.2)",
  },
  repasCard: {
    backgroundColor: "rgba(255, 140, 0, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(255, 140, 0, 0.2)",
  },
  activiteCard: {
    backgroundColor: "rgba(165, 8, 72, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(165, 8, 72, 0.2)",
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  resultEmoji: {
    fontSize: 32,
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoryBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultCategory: {
    fontSize: 10,
    color: "#333333",
    textAlign: "center",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultLabel: {
    fontSize: 13,
    color: "#333333",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  restaurantButtonContainer: {
    marginTop: 12,
    position: 'relative',
  },
  restaurantButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF8C00',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    position: 'relative',
  },
  restaurantButtonBlur: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  restaurantButtonGradient: {
    borderRadius: 18,
  },
  restaurantButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  sparkleText: {
    fontSize: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  restaurantButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.8,
    flex: 1,
    textAlign: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 140, 0, 0.3)',
    zIndex: -1,
  },
  closeButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#A50848',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
})
