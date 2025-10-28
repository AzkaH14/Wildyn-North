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
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";

const API_URL = "http://192.168.100.59:5000"; // your backend URL

const offensiveWords = ["badword", "ugly", "offensive"];

const ReportsFeed = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/reports`);
      const data = await res.json();
      if (res.ok) {
        setReports(
          data.map((r) => ({
            ...r,
            comments: r.comments || [],
            pinnedComment: r.pinnedComment || null,
            newComment: "",
          }))
        );
      }
    } catch (err) {
      console.error(err);
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

    const newComment = {
      id: Date.now().toString(),
      text: commentText,
      user: "Community User",
      time: new Date().toLocaleString(),
    };

    report.comments.unshift(newComment);
    report.newComment = "";
    setReports(updated);

    try {
      await fetch(`${API_URL}/api/reports/${reportId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComment),
      });
    } catch (err) {
      console.error("Failed to post comment:", err);
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
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchReports} />
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


              {item.pinnedComment && (
                <View style={[styles.commentItem, { backgroundColor: "#fff7da" }]}>
                  <Ionicons name="star" size={18} color="gold" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.commentUser}>
                      {item.pinnedComment.user} (Pinned)
                    </Text>
                    <Text style={styles.commentText}>
                      {item.pinnedComment.text}
                    </Text>
                  </View>
                </View>
              )}

              {item.comments
                .filter((c) => c.id !== item.pinnedComment?.id)
                .map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <Ionicons name="person-circle-outline" size={24} color="#555" />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.commentUser}>{c.user}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 70 }}
        />
      </KeyboardAvoidingView>

      <BottomNav onHomePress={() => router.push("/(tabs)/HomeScreen")} />
      </SafeAreaView>
  );
};

export default ReportsFeed;

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  topTitle: { fontSize: 18, fontWeight: "700" },
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
});
