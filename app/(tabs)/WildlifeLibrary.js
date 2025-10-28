import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../components/BottomNav';

export default function WildlifeLibrary() {
  const router = useRouter();
  const [facts, setFacts] = useState([]);

  // Simulate empty state for now
  useEffect(() => {
    // In future, fetch from API here
    // For now, keep it empty
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Wildlife Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {facts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Wildlife Data</Text>
            <Text style={styles.emptyText}>
              No wildlife information has been uploaded yet.
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => console.log('Add wildlife data')}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Wildlife Data</Text>
            </TouchableOpacity>
          </View>
        ) : (
          facts.map((item) => (
            <View key={item._id} style={styles.card}>
              <Image 
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }} 
                style={styles.image} 
              />
              <Text style={styles.name}>{item.name}</Text>
              <Text>Habitat: {item.habitat}</Text>
              <Text>Behavior: {item.behavior}</Text>
              <Text>Interesting: {item.interestingFacts}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav onHomePress={() => router.push('/(tabs)/HomeScreen')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
