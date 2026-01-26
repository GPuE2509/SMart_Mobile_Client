import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ProductCard from "../components/ProductCard";
import productService from "../services/productService";

const ITEMS_PER_PAGE = 10;

export default function ProductListScreen({ navigation, route }) {
  const params = route.params || {};

  const [searchQuery, setSearchQuery] = useState(params.search || "");
  const [selectedCategory, setSelectedCategory] = useState(
    params.category || null,
  );
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [tempPriceRange, setTempPriceRange] = useState({
    min: 0,
    max: 1000000,
  });

  // API data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load products from API
  useEffect(() => {
    loadProducts(true);
  }, [searchQuery, selectedCategory, sortBy, sortOrder, priceRange]);

  const loadProducts = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    const currentPage = reset ? 1 : page;

    try {
      const params = {
        search: searchQuery || undefined,
        category_id: selectedCategory || undefined,
        min_price: priceRange.min > 0 ? priceRange.min : undefined,
        max_price: priceRange.max < 1000000 ? priceRange.max : undefined,
        sort_by: sortBy,
        order: sortOrder,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };

      const response = await productService.getAll(params);

      if (response.success) {
        const newProducts = response.data.products || [];
        const paginationData = response.data.pagination || {};

        if (reset) {
          setProducts(newProducts);
          setPage(1);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }

        setHasMore(paginationData.page < paginationData.totalPages);
        if (!reset) setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách sản phẩm");
      if (reset) setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    setPage(1);
    loadProducts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadProducts(false);
    }
  };

  const handleApplyFilters = () => {
    setPriceRange(tempPriceRange);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setTempPriceRange({ min: 0, max: 1000000 });
    setPriceRange({ min: 0, max: 1000000 });
    setSelectedCategory(null);
    setShowFilterModal(false);
  };

  const getSortLabel = () => {
    if (sortBy === "name" && sortOrder === "ASC") return "Tên A-Z";
    if (sortBy === "name" && sortOrder === "DESC") return "Tên Z-A";
    if (sortBy === "price" && sortOrder === "ASC") return "Giá thấp - cao";
    if (sortBy === "price" && sortOrder === "DESC") return "Giá cao - thấp";
    return "Sắp xếp";
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max < 1000000 ? 1 : 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sản phẩm</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Sort & Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={18} color="#4CAF50" />
          <Text style={styles.filterButtonText}>{getSortLabel()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFiltersCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options" size={18} color="#4CAF50" />
          <Text style={styles.filterButtonText}>
            Lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        renderItem={({ item }) => (
          <View style={styles.productCardWrapper}>
            <ProductCard product={item} />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() =>
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
            </View>
          )
        }
        ListFooterComponent={() => {
          if (loading && products.length > 0) {
            return (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            );
          }
          if (!hasMore && products.length > 0) {
            return (
              <View style={styles.endFooter}>
                <Text style={styles.endText}>Đã hiển thị hết sản phẩm</Text>
              </View>
            );
          }
          return null;
        }}
      />

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sắp xếp theo</Text>

            {[
              { by: "name", order: "ASC", label: "Tên A-Z" },
              { by: "name", order: "DESC", label: "Tên Z-A" },
              { by: "price", order: "ASC", label: "Giá thấp đến cao" },
              { by: "price", order: "DESC", label: "Giá cao đến thấp" },
            ].map((sort) => {
              const isActive = sortBy === sort.by && sortOrder === sort.order;
              return (
                <TouchableOpacity
                  key={`${sort.by}-${sort.order}`}
                  style={styles.modalOption}
                  onPress={() => {
                    setSortBy(sort.by);
                    setSortOrder(sort.order);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isActive && styles.modalOptionActive,
                    ]}
                  >
                    {sort.label}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={[styles.modalContent, styles.filterModal]}>
            <Text style={styles.modalTitle}>Lọc sản phẩm</Text>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Khoảng giá</Text>
              <View style={styles.priceInputRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Từ"
                  keyboardType="numeric"
                  value={
                    tempPriceRange.min > 0 ? tempPriceRange.min.toString() : ""
                  }
                  onChangeText={(text) =>
                    setTempPriceRange((prev) => ({
                      ...prev,
                      min: parseInt(text) || 0,
                    }))
                  }
                />
                <Text style={styles.priceRangeSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Đến"
                  keyboardType="numeric"
                  value={
                    tempPriceRange.max < 1000000
                      ? tempPriceRange.max.toString()
                      : ""
                  }
                  onChangeText={(text) =>
                    setTempPriceRange((prev) => ({
                      ...prev,
                      max: parseInt(text) || 1000000,
                    }))
                  }
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterActionButton, styles.resetButton]}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetButtonText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterActionButton, styles.applyButton]}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Initial Loading */}
      {loading && products.length === 0 && (
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
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
  backButton: {
    padding: 4,
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
    margin: 16,
    marginBottom: 8,
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
  },
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4CAF50",
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: "#E8F5E9",
  },
  filterButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "500",
  },
  productList: {
    padding: 8,
  },
  productCardWrapper: {
    flex: 1,
    maxWidth: "50%",
    padding: 8,
  },
  loadingFooter: {
    padding: 20,
    alignItems: "center",
  },
  endFooter: {
    padding: 20,
    alignItems: "center",
  },
  endText: {
    color: "#999",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  filterModal: {
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalOptionActive: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  priceRangeSeparator: {
    fontSize: 16,
    color: "#999",
  },
  filterActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  filterActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#f5f5f5",
  },
  applyButton: {
    backgroundColor: "#4CAF50",
  },
  resetButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
