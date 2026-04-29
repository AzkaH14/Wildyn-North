
import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import NGOCard from "./ngoCard";
import { ngoData } from "../../data/ngoData";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, Text } from "react-native";


export default function NGOListScreen() {
  const router = useRouter();

return (
  <View style={styles.container}>

    {/* Header */}
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')}>
        <Ionicons name="arrow-back" size={26} color="#1a1a1a" />
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>NGOs</Text>
        <Text style={styles.headerSubtitle}>    Emergency Contact</Text>
      </View>

      <View style={{ width: 26 }} />
    </View>

    <FlatList
     contentContainerStyle={{ 
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20, }}
      data={ngoData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <NGOCard
          item={item}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/NGODetailScreen",
              params: { ngo: JSON.stringify(item) },
            })
          }
        />
      )}
    />

  </View>
);
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    
    backgroundColor: "#f4f6f8e9",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 27,
    marginBottom: 1,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },

  

});