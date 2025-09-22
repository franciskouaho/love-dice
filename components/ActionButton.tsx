import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface ActionButtonProps {
  onPress: () => void;
  icon: string;
  label: string;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  icon,
  label,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primaryButton;
      case "secondary":
        return styles.secondaryButton;
      case "outline":
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "primary":
        return styles.primaryText;
      case "secondary":
        return styles.secondaryText;
      case "outline":
        return styles.outlineText;
      default:
        return styles.primaryText;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "primary":
        return "#FFFFFF";
      case "secondary":
        return "#E0115F";
      case "outline":
        return "#E0115F";
      default:
        return "#FFFFFF";
    }
  };

  if (variant === "primary") {
    return (
      <TouchableOpacity
        style={[getButtonStyle(), style, disabled && styles.disabledButton]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? ["#999999", "#666666"] : ["#F4C869", "#E0115F"]}
          style={styles.gradientButton}
        >
          <Ionicons name={icon as any} size={20} color={getIconColor()} />
          <Text style={[getTextStyle(), textStyle]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <BlurView intensity={20} style={styles.blurButton}>
        <Ionicons name={icon as any} size={20} color={getIconColor()} />
        <Text style={[getTextStyle(), textStyle]}>{label}</Text>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  outlineButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  blurButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  primaryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E0115F",
  },
  outlineText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E0115F",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ActionButton;
