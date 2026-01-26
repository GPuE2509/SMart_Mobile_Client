import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/CartScreen";
import RecipeScreen from "../screens/RecipeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const { user } = useAuth();
  const { cartItemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "CartTab") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "RecipeTab") {
            iconName = focused ? "restaurant" : "restaurant-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "Trang Chủ",
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: "Giỏ Hàng",
          tabBarBadge: cartItemCount > 0 ? cartItemCount : null,
        }}
      />
      <Tab.Screen
        name="RecipeTab"
        component={RecipeScreen}
        options={{
          tabBarLabel: "Công Thức",
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={user ? ProfileScreen : WelcomeScreen}
        options={{
          tabBarLabel: "Cá Nhân",
        }}
      />
    </Tab.Navigator>
  );
}
