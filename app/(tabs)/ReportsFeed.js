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
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import BottomNav from "../../components/BottomNav";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://172.21.244.98:5000'; // backend URL

const offensiveWords = ["badword", "ugly", "offensive"];

const ReportsFeed = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState(null);

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Refresh reports when screen comes into focus (e.g., when navigating back from homepage)
  useFocusEffect(
    React.useCallback(() => {
      fetchReports();
    }, [])
  );

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📡 Fetching reports from: ${API_URL}/api/reports`);
      
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📥 Response status: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch reports: ${res.status}`);
      }
      
      const data = await res.json();
      console.log(`✅ Received ${Array.isArray(data) ? data.length : 0} reports from database`);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        const mappedReports = data.map((r) => ({
          ...r,
          comments: r.comments || [],
          pinnedComment: r.pinnedComment || null,
          newComment: "",
        }));
        
        console.log(`📋 Displaying ${mappedReports.length} reports`);
        setReports(mappedReports);
      } else {
        console.warn('⚠️ Expected array but got:', typeof data, data);
        setReports([]);
      }
    } catch (err) {
      console.error('❌ Error fetching reports:', err);
      setError(err.message || 'Failed to load reports. Please try again.');
      setReports([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
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
      alert("Your comment contains inappropriate words.");
      return;
    }

    // Load user info for proper backend schema
    let userId = 'anonymous';
    let username = 'Community User';
    try {
      const [storedUserId, storedUsername] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('username'),
      ]);
      if (storedUserId) userId = storedUserId;
      if (storedUsername) username = storedUsername;
    } catch {}

    // Optimistic UI update
    const localComment = {
      id: Date.now().toString(),
      text: commentText,
      user: username,
      time: new Date().toLocaleString(),
    };
    report.comments.unshift(localComment);
    report.newComment = "";
    setReports(updated);

    // Send to backend with schema-compliant payload
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
      // Refresh from server to ensure DB-saved comment (with _id) appears
      fetchReports();
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const handlePinComment = async (reportId, comment) => {
    try {
      await fetch(`${API_URL}/api/reports/${reportId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      fetchReports();
    } catch (e) {
      console.error('Failed to pin comment', e);
    }
  };

  const handleUnpinComment = async (reportId) => {
    try {
      await fetch(`${API_URL}/api/reports/${reportId}/unpin`, {
        method: 'POST',
      });
      fetchReports();
    } catch (e) {
      console.error('Failed to unpin comment', e);
    }
  };

  const filtered = useMemo(() => {
    if (!searchText.trim()) return reports;
    return reports.filter((r) =>
      r.specieName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, reports]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Community Reports</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/ReportsHistory")}>
          <Ionicons name="document-text-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#555" />
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
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchReports}
            >
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
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearSearchButton}
              >
                <Text style={styles.clearSearchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl refreshing={loading && reports.length > 0} onRefresh={fetchReports} />
            }
            renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.header}>
                <Image
                  source={{
                    uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                  }}
                  style={styles.profile}
                />
                <View>
                  <Text style={styles.username}>{item.username}</Text>

                  {item.location && (
    <View style={styles.locationRow}>
      <Ionicons name="location-outline" size={14} color="#777" style={{ marginRight: 3 }} />
      <Text style={styles.location}>
        {item.location.address
          ? item.location.address
          : `${item.location.latitude?.toFixed(3)}, ${item.location.longitude?.toFixed(3)}`}

      </Text>

    </View>
  )}

                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                </View>
              </View>

              {item.image && (
                <Image source={{ uri: item.image }} style={styles.image} />
              )}
              <Text style={styles.caption}>
                <Text style={{ fontWeight: "700" }}>{item.specieName}</Text> •{" "}
                {item.healthStatus}
              </Text>

              <Text style={styles.commentTitle}>Comments</Text>
              {/* Pinned comment at top */}
              {item.pinnedComment && (
                <View style={[styles.commentItem, { backgroundColor: "#fff7da" }]}>
                  <Ionicons name="pin" size={18} color="grey" />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    <Text style={styles.commentUser}>
                      {item.pinnedComment.user} (Pinned)
                    </Text>
                    <Text style={styles.commentText}>
                      {item.pinnedComment.text}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleUnpinComment(item._id)}>
                    <Ionicons name="pin" size={20} color="#b45309" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Add comment input */}
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
  <TouchableOpacity
    onPress={() => handleAddComment(item._id)}
    style={styles.sendBtn}
  >
    <Ionicons name="send" size={18} color="#fff" />
  </TouchableOpacity>
</View>

              {/* Other comments */}
              {item.comments
                .filter((c) => {
                  if (!item.pinnedComment) return true;
                  const pcId = item.pinnedComment._id || item.pinnedComment.id;
                  const cId = c._id || c.id;
                  return cId !== pcId;
                })
                .map((c) => (
                  <View key={(c._id || c.id)} style={styles.commentItem}>
                    <Ionicons name="person-circle-outline" size={24} color="#555" />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.commentUser}>{c.user}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handlePinComment(item._id, c)}>
                      <Ionicons name="pin-outline" size={20} color="grey" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 70 }}
        />
        )}
      </KeyboardAvoidingView>

      <BottomNav onHomePress={() => router.push("/(tabs)/HomeScreen")} />
      </SafeAreaView>
  );
};

export default ReportsFeed;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  wrapper: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  topTitle: { fontSize: 20, fontWeight: "600", color: "#000" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 25,
  },
  searchInput: { flex: 1, padding: 8, marginLeft: 5 },
  card: {
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", padding: 10 },
  profile: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: "700" },
  location: { fontSize: 12, color: "#777" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  timestamp: { fontSize: 12, color: "#777" },
  image: { width: "100%", height: 500 },
  caption: { paddingHorizontal: 12, paddingVertical: 8 },
  commentTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: 12,
    marginTop: 6,
  },
  commentInputBox: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    margin: 10,
    borderRadius: 25,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  commentInput: { flex: 1, padding: 8 },
  sendBtn: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 20,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  commentUser: { fontWeight: "700" },
  commentText: { color: "#333", marginTop: 2 },

  sendBtn: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 20,
    size:10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  clearSearchButton: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});
