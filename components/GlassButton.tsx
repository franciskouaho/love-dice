import React, { ReactNode, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  GestureResponderEvent,
  ViewStyle,
  StyleProp,
  TextStyle,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

/**
 * GlassButton
 * Reusable glass‑morphism action button with optional gradient fill.
 *
 * Design goals:
 *  - Consistent with app brand (warm yellow -> pink gradient)
 *  - Subtle glass background (frosted) with border + inner highlight
 *  - Reusable sizing (sm / md / lg)
 *  - Accessible (hitSlop, loading state, disabled feedback)
 *  - Optional haptic feedback
 *
 * Props summary:
 *  - title / children: If children provided, it overrides title text.
 *  - onPress: callback
 *  - loading: show spinner & disable
 *  - disabled: disable interactions
 *  - size: 'sm' | 'md' | 'lg'
 *  - variant: 'glass' (default), 'gradient', 'outline'
 *  - fullWidth: stretch horizontally
 *  - leftIcon / rightIcon: ReactNode icons
 *  - haptics: 'light' | 'medium' | 'selection' | false
 *  - style / contentStyle / textStyle: style overrides
 *
 * Usage examples:
 *
 * <GlassButton title="Commencer" onPress={start} />
 *
 * <GlassButton
 *   variant="gradient"
 *   size="lg"
 *   leftIcon={<Text style={{fontSize:18}}>🎲</Text>}
 *   title="Lancer"
 *   onPress={roll}
/>
 *
 * <GlassButton variant="outline" title="Plus tard" onPress={skip} />
 */

export type GlassButtonSize = "sm" | "md" | "lg";
export type GlassButtonVariant = "glass" | "gradient" | "outline";
export type GlassButtonHaptics = "light" | "medium" | "selection" | false;

export interface GlassButtonProps {
  title?: string;
  children?: ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  size?: GlassButtonSize;
  variant?: GlassButtonVariant;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  haptics?: GlassButtonHaptics;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  /**
   * Override gradient colors (only for variant="gradient")
   */
  gradientColors?: string[];
  /**
   * Accessibility label; falls back to title text.
   */
  accessibilityLabel?: string;
}

const SIZE_PRESETS: Record<
  GlassButtonSize,
  { height: number; padX: number; fontSize: number; radius: number }
> = {
  sm: { height: 40, padX: 18, fontSize: 14, radius: 22 },
  md: { height: 52, padX: 26, fontSize: 16, radius: 28 },
  lg: { height: 60, padX: 32, fontSize: 18, radius: 38 },
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  children,
  onPress,
  loading = false,
  disabled = false,
  size = "md",
  variant = "glass",
  fullWidth = false,
  leftIcon,
  rightIcon,
  haptics = "selection",
  style,
  contentStyle,
  textStyle,
  testID,
  gradientColors = ["#F4C869", "#E0115F"],
  accessibilityLabel,
}) => {
  const preset = SIZE_PRESETS[size];

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (loading || disabled) return;
      if (haptics) {
        // Fire & forget
        try {
          switch (haptics) {
            case "light":
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              break;
            case "medium":
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
            case "selection":
              Haptics.selectionAsync();
              break;
          }
        } catch {
          // ignore
        }
      }
      onPress?.(e);
    },
    [loading, disabled, haptics, onPress],
  );

  const isInactive = disabled || loading;
  const accLabel = accessibilityLabel || title;

  const baseContainer: StyleProp<ViewStyle> = [
    {
      borderRadius: preset.radius,
      overflow: "hidden",
      opacity: isInactive ? 0.65 : 1,
    },
    fullWidth && { alignSelf: "stretch" },
    style,
  ];

  const innerPaddingStyle: StyleProp<ViewStyle> = {
    height: preset.height,
    paddingHorizontal: preset.padX,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  };

  const textBase: StyleProp<TextStyle> = [
    styles.labelText,
    {
      fontSize: preset.fontSize,
    },
    textStyle,
  ];

  const content = (
    <View style={[innerPaddingStyle, contentStyle]}>
      {leftIcon && <View style={styles.iconWrapper}>{leftIcon}</View>}
      {loading && (
        <ActivityIndicator
          color={variant === "gradient" ? "#FFFFFF" : "#F4C869"}
          style={{ marginRight: title ? 4 : 0 }}
        />
      )}
      {children ? (
        typeof children === "string" ? (
          <Text style={textBase}>{children}</Text>
        ) : (
          children
        )
      ) : title ? (
        <Text style={textBase}>{title}</Text>
      ) : null}
      {rightIcon && <View style={styles.iconWrapper}>{rightIcon}</View>}
    </View>
  );

  const glassLayer = (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor:
            variant === "outline"
              ? "rgba(255,255,255,0.15)"
              : "rgba(255,255,255,0.25)",
          borderRadius: preset.radius,
        },
      ]}
    />
  );

  const gradientLayer =
    variant === "gradient" ? (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: preset.radius,
          },
        ]}
      />
    ) : null;

  const outlineOverlay =
    variant === "outline" ? (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: preset.radius,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.45)",
          },
        ]}
      />
    ) : null;

  const glassBorderEnhance =
    variant === "glass" ? (
      <>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: preset.radius,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: preset.radius,
              backgroundColor: "rgba(255,255,255,0.08)",
            },
          ]}
        />
      </>
    ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accLabel}
      disabled={isInactive}
      onPress={handlePress}
      style={({ pressed }) => [
        baseContainer,
        pressed && !isInactive && styles.pressed,
      ]}
      testID={testID}
      hitSlop={8}
    >
      <View style={{ flex: 1, position: "relative" }}>
        {/* Gradient background */}
        {gradientLayer}
        {/* Glass effect */}
        {glassLayer}
        {/* Border enhancement */}
        {glassBorderEnhance}
        {outlineOverlay}
        {/* Content on top */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          {content}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  labelText: {
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    transform: [{ scale: Platform.select({ ios: 0.97, default: 0.965 }) }],
  },
});

export default GlassButton;
