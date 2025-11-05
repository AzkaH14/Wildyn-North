import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../../components/BottomNav';

export default function ResearcherHub() {

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Researcher's Hub</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Manage surveys and wildlife data</Text>
        </View>

        {/* Cards Container */}
        <View style={styles.cardsContainer}>
          {/* Card 1 - Create Species Card */}
          <View style={styles.card}>
            <View style={[styles.cardIconContainer, { backgroundColor: 'lightgrey' }]}>
              <Ionicons name="pencil" size={32} color="black" />
            </View>
            <Text style={styles.cardTitle}>Create Species Card</Text>
            <Text style={styles.cardDescription}>
              Add new wildlife species to the database
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: '#10b981' }]}>
                Get Started
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#10b981" />
            </View>
          </View>

          {/* Card 2 - Wildlife Library */}
          <View style={styles.card}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#FFF5C2' }]}>
              <Ionicons name="library" size={32} color="#FFD700" />
            </View>
            <Text style={styles.cardTitle}>Wildlife Library</Text>
            <Text style={styles.cardDescription}>
              Browse comprehensive wildlife database
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: '#3b82f6' }]}>
                Explore
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
            </View>
          </View>

          {/* Card 3 - Upload Report */}
          <View style={styles.card}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#cedece' }]}>
              <Ionicons name="cloud-upload" size={32} color="#406040" />
            </View>
            <Text style={styles.cardTitle}>Upload Species Card</Text>
            <Text style={styles.cardDescription}>
              Upload and share your wildlife observations
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: '#f59e0b' }]}>
                Upload New
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#f59e0b" />
            </View>
          </View>

          {/* Card 4 - View Reports */}
          <View style={styles.card}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#e9d5ff' }]}>
              <Ionicons name="document-text" size={32} color="#9333ea" />
            </View>
            <Text style={styles.cardTitle}>View Reports</Text>
            <Text style={styles.cardDescription}>
              Browse all wildlife reports and observations
            </Text>
            <View style={styles.cardAction}>
              <Text style={[styles.cardActionText, { color: '#9333ea' }]}>
                View All
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#9333ea" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav active="ResLib" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#cedece',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#064e3b',
  },
  container: {
    paddingBottom: 80,
  },
  introSection: {
    padding: 20,
    paddingTop: 30,
  },
  introTitle: {
    fontSize: 16,
    color: '#047857',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardsContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#406040',
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
});