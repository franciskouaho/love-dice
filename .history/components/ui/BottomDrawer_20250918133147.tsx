import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  StatusBar,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedGestureHandler,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;

interface BottomDrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomDrawer({
  visible,
  onClose,
  children,
}: BottomDrawerProps) {
  const translateY = useSharedValue(DRAWER_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
        mass: 0.8,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(DRAWER_HEIGHT, { duration: 250 }, () => {
        runOnJS(onClose)();
      });
    }
  }, [visible, backdropOpacity, translateY, onClose]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackdropPress = () => {
    backdropOpacity.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(DRAWER_HEIGHT, { duration: 250 });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="none"
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <BlurView intensity={95} tint="light" style={styles.blurContainer}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#F8F9FA",
  },
  handle: {
    width: 48,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 34,
    backgroundColor: "#F8F9FA",
  },
});
