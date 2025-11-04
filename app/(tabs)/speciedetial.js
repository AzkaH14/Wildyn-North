// SpeciesDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SpeciesDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse the species data from params
  const species = params.species ? JSON.parse(params.species) : null;

  if (!species) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Species not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{species.commonName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Species Image */}
        <Image 
          source={{ uri: species.imageUri || 'https://via.placeholder.com/400x300' }} 
          style={styles.detailImage} 
        />

        {/* Featured Info Box (Green) */}
        <View style={styles.featuredBox}>
          <Text style={styles.featuredTitle}>{species.commonName}</Text>
          <Text style={styles.featuredSubtitle}>{species.scientificName}</Text>
          {species.urduName && (
            <Text style={styles.featuredUrdu}>{species.urduName}</Text>
          )}
        </View>

        {/* Species Information Card */}
        <View style={styles.detailCard}>
          {species.family && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Family:</Text>
              <Text style={styles.infoValue}>{species.family}</Text>
            </View>
          )}

          {species.conservationStatus && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Conservation Status:</Text>
              <Text style={[styles.infoValue, styles.statusValue]}>
                {species.conservationStatus}
              </Text>
            </View>
          )}

          {species.description && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Description</Text>
              <Text style={styles.detailSectionText}>{species.description}</Text>
            </View>
          )}

          {species.habitat && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Habitat</Text>
              <Text style={styles.detailSectionText}>{species.habitat}</Text>
            </View>
          )}

          {species.distribution && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Distribution</Text>
              <Text style={styles.detailSectionText}>{species.distribution}</Text>
            </View>
          )}

          {species.createdAt && (
            <View style={styles.metaInfo}>
              <Ionicons name="calendar-outline" size={16} color="#999" />
              <Text style={styles.metaText}>
                Added: {new Date(species.createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: 250,
  },
  featuredBox: {
    backgroundColor: '#406040',
    padding: 20,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  featuredSubtitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#FFF',
    marginBottom: 4,
  },
  featuredUrdu: {
    fontSize: 16,
    color: '#FFF',
  },
  detailCard: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginRight: 6,
  },
  infoValue: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  statusValue: {
    fontWeight: '500',
  },
  detailSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  detailSectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  metaText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
});