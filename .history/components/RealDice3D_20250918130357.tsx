import React, { useEffect, useState } from 'react';
import { View, Text, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CompleteDiceResult } from '../utils/dice';

interface RealDice3DProps {
  result?: CompleteDiceResult | null;
}

export const RealDice3D: React.FC<RealDice3DProps> = ({ result }) => {
  const { width: screenWidth } = useWindowDimensions();
  const screenCenter = screenWidth / 2;
  
  // Animation values pour chaque dé
  const [dice1] = useState(new Animated.Value(0));
  const [dice2] = useState(new Animated.Value(0));
  const [dice3] = useState(new Animated.Value(0));

  // Position fixes pour éviter les dés hors écran
  const positions = [
    { left: screenCenter - 120, top: 320 },   // Dé 1 : plus à gauche
    { left: screenCenter - 40, top: 320 },    // Dé 2 : légèrement à gauche
    { left: screenCenter - 80, top: 450 },    // Dé 3 : centré en bas
  ];

  useEffect(() => {
    if (result) {
      // Animation de rotation pour simuler le lancer de dés
      const animations = [dice1, dice2, dice3].map((animatedValue, index) => 
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500 + index * 400,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.parallel(animations).start();
    }
  }, [result]);

  const getDiceRotation = (animatedValue: Animated.Value) => {
    return animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '1440deg'], // 4 tours complets
    });
  };

  const getDiceScale = (animatedValue: Animated.Value) => {
    return animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.4, 1],
    });
  };

  const getDiceTranslateY = (animatedValue: Animated.Value) => {
    return animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, -40, 0],
    });
  };

  const renderDots = (count: number, size: number = 8, color: string = '#1a1a1a') => {
    const dotPositions: { [key: number]: Array<{ top: string; left: string }> } = {
      1: [{ top: '50%', left: '50%' }],
      2: [{ top: '25%', left: '25%' }, { top: '75%', left: '75%' }],
      3: [{ top: '20%', left: '20%' }, { top: '50%', left: '50%' }, { top: '80%', left: '80%' }],
      4: [{ top: '25%', left: '25%' }, { top: '25%', left: '75%' }, { top: '75%', left: '25%' }, { top: '75%', left: '75%' }],
      5: [{ top: '20%', left: '20%' }, { top: '20%', left: '80%' }, { top: '50%', left: '50%' }, { top: '80%', left: '20%' }, { top: '80%', left: '80%' }],
      6: [{ top: '20%', left: '30%' }, { top: '20%', left: '70%' }, { top: '40%', left: '30%' }, { top: '40%', left: '70%' }, { top: '60%', left: '30%' }, { top: '60%', left: '70%' }],
    };

    return dotPositions[count]?.map((position, index) => (
      <View
        key={index}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateX: -size/2 }, { translateY: -size/2 }],
          shadowColor: '#000',
          shadowOffset: { width: 1, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
        }}
      />
    ));
  };

  const renderDice = (
    animatedValue: Animated.Value,
    position: { left: number; top: number },
    emoji: string,
    label: string,
    index: number
  ) => {
    // Nombres fixes pour les faces cachées (pour cohérence visuelle)
    const rightFaceDots = (index % 6) + 1;
    const topFaceDots = ((index + 2) % 6) + 1;

    return (
      <Animated.View
        key={index}
        style={{
          position: 'absolute',
          left: position.left,
          top: position.top,
          transform: [
            { perspective: 1200 },
            { translateY: getDiceTranslateY(animatedValue) },
            { rotateX: getDiceRotation(animatedValue) },
            { rotateY: getDiceRotation(animatedValue) },
            { rotateZ: getDiceRotation(animatedValue) },
            { scale: getDiceScale(animatedValue) },
          ],
        }}
      >
        {/* Container du dé avec perspective 3D */}
        <View style={{ 
          width: 75, 
          height: 75,
          position: 'relative',
        }}>
          
          {/* Ombre projetée réaliste */}
          <View
            style={{
              position: 'absolute',
              bottom: -15,
              left: 8,
              width: 75,
              height: 15,
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 37.5,
              transform: [{ scaleX: 1.2 }, { scaleY: 0.6 }],
              opacity: 0.6,
            }}
          />
          
          {/* Face principale (front) - dé blanc comme dans l'image */}
          <LinearGradient
            colors={['#ffffff', '#f8f8f8', '#f0f0f0']}
            style={{
              width: 75,
              height: 75,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 6, height: 12 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              borderWidth: 1,
              borderColor: '#e8e8e8',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Contenu principal avec emoji et texte */}
            <Text style={{ 
              fontSize: 22, 
              textAlign: 'center',
              marginBottom: 3,
              textShadowColor: 'rgba(0,0,0,0.1)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}>
              {emoji}
            </Text>
            <Text style={{ 
              fontSize: 8, 
              textAlign: 'center',
              color: '#333',
              fontWeight: '700',
              textShadowColor: 'rgba(0,0,0,0.1)',
              textShadowOffset: { width: 0.5, height: 0.5 },
              textShadowRadius: 1,
              paddingHorizontal: 2,
            }}>
              {label.length > 12 ? label.substring(0, 12) + '...' : label}
            </Text>
            
            {/* Reflet brillant pour effet 3D réaliste */}
            <LinearGradient
              colors={['rgba(255,255,255,0.8)', 'transparent']}
              style={{
                position: 'absolute',
                top: 3,
                left: 3,
                width: 25,
                height: 25,
                borderRadius: 12,
                opacity: 0.9,
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </LinearGradient>

          {/* Face droite (right) pour l'effet 3D - vraie couleur de dé */}
          <LinearGradient
            colors={['#e8e8e8', '#d8d8d8', '#c8c8c8']}
            style={{
              width: 28,
              height: 75,
              backgroundColor: '#e0e0e0',
              position: 'absolute',
              right: -22,
              top: -4,
              borderRadius: 6,
              transform: [{ skewY: '-25deg' }],
              borderWidth: 0.5,
              borderColor: '#d0d0d0',
              shadowColor: '#000',
              shadowOffset: { width: 3, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {renderDots(rightFaceDots, 4, '#333')}
          </LinearGradient>

          {/* Face du haut (top) pour l'effet 3D - vraie couleur de dé */}
          <LinearGradient
            colors={['#f5f5f5', '#e5e5e5', '#d5d5d5']}
            style={{
              width: 75,
              height: 28,
              backgroundColor: '#f0f0f0',
              position: 'absolute',
              top: -22,
              left: 4,
              borderRadius: 6,
              transform: [{ skewX: '-25deg' }],
              borderWidth: 0.5,
              borderColor: '#d0d0d0',
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {renderDots(topFaceDots, 4, '#333')}
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  if (!result) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {[1, 2, 3].map((index) => 
          renderDice(
            new Animated.Value(0),
            positions[index - 1],
            '🎲',
            'Lancez !',
            index - 1
          )
        )}
      </View>
    );
  }

  const results = [
    { emoji: '💰', label: result.payer },
    { emoji: '🍽️', label: result.eat },
    { emoji: '🎯', label: result.activity }
  ];

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {results.map((res, index) => 
        renderDice(
          [dice1, dice2, dice3][index],
          positions[index],
          res.emoji,
          res.label,
          index
        )
      )}
    </View>
  );
};