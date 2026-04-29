/**
 * CommunityNotifications.js  ── UPDATED VERSION
 *
 * KEY CHANGES:
 * ────────────────────────────────────────────────────────────────────────
 *  Ab hardcoded data nahi — real notifications SharedNotificationService
 *  se aati hain. "Pending" aur "Viewed" sections hain.
 *  Pull-to-refresh bhi kaam karta hai.
 * ────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  FlatList, SafeAreaView, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SharedNotifService from '../../utils/SharedNotificationService';

const TINT = '#1B5E20';

export default function CommunityNotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  // ── Load user + notifications ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const uid  = await AsyncStorage.getItem('userId') || 'anonymous';
      setCurrentUserId(uid);

      const all = await SharedNotifService.getAllNotifications();

      // Format + add read status for current user
      const formatted = all.map(n => ({
        ...n,
        read: n.readBy.includes(uid),
      }));

      setNotifications(formatted);
    } catch (e) {
      console.error('[CommunityNotifs] loadData error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Har 4 second mein refresh (same as GlobalNotificationContext)
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ── Mark single as read ───────────────────────────────────────────────────
  const handlePress = async (item) => {
    if (!item.read && currentUserId) {
      await SharedNotifService.markReadByUser(item.id, currentUserId);
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, read: true } : n)
      );
    }
    router.push('/(tabs)/ReportsFeed');
  };

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    if (!currentUserId) return;
    await SharedNotifService.markAllReadByUser(currentUserId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ── Time format ───────────────────────────────────────────────────────────
  const formatTime = (ts) => {
    if (!ts) return '';
    const d    = new Date(ts);
    const now  = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Abhi abhi';
    if (mins < 60) return `${mins} min pehle`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} ghante pehle`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days} din pehle`;
    return d.toLocaleDateString('en-PK');
  };

  // ── Split sections ────────────────────────────────────────────────────────
  const pending = notifications.filter(n => !n.read);
  const viewed  = notifications.filter(n =>  n.read);

  // ── Render card ───────────────────────────────────────────────────────────
  const renderCard = (item, isPending) => {
    const isHigh = item.type === 'high';
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.card,
          isPending && isHigh  && styles.cardHighPending,
          isPending && !isHigh && styles.cardNormalPending,
          !isPending           && styles.cardViewed,
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.78}
      >
        <View style={[styles.cardIconBox, { backgroundColor: isHigh ? '#FFEBEE' : '#E8F5E9' }]}>
          <Ionicons
            name={isHigh ? 'alert-circle' : 'notifications'}
            size={20}
            color={isHigh ? '#B71C1C' : TINT}
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            {isHigh && isPending && (
              <View style={styles.highPill}>
                <Text style={styles.highPillTxt}>HIGH</Text>
              </View>
            )}
            <Text
              style={[
                styles.cardTitle,
                isHigh && isPending && { color: '#B71C1C' },
                !isPending && { color: '#888' },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {isPending && <View style={[styles.unreadDot, isHigh && { backgroundColor: '#B71C1C' }]} />}
          </View>

          <Text style={styles.cardDesc} numberOfLines={2}>{item.message}</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>

            <View style={[
              styles.statusPill,
              isPending ? styles.pillPending : styles.pillViewed,
            ]}>
              <Text style={[
                styles.statusPillTxt,
                isPending ? styles.pillPendingTxt : styles.pillViewedTxt,
              ]}>
                {isPending ? 'Pending' : 'Viewed'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={TINT} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Notifications</Text>
        {pending.length > 0 ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
            <Ionicons name="checkmark-done" size={22} color="#A5D6A7" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => 'list'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TINT} />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.container}>

            {/* ── Empty state ── */}
            {notifications.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="notifications-off-outline" size={54} color="#ccc" />
                <Text style={styles.emptyTitle}>Koi notification nahi</Text>
                <Text style={styles.emptyDesc}>
                  Jab koi report upload hogi, yahan alert aayega.
                </Text>
              </View>
            )}

            {/* ── PENDING section ── */}
            {pending.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: '#C62828' }]} />
                  <Text style={styles.sectionTitle}>Pending Alerts</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeTxt}>{pending.length}</Text>
                  </View>
                </View>
                {pending.map(item => renderCard(item, true))}
              </View>
            )}

            {/* ── VIEWED section ── */}
            {viewed.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: '#aaa' }]} />
                  <Text style={[styles.sectionTitle, { color: '#aaa' }]}>Viewed</Text>
                </View>
                {viewed.map(item => renderCard(item, false))}
              </View>
            )}

          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F4' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: TINT,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  container: { padding: 14, paddingBottom: 100, gap: 16 },

  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#aaa' },
  emptyDesc:  { fontSize: 13, color: '#ccc', textAlign: 'center', lineHeight: 20 },

  section: { gap: 8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionDot:    { width: 8, height: 8, borderRadius: 4 },
  sectionTitle:  { fontSize: 13, fontWeight: '800', color: '#444', flex: 1, letterSpacing: 0.3 },
  countBadge:    {
    backgroundColor: '#C62828', minWidth: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHighPending:   { borderLeftWidth: 3, borderLeftColor: '#B71C1C', backgroundColor: '#FFFAFA' },
  cardNormalPending: { borderLeftWidth: 3, borderLeftColor: TINT },
  cardViewed:        { opacity: 0.65 },

  cardIconBox: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  cardBody:     { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1 },

  highPill:    {
    backgroundColor: '#FFEBEE', borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  highPillTxt: { fontSize: 7, fontWeight: '800', color: '#B71C1C', letterSpacing: 0.5 },

  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935', flexShrink: 0 },

  cardDesc:   { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTime:   { fontSize: 11, color: '#aaa', fontWeight: '500' },

  statusPill:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  pillPending:   { backgroundColor: '#FFF3E0' },
  pillViewed:    { backgroundColor: '#F5F5F5' },
  statusPillTxt: { fontSize: 10, fontWeight: '700' },
  pillPendingTxt:{ color: '#E65100' },
  pillViewedTxt: { color: '#aaa' },
});
