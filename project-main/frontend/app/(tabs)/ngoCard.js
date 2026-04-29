
import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";

export default function NGOCard({ item, onPress }) {
  if (!item) return null; // 🔥 prevents crash

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.city}>{item.city}</Text>
      </View>

      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>

    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    fontSize: 16,
    fontWeight: "bold",
  },

  city: {
    fontSize: 12,
    color: "#7a7b70",
    backgroundColor: "#ffe9469e",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  desc: {
    marginTop: 8,
    fontSize: 12,
    color: "#555",
  },
});