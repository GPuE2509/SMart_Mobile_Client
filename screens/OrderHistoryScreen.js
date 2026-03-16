import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import * as orderService from "../services/orderService";
import ReorderSelectionModal from "../components/ReorderSelectionModal";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "processing", label: "Đang xử lý" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "returned", label: "Đổi trả" },
];

function toFilters(orderCode, dateFrom, dateTo, orderStatus) {
  return {
    order_code: (orderCode || "").trim(),
    date_from: (dateFrom || "").trim() || undefined,
    date_to: (dateTo || "").trim() || undefined,
    order_status: orderStatus || "all",
  };
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

function getOrderStatusColor(status) {
  const map = {
    pending: "#FF9800",
    processing: "#2196F3",
    completed: "#4CAF50",
    cancelled: "#f44336",
    returned: "#9C27B0",
  };
  return map[status] || "#666";
}

function getPaymentStatusText(status) {
  const map = {
    unpaid: "Chưa thanh toán",
    paid: "Đã thanh toán",
    refunded: "Đã hoàn tiền",
  };
  return map[status] || status;
}

function formatPrice(price) {
  return (price || 0).toLocaleString("vi-VN") + "đ";
}

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [orderCode, setOrderCode] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({});
  const filtersRef = useRef({});
  const [reorderLoadingMap, setReorderLoadingMap] = useState({});
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [reorderPreviewItems, setReorderPreviewItems] = useState([]);
  const [reorderPreviewLoading, setReorderPreviewLoading] = useState(false);
  const [activeReorderOrder, setActiveReorderOrder] = useState(null);

  const loadOrders = useCallback(async (pageNum = 1, append = false, filtersOverride = null) => {
    const filters = filtersOverride != null ? { ...filtersOverride } : { ...filtersRef.current };
    try {
      if (pageNum === 1) {
        if (append) setRefreshing(true);
        else setLoading(true);
      } else setLoadingMore(true);
      setError(null);

      const res = await orderService.getUserOrders(pageNum, PAGE_SIZE, filters);
      const data = res?.data || res;
      let list = data?.orders || [];

      // Lọc lại trên client theo bộ lọc hiện tại (đảm bảo hiển thị đúng dù API có lỗi)
      const code = (filters.order_code || "").trim().toLowerCase();
      if (code) {
        list = list.filter((o) => (o.order_code || "").toLowerCase().includes(code));
      }
      const status = filters.order_status && filters.order_status !== "all" ? filters.order_status : null;
      if (status) {
        list = list.filter((o) => o.order_status === status);
      }
      if (filters.date_from || filters.date_to) {
        const from = filters.date_from ? new Date(filters.date_from) : null;
        const to = filters.date_to ? new Date(filters.date_to) : null;
        if (from) from.setHours(0, 0, 0, 0);
        if (to) to.setHours(23, 59, 59, 999);
        list = list.filter((o) => {
          const d = o.created_at ? new Date(o.created_at) : null;
          if (!d) return false;
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });
      }

      const pagination = data?.pagination || {};

      if (append) {
        setOrders((prev) => (pageNum === 1 ? list : [...prev, ...list]));
      } else {
        setOrders(list);
      }
      setPage(pageNum);
      setTotalPages(pagination.totalPages ?? Math.ceil((pagination.total || 0) / PAGE_SIZE));
    } catch (err) {
      setError(err?.message || "Không tải được danh sách đơn hàng");
      if (pageNum === 1) setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadOrders(1, false);
  }, [loadOrders]);

  const onApplyFilters = useCallback(() => {
    const next = toFilters(orderCode, dateFrom, dateTo, orderStatus);
    filtersRef.current = next;
    setAppliedFilters(next);
    loadOrders(1, false, next);
  }, [orderCode, dateFrom, dateTo, orderStatus, loadOrders]);

  const onRefresh = useCallback(() => {
    loadOrders(1, true);
  }, [loadOrders]);

  const onEndReached = useCallback(() => {
    if (loadingMore || loading || page >= totalPages || totalPages === 0) return;
    loadOrders(page + 1, true);
  }, [loadingMore, loading, page, totalPages, loadOrders]);

  const onPressOrder = useCallback(
    (orderId) => {
      navigation.navigate("OrderDetail", { orderId });
    },
    [navigation],
  );

  const handleReorder = useCallback(
    async (orderId) => {
      try {
        setReorderLoadingMap((prev) => ({ ...prev, [orderId]: true }));

        setReorderPreviewLoading(true);
        const res = await orderService.getReorderPreview(orderId);
        const preview = res?.data || res;
        const items = preview?.items || [];

        if (!items.length) {
          Alert.alert("Thông báo", "Đơn hàng này không có sản phẩm để mua lại.");
          return;
        }

        setActiveReorderOrder(preview?.order || null);
        setReorderPreviewItems(items);
        setReorderModalVisible(true);
      } catch (err) {
        Alert.alert("Không thể tải danh sách sản phẩm", err?.message || "Vui lòng thử lại sau");
      } finally {
        setReorderPreviewLoading(false);
        setReorderLoadingMap((prev) => ({ ...prev, [orderId]: false }));
      }
    },
    [],
  );

  const handleConfirmReorder = useCallback(
    (selectedItems) => {
      setReorderModalVisible(false);
      navigation.navigate("Checkout", {
        selectedItems,
        source: "reorder",
        reorderOrderId: activeReorderOrder?._id,
      });
    },
    [navigation, activeReorderOrder],
  );

  function renderItem({ item }) {
    const isReordering = !!reorderLoadingMap[item._id];

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => onPressOrder(item._id)} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderCode}>{item.order_code}</Text>
            <Text style={styles.date}>
              {dayjs(item.created_at).format("DD/MM/YYYY HH:mm")}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Tổng tiền:</Text>
            <Text style={styles.amount}>{formatPrice(item.final_amount)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Trạng thái đơn:</Text>
            <Text
              style={[
                styles.statusOrder,
                { color: getOrderStatusColor(item.order_status) },
              ]}
            >
              {getOrderStatusText(item.order_status)}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Thanh toán:</Text>
            <Text style={styles.statusPayment}>
              {getPaymentStatusText(item.payment_status)}
            </Text>
          </View>
          <View style={styles.arrowRow}>
            <Text style={styles.detailLink}>Xem chi tiết</Text>
            <Ionicons name="chevron-forward" size={18} color="#4CAF50" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.reorderButton, isReordering && styles.reorderButtonDisabled]}
          onPress={() => handleReorder(item._id)}
          disabled={isReordering}
        >
          {isReordering ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="reload-outline" size={18} color="#fff" />
              <Text style={styles.reorderButtonText}>Chọn mua lại</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải lịch sử đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF9800" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadOrders(1, false)}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const filterSection = (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Tìm kiếm / Lọc</Text>
      <TextInput
        style={styles.input}
        placeholder="Mã đơn hàng..."
        placeholderTextColor="#999"
        value={orderCode}
        onChangeText={setOrderCode}
        editable={!loading}
      />
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.dateInput]}
          placeholder="Từ ngày (YYYY-MM-DD)"
          placeholderTextColor="#999"
          value={dateFrom}
          onChangeText={setDateFrom}
          editable={!loading}
        />
        <TextInput
          style={[styles.input, styles.dateInput]}
          placeholder="Đến ngày (YYYY-MM-DD)"
          placeholderTextColor="#999"
          value={dateTo}
          onChangeText={setDateTo}
          editable={!loading}
        />
      </View>
      <Text style={styles.filterLabel}>Trạng thái đơn</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusScroll}
        contentContainerStyle={styles.statusChips}
      >
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.chip,
              orderStatus === opt.value && styles.chipActive,
            ]}
            onPress={() => setOrderStatus(opt.value)}
          >
            <Text
              style={[
                styles.chipText,
                orderStatus === opt.value && styles.chipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.applyButton}
        onPress={onApplyFilters}
        disabled={loading}
      >
        <Ionicons name="search-outline" size={20} color="#fff" />
        <Text style={styles.applyButtonText}>Áp dụng</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.filterWrapper}>{filterSection}</View>
      <FlatList
        style={styles.list}
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {appliedFilters.order_code ||
              appliedFilters.date_from ||
              appliedFilters.date_to ||
              (appliedFilters.order_status && appliedFilters.order_status !== "all")
                ? "Không có đơn hàng phù hợp"
                : "Chưa có đơn hàng nào"}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          ) : null
        }
      />
      <ReorderSelectionModal
        visible={reorderModalVisible}
        loading={reorderPreviewLoading}
        orderCode={activeReorderOrder?.order_code}
        items={reorderPreviewItems}
        onClose={() => setReorderModalVisible(false)}
        onConfirm={handleConfirmReorder}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  retryButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  filterWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: "#f5f5f5",
  },
  filterSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusScroll: {
    marginHorizontal: -16,
    marginBottom: 12,
  },
  statusChips: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  chipActive: {
    backgroundColor: "#4CAF50",
  },
  chipText: {
    fontSize: 13,
    color: "#666",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  applyButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
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
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  date: {
    fontSize: 13,
    color: "#666",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4CAF50",
  },
  statusOrder: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusPayment: {
    fontSize: 14,
    color: "#333",
  },
  arrowRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  detailLink: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  reorderButton: {
    marginTop: 10,
    backgroundColor: "#2E7D32",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  reorderButtonDisabled: {
    opacity: 0.7,
  },
  reorderButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
