import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  scheduleLocalNotification,
  scheduleEveningReminder,
  scheduleMilestoneNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  requestNotificationPermissions,
} from '../services/notifications';

/**
 * Utilitaires de test pour les notifications Love Dice
 *
 * Ces fonctions permettent de tester les notifications en développement
 * et de diagnostiquer les problèmes éventuels.
 */

export interface NotificationTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Tester les permissions de notifications
 */
export const testNotificationPermissions = async (): Promise<NotificationTestResult> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Notifications non supportées sur web',
      };
    }

    const { status } = await Notifications.getPermissionsAsync();

    return {
      success: status === 'granted',
      message: `Permissions: ${status}`,
      data: { status },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur test permissions',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Demander les permissions avec test
 */
export const testRequestPermissions = async (): Promise<NotificationTestResult> => {
  try {
    const granted = await requestNotificationPermissions();

    return {
      success: granted,
      message: granted ? 'Permissions accordées' : 'Permissions refusées',
      data: { granted },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur demande permissions',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Tester une notification immédiate
 */
export const testImmediateNotification = async (
  title: string = "Test Love Dice 🎲",
  body: string = "Ceci est une notification de test !"
): Promise<NotificationTestResult> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Notifications non supportées sur web',
      };
    }

    // Programmer pour dans 3 secondes
    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + 3);

    const id = await scheduleLocalNotification(
      title,
      body,
      triggerDate,
      { type: 'test', timestamp: Date.now() }
    );

    return {
      success: !!id,
      message: id ? 'Notification test programmée (3s)' : 'Échec programmation',
      data: { id, triggerDate },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur notification test',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Tester les rappels du soir
 */
export const testEveningReminders = async (): Promise<NotificationTestResult> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Notifications non supportées sur web',
      };
    }

    // Programmer pour dans 1 minute (test)
    const testTime = new Date();
    testTime.setMinutes(testTime.getMinutes() + 1);
    const timeString = `${testTime.getHours().toString().padStart(2, '0')}:${testTime.getMinutes().toString().padStart(2, '0')}`;

    await scheduleEveningReminder(timeString);

    const scheduled = await getScheduledNotifications();
    const reminderCount = scheduled.filter(n => n.type === 'evening_reminder').length;

    return {
      success: reminderCount > 0,
      message: `${reminderCount} rappel(s) programmé(s) pour ${timeString}`,
      data: { count: reminderCount, time: timeString },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur test rappels',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Tester une notification de milestone
 */
export const testMilestoneNotification = async (
  rollCount: number = 10
): Promise<NotificationTestResult> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Notifications non supportées sur web',
      };
    }

    await scheduleMilestoneNotification(rollCount);

    return {
      success: true,
      message: `Notification milestone ${rollCount} programmée`,
      data: { rollCount },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur test milestone',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Lister toutes les notifications programmées
 */
export const testListScheduledNotifications = async (): Promise<NotificationTestResult> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Notifications non supportées sur web',
      };
    }

    const scheduled = await getScheduledNotifications();

    return {
      success: true,
      message: `${scheduled.length} notification(s) programmée(s)`,
      data: {
        count: scheduled.length,
        notifications: scheduled.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          scheduledDate: n.scheduledDate.toISOString(),
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur liste notifications',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Annuler toutes les notifications de test
 */
export const testCancelAllNotifications = async (): Promise<NotificationTestResult> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Notifications non supportées sur web',
      };
    }

    await cancelAllNotifications();

    return {
      success: true,
      message: 'Toutes les notifications annulées',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur annulation notifications',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Tester le token Expo Push
 */
export const testExpoPushToken = async (): Promise<NotificationTestResult> => {
  try {
    if (Platform.OS === 'web') {
      return {
        success: false,
        message: 'Push tokens non supportés sur web',
      };
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: '916106041141',
    });

    return {
      success: true,
      message: 'Token Expo Push obtenu',
      data: {
        token: pushToken.data,
        type: pushToken.type,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erreur obtention token',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Suite de tests complète
 */
export const runNotificationTestSuite = async (): Promise<{
  success: boolean;
  results: { [key: string]: NotificationTestResult };
}> => {
  const results: { [key: string]: NotificationTestResult } = {};

  console.log('🧪 Début des tests notifications Love Dice...');

  // Test 1: Permissions
  console.log('1️⃣ Test permissions...');
  results.permissions = await testNotificationPermissions();
  console.log(`   ${results.permissions.success ? '✅' : '❌'} ${results.permissions.message}`);

  // Test 2: Token
  console.log('2️⃣ Test token Expo Push...');
  results.token = await testExpoPushToken();
  console.log(`   ${results.token.success ? '✅' : '❌'} ${results.token.message}`);

  // Test 3: Notification immédiate
  console.log('3️⃣ Test notification immédiate...');
  results.immediate = await testImmediateNotification();
  console.log(`   ${results.immediate.success ? '✅' : '❌'} ${results.immediate.message}`);

  // Test 4: Liste des notifications
  console.log('4️⃣ Test liste notifications...');
  results.list = await testListScheduledNotifications();
  console.log(`   ${results.list.success ? '✅' : '❌'} ${results.list.message}`);

  // Test 5: Milestone
  console.log('5️⃣ Test notification milestone...');
  results.milestone = await testMilestoneNotification(10);
  console.log(`   ${results.milestone.success ? '✅' : '❌'} ${results.milestone.message}`);

  // Test 6: Rappels du soir
  console.log('6️⃣ Test rappels du soir...');
  results.reminders = await testEveningReminders();
  console.log(`   ${results.reminders.success ? '✅' : '❌'} ${results.reminders.message}`);

  const successCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n📊 Résultats: ${successCount}/${totalTests} tests réussis`);

  return {
    success: successCount === totalTests,
    results,
  };
};

/**
 * Fonction de diagnostic rapide
 */
export const quickNotificationDiagnostic = async (): Promise<string> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const scheduled = await getScheduledNotifications();

    let report = `📱 Diagnostic Notifications Love Dice\n\n`;
    report += `🔐 Permissions: ${status}\n`;
    report += `📅 Notifications programmées: ${scheduled.length}\n`;

    if (Platform.OS !== 'web') {
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '916106041141',
        });
        report += `🔑 Push Token: ${token.data.substring(0, 20)}...\n`;
      } catch {
        report += `🔑 Push Token: Erreur\n`;
      }
    }

    const reminderCount = scheduled.filter(n => n.type === 'evening_reminder').length;
    const milestoneCount = scheduled.filter(n => n.type === 'milestone').length;

    report += `🌅 Rappels du soir: ${reminderCount}\n`;
    report += `🏆 Milestones: ${milestoneCount}\n`;

    if (scheduled.length > 0) {
      report += `\n📋 Prochaine notification:\n`;
      const next = scheduled.sort((a, b) =>
        a.scheduledDate.getTime() - b.scheduledDate.getTime()
      )[0];
      report += `   ${next.title} - ${next.scheduledDate.toLocaleString()}\n`;
    }

    return report;
  } catch (error) {
    return `❌ Erreur diagnostic: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
  }
};

export default {
  testNotificationPermissions,
  testRequestPermissions,
  testImmediateNotification,
  testEveningReminders,
  testMilestoneNotification,
  testListScheduledNotifications,
  testCancelAllNotifications,
  testExpoPushToken,
  runNotificationTestSuite,
  quickNotificationDiagnostic,
};
