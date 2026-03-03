import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import {
  createOrder,
  createPayOSPayment,
  checkPaymentStatus,
  getOrderById,
} from "../services/orderService";

export default function CheckoutScreen({ navigation, route }) {
  const { user } = useAuth();
  const { removeSelectedItems } = useCart();
  const { selectedItems, couponCode, discount } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("payos");

  // Calculate total from selected items only
  const calculateTotal = () => {
    if (!selectedItems || selectedItems.length === 0) {
      return { subtotal: 0, taxAmount: 0, total: 0, itemCount: 0 };
    }

    const subtotal = selectedItems.reduce((total, item) => {
      return total + item.productUnit.price * item.quantity;
    }, 0);

    const taxAmount = selectedItems.reduce((total, item) => {
      const itemSubtotal = item.productUnit.price * item.quantity;
      const itemTax = (itemSubtotal * (item.product.tax_percentage || 0)) / 100;
      return total + itemTax;
    }, 0);

    const itemCount = selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      itemCount,
    };
  };

  const cartTotal = calculateTotal();
  const discountAmount = parseFloat(discount) || 0;
  const finalTotal = Math.max(0, cartTotal.total - discountAmount);

  // Redirect to home if no selected items
  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      navigation.navigate("MainTabs", { screen: "HomeTab" });
    }
  }, [selectedItems, navigation]);

  // Handle create order and payment
  const handlePayment = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      navigation.navigate("MainTabs", { screen: "HomeTab" });
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create order with selected items only
      const orderData = {
        items: selectedItems.map((item) => ({
          product_unit_id: item.product_unit_id,
          quantity: item.quantity,
        })),
        couponCode: couponCode || "",
        paymentMethod: paymentMethod,
      };

      const orderResponse = await createOrder(orderData);

      if (!orderResponse.success) {
        // Silent error - just go back to home
        navigation.navigate("MainTabs", { screen: "HomeTab" });
        return;
      }

      const order = orderResponse.data;

      // Step 2: If PayOS, create payment link
      if (paymentMethod === "payos") {
        const paymentResponse = await createPayOSPayment(order._id);

        if (!paymentResponse.success) {
          // Silent error - just go back to home
          navigation.navigate("MainTabs", { screen: "HomeTab" });
          return;
        }

        const { checkoutUrl } = paymentResponse.data;

        // Step 3: Open PayOS payment page
        await WebBrowser.openBrowserAsync(checkoutUrl);

        // Step 4: After browser closes, ALWAYS check payment status
        setTimeout(async () => {
          await checkAndHandlePaymentStatus(order._id);
        }, 1000);
      } else {
        // Cash on delivery - fetch full order details and navigate to success screen
        const fullOrderResponse = await getOrderById(order._id);
        if (fullOrderResponse.success) {
          removeSelectedItems();
          navigation.navigate("OrderSuccess", {
            order: fullOrderResponse.data.order,
            orderDetails: fullOrderResponse.data.orderDetails,
          });
        } else {
          // Failed to get order details, go to home
          navigation.navigate("MainTabs", { screen: "HomeTab" });
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      // Silent error - just go back to home
      navigation.navigate("MainTabs", { screen: "HomeTab" });
    } finally {
      setLoading(false);
    }
  };

  // Check payment status after user closes browser
  const checkAndHandlePaymentStatus = async (orderId) => {
    try {
      const statusResponse = await checkPaymentStatus(orderId);

      if (statusResponse.success) {
        const { payment_status } = statusResponse.data;

        if (payment_status === "paid") {
          // Payment successful - fetch full order details before navigating
          const fullOrderResponse = await getOrderById(orderId);
          if (fullOrderResponse.success) {
            removeSelectedItems();
            navigation.navigate("OrderSuccess", {
              order: fullOrderResponse.data.order,
              orderDetails: fullOrderResponse.data.orderDetails,
            });
          } else {
            // Failed to get order details, go back to cart
            navigation.navigate("MainTabs", { screen: "CartTab" });
          }
        } else {
          // Unpaid - DON'T remove items, just go back to cart
          navigation.navigate("MainTabs", { screen: "CartTab" });
        }
      } else {
        // Error checking status - go back to cart, keep items
        navigation.navigate("MainTabs", { screen: "CartTab" });
      }
    } catch (error) {
      console.error("Check payment status error:", error);
      // Error - go back to cart, keep items
      navigation.navigate("MainTabs", { screen: "CartTab" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số lượng sản phẩm:</Text>
            <Text style={styles.summaryValue}>
              {selectedItems?.length || 0}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>
              {cartTotal.subtotal.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế (10%):</Text>
            <Text style={styles.summaryValue}>
              {cartTotal.taxAmount.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Giảm giá:</Text>
              <Text style={styles.discountValue}>
                -{discountAmount.toLocaleString("vi-VN")}đ
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
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "payos" && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod("payos")}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons
                name="card-outline"
                size={24}
                color={paymentMethod === "payos" ? "#4CAF50" : "#666"}
              />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>PayOS</Text>
                <Text style={styles.paymentOptionDesc}>
                  Thanh toán qua QR Code
                </Text>
              </View>
            </View>
            {paymentMethod === "payos" && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "cod" && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod("cod")}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons
                name="cash-outline"
                size={24}
                color={paymentMethod === "cod" ? "#4CAF50" : "#666"}
              />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>
                  Thanh toán khi nhận hàng
                </Text>
                <Text style={styles.paymentOptionDesc}>
                  Thanh toán bằng tiền mặt
                </Text>
              </View>
            </View>
            {paymentMethod === "cod" && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {paymentMethod === "cod"
                  ? "Đặt hàng"
                  : `Thanh toán ${finalTotal.toLocaleString("vi-VN")}đ`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
  },
  discountLabel: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  discountValue: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  paymentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#f1f8f4",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: "#666",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  payButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#ccc",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
});
