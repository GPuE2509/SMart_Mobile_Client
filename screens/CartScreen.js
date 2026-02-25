import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import CartItem from "../components/CartItem";
import userCouponService from "../services/userCouponService";

export default function CartScreen({ navigation }) {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [walletCoupons, setWalletCoupons] = useState([]);
  const [appliedUserCouponId, setAppliedUserCouponId] = useState(null);

  useEffect(() => {
    const loadUserCoupons = async () => {
      if (!user) {
        setWalletCoupons([]);
        return;
      }

      try {
        const response = await userCouponService.getMyCoupons({
          is_used: false,
        });

        if (response.success && Array.isArray(response.data)) {
          setWalletCoupons(response.data);
        } else {
          setWalletCoupons([]);
        }
      } catch (error) {
        console.error("Error loading user coupons:", error);
        setWalletCoupons([]);
      }
    };

    loadUserCoupons();
  }, [user]);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá");
      return;
    }

    if (!user) {
      setCouponError("Vui lòng đăng nhập để sử dụng mã giảm giá");
      return;
    }

    // Find coupon from user's wallet (user_coupons)
    const userCoupon = walletCoupons.find((uc) => {
      const code = uc.coupon?.code || "";
      const matchesCode =
        code.toLowerCase() === couponCode.trim().toLowerCase();
      const isActive = uc.coupon?.status === "active";
      const notUsed = uc.is_used === false;
      const notExpired = !uc.is_expired;
      return matchesCode && isActive && notUsed && notExpired;
    });

    if (!userCoupon || !userCoupon.coupon) {
      setCouponError("Mã giảm giá không hợp lệ");
      setAppliedCoupon(null);
      setAppliedUserCouponId(null);
      return;
    }

    const coupon = userCoupon.coupon;

    // Check if coupon has expired
    const now = new Date();
    const endDate = new Date(coupon.end_date);
    if (now > endDate) {
      setCouponError("Mã giảm giá đã hết hạn");
      setAppliedCoupon(null);
      return;
    }

    // Check minimum order value
    if (cartTotal.subtotal < coupon.min_order_value) {
      setCouponError(
        `Đơn hàng tối thiểu ${coupon.min_order_value.toLocaleString("vi-VN")}đ`,
      );
      setAppliedCoupon(null);
      return;
    }

    // Apply coupon
    setAppliedCoupon(coupon);
    setAppliedUserCouponId(userCoupon._id);
    setCouponError("");
    Alert.alert("Thành công", `Đã áp dụng mã giảm giá: ${coupon.code}`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    setAppliedUserCouponId(null);
  };

  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    let discount = 0;
    if (appliedCoupon.discount_type === "percent") {
      discount = (cartTotal.subtotal * appliedCoupon.discount_value) / 100;
      // Apply max discount limit
      if (discount > appliedCoupon.max_discount_amount) {
        discount = appliedCoupon.max_discount_amount;
      }
    } else {
      // fixed_amount
      discount = appliedCoupon.discount_value;
    }

    return Math.min(discount, cartTotal.subtotal); // Don't discount more than subtotal
  };

  const discount = calculateDiscount();
  const finalTotal = Math.max(0, cartTotal.total - discount);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Giỏ hàng trống", "Vui lòng thêm sản phẩm vào giỏ hàng");
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

    // Navigate to checkout screen with coupon data
    navigation.navigate("Checkout", {
      couponCode: appliedCoupon?.code || "",
      discount: discount.toString(),
      userCouponId: appliedUserCouponId || "",
    });
  };

  const handleClearCart = () => {
    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa tất cả sản phẩm?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        onPress: () => {
          clearCart();
          setAppliedCoupon(null);
          setCouponCode("");
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
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CartItem item={item} />}
            contentContainerStyle={styles.cartList}
          />

          <View style={styles.footer}>
            {/* Coupon Section */}
            <View style={styles.couponSection}>
              <Text style={styles.couponTitle}>Mã giảm giá</Text>
              {appliedCoupon ? (
                <View style={styles.appliedCouponContainer}>
                  <View style={styles.appliedCouponInfo}>
                    <Ionicons name="pricetag" size={20} color="#4CAF50" />
                    <View style={styles.appliedCouponText}>
                      <Text style={styles.appliedCouponCode}>
                        {appliedCoupon.code}
                      </Text>
                      <Text style={styles.appliedCouponDesc}>
                        {appliedCoupon.description}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRemoveCoupon}>
                    <Ionicons name="close-circle" size={24} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponInputContainer}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChangeText={(text) => {
                      setCouponCode(text);
                      setCouponError("");
                    }}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyCoupon}
                  >
                    <Text style={styles.applyButtonText}>Áp dụng</Text>
                  </TouchableOpacity>
                </View>
              )}
              {couponError ? (
                <Text style={styles.couponError}>{couponError}</Text>
              ) : null}
            </View>

            {/* Price Summary */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính:</Text>
              <Text style={styles.summaryValue}>
                {cartTotal.subtotal.toLocaleString("vi-VN")}đ
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Thuế ({cartTotal.taxRate}%):
              </Text>
              <Text style={styles.summaryValue}>
                {cartTotal.taxAmount.toLocaleString("vi-VN")}đ
              </Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.discountLabel}>Giảm giá:</Text>
                <Text style={styles.discountValue}>
                  -{discount.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalValue}>
                {finalTotal.toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Thanh toán</Text>
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
  footer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  couponSection: {
    marginBottom: 16,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  couponInputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  applyButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  appliedCouponContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  appliedCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  appliedCouponText: {
    flex: 1,
  },
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  appliedCouponDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  couponError: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
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
  discountLabel: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },
  discountValue: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
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
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
});
