import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

interface UseShakeOptions {
  threshold?: number; // Seuil de détection de secousse (force minimale)
  timeWindow?: number; // Fenêtre de temps pour éviter les détections multiples (ms)
  onShake?: () => void; // Callback appelé lors d'une secousse
}

export const useShake = ({
  threshold = 1.2,
  timeWindow = 600,
  onShake,
}: UseShakeOptions = {}) => {
  const [isShaking, setIsShaking] = useState(false);
  const lastShakeTime = useRef(0);
  const previousAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const accelerationHistory = useRef<
    Array<{ x: number; y: number; z: number; timestamp: number }>
  >([]);

  useEffect(() => {
    let subscription: any;

    const startListening = async () => {
      // Vérifier si l'accéléromètre est disponible
      const isAvailable = await Accelerometer.isAvailableAsync();
      console.log("📱 Accelerometer available:", isAvailable);

      if (!isAvailable) {
        console.warn("❌ Accelerometer is not available on this device");
        return;
      }

      // Configurer la fréquence de mise à jour (40 fois par seconde pour capturer tous les mouvements)
      Accelerometer.setUpdateInterval(25);
      console.log("✅ Accelerometer listener started");

      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const currentTime = Date.now();

        // Ajouter les données à l'historique (garder seulement les 10 dernières mesures)
        accelerationHistory.current.push({ x, y, z, timestamp: currentTime });
        if (accelerationHistory.current.length > 10) {
          accelerationHistory.current.shift();
        }

        // Calculer la variation d'accélération (delta) avec le point précédent
        const deltaX = Math.abs(x - previousAcceleration.current.x);
        const deltaY = Math.abs(y - previousAcceleration.current.y);
        const deltaZ = Math.abs(z - previousAcceleration.current.z);

        // Calculer la force instantanée
        const instantForce = Math.sqrt(
          deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ,
        );

        // Calculer la force cumulative sur les dernières mesures
        let cumulativeForce = 0;
        if (accelerationHistory.current.length > 1) {
          for (let i = 1; i < accelerationHistory.current.length; i++) {
            const prev = accelerationHistory.current[i - 1];
            const curr = accelerationHistory.current[i];
            const dx = Math.abs(curr.x - prev.x);
            const dy = Math.abs(curr.y - prev.y);
            const dz = Math.abs(curr.z - prev.z);
            cumulativeForce += Math.sqrt(dx * dx + dy * dy + dz * dz);
          }
          cumulativeForce =
            cumulativeForce / (accelerationHistory.current.length - 1);
        }

        // Détecter les mouvements multidirectionnels rapides
        let isMultiDirectional = false;
        if (accelerationHistory.current.length >= 5) {
          const recent = accelerationHistory.current.slice(-5);
          let xChanges = 0;
          let yChanges = 0;
          let zChanges = 0;

          for (let i = 1; i < recent.length; i++) {
            if (Math.abs(recent[i].x - recent[i - 1].x) > 0.3) xChanges++;
            if (Math.abs(recent[i].y - recent[i - 1].y) > 0.3) yChanges++;
            if (Math.abs(recent[i].z - recent[i - 1].z) > 0.3) zChanges++;
          }

          // Secousse multidirectionnelle si au moins 2 axes bougent beaucoup
          isMultiDirectional =
            (xChanges >= 2 && yChanges >= 2) ||
            (xChanges >= 2 && zChanges >= 2) ||
            (yChanges >= 2 && zChanges >= 2);
        }

        // Force finale combinée
        const finalForce =
          Math.max(instantForce, cumulativeForce * 0.7) +
          (isMultiDirectional ? 0.5 : 0);

        // Log périodique pour débugger (toutes les 3 secondes environ)
        if (currentTime % 3000 < 100) {
          console.log(
            "📊 Accelerometer data - Instant:",
            instantForce.toFixed(3),
            "Cumulative:",
            cumulativeForce.toFixed(3),
            "Final:",
            finalForce.toFixed(3),
            "MultiDir:",
            isMultiDirectional,
            "Threshold:",
            threshold,
          );
        }

        // Détecter une secousse si la force dépasse le seuil OU si mouvement multidirectionnel intense
        if (
          finalForce > threshold ||
          (isMultiDirectional && instantForce > threshold * 0.8)
        ) {
          const timeSinceLastShake = currentTime - lastShakeTime.current;
          console.log(
            "⚡ Shake detected:",
            "Instant:",
            instantForce.toFixed(3),
            "Cumulative:",
            cumulativeForce.toFixed(3),
            "Final:",
            finalForce.toFixed(3),
            "MultiDir:",
            isMultiDirectional,
            "vs threshold:",
            threshold,
            "Time since last:",
            timeSinceLastShake,
            "ms",
          );

          // Vérifier que suffisamment de temps s'est écoulé depuis la dernière secousse
          if (timeSinceLastShake > timeWindow) {
            console.log(
              "🔄 SHAKE DETECTED! Final Force:",
              finalForce.toFixed(2),
              "MultiDir:",
              isMultiDirectional,
            );
            setIsShaking(true);
            lastShakeTime.current = currentTime;

            // Nettoyer l'historique après détection pour éviter les faux positifs
            accelerationHistory.current = [];

            if (onShake) {
              console.log("📞 Calling onShake callback...");
              // Délai léger pour permettre à l'animation de se déclencher
              setTimeout(() => onShake(), 50);
            } else {
              console.log("❌ No onShake callback provided");
            }

            // Réinitialiser l'état après un court délai
            setTimeout(() => setIsShaking(false), 400);
          } else {
            console.log(
              "⏰ Shake ignored - too soon after last shake (",
              timeSinceLastShake,
              "ms < ",
              timeWindow,
              "ms)",
            );
          }
        }

        // Sauvegarder les valeurs pour la prochaine itération
        previousAcceleration.current = { x, y, z };
      });
    };

    startListening();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [threshold, timeWindow, onShake]);

  return { isShaking };
};
