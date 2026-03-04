import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
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

          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CartItem item={item} />}
            contentContainerStyle={styles.cartList}
          />

          <View style={styles.footer}>
            {/* Price Summary */}
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
});
