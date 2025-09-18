import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text } from "react-native";
import { CompleteDiceResult } from "../utils/dice";

interface AnimatedDiceProps {
  result: CompleteDiceResult;
  isShaking?: boolean;
  isRolling?: boolean;
  onAnimationComplete?: () => void;
}

const { width } = Dimensions.get("window");

export const AnimatedDice: React.FC<AnimatedDiceProps> = ({
  result,
  isShaking = false,
  isRolling = false,
  onAnimationComplete,
}) => {
  // Animations pour chaque dé
  const dice1Rotation = useRef(new Animated.Value(0)).current;
  const dice2Rotation = useRef(new Animated.Value(0)).current;
  const dice3Rotation = useRef(new Animated.Value(0)).current;

  const dice1Scale = useRef(new Animated.Value(1)).current;
  const dice2Scale = useRef(new Animated.Value(1)).current;
  const dice3Scale = useRef(new Animated.Value(1)).current;

  const dice1TranslateY = useRef(new Animated.Value(0)).current;
  const dice2TranslateY = useRef(new Animated.Value(0)).current;
  const dice3TranslateY = useRef(new Animated.Value(0)).current;

  const dice1TranslateX = useRef(new Animated.Value(0)).current;
  const dice2TranslateX = useRef(new Animated.Value(0)).current;
  const dice3TranslateX = useRef(new Animated.Value(0)).current;

  const containerOpacity = useRef(new Animated.Value(1)).current;

  const diceData = [
    {
      emoji: result.payer.emoji,
      label: result.payer.label,
      color: "#E0115F",
      rotation: dice1Rotation,
      scale: dice1Scale,
      translateY: dice1TranslateY,
      translateX: dice1TranslateX,
      category: "Qui paie",
    },
    {
      emoji: result.repas.emoji,
      label: result.repas.label,
      color: "#FF4F7B",
      rotation: dice2Rotation,
      scale: dice2Scale,
      translateY: dice2TranslateY,
      translateX: dice2TranslateX,
      category: "Repas",
    },
    {
      emoji: result.activite.emoji,
      label: result.activite.label,
      color: "#A50848",
      rotation: dice3Rotation,
      scale: dice3Scale,
      translateY: dice3TranslateY,
      translateX: dice3TranslateX,
      category: "Activité",
    },
  ];

  // Animation de secousse réaliste avec mouvement dans tous les sens
  useEffect(() => {
    if (isShaking && !isRolling) {
      const shakeAnimation = () => {
        const shakeSequence = [
          // Secousse chaotique dans tous les sens
          Animated.parallel([
            // Dé 1 - Mouvement en X et Y chaotique
            Animated.sequence([
              Animated.timing(dice1TranslateX, {
                toValue: -12,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateY, {
                toValue: -8,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateX, {
                toValue: 15,
                duration: 45,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateY, {
                toValue: 10,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateX, {
                toValue: -7,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateY, {
                toValue: -5,
                duration: 30,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateX, {
                toValue: 8,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateY, {
                toValue: 7,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateX, {
                toValue: 0,
                duration: 60,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateY, {
                toValue: 0,
                duration: 60,
                useNativeDriver: true,
              }),
            ]),
            // Dé 2 - Mouvement différent et plus ample
            Animated.sequence([
              Animated.timing(dice2TranslateY, {
                toValue: 12,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateX, {
                toValue: -10,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateY, {
                toValue: -14,
                duration: 45,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateX, {
                toValue: 13,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateY, {
                toValue: 6,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateX, {
                toValue: -6,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateY, {
                toValue: -8,
                duration: 30,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateX, {
                toValue: 9,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateX, {
                toValue: 0,
                duration: 60,
                useNativeDriver: true,
              }),
              Animated.timing(dice2TranslateY, {
                toValue: 0,
                duration: 60,
                useNativeDriver: true,
              }),
            ]),
            // Dé 3 - Mouvement diagonal et circulaire
            Animated.sequence([
              Animated.timing(dice3TranslateX, {
                toValue: -9,
                duration: 30,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateY, {
                toValue: 11,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateX, {
                toValue: 11,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateY, {
                toValue: -9,
                duration: 45,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateX, {
                toValue: -13,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateY, {
                toValue: 7,
                duration: 35,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateX, {
                toValue: 7,
                duration: 30,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateY, {
                toValue: -12,
                duration: 40,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateX, {
                toValue: 0,
                duration: 60,
                useNativeDriver: true,
              }),
              Animated.timing(dice3TranslateY, {
                toValue: 0,
                duration: 60,
                useNativeDriver: true,
              }),
            ]),
            // Rotations chaotiques
            Animated.sequence([
              Animated.timing(dice1Rotation, {
                toValue: 25,
                duration: 80,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Rotation, {
                toValue: -30,
                duration: 70,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Rotation, {
                toValue: 15,
                duration: 60,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Rotation, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dice2Rotation, {
                toValue: -20,
                duration: 70,
                useNativeDriver: true,
              }),
              Animated.timing(dice2Rotation, {
                toValue: 35,
                duration: 80,
                useNativeDriver: true,
              }),
              Animated.timing(dice2Rotation, {
                toValue: -18,
                duration: 65,
                useNativeDriver: true,
              }),
              Animated.timing(dice2Rotation, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dice3Rotation, {
                toValue: 28,
                duration: 60,
                useNativeDriver: true,
              }),
              Animated.timing(dice3Rotation, {
                toValue: -25,
                duration: 75,
                useNativeDriver: true,
              }),
              Animated.timing(dice3Rotation, {
                toValue: 20,
                duration: 70,
                useNativeDriver: true,
              }),
              Animated.timing(dice3Rotation, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
              }),
            ]),
            // Scaling pour effet de chaos
            Animated.sequence([
              Animated.timing(dice1Scale, {
                toValue: 1.1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Scale, {
                toValue: 0.95,
                duration: 80,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Scale, {
                toValue: 1.05,
                duration: 70,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dice2Scale, {
                toValue: 0.9,
                duration: 90,
                useNativeDriver: true,
              }),
              Animated.timing(dice2Scale, {
                toValue: 1.15,
                duration: 75,
                useNativeDriver: true,
              }),
              Animated.timing(dice2Scale, {
                toValue: 0.98,
                duration: 80,
                useNativeDriver: true,
              }),
              Animated.timing(dice2Scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(dice3Scale, {
                toValue: 1.08,
                duration: 70,
                useNativeDriver: true,
              }),
              Animated.timing(dice3Scale, {
                toValue: 0.92,
                duration: 85,
                useNativeDriver: true,
              }),
              Animated.timing(dice3Scale, {
                toValue: 1.12,
                duration: 75,
                useNativeDriver: true,
              }),
              Animated.timing(dice3Scale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ];

        Animated.sequence(shakeSequence).start();
      };

      shakeAnimation();
    }
  }, [isShaking]);

  // Animation de lancement des dés
  useEffect(() => {
    if (isRolling) {
      // Reset all animations
      dice1Rotation.setValue(0);
      dice2Rotation.setValue(0);
      dice3Rotation.setValue(0);
      dice1Scale.setValue(1);
      dice2Scale.setValue(1);
      dice3Scale.setValue(1);
      dice1TranslateY.setValue(0);
      dice2TranslateY.setValue(0);
      dice3TranslateY.setValue(0);
      dice1TranslateX.setValue(0);
      dice2TranslateX.setValue(0);
      dice3TranslateX.setValue(0);

      // Animation de lancement complexe avec trajectoires chaotiques
      const rollAnimation = Animated.sequence([
        // Phase 1: Lancement explosif dans tous les sens avec grande dispersion
        Animated.parallel([
          // Dé 1 - Trajectoire énorme vers le coin supérieur gauche
          Animated.sequence([
            Animated.parallel([
              Animated.timing(dice1TranslateY, {
                toValue: -120,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateX, {
                toValue: -90,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Scale, {
                toValue: 1.6,
                duration: 280,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Rotation, {
                toValue: 360,
                duration: 280,
                useNativeDriver: true,
              }),
            ]),
            // Grand arc vers le centre-droite
            Animated.parallel([
              Animated.timing(dice1TranslateY, {
                toValue: -40,
                duration: 220,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateX, {
                toValue: 70,
                duration: 220,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Scale, {
                toValue: 1.2,
                duration: 220,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Rotation, {
                toValue: 720,
                duration: 220,
                useNativeDriver: true,
              }),
            ]),
            // Chute finale avec rebonds multiples
            Animated.parallel([
              Animated.timing(dice1TranslateY, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(dice1TranslateX, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Scale, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(dice1Rotation, {
                toValue: 1080,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
          ]),

          // Dé 2 - Trajectoire explosive vers le sommet de l'écran
          Animated.sequence([
            Animated.delay(120),
            Animated.sequence([
              Animated.parallel([
                Animated.timing(dice2TranslateY, {
                  toValue: -150,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2TranslateX, {
                  toValue: 40,
                  duration: 150,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Scale, {
                  toValue: 1.8,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Rotation, {
                  toValue: -270,
                  duration: 300,
                  useNativeDriver: true,
                }),
              ]),
              // Grand zigzag vers la gauche extrême
              Animated.parallel([
                Animated.timing(dice2TranslateY, {
                  toValue: -80,
                  duration: 180,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2TranslateX, {
                  toValue: -100,
                  duration: 180,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Scale, {
                  toValue: 1.3,
                  duration: 180,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Rotation, {
                  toValue: -540,
                  duration: 180,
                  useNativeDriver: true,
                }),
              ]),
              // Rebond vers la droite extrême
              Animated.parallel([
                Animated.timing(dice2TranslateY, {
                  toValue: -30,
                  duration: 160,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2TranslateX, {
                  toValue: 80,
                  duration: 160,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Scale, {
                  toValue: 1.15,
                  duration: 160,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Rotation, {
                  toValue: -810,
                  duration: 160,
                  useNativeDriver: true,
                }),
              ]),
              // Atterrissage final dramatique
              Animated.parallel([
                Animated.timing(dice2TranslateY, {
                  toValue: 0,
                  duration: 350,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2TranslateX, {
                  toValue: 0,
                  duration: 350,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Scale, {
                  toValue: 1,
                  duration: 350,
                  useNativeDriver: true,
                }),
                Animated.timing(dice2Rotation, {
                  toValue: -1080,
                  duration: 350,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]),

          // Dé 3 - Trajectoire folle vers le coin supérieur droit
          Animated.sequence([
            Animated.delay(200),
            Animated.sequence([
              Animated.parallel([
                Animated.timing(dice3TranslateY, {
                  toValue: -100,
                  duration: 250,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3TranslateX, {
                  toValue: 110,
                  duration: 250,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Scale, {
                  toValue: 1.7,
                  duration: 250,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Rotation, {
                  toValue: 450,
                  duration: 250,
                  useNativeDriver: true,
                }),
              ]),
              // Mouvement circulaire énorme vers la gauche
              Animated.parallel([
                Animated.timing(dice3TranslateY, {
                  toValue: -130,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3TranslateX, {
                  toValue: -80,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Scale, {
                  toValue: 2.0,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Rotation, {
                  toValue: 800,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]),
              // Plongée dramatique vers le bas-droite
              Animated.parallel([
                Animated.timing(dice3TranslateY, {
                  toValue: -40,
                  duration: 180,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3TranslateX, {
                  toValue: 60,
                  duration: 180,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Scale, {
                  toValue: 1.4,
                  duration: 180,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Rotation, {
                  toValue: 1100,
                  duration: 180,
                  useNativeDriver: true,
                }),
              ]),
              // Atterrissage final spectaculaire
              Animated.parallel([
                Animated.timing(dice3TranslateY, {
                  toValue: 0,
                  duration: 420,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3TranslateX, {
                  toValue: 0,
                  duration: 420,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Scale, {
                  toValue: 1,
                  duration: 420,
                  useNativeDriver: true,
                }),
                Animated.timing(dice3Rotation, {
                  toValue: 1440,
                  duration: 420,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]),
        ]),

        // Phase 2: Rebonds multiples et chaotiques
        Animated.parallel([
          // Rebonds du dé 1 - asymétriques
          Animated.sequence([
            Animated.timing(dice1Scale, {
              toValue: 1.15,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(dice1TranslateY, {
              toValue: -8,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(dice1Scale, {
              toValue: 0.95,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(dice1TranslateY, {
              toValue: 5,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(dice1Scale, {
              toValue: 1.08,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(dice1TranslateY, {
              toValue: -3,
              duration: 60,
              useNativeDriver: true,
            }),
            Animated.timing(dice1Scale, {
              toValue: 1,
              duration: 90,
              useNativeDriver: true,
            }),
            Animated.timing(dice1TranslateY, {
              toValue: 0,
              duration: 90,
              useNativeDriver: true,
            }),
          ]),
          // Rebonds du dé 2 - décalés
          Animated.sequence([
            Animated.delay(60),
            Animated.timing(dice2Scale, {
              toValue: 1.12,
              duration: 75,
              useNativeDriver: true,
            }),
            Animated.timing(dice2TranslateX, {
              toValue: -6,
              duration: 75,
              useNativeDriver: true,
            }),
            Animated.timing(dice2Scale, {
              toValue: 0.92,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(dice2TranslateX, {
              toValue: 4,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(dice2Scale, {
              toValue: 1.06,
              duration: 65,
              useNativeDriver: true,
            }),
            Animated.timing(dice2TranslateX, {
              toValue: -2,
              duration: 65,
              useNativeDriver: true,
            }),
            Animated.timing(dice2Scale, {
              toValue: 1,
              duration: 85,
              useNativeDriver: true,
            }),
            Animated.timing(dice2TranslateX, {
              toValue: 0,
              duration: 85,
              useNativeDriver: true,
            }),
          ]),
          // Rebonds du dé 3 - rotatifs
          Animated.sequence([
            Animated.delay(120),
            Animated.timing(dice3Scale, {
              toValue: 1.18,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(dice3Rotation, {
              toValue: 920,
              duration: 70,
              useNativeDriver: true,
            }),
            Animated.timing(dice3Scale, {
              toValue: 0.88,
              duration: 85,
              useNativeDriver: true,
            }),
            Animated.timing(dice3Rotation, {
              toValue: 940,
              duration: 85,
              useNativeDriver: true,
            }),
            Animated.timing(dice3Scale, {
              toValue: 1.05,
              duration: 75,
              useNativeDriver: true,
            }),
            Animated.timing(dice3Rotation, {
              toValue: 950,
              duration: 75,
              useNativeDriver: true,
            }),
            Animated.timing(dice3Scale, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(dice3Rotation, {
              toValue: 960,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);

      rollAnimation.start(() => {
        onAnimationComplete?.();
      });
    }
  }, [isRolling]);

  // Animation d'apparition au montage
  useEffect(() => {
    containerOpacity.setValue(0);
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [result]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Dé 1 - Zone gauche fixe */}
      <Animated.View
        style={[
          styles.diceContainer,
          styles.dice1Position,
          {
            transform: [
              { translateX: diceData[0].translateX },
              { translateY: diceData[0].translateY },
              {
                rotate: diceData[0].rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
              { scale: diceData[0].scale },
            ],
          },
        ]}
      >
        {/* Ombre simple du dé 1 */}
        <Animated.View
          style={[
            styles.shadow,
            {
              backgroundColor: "rgba(0, 0, 0, 0.15)",
              transform: [{ scale: diceData[0].scale }],
            },
          ]}
        />

        {/* Dé principal 1 - Style moderne et propre */}
        <Animated.View
          style={[styles.dice, { backgroundColor: diceData[0].color }]}
        >
          <Text style={styles.emoji}>{diceData[0].emoji}</Text>
          <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>
            {diceData[0].label}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Dé 2 - Zone droite fixe */}
      <Animated.View
        style={[
          styles.diceContainer,
          styles.dice2Position,
          {
            transform: [
              { translateX: diceData[1].translateX },
              { translateY: diceData[1].translateY },
              {
                rotate: diceData[1].rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
              { scale: diceData[1].scale },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.shadow,
            {
              backgroundColor: "rgba(0, 0, 0, 0.15)",
              transform: [{ scale: diceData[1].scale }],
            },
          ]}
        />

        <Animated.View
          style={[styles.dice, { backgroundColor: diceData[1].color }]}
        >
          <Text style={styles.emoji}>{diceData[1].emoji}</Text>
          <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>
            {diceData[1].label}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Dé 3 - Zone centre bas fixe */}
      <Animated.View
        style={[
          styles.diceContainer,
          styles.dice3Position,
          {
            transform: [
              { translateX: diceData[2].translateX },
              { translateY: diceData[2].translateY },
              {
                rotate: diceData[2].rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ["0deg", "360deg"],
                }),
              },
              { scale: diceData[2].scale },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.shadow,
            {
              backgroundColor: "rgba(0, 0, 0, 0.15)",
              transform: [{ scale: diceData[2].scale }],
            },
          ]}
        />

        <Animated.View
          style={[styles.dice, { backgroundColor: diceData[2].color }]}
        >
          <Text style={styles.emoji}>{diceData[2].emoji}</Text>
          <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>
            {diceData[2].label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  diceContainer: {
    position: "absolute",
    width: 100,
    height: 100,
  },
  dice1Position: {
    left: 90,
    top: 120,
  },
  dice2Position: {
    right: 100,
    top: 150,
  },
  dice3Position: {
    left: "50%",
    marginLeft: -200,
    top: 330,
  },
  shadow: {
    position: "absolute",
    bottom: -6,
    left: 6,
    width: 78,
    height: 8,
    borderRadius: 39,
    opacity: 0.2,
  },
  dice: {
    width: 90,
    height: 90,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  emoji: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: "white",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 6,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
