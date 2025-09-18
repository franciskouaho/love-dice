import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

interface UseShakeOptions {
  threshold?: number; // Seuil de détection de secousse (force minimale)
  timeWindow?: number; // Fenêtre de temps pour éviter les détections multiples (ms)
  onShake?: () => void; // Callback appelé lors d'une secousse
}

export const useShake = ({ 
  threshold = 2.5, 
  timeWindow = 1000, 
  onShake 
}: UseShakeOptions = {}) => {
  const [isShaking, setIsShaking] = useState(false);
  const lastShakeTime = useRef(0);
  const previousAcceleration = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let subscription: any;

    const startListening = async () => {
      // Vérifier si l'accéléromètre est disponible
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        console.warn('Accelerometer is not available on this device');
        return;
      }

      // Configurer la fréquence de mise à jour (10 fois par seconde)
      Accelerometer.setUpdateInterval(100);

      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const currentTime = Date.now();
        
        // Calculer la variation d'accélération (delta)
        const deltaX = Math.abs(x - previousAcceleration.current.x);
        const deltaY = Math.abs(y - previousAcceleration.current.y);
        const deltaZ = Math.abs(z - previousAcceleration.current.z);
        
        // Calculer la force totale de la secousse
        const shakeForce = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        
        // Détecter une secousse si la force dépasse le seuil
        if (shakeForce > threshold) {
          // Vérifier que suffisamment de temps s'est écoulé depuis la dernière secousse
          if (currentTime - lastShakeTime.current > timeWindow) {
            console.log('🔄 Shake detected! Force:', shakeForce.toFixed(2));
            setIsShaking(true);
            lastShakeTime.current = currentTime;
            
            if (onShake) {
              onShake();
            }

            // Réinitialiser l'état après un court délai
            setTimeout(() => setIsShaking(false), 300);
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
