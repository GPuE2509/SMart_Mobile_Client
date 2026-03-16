import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

function formatPrice(price) {
  return (price || 0).toLocaleString("vi-VN") + "đ";
}

export default function ReorderSelectionModal({
  visible,
  loading,
  orderCode,
  items,
  onClose,
  onConfirm,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [quantityMap, setQuantityMap] = useState({});

  const availableItems = useMemo(
    () => (items || []).filter((item) => item.availability?.isAvailable),
    [items],
  );

  useEffect(() => {
    if (visible) {
      setSelectedIds(availableItems.map((item) => String(item.id)));
      setQuantityMap(
        Object.fromEntries(
          availableItems.map((item) => [
            String(item.id),
            Math.max(1, Math.min(item.quantity || 1, item.availableQuantity || item.quantity || 1)),
          ]),
        ),
      );
    }
  }, [visible, availableItems]);

  const allSelected =
    availableItems.length > 0 && selectedIds.length === availableItems.length;

  const selectedItems = useMemo(
    () =>
      (items || [])
        .filter((item) => selectedIds.includes(String(item.id)))
        .map((item) => {
          const selectedQuantity = quantityMap[String(item.id)] || item.quantity || 1;
          const savingsPerUnit = item.rescuePricing?.isAvailable
            ? Math.max(
                0,
                (item.rescuePricing.originalPrice || 0) -
                  (item.rescuePricing.discountedPrice || 0),
              )
            : 0;

          return {
            ...item,
            quantity: selectedQuantity,
            rescuePricing: item.rescuePricing?.isAvailable
              ? {
                  ...item.rescuePricing,
                  savings: savingsPerUnit * selectedQuantity,
                }
              : item.rescuePricing,
          };
        }),
    [items, selectedIds, quantityMap],
  );

  const selectedUnitCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [selectedItems],
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(availableItems.map((item) => String(item.id)));
  };

  const toggleItem = (itemId) => {
    const normalizedId = String(itemId);
    setSelectedIds((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId],
    );
  };

  const updateQuantity = (item, nextQuantity) => {
    const itemId = String(item.id);
    const maxQuantity = Math.max(1, item.availableQuantity || item.quantity || 1);
    const normalizedQuantity = Math.max(1, Math.min(nextQuantity, maxQuantity));

    setQuantityMap((prev) => ({
      ...prev,
      [itemId]: normalizedQuantity,
    }));
  };

  const handleConfirm = () => {
    if (!selectedItems.length) return;
    onConfirm(selectedItems);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Chọn sản phẩm mua lại</Text>
              {!!orderCode && <Text style={styles.subtitle}>Đơn hàng: {orderCode}</Text>}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Đang tải sản phẩm từ đơn hàng...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.selectAllRow}
                onPress={toggleSelectAll}
                disabled={!availableItems.length}
              >
                <Ionicons
                  name={allSelected ? "checkbox" : "square-outline"}
                  size={22}
                  color={availableItems.length ? "#4CAF50" : "#bbb"}
                />
                <Text style={styles.selectAllText}>
                  Chọn tất cả ({selectedIds.length}/{availableItems.length})
                </Text>
              </TouchableOpacity>

              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {(items || []).map((item) => {
                  const disabled = !item.availability?.isAvailable;
                  const selected = selectedIds.includes(String(item.id));
                  const hasRescue = item.rescuePricing?.isAvailable;
                  const displayPrice = hasRescue
                    ? item.rescuePricing.discountedPrice
                    : item.productUnit?.price || 0;

                  const currentQuantity = quantityMap[String(item.id)] || item.quantity || 1;

                  return (
                    <View
                      key={String(item.id)}
                      style={[styles.itemCard, disabled && styles.itemCardDisabled]}
                    >
                      <TouchableOpacity
                        style={styles.checkboxButton}
                        onPress={() => !disabled && toggleItem(item.id)}
                        disabled={disabled}
                      >
                        <Ionicons
                          name={selected ? "checkbox" : "square-outline"}
                          size={24}
                          color={disabled ? "#bbb" : selected ? "#4CAF50" : "#999"}
                        />
                      </TouchableOpacity>
                      <Image
                        source={{
                          uri: item.product?.image_url || "https://via.placeholder.com/80",
                        }}
                        style={styles.image}
                      />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.product?.name || "Sản phẩm"}
                        </Text>
                        <Text style={styles.itemMeta}>
                          Đơn vị: {item.unit?.name || "N/A"}
                        </Text>
                        <Text style={styles.itemMeta}>Đã mua trước đó: x{item.previousQuantity || item.quantity}</Text>
                        {!disabled ? (
                          <Text style={styles.stockText}>
                            Tồn khả dụng: {item.availableQuantity}
                          </Text>
                        ) : null}
                        <Text style={styles.itemPrice}>{formatPrice(displayPrice)}</Text>
                        {hasRescue ? (
                          <Text style={styles.rescueText}>
                            Đang có giảm giá -{item.rescuePricing.discountPercentage}%
                          </Text>
                        ) : null}
                        {!disabled ? (
                          <View style={styles.quantityRow}>
                            <Text style={styles.quantityLabel}>Số lượng mua:</Text>
                            <View style={styles.quantityControl}>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(item, currentQuantity - 1)}
                                disabled={!selected || currentQuantity <= 1}
                              >
                                <Ionicons
                                  name="remove"
                                  size={16}
                                  color={!selected || currentQuantity <= 1 ? "#bbb" : "#555"}
                                />
                              </TouchableOpacity>
                              <Text style={styles.quantityValue}>{currentQuantity}</Text>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(item, currentQuantity + 1)}
                                disabled={!selected || currentQuantity >= item.availableQuantity}
                              >
                                <Ionicons
                                  name="add"
                                  size={16}
                                  color={
                                    !selected || currentQuantity >= item.availableQuantity
                                      ? "#bbb"
                                      : "#555"
                                  }
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}
                        {disabled ? (
                          <Text style={styles.unavailableText}>
                            {item.availability?.reason || "Sản phẩm hiện không thể mua lại"}
                          </Text>
                        ) : item.availability?.reason ? (
                          <Text style={styles.noticeText}>{item.availability.reason}</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Đã chọn {selectedItems.length} sản phẩm, tổng số lượng {selectedUnitCount}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    selectedItems.length === 0 && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={selectedItems.length === 0}
                >
                  <Text style={styles.confirmButtonText}>Tiếp tục thanh toán</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#666",
  },
  centered: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  list: {
    maxHeight: 420,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f9faf9",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf1ed",
  },
  checkboxButton: {
    paddingTop: 2,
  },
  itemCardDisabled: {
    opacity: 0.6,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  stockText: {
    fontSize: 12,
    color: "#2E7D32",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
    marginTop: 4,
  },
  quantityRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f4f2",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
  rescueText: {
    marginTop: 4,
    fontSize: 12,
    color: "#FF6B00",
    fontWeight: "600",
  },
  noticeText: {
    marginTop: 6,
    fontSize: 12,
    color: "#8D6E63",
  },
  unavailableText: {
    marginTop: 6,
    fontSize: 12,
    color: "#D32F2F",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    color: "#444",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});