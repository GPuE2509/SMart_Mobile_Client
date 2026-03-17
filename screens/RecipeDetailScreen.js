import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import recipeService from "../services/recipeService";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useNavigation } from "@react-navigation/native";

export default function RecipeDetailScreen({ route }) {
  const { recipeId } = route.params || {};
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();
  const { addRecipeToCart } = useCart();
  const navigation = useNavigation();

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const response = await recipeService.getById(recipeId);

      if (response.success) {
        setRecipe(response.data);
      } else {
        Alert.alert("Lỗi", response.message || "Không thể tải công thức");
      }
    } catch (error) {
      console.error("Error loading recipe detail:", error);
      Alert.alert("Lỗi", "Không thể tải chi tiết công thức");
    } finally {
      setLoading(false);
    }
  };

  const formatIngredientErrors = (errors = []) => {
    if (!Array.isArray(errors) || errors.length === 0) return "";

    const maxItems = 5;
    const lines = errors.slice(0, maxItems).map((err, index) => {
      const namePrefix = err.product_name ? `${err.product_name}: ` : "";
      return `${index + 1}. ${namePrefix}${err.message || "Không thể thêm"}`;
    });

    const moreText =
      errors.length > maxItems
        ? `\n...và ${errors.length - maxItems} nguyên liệu khác`
        : "";

    return `${lines.join("\n")}${moreText}`;
  };

  const handleAddIngredientsToCart = async () => {
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      Alert.alert("Thông báo", "Công thức này không có nguyên liệu");
      return;
    }

    if (!user) {
      Alert.alert("Yêu cầu", "Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    try {
      setCartLoading(true);
      const response = await addRecipeToCart(recipeId);
      const hasErrors = Array.isArray(response?.errors) && response.errors.length > 0;
      const errorDetails = hasErrors
        ? `\n\nKhông thể thêm:\n${formatIngredientErrors(response.errors)}`
        : "";

      if (response.success) {
        // Show success/partial-success alert
        Alert.alert(
          hasErrors ? "Đã thêm một phần" : "Thành công",
          `${response.message || "Đã thêm nguyên liệu vào giỏ hàng"}${errorDetails}`,
          [
            {
              text: "Tiếp tục xem",
              style: "cancel",
            },
            {
              text: "Xem giỏ hàng",
              onPress: () => navigation.navigate("MainTabs", { screen: "CartTab" }),
            },
          ]
        );
      } else {
        Alert.alert(
          "Không thể thêm vào giỏ",
          `${response.message || "Không thể thêm nguyên liệu"}${errorDetails}`
        );
      }
    } catch (error) {
      console.error("Add recipe to cart error:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể thêm nguyên liệu vào giỏ hàng"
      );
    } finally {
      setCartLoading(false);
    }
  };

  if (loading || !recipe) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.hintText}>Đang tải công thức...</Text>
          </>
        ) : (
          <>
            <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
            <Text style={styles.hintText}>Không tìm thấy công thức</Text>
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant" size={40} color="#fff" />
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nguyên liệu</Text>
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <>
                {recipe.ingredients.map((ing, index) => (
                  <View key={`${ing._id}-${index}`} style={styles.ingredientRow}>
                    <View style={styles.ingredientBullet} />
                    <View style={styles.ingredientTextContainer}>
                      <Text style={styles.ingredientName}>
                        {ing.product_name || "Nguyên liệu"}
                      </Text>
                      <Text style={styles.ingredientDetail}>
                        {ing.quantity_needed
                          ? `${ing.quantity_needed} ${ing.unit_note || ""}`
                          : ing.unit_note || "Tùy khẩu vị"}
                      </Text>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={[styles.addToCartButton, cartLoading && styles.buttonDisabled]}
                  onPress={handleAddIngredientsToCart}
                  disabled={cartLoading}
                >
                  <Ionicons name="cart" size={20} color="#fff" />
                  <Text style={styles.addToCartButtonText}>
                    {cartLoading ? "Đang thêm..." : "Thêm tất cả vào giỏ hàng"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>
                Chưa có danh sách nguyên liệu cho công thức này.
              </Text>
            )}
          </View>

          {recipe.instruction ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cách chế biến</Text>
              <Text style={styles.instruction}>{recipe.instruction}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  hintText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  image: {
    width: "100%",
    height: 220,
  },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
    marginTop: 8,
    marginRight: 10,
  },
  ingredientTextContainer: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  ingredientDetail: {
    fontSize: 13,
    color: "#666",
  },
  instruction: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  addToCartButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: "#9E9E9E",
  },
  addToCartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

