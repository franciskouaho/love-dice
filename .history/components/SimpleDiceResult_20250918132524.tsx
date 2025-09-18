import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CompleteDiceResult } from '../utils/dice';

interface SimpleDiceResultProps {
  result: CompleteDiceResult;
}

export const SimpleDiceResult: React.FC<SimpleDiceResultProps> = ({ result }) => {
  return (
    <View style={styles.container}>
      {/* Qui paie */}
      <View style={styles.resultCard}>
        <Text style={styles.emoji}>{result.payer.emoji}</Text>
        <Text style={styles.category}>Qui paie</Text>
        <Text style={styles.label}>{result.payer.label}</Text>
      </View>

      {/* Repas */}
      <View style={styles.resultCard}>
        <Text style={styles.emoji}>{result.repas.emoji}</Text>
        <Text style={styles.category}>Repas</Text>
        <Text style={styles.label}>{result.repas.label}</Text>
      </View>

      {/* Activité */}
      <View style={styles.resultCard}>
        <Text style={styles.emoji}>{result.activite.emoji}</Text>
        <Text style={styles.category}>Activité</Text>
        <Text style={styles.label}>{result.activite.label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
