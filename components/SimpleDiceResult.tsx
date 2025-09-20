import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CompleteDiceResult } from '../utils/dice';
import { createRestaurantFilterUrl, extractCuisineFromDiceLabel } from "../utils/restaurantUtils";

interface SimpleDiceResultProps {
  result: CompleteDiceResult;
}

export const SimpleDiceResult: React.FC<SimpleDiceResultProps> = ({ result }) => {
  const handleShowRestaurants = () => {
    const cuisineType = extractCuisineFromDiceLabel(result.repas.label);
    
    if (cuisineType) {
      const url = createRestaurantFilterUrl({ cuisine_type: cuisineType });
      router.push(url as any);
    } else {
      // Si on ne peut pas extraire le type de cuisine, faire une recherche générale
      const url = createRestaurantFilterUrl({ search_query: result.repas.label });
      router.push(url as any);
    }
  };

  const diceData = [
    { 
      emoji: result.payer.emoji, 
      label: result.payer.label, 
      color: '#E0115F',
      category: 'Qui paie'
    },
    { 
      emoji: result.repas.emoji, 
      label: result.repas.label, 
      color: '#FF4F7B',
      category: 'Repas',
      showRestaurantsButton: true
    },
    { 
      emoji: result.activite.emoji, 
      label: result.activite.label, 
      color: '#A50848',
      category: 'Activité'
    },
  ];

  return (
    <View style={styles.container}>
      {diceData.map((dice, index) => (
        <View key={index} style={styles.diceContainer}>
          {/* Ombre du dé */}
          <View style={[styles.shadow, { backgroundColor: `${dice.color}40` }]} />
          
          {/* Dé principal */}
          <LinearGradient
            colors={[dice.color, `${dice.color}DD`]}
            style={styles.dice}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Reflet brillant */}
            <LinearGradient
              colors={['rgba(255,255,255,0.8)', 'transparent']}
              style={styles.highlight}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 0.7 }}
            />
            
            {/* Contenu du dé */}
            <Text style={styles.emoji}>{dice.emoji}</Text>
            <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>
              {dice.label}
            </Text>
          </LinearGradient>

          {/* Face droite pour effet 3D simple */}
          <View style={[styles.sideRight, { backgroundColor: `${dice.color}AA` }]} />
          
          {/* Face du haut pour effet 3D simple */}
          <View style={[styles.sideTop, { backgroundColor: `${dice.color}CC` }]} />
          
          {/* Bouton restaurants pour le dé repas */}
          {dice.showRestaurantsButton && (
            <TouchableOpacity 
              style={styles.restaurantButton} 
              onPress={handleShowRestaurants}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.restaurantButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="restaurant" size={16} color="#FFFFFF" />
                <Text style={styles.restaurantButtonText}>Voir restaurants</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  diceContainer: {
    position: 'relative',
    width: 90,
    height: 90,
  },
  shadow: {
    position: 'absolute',
    bottom: -8,
    left: 4,
    width: 82,
    height: 12,
    borderRadius: 6,
    opacity: 0.4,
  },
  dice: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '60%',
    borderTopLeftRadius: 12,
  },
  emoji: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sideRight: {
    position: 'absolute',
    width: 12,
    height: 86,
    right: -10,
    top: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sideTop: {
    position: 'absolute',
    width: 86,
    height: 12,
    top: -10,
    left: 2,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  restaurantButton: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    transform: [{ translateX: -50 }],
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  restaurantButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  restaurantButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
