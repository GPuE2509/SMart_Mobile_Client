import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../contexts/CartContext";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart, toggleSelectItem } = useCart();

  const handleRemove = () => {
    Alert.alert("Xóa sản phẩm", "Bạn có chắc muốn xóa sản phẩm này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        onPress: () => removeFromCart(item.id),
        style: "destructive",
      },
    ]);
  };

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      handleRemove();
    }
  };

  // Prefer backend FEFO pricing detail to reflect mixed discounted/regular quantities.
  const pricingDetail = item.pricing_detail || null;
  const hasRescue = Number(pricingDetail?.discounted_quantity || 0) > 0;
  const displayPrice = hasRescue
    ? pricingDetail?.allocations?.find((part) => part?.is_discounted)
        ?.unit_price || item.productUnit.price
    : item.productUnit.price;
  const subtotal = Number(
    pricingDetail?.line_subtotal ?? displayPrice * item.quantity,
  );

  // Get unit name from populated unit_id or fallback to 'đơn vị'
  const unitName =
    item.unit?.name || item.productUnit?.unit_id?.name || "đơn vị";

  return (
    <View style={styles.container}>
      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleSelectItem(item.id)}
      >
        <Ionicons
          name={item.selected ? "checkbox" : "square-outline"}
          size={24}
          color={item.selected ? "#4CAF50" : "#999"}
        />
      </TouchableOpacity>

      <Image source={{ uri: item.product.image_url }} style={styles.image} />

      <View style={styles.details}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product.name}
        </Text>

        <View style={styles.unitRow}>
          <Text style={styles.unitText}>Đơn vị: {unitName}</Text>
          {!item.productUnit.is_base_unit &&
            item.productUnit.exchange_value && (
              <Text style={styles.exchangeText}>
                ({item.productUnit.exchange_value} đơn vị)
              </Text>
            )}
        </View>

        <View style={styles.priceContainer}>
          {hasRescue ? (
            <>
              <Text style={styles.originalPrice}>
                {(pricingDetail?.line_original_subtotal || 0).toLocaleString(
                  "vi-VN",
                )}
                đ
              </Text>
              <View style={styles.rescuePriceRow}>
                <Text style={styles.rescuePrice}>
                  {subtotal.toLocaleString("vi-VN")}đ / {item.quantity}{" "}
                  {unitName}
                </Text>
                <View style={styles.rescueBadge}>
                  <Text style={styles.rescueBadgeText}>
                    -
                    {pricingDetail?.display_discount_percentage ||
                      item.rescuePricing?.discountPercentage ||
                      0}
                    %
                  </Text>
                </View>
              </View>
              <Text style={styles.breakdownText}>
                {Number(pricingDetail?.discounted_quantity || 0)} món giảm giá,{" "}
                {Number(pricingDetail?.regular_quantity || 0)} món thường
              </Text>
            </>
          ) : (
            <Text style={styles.price}>
              {item.productUnit.price.toLocaleString("vi-VN")}đ / {unitName}
            </Text>
          )}

          {Number(pricingDetail?.discounted_available_quantity || 0) > 0 && (
            <Text style={styles.discountStockText}>
              {(() => {
                const totalDiscounted = Number(
                  pricingDetail?.discounted_available_quantity || 0,
                );
                const breakdown = Array.isArray(
                  pricingDetail?.discounted_stock_breakdown,
                )
                  ? pricingDetail.discounted_stock_breakdown
                  : [];

                if (!breakdown.length) {
                  return `Đang giảm giá trong kho: ${totalDiscounted} sản phẩm`;
                }

                const text = breakdown
                  .filter((part) => Number(part?.quantity || 0) > 0)
                  .map(
                    (part) =>
                      `${Number(part.quantity)} sp (-${Number(part.discount_percentage || 0)}%)`,
                  )
                  .join(", ");

                return `Đang giảm giá trong kho: ${totalDiscounted} sản phẩm (${text})`;
              })()}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.quantityControl}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecrement}
            >
              <Ionicons
                name={item.quantity === 1 ? "trash-outline" : "remove"}
                size={18}
                color="#666"
              />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleIncrement}
            >
              <Ionicons name="add" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtotal}>
            {subtotal.toLocaleString("vi-VN")}đ
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
        <Ionicons name="close-circle" size={24} color="#999" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  unitText: {
    fontSize: 13,
    color: "#666",
  },
  exchangeText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  priceContainer: {
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  rescuePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rescuePrice: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "600",
  },
  rescueBadge: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rescueBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
  },
  breakdownText: {
    fontSize: 12,
    color: "#FF6B00",
    marginTop: 2,
  },
  discountStockText: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: "center",
  },
  subtotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  removeButton: {
    padding: 4,
  },
});
