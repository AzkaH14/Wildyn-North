import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_URL = 'http://172.21.247.100:5000'; // Update with your backend IP

const UserProfile = () => {
  const router = useRouter();
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    profileImage: null,
    username: '',
    email: '',
    password: '••••••••',
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    profileImage: null,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Image picker modal state
  const [imagePickerModal, setImagePickerModal] = useState(false);

  // Load profile data from storage and backend on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  // Load profile data from AsyncStorage and backend
  const loadProfileData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const savedProfileImage = await AsyncStorage.getItem('profileImage');
      
      // Load profile image from storage
      if (savedProfileImage) {
        setProfileData(prev => ({
          ...prev,
          profileImage: savedProfileImage,
        }));
      }

      // Fetch user data from backend
      if (userId) {
        try {
          const response = await fetch(`${API_URL}/api/auth/profile/${userId}`);
          const result = await response.json();

          if (response.ok && result.user) {
            setProfileData(prev => ({
              ...prev,
              username: result.user.username || prev.username,
              email: result.user.email || prev.email,
            }));

            // Update AsyncStorage with latest data
            await AsyncStorage.setItem('username', result.user.username || '');
            await AsyncStorage.setItem('userEmail', result.user.email || '');
          }
        } catch (apiError) {
          console.log('Error fetching profile from backend:', apiError);
          // Fallback to AsyncStorage if backend fails
          const savedUsername = await AsyncStorage.getItem('username');
          const savedEmail = await AsyncStorage.getItem('userEmail');
          
          if (savedUsername || savedEmail) {
            setProfileData(prev => ({
              ...prev,
              username: savedUsername || prev.username,
              email: savedEmail || prev.email,
            }));
          }
        }
      } else {
        // Fallback to AsyncStorage if no userId
        const savedUsername = await AsyncStorage.getItem('username');
        const savedEmail = await AsyncStorage.getItem('userEmail');
        
        if (savedUsername || savedEmail) {
          setProfileData(prev => ({
            ...prev,
            username: savedUsername || prev.username,
            email: savedEmail || prev.email,
          }));
        }
      }
    } catch (error) {
      console.log('Error loading profile data:', error);
    }
  };

  // Initialize edit form with current profile data
  useEffect(() => {
    if (isEditMode) {
      setEditForm({
        profileImage: profileData.profileImage,
        username: profileData.username,
        email: profileData.email,
        password: '',
        confirmPassword: '',
      });
    }
  }, [isEditMode]);

  // Request camera and media library permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera and media library permissions are required to update your profile picture.');
      return false;
    }
    return true;
  };

  // Handle image selection from camera
  const handleCameraCapture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setEditForm(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
        setImagePickerModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  // Handle image selection from gallery
  const handleGallerySelection = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setEditForm(prev => ({
          ...prev,
          profileImage: result.assets[0].uri,
        }));
        setImagePickerModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!editForm.username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return false;
    }
    
    if (!editForm.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    
    if (editForm.password && editForm.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    if (editForm.password !== editForm.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };

  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        Alert.alert('Error', 'User not logged in. Please login again.');
        setIsLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        username: editForm.username.trim(),
        email: editForm.email.trim().toLowerCase(),
      };

      // Include password only if provided
      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password.trim();
      }

      // Call backend API to update profile
      const response = await fetch(`${API_URL}/api/auth/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        // Save to AsyncStorage
        if (editForm.profileImage) {
          await AsyncStorage.setItem('profileImage', editForm.profileImage);
        }
        await AsyncStorage.setItem('username', result.user.username);
        await AsyncStorage.setItem('userEmail', result.user.email);
        
        // Update profile data
        setProfileData({
          profileImage: editForm.profileImage || profileData.profileImage,
          username: result.user.username,
          email: result.user.email,
          password: editForm.password ? '••••••••' : profileData.password,
        });
        
        setIsEditMode(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Connection Error', 'Could not connect to server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditForm({
      profileImage: null,
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/HomeScreen')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {!isEditMode ? (
          // Profile Display Mode
          <View style={styles.profileContainer}>
            {/* Profile Picture */}
            <View style={styles.profileImageContainer}>
              {profileData.profileImage ? (
                <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={60} color="#666" />
                </View>
              )}
            </View>

            {/* Profile Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Username</Text>
                <Text style={styles.detailValue}>{profileData.username}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{profileData.email}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Password</Text>
                <Text style={styles.detailValue}>{profileData.password}</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditMode(true)}
            >
              <Ionicons name="create-outline" size={20} color="#black" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Edit Profile Mode
          <View style={styles.editContainer}>
            {/* Profile Picture Edit */}
            <View style={styles.profileImageEditContainer}>
              <TouchableOpacity 
                style={styles.profileImageEdit}
                onPress={() => setImagePickerModal(true)}
              >
                {editForm.profileImage ? (
                  <Image source={{ uri: editForm.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={60} color="#666" />
                  </View>
                )}
                <View style={styles.editImageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.editImageText}>Tap to change photo</Text>
            </View>

            {/* Edit Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.username}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, username: text }))}
                  placeholder="Enter username"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.password}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.confirmPassword}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
                onPress={handleUpdateProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="black" />
                    <Text style={styles.updateButtonText}>Update Data</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Profile Picture</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleCameraCapture}
            >
              <Ionicons name="camera" size={24} color="#000" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleGallerySelection}
            >
              <Ionicons name="images" size={24} color="#000" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  container: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34, // Same width as back button for centering
  },

  // Profile display styles
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    textAlign: 'right',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    width: '100%',
  },
  editButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Edit profile styles
  editContainer: {
    padding: 20,
  },
  profileImageEditContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageEdit: {
    position: 'relative',
    marginBottom: 10,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageText: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: width * 0.8,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#000',
  },
  modalCancel: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
});

export default UserProfile;
