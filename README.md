# App Client - React Native Expo

Ứng dụng mobile cho khách hàng được xây dựng bằng React Native và Expo.

## Cấu trúc dự án

```
app_client/
├── components/          # Các component tái sử dụng
├── contexts/           # React Context (AuthContext, CartContext, etc.)
│   └── AuthContext.js  # Quản lý authentication state
├── navigation/         # Cấu hình navigation
│   ├── AppNavigator.js    # Root navigator
│   ├── AuthNavigator.js   # Auth stack (Login, Signup, etc.)
│   └── MainNavigator.js   # Main app stack
├── screens/           # Các màn hình
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── VerifyOTPScreen.js
│   ├── ForgotPasswordScreen.js
│   ├── ResetPasswordScreen.js
│   ├── ChangePasswordScreen.js
│   ├── HomeScreen.js
│   ├── CartScreen.js
│   ├── RecipeScreen.js
│   ├── ProfileScreen.js
│   ├── CheckoutScreen.js
│   ├── OrderHistoryScreen.js
│   └── CouponScreen.js
├── services/          # API services
│   ├── api.js         # Axios instance với interceptors
│   └── authService.js # Authentication API calls
├── utils/            # Utilities & constants
│   ├── constants.js  # App constants (colors, sizes, etc.)
│   └── helpers.js    # Helper functions
├── App.js            # Root component
└── package.json      # Dependencies

```

## Cài đặt

1. Cài đặt dependencies:
```bash
cd app_client
npm install
```

2. Cấu hình API:
   - Mở file `services/api.js`
   - Thay đổi `API_HOST` thành IP của máy tính chạy API server
   - Tìm IP bằng lệnh: `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)

## Chạy ứng dụng

```bash
# Start Expo server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## Tính năng đã implement

### Authentication (Đã hoàn thành)
- ✅ Đăng nhập (Login) - Call API thực
- ✅ Đăng ký (Signup) - Call API thực
- ✅ Xác thực OTP (Verify OTP) - Call API thực
- ✅ Quên mật khẩu (Forgot Password) - Call API thực
- ✅ Đặt lại mật khẩu (Reset Password) - Call API thực
- ✅ Đổi mật khẩu (Change Password) - Call API thực
- ✅ Đăng xuất (Logout)

### Các màn hình chính (Placeholder)
- 🔲 Home - "...will be implemented here."
- 🔲 Cart - "...will be implemented here."
- 🔲 Recipe - "...will be implemented here."
- 🔲 Profile - "...will be implemented here." (có nút Logout và Change Password)
- 🔲 Checkout - "...will be implemented here."
- 🔲 Order History - "...will be implemented here."
- 🔲 Coupon - "...will be implemented here."

## API Endpoints

Backend API đang chạy tại: `http://{API_HOST}:3000/api/v1`

### Auth Endpoints
- `POST /auth/signin` - Đăng nhập
- `POST /auth/signup` - Đăng ký
- `POST /auth/verify-otp` - Xác thực OTP
- `POST /auth/resend-otp` - Gửi lại OTP
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/verify-password-reset-otp` - Xác thực OTP reset password
- `POST /auth/reset-password` - Đặt lại mật khẩu
- `POST /auth/change-password` - Đổi mật khẩu (yêu cầu authentication)
- `GET /auth/me` - Lấy thông tin user hiện tại
- `POST /auth/logout` - Đăng xuất

## Dependencies

```json
{
  "@expo/vector-icons": "^15.0.3",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-navigation/native": "^7.0.18",
  "@react-navigation/native-stack": "^7.2.0",
  "axios": "^1.13.2",
  "expo": "~54.0.32",
  "expo-constants": "~18.0.13",
  "expo-status-bar": "~3.0.9",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0"
}
```

## Ghi chú

- Không sử dụng mock data
- Tất cả authentication đều call API thực từ backend
- UI được thiết kế dựa trên SMart_Mobile project
- Sử dụng React Navigation thay vì Expo Router
- Cấu trúc code chuẩn React Native Expo: utils, navigation, components, screens, services

## Troubleshooting

### Lỗi kết nối API
1. Kiểm tra API server đang chạy: `http://localhost:3000`
2. Kiểm tra IP trong `services/api.js` có đúng không
3. Kiểm tra firewall có block port 3000 không
4. Nếu dùng Android emulator, có thể dùng IP `10.0.2.2` thay vì IP máy

### Lỗi "Network Error"
- Đảm bảo thiết bị mobile và máy tính đang cùng mạng WiFi
- Thử ping IP từ thiết bị để kiểm tra kết nối
# SMart_Mobile_Client
