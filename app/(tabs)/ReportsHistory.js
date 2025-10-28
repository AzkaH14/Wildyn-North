// app/(tabs)/ReportsHistory.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useFocusEffect } from "@react-navigation/native"; // ✅ Works fine in Expo Router too
import { useCallback } from "react";


const API_URL = "http://192.168.100.59:5000"; // your backend

const ReportsHistory = () => {
  const router = useRouter();
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMyReports(); // Re-fetch every time user navigates back to History
    }, [])
  );

  const fetchMyReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/myreports`);
      const data = await response.json();
      if (response.ok) setMyReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/reports/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                setMyReports(myReports.filter((r) => r._id !== id));
                Alert.alert("Deleted", "Report removed successfully.");
              } else {
                Alert.alert("Error", "Failed to delete report.");
              }
            } catch (error) {
              Alert.alert("Error", "Something went wrong.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.profile}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>

        {/* Delete Button */}
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={22} color="red" />
        </TouchableOpacity>
      </View>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.reportImage} />
      )}
      <Text style={styles.caption}>
        <Text style={{ fontWeight: "700" }}>{item.specieName}</Text> •{" "}
        {item.healthStatus}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Uploaded Reports</Text>

      <FlatList
        data={myReports}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMyReports} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>You haven’t uploaded any reports yet.</Text>
        }
      />

      <BottomNav onHomePress={() => router.push("/(tabs)/HomeScreen")} />
    </View>
  );
};

export default ReportsHistory;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 10 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 10,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  profile: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontWeight: "700" },
  timestamp: { fontSize: 12, color: "#777" },
  reportImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  caption: { fontSize: 15, color: "#333" },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },
});
