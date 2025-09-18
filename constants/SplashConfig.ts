import { Platform } from "react-native";

export const SPLASH_CONFIG = {
  // Timing configurations
  MIN_SPLASH_DURATION: 1500, // ms - minimum time to show splash
  FADE_DURATION: 300, // ms - fade in/out duration
  CARD_ENTRANCE_DURATION: 800, // ms - card entrance animation

  // Animation durations
  DICE_ROTATION_DURATION: 3000, // ms - base dice rotation speed
  DICE_ROTATION_VARIANCE: 2000, // ms - random variance in rotation speed
  BACKGROUND_SHIFT_DURATION: 8000, // ms - background gradient shift
  GLOW_PULSE_DURATION: 1500, // ms - glow pulse cycle
  TITLE_SHIMMER_DURATION: 2000, // ms - title shimmer effect
  SHIMMER_DELAY: 1000, // ms - delay between shimmer cycles

  // Heart animations
  HEART_COUNT: 8, // number of floating hearts
  HEART_DELAY_BASE: 500, // ms - base delay before hearts start
  HEART_DELAY_INTERVAL: 200, // ms - interval between each heart
  HEART_FLOAT_DURATION_BASE: 3000, // ms - base float duration
  HEART_FLOAT_DURATION_VARIANCE: 2000, // ms - random variance in float duration
  HEART_RANDOM_DELAY_MAX: 1000, // ms - max random delay for heart restart
  HEART_OPACITY_MAX: 0.8, // maximum opacity for hearts
  HEART_OPACITY_VARIANCE: 0.2, // opacity variance
  HEART_SCALE_BASE: 0.8, // base scale for hearts
  HEART_SCALE_VARIANCE: 0.4, // scale variance
  HEART_FLOAT_DISTANCE_BASE: 0.15, // percentage of screen height
  HEART_FLOAT_DISTANCE_VARIANCE: 100, // px - additional random distance
  HEART_HORIZONTAL_SPREAD: 120, // px - horizontal movement range

  // Visual configurations
  COLORS: {
    BACKGROUND_GRADIENT: ["#A50848", "#E0115F", "#FF4F7B", "#FF6B9D"],
    HEARTS: ["#FFFFFF", "#F4C869", "#FFDCEB", "#FFE7F1", "#FFB6C1"],
    LOADING: "#F4C869",
    ERROR: "#FFCDD2",
    TEXT_PRIMARY: "#FFFFFF",
    TEXT_SECONDARY: "rgba(255,255,255,0.9)",
    GLOW: "#FFFFFF",
    CARD_BORDER: "rgba(255,255,255,0.4)",
    DICE_CONTAINER_BG: "rgba(255,255,255,0.3)",
    DICE_CONTAINER_BORDER: "rgba(255,255,255,0.5)",
  },

  // Heart emojis
  HEART_EMOJIS: ["💕", "💖", "💗", "🥰", "😍"],

  // Card styling
  CARD: {
    WIDTH_PERCENTAGE: 85, // percentage of screen width
    MAX_WIDTH: 380, // px - maximum card width
    ASPECT_RATIO: 1.4, // width/height ratio
    BORDER_RADIUS: 50, // px - card border radius
    BLUR_INTENSITY: {
      IOS: 80,
      ANDROID: 60,
    },
    SHADOW: {
      COLOR: "#000",
      OPACITY: 0.4,
      RADIUS: 25,
      OFFSET: { width: 0, height: 15 },
      ELEVATION: 20,
    },
  },

  // Dice styling
  DICE: {
    SIZE: 70, // px - dice component size
    CONTAINER_SIZE: 100, // px - dice container size
    CONTAINER_BORDER_RADIUS: 28, // px
    REFLECTION_HEIGHT_PERCENTAGE: 50, // percentage of container height
  },

  // Typography
  TYPOGRAPHY: {
    BRAND_TITLE: {
      FONT_SIZE: 36,
      FONT_WEIGHT: "800" as const,
      LETTER_SPACING: 1,
    },
    BRAND_SUBTITLE: {
      FONT_SIZE: 15,
      FONT_WEIGHT: "500" as const,
      LETTER_SPACING: 1.2,
      OPACITY: 0.9,
    },
    LOADING_TEXT: {
      FONT_SIZE: 14,
      FONT_WEIGHT: "600" as const,
      LETTER_SPACING: 0.5,
    },
    ERROR_TEXT: {
      FONT_SIZE: 11,
      OPACITY: 0.8,
    },
    DEBUG_TEXT: {
      FONT_SIZE: 10,
      OPACITY: 0.5,
    },
  },

  // Progress bar
  PROGRESS: {
    WIDTH: 120, // px - progress bar width
    HEIGHT: 3, // px - progress bar height
    BORDER_RADIUS: 2, // px
    TRACK_OPACITY: 0.3,
    ANIMATION_DURATION: 200, // ms
    STEPS: [0, 0.3, 0.6, 0.8, 1.0] as number[], // progress steps
    STEP_DURATIONS: [0, 300, 500, 400, 200] as number[], // ms - duration for each step
  },

  // Loading messages
  LOADING_MESSAGES: {
    INITIALIZING: "Initialisation...",
    LOADING: "Chargement...",
    PREPARING: "Préparation...",
    FINALIZING: "Finalisation...",
    OPENING: "Ouverture...",
    READY: "Prêt !",
  },

  // Performance optimizations
  PERFORMANCE: {
    USE_NATIVE_DRIVER: true,
    IS_INTERACTION: false,
    REDUCE_HEARTS_ON_LOW_END: true, // reduce hearts on slower devices
    LOW_END_HEART_COUNT: 4, // hearts count for low-end devices
  },

  // Debug configuration
  DEBUG: {
    LONG_PRESS_DURATION: 700, // ms - duration for debug long press
    ENABLE_CONSOLE_LOGS: __DEV__,
    SHOW_ERROR_IN_DEBUG_ONLY: true,
  },

  // Layout
  LAYOUT: {
    CARD_PADDING: 32, // px
    LOADING_SECTION_MIN_HEIGHT: 50, // px
    LOADING_SECTION_MARGIN_TOP: 28, // px
    PROGRESS_CONTAINER_GAP: 12, // px
    PROGRESS_CONTAINER_MARGIN_BOTTOM: 12, // px
    BRAND_CONTAINER_MARGIN_TOP: 18, // px
    BRAND_SUBTITLE_MARGIN_TOP: 6, // px
    ERROR_MARGIN_TOP: 8, // px
    HEART_BOTTOM_OFFSET_PERCENTAGE: 15, // percentage of screen height
  },

  // Glow effect
  GLOW: {
    SIZE_PERCENTAGE: 160, // percentage of container size
    POSITION_OFFSET_PERCENTAGE: 30, // offset from edges
    OPACITY_RANGE: [0.2, 0.6] as [number, number], // min and max opacity
    SCALE_RANGE: [0.8, 1.2] as [number, number], // min and max scale
  },

  // Shimmer effect
  SHIMMER: {
    WIDTH_PERCENTAGE: 300, // percentage of title width
    LEFT_OFFSET_PERCENTAGE: -100, // starting position offset
    COLORS: ["transparent", "rgba(255,255,255,0.4)", "transparent"],
  },
};

// Type definitions
export type SplashConfigType = typeof SPLASH_CONFIG;
export type LoadingMessage = keyof typeof SPLASH_CONFIG.LOADING_MESSAGES;

// Helper functions
export const getSplashConfig = () => SPLASH_CONFIG;

export const getHeartCount = () => {
  if (SPLASH_CONFIG.PERFORMANCE.REDUCE_HEARTS_ON_LOW_END) {
    // Simple device detection - could be enhanced
    const isLowEnd = Platform.OS === "android" && !__DEV__;
    return isLowEnd
      ? SPLASH_CONFIG.PERFORMANCE.LOW_END_HEART_COUNT
      : SPLASH_CONFIG.HEART_COUNT;
  }
  return SPLASH_CONFIG.HEART_COUNT;
};

export const getBlurIntensity = () => {
  return Platform.OS === "ios"
    ? SPLASH_CONFIG.CARD.BLUR_INTENSITY.IOS
    : SPLASH_CONFIG.CARD.BLUR_INTENSITY.ANDROID;
};

export const getLoadingMessage = (progress: number): string => {
  const { LOADING_MESSAGES } = SPLASH_CONFIG;

  if (progress < 0.3) return LOADING_MESSAGES.INITIALIZING;
  if (progress < 0.6) return LOADING_MESSAGES.LOADING;
  if (progress < 0.8) return LOADING_MESSAGES.PREPARING;
  if (progress < 1.0) return LOADING_MESSAGES.FINALIZING;
  return LOADING_MESSAGES.READY;
};

// Animation configuration helper
export const getAnimationConfig = () => ({
  useNativeDriver: SPLASH_CONFIG.PERFORMANCE.USE_NATIVE_DRIVER,
  isInteraction: SPLASH_CONFIG.PERFORMANCE.IS_INTERACTION,
});
