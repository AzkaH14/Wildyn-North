import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const ResearcherEducationScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    highestDegree: '',
    fieldOfStudy: '',
    institution: '',
    graduationYear: '',
    certifications: '',
    specialization: '',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.highestDegree.trim()) {
      newErrors.highestDegree = 'Highest degree is required';
    }
    
    if (!formData.fieldOfStudy.trim()) {
      newErrors.fieldOfStudy = 'Field of study is required';
    }
    
    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution/University is required';
    }
    
    if (!formData.graduationYear.trim()) {
      newErrors.graduationYear = 'Graduation year is required';
    } else {
      const year = parseInt(formData.graduationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear) {
        newErrors.graduationYear = 'Please enter a valid year';
      }
    }
    
    if (!formData.specialization.trim()) {
      newErrors.specialization = 'Specialization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDone = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    // Store education data temporarily for signup
    AsyncStorage.setItem('researcherEducationData', JSON.stringify(formData));
    AsyncStorage.setItem('userType', 'researcher');
    
    // Navigate to Signup screen
    router.push('/(tabs)/Signup');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF9E6', '#FFFFFF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🎓</Text>
            </View>
            <Text style={styles.title}>Educational Background</Text>
            <Text style={styles.description}>
              Help us understand your academic journey
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Academic Credentials</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Highest Degree</Text>
                <TextInput
                  style={[styles.input, errors.highestDegree && styles.inputError]}
                  placeholder="e.g., PhD, Masters, Bachelors"
                  value={formData.highestDegree}
                  onChangeText={(text) => handleInputChange('highestDegree', text)}
                  placeholderTextColor="#999"
                />
                {errors.highestDegree ? <Text style={styles.errorText}>{errors.highestDegree}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Field of Study</Text>
                <TextInput
                  style={[styles.input, errors.fieldOfStudy && styles.inputError]}
                  placeholder="e.g., Computer Science, Biology"
                  value={formData.fieldOfStudy}
                  onChangeText={(text) => handleInputChange('fieldOfStudy', text)}
                  placeholderTextColor="#999"
                />
                {errors.fieldOfStudy ? <Text style={styles.errorText}>{errors.fieldOfStudy}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Institution</Text>
                <TextInput
                  style={[styles.input, errors.institution && styles.inputError]}
                  placeholder="Your university or institution"
                  value={formData.institution}
                  onChangeText={(text) => handleInputChange('institution', text)}
                  placeholderTextColor="#999"
                />
                {errors.institution ? <Text style={styles.errorText}>{errors.institution}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Graduation Year</Text>
                <TextInput
                  style={[styles.input, errors.graduationYear && styles.inputError]}
                  placeholder="YYYY"
                  value={formData.graduationYear}
                  onChangeText={(text) => handleInputChange('graduationYear', text)}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholderTextColor="#999"
                />
                {errors.graduationYear ? <Text style={styles.errorText}>{errors.graduationYear}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <TextInput
                  style={[styles.input, errors.specialization && styles.inputError]}
                  placeholder="Your focus area"
                  value={formData.specialization}
                  onChangeText={(text) => handleInputChange('specialization', text)}
                  placeholderTextColor="#999"
                />
                {errors.specialization ? <Text style={styles.errorText}>{errors.specialization}</Text> : null}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Additional Qualifications</Text>
              <Text style={styles.sectionSubtext}>Optional but recommended</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Certifications</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="List any relevant certifications"
                  value={formData.certifications}
                  onChangeText={(text) => handleInputChange('certifications', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD500', '#FFC700']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginVertical: 24,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    marginRight: 8,
  },
});

export default ResearcherEducationScreen;