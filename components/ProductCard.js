import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProductCard({ product, onPress }) {
  const handleCardPress = () => {
    if (onPress) {
      onPress(product);
    }
  };

  // Get price from min_price, or units, or default
  const getDisplayPrice = () => {
    if (product.min_price) {
      if (product.max_price && product.max_price !== product.min_price) {
        return `${product.min_price.toLocaleString("vi-VN")}đ - ${product.max_price.toLocaleString("vi-VN")}đ`;
      }
      return `${product.min_price.toLocaleString("vi-VN")}đ`;
    }

    if (product.units && product.units.length > 0) {
      const prices = product.units.map((u) => u.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice !== maxPrice) {
        return `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`;
      }
      return `${minPrice.toLocaleString("vi-VN")}đ`;
    }

    return "Liên hệ";
  };

  const displayPrice = getDisplayPrice();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: product.image_url || "https://via.placeholder.com/150" }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={styles.price}>{displayPrice}</Text>

        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Xem chi tiết</Text>
          <Ionicons name="arrow-forward" size={14} color="#4CAF50" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
    minHeight: 36,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
  viewButtonText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "500",
  },
});
