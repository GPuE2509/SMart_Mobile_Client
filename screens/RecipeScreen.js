import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import recipeService from "../services/recipeService";

const ITEMS_PER_PAGE = 10;

export default function RecipeScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const ingredientSearchDebounce = useRef(true);

  useEffect(() => {
    loadRecipes(true);
  }, []);

  useEffect(() => {
    if (ingredientSearchDebounce.current) {
      ingredientSearchDebounce.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setHasMore(true);
      setPage(1);
      loadRecipes(true, ingredientSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [ingredientSearch]);

  const loadRecipes = async (reset = false, ingredientFilter = null) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    const filterStr = (
      (ingredientFilter !== null ? ingredientFilter : ingredientSearch) || ""
    ).trim();
    const params = {
      page: reset ? 1 : page,
      limit: ITEMS_PER_PAGE,
      sort_by: "createdAt",
      order: "DESC",
    };
    if (filterStr) params.ingredient_names = filterStr;

    try {
      const response = await recipeService.getAll(params);
      if (!response.success) return;

      const newRecipes = response.data.recipes || [];
      const pagination = response.data.pagination || {};

      if (reset) {
        setRecipes(newRecipes);
        setPage(1);
      } else {
        setRecipes((prev) => [...prev, ...newRecipes]);
        setPage((p) => p + 1);
      }
      setHasMore(pagination.page < pagination.totalPages);
    } catch (error) {
      console.error("Error loading recipes:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách công thức");
      if (reset) setRecipes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    setPage(1);
    loadRecipes(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadRecipes(false);
    }
  };

  const renderRecipeItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("RecipeDetail", { recipeId: item._id })
        }
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant" size={28} color="#fff" />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={24} color="#4CAF50" />
        <Text style={styles.headerTitle}>Công thức nấu ăn</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo nguyên liệu (vd: gà, táo)"
          placeholderTextColor="#999"
          value={ingredientSearch}
          onChangeText={setIngredientSearch}
        />
        {ingredientSearch ? (
          <TouchableOpacity onPress={() => setIngredientSearch("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item._id}
        contentContainerStyle={
          recipes.length === 0 && !loading
            ? styles.emptyListContainer
            : styles.listContent
        }
        renderItem={renderRecipeItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() =>
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có công thức nào</Text>
            </View>
          )
        }
        ListFooterComponent={() => {
          if (loading && recipes.length > 0)
            return (
              <View style={styles.footer}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            );
          if (!hasMore && recipes.length > 0)
            return (
              <View style={styles.footer}>
                <Text style={styles.endText}>Đã hiển thị hết công thức</Text>
              </View>
            );
          return null;
        }}
      />

      {loading && recipes.length === 0 && (
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải công thức...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: "#333",
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  image: {
    width: 100,
    height: 100,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#666",
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyContainer: {
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  endText: {
    color: "#999",
    fontSize: 14,
  },
  initialLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
});

