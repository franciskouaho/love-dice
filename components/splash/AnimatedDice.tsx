import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedDiceProps {
  size?: number;
  isAnimating?: boolean;
}

export const AnimatedDice: React.FC<AnimatedDiceProps> = ({
  size = 60,
  isAnimating = true
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotScales = useRef(
    Array.from({ length: 6 }).map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    if (!isAnimating) return;

    // Main rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    );

    // Scale pulse animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Dot animations
    const dotAnimations = dotScales.map((dotScale, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dotScale, {
            toValue: 1.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1200 - index * 200),
        ])
      )
    );

    // Start all animations
    rotateAnimation.start();
    scaleAnimation.start();
    dotAnimations.forEach(anim => anim.start());

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
      dotAnimations.forEach(anim => anim.stop());
    };
  }, [isAnimating, rotateAnim, scaleAnim, dotScales]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

  const currentFace = 1; // Affiche la face "1" par défaut

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [
            { rotate: rotation },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {/* Dice base with gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#F0F0F0', '#E0E0E0']}
        style={[styles.diceBase, { borderRadius: size * 0.15 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Shadow effect */}
        <View style={[styles.diceShadow, { borderRadius: size * 0.15 }]} />

        {/* Dice dots */}
        {DiceDotsConfig[currentFace as keyof typeof DiceDotsConfig]?.map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                left: (size - size * 0.12) * dot.x,
                top: (size - size * 0.12) * dot.y,
                width: size * 0.12,
                height: size * 0.12,
                borderRadius: (size * 0.12) / 2,
                transform: [{ scale: dotScales[index] || 1 }]
              }
            ]}
          />
        ))}

        {/* Highlight effect */}
        <LinearGradient
          colors={['rgba(255,255,255,0.8)', 'transparent']}
          style={[styles.highlight, { borderRadius: size * 0.15 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 0.7 }}
        />
      </LinearGradient>

      {/* Floating sparkles */}
      <View style={styles.sparkleContainer}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                opacity: dotScales[index % dotScales.length].interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.3, 1],
                }),
                transform: [
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [`${index * 120}deg`, `${index * 120 + 360}deg`],
                    })
                  },
                  { translateX: size * 0.7 },
                  {
                    scale: dotScales[index % dotScales.length].interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [0.5, 1],
                    })
                  }
                ]
              }
            ]}
          >
            <View style={[styles.sparkleInner, {
              width: size * 0.08,
              height: size * 0.08,
              borderRadius: size * 0.04
            }]} />
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceBase: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  diceShadow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '60%',
    height: '60%',
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleInner: {
    backgroundColor: '#F4C869',
    shadowColor: '#F4C869',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
