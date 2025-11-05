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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.subtitle}>Educational Details</Text>

            <TextInput
              style={[styles.input, errors.highestDegree && styles.inputError]}
              placeholder="Highest Degree (e.g., PhD, Masters) *"
              value={formData.highestDegree}
              onChangeText={(text) => handleInputChange('highestDegree', text)}
              placeholderTextColor="#999"
            />
            {errors.highestDegree ? <Text style={styles.errorText}>{errors.highestDegree}</Text> : null}

            <TextInput
              style={[styles.input, errors.fieldOfStudy && styles.inputError]}
              placeholder="Field of Study *"
              value={formData.fieldOfStudy}
              onChangeText={(text) => handleInputChange('fieldOfStudy', text)}
              placeholderTextColor="#999"
            />
            {errors.fieldOfStudy ? <Text style={styles.errorText}>{errors.fieldOfStudy}</Text> : null}

            <TextInput
              style={[styles.input, errors.institution && styles.inputError]}
              placeholder="Institution/University *"
              value={formData.institution}
              onChangeText={(text) => handleInputChange('institution', text)}
              placeholderTextColor="#999"
            />
            {errors.institution ? <Text style={styles.errorText}>{errors.institution}</Text> : null}

            <TextInput
              style={[styles.input, errors.graduationYear && styles.inputError]}
              placeholder="Graduation Year *"
              value={formData.graduationYear}
              onChangeText={(text) => handleInputChange('graduationYear', text)}
              keyboardType="numeric"
              maxLength={4}
              placeholderTextColor="#999"
            />
            {errors.graduationYear ? <Text style={styles.errorText}>{errors.graduationYear}</Text> : null}

            <TextInput
              style={[styles.input, errors.specialization && styles.inputError]}
              placeholder="Specialization *"
              value={formData.specialization}
              onChangeText={(text) => handleInputChange('specialization', text)}
              placeholderTextColor="#999"
            />
            {errors.specialization ? <Text style={styles.errorText}>{errors.specialization}</Text> : null}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Certifications (Optional)"
              value={formData.certifications}
              onChangeText={(text) => handleInputChange('certifications', text)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleDone}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>NEXT</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 0,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 32,
    paddingTop: 60,
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  button: {
    width: '100%',
    backgroundColor: '#FFD500',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 1,
  },
});

export default ResearcherEducationScreen;