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
import dayjs from "dayjs";
import * as orderService from "../services/orderService";

function formatPrice(price) {
  return (price || 0).toLocaleString("vi-VN") + "đ";
}

function getPaymentMethodText(method) {
  switch (method) {
    case "cod":
      return "Thanh toán khi nhận hàng";
    case "payos":
      return "PayOS (QR Code)";
    default:
      return method;
  }
}

function getPaymentStatusText(status) {
  switch (status) {
    case "paid":
      return "Đã thanh toán";
    case "unpaid":
      return "Chưa thanh toán";
    case "refunded":
      return "Đã hoàn tiền";
    default:
      return status;
  }
}

function getPaymentStatusColor(status) {
  switch (status) {
    case "paid":
      return "#4CAF50";
    case "unpaid":
      return "#FF9800";
    case "refunded":
      return "#9C27B0";
    default:
      return "#999";
  }
}

function getOrderStatusText(status) {
  const map = {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    returned: "Đổi trả",
  };
  return map[status] || status;
}

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("Thiếu mã đơn hàng");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await orderService.getOrderById(orderId);
        const data = res?.data || res;
        if (!cancelled) {
          setOrder(data?.order ?? null);
          setOrderDetails(data?.orderDetails ?? []);
          if (!data?.order) setError("Không tìm thấy đơn hàng");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Không tải được chi tiết đơn hàng");
          setOrder(null);
          setOrderDetails([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !order) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.content}>
        {/* Order info header */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
            <Text style={styles.infoValue}>{order.order_code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày đặt:</Text>
            <Text style={styles.infoValue}>
              {dayjs(order.created_at).format("DD/MM/YYYY HH:mm")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái đơn:</Text>
            <Text style={styles.infoValue}>{getOrderStatusText(order.order_status)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phương thức thanh toán:</Text>
            <Text style={styles.infoValue}>
              {getPaymentMethodText(order.payment_method)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái thanh toán:</Text>
            <Text
              style={[
                styles.infoValue,
                { color: getPaymentStatusColor(order.payment_status) },
              ]}
            >
              {getPaymentStatusText(order.payment_status)}
            </Text>
          </View>
        </View>

        {/* Product list – itemized with batch & unit price at time of purchase */}
        {orderDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
            {orderDetails.map((item, index) => (
              <View key={item._id || index} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {item.product_unit_id?.product_id?.name || "Sản phẩm"}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productUnit}>
                      Đơn vị: {item.product_unit_id?.unit_id?.name || "N/A"}
                    </Text>
                    <Text style={styles.productQuantity}>x{item.quantity}</Text>
                  </View>
                  {item.product_batch_id ? (
                    <Text style={styles.batchCode}>
                      Lô: {item.product_batch_id}
                    </Text>
                  ) : null}
                  <Text style={styles.unitPriceAtPurchase}>
                    {formatPrice(item.unit_price)} / đơn vị
                  </Text>
                </View>
                <Text style={styles.productPrice}>
                  {formatPrice(item.total_price)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(order.total_amount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế:</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(order.tax_amount)}
            </Text>
          </View>
          {order.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Giảm giá:</Text>
              <Text style={styles.discountValue}>
                -{formatPrice(order.discount_amount)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>
              {formatPrice(order.final_amount)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("OrderHistory")}
        >
          <Ionicons name="list-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Xem tất cả đơn hàng</Text>
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
  content: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
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
    fontWeight: "600",
  },
  discountValue: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
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
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productUnit: {
    fontSize: 13,
    color: "#666",
  },
  productQuantity: {
    fontSize: 13,
    color: "#999",
  },
  batchCode: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  unitPriceAtPurchase: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
