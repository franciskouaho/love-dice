import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import useAnalytics from "../hooks/useAnalytics";
import {
  getCustomFaces,
  addCustomFace,
  updateCustomFace,
  deleteCustomFace,
  getCurrentUserId,
} from "../services/firestore";
import { DiceFace, validateCustomFace, getSuggestedFaces } from "../utils/dice";

const categories = [
  { key: "payer", label: "💳 Qui paie", emoji: "💳" },
  { key: "repas", label: "🍽️ Repas", emoji: "🍽️" },
  { key: "activite", label: "🎬 Activité", emoji: "🎬" },
] as const;

export default function CustomFacesScreen() {
  const { logCustomFaceAdd, logFaceEdited, logFaceDeleted } = useAnalytics();

  const [faces, setFaces] = useState<DiceFace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingFace, setEditingFace] = useState<DiceFace | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    label: "",
    emoji: "",
    category: "activite" as DiceFace["category"],
    weight: 1,
  });

  useEffect(() => {
    loadCustomFaces();
  }, []);

  const loadCustomFaces = async () => {
    try {
      setIsLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn("Utilisateur non connecté");
        return;
      }

      const customFaces = await getCustomFaces(userId);
      // Convert CustomFace to DiceFace
      const diceFaces: DiceFace[] = customFaces.map((face) => ({
        id: face.id,
        label: face.label,
        category: face.category,
        emoji: face.emoji,
        weight: face.weight,
        actions: face.actions,
      }));
      setFaces(diceFaces);
    } catch (error) {
      console.error("Erreur chargement faces personnalisées:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    await Haptics.selectionAsync();
    router.back();
  };

  const openAddModal = () => {
    setEditingFace(null);
    setFormData({
      label: "",
      emoji: "",
      category: "activite",
      weight: 1,
    });
    setIsModalVisible(true);
  };

  const openEditModal = (face: DiceFace) => {
    setEditingFace(face);
    setFormData({
      label: face.label,
      emoji: face.emoji,
      category: face.category,
      weight: face.weight,
    });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingFace(null);
  };

  const handleSave = async () => {
    try {
      // Validation
      const validation = validateCustomFace({
        ...formData,
        id: editingFace?.id || "temp",
      });

      if (!validation.valid) {
        Alert.alert("Erreur", validation.error);
        return;
      }

      await Haptics.selectionAsync();

      const userId = getCurrentUserId();
      if (!userId) return;

      if (editingFace) {
        // Modifier une face existante
        const updates = {
          label: formData.label,
          category: formData.category,
          emoji: formData.emoji,
          weight: formData.weight,
          isActive: true,
        };

        await updateCustomFace(userId, editingFace.id, updates);
        logFaceEdited(editingFace.id, formData.category, true);
      } else {
        // Créer une nouvelle face
        const newFaceData = {
          label: formData.label,
          category: formData.category,
          emoji: formData.emoji,
          weight: formData.weight,
          isActive: true,
        };
        await addCustomFace(userId, newFaceData);
        logCustomFaceAdd(formData.category, faces.length === 0);
      }

      await loadCustomFaces();
      closeModal();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Erreur sauvegarde face:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", "Impossible de sauvegarder la face personnalisée.");
    }
  };

  const handleDelete = (face: DiceFace) => {
    Alert.alert(
      "Supprimer la face",
      `Êtes-vous sûr de vouloir supprimer "${face.label}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const userId = getCurrentUserId();
              if (!userId) return;

              await deleteCustomFace(userId, face.id);
              logFaceDeleted(face.id, face.category);
              await loadCustomFaces();
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } catch (error) {
              console.error("Erreur suppression face:", error);
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              );
              Alert.alert("Erreur", "Impossible de supprimer la face.");
            }
          },
        },
      ],
    );
  };

  const applySuggestion = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, label: suggestion }));
  };

  const renderFaceItem = ({ item }: { item: DiceFace }) => (
    <View style={styles.faceItem}>
      <View style={styles.faceContent}>
        <Text style={styles.faceEmoji}>{item.emoji}</Text>
        <View style={styles.faceInfo}>
          <Text style={styles.faceLabel}>{item.label}</Text>
          <Text style={styles.faceCategory}>
            {categories.find((c) => c.key === item.category)?.label}
          </Text>
          <Text style={styles.faceWeight}>Poids: {item.weight}</Text>
        </View>
      </View>
      <View style={styles.faceActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎲</Text>
      <Text style={styles.emptyTitle}>Aucune face personnalisée</Text>
      <Text style={styles.emptySubtext}>
        Créez vos propres idées pour personnaliser votre dé et rendre vos
        soirées encore plus uniques.
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#E0115F", "#FF4F7B"]}
          style={styles.createGradient}
        >
          <Text style={styles.createButtonText}>Créer ma première face</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#FFF3F6", "#FFFFFF"]} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF3F6" />

      <LinearGradient colors={["#FFF3F6", "#FFFFFF"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Faces personnalisées</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddModal}
            activeOpacity={0.7}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des faces */}
        <FlatList
          data={faces}
          keyExtractor={(item) => item.id}
          renderItem={renderFaceItem}
          contentContainerStyle={[
            styles.listContainer,
            faces.length === 0 && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />

        {/* Modal d'édition/création */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingFace ? "Modifier la face" : "Nouvelle face"}
              </Text>

              {/* Libellé */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Libellé</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: Cinéma maison"
                  value={formData.label}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, label: text }))
                  }
                  maxLength={50}
                  placeholderTextColor="#A50848"
                />
              </View>

              {/* Emoji */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Emoji</Text>
                <TextInput
                  style={[styles.textInput, styles.emojiInput]}
                  placeholder="🎬"
                  value={formData.emoji}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, emoji: text }))
                  }
                  maxLength={4}
                  placeholderTextColor="#A50848"
                />
              </View>

              {/* Catégorie */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Catégorie</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryButton,
                        formData.category === category.key &&
                          styles.categoryButtonActive,
                      ]}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          category: category.key,
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          formData.category === category.key &&
                            styles.categoryTextActive,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Suggestions */}
              {!editingFace && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>💡 Suggestions</Text>
                  <View style={styles.suggestionsGrid}>
                    {getSuggestedFaces(formData.category).map(
                      (suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionChip}
                          onPress={() => applySuggestion(suggestion)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.suggestionText}>
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </View>
              )}

              {/* Boutons d'action */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#E0115F", "#FF4F7B"]}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingFace ? "Modifier" : "Créer"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF3F6",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(224, 17, 95, 0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(224, 17, 95, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#E0115F",
    fontWeight: "bold",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#0E0E10",
    textAlign: "center",
    fontFamily: "System",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0115F",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#A50848",
    fontFamily: "System",
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  faceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.1)",
    elevation: 2,
    shadowColor: "#A50848",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  faceContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  faceEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  faceInfo: {
    flex: 1,
  },
  faceLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0E0E10",
    marginBottom: 4,
    fontFamily: "System",
  },
  faceCategory: {
    fontSize: 14,
    color: "#A50848",
    marginBottom: 2,
    fontFamily: "System",
  },
  faceWeight: {
    fontSize: 12,
    color: "#A50848",
    opacity: 0.6,
    fontFamily: "System",
  },
  faceActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(224, 17, 95, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "rgba(224, 17, 95, 0.2)",
  },
  actionIcon: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0E0E10",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "System",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#A50848",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.7,
    fontFamily: "System",
  },
  createButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  createGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "System",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0E0E10",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "System",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E0E10",
    marginBottom: 8,
    fontFamily: "System",
  },
  textInput: {
    backgroundColor: "#FFF3F6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0E0E10",
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.2)",
    fontFamily: "System",
  },
  emojiInput: {
    textAlign: "center",
    fontSize: 24,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFF3F6",
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.2)",
    alignItems: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#E0115F",
    borderColor: "#E0115F",
  },
  categoryText: {
    fontSize: 14,
    color: "#A50848",
    fontFamily: "System",
    textAlign: "center",
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E0E10",
    marginBottom: 12,
    fontFamily: "System",
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: "#FFF3F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.2)",
  },
  suggestionText: {
    fontSize: 12,
    color: "#A50848",
    fontFamily: "System",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FFF3F6",
    borderWidth: 1,
    borderColor: "rgba(224, 17, 95, 0.2)",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#A50848",
    fontFamily: "System",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "System",
  },
});
