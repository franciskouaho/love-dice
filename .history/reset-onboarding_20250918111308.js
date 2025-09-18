const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function resetOnboarding() {
  try {
    await AsyncStorage.removeItem('onboarding_completed');
    console.log('✅ Onboarding completion status cleared successfully!');
    console.log('You can now redo the onboarding flow.');
  } catch (error) {
    console.error('❌ Error clearing onboarding status:', error);
  }
  process.exit(0);
}

resetOnboarding();
