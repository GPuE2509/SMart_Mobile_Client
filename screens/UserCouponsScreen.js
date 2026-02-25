import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import userCouponService from "../services/userCouponService";
import { useAuth } from "../contexts/AuthContext";

export default function UserCouponsScreen() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterUsed, setFilterUsed] = useState("active"); // 'active' | 'used' | 'all'

  const loadCoupons = async () => {
    if (!user) {
      setCoupons([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");
      const params = {};
      if (filterUsed === "active") params.is_used = "false";
      if (filterUsed === "used") params.is_used = "true";

      const response = await userCouponService.getMyCoupons(params);

      if (response.success && Array.isArray(response.data)) {
        setCoupons(response.data);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      setError(err.message || "Không thể tải ví voucher");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUsed, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCoupons();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Không giới hạn";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Không rõ";
    return date.toLocaleDateString("vi-VN");
  };

  const renderCouponItem = ({ item }) => {
    const coupon = item.coupon || item.coupon_id;
    if (!coupon) return null;

    const isPercent = coupon.discount_type === "percent";
    const discountLabel = isPercent
      ? `${coupon.discount_value}%`
      : `${(coupon.discount_value || 0).toLocaleString("vi-VN")}đ`;

    const isExpired = item.is_expired;
    const isUsed = item.is_used;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.codeBadge}>
            <Ionicons name="pricetag" size={18} color="#fff" />
            <Text style={styles.codeText}>{coupon.code}</Text>
          </View>
          <Text style={styles.discountText}>{discountLabel}</Text>
        </View>

        {coupon.description ? (
          <Text style={styles.descriptionText}>{coupon.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="cart-outline" size={18} color="#666" />
          <Text style={styles.metaText}>
            Đơn tối thiểu:{" "}
            {coupon.min_order_value
              ? `${coupon.min_order_value.toLocaleString("vi-VN")}đ`
              : "Không yêu cầu"}
          </Text>
        </View>

        {coupon.max_discount_amount ? (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={18} color="#666" />
            <Text style={styles.metaText}>
              Giảm tối đa:{" "}
              {coupon.max_discount_amount.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={18} color="#666" />
          <Text style={styles.metaText}>
            Hạn sử dụng: {formatDate(coupon.end_date)}
          </Text>
        </View>

        <View style={styles.statusRow}>
          {isUsed ? (
            <View style={[styles.statusTag, styles.usedTag]}>
              <Ionicons name="checkmark-done" size={14} color="#fff" />
              <Text style={styles.statusText}>Đã sử dụng</Text>
            </View>
          ) : isExpired ? (
            <View style={[styles.statusTag, styles.expiredTag]}>
              <Ionicons name="alert-circle" size={14} color="#fff" />
              <Text style={styles.statusText}>Đã hết hạn</Text>
            </View>
          ) : (
            <View style={[styles.statusTag, styles.activeTag]}>
              <Ionicons name="flash" size={14} color="#fff" />
              <Text style={styles.statusText}>Có thể sử dụng</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (!user) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.helperText}>
            Bạn cần đăng nhập để xem ví voucher của mình.
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải ví voucher...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.helperText}>
            Vuốt xuống để thử tải lại danh sách.
          </Text>
        </View>
      );
    }

    if (!coupons.length) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Ví voucher trống</Text>
          <Text style={styles.helperText}>
            Hãy vào mục Phiếu Giảm Giá để đổi điểm lấy voucher.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={coupons}
        keyExtractor={(item) => item._id?.toString()}
        renderItem={renderCouponItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ví Voucher Của Bạn</Text>
        <Text style={styles.subtitle}>
          Danh sách các voucher bạn đã đổi bằng điểm.
        </Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterUsed === "active" && styles.filterChipActive,
          ]}
          onPress={() => setFilterUsed("active")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterUsed === "active" && styles.filterChipTextActive,
            ]}
          >
            Còn hiệu lực
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterUsed === "used" && styles.filterChipActive,
          ]}
          onPress={() => setFilterUsed("used")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterUsed === "used" && styles.filterChipTextActive,
            ]}
          >
            Đã dùng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterUsed === "all" && styles.filterChipActive,
          ]}
          onPress={() => setFilterUsed("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              filterUsed === "all" && styles.filterChipTextActive,
            ]}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#4CAF50",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#E8F5E9",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: "#f5f5f5",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#4CAF50",
  },
  filterChipText: {
    fontSize: 12,
    color: "#4CAF50",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  codeText: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 14,
  },
  discountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  descriptionText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: "#555",
  },
  statusRow: {
    marginTop: 10,
    flexDirection: "row",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  activeTag: {
    backgroundColor: "#4CAF50",
  },
  usedTag: {
    backgroundColor: "#9E9E9E",
  },
  expiredTag: {
    backgroundColor: "#f44336",
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#f44336",
    textAlign: "center",
  },
  helperText: {
    marginTop: 6,
    fontSize: 13,
    color: "#777",
    textAlign: "center",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});

