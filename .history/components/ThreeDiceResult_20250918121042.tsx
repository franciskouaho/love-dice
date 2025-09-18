import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { CompleteDiceResult } from '../utils/dice';

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
  onAnimationComplete?: () => void;
}

const { width } = Dimensions.get('window');
const DICE_SIZE = Math.min(width * 0.22, 90);

// Configuration des points pour chaque face du dé
const DiceDotsConfig = {
  1: [{ x: 0.5, y: 0.5 }],
  2: [{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.7 }],
  3: [{ x: 0.3, y: 0.3 }, { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.7 }],
  4: [
    { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 },
    { x: 0.3, y: 0.7 }, { x: 0.7, y: 0.7 }
  ],
  5: [
    { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.3 },
    { x: 0.5, y: 0.5 },
    { x: 0.3, y: 0.7 }, { x: 0.7, y: 0.7 }
  ],
  6: [
    { x: 0.3, y: 0.25 }, { x: 0.7, y: 0.25 },
    { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 },
    { x: 0.3, y: 0.75 }, { x: 0.7, y: 0.75 }
  ]
};

// Fonction pour rendre les points du dé
const renderDiceDots = (faceNumber: number) => {
  const dots = DiceDotsConfig[faceNumber as keyof typeof DiceDotsConfig] || [];
  
  return dots.map((dot, index) => (
    <View
      key={index}
      style={[
        styles.diceDot,
        {
          left: (DICE_SIZE - DICE_SIZE * 0.12) * dot.x,
          top: (DICE_SIZE - DICE_SIZE * 0.12) * dot.y,
          width: DICE_SIZE * 0.12,
          height: DICE_SIZE * 0.12,
          borderRadius: (DICE_SIZE * 0.12) / 2,
        }
      ]}
    />
  ));
};

const AnimatedDice3D: React.FC<DiceProps> = ({ 
  emoji, 
  label, 
  color, 
  delay, 
  isAnimating,
  onAnimationComplete 
}) => {
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimating) {
      // Animation de lancer
      const rollAnimation = Animated.sequence([
        // Délai pour que les dés se lancent un par un
        Animated.delay(delay),
        
        // Apparition
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),

        // Lancer avec rotations multiples
        Animated.parallel([
          Animated.timing(rotateX, {
            toValue: 360 * 3 + Math.random() * 360, // 3 tours + rotation finale aléatoire
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(rotateY, {
            toValue: 360 * 2 + Math.random() * 360, // 2 tours + rotation finale aléatoire
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(rotateZ, {
            toValue: 360 + Math.random() * 180, // 1 tour + rotation finale aléatoire
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 600,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -20,
              duration: 600,
              useNativeDriver: false,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 600,
              useNativeDriver: false,
            }),
          ]),
        ]),
      ]);

      rollAnimation.start(({ finished }) => {
        if (finished && onAnimationComplete) {
          onAnimationComplete();
        }
      });
    } else {
      // État statique - afficher le résultat final
      opacity.setValue(1);
      rotateX.setValue(0);
      rotateY.setValue(0);
      rotateZ.setValue(0);
      scale.setValue(1);
      translateY.setValue(0);
    }
  }, [isAnimating, delay, emoji, label]);

  return (
    <View style={styles.diceContainer}>
      <Animated.View
        style={[
          styles.dice,
          {
            width: DICE_SIZE,
            height: DICE_SIZE,
            opacity,
            transform: [
              { scale },
              { translateY },
              { 
                rotateX: rotateX.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })
              },
              { 
                rotateY: rotateY.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })
              },
              { 
                rotateZ: rotateZ.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F8F8', '#F0F0F0']}
          style={[styles.diceFace, { borderRadius: DICE_SIZE * 0.12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Effet de brillance */}
          <LinearGradient
            colors={['rgba(255,255,255,0.8)', 'transparent']}
            style={[styles.diceHighlight, { borderRadius: DICE_SIZE * 0.12 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.6 }}
          />

          {/* Face de dé classique avec points */}
          <View style={styles.diceContent}>
            {renderDiceDots(Math.floor(Math.random() * 6) + 1)}
          </View>

          {/* Ombre interne */}
          <View style={[styles.diceShadow, { borderRadius: DICE_SIZE * 0.12 }]} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

export const ThreeDiceResult: React.FC<ThreeDiceResultProps> = ({ 
  result, 
  isAnimating, 
  onAnimationComplete 
}) => {
  const animationCompleteCount = useRef(0);

  const handleDiceAnimationComplete = () => {
    animationCompleteCount.current += 1;
    if (animationCompleteCount.current === 3 && onAnimationComplete) {
      onAnimationComplete();
    }
  };

  useEffect(() => {
    if (isAnimating) {
      animationCompleteCount.current = 0;
    }
  }, [isAnimating]);

  const diceData = [
    {
      emoji: result.payer.emoji,
      label: result.payer.label,
      color: '#E0115F', // Rouge glamour
      delay: 0,
    },
    {
      emoji: result.repas.emoji,
      label: result.repas.label,
      color: '#FF4F7B', // Rose chaud
      delay: 200,
    },
    {
      emoji: result.activite.emoji,
      label: result.activite.label,
      color: '#A50848', // Rouge profond
      delay: 400,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Titre */}
      <Text style={styles.resultTitle}>Votre soirée :</Text>
      
      {/* Dés 3D */}
      <View style={styles.diceRow}>
        {diceData.map((dice, index) => (
          <View key={`${result.id}-${index}`} style={styles.diceWithLabel}>
            <AnimatedDice3D
              emoji={dice.emoji}
              label={dice.label}
              color={dice.color}
              delay={dice.delay}
              isAnimating={isAnimating}
              onAnimationComplete={handleDiceAnimationComplete}
            />
            {/* Résultat en dessous du dé */}
            <View style={styles.resultLabel}>
              <Text style={styles.resultEmoji}>{dice.emoji}</Text>
              <Text style={styles.resultText}>{dice.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  resultTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  diceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '90%',
    maxWidth: 300,
  },
  diceWithLabel: {
    alignItems: 'center',
    flex: 1,
  },
  diceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  resultLabel: {
    alignItems: 'center',
    marginTop: 12,
    minHeight: 60,
  },
  resultEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
});
