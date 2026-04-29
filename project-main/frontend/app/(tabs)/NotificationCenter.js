/**
 * NotificationCenter.js  ── UPDATED VERSION
 *
 * KEY CHANGES:
 * ────────────────────────────────────────────────────────────────────────
 *  1. Real notifications dikhata hai (SharedNotificationService se)
 *  2. Do sections: "Pending" (unread) aur "Viewed" (read/dismissed)
 *  3. High priority alerts red highlighted hain
 *  4. Pull-to-refresh support
 *  5. Single notification mark-as-read
 *  6. "Mark All Read" aur "Clear All" buttons
 * ────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useGlobalNotifications } from '../../contexts/GlobalNotificationContext';

const NotificationCenter = () => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    clearAll,
  } = useGlobalNotifications();

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // GlobalNotificationContext apne aap poll karta hai, 1 sec baad band karo
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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

  // ── Split into pending (unread) and viewed (read) ────────────────────────
  const pendingNotifs = notifications.filter(n => !n.read);
  const viewedNotifs  = notifications.filter(n =>  n.read);

  // ── Handle notification press ─────────────────────────────────────────────
  const handlePress = (item) => {
    if (!item.read) markRead(item.id);
    router.push('/(tabs)/ReportsFeed');
  };

  // ── Render single card ────────────────────────────────────────────────────
  const renderItem = ({ item, isPending }) => {
    const isHigh = item.type === 'high';
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isPending && styles.cardUnread,
          isPending && isHigh && styles.cardHighUnread,
          !isPending && styles.cardRead,
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        {/* Icon */}
        <View style={[
          styles.iconBox,
          { backgroundColor: isHigh ? '#FFEBEE' : '#E8F5E9' },
        ]}>
          <Ionicons
            name={isHigh ? 'alert-circle' : 'leaf'}
            size={22}
            color={isHigh ? '#C62828' : '#2E7D32'}
          />
        </View>

        {/* Text */}
        <View style={styles.textBox}>
          <View style={styles.titleRow}>
            {/* HIGH PRIORITY chip */}
            {isHigh && isPending && (
              <View style={styles.highChip}>
                <View style={styles.highChipDot} />
                <Text style={styles.highChipTxt}>HIGH</Text>
              </View>
            )}
            <Text
              style={[
                styles.title,
                isHigh && isPending && { color: '#B71C1C' },
                !isPending && styles.titleRead,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {/* Unread blue dot */}
            {isPending && <View style={[styles.dot, isHigh && styles.dotHigh]} />}
          </View>

          <Text style={styles.msg} numberOfLines={2}>{item.message}</Text>

          {/* Footer: time + who uploaded */}
          <View style={styles.cardFooter}>
            <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
            {item.uploadedByUsername ? (
              <Text style={styles.uploader}>
                <Ionicons name="person-outline" size={10} color="#aaa" />
                {' '}{item.uploadedByUsername}
              </Text>
            ) : null}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    );
  };

  // ── Section header ────────────────────────────────────────────────────────
  const SectionHeader = ({ title, count, color }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <View style={[styles.sectionBadge, { backgroundColor: color }]}>
          <Text style={styles.sectionBadgeTxt}>{count}</Text>
        </View>
      )}
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/ReportsFeed')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} New Alerts</Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.actionBtn}>
              <Ionicons name="checkmark-done" size={20} color="#A5D6A7" />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={20} color="#EF9A9A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No new Notifications</Text>
          <Text style={styles.emptySub}>
            No recent alerts yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={item => item.id}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
          }
          ListHeaderComponent={
            <View style={styles.listPad}>

              {/* ── PENDING section ── */}
              {pendingNotifs.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Pending Alerts"
                    count={pendingNotifs.length}
                    color="#C62828"
                  />
                  {pendingNotifs.map(item => (
                    <View key={item.id}>
                      {renderItem({ item, isPending: true })}
                    </View>
                  ))}
                </View>
              )}

              {/* ── VIEWED section ── */}
              {viewedNotifs.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title="Viewed"
                    count={0}
                    color="#aaa"
                  />
                  {viewedNotifs.map(item => (
                    <View key={item.id}>
                      {renderItem({ item, isPending: false })}
                    </View>
                  ))}
                </View>
              )}

            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F4' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1B5E20',
  },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: 11, color: '#A5D6A7', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  actionBtn:     { padding: 6 },

  listPad: { padding: 12, paddingBottom: 100 },

  section: { marginBottom: 16 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, marginBottom: 10, gap: 8,
  },
  sectionDot:     { width: 8, height: 8, borderRadius: 4 },
  sectionTitle:   { fontSize: 13, fontWeight: '800', color: '#444', flex: 1, letterSpacing: 0.3 },
  sectionBadge:   {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  sectionBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardUnread:     { borderLeftWidth: 3, borderLeftColor: '#2E7D32' },
  cardHighUnread: { borderLeftColor: '#C62828', backgroundColor: '#FFFAFA' },
  cardRead:       { opacity: 0.7 },

  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },
  textBox: { flex: 1, marginRight: 6 },

  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  title:      { fontSize: 14, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  titleRead:  { color: '#888', fontWeight: '600' },

  highChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#FFEBEE', borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  highChipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#B71C1C' },
  highChipTxt: { fontSize: 7, fontWeight: '800', color: '#B71C1C', letterSpacing: 0.5 },

  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935', flexShrink: 0 },
  dotHigh: { backgroundColor: '#B71C1C' },

  msg: { fontSize: 12, color: '#555', lineHeight: 17, marginBottom: 4 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time:       { fontSize: 10, color: '#aaa', fontWeight: '500' },
  uploader:   { fontSize: 10, color: '#aaa' },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#999', marginTop: 16 },
  emptySub:   { fontSize: 13, color: '#bbb', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default NotificationCenter;
