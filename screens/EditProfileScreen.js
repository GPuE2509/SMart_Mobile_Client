import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import profileService from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: {
      street: '',
      ward: '',
      district: '',
      city: '',
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getMyProfile();
      setFormData({
        full_name: response.data.full_name || '',
        phone: response.data.phone || '',
        address: {
          street: response.data.address?.street || '',
          ward: response.data.address?.ward || '',
          district: response.data.address?.district || '',
          city: response.data.address?.city || '',
        },
      });
      // Set avatar if exists
      if (response.data.avatar_url) {
        setAvatarUri(response.data.avatar_url);
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Cần quyền truy cập',
        'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setAvatarChanged(true);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Cần quyền truy cập',
        'Vui lòng cấp quyền truy cập camera để tiếp tục'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setAvatarChanged(true);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Chọn ảnh đại diện',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        {
          text: 'Chụp ảnh mới',
          onPress: takePhoto,
        },
        {
          text: 'Chọn từ thư viện',
          onPress: pickImage,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const uploadAvatar = async (imageUri) => {
    try {
      const fileName = imageUri.split('/').pop();
      const fileType = fileName.split('.').pop();
      
      const imageFile = {
        uri: imageUri,
        type: `image/${fileType}`,
        fileName: fileName,
      };

      await profileService.uploadProfileImage(imageFile);
      setAvatarChanged(false);
      return true;
    } catch (error) {
      throw error;
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.full_name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }

    if (!validatePhone(formData.phone)) {
      Alert.alert(
        'Lỗi',
        'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)'
      );
      return;
    }

    try {
      setLoading(true);

      // Upload avatar first if changed
      if (avatarChanged && avatarUri) {
        setUploadingImage(true);
        try {
          await uploadAvatar(avatarUri);
        } catch (error) {
          setUploadingImage(false);
          Alert.alert('Lỗi', 'Không thể upload ảnh đại diện. Tiếp tục cập nhật thông tin khác?', [
            {
              text: 'Hủy',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
                return;
              },
            },
            {
              text: 'Tiếp tục',
            },
          ]);
          // Don't return, continue with profile update
        } finally {
          setUploadingImage(false);
        }
      }

      // Update profile data
      const response = await profileService.updateMyProfile(formData);
      
      // Update user in AuthContext
      if (updateProfile) {
        await updateProfile(response.data);
      }

      Alert.alert('Thành công', 'Cập nhật profile thành công!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật profile');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  if (loading && !formData.full_name) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={showImageOptions}
                disabled={loading || uploadingImage}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-circle" size={120} color="#4CAF50" />
                )}
                <View style={styles.avatarEditBadge}>
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera" size={20} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={showImageOptions}
                disabled={loading || uploadingImage}
              >
                <Text style={styles.changeAvatarText}>
                  {avatarUri ? 'Thay đổi ảnh đại diện' : 'Thêm ảnh đại diện'}
                </Text>
              </TouchableOpacity>
              {avatarChanged && (
                <Text style={styles.avatarChangedHint}>
                  Ảnh sẽ được cập nhật khi bạn lưu thay đổi
                </Text>
              )}
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Họ và tên <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập họ và tên"
                    value={formData.full_name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, full_name: text })
                    }
                    maxLength={255}
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Số điện thoại <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số điện thoại (VD: 0901234567)"
                    value={formData.phone}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phone: text })
                    }
                    keyboardType="phone-pad"
                    maxLength={20}
                  />
                </View>
                <Text style={styles.hint}>
                  Số điện thoại phải có 10 số, bắt đầu bằng 03, 05, 07, 08, 09
                </Text>
              </View>

              {/* Email (Read-only) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputContainer, styles.inputDisabled]}>
                  <Ionicons name="mail-outline" size={20} color="#999" />
                  <TextInput
                    style={[styles.input, styles.textDisabled]}
                    value={user?.email || ''}
                    editable={false}
                  />
                </View>
                <Text style={styles.hint}>Email không thể thay đổi</Text>
              </View>

              {/* Address Section */}
              <Text style={styles.sectionTitle}>Địa chỉ</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số nhà, tên đường</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="home-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số nhà, tên đường"
                    value={formData.address.street}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: text },
                      })
                    }
                    maxLength={500}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phường/Xã</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập phường/xã"
                    value={formData.address.ward}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, ward: text },
                      })
                    }
                    maxLength={255}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Quận/Huyện</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập quận/huyện"
                    value={formData.address.district}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, district: text },
                      })
                    }
                    maxLength={255}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tỉnh/Thành phố</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tỉnh/thành phố"
                    value={formData.address.city}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: text },
                      })
                    }
                    maxLength={255}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                    <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  avatarSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changeAvatarText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  avatarChangedHint: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 4,
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  textDisabled: {
    color: '#999',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
