import React, { useState, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import KeyboardAwareContainer from '../../assets/components/KeyboardAwareContainer';
import { useRouter } from 'expo-router';

const API_URL = 'http://192.168.100.2:5000';

const UserProfile = () => {
  const router = useRouter();

  const [profileData, setProfileData] = useState({
    profileImage: null,
    username: '',
    email: '',
    password: '••••••••',
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePickerModal, setImagePickerModal] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [editForm, setEditForm] = useState({
    profileImage: null,
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  // ================= BACK NAVIGATION (userType check) =================
  const handleBack = async () => {
    try {
      const userType = await AsyncStorage.getItem('userType');
      if (userType === 'researcher') {
        router.replace('/(tabs)/HomeScreenR');
      } else {
        router.replace('/(tabs)/HomeScreen');
      }
    } catch (_) {
      router.replace('/(tabs)/HomeScreen');
    }
  };

  // ================= LOAD PROFILE =================
  const loadProfileData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const storedUsername = await AsyncStorage.getItem('username');
      const profileUrl = userId
        ? `${API_URL}/api/auth/profile/${userId}`
        : storedUsername
          ? `${API_URL}/api/auth/profile-by-username/${encodeURIComponent(storedUsername)}`
          : null;

      if (!profileUrl) return;

      const response = await fetch(profileUrl);
      const result = await response.json();

      if (response.ok && result.user) {
        const { username, email, profileImage, imageType } = result.user;

        const dataUri = profileImage
          ? `data:${imageType || 'image/jpeg'};base64,${profileImage}`
          : null;

        await AsyncStorage.setItem('profileImage', dataUri || '');
        await AsyncStorage.setItem('username', username || '');
        await AsyncStorage.setItem('userEmail', email || '');
        if (result.user._id) {
          await AsyncStorage.setItem('userId', result.user._id);
        }

        setProfileData({
          profileImage: dataUri,
          username,
          email,
          password: '••••••••',
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ================= PERMISSIONS =================
  const requestPermissions = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cam.status !== 'granted' || media.status !== 'granted') {
      Alert.alert('Permission required');
      return false;
    }
    return true;
  };

  // ================= IMAGE TO BASE64 =================
  const getImageMimeType = (asset) => {
    if (asset?.mimeType) return asset.mimeType;

    const source = `${asset?.fileName || ''} ${asset?.uri || ''}`.toLowerCase();
    if (source.includes('.png')) return 'image/png';
    if (source.includes('.webp')) return 'image/webp';
    if (source.includes('.gif')) return 'image/gif';

    return 'image/jpeg';
  };

  // ================= PICK IMAGE =================
  const pickImage = async (type) => {
    const ok = await requestPermissions();
    if (!ok) return;

    const result =
      type === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
            base64: true,
          });

    if (!result.canceled) {
      const selectedAsset = result.assets?.[0];

      if (!selectedAsset?.base64) {
        Alert.alert('Error', 'Unable to process selected image. Please try again.');
        return;
      }

      const mimeType = getImageMimeType(selectedAsset);
      const dataUri = `data:${mimeType};base64,${selectedAsset.base64}`;
      setEditForm((p) => ({ ...p, profileImage: dataUri }));
      setImagePickerModal(false);
    }
  };

  // ================= EDIT MODE =================
  const handleEditMode = () => {
    setEditForm({
      profileImage: profileData.profileImage,
      username: profileData.username,
      email: profileData.email,
      password: '',
      confirmPassword: '',
    });
    setIsEditMode(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // ================= UPDATE PROFILE =================
  const handleUpdateProfile = async () => {
    if (!editForm.username || !editForm.email) {
      Alert.alert('Fill required fields');
      return;
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      Alert.alert('Passwords not match');
      return;
    }

    setIsLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');

      const updateData = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
      };

      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const imageChanged = editForm.profileImage !== profileData.profileImage;

      if (imageChanged && editForm.profileImage) {
        const match = editForm.profileImage.match(/^data:(.+);base64,(.+)$/);

        if (match) {
          updateData.imageType = match[1];
          updateData.profileImage = match[2];
        }
      }

      const response = await fetch(`${API_URL}/api/auth/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        const savedImage = result.user.profileImage
          ? `data:${result.user.imageType};base64,${result.user.profileImage}`
          : null;

        await AsyncStorage.setItem('profileImage', savedImage || '');

        setProfileData({
          profileImage: savedImage,
          username: result.user.username,
          email: result.user.email,
          password: editForm.password ? '••••••••' : profileData.password,
        });

        setIsEditMode(false);
        Alert.alert('Success');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      Alert.alert('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= UI =================
  return (
    <KeyboardAwareContainer>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar hidden={false} backgroundColor="#fff" barStyle="dark-content" />

        {/* Header */}
        <View style={styles.header}>
          {/* ✅ FIXED: handleBack checks userType and navigates correctly */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {!isEditMode ? (
            <View style={styles.profileContainer}>
              {/* Profile Picture */}
              <View style={styles.profileImageContainer}>
                {profileData.profileImage ? (
                  <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={60} color="#999" />
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

              <TouchableOpacity style={styles.editButton} onPress={handleEditMode}>
                <Ionicons name="create-outline" size={20} color="#000000ff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editContainer}>
              {/* Editable Profile Picture */}
              <View style={styles.profileImageEditContainer}>
                <TouchableOpacity onPress={() => setImagePickerModal(true)} activeOpacity={0.8}>
                  {editForm.profileImage ? (
                    <Image source={{ uri: editForm.profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Ionicons name="person" size={60} color="#999" />
                    </View>
                  )}
                  <View style={styles.cameraIconBadge}>
                    <Ionicons name="camera" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Edit Fields */}
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.username}
                    onChangeText={(t) => setEditForm((p) => ({ ...p, username: t }))}
                    placeholder="Enter username"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.email}
                    onChangeText={(t) => setEditForm((p) => ({ ...p, email: t }))}
                    placeholder="Enter email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={editForm.password}
                      onChangeText={(t) => setEditForm((p) => ({ ...p, password: t }))}
                      placeholder="Enter new password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconInInput}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={editForm.confirmPassword}
                      onChangeText={(t) => setEditForm((p) => ({ ...p, confirmPassword: t }))}
                      placeholder="Confirm new password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconInInput}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditMode(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdateProfile}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#000000ff" />
                      <Text style={styles.updateButtonText}>Update Profile</Text>
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
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Profile Picture</Text>

              <TouchableOpacity style={styles.modalOption} onPress={() => pickImage('camera')}>
                <Ionicons name="camera" size={24} color="#1a5f3a" />
                <Text style={styles.modalOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={() => pickImage('gallery')}>
                <Ionicons name="images" size={24} color="#1a5f3a" />
                <Text style={styles.modalOptionText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setImagePickerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAwareContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { flexGrow: 1, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 34 },
  profileContainer: { alignItems: 'center', padding: 24 },
  profileImageContainer: { marginBottom: 32, marginTop: 16 },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 16, color: '#1a1a1a', fontWeight: '500' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
  },
  editButtonText: { color: '#000000ff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  editContainer: { padding: 24 },
  profileImageEditContainer: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a5f3a',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
  },
  formContainer: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  passwordInputContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  passwordInput: { flex: 1, fontSize: 16, color: '#1a1a1a', paddingVertical: 14 },
  eyeIconInInput: { padding: 5 },
  actionButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: '#666', fontWeight: '600', fontSize: 15 },
  updateButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  updateButtonText: { color: '#000000ff', fontWeight: '600', fontSize: 15, marginLeft: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 12,
  },
  modalOptionText: { fontSize: 16, color: '#1a1a1a', marginLeft: 16, fontWeight: '500' },
  modalCancelButton: { padding: 16, alignItems: 'center', marginTop: 8 },
  modalCancelText: { fontSize: 16, color: '#666', fontWeight: '600' },
});

export default UserProfile;
