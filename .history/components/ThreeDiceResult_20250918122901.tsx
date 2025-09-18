import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
          colors={[color, `${color}CC`, `${color}88`]}
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

          {/* Contenu de la face avec emoji et texte */}
          <View style={styles.diceContent}>
            <Text style={[styles.diceEmoji, { fontSize: DICE_SIZE * 0.35 }]}>
              {emoji}
            </Text>
            <Text 
              style={[
                styles.diceLabel, 
                { 
                  fontSize: DICE_SIZE * 0.12,
                  lineHeight: DICE_SIZE * 0.14,
                }
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {label}
            </Text>
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
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  // Positions ancrées au centre (gauche/centre/droite) avec une petite variation aléatoire
  const randomPositions = useMemo(() => {
    const containerWidth = containerSize.width || width;
    const containerHeight = containerSize.height || Math.round(width * 0.8);

    const margin = 24;
    const minLeft = margin;
    const maxLeft = containerWidth - DICE_SIZE - margin;
    const minTop = margin;
    const maxTop = containerHeight - DICE_SIZE - margin;

    const centerY = (containerHeight - DICE_SIZE) / 2;
    const anchorsX = [
      containerWidth * 0.25 - DICE_SIZE / 2,
      containerWidth * 0.5 - DICE_SIZE / 2,
      containerWidth * 0.75 - DICE_SIZE / 2,
    ];

    const jitter = 16; // petite variation

    const makePosFromAnchor = (ax: number) => ({
      left: clamp(ax + (Math.random() - 0.5) * 2 * jitter, minLeft, maxLeft),
      top: clamp(centerY + (Math.random() - 0.5) * 2 * jitter, minTop, maxTop),
    });

    return anchorsX.map(makePosFromAnchor);
  }, [containerSize.width, containerSize.height]);

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
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        if (w !== containerSize.width || h !== containerSize.height) {
          setContainerSize({ width: w, height: h });
        }
      }}
    >
      {/* Dés flottants directement sur l'écran */}
      {diceData.map((dice, index) => (
        <View 
          key={`${result.id}-${index}`} 
          style={[
            styles.floatingDice,
            // Positions aléatoires sécurisées
            {
              top: randomPositions[index].top,
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
            onAnimationComplete={handleDiceAnimationComplete}
          />
        </View>
      ))}
    </View>
  );
};

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
  diceDot: {
    position: 'absolute',
    backgroundColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
