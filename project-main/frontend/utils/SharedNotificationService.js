/**
 * SharedNotificationService.js
 *
 * YEH FILE kya karti hai:
 * ─────────────────────────────────────────────────────────────────────
 *  Ek hi device par multiple logged-in users ke liye AsyncStorage ko
 *  "broadcast channel" ki tarah use karti hai.
 *
 *  Jab User A koi report upload kare:
 *    1. Notification shared storage mein save hoti hai.
 *    2. User B / C / Researcher ka context (AlertContext) har 3 sec
 *       mein storage check karta hai.
 *    3. Jis user ne abhi tak woh notification dismiss nahi ki
 *       (readBy array mein uska userId nahi) usse banner dikhta hai.
 *
 *  Storage key: 'wildlife_shared_notifications_v1'
 *  Max notifications: 200 (purani automatically hat jaati hain)
 * ─────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wildlife_shared_notifications_v1';
const MAX_NOTIFICATIONS = 200;

// ─── Get all notifications (sorted newest first) ──────────────────────────────
export const getAllNotifications = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// ─── Add a new notification (called when report is uploaded) ──────────────────
export const addNotification = async ({
  type,              // 'high' | 'normal'
  title,
  message,
  reportId = null,
  uploadedByUserId = null,
  uploadedByUsername = null,
}) => {
  try {
    const existing = await getAllNotifications();

    const newNotif = {
      id: Date.now().toString() + '_' + Math.random().toString(36).slice(2),
      type,
      title,
      message,
      reportId,
      uploadedByUserId,
      uploadedByUsername,
      timestamp: new Date().toISOString(),
      readBy: [],          // koi bhi user ne abhi tak nahi padha
    };

    const updated = [newNotif, ...existing].slice(0, MAX_NOTIFICATIONS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newNotif;
  } catch (e) {
    console.error('[SharedNotif] addNotification error:', e);
    // Fallback: memory-only object (won't persist but prevents crash)
    return {
      id: Date.now().toString(),
      type, title, message, reportId, uploadedByUserId, uploadedByUsername,
      timestamp: new Date().toISOString(),
      readBy: [],
    };
  }
};

// ─── Mark one notification as read by a specific user ────────────────────────
export const markReadByUser = async (notifId, userId) => {
  if (!userId) return;
  try {
    const notifications = await getAllNotifications();
    const updated = notifications.map(n => {
      if (n.id === notifId && !n.readBy.includes(userId)) {
        return { ...n, readBy: [...n.readBy, userId] };
      }
      return n;
    });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[SharedNotif] markReadByUser error:', e);
  }
};

// ─── Mark ALL notifications as read by a specific user ───────────────────────
export const markAllReadByUser = async (userId) => {
  if (!userId) return;
  try {
    const notifications = await getAllNotifications();
    const updated = notifications.map(n => ({
      ...n,
      readBy: n.readBy.includes(userId) ? n.readBy : [...n.readBy, userId],
    }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[SharedNotif] markAllReadByUser error:', e);
  }
};

// ─── Get unread notifications for a specific user ─────────────────────────────
export const getUnreadForUser = async (userId) => {
  if (!userId) return [];
  const all = await getAllNotifications();
  return all.filter(n => !n.readBy.includes(userId));
};

// ─── Get unread count for a specific user ────────────────────────────────────
export const getUnreadCountForUser = async (userId) => {
  const unread = await getUnreadForUser(userId);
  return unread.length;
};

// ─── Clear all (testing ke liye) ─────────────────────────────────────────────
export const clearAllNotifications = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {}
};
