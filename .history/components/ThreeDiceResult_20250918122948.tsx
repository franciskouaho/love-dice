import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  size: number;
  onAnimationComplete?: () => void;
}

// -------- Utils
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

function getSafeRandomPosition(
  containerWidth: number,
  containerHeight: number,
  insets: { top: number; bottom: number; left: number; right: number },
  diceSize: number,
  extraTopPadding = 8,
  extraSidePadding = 8,
) {
  const minLeft = insets.left + extraSidePadding;
  const maxLeft = containerWidth - insets.right - diceSize - extraSidePadding;

  // on garde un buffer supplémentaire vers le haut pour l’anim translateY négative
  const jumpBuffer = 14; // cohérent avec l’animation ci-dessous
  const minTop = insets.top + extraTopPadding + jumpBuffer;
  const maxTop = containerHeight - insets.bottom - diceSize - extraTopPadding;

  const left =
    clamp(minLeft + Math.random() * Math.max(0, maxLeft - minLeft), minLeft, maxLeft) || minLeft;
  const top =
    clamp(minTop + Math.random() * Math.max(0, maxTop - minTop), minTop, maxTop) || minTop;

  return { top, left };
}

// -------- Dice
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

        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),

        Animated.parallel([
          Animated.timing(rotateX, {
            toValue: 360 * 3 + Math.random() * 360,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateY, {
            toValue: 360 * 2 + Math.random() * 360,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateZ, {
            toValue: 360 + Math.random() * 180,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.16,
              duration: 520,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 520,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -14, // -20 causait parfois un dépassement
              duration: 520,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: 520,
              useNativeDriver: true,
            }),
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
        <LinearGradient
          colors={[color, `${color}CC`, `${color}88`]}
          style={[styles.diceFace, { borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Effet de brillance */}
          <LinearGradient
            colors={['rgba(255,255,255,0.8)', 'transparent']}
            style={[styles.diceHighlight, { borderRadius }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.6 }}
          />

          {/* Contenu */}
          <View style={styles.diceContent}>
            <Text style={[styles.diceEmoji, { fontSize: size * 0.35 }]}>{emoji}</Text>
            <Text
              style={[
                styles.diceLabel,
                {
                  fontSize: size * 0.12,
                  lineHeight: size * 0.14,
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {label}
            </Text>
          </View>

          {/* Ombre interne */}
          <View style={[styles.diceShadow, { borderRadius }]} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// -------- Main
export const ThreeDiceResult: React.FC<ThreeDiceResultProps> = ({
  result,
  isAnimating,
  onAnimationComplete,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions(); // réagit aux rotations
  const diceSize = Math.min(width * 0.22, 90);

  const [containerSize, setContainerSize] = useState({ w: width, h: 0 });
  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setContainerSize({ w, h });
  };

  // positions sûres, régénérées quand la taille ou les insets changent
  const randomPositions = useMemo(() => {
    return [
      getSafeRandomPosition(containerSize.w, containerSize.h, insets, diceSize),
      getSafeRandomPosition(containerSize.w, containerSize.h, insets, diceSize),
      getSafeRandomPosition(containerSize.w, containerSize.h, insets, diceSize),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    containerSize.w,
    containerSize.h,
    insets.top,
    insets.bottom,
    insets.left,
    insets.right,
    diceSize,
  ]);

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
              top: randomPositions[index].top, // insets déjà pris en compte
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
        </View>
      ))}
    </View>
  );
};

// -------- Styles
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
});
