import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompleteDiceResult } from '../utils/dice';

interface RealDice3DProps {
  result: CompleteDiceResult;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

const DICE_SIZE = 80;

// Animation pour un dé 3D ultra-réaliste
const RealisticDice: React.FC<{
  emoji: string;
  label: string;
  color: string;
  delay: number;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
  position: { left: number; top: number };
}> = ({ emoji, label, color, delay, isAnimating, onAnimationComplete, position }) => {
  // Animations multiples pour effet 3D réaliste
  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(isAnimating ? 0.3 : 1)).current;
  const translateY = useRef(new Animated.Value(isAnimating ? -50 : 0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(isAnimating ? 0 : 1)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimating) {
      // Lancer ultra-réaliste avec rebonds
      const rollSequence = Animated.sequence([
        // Délai échelonné
        Animated.delay(delay),
        
        // Apparition dramatique
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),

        // Lancer avec physique réaliste
        Animated.parallel([
          // Rotations chaotiques
          Animated.timing(rotateX, {
            toValue: 720 + Math.random() * 1080, // 2-5 tours
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(rotateY, {
            toValue: 540 + Math.random() * 720, // 1.5-3.5 tours
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(rotateZ, {
            toValue: 360 + Math.random() * 540, // 1-2.5 tours
            duration: 1800,
            useNativeDriver: true,
          }),

          // Trajectoire parabolique
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -30 - Math.random() * 20, // Vol vers le haut
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0, // Retombe
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),

          // Mouvement horizontal aléatoire
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: (Math.random() - 0.5) * 40, // Dérive latérale
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0, // Retour au centre
              duration: 900,
              useNativeDriver: true,
            }),
          ]),

          // Scaling dynamique
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.3, // Grossit en vol
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.9, // Compression à l'impact
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.1, // Rebond
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1, // Stabilisation
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
        ]),

        // Rebonds finaux
        Animated.sequence([
          Animated.timing(bounce, {
            toValue: -8,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(bounce, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(bounce, {
            toValue: -4,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bounce, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]);

      rollSequence.start(({ finished }) => {
        if (finished && onAnimationComplete) {
          onAnimationComplete();
        }
      });
    } else {
      // État statique
      opacity.setValue(1);
      scale.setValue(1);
      translateY.setValue(0);
      translateX.setValue(0);
      rotateX.setValue(0);
      rotateY.setValue(0);
      rotateZ.setValue(0);
      bounce.setValue(0);
    }
  }, [isAnimating]);

  return (
    <Animated.View
      style={[
        styles.diceContainer,
        {
          left: position.left,
          top: position.top,
          opacity,
          transform: [
            { translateX: Animated.add(translateX, Animated.multiply(bounce, 0.3)) },
            { translateY: Animated.add(translateY, bounce) },
            { scale },
            {
              rotateX: rotateX.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
            {
              rotateY: rotateY.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
            {
              rotateZ: rotateZ.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      {/* Ombre du dé */}
      <View style={[styles.shadow, { backgroundColor: `${color}40` }]} />
      
      {/* Dé 3D avec 3 faces visibles */}
      <View style={styles.dice3D}>
        {/* Face avant (principale) */}
        <LinearGradient
          colors={[color, `${color}DD`]}
          style={[styles.faceFront]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'transparent']}
            style={styles.highlight}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 0.7 }}
          />
          <View style={styles.faceContent}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>
              {label}
            </Text>
          </View>
        </LinearGradient>

        {/* Face droite (plus sombre) */}
        <LinearGradient
          colors={[`${color}AA`, `${color}77`]}
          style={[styles.faceRight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.sidePattern}>
            <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
            <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
            <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          </View>
        </LinearGradient>

        {/* Face du haut (encore plus sombre) */}
        <LinearGradient
          colors={[`${color}CC`, `${color}99`]}
          style={[styles.faceTop]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.sidePattern}>
            <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// Composant principal
export const RealDice3D: React.FC<RealDice3DProps> = ({ 
  result, 
  isAnimating, 
  onAnimationComplete 
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const animationCompleteCount = useRef(0);
  
  console.log('🎲 RealDice3D render:', { result, isAnimating, width });

  const handleDiceComplete = () => {
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

  // Positions décalées vers la gauche pour être vraiment centrées
  const screenCenter = width / 2; // 402/2 = 201
  
  const positions = [
    { left: screenCenter - 300, top: 10 },   // Dé 1 : plus à gauche (201-120=81)
    { left: screenCenter - 350, top: 220 },    // Dé 2 : légèrement à gauche (201-40=161)
    { left: screenCenter - 80, top: 220 },    // Dé 3 : centré en bas (201-80=121)
  ];

  const diceData = [
    { emoji: result.payer.emoji, label: result.payer.label, color: '#E0115F', delay: 0 },
    { emoji: result.repas.emoji, label: result.repas.label, color: '#FF4F7B', delay: 300 },
    { emoji: result.activite.emoji, label: result.activite.label, color: '#A50848', delay: 600 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,255,0,0.1)' }]}>
      <Text style={{ color: 'white', position: 'absolute', top: 10, left: 10, zIndex: 1000, fontSize: 12, fontWeight: 'bold' }}>
        🎲 Dés: {diceData.length} - W:{Math.round(width)}
      </Text>
      <Text style={{ color: 'yellow', position: 'absolute', top: 30, left: 10, zIndex: 1000, fontSize: 10 }}>
        Pos: [{Math.round(positions[0].left)},{Math.round(positions[0].top)}] [{Math.round(positions[1].left)},{Math.round(positions[1].top)}] [{Math.round(positions[2].left)},{Math.round(positions[2].top)}]
      </Text>
      {diceData.map((dice, index) => (
        <View
          key={`${result.id}-${index}`}
          style={{
            position: 'absolute',
            left: positions[index].left,
            top: positions[index].top,
            width: DICE_SIZE,
            height: DICE_SIZE,
            backgroundColor: dice.color,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'white',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Text style={{ fontSize: 20, textAlign: 'center' }}>{dice.emoji}</Text>
          <Text style={{ fontSize: 10, color: 'white', fontWeight: 'bold', textAlign: 'center' }} numberOfLines={2}>
            {dice.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  diceContainer: {
    position: 'absolute',
    width: DICE_SIZE,
    height: DICE_SIZE,
  },
  shadow: {
    position: 'absolute',
    bottom: -8,
    left: 4,
    width: DICE_SIZE - 8,
    height: 12,
    borderRadius: 6,
    opacity: 0.3,
  },
  dice3D: {
    width: DICE_SIZE,
    height: DICE_SIZE,
    position: 'relative',
  },
  faceFront: {
    position: 'absolute',
    width: DICE_SIZE,
    height: DICE_SIZE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  faceRight: {
    position: 'absolute',
    width: 12,
    height: DICE_SIZE - 4,
    right: -8,
    top: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  faceTop: {
    position: 'absolute',
    width: DICE_SIZE - 4,
    height: 12,
    top: -8,
    left: 2,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '60%',
    borderTopLeftRadius: 12,
  },
  faceContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  emoji: {
    fontSize: DICE_SIZE * 0.35,
    textAlign: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: DICE_SIZE * 0.13,
    lineHeight: DICE_SIZE * 0.15,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  edgeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 2,
  },
  innerShadow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    borderBottomRightRadius: 12,
  },
  sidePattern: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
