import React from "react"
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { CompleteDiceResult } from "../../utils/dice"

const { height } = Dimensions.get("window")

interface ResultsDrawerProps {
  visible: boolean
  onClose: () => void
  result: CompleteDiceResult | null
}

export default function ResultsDrawer({ visible, onClose, result }: ResultsDrawerProps) {
  if (!visible || !result) return null

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      
      <View style={styles.drawer}>
        <View style={styles.handle} />
        
        <View style={styles.header}>
          <Text style={styles.title}>✨ Votre soirée ✨</Text>
          <Text style={styles.subtitle}>Voici ce qui vous attend</Text>
        </View>

        <View style={styles.resultsGrid}>
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{result.payer.emoji}</Text>
            <Text style={styles.resultCategory}>QUI PAIE</Text>
            <Text style={styles.resultLabel}>{result.payer.label}</Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{result.repas.emoji}</Text>
            <Text style={styles.resultCategory}>REPAS</Text>
            <Text style={styles.resultLabel}>{result.repas.label}</Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{result.activite.emoji}</Text>
            <Text style={styles.resultCategory}>ACTIVITÉ</Text>
            <Text style={styles.resultLabel}>{result.activite.label}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    maxHeight: height * 0.6,
    minHeight: 300,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#CCCCCC",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#A50848",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  resultsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 30,
  },
  resultCard: {
    flex: 1,
    backgroundColor: "rgba(165, 8, 72, 0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(165, 8, 72, 0.2)",
    minHeight: 100,
  },
  resultEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  resultCategory: {
    fontSize: 10,
    color: "#A50848",
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultLabel: {
    fontSize: 12,
    color: "#333333",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  closeButton: {
    backgroundColor: "#A50848",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
