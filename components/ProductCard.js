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
        return {
          min: product.min_price,
          max: product.max_price,
          isRange: true,
        };
      }
      return {
        min: product.min_price,
        max: product.min_price,
        isRange: false,
      };
    }

    if (product.units && product.units.length > 0) {
      const prices = product.units.map((u) => u.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      return {
        min: minPrice,
        max: maxPrice,
        isRange: minPrice !== maxPrice,
      };
    }

    return null;
  };

  const priceData = getDisplayPrice();
  const displayRescueDiscount = Number(
    product.displayRescueDiscount || product.maxRescueDiscount || 0,
  );
  const hasRescue = displayRescueDiscount > 0;
  const discountedStock = Number(product.discounted_stock || 0);

  // Calculate discounted price if rescue pricing exists
  const getDiscountedPrice = (price) => {
    if (!hasRescue) return price;
    return Math.round(price * (1 - displayRescueDiscount / 100));
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: product.image_url || "https://via.placeholder.com/150",
          }}
          style={styles.image}
          resizeMode="cover"
        />
        {hasRescue && (
          <View style={styles.rescueBadge}>
            <Ionicons name="flash" size={12} color="#fff" />
            <Text style={styles.rescueBadgeText}>
              -{displayRescueDiscount}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {priceData ? (
          <View style={styles.priceContainer}>
            {hasRescue && (
              <Text style={styles.originalPrice}>
                {priceData.isRange
                  ? `${priceData.min.toLocaleString("vi-VN")}đ - ${priceData.max.toLocaleString("vi-VN")}đ`
                  : `${priceData.min.toLocaleString("vi-VN")}đ`}
              </Text>
            )}
            <Text style={[styles.price, hasRescue && styles.discountedPrice]}>
              {priceData.isRange
                ? `${getDiscountedPrice(priceData.min).toLocaleString("vi-VN")}đ - ${getDiscountedPrice(priceData.max).toLocaleString("vi-VN")}đ`
                : `${getDiscountedPrice(priceData.min).toLocaleString("vi-VN")}đ`}
            </Text>
            {discountedStock > 0 && (
              <Text style={styles.discountStockText}>
                {(() => {
                  const breakdown = Array.isArray(
                    product.discounted_stock_breakdown,
                  )
                    ? product.discounted_stock_breakdown
                    : [];

                  if (!breakdown.length) {
                    return `Đang giảm giá: ${discountedStock} sản phẩm`;
                  }

                  const text = breakdown
                    .filter((part) => Number(part?.quantity || 0) > 0)
                    .map(
                      (part) =>
                        `${Number(part.quantity)} sp (-${Number(part.discount_percentage || 0)}%)`,
                    )
                    .join(", ");

                  return `Đang giảm giá: ${discountedStock} sản phẩm (${text})`;
                })()}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.price}>Liên hệ</Text>
        )}

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
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 120,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  rescueBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF6B00",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  rescueBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
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
  priceContainer: {
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  discountedPrice: {
    color: "#FF6B00",
  },
  discountStockText: {
    marginTop: 2,
    fontSize: 11,
    color: "#666",
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
