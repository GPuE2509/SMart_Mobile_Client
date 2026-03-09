import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import CartItem from "../components/CartItem";

export default function CartScreen({ navigation }) {
  const { user } = useAuth();
  const {
    cartItems,
    cartTotal,
    clearCart,
    toggleSelectAll,
    getSelectedItems,
    getSelectedCount,
  } = useCart();

  // Search and filter states
  const [searchText, setSearchText] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Remove Vietnamese diacritics for search
  const removeVietnameseDiacritics = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Filter and search cart items locally
  const filteredCartItems = useMemo(() => {
    let items = [...cartItems];

    // Filter by search text
    if (searchText.trim()) {
      const searchNormalized = removeVietnameseDiacritics(searchText);
      items = items.filter((item) => {
        const nameNormalized = removeVietnameseDiacritics(
          item.product?.name || "",
        );
        const descNormalized = removeVietnameseDiacritics(
          item.product?.description || "",
        );
        return (
          nameNormalized.includes(searchNormalized) ||
          descNormalized.includes(searchNormalized)
        );
      });
    }

    // Sort items
    switch (sortBy) {
      case "name":
        items.sort((a, b) =>
          (a.product?.name || "").localeCompare(b.product?.name || ""),
        );
        break;
      case "price-asc":
        items.sort(
          (a, b) => (a.productUnit?.price || 0) - (b.productUnit?.price || 0),
        );
        break;
      case "price-desc":
        items.sort(
          (a, b) => (b.productUnit?.price || 0) - (a.productUnit?.price || 0),
        );
        break;
      case "quantity-asc":
        items.sort((a, b) => a.quantity - b.quantity);
        break;
      case "quantity-desc":
        items.sort((a, b) => b.quantity - a.quantity);
        break;
      case "newest":
      default:
        // Keep original order (newest first)
        break;
    }

    return items;
  }, [cartItems, searchText, sortBy]);

  // Check if any filter is active
  const hasActiveFilters = sortBy !== "newest";

  // Clear all filters
  const clearFilters = () => {
    setSortBy("newest");
    setSearchText("");
  };

  const selectedItems = getSelectedItems();
  const selectedCount = getSelectedCount();
  const allSelected =
    cartItems.length > 0 && selectedCount === cartItems.length;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ hàng");
      return;
    }

    if (selectedCount === 0) {
      Alert.alert(
        "Chưa chọn sản phẩm",
        "Vui lòng chọn ít nhất một sản phẩm để thanh toán",
      );
      return;
    }

    // Check if user is logged in
    if (!user) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để tiếp tục thanh toán",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => navigation.navigate("Login") },
        ],
      );
      return;
    }

    // Navigate to checkout screen with selected items only
    navigation.navigate("Checkout", {
      selectedItems,
    });
  };

  const handleClearCart = () => {
    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa tất cả sản phẩm?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        onPress: () => {
          clearCart();
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ Hàng</Text>
        {user && cartItems.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearButton}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {!user ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Vui lòng đăng nhập</Text>
          <Text style={styles.emptySubtext}>Đăng nhập để sử dụng giỏ hàng</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtext}>
            Thêm sản phẩm để bắt đầu mua sắm
          </Text>
        </View>
      ) : (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm trong giỏ hàng..."
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons
                name="options"
                size={20}
                color={hasActiveFilters ? "#fff" : "#4CAF50"}
              />
            </TouchableOpacity>
          </View>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sortBy !== "newest" && (
                  <View style={styles.filterTag}>
                    <Text style={styles.filterTagText}>
                      {sortBy === "name" && "A-Z"}
                      {sortBy === "price-asc" && "Giá tăng"}
                      {sortBy === "price-desc" && "Giá giảm"}
                      {sortBy === "quantity-asc" && "SL tăng"}
                      {sortBy === "quantity-desc" && "SL giảm"}
                    </Text>
                    <TouchableOpacity onPress={() => setSortBy("newest")}>
                      <Ionicons name="close" size={16} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Search Results Info */}
          {(searchText || hasActiveFilters) && (
            <View style={styles.searchResultsInfo}>
              <Text style={styles.searchResultsText}>
                Tìm thấy {filteredCartItems.length} sản phẩm
              </Text>
            </View>
          )}

          {/* Select All Section */}
          <View style={styles.selectAllContainer}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <Ionicons
                name={allSelected ? "checkbox" : "square-outline"}
                size={24}
                color={allSelected ? "#4CAF50" : "#999"}
              />
              <Text style={styles.selectAllText}>
                Chọn tất cả ({selectedCount}/{cartItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {filteredCartItems.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.noResultsText}>Không tìm thấy sản phẩm</Text>
              <Text style={styles.noResultsSubtext}>
                Thử tìm kiếm với từ khóa khác
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCartItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <CartItem item={item} />}
              contentContainerStyle={styles.cartList}
            />
          )}

          <View style={styles.footer}>
            {/* Price Summary */}
            {cartTotal.rescueSavings > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giá gốc:</Text>
                <Text style={styles.summaryValue}>
                  {cartTotal.originalSubtotal.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}
            {cartTotal.rescueSavings > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.savingsLabel]}>
                  🌟 Chương trình giảm giá:
                </Text>
                <Text style={[styles.summaryValue, styles.savingsValue]}>
                  -{cartTotal.rescueSavings.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính:</Text>
              <Text style={styles.summaryValue}>
                {cartTotal.subtotal.toLocaleString("vi-VN")}đ
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thuế:</Text>
              <Text style={styles.summaryValue}>
                {cartTotal.taxAmount.toLocaleString("vi-VN")}đ
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>
                {cartTotal.total.toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                selectedCount === 0 && styles.checkoutButtonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={selectedCount === 0}
            >
              <Text style={styles.checkoutButtonText}>
                Thanh toán ({selectedCount})
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Filter Modal */}
          <Modal
            visible={showFilterModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFilterModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Bộ lọc</Text>
                  <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Sort Options */}
                  <Text style={styles.filterLabel}>Sắp xếp theo</Text>
                  <View style={styles.sortOptionsContainer}>
                    {[
                      { value: "newest", label: "Mới nhất" },
                      { value: "name", label: "Tên A-Z" },
                      { value: "price-asc", label: "Giá tăng dần" },
                      { value: "price-desc", label: "Giá giảm dần" },
                      { value: "quantity-asc", label: "Số lượng tăng" },
                      { value: "quantity-desc", label: "Số lượng giảm" },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.sortOption,
                          sortBy === option.value && styles.sortOptionActive,
                        ]}
                        onPress={() => setSortBy(option.value)}
                      >
                        <Text
                          style={[
                            styles.sortOptionText,
                            sortBy === option.value &&
                              styles.sortOptionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.clearModalButton}
                    onPress={() => {
                      clearFilters();
                    }}
                  >
                    <Text style={styles.clearModalText}>Xóa bộ lọc</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => setShowFilterModal(false)}
                  >
                    <Text style={styles.applyButtonText}>Áp dụng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  clearButton: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cartList: {
    padding: 16,
  },
  selectAllContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  savingsLabel: {
    color: "#FF6B00",
    fontWeight: "600",
  },
  savingsValue: {
    color: "#FF6B00",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  checkoutButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  checkoutButtonDisabled: {
    backgroundColor: "#ccc",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  // Search and Filter Styles
  searchContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  filterButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
  },
  activeFiltersContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterTagText: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "500",
    marginRight: 4,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    color: "#FF5252",
    fontSize: 13,
    fontWeight: "500",
  },
  searchResultsInfo: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchResultsText: {
    color: "#666",
    fontSize: 14,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  sortOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: "#4CAF50",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#666",
  },
  sortOptionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  clearModalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    marginRight: 8,
  },
  clearModalText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
