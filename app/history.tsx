import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import useAnalytics from '../hooks/useAnalytics';
import { getHistory, getCurrentUserId, HistoryEntry } from '../services/firestore';
import { formatRollDate } from '../utils/dice';

export default function HistoryScreen() {
  const { logHistoryViewed, logShareResult } = useAnalytics();

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('Utilisateur non connecté');
        return;
      }

      const historyData = await getHistory(userId, 20); // 20 derniers lancers
      setHistory(historyData);

      // Analytics
      if (!isRefresh) {
        logHistoryViewed(historyData.length);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadHistory(true);
  };

  const handleBack = async () => {
    await Haptics.selectionAsync();
    router.back();
  };

  const handleShareEntry = async (entry: HistoryEntry) => {
    try {
      await Haptics.selectionAsync();

      const shareText = `🎲 Love Dice: ${entry.emoji} ${entry.label}\n\nTélécharge Love Dice pour randomiser tes soirées !`;

      await Share.share({
        message: shareText,
      });

      logShareResult(entry.category, entry.label, 'text');
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const formatEntryDate = (entry: HistoryEntry) => {
    try {
      const date = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);
      return formatRollDate({
        id: entry.id,
        face: {
          id: entry.faceId,
          label: entry.label,
          category: entry.category as any,
          emoji: entry.emoji,
          weight: 1
        },
        timestamp: date.getTime(),
        date: date.toISOString().split('T')[0]
      });
    } catch (error) {
      return 'Date inconnue';
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryEntry }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyContent}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyEmoji}>{item.emoji}</Text>
          <View style={styles.historyInfo}>
            <Text style={styles.historyLabel}>{item.label}</Text>
            <Text style={styles.historyCategory}>
              {item.category === 'payer' && '💳 Qui paie'}
              {item.category === 'repas' && '🍽️ Repas'}
              {item.category === 'activite' && '🎬 Activité'}
            </Text>
          </View>
        </View>
        <Text style={styles.historyDate}>{formatEntryDate(item)}</Text>
      </View>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => handleShareEntry(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.shareIcon}>📤</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎲</Text>
      <Text style={styles.emptyTitle}>Aucun lancer enregistré</Text>
      <Text style={styles.emptySubtext}>
        Vos lancers de dé apparaîtront ici une fois que vous aurez commencé à jouer.
      </Text>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push('/(tabs)/')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#E0115F', '#FF4F7B']}
          style={styles.startGradient}
        >
          <Text style={styles.startButtonText}>Commencer à jouer</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FFF3F6', '#FFFFFF']} style={styles.gradient}>
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

      <LinearGradient colors={['#FFF3F6', '#FFFFFF']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Statistiques */}
        {history.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{history.length}</Text>
              <Text style={styles.statLabel}>Lancers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {history.filter(h => h.category === 'activite').length}
              </Text>
              <Text style={styles.statLabel}>Activités</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {history.filter(h => h.category === 'repas').length}
              </Text>
              <Text style={styles.statLabel}>Repas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {history.filter(h => h.category === 'payer').length}
              </Text>
              <Text style={styles.statLabel}>Paiements</Text>
            </View>
          </View>
        )}

        {/* Liste de l'historique */}
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={[
            styles.listContainer,
            history.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#E0115F"
              colors={['#E0115F']}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3F6',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 17, 95, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(224, 17, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#E0115F',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0E0E10',
    textAlign: 'center',
    fontFamily: 'System',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#A50848',
    fontFamily: 'System',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 17, 95, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0115F',
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#A50848',
    marginTop: 4,
    fontFamily: 'System',
    opacity: 0.7,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(224, 17, 95, 0.1)',
    elevation: 2,
    shadowColor: '#A50848',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E0E10',
    marginBottom: 2,
    fontFamily: 'System',
  },
  historyCategory: {
    fontSize: 14,
    color: '#A50848',
    opacity: 0.7,
    fontFamily: 'System',
  },
  historyDate: {
    fontSize: 12,
    color: '#A50848',
    opacity: 0.6,
    fontFamily: 'System',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(224, 17, 95, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  shareIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0E0E10',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#A50848',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.7,
    fontFamily: 'System',
  },
  startButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  startGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
});
