import api from './api';

const profileService = {
  // Get current user profile
  getMyProfile: async () => {
    try {
      const response = await api.get('/users/profile/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update current user profile
  updateMyProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile/me', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload profile image/avatar
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.fileName || 'avatar.jpg',
      });

      const response = await api.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout for image upload
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default profileService;
