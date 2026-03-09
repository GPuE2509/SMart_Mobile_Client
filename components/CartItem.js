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

  // Check if item has rescue pricing
  const hasRescue = item.rescuePricing?.isAvailable;
  const displayPrice = hasRescue 
    ? item.rescuePricing.discountedPrice 
    : item.productUnit.price;
  const subtotal = displayPrice * item.quantity;

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
                {item.productUnit.price.toLocaleString("vi-VN")}đ
              </Text>
              <View style={styles.rescuePriceRow}>
                <Text style={styles.rescuePrice}>
                  {displayPrice.toLocaleString("vi-VN")}đ / {unitName}
                </Text>
                <View style={styles.rescueBadge}>
                  <Text style={styles.rescueBadgeText}>
                    -{item.rescuePricing.discountPercentage}%
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.price}>
              {item.productUnit.price.toLocaleString("vi-VN")}đ / {unitName}
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
