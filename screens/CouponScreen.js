import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import couponService from "../services/couponService";
import userCouponService from "../services/userCouponService";
import { useAuth } from "../contexts/AuthContext";

export default function CouponScreen() {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(
    user?.loyalty_points || 0,
  );
  const [redeemingId, setRedeemingId] = useState(null);

  const loadCoupons = async () => {
    try {
      setError("");
      const response = await couponService.getAvailable({
        page: 1,
        limit: 50,
        sort_by: "createdAt",
        sort_order: "desc",
      });

      // response shape: { success, data, pagination }
      setCoupons(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phiếu giảm giá");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    setLoyaltyPoints(user?.loyalty_points || 0);
  }, [user]);

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

  const canRedeem = (coupon) => {
    const required = coupon.points_required || 0;
    return required > 0 && loyaltyPoints >= required;
  };

  const handleRedeem = async (coupon) => {
    if (!isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để đổi phiếu giảm giá.",
      );
      return;
    }

    const required = coupon.points_required || 0;
    if (required <= 0) {
      Alert.alert("Không thể đổi", "Phiếu giảm giá này không hỗ trợ đổi điểm.");
      return;
    }

    if (loyaltyPoints < required) {
      Alert.alert(
        "Không đủ điểm",
        `Bạn cần ${required.toLocaleString(
          "vi-VN",
        )} điểm để đổi voucher này.`,
      );
      return;
    }

    try {
      setRedeemingId(coupon._id?.toString() || coupon.code);
      const response = await userCouponService.purchase(coupon._id);
      const newPoints =
        response?.data?.loyalty_points ?? loyaltyPoints - required;

      setLoyaltyPoints(newPoints);
      await updateProfile({ loyalty_points: newPoints });

      Alert.alert(
        "Thành công",
        "Bạn đã đổi voucher thành công. Hệ thống đã lưu voucher vào ví của bạn.",
      );
    } catch (err) {
      Alert.alert(
        "Không thể đổi voucher",
        err.message || "Đã xảy ra lỗi, vui lòng thử lại.",
      );
    } finally {
      setRedeemingId(null);
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword) {
      const codeMatch = coupon.code?.toLowerCase().includes(keyword);
      const descMatch = coupon.description?.toLowerCase().includes(keyword);
      if (!codeMatch && !descMatch) {
        return false;
      }
    }

    if (showAffordableOnly) {
      const required = coupon.points_required || 0;
      if (required <= 0 || required > loyaltyPoints) {
        return false;
      }
    }

    return true;
  });

  const renderCouponItem = ({ item }) => {
    const isPercent = item.discount_type === "percent";
    const discountLabel = isPercent
      ? `${item.discount_value}%`
      : `${(item.discount_value || 0).toLocaleString("vi-VN")}đ`;

    const requiredPoints = item.points_required || 0;
    const affordable = canRedeem(item);
    const isRedeeming = redeemingId === (item._id?.toString() || item.code);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.codeBadge}>
            <Ionicons name="pricetag" size={18} color="#fff" />
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          <Text style={styles.discountText}>{discountLabel}</Text>
        </View>

        {item.description ? (
          <Text style={styles.descriptionText}>{item.description}</Text>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="cart-outline" size={18} color="#666" />
          <Text style={styles.metaText}>
            Đơn tối thiểu:{" "}
            {item.min_order_value
              ? `${item.min_order_value.toLocaleString("vi-VN")}đ`
              : "Không yêu cầu"}
          </Text>
        </View>

        {item.max_discount_amount ? (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={18} color="#666" />
            <Text style={styles.metaText}>
              Giảm tối đa: {item.max_discount_amount.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={18} color="#666" />
          <Text style={styles.metaText}>
            Hạn sử dụng: {formatDate(item.end_date)}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="star-outline" size={18} color="#FFA000" />
          <Text style={styles.metaText}>
            Cần: {requiredPoints.toLocaleString("vi-VN")} điểm
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              !affordable && styles.redeemButtonDisabled,
            ]}
            onPress={() => handleRedeem(item)}
            disabled={!affordable || isRedeeming}
          >
            {isRedeeming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.redeemButtonText}>
                {affordable ? "Đổi điểm" : "Không đủ điểm"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải phiếu giảm giá...</Text>
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

    if (!filteredCoupons.length) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="pricetag-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có phiếu giảm giá</Text>
          <Text style={styles.helperText}>
            Hiện tại chưa có mã giảm giá khả dụng. Vui lòng quay lại sau.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredCoupons}
        keyExtractor={(item) => item._id?.toString() || item.code}
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
        <Text style={styles.title}>Phiếu Giảm Giá Khả Dụng</Text>
        <Text style={styles.subtitle}>
          Danh sách các mã giảm giá bạn có thể sử dụng.
        </Text>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.pointsBadge}>
          <Ionicons name="trophy-outline" size={18} color="#FFD54F" />
          <Text style={styles.pointsText}>
            Điểm hiện có:{" "}
            <Text style={styles.pointsValue}>
              {loyaltyPoints.toLocaleString("vi-VN")}
            </Text>
          </Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo mã hoặc mô tả..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          style={[
            styles.filterChip,
            showAffordableOnly && styles.filterChipActive,
          ]}
          onPress={() => setShowAffordableOnly((prev) => !prev)}
        >
          <Ionicons
            name="filter-outline"
            size={16}
            color={showAffordableOnly ? "#fff" : "#4CAF50"}
          />
          <Text
            style={[
              styles.filterChipText,
              showAffordableOnly && styles.filterChipTextActive,
            ]}
          >
            Chỉ hiển thị voucher đủ điểm
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
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "#f5f5f5",
    gap: 8,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  pointsText: {
    fontSize: 13,
    color: "#555",
  },
  pointsValue: {
    fontWeight: "bold",
    color: "#FFB300",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
    gap: 6,
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
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  redeemButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
  },
  redeemButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  redeemButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
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

