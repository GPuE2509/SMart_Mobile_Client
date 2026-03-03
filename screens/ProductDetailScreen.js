import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import productService from "../services/productService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProductDetailScreen({ navigation, route }) {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const productId = route.params.productId;
  const [product, setProduct] = useState(null);
  const [productUnits, setProductUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const flatListRef = useRef(null);

  // Load product data
  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const productRes = await productService.getById(productId);

      if (productRes.success) {
        const productData = productRes.data;
        setProduct(productData);

        // Setup image gallery - use multiple images if available, otherwise use main image
        const productImages = [];
        if (productData.image_url) {
          productImages.push(productData.image_url);
        }
        // If product has additional_images array, add them
        if (
          productData.additional_images &&
          productData.additional_images.length > 0
        ) {
          productImages.push(...productData.additional_images);
        }
        // If still no images, add a placeholder
        if (productImages.length === 0) {
          productImages.push(
            "https://via.placeholder.com/400x300?text=No+Image",
          );
        }
        setImages(productImages);

        // Units are already included in product data
        if (productData.units && productData.units.length > 0) {
          const units = productData.units.filter((u) => u.is_active);
          setProductUnits(units);
          // Select first active unit by default
          setSelectedUnit(units[0] || null);
        }
      } else {
        Alert.alert("Lỗi", productRes.message || "Không tìm thấy sản phẩm");
      }
    } catch (error) {
      Alert.alert("Lỗi", `Không thể tải thông tin sản phẩm: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
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

  const handleAddToCart = () => {
    if (!user) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => navigation.navigate("Login") },
        ],
      );
      return;
    }

    if (!selectedUnit) {
      Alert.alert("Thông báo", "Vui lòng chọn đơn vị sản phẩm");
      return;
    }

    const availableStock = selectedUnit.available_stock || 0;

    if (availableStock === 0) {
      Alert.alert("Thông báo", "Đơn vị này hiện đã hết hàng");
      return;
    }

    if (quantity > availableStock) {
      Alert.alert(
        "Thông báo",
        `Số lượng tồn kho không đủ. Chỉ còn ${availableStock} ${selectedUnit.unit_id?.name || "sản phẩm"}`,
      );
      return;
    }

    // Fix: Pass correct parameters (productId, productUnit, product, quantity)
    addToCart(product._id, selectedUnit, product, quantity);
    Alert.alert(
      "Thành công",
      `Đã thêm ${quantity} ${selectedUnit.unit_id?.name || "sản phẩm"} ${product.name} vào giỏ hàng`,
      [
        { text: "Tiếp tục mua", style: "cancel" },
        {
          text: "Xem giỏ hàng",
          onPress: () => navigation.navigate("MainTabs", { screen: "CartTab" }),
        },
      ],
    );
  };

  const increaseQuantity = () => {
    const maxStock = selectedUnit?.available_stock || 0;
    if (selectedUnit && quantity < maxStock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  // Calculate stock status based on selected unit or total product stock
  const getCurrentStock = () => {
    if (selectedUnit) {
      return selectedUnit.available_stock || 0;
    }
    return product.total_stock || 0;
  };

  const currentStock = getCurrentStock();
  const stockStatus =
    currentStock > 10
      ? "Còn hàng"
      : currentStock > 0
        ? `Chỉ còn ${currentStock} ${selectedUnit ? selectedUnit.unit_id?.name || "sản phẩm" : "sản phẩm"}`
        : "Hết hàng";

  const stockColor =
    currentStock > 10 ? "#4CAF50" : currentStock > 0 ? "#FF9800" : "#f44336";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("MainTabs", { screen: "CartTab" })}
        >
          <Ionicons name="cart-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Product Image Gallery */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `image-${index}`}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setCurrentImageIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={styles.imageSlide}>
                <Image
                  source={{ uri: item }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </View>
            )}
          />

          {/* Image Indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={`indicator-${index}`}
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <Ionicons
              name={
                product.total_stock > 0 ? "checkmark-circle" : "close-circle"
              }
              size={20}
              color={stockColor}
            />
            <Text style={[styles.stockText, { color: stockColor }]}>
              {stockStatus}
            </Text>
          </View>

          {/* Price */}
          {selectedUnit && (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {formatPrice(selectedUnit.price)}
              </Text>
              <Text style={styles.priceUnit}>
                / {selectedUnit.unit_id?.name || "đơn vị"}
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Unit Selection */}
          {productUnits.length > 0 ? (
            <View style={styles.unitSelectionContainer}>
              <Text style={styles.sectionTitle}>Chọn đơn vị</Text>
              <View style={styles.unitOptions}>
                {productUnits.map((unit) => {
                  const unitStock = unit.available_stock || 0;
                  const isOutOfStock = unitStock === 0;

                  return (
                    <TouchableOpacity
                      key={unit._id}
                      style={[
                        styles.unitOption,
                        selectedUnit?._id === unit._id &&
                          styles.unitOptionActive,
                        isOutOfStock && styles.unitOptionDisabled,
                      ]}
                      onPress={() => {
                        if (!isOutOfStock) {
                          setSelectedUnit(unit);
                          setQuantity(1);
                        }
                      }}
                      disabled={isOutOfStock}
                    >
                      <View style={styles.unitOptionContent}>
                        <View style={styles.unitNameContainer}>
                          <Text
                            style={[
                              styles.unitName,
                              selectedUnit?._id === unit._id &&
                                styles.unitNameActive,
                              isOutOfStock && styles.unitTextDisabled,
                            ]}
                          >
                            {unit.unit_id?.name || "Đơn vị"}
                            {unit.unit_value > 1 && ` (${unit.unit_value})`}
                          </Text>
                          <Text
                            style={[
                              styles.unitStock,
                              isOutOfStock
                                ? styles.unitStockOut
                                : styles.unitStockAvailable,
                            ]}
                          >
                            {isOutOfStock ? "Hết hàng" : `Còn ${unitStock}`}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.unitPrice,
                            selectedUnit?._id === unit._id &&
                              styles.unitPriceActive,
                            isOutOfStock && styles.unitTextDisabled,
                          ]}
                        >
                          {formatPrice(unit.price)}
                        </Text>
                      </View>
                      {selectedUnit?._id === unit._id && !isOutOfStock && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#4CAF50"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.unitSelectionContainer}>
              <Text style={styles.sectionTitle}>Chọn đơn vị</Text>
              <Text style={styles.noUnitsText}>
                Sản phẩm chưa có đơn vị bán
              </Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.sectionTitle}>Số lượng</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={quantity <= 1 ? "#ccc" : "#333"}
                />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  selectedUnit &&
                    quantity >= (selectedUnit.available_stock || 0) &&
                    styles.quantityButtonDisabled,
                ]}
                onPress={increaseQuantity}
                disabled={
                  !selectedUnit ||
                  quantity >= (selectedUnit.available_stock || 0)
                }
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={
                    selectedUnit &&
                    quantity >= (selectedUnit.available_stock || 0)
                      ? "#ccc"
                      : "#333"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã vạch:</Text>
              <Text style={styles.detailValue}>
                {selectedUnit?.barcode || "N/A"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thuế:</Text>
              <Text style={styles.detailValue}>{product.tax_percentage}%</Text>
            </View>
            {selectedUnit && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Tồn kho ({selectedUnit.unit_id?.name}):
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    {
                      color:
                        (selectedUnit.available_stock || 0) === 0
                          ? "#f44336"
                          : (selectedUnit.available_stock || 0) < 10
                            ? "#FF9800"
                            : "#4CAF50",
                    },
                  ]}
                >
                  {selectedUnit.available_stock || 0}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tổng tồn kho:</Text>
              <Text style={styles.detailValue}>{product.total_stock || 0}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalPrice}>
            {selectedUnit ? formatPrice(selectedUnit.price * quantity) : "0đ"}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (!selectedUnit || (selectedUnit.available_stock || 0) === 0) &&
              styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={!selectedUnit || (selectedUnit.available_stock || 0) === 0}
        >
          <Ionicons name="cart" size={24} color="#fff" />
          <Text style={styles.addToCartText}>
            {!selectedUnit
              ? "Chọn đơn vị"
              : (selectedUnit.available_stock || 0) === 0
                ? "Hết hàng"
                : "Thêm vào giỏ"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeIndicator: {
    width: 24,
    backgroundColor: "#fff",
  },
  imageCounter: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  priceUnit: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  unitSelectionContainer: {
    marginBottom: 24,
  },
  unitOptions: {
    gap: 12,
  },
  unitOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  unitOptionActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  unitOptionDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  unitOptionContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitNameContainer: {
    flex: 1,
  },
  unitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  unitNameActive: {
    color: "#4CAF50",
  },
  unitTextDisabled: {
    color: "#999",
  },
  unitStock: {
    fontSize: 13,
    marginTop: 2,
  },
  unitStockAvailable: {
    color: "#4CAF50",
  },
  unitStockOut: {
    color: "#f44336",
    fontWeight: "600",
  },
  unitPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginLeft: 12,
  },
  unitPriceActive: {
    color: "#2E7D32",
  },
  outOfStockText: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
    fontWeight: "500",
  },
  noUnitsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    marginTop: 8,
  },
  quantityContainer: {
    marginBottom: 24,
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  quantityButtonDisabled: {
    backgroundColor: "#fafafa",
    borderColor: "#eee",
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    minWidth: 40,
    textAlign: "center",
  },
  detailsContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
