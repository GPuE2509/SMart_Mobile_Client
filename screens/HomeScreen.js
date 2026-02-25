import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ProductCard from "../components/ProductCard";
import productService from "../services/productService";
import categoryService from "../services/categoryService";

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories and featured products in parallel
      const [categoriesRes, productsRes] = await Promise.all([
        categoryService.getAll(),
        productService.getFeatured(8),
      ]);

      if (categoriesRes.success) {
        setCategories(categoriesRes.data.slice(0, 8)); // Limit to 8 categories
      }

      if (productsRes.success) {
        setFeaturedProducts(productsRes.data);
      }
    } catch (error) {
      console.error("Error loading home data:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryId) => {
    navigation.navigate("ProductList", { category: categoryId });
  };

  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", { productId: product._id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchContainer}
            onPress={() => navigation.navigate("ProductList")}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color="#666" />
            <Text style={styles.searchPlaceholder}>Tìm kiếm sản phẩm...</Text>
            <Ionicons name="options-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Banner */}
        <View style={styles.bannerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#FF6B6B" }]}
            >
              <Ionicons name="flash" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Flash Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#4ECDC4" }]}
              onPress={() => navigation.navigate("Coupon")}
            >
              <Ionicons name="gift" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Ưu Đãi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#FFD93D" }]}
              onPress={() => navigation.navigate("Recipe")}
            >
              <Ionicons name="receipt" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Công Thức</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: "#A8E6CF" }]}
            >
              <Ionicons name="leaf" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Organic</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <Text style={styles.sectionSubtitle}>Khám phá sản phẩm</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("CategoryList")}
            >
              <Text style={styles.seeAllText}>Tất cả →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category._id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.categoryIconContainer,
                    {
                      backgroundColor:
                        category.color_code || getCategoryColor(category.name),
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon_name || getCategoryIcon(category.name)}
                    size={28}
                    color="#fff"
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
              <Text style={styles.sectionSubtitle}>Được yêu thích nhất</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("ProductList")}
            >
              <Text style={styles.seeAllText}>Tất cả →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <View key={product._id} style={styles.productCardWrapper}>
                <ProductCard product={product} onPress={handleProductPress} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to get category icon based on name
function getCategoryIcon(name) {
  const nameL = name.toLowerCase();
  if (nameL.includes("rau") || nameL.includes("củ")) return "leaf";
  if (nameL.includes("cá") || nameL.includes("hải sản")) return "fish";
  if (nameL.includes("nước")) return "water";
  if (nameL.includes("bia") || nameL.includes("rượu")) return "beer";
  if (nameL.includes("cà phê")) return "cafe";
  if (nameL.includes("đồ ăn")) return "fast-food";
  if (nameL.includes("gia vị")) return "nutrition";
  if (nameL.includes("bánh")) return "ice-cream";
  return "grid";
}

// Helper function to get category color based on name
function getCategoryColor(name) {
  const nameL = name.toLowerCase();
  if (nameL.includes("rau") || nameL.includes("củ")) return "#66BB6A";
  if (nameL.includes("cá") || nameL.includes("hải sản")) return "#29B6F6";
  if (nameL.includes("nước")) return "#42A5F5";
  if (nameL.includes("bia") || nameL.includes("rượu")) return "#FF7043";
  if (nameL.includes("cà phê")) return "#8D6E63";
  if (nameL.includes("đồ ăn")) return "#FFA726";
  if (nameL.includes("gia vị")) return "#FFCA28";
  if (nameL.includes("bánh")) return "#EC407A";
  return "#9E9E9E";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: 150,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: "#999",
  },
  bannerContainer: {
    paddingVertical: 16,
    paddingLeft: 16,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  seeAllText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 4,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  categoryCard: {
    width: 100,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 16,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  productCardWrapper: {
    width: "48%",
  },
});
