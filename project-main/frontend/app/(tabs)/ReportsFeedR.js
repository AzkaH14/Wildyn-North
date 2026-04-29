import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import BottomNav from '../../assets/components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyboardAwareContainer from '../../assets/components/KeyboardAwareContainer';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'http://192.168.100.2:5000';

const offensiveWords = [
  "badword", "ugly", "offensive", "stupid", "idiot", "dumb", "fool", "moron", "trash",
  "nonsense", "hate", "disgusting", "gross", "useless", "shut up", "kill", "crazy", "jerk",
  "loser", "weird", "lame", "suck", "damn", "hell", "bastard", "crap", "asshole", "nasty",
  "pathetic", "freak", "dumbass", "psycho", "toxic", "lazy", "worthless"
];

// Health status dot color helper
const getHealthDotColor = (healthStatus) => {
  if (!healthStatus) return '#aaa';
  const status = healthStatus.toLowerCase();
  if (status === 'healthy') return '#22c55e';
  if (status === 'sick' || status === 'hungry') return '#eab308';
  if (status === 'injured') return '#ef4444';
  return '#aaa';
};

// Researcher status config
const STATUS_OPTIONS = [
  {
    key: 'verified',
    label: 'Verified',
    icon: 'checkmark-circle',
    color: '#16a34a',
    bg: '#dcfce7',
    border: '#86efac',
  },
  {
    key: 'duplicate',
    label: 'Unverified',
    icon: 'copy',
    color: '#d97706',
    bg: '#fef3c7',
    border: '#fde68a',
  },
  {
    key: 'under_review',
    label: 'Under Review',
    icon: 'time',
    color: '#555',
    bg: '#f0f0f0',
    border: '#d0d0d0',
  },
];

const getStatusConfig = (status) => STATUS_OPTIONS.find((s) => s.key === status) || null;

const ReportsFeedR = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const [markingStatus, setMarkingStatus] = useState({});

  useEffect(() => {
    fetchReports();
    getCurrentUsername();
  }, []);

  useFocusEffect(React.useCallback(() => {
    fetchReports();
    getCurrentUsername();
  }, []));

  const getCurrentUsername = async () => {
    try {
      const username = await AsyncStorage.getItem('username');
      setCurrentUsername(username);
    } catch (error) {
      console.error('Error getting username:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/reports`);
      if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        const processedReports = data.map((r) => ({
          ...r,
          image: r.image,
          comments: r.comments || [],
          pinnedComment: r.pinnedComment || null,
          newComment: "",
        }));
        setReports(processedReports);
        setFailedImages({});
      } else {
        setReports([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (reportId) => {
    setFailedImages(prev => ({ ...prev, [reportId]: true }));
  };

  // ── Mark report with researcher status ──────────────────────
  const handleMarkStatus = async (reportId, newStatus, currentStatus) => {
    const finalStatus = currentStatus === newStatus ? null : newStatus;

    const statusConfig = finalStatus ? getStatusConfig(finalStatus) : null;
    const confirmMsg = finalStatus
      ? `Mark this report as "${statusConfig.label}"?`
      : `Remove "${getStatusConfig(currentStatus).label}" status from this report?`;

    Alert.alert(
      'Update Report Status',
      confirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            setMarkingStatus(prev => ({ ...prev, [reportId]: true }));
            try {
              const res = await fetch(`${API_URL}/api/reports/${reportId}/researcher-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  researcherStatus: finalStatus,
                  markedBy: currentUsername,
                }),
              });

              if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Failed to update status');
              }

              setReports(prev =>
                prev.map(r =>
                  r._id === reportId
                    ? { ...r, researcherStatus: finalStatus, markedBy: currentUsername }
                    : r
                )
              );

              const successMsg = finalStatus
                ? `Report marked as ${statusConfig.label} ✓`
                : 'Status removed from report';
              Alert.alert('Success', successMsg);
            } catch (err) {
              console.error('Mark status error:', err);
              Alert.alert('Error', err.message || 'Could not update status');
            } finally {
              setMarkingStatus(prev => ({ ...prev, [reportId]: false }));
            }
          },
        },
      ]
    );
  };

  const handleAddComment = async (reportId) => {
    const updated = [...reports];
    const report = updated.find((r) => r._id === reportId);
    const commentText = report.newComment.trim();
    if (!commentText) return;

    const isOffensive = offensiveWords.some((w) =>
      commentText.toLowerCase().includes(w)
    );
    if (isOffensive) {
      Alert.alert("Inappropriate Content", "Your comment contains inappropriate words.");
      return;
    }

    let userId = 'anonymous';
    let username = 'Researcher';
    try {
      const [storedUserId, storedUsername] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('username'),
      ]);
      if (storedUserId) userId = storedUserId;
      if (storedUsername) username = storedUsername;
    } catch {}

    const localComment = {
      id: Date.now().toString(),
      text: commentText,
      user: username,
      time: new Date().toLocaleString(),
    };
    report.comments.unshift(localComment);
    report.newComment = "";
    setReports(updated);

    const serverComment = {
      text: commentText,
      user: username,
      userId,
      timestamp: new Date().toISOString(),
      pinned: false,
    };

    try {
      await fetch(`${API_URL}/api/reports/${reportId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serverComment),
      });
      fetchReports();
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const isReportOwner = (reportUsername) => {
    return currentUsername && reportUsername &&
      currentUsername.toLowerCase() === reportUsername.toLowerCase();
  };

  const handlePinComment = async (reportId, reportUsername, comment) => {
    if (!isReportOwner(reportUsername)) {
      Alert.alert("Unauthorized", "Only the report owner can pin comments.", [{ text: "OK" }]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (response.ok) {
        fetchReports();
      } else {
        Alert.alert("Error", "Failed to pin comment");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to pin comment");
    }
  };

  const handleUnpinComment = async (reportId, reportUsername) => {
    if (!isReportOwner(reportUsername)) {
      Alert.alert("Unauthorized", "Only the report owner can unpin comments.", [{ text: "OK" }]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/unpin`, { method: 'POST' });
      if (response.ok) {
        fetchReports();
      } else {
        Alert.alert("Error", "Failed to unpin comment");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to unpin comment");
    }
  };

  const filtered = useMemo(() => {
    if (!searchText.trim()) return reports;
    return reports.filter((r) =>
      r.specieName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, reports]);

  const PlaceholderImage = () => (
    <View style={[styles.image, styles.placeholderImage]}>
      <Ionicons name="image-outline" size={50} color="#ccc" />
      <Text style={styles.placeholderText}>Image unavailable</Text>
    </View>
  );

  // ── Researcher Status Buttons ────────────────────────────────
  const ResearcherStatusButtons = ({ report }) => {
    const isMarking = markingStatus[report._id];
    const currentStatus = report.researcherStatus;

    return (
      <View style={styles.statusSection}>
        {/* Label is now black */}
        <View style={styles.statusLabelRow}>
          <Ionicons name="flask-outline" size={13} color="#1a1a1a" />
          <Text style={styles.statusLabel}>Researcher Assessment</Text>
        </View>

        <View style={styles.statusButtonsRow}>
          {STATUS_OPTIONS.map((option) => {
            const isActive = currentStatus === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor: isActive ? option.bg : '#f8f9fc',
                    borderColor: isActive ? option.border : '#e0e0e0',
                  },
                ]}
                onPress={() =>
                  !isMarking && handleMarkStatus(report._id, option.key, currentStatus)
                }
                activeOpacity={0.75}
                disabled={isMarking}
              >
                {isMarking ? (
                  <ActivityIndicator size={12} color={option.color} />
                ) : (
                  <Ionicons
                    name={isActive ? option.icon : `${option.icon}-outline`}
                    size={13}
                    color={isActive ? option.color : '#999'}
                  />
                )}
                <Text
                  style={[
                    styles.statusBtnText,
                    { color: isActive ? option.color : '#888' },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* "Marked as X by Y" banner removed */}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAwareContainer>

        {/* Header — bell icon removed */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreenR')} style={styles.menuButton}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Analyze Reports</Text>
            <Text style={styles.headerSubtitle}>Researcher Feed</Text>
          </View>

          {/* Empty view to keep title centered */}
          <View style={styles.headerRight} />
        </View>

        {/* Purple banner removed */}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search animal species..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {loading && reports.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#333" />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText.trim() ? 'No reports match your search' : 'No reports yet'}
              </Text>
              {searchText.trim() && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchButton}>
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              refreshControl={
                <RefreshControl refreshing={loading && reports.length > 0} onRefresh={fetchReports} />
              }
              renderItem={({ item }) => {
                const canPinUnpin = isReportOwner(item.username);
                const hasImageFailed = failedImages[item._id];
                const healthDotColor = getHealthDotColor(item.healthStatus);
                const locationText = item.location
                  ? (item.location.address
                    ? item.location.address
                    : `${item.location.latitude?.toFixed(3)}, ${item.location.longitude?.toFixed(3)}`)
                  : null;
                const statusConfig = item.researcherStatus ? getStatusConfig(item.researcherStatus) : null;

                return (
                  <View style={styles.card}>

                    {/* ── Image with overlay badges ── */}
                    <View style={styles.imageContainer}>
                      {item.image && !hasImageFailed ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.image}
                          onError={() => handleImageError(item._id)}
                        />
                      ) : item.image && hasImageFailed ? (
                        <PlaceholderImage />
                      ) : (
                        <View style={[styles.image, styles.placeholderImage]}>
                          <Ionicons name="image-outline" size={50} color="#ccc" />
                          <Text style={styles.placeholderText}>No image</Text>
                        </View>
                      )}

                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        style={styles.imageGradientOverlay}
                      />

                      {/* Top-left: health badge only (status badge moved below) */}
                      <View style={styles.imageBadgesRow}>
                        <View style={styles.badge}>
                          <View style={[styles.healthDot, { backgroundColor: healthDotColor }]} />
                          <Text style={styles.badgeText}>{item.healthStatus?.toUpperCase()}</Text>
                        </View>
                      </View>

                      {/* Bottom overlay */}
                      <View style={styles.imageBottomOverlay}>
                        <Text style={styles.speciesName}>{item.specieName}</Text>
                        {(locationText || item.timestamp) && (
                          <View style={styles.imageDetailRow}>
                            {locationText && (
                              <>
                                <Ionicons name="location-outline" size={9} color="#fff" />
                                <Text style={styles.imageDetailText} numberOfLines={1}>{locationText}</Text>
                              </>
                            )}
                            {locationText && item.timestamp && (
                              <Text style={styles.imageDetailSeparator}> | </Text>
                            )}
                            {item.timestamp && (
                              <Text style={styles.imageDetailText} numberOfLines={1}>{item.timestamp}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ── Card body ── */}
                    <View style={styles.cardBody}>

                      {/* Reported by row — status grey badge on right side */}
                      <View style={styles.reporterRow}>
                        <Image
                          source={{ uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                          style={styles.avatar}
                        />
                        <Text style={styles.reporterText}>
                          Reported by <Text style={styles.reporterName}>{item.username}</Text>
                        </Text>
                        {canPinUnpin && (
                          <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>Owner</Text>
                          </View>
                        )}
                        {/* Grey status badge — right side, next to reporter */}
                        {statusConfig && (
                          <View style={styles.greyStatusBadge}>
                            <Ionicons name={statusConfig.icon} size={10} color="#555" />
                            <Text style={styles.greyStatusBadgeText}>{statusConfig.label}</Text>
                          </View>
                        )}
                      </View>

                      {/* ── RESEARCHER STATUS BUTTONS ── */}
                      <ResearcherStatusButtons report={item} />

                      {/* Comments section */}
                      <View style={styles.commentsBox}>
                        <Text style={styles.commentTitle}>Comments</Text>

                        {item.pinnedComment && (
                          <View style={styles.pinnedCommentRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.commentUser}>
                                {item.pinnedComment.user}{' '}
                                <Text style={styles.pinnedLabel}>(Pinned)</Text>
                              </Text>
                              <Text style={styles.commentText}>{item.pinnedComment.text}</Text>
                            </View>
                            {canPinUnpin && (
                              <TouchableOpacity onPress={() => handleUnpinComment(item._id, item.username)}>
                                <Ionicons name="pin" size={18} color="#b45309" />
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                        <View style={styles.commentInputBox}>
                          <TextInput
                            style={styles.commentInput}
                            placeholder="Write a comment..."
                            value={item.newComment}
                            onChangeText={(t) => {
                              const newList = reports.map((r) =>
                                r._id === item._id ? { ...r, newComment: t } : r
                              );
                              setReports(newList);
                            }}
                          />
                          <TouchableOpacity onPress={() => handleAddComment(item._id)} style={styles.sendBtn}>
                            <Ionicons name="send" size={18} color="#1a1a1a" />
                          </TouchableOpacity>
                        </View>

                        {item.comments
                          .filter((c) => {
                            if (!item.pinnedComment) return true;
                            const pcId = item.pinnedComment._id || item.pinnedComment.id;
                            const cId = c._id || c.id;
                            return cId !== pcId;
                          })
                          .map((c) => (
                            <View key={c._id || c.id} style={styles.commentItem}>
                              <Ionicons name="person-circle-outline" size={22} color="#aaa" />
                              <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text style={styles.commentUser}>{c.user}</Text>
                                <Text style={styles.commentText}>{c.text}</Text>
                              </View>
                              {canPinUnpin && (
                                <TouchableOpacity onPress={() => handlePinComment(item._id, item.username, c)}>
                                  <Ionicons name="pin-outline" size={18} color="#ccc" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                      </View>
                    </View>
                  </View>
                );
              }}
              contentContainerStyle={{ paddingBottom: 70 }}
            />
          )}
        </KeyboardAvoidingView>

        <BottomNav onHomePress={() => router.push("/(tabs)/HomeScreenR")} />
      </KeyboardAwareContainer>
    </SafeAreaView>
  );
};

export default ReportsFeedR;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  headerSubtitle: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '500' },
  headerRight: { width: 40 }, // spacer to keep title centered

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#d6d9d78a',
  },
  searchInput: { flex: 1, padding: 10, marginLeft: 6, color: '#1a1a1a' },

  // Card
  card: {
    backgroundColor: '#fff',
    marginBottom: 15,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Image section
  imageContainer: { position: 'relative', width: '100%', height: 320 },
  image: { width: '100%', height: 320 },
  placeholderImage: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { marginTop: 8, color: '#aaa', fontSize: 13 },
  imageGradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140 },

  imageBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  healthDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  imageBottomOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 2,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  speciesName: { color: '#fff', fontSize: 20, fontWeight: '750', letterSpacing: 0.3 },
  imageDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'nowrap' },
  imageDetailText: { color: '#fff', fontSize: 10, marginLeft: 2, flexShrink: 1 },
  imageDetailSeparator: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginHorizontal: 2 },

  // Card body
  cardBody: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },

  // Reporter row
  reporterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  reporterText: { fontSize: 12, color: '#666', flex: 1 },
  reporterName: { fontWeight: '600', color: '#333' },
  ownerBadge: { backgroundColor: '#FFD700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  ownerBadgeText: { fontSize: 10, fontWeight: '600', color: '#000' },

  // Grey status badge (below image, right of reporter)
  greyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eeeeee',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  greyStatusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#555',
  },

  // ── Status section — neutral/grey theme ──
  statusSection: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
    padding: 12,
  },
  statusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a1a',         // black instead of purple
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Comments box
  commentsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  commentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pinnedCommentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentInputBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingLeft: 14,
    paddingVertical: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ececec',
    marginBottom: 6,
  },
  commentInput: { flex: 1, padding: 8, fontSize: 13, color: '#1a1a1a' },
  sendBtn: { padding: 8, paddingRight: 10 },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  },
  commentUser: { fontWeight: '700', fontSize: 12, color: '#333' },
  pinnedLabel: { color: '#b45309', fontSize: 11, fontWeight: '600' },
  commentText: { color: '#555', marginTop: 2, fontSize: 12 },

  // States
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 10 },
  errorText: { fontSize: 16, color: '#ff6b6b', textAlign: 'center', marginTop: 10, marginBottom: 20 },
  retryButton: { backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', marginTop: 10 },
  clearSearchButton: { marginTop: 15, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  clearSearchButtonText: { color: '#000', fontSize: 14, fontWeight: '500' },
});