import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigator from "./BottomTabNavigator";
import CheckoutScreen from "../screens/CheckoutScreen";
import OrderSuccessScreen from "../screens/OrderSuccessScreen";
import OrderHistoryScreen from "../screens/OrderHistoryScreen";
import CouponScreen from "../screens/CouponScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import VerifyOTPScreen from "../screens/VerifyOTPScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import VerifyResetOTPScreen from "../screens/VerifyResetOTPScreen";
import ResetPasswordNewScreen from "../screens/ResetPasswordNewScreen";
import ProductListScreen from "../screens/ProductListScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import CategoryListScreen from "../screens/CategoryListScreen";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#4CAF50",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerifyOTP"
        component={VerifyOTPScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VerifyResetOTP"
        component={VerifyResetOTPScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ResetPasswordNew"
        component={ResetPasswordNewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CategoryList"
        component={CategoryListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Thanh Toán" }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{ title: "Lịch Sử Đơn Hàng" }}
      />
      <Stack.Screen
        name="Coupon"
        component={CouponScreen}
        options={{ title: "Phiếu Giảm Giá" }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: "Đổi Mật Khẩu",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: "Chỉnh Sửa Profile",
        }}
      />
    </Stack.Navigator>
  );
}
