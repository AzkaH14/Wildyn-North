import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_reports';

// Save report locally
export const saveOfflineReport = async (report) => {
  try {
    const existing = await AsyncStorage.getItem(QUEUE_KEY);
    const reports = existing ? JSON.parse(existing) : [];

    reports.push(report);

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.log("Error saving offline report", e);
  }
};

// Get all offline reports
export const getOfflineReports = async () => {
  const data = await AsyncStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
};

// Clear queue after sync
export const clearOfflineReports = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};


