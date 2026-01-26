import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import categoryService from "../services/categoryService";

export default function CategoryListScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll();

      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      Alert.alert("Lỗi", "Không thể tải danh mục. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleCategoryPress = (categoryId) => {
    navigation.navigate("ProductList", { category: categoryId });
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes("rau") || name.includes("củ")) return "leaf";
    if (name.includes("thịt") || name.includes("hải sản")) return "fish";
    if (name.includes("trái cây")) return "nutrition";
    if (name.includes("sữa") || name.includes("trứng")) return "water";
    if (name.includes("đồ uống")) return "cafe";
    if (name.includes("bánh") || name.includes("kẹo")) return "pizza";
    return "pricetag";
  };

  const getCategoryColor = (index) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#FFD93D",
      "#A8E6CF",
      "#FF8B94",
      "#6C5CE7",
      "#FD79A8",
      "#FDCB6E",
    ];
    return colors[index % colors.length];
  };

  const renderCategoryItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item._id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.categoryIcon,
          { backgroundColor: getCategoryColor(index) },
        ]}
      >
        <Ionicons name={getCategoryIcon(item.name)} size={32} color="#fff" />
      </View>

      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.product_count !== undefined && (
          <View style={styles.productCountBadge}>
            <Ionicons name="cube-outline" size={14} color="#666" />
            <Text style={styles.productCountText}>
              {item.product_count} sản phẩm
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Danh mục</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh mục</Text>
        <View style={{ width: 40 }} />
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  productCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  productCountText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});
