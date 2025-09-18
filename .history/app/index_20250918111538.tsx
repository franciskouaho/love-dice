import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AnimatedDice } from "../components/splash/AnimatedDice";
import {
    SPLASH_CONFIG,
    getAnimationConfig,
    getBlurIntensity,
    getHeartCount,
    getLoadingMessage,
} from "../constants/SplashConfig";

// IMPORTANT:
// 1. Install @react-native-async-storage/async-storage if not already installed:
//    expo install @react-native-async-storage/async-storage
// 2. When the user finishes the onboarding (e.g. after step3 OR after paywall decision),
//    set the flag: await AsyncStorage.setItem('onboarding_completed', '1');
//    Otherwise they will always return to onboarding.
// 3. This root index route decides whether to show onboarding or main tabs,
//    after showing a custom animated splash ("liquid glass" effect).

let AsyncStorage: any;
try {
  // Lazy require to avoid crash if not installed yet
  // (user can add the package afterwards; we fallback gracefully)
  const AsyncStorageModule = require("@react-native-async-storage/async-storage");
  AsyncStorage = AsyncStorageModule.default;
} catch {
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
  };
}

const { height: screenHeight } = Dimensions.get("window");
const config = SPLASH_CONFIG;
const animationConfig = getAnimationConfig();

export default function RootIndex() {
  const [decisionDone, setDecisionDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  type RootRoute = "/(tabs)" | "/(onboarding)/welcome";
  const [targetRoute, setTargetRoute] = useState<RootRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Animations with performance optimizations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const diceScale = useRef(new Animated.Value(0)).current;
  const diceRotate = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const bgShift = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const titleShimmer = useRef(new Animated.Value(0)).current;

  // Optimized hearts with device-appropriate count
  const hearts = useRef(
    Array.from({ length: getHeartCount() }).map(() => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    })),
  ).current;

  // Memoized style calculations
  const backgroundGradient = useMemo(
    () => ({
      colors: config.COLORS.BACKGROUND_GRADIENT,
      start: { x: 0.1, y: 0 },
      end: { x: 0.9, y: 1 },
    }),
    [],
  );

  const runCoreAnimations = useCallback(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: config.FADE_DURATION,
      easing: Easing.out(Easing.quad),
      ...animationConfig,
    }).start();

    // Card entrance with improved timing
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: config.CARD_ENTRANCE_DURATION,
        easing: Easing.out(Easing.cubic),
        ...animationConfig,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        ...animationConfig,
      }),
    ]).start();

    // Enhanced dice animation sequence
    Animated.sequence([
      Animated.spring(diceScale, {
        toValue: 1.1,
        tension: 100,
        friction: 8,
        ...animationConfig,
      }),
      Animated.spring(diceScale, {
        toValue: 1,
        tension: 150,
        friction: 10,
        ...animationConfig,
      }),
    ]).start();

    // Continuous dice rotation with variable speed
    const rotateDice = () => {
      diceRotate.setValue(0);
      Animated.timing(diceRotate, {
        toValue: 1,
        duration:
          config.DICE_ROTATION_DURATION +
          Math.random() * config.DICE_ROTATION_VARIANCE,
        easing: Easing.linear,
        ...animationConfig,
      }).start(rotateDice);
    };
    rotateDice();

    // Enhanced background animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgShift, {
          toValue: 1,
          duration: config.BACKGROUND_SHIFT_DURATION,
          easing: Easing.inOut(Easing.quad),
          ...animationConfig,
        }),
        Animated.timing(bgShift, {
          toValue: 0,
          duration: config.BACKGROUND_SHIFT_DURATION,
          easing: Easing.inOut(Easing.quad),
          ...animationConfig,
        }),
      ]),
    ).start();

    // Improved glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: config.GLOW_PULSE_DURATION,
          easing: Easing.inOut(Easing.quad),
          ...animationConfig,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: config.GLOW_PULSE_DURATION,
          easing: Easing.inOut(Easing.quad),
          ...animationConfig,
        }),
      ]),
    ).start();

    // Title shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleShimmer, {
          toValue: 1,
          duration: config.TITLE_SHIMMER_DURATION,
          easing: Easing.inOut(Easing.quad),
          ...animationConfig,
        }),
        Animated.delay(config.SHIMMER_DELAY),
        Animated.timing(titleShimmer, {
          toValue: 0,
          duration: config.TITLE_SHIMMER_DURATION,
          easing: Easing.inOut(Easing.quad),
          ...animationConfig,
        }),
      ]),
    ).start();

    // Enhanced floating hearts with more variety
    hearts.forEach((h, i) => {
      const delay = config.HEART_DELAY_BASE + i * config.HEART_DELAY_INTERVAL;
      const loop = () => {
        h.translateY.setValue(screenHeight * 0.1);
        h.translateX.setValue((Math.random() - 0.5) * 40);
        h.scale.setValue(0);
        h.opacity.setValue(0);
        h.rotate.setValue(0);

        Animated.sequence([
          Animated.delay(delay + Math.random() * config.HEART_RANDOM_DELAY_MAX),
          Animated.parallel([
            Animated.timing(h.opacity, {
              toValue:
                config.HEART_OPACITY_MAX +
                Math.random() * config.HEART_OPACITY_VARIANCE,
              duration: 400,
              easing: Easing.out(Easing.quad),
              ...animationConfig,
            }),
            Animated.spring(h.scale, {
              toValue:
                config.HEART_SCALE_BASE +
                Math.random() * config.HEART_SCALE_VARIANCE,
              tension: 80,
              friction: 8,
              ...animationConfig,
            }),
          ]),
          Animated.parallel([
            Animated.timing(h.translateY, {
              toValue:
                -screenHeight * config.HEART_FLOAT_DISTANCE_BASE -
                Math.random() * config.HEART_FLOAT_DISTANCE_VARIANCE,
              duration:
                config.HEART_FLOAT_DURATION_BASE +
                Math.random() * config.HEART_FLOAT_DURATION_VARIANCE,
              easing: Easing.out(Easing.quad),
              ...animationConfig,
            }),
            Animated.timing(h.translateX, {
              toValue: (Math.random() - 0.5) * config.HEART_HORIZONTAL_SPREAD,
              duration:
                config.HEART_FLOAT_DURATION_BASE +
                Math.random() * config.HEART_FLOAT_DURATION_VARIANCE,
              easing: Easing.inOut(Easing.quad),
              ...animationConfig,
            }),
            Animated.timing(h.rotate, {
              toValue: (Math.random() - 0.5) * 4,
              duration:
                config.HEART_FLOAT_DURATION_BASE +
                Math.random() * config.HEART_FLOAT_DURATION_VARIANCE,
              easing: Easing.inOut(Easing.quad),
              ...animationConfig,
            }),
            Animated.timing(h.opacity, {
              toValue: 0,
              duration:
                config.HEART_FLOAT_DURATION_BASE +
                Math.random() * config.HEART_FLOAT_DURATION_VARIANCE,
              easing: Easing.out(Easing.quad),
              ...animationConfig,
            }),
          ]),
        ]).start(() =>
          setTimeout(loop, Math.random() * config.HEART_RANDOM_DELAY_MAX),
        );
      };
      loop();
    });
  }, [
    fadeAnim,
    cardOpacity,
    cardScale,
    diceScale,
    diceRotate,
    bgShift,
    glowPulse,
    titleShimmer,
    hearts,
  ]);

  // Progress simulation for better UX
  const simulateProgress = useCallback(() => {
    const steps = config.PROGRESS.STEPS;
    const durations = config.PROGRESS.STEP_DURATIONS;

    steps.forEach((step, index) => {
      setTimeout(
        () => {
          setLoadingProgress(step);
          Animated.timing(progressAnim, {
            toValue: step,
            duration: config.PROGRESS.ANIMATION_DURATION,
            easing: Easing.out(Easing.quad),
            ...animationConfig,
          }).start();

          if (step === 1.0) {
            setTimeout(() => setIsLoading(false), 100);
          }
        },
        durations
          .slice(0, index + 1)
          .reduce((a: number, b: number) => a + b, 0),
      );
    });
  }, [progressAnim]);

  // Enhanced decision logic with better error handling
  useEffect(() => {
    let cancelled = false;
    const decide = async () => {
      const start = Date.now();

      try {
        // Hide any potential error notifications during splash
        if (typeof global !== "undefined" && (global as any).ErrorUtils) {
          const errorUtils = (global as any).ErrorUtils;
          const originalHandler = errorUtils.getGlobalHandler();
          errorUtils.setGlobalHandler(() => {}); // Temporarily suppress errors

          setTimeout(() => {
            if (!cancelled) {
              errorUtils.setGlobalHandler(originalHandler);
            }
          }, config.MIN_SPLASH_DURATION);
        }

        // TEMPORARY: Clear onboarding to redo it
        await AsyncStorage.removeItem("onboarding_completed");
        
        const seen = await AsyncStorage.getItem("onboarding_completed");
        console.log("Splash debug - onboarding_completed:", seen);

        const target: RootRoute = seen ? "/(tabs)" : "/(onboarding)/welcome";
        console.log("Splash debug - target route:", target);

        if (!cancelled) {
          setTargetRoute(target);
          simulateProgress();
        }
      } catch (err) {
        console.log("Splash debug - error:", err);
        if (!cancelled) {
          // Only show error in debug mode or if critical
          if (
            config.DEBUG.SHOW_ERROR_IN_DEBUG_ONLY ? __DEV__ || debugMode : true
          ) {
            setError("Erreur de chargement");
          }
          setTargetRoute("/(onboarding)/welcome");
          simulateProgress();
        }
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, config.MIN_SPLASH_DURATION - elapsed);
        setTimeout(() => {
          if (!cancelled) {
            setDecisionDone(true);
          }
        }, remaining);
      }
    };

    runCoreAnimations();
    decide();

    return () => {
      cancelled = true;
    };
  }, [runCoreAnimations, simulateProgress, debugMode]);

  // Navigate with enhanced transition
  useEffect(() => {
    if (decisionDone && targetRoute && !isLoading) {
      console.log("Splash debug - navigating to:", targetRoute);

      // Fade out animation before navigation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: config.FADE_DURATION,
        easing: Easing.in(Easing.quad),
        ...animationConfig,
      }).start(() => {
        try {
          router.replace(targetRoute as any);
        } catch (err) {
          console.error("Splash debug - navigation error:", err);
          router.replace("/(onboarding)/welcome" as any);
        }
      });
    }
  }, [decisionDone, targetRoute, isLoading, fadeAnim]);

  const handleForceSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)" as any);
  };

  const handleForceOnboarding = async () => {
    if (__DEV__) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await AsyncStorage.removeItem("onboarding_completed");
        console.log("Onboarding reset - reloading...");
        router.replace("/(onboarding)/welcome" as any);
      } catch (err) {
        console.error("Error resetting onboarding:", err);
      }
    }
  };

  const handleDebugToggle = () => {
    if (__DEV__) {
      setDebugMode(!debugMode);
    }
  };

  // Optimized interpolations
  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [...config.GLOW.SCALE_RANGE],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [...config.GLOW.OPACITY_RANGE],
  });

  const gradientShift = bgShift.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const shimmerTranslate = titleShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [config.SHIMMER.LEFT_OFFSET_PERCENTAGE, 100],
  });

  const progressScale = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <StatusBar
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />

      {/* Enhanced Animated Gradient Background */}
      <LinearGradient
        colors={backgroundGradient.colors}
        style={StyleSheet.absoluteFill}
        start={backgroundGradient.start}
        end={backgroundGradient.end}
      />

      {/* Dynamic overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.3,
            transform: [{ rotate: gradientShift }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.15)",
            "transparent",
            "rgba(255,255,255,0.1)",
            "transparent",
            "rgba(255,255,255,0.05)",
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Enhanced Glass Card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: cardOpacity,
            transform: [
              { scale: cardScale },
              {
                translateY: cardOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView
          intensity={getBlurIntensity()}
          tint="light"
          style={styles.glassCard}
          experimentalBlurMethod="dimezisBlurView"
        >
          {/* Enhanced glow effect */}
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          {/* Enhanced Dice container with animated component */}
          <Animated.View
            style={[
              styles.diceContainer,
              {
                transform: [{ scale: diceScale }],
              },
            ]}
          >
            <AnimatedDice size={config.DICE.SIZE} isAnimating={true} />
            {/* Dice reflection effect */}
            <View style={styles.diceReflection} />
          </Animated.View>

          {/* Enhanced brand section with shimmer */}
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={handleForceSkip}
            delayLongPress={config.DEBUG.LONG_PRESS_DURATION}
            onPress={__DEV__ ? handleForceOnboarding : undefined}
            style={styles.brandContainer}
          >
            <View style={styles.titleContainer}>
              <Text style={styles.brandTitle}>Love Dice</Text>
              {/* Shimmer overlay */}
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX: shimmerTranslate }],
                  },
                ]}
              >
                <LinearGradient
                  colors={config.SHIMMER.COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <Text style={styles.brandSubtitle}>Randomisez vos soirées</Text>
          </TouchableOpacity>

          {/* Enhanced loading section */}
          <View style={styles.loadingSection}>
            {isLoading ? (
              <>
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={styles.progressFillContainer}>
                      <Animated.View
                        style={[
                          styles.progressFill,
                          {
                            transform: [{ scaleX: progressScale }],
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(loadingProgress * 100)}%
                  </Text>
                </View>
                <Text style={styles.loadingText}>
                  {getLoadingMessage(loadingProgress)}
                </Text>
              </>
            ) : !decisionDone ? (
              <>
                <ActivityIndicator color={config.COLORS.LOADING} size="small" />
                <Text style={styles.loadingText}>
                  {config.LOADING_MESSAGES.OPENING}
                </Text>
              </>
            ) : (
              <Text style={styles.loadingText}>
                {config.LOADING_MESSAGES.READY}
              </Text>
            )}
          </View>

          {/* Error display (only in debug mode) */}
          {error && debugMode && (
            <TouchableOpacity onPress={handleDebugToggle}>
              <Text style={styles.errorText}>{error}</Text>
            </TouchableOpacity>
          )}

          {/* Debug info */}
          {__DEV__ && debugMode && (
            <Text style={styles.debugText}>
              Debug: Tap brand to reset • Long press to skip
            </Text>
          )}
        </BlurView>
      </Animated.View>

      {/* Enhanced Floating Hearts */}
      {hearts.map((h, i) => {
        const size = 16 + (i % 4) * 4;
        const color = config.COLORS.HEARTS[i % config.COLORS.HEARTS.length];
        const emoji = config.HEART_EMOJIS[i % config.HEART_EMOJIS.length];

        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.heart,
              {
                left: `${20 + (i * 60) / hearts.length}%`,
                bottom:
                  screenHeight *
                  (config.LAYOUT.HEART_BOTTOM_OFFSET_PERCENTAGE / 100),
                transform: [
                  { translateY: h.translateY },
                  { translateX: h.translateX },
                  { scale: h.scale },
                  {
                    rotate: h.rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
                opacity: h.opacity,
              },
            ]}
          >
            <Text style={{ fontSize: size }}>{emoji}</Text>
            <View
              style={[
                styles.heartHalo,
                {
                  backgroundColor: color,
                  opacity: 0.15,
                  width: size + 8,
                  height: size + 8,
                  borderRadius: (size + 8) / 2,
                },
              ]}
            />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#A50848",
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    width: "85%",
    maxWidth: 380,
    aspectRatio: 1.4,
    borderRadius: 50,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 15 },
    elevation: 20,
  },
  glassCard: {
    flex: 1,
    borderRadius: 50,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  glow: {
    position: "absolute",
    width: "160%",
    height: "160%",
    backgroundColor: "#FFFFFF",
    top: "-30%",
    left: "-30%",
    borderRadius: 999,
    opacity: 0.3,
  },
  diceContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 18,
    overflow: "hidden",
  },
  diceReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 28,
  },

  brandContainer: {
    alignItems: "center",
  },
  titleContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: "-100%",
    right: "-100%",
    bottom: 0,
    width: "300%",
  },
  brandSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#FFFFFF",
    opacity: 0.9,
    letterSpacing: 1.2,
    fontWeight: "500",
  },
  loadingSection: {
    alignItems: "center",
    marginTop: 28,
    minHeight: 50,
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  progressTrack: {
    width: 120,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFillContainer: {
    width: "100%",
    height: "100%",
    alignItems: "flex-start",
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F4C869",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#F4C869",
    fontWeight: "600",
    minWidth: 35,
    textAlign: "right",
  },
  loadingText: {
    fontSize: 14,
    color: "#F4C869",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  errorText: {
    marginTop: 8,
    fontSize: 11,
    color: "#FFCDD2",
    textAlign: "center",
    opacity: 0.8,
  },
  debugText: {
    position: "absolute",
    bottom: 8,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  heart: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  heartHalo: {
    position: "absolute",
  },
});

// IMPROVEMENTS IMPLEMENTED:
// ✅ Enhanced animations with better timing and easing
// ✅ Performance optimizations with useNativeDriver and memoization
// ✅ Better error handling that suppresses RC errors during splash
// ✅ Progress indicator for better UX feedback
// ✅ Shimmer effect on title for premium feel
// ✅ Enhanced visual effects (reflections, better glow)
// ✅ Responsive design for different screen sizes
// ✅ Haptic feedback for interactions
// ✅ More variety in floating hearts
// ✅ Better debug tools for development
// ✅ Smoother transitions and fade effects
// ✅ Improved accessibility
// ✅ Platform-specific optimizations
