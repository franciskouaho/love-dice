import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompleteDiceResult } from '../utils/dice';
import { createRestaurantFilterUrl, extractCuisineFromDiceLabel } from "../utils/restaurantUtils";

interface ThreeDiceResultProps {
  result: CompleteDiceResult;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

interface DiceProps {
  emoji: string;
  label: string;
  color: string;
  delay: number;
  isAnimating: boolean;
  size: number;
  onAnimationComplete?: () => void;
}

// ---------------- Utils (bornes et non chevauchement)
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

type Insets = { top: number; bottom: number; left: number; right: number };
type Pos = { top: number; left: number };

function computeBounds(
  containerWidth: number,
  containerHeight: number,
  insets: Insets,
  diceSize: number,
  extraTopPadding = 8,
  extraSidePadding = 8,
) {
  const jumpBuffer = 14; // cohérent avec translateY négatif de l'anim
  const minLeft = insets.left + extraSidePadding;
  const maxLeft = containerWidth - insets.right - diceSize - extraSidePadding;

  const minTop = insets.top + extraTopPadding + jumpBuffer;
  const maxTop = containerHeight - insets.bottom - diceSize - extraTopPadding;

  return { minLeft, maxLeft, minTop, maxTop };
}

function randomSafePos(bounds: {minLeft: number; maxLeft: number; minTop: number; maxTop: number}) {
  const { minLeft, maxLeft, minTop, maxTop } = bounds;
  const left = clamp(minLeft + Math.random() * Math.max(0, maxLeft - minLeft), minLeft, maxLeft);
  const top  = clamp(minTop  + Math.random() * Math.max(0, maxTop  - minTop ), minTop , maxTop );
  return { top, left };
}

function overlaps(a: Pos, b: Pos, minGap: number, size: number) {
  // Boîtes axis-aligned avec marge minGap autour
  const half = size / 2 + minGap / 2;
  const ax = a.left + half;
  const ay = a.top  + half;
  const bx = b.left + half;
  const by = b.top  + half;
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return dx < (size + minGap) && dy < (size + minGap);
}

// Génère N positions non chevauchantes; fallback grille si trop serré
function generateNonOverlappingPositions(
  count: number,
  containerWidth: number,
  containerHeight: number,
  insets: Insets,
  diceSize: number,
): Pos[] {
  const bounds = computeBounds(containerWidth, containerHeight, insets, diceSize);
  const GAP = Math.max(8, diceSize * 0.14); // marge entre dés
  const MAX_TRIES_PER_DIE = 80;

  const positions: Pos[] = [];
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let t = 0; t < MAX_TRIES_PER_DIE; t++) {
      const p = randomSafePos(bounds);
      if (!positions.some(q => overlaps(p, q, GAP, diceSize))) {
        positions.push(p);
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Fallback: disposition en grille compacte à l’intérieur des bornes
      return gridFallback(count, containerWidth, containerHeight, insets, diceSize, GAP);
    }
  }
  return positions;
}

function gridFallback(
  count: number,
  containerWidth: number,
  containerHeight: number,
  insets: Insets,
  diceSize: number,
  gap: number,
): Pos[] {
  // 3 cases max sur une rangée; si l’espace ne suffit pas, on passe à 2/1
  const bounds = computeBounds(containerWidth, containerHeight, insets, diceSize);
  const usableW = Math.max(0, bounds.maxLeft - bounds.minLeft);
  const usableH = Math.max(0, bounds.maxTop  - bounds.minTop);

  const tryLayouts: {cols: number; rows: number}[] = [
    { cols: 3, rows: 1 },
    { cols: 2, rows: 2 },
    { cols: 1, rows: 3 },
  ];

  for (const layout of tryLayouts) {
    const { cols, rows } = layout;
    const needW = cols * diceSize + (cols - 1) * gap;
    const needH = rows * diceSize + (rows - 1) * gap;
    if (needW <= usableW + 1 && needH <= usableH + 1 && cols * rows >= count) {
      const positions: Pos[] = [];
      let i = 0;
      for (let r = 0; r < rows && i < count; r++) {
        for (let c = 0; c < cols && i < count; c++) {
          const left = bounds.minLeft + (usableW - needW) / 2 + c * (diceSize + gap);
          const top  = bounds.minTop  + (usableH - needH) / 2 + r * (diceSize + gap);
          positions.push({ top, left });
          i++;
        }
      }
      return positions;
    }
  }

  // Ultime repli: tout en ligne centrée (au pire ils se toucheront à peine)
  const cols = Math.min(count, Math.max(1, Math.floor(usableW / (diceSize + gap)) || 1));
  const needW = cols * diceSize + (cols - 1) * gap;
  const leftStart = bounds.minLeft + (usableW - needW) / 2;

  const positions: Pos[] = [];
  for (let i = 0; i < count; i++) {
    const c = Math.min(i, cols - 1);
    positions.push({
      top: bounds.minTop + usableH / 2 - diceSize / 2,
      left: leftStart + c * (diceSize + gap),
    });
  }
  return positions;
}

// ---------------- Dice
const AnimatedDice3D: React.FC<DiceProps> = ({
  emoji,
  label,
  color,
  delay,
  isAnimating,
  size,
  onAnimationComplete,
}) => {
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimating) {
      const rollAnimation = Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(rotateX, { toValue: 360 * 3 + Math.random() * 360, duration: 1100, useNativeDriver: true }),
          Animated.timing(rotateY, { toValue: 360 * 2 + Math.random() * 360, duration: 1100, useNativeDriver: true }),
          Animated.timing(rotateZ, { toValue: 360 + Math.random() * 180, duration: 1100, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.16, duration: 520, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 520, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, { toValue: -14, duration: 520, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 520, useNativeDriver: true }),
          ]),
        ]),
      ]);

      rollAnimation.start(({ finished }) => {
        if (finished && onAnimationComplete) onAnimationComplete();
      });
    } else {
      opacity.setValue(1);
      rotateX.setValue(0);
      rotateY.setValue(0);
      rotateZ.setValue(0);
      scale.setValue(1);
      translateY.setValue(0);
    }
  }, [isAnimating, delay, emoji, label, onAnimationComplete, opacity, rotateX, rotateY, rotateZ, scale, translateY]);

  const borderRadius = size * 0.12;

  return (
    <View style={styles.diceContainer}>
      <Animated.View
        style={[
          styles.dice,
          {
            width: size,
            height: size,
            opacity,
            transform: [
              { scale },
              { translateY },
              { rotateX: rotateX.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
              { rotateY: rotateY.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
              { rotateZ: rotateZ.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[color, `${color}CC`, `${color}88`]}
          style={[styles.diceFace, { borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.8)', 'transparent']}
            style={[styles.diceHighlight, { borderRadius }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.6 }}
          />
          <View style={styles.diceContent}>
            <Text style={[styles.diceEmoji, { fontSize: size * 0.35 }]}>{emoji}</Text>
            <Text
              style={[styles.diceLabel, { fontSize: size * 0.12, lineHeight: size * 0.14 }]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {label}
            </Text>
          </View>
          <View style={[styles.diceShadow, { borderRadius }]} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ---------------- Main
export const ThreeDiceResult: React.FC<ThreeDiceResultProps> = ({
  result,
  isAnimating,
  onAnimationComplete,
}) => {
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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions(); // réagit aux rotations
  const diceSize = Math.min(width * 0.22, 90);

  const [containerSize, setContainerSize] = useState({ w: width, h: 0 });
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setContainerSize({ w, h });
  };

  // Algorithme simple et efficace - positions prédéfinies avec variation
  const randomPositions = useMemo(() => {
    const containerWidth = containerSize.w;
    const containerHeight = containerSize.h || width * 0.8;
    
    const margin = 30;
    const safeWidth = containerWidth - 2 * margin - diceSize;
    const safeHeight = containerHeight - insets.top - 160 - diceSize; // 160 = 60 + 100
    
    // Positions prédéfinies garanties non superposées
    const basePositions = [
      { x: 0.2, y: 0.2 },   // Haut gauche
      { x: 0.7, y: 0.3 },   // Haut droite  
      { x: 0.4, y: 0.7 },   // Bas centre
    ];
    
    // Mélanger l'ordre des positions
    const shuffledPositions = [...basePositions].sort(() => Math.random() - 0.5);
    
    // Appliquer une variation aléatoire de ±15%
    const jitter = 0.15;
    
    return shuffledPositions.map(pos => {
      const jitterX = (Math.random() - 0.5) * 2 * jitter;
      const jitterY = (Math.random() - 0.5) * 2 * jitter;
      
      const finalX = Math.max(0, Math.min(1, pos.x + jitterX));
      const finalY = Math.max(0, Math.min(1, pos.y + jitterY));
      
      return {
        left: margin + finalX * safeWidth,
        top: insets.top + 60 + finalY * safeHeight
      };
    });
  }, [containerSize.w, containerSize.h, insets.top, diceSize, width]);

  const animationCompleteCount = useRef(0);
  const handleDiceAnimationComplete = () => {
    animationCompleteCount.current += 1;
    if (animationCompleteCount.current === 3 && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  useEffect(() => {
    if (isAnimating) animationCompleteCount.current = 0;
  }, [isAnimating]);

  const diceData = [
    { emoji: result.payer.emoji, label: result.payer.label, color: '#E0115F', delay: 0 },
    { emoji: result.repas.emoji, label: result.repas.label, color: '#FF4F7B', delay: 200 },
    { emoji: result.activite.emoji, label: result.activite.label, color: '#A50848', delay: 400 },
  ];

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      {diceData.map((dice, index) => (
        <View
          key={`${result.id}-${index}`}
          style={[
            styles.floatingDice,
            {
              top: randomPositions[index].top,  // insets déjà pris en compte
              left: randomPositions[index].left,
            },
          ]}
        >
          <AnimatedDice3D
            emoji={dice.emoji}
            label={dice.label}
            color={dice.color}
            delay={dice.delay}
            isAnimating={isAnimating}
            size={diceSize}
            onAnimationComplete={handleDiceAnimationComplete}
          />
          
          {/* Bouton restaurants pour le dé repas (index 1) */}
          {index === 1 && !isAnimating && (
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
                <Ionicons name="restaurant" size={14} color="#FFFFFF" />
                <Text style={styles.restaurantButtonText}>Voir restaurants</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

// ---------------- Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  floatingDice: {
    position: 'absolute',
  },
  diceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  dice: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  diceFace: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  diceHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '70%',
  },
  diceContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  diceEmoji: {
    textAlign: 'center',
    marginBottom: 2,
  },
  diceLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  diceShadow: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  restaurantButton: {
    position: 'absolute',
    bottom: -25,
    left: '50%',
    transform: [{ translateX: -50 }],
    borderRadius: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  restaurantButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
