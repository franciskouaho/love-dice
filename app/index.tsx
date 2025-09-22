import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SPLASH_CONFIG } from "../constants/SplashConfig";
import { hasCompletedOnboarding } from "../utils/onboarding";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // Animation refs
  const diceRotation = useRef(new Animated.Value(0)).current;
  const diceScale = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const backgroundShift = useRef(new Animated.Value(0)).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const heartAnimations = useRef(
    SPLASH_CONFIG.HEART_EMOJIS.map(() => new Animated.Value(0))
  ).current;

  const startAnimations = useCallback(() => {
    // Dice rotation animation
    Animated.loop(
      Animated.timing(diceRotation, {
        toValue: 1,
        duration: SPLASH_CONFIG.DICE_ROTATION_DURATION,
        useNativeDriver: true,
      })
    ).start();

    // Dice scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(diceScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(diceScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Title fade in
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: SPLASH_CONFIG.FADE_DURATION,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // Subtitle fade in
    Animated.timing(subtitleOpacity, {
      toValue: 1,
      duration: SPLASH_CONFIG.FADE_DURATION,
      delay: 800,
      useNativeDriver: true,
    }).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: SPLASH_CONFIG.GLOW_PULSE_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: SPLASH_CONFIG.GLOW_PULSE_DURATION,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Background shift animation
    Animated.loop(
      Animated.timing(backgroundShift, {
        toValue: 1,
        duration: SPLASH_CONFIG.BACKGROUND_SHIFT_DURATION,
        useNativeDriver: false,
      })
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: SPLASH_CONFIG.TITLE_SHIMMER_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: SPLASH_CONFIG.SHIMMER_DELAY,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Heart animations
    heartAnimations.forEach((heartAnim, index) => {
      const delay = SPLASH_CONFIG.HEART_DELAY_BASE + (index * SPLASH_CONFIG.HEART_DELAY_INTERVAL);
      const duration = SPLASH_CONFIG.HEART_FLOAT_DURATION_BASE + (Math.random() * SPLASH_CONFIG.HEART_FLOAT_DURATION_VARIANCE);
      
      const startHeartAnimation = () => {
        Animated.sequence([
          Animated.timing(heartAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(heartAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Random delay before restarting
          const randomDelay = Math.random() * SPLASH_CONFIG.HEART_RANDOM_DELAY_MAX;
          setTimeout(startHeartAnimation, randomDelay);
        });
      };

      setTimeout(startHeartAnimation, delay);
    });
  }, [diceRotation, diceScale, titleOpacity, subtitleOpacity, glowAnimation, backgroundShift, shimmerAnimation, heartAnimations]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Start animations immediately
        startAnimations();
        
        // Simulate loading time for a smooth experience
        const minDuration = SPLASH_CONFIG.MIN_SPLASH_DURATION;
        const steps = SPLASH_CONFIG.PROGRESS.STEPS;
        const stepDurations = SPLASH_CONFIG.PROGRESS.STEP_DURATIONS;
        
        let currentStep = 0;
        const totalDuration = stepDurations.reduce((sum, duration) => sum + duration, 0);
        
        // Progress animation
        const progressInterval = setInterval(() => {
          if (currentStep < steps.length) {
            setProgress(steps[currentStep]);
            currentStep++;
          }
        }, stepDurations[currentStep] || 200);
        
        // Ensure minimum duration
        await new Promise((resolve) => setTimeout(resolve, Math.max(minDuration, totalDuration)));
        clearInterval(progressInterval);

        // Check if user has completed onboarding
        const onboardingCompleted = await hasCompletedOnboarding();

        if (onboardingCompleted) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(onboarding)/welcome");
        }
      } catch (error) {
        // Error during app initialization - default to onboarding on error
        console.error("App initialization error:", error);
        // Attendre que le layout soit monté avant de naviguer
        setTimeout(() => {
          router.replace("/(onboarding)/welcome");
        }, 100);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [startAnimations]);

  // Animated values
  const diceRotationInterpolate = diceRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: SPLASH_CONFIG.GLOW.OPACITY_RANGE,
  });

  const glowScale = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: SPLASH_CONFIG.GLOW.SCALE_RANGE,
  });


  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      SPLASH_CONFIG.SHIMMER.LEFT_OFFSET_PERCENTAGE * width / 100,
      SPLASH_CONFIG.SHIMMER.WIDTH_PERCENTAGE * width / 100,
    ],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      {/* Animated gradient background */}
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={["#A50848", "#E0115F", "#FF4F7B"]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Background blur effect */}
      <BlurView intensity={15} style={styles.backgroundBlur} />

      {/* Floating hearts */}
      {SPLASH_CONFIG.HEART_EMOJIS.map((heart, index) => {
        const heartAnim = heartAnimations[index];
        const translateY = heartAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -SPLASH_CONFIG.HEART_FLOAT_DISTANCE_BASE * height - SPLASH_CONFIG.HEART_FLOAT_DISTANCE_VARIANCE],
        });
        
        const translateX = heartAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, (Math.random() - 0.5) * SPLASH_CONFIG.HEART_HORIZONTAL_SPREAD],
        });
        
        const opacity = heartAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, SPLASH_CONFIG.HEART_OPACITY_MAX - SPLASH_CONFIG.HEART_OPACITY_VARIANCE, 0],
        });
        
        const scale = heartAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [
            SPLASH_CONFIG.HEART_SCALE_BASE - SPLASH_CONFIG.HEART_SCALE_VARIANCE,
            SPLASH_CONFIG.HEART_SCALE_BASE + SPLASH_CONFIG.HEART_SCALE_VARIANCE,
            SPLASH_CONFIG.HEART_SCALE_BASE - SPLASH_CONFIG.HEART_SCALE_VARIANCE,
          ],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.floatingHeart,
              {
                left: `${10 + index * 15}%`,
                top: `${20 + (index % 3) * 25}%`,
                transform: [
                  { translateY },
                  { translateX },
                  { scale },
                ],
                opacity,
              },
            ]}
          >
            <Text style={styles.heartEmoji}>{heart}</Text>
          </Animated.View>
        );
      })}

      {/* Content */}
      <View style={styles.content}>
        {/* Animated dice container */}
        <View style={styles.diceContainer}>
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.diceGlow,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />
          
          {/* Main dice */}
          <Animated.View
            style={[
              styles.dice,
              {
                transform: [
                  { rotate: diceRotationInterpolate },
                  { scale: diceScale },
                ],
              },
            ]}
          >
            <View style={styles.diceInner}>
              <View style={[styles.dot, styles.dotTopLeft]} />
              <View style={[styles.dot, styles.dotCenter]} />
              <View style={[styles.dot, styles.dotBottomRight]} />
            </View>
          </Animated.View>
        </View>

        {/* App title with shimmer effect */}
        <View style={styles.titleContainer}>
          <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
            Love Dice
          </Animated.Text>
          
          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
        </View>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Randomisez vos soirées
        </Animated.Text>

        {/* Loading section */}
        {isLoading && (
          <View style={styles.loadingSection}>
            <Text style={styles.loadingText}>
              {progress < 0.3 ? "Initialisation..." :
               progress < 0.6 ? "Chargement..." :
               progress < 0.8 ? "Préparation..." :
               progress < 1.0 ? "Finalisation..." : "Prêt !"}
            </Text>
            
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Floating particles */}
      <View style={styles.particlesContainer}>
        {[...Array(8)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: `${10 + index * 10}%`,
                top: `${20 + (index % 3) * 20}%`,
                opacity: 0.6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#A50848",
  },
  backgroundBlur: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  diceContainer: {
    marginBottom: 40,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  diceGlow: {
    position: "absolute",
    width: SPLASH_CONFIG.GLOW.SIZE_PERCENTAGE,
    height: SPLASH_CONFIG.GLOW.SIZE_PERCENTAGE,
    borderRadius: SPLASH_CONFIG.GLOW.SIZE_PERCENTAGE / 2,
    backgroundColor: SPLASH_CONFIG.COLORS.GLOW,
    opacity: 0.3,
  },
  dice: {
    width: SPLASH_CONFIG.DICE.CONTAINER_SIZE,
    height: SPLASH_CONFIG.DICE.CONTAINER_SIZE,
    backgroundColor: SPLASH_CONFIG.COLORS.DICE_CONTAINER_BG,
    borderRadius: SPLASH_CONFIG.DICE.CONTAINER_BORDER_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: SPLASH_CONFIG.COLORS.DICE_CONTAINER_BORDER,
    shadowColor: SPLASH_CONFIG.CARD.SHADOW.COLOR,
    shadowOffset: SPLASH_CONFIG.CARD.SHADOW.OFFSET,
    shadowOpacity: SPLASH_CONFIG.CARD.SHADOW.OPACITY,
    shadowRadius: SPLASH_CONFIG.CARD.SHADOW.RADIUS,
    elevation: SPLASH_CONFIG.CARD.SHADOW.ELEVATION,
  },
  diceInner: {
    width: SPLASH_CONFIG.DICE.SIZE,
    height: SPLASH_CONFIG.DICE.SIZE,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#333",
    position: "absolute",
  },
  dotTopLeft: {
    top: 12,
    left: 12,
  },
  dotCenter: {
    // Center is already positioned by the container
  },
  dotBottomRight: {
    bottom: 12,
    right: 12,
  },
  titleContainer: {
    position: "relative",
    overflow: "hidden",
    marginBottom: 8,
  },
  title: {
    fontSize: SPLASH_CONFIG.TYPOGRAPHY.BRAND_TITLE.FONT_SIZE,
    fontWeight: SPLASH_CONFIG.TYPOGRAPHY.BRAND_TITLE.FONT_WEIGHT,
    letterSpacing: SPLASH_CONFIG.TYPOGRAPHY.BRAND_TITLE.LETTER_SPACING,
    color: SPLASH_CONFIG.COLORS.TEXT_PRIMARY,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SPLASH_CONFIG.SHIMMER.WIDTH_PERCENTAGE * width / 100,
    backgroundColor: SPLASH_CONFIG.COLORS.SHIMMER_HIGHLIGHT,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: SPLASH_CONFIG.TYPOGRAPHY.BRAND_SUBTITLE.FONT_SIZE,
    fontWeight: SPLASH_CONFIG.TYPOGRAPHY.BRAND_SUBTITLE.FONT_WEIGHT,
    letterSpacing: SPLASH_CONFIG.TYPOGRAPHY.BRAND_SUBTITLE.LETTER_SPACING,
    color: SPLASH_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 40,
    opacity: SPLASH_CONFIG.TYPOGRAPHY.BRAND_SUBTITLE.OPACITY,
  },
  loadingSection: {
    alignItems: "center",
    minHeight: SPLASH_CONFIG.LAYOUT.LOADING_SECTION_MIN_HEIGHT,
    marginTop: SPLASH_CONFIG.LAYOUT.LOADING_SECTION_MARGIN_TOP,
  },
  loadingText: {
    fontSize: SPLASH_CONFIG.TYPOGRAPHY.LOADING_TEXT.FONT_SIZE,
    fontWeight: SPLASH_CONFIG.TYPOGRAPHY.LOADING_TEXT.FONT_WEIGHT,
    letterSpacing: SPLASH_CONFIG.TYPOGRAPHY.LOADING_TEXT.LETTER_SPACING,
    color: SPLASH_CONFIG.COLORS.LOADING,
    textAlign: "center",
    marginBottom: 12,
  },
  progressContainer: {
    width: SPLASH_CONFIG.PROGRESS.WIDTH,
    height: SPLASH_CONFIG.PROGRESS.HEIGHT,
    gap: SPLASH_CONFIG.LAYOUT.PROGRESS_CONTAINER_GAP,
    marginBottom: SPLASH_CONFIG.LAYOUT.PROGRESS_CONTAINER_MARGIN_BOTTOM,
  },
  progressTrack: {
    width: "100%",
    height: SPLASH_CONFIG.PROGRESS.HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: SPLASH_CONFIG.PROGRESS.BORDER_RADIUS,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: SPLASH_CONFIG.COLORS.LOADING,
    borderRadius: SPLASH_CONFIG.PROGRESS.BORDER_RADIUS,
  },
  floatingHeart: {
    position: "absolute",
    fontSize: 24,
    pointerEvents: "none",
  },
  heartEmoji: {
    fontSize: 24,
  },
  particlesContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  particle: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
  },
});
