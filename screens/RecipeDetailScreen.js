import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import recipeService from "../services/recipeService";

export default function RecipeDetailScreen({ route }) {
  const { recipeId } = route.params || {};
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

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
              recipe.ingredients.map((ing) => (
                <View key={ing._id} style={styles.ingredientRow}>
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
              ))
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
});

