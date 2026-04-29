// contexts/GlobalNotificationContext.js

import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.100.2:5000';
const POLL_MS = 10_000;
const KEYS = {
  TS    : 'gn_last_ts',
  NOTIFS: 'gn_notifs',
  UNREAD: 'gn_unread',
};

const Ctx = createContext(null);

// ─── Module-level Event Emitter ───────────────────────────────────────────────
const _listeners = new Set();
export const notificationEmitter = {
  emit : (report) => _listeners.forEach(fn => fn(report)),
  on   : (fn)     => { _listeners.add(fn); return () => _listeners.delete(fn); },
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const GlobalNotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const lastTsRef   = useRef(null);
  const mountedRef  = useRef(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        const [ts, notifs, unread] = await Promise.all([
          AsyncStorage.getItem(KEYS.TS),
          AsyncStorage.getItem(KEYS.NOTIFS),
          AsyncStorage.getItem(KEYS.UNREAD),
        ]);
        if (ts)     lastTsRef.current = ts;
        if (notifs) setNotifications(JSON.parse(notifs));
        if (unread) setUnreadCount(parseInt(unread, 10) || 0);
      } catch {}

      doPoll();
      intervalRef.current = setInterval(doPoll, POLL_MS);
    })();

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  const doPoll = useCallback(async () => {
    // ✅ FIX: AbortSignal.timeout React Native mein nahi hota
    // Manual timeout controller use karo
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 8000);

    try {
      const uid = await AsyncStorage.getItem('userId');

      const qs = lastTsRef.current
        ? `?since=${encodeURIComponent(lastTsRef.current)}&userId=${uid || ''}`
        : uid ? `?userId=${uid}` : '';

      const url = `${API_URL}/api/notifications/latest${qs}`;
      console.log('🔔 Polling:', url);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.log('❌ Poll failed status:', res.status);
        return;
      }

      const data = await res.json();
      console.log(`📬 Poll result: ${data.length} reports`);
      if (!Array.isArray(data) || !data.length) return;

      if (data[0]?.createdAt) {
        lastTsRef.current = data[0].createdAt;
        await AsyncStorage.setItem(KEYS.TS, data[0].createdAt);
      }

      const others = data.filter(r => r.userId !== uid);
      console.log(`👥 Others' reports: ${others.length}`);
      if (!others.length) return;

      // ✅ AlertContext ko event bhejo — woh banner dikhayega
      others.forEach(report => notificationEmitter.emit(report));

      const newNotifs = others.map(r => ({
        id       : r._id,
        reportId : r._id,
        title    : r.healthStatus === 'Injured' ? '🚨 Injured Animal Alert!' : '🦎 New Wildlife Sighting',
        message  : r.healthStatus === 'Injured'
          ? `${r.specieName} injured — by ${r.username}`
          : `${r.specieName} spotted by ${r.username}`,
        type     : r.healthStatus === 'Injured' ? 'high' : 'normal',
        timestamp: r.createdAt,
        read     : false,
      }));

      if (!mountedRef.current) return;

      setNotifications(prev => {
        const ids   = new Set(prev.map(n => n.id));
        const fresh = newNotifs.filter(n => !ids.has(n.id));
        if (!fresh.length) return prev;
        const merged = [...fresh, ...prev].slice(0, 50);
        AsyncStorage.setItem(KEYS.NOTIFS, JSON.stringify(merged));
        return merged;
      });

      setUnreadCount(prev => {
        const next = prev + others.length;
        AsyncStorage.setItem(KEYS.UNREAD, String(next));
        return next;
      });

    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        console.log('⚠️ Poll timeout (8s)');
      } else {
        console.log('⚠️ Poll error:', e.message);
      }
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    await AsyncStorage.setItem(KEYS.UNREAD, '0');
    setNotifications(prev => {
      const u = prev.map(n => ({ ...n, read: true }));
      AsyncStorage.setItem(KEYS.NOTIFS, JSON.stringify(u));
      return u;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    await AsyncStorage.multiRemove([KEYS.NOTIFS]);
    await AsyncStorage.setItem(KEYS.UNREAD, '0');
  }, []);

  return (
    <Ctx.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
      {children}
    </Ctx.Provider>
  );
};

export const useGlobalNotifications = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGlobalNotifications must be inside GlobalNotificationProvider');
  return ctx;
};
