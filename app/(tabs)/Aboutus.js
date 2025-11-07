import React from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const Aboutus = () => {
  const router = useRouter();

  const features = [
    {
      icon: 'eye',
      title: 'Wildlife Monitoring',
      description: 'Track and document endangered species across Pakistan through community reports.',
      color: '#e8f5e9',
      iconColor: '#2d6a4f',
    },
    {
      icon: 'people',
      title: 'Community Engagement',
      description: 'Empower local communities to participate actively in conservation efforts.',
      color: '#e3f2fd',
      iconColor: '#1565c0',
    },
    {
      icon: 'analytics',
      title: 'Data Analysis',
      description: 'Researchers analyze reports to make informed conservation decisions.',
      color: '#fff3e0',
      iconColor: '#ef6c00',
    },
    {
      icon: 'shield-checkmark',
      title: 'Species Protection',
      description: 'Collaborate with authorities to protect endangered wildlife habitats.',
      color: '#fce4ec',
      iconColor: '#c2185b',
    },
  ];

  const team = [
    {
      name: 'Conservation Team',
      role: 'Wildlife Experts',
      icon: 'leaf',
    },
    {
      name: 'Research Team',
      role: 'Data Scientists',
      icon: 'flask',
    },
    {
      name: 'Community Team',
      role: 'Outreach Coordinators',
      icon: 'people',
    },
  ];

  const stats = [
    { number: '5,000+', label: 'Reports Submitted', icon: 'document-text' },
    { number: '50+', label: 'Species Tracked', icon: 'paw' },
    { number: '1,000+', label: 'Active Users', icon: 'people' },
    { number: '10+', label: 'Partner Organizations', icon: 'business' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back('/(tabs)/HomeScreen')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>About Us</Text>
          <Text style={styles.headerSubtitle}>Wildlife Conservation</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#1b4332', '#2d6a4f', '#40916c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroContainer}
        >
          <Ionicons name="planet" size={56} color="#FFD700" />
          <Text style={styles.heroTitle}>Protecting Pakistan's Wildlife</Text>
          <Text style={styles.heroText}>
            A community-driven platform dedicated to the conservation and protection of endangered species across Pakistan.
          </Text>
        </LinearGradient>

        {/* Mission Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={24} color="#2d6a4f" />
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.missionText}>
              To create a collaborative ecosystem where communities, researchers, and conservation authorities work together to protect and preserve Pakistan's rich biodiversity through technology-enabled monitoring and data-driven decision making.
            </Text>
          </View>
        </View>

        {/* Vision Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color="#2d6a4f" />
            <Text style={styles.sectionTitle}>Our Vision</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.missionText}>
              A Pakistan where wildlife thrives in harmony with local communities, where every citizen is empowered to contribute to conservation, and where data-driven insights lead to effective protection of endangered species for future generations.
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Impact</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons name={stat.icon} size={28} color="#2d6a4f" />
                <Text style={styles.statNumber}>{stat.number}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Do</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon} size={32} color={feature.iconColor} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <View style={styles.teamGrid}>
            {team.map((member, index) => (
              <View key={index} style={styles.teamCard}>
                <View style={styles.teamIconWrapper}>
                  <Ionicons name={member.icon} size={32} color="#2d6a4f" />
                </View>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Values Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <View style={styles.valuesContainer}>
            <View style={styles.valueItem}>
              <Ionicons name="checkmark-circle" size={24} color="#2d6a4f" />
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>Community First</Text>
                <Text style={styles.valueText}>Empowering local communities to lead conservation efforts</Text>
              </View>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="checkmark-circle" size={24} color="#2d6a4f" />
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>Data-Driven</Text>
                <Text style={styles.valueText}>Using technology and analytics for informed decisions</Text>
              </View>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="checkmark-circle" size={24} color="#2d6a4f" />
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>Transparency</Text>
                <Text style={styles.valueText}>Open communication and accountability in all our actions</Text>
              </View>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="checkmark-circle" size={24} color="#2d6a4f" />
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>Sustainability</Text>
                <Text style={styles.valueText}>Long-term solutions that benefit both wildlife and communities</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={['#f0f4f1', '#e8f5e9']}
            style={styles.contactCard}
          >
            <Text style={styles.contactTitle}>Get In Touch</Text>
            <Text style={styles.contactText}>
              Want to learn more or collaborate with us?
            </Text>
            <TouchableOpacity style={styles.contactButton} onPress={() => router.push('/(tabs)/Feedback')}>
              <Ionicons name="mail" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Contact Us</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="leaf" size={32} color="#2d6a4f" />
          <Text style={styles.footerText}>
            Together, we can protect Pakistan's wildlife for generations to come.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  container: {
    paddingBottom: 40,
  },

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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
  },

  // Hero Section
  heroContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 14,
    color: '#e8f5e9',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  missionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d6a4f',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Features
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Team
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  teamCard: {
    flex: 1,
    minWidth: (width - 52) / 3 - 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  teamIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f4f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },

  // Values
  valuesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  valueItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Contact
  contactCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d6a4f',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});

export default Aboutus;