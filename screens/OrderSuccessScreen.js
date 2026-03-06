import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

export default function OrderSuccessScreen({ navigation, route }) {
  const { order, orderDetails } = route.params || {};

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>
            Không tìm thấy thông tin đơn hàng
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs", params: { screen: "HomeTab" } }],
              })
            }
          >
            <Text style={styles.homeButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatPrice = (price) => {
    return (price || 0).toLocaleString("vi-VN") + "đ";
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "cod":
        return "Thanh toán khi nhận hàng";
      case "payos":
        return "PayOS (QR Code)";
      default:
        return method;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "unpaid":
        return "Chưa thanh toán";
      case "pending":
        return "Đang xử lý";
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "#4CAF50";
      case "unpaid":
        return "#FF9800";
      case "pending":
        return "#2196F3";
      default:
        return "#999";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Đặt hàng thành công!</Text>
          <Text style={styles.successSubtitle}>
            {order.payment_method === "cod"
              ? "Đơn hàng của bạn đã được tạo"
              : "Cảm ơn bạn đã thanh toán"}
          </Text>
        </View>

        {/* Order Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
            <Text style={styles.infoValue}>{order.order_code}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày đặt:</Text>
            <Text style={styles.infoValue}>
              {dayjs(order.created_at || order.order_date).format(
                "DD/MM/YYYY HH:mm",
              )}
            </Text>
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

        {/* Product List */}
        {orderDetails && orderDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
            {orderDetails.map((item, index) => (
              <View key={index} style={styles.productItem}>
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
                </View>
                <Text style={styles.productPrice}>
                  {formatPrice(item.total_price)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment Summary */}
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

        {/* Additional Info */}
        <View style={styles.section}>
          <View style={styles.noteContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#2196F3"
            />
            <Text style={styles.noteText}>
              {order.payment_method === "cod"
                ? "Vui lòng chuẩn bị số tiền khi nhận hàng. Bạn có thể xem chi tiết đơn hàng trong lịch sử đơn hàng."
                : order.payment_status === "paid"
                  ? "Đơn hàng của bạn đã được xác nhận và đang được xử lý. Bạn có thể theo dõi trong lịch sử đơn hàng."
                  : "Đơn hàng đã được tạo. Bạn có thể thanh toán sau trong lịch sử đơn hàng."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("OrderHistory")}
        >
          <Ionicons name="list-outline" size={20} color="#4CAF50" />
          <Text style={styles.secondaryButtonText}>Xem đơn hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs", params: { screen: "HomeTab" } }],
            })
          }
        >
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Về trang chủ</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  successHeader: {
    backgroundColor: "#fff",
    padding: 32,
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
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
  noteContainer: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: "#1976D2",
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
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
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
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
  productPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50",
  },
  homeButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
