import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import {
  createOrder,
  createPayOSPayment,
  checkPaymentStatus,
  getOrderById,
} from "../services/orderService";
import profileService from "../services/profileService";
import userCouponService from "../services/userCouponService";

export default function CheckoutScreen({ navigation, route }) {
  const { user } = useAuth();
  const { removeSelectedItems } = useCart();
  const { selectedItems, source } = route.params || {};
  const isReorderFlow = source === "reorder";

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("payos");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [userCoupons, setUserCoupons] = useState([]);
  const [showCouponPicker, setShowCouponPicker] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Address state
  const [address, setAddress] = useState({
    street: "",
    ward: "",
    district: "",
    city: "",
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [hasExistingAddress, setHasExistingAddress] = useState(false);

  // Load user profile and address
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await profileService.getMyProfile();
        if (response.data) {
          const userAddress = response.data.address;

          // Load existing address data into the form (even if incomplete)
          if (userAddress) {
            setAddress({
              street: userAddress.street || "",
              ward: userAddress.ward || "",
              district: userAddress.district || "",
              city: userAddress.city || "",
            });

            // Only set hasExistingAddress if ALL fields are filled
            if (
              userAddress.street &&
              userAddress.ward &&
              userAddress.district &&
              userAddress.city
            ) {
              setHasExistingAddress(true);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user]);

  // Load user's available coupons
  useEffect(() => {
    const loadUserCoupons = async () => {
      if (!user) return;

      setLoadingCoupons(true);
      try {
        const response = await userCouponService.getMyCoupons({
          is_used: false,
        });
        if (response.success && response.data) {
          setUserCoupons(response.data);
        }
      } catch (error) {
        console.error("Failed to load user coupons:", error);
      } finally {
        setLoadingCoupons(false);
      }
    };

    loadUserCoupons();
  }, [user]);

  const handleSelectCoupon = async (coupon) => {
    setShowCouponPicker(false);
    setLoading(true);

    try {
      const subtotal = calculateTotal().subtotal;
      const response = await userCouponService.validateCoupon(
        coupon.coupon_id.code,
        subtotal,
      );

      if (!response.success) {
        setCouponError(response.message || "Mã giảm giá không hợp lệ");
        setAppliedCoupon(null);
        setLoading(false);
        return;
      }

      // Apply coupon
      const validatedCoupon = {
        ...response.data.coupon,
        discount: response.data.discount,
      };
      setAppliedCoupon(validatedCoupon);
      setCouponError("");
      Alert.alert(
        "Thành công",
        `Đã áp dụng mã giảm giá: ${coupon.coupon_id.code}`,
      );
    } catch (error) {
      console.error("Failed to validate coupon:", error);
      setCouponError("Không thể xác thực mã giảm giá. Vui lòng thử lại.");
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon || !appliedCoupon.discount) return 0;

    // Use the discount amount already validated by backend
    return Math.round(appliedCoupon.discount);
  };

  // Calculate total from selected items only
  const calculateTotal = () => {
    if (!selectedItems || selectedItems.length === 0) {
      return {
        originalSubtotal: 0,
        rescueSavings: 0,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        itemCount: 0,
      };
    }

    const originalSubtotal = selectedItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.pricing_detail?.line_original_subtotal ??
            (item?.productUnit?.price || 0) * (item?.quantity || 0),
        ),
      0,
    );

    const subtotal = selectedItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.pricing_detail?.line_subtotal ??
            (item?.productUnit?.price || 0) * (item?.quantity || 0),
        ),
      0,
    );

    const rescueSavings = Math.max(0, originalSubtotal - subtotal);

    const taxAmount = selectedItems.reduce((sum, item) => {
      const lineTax = item?.pricing_detail?.line_tax_amount;
      if (lineTax !== undefined && lineTax !== null) {
        return sum + Number(lineTax || 0);
      }

      const itemSubtotal =
        (item?.productUnit?.price || 0) * (item?.quantity || 0);
      const itemTax = Math.round(
        (itemSubtotal * Number(item?.product?.tax_percentage || 0)) / 100,
      );
      return sum + itemTax;
    }, 0);

    const itemCount = selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      originalSubtotal: Math.round(originalSubtotal),
      rescueSavings: Math.round(rescueSavings),
      subtotal: Math.round(subtotal),
      taxAmount: Math.round(taxAmount),
      total: Math.round(subtotal + taxAmount),
      itemCount,
    };
  };

  const cartTotal = calculateTotal();
  const discountAmount = calculateDiscount();
  const finalTotal = Math.max(0, cartTotal.total - discountAmount);

  // Redirect to home if no selected items
  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      navigation.navigate("MainTabs", { screen: "HomeTab" });
    }
  }, [selectedItems, navigation]);

  // Validate address fields
  const validateAddress = () => {
    const errors = {};

    if (!address.street || address.street.trim() === "") {
      errors.street = "Vui lòng nhập số nhà, tên đường";
    }
    if (!address.ward || address.ward.trim() === "") {
      errors.ward = "Vui lòng nhập phường/xã";
    }
    if (!address.district || address.district.trim() === "") {
      errors.district = "Vui lòng nhập quận/huyện";
    }
    if (!address.city || address.city.trim() === "") {
      errors.city = "Vui lòng nhập tỉnh/thành phố";
    }

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create order and payment
  const handlePayment = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      navigation.navigate("MainTabs", { screen: "HomeTab" });
      return;
    }

    // Validate address only if user doesn't have existing address
    if (!hasExistingAddress) {
      if (!validateAddress()) {
        Alert.alert(
          "Thông tin thiếu",
          "Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng",
        );
        return;
      }

      // Save address to profile first time only
      setLoading(true);
      try {
        const response = await profileService.updateMyProfile({ address });

        if (response.data) {
          setHasExistingAddress(true);
        } else {
          throw new Error("Failed to save address");
        }
      } catch (error) {
        setLoading(false);
        Alert.alert("Lỗi", "Không thể lưu địa chỉ. Vui lòng thử lại.");
        return;
      }
      setLoading(false);
    }

    setLoading(true);

    try {
      const orderData = {
        items: selectedItems.map((item) => ({
          product_unit_id: item.product_unit_id,
          quantity: item.quantity,
        })),
        couponCode: appliedCoupon?.code || "",
        paymentMethod: paymentMethod,
      };

      const orderResponse = await createOrder(orderData);

      if (!orderResponse.success) {
        // Silent error - just go back to home
        navigation.navigate("MainTabs", { screen: "HomeTab" });
        return;
      }

      const order = orderResponse.data;

      // Step 2: If PayOS, create payment link
      if (paymentMethod === "payos") {
        const paymentResponse = await createPayOSPayment(order._id);

        if (!paymentResponse.success) {
          // Silent error - just go back to home
          navigation.navigate("MainTabs", { screen: "HomeTab" });
          return;
        }

        const { checkoutUrl } = paymentResponse.data;

        // Step 3: Prompt user not to close the app before opening browser
        const userAgreed = await new Promise((resolve) => {
          Alert.alert(
            "Lưu ý rất quan trọng!",
            "Tuyệt đối KHÔNG được tắt App trong quá trình quét QR.\n\nSau khi chuyển khoản thành công, nhớ trở lại đây để hệ thống chốt đơn hàng nhanh nhất.",
            [
              {
                text: "Hủy thanh toán",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Đã hiểu, Quét mã",
                onPress: () => resolve(true),
              },
            ],
            { cancelable: false },
          );
        });

        if (!userAgreed) {
          // If they cancel here, the order was already created in "unpaid" state,
          // so we navigate them to home or orders. The 15 min cronjob will clean it up.
          navigation.navigate("MainTabs", { screen: "HomeTab" });
          return;
        }

        // Step 4: Open PayOS payment page
        await WebBrowser.openBrowserAsync(checkoutUrl);

        // Step 5: After browser closes, ALWAYS check payment status
        setTimeout(async () => {
          await checkAndHandlePaymentStatus(order._id);
        }, 1000);
      } else {
        // Cash on delivery - fetch full order details and navigate to success screen
        const fullOrderResponse = await getOrderById(order._id);
        if (fullOrderResponse.success) {
          if (!isReorderFlow) {
            removeSelectedItems();
          }
          navigation.navigate("OrderSuccess", {
            order: fullOrderResponse.data.order,
            orderDetails: fullOrderResponse.data.orderDetails,
          });
        } else {
          // Failed to get order details, go to home
          navigation.navigate("MainTabs", { screen: "HomeTab" });
        }
      }
    } catch (error) {
      // Clean up the error message if it has "Error: " prefix
      const cleanMessage = error.message
        ? error.message.replace(/^Error:\s*/i, "")
        : "Có lỗi xảy ra khi thanh toán";

      Alert.alert("Thông báo", cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check payment status after user closes browser
  const checkAndHandlePaymentStatus = async (orderId) => {
    try {
      const statusResponse = await checkPaymentStatus(orderId);

      if (statusResponse.success) {
        const { payment_status } = statusResponse.data;

        if (payment_status === "paid") {
          // Payment successful - fetch full order details before navigating
          const fullOrderResponse = await getOrderById(orderId);
          if (fullOrderResponse.success) {
            if (!isReorderFlow) {
              removeSelectedItems();
            }
            navigation.navigate("OrderSuccess", {
              order: fullOrderResponse.data.order,
              orderDetails: fullOrderResponse.data.orderDetails,
            });
          } else {
            // Failed to get order details, return to the most relevant screen
            if (isReorderFlow) {
              navigation.navigate("OrderHistory");
            } else {
              navigation.navigate("MainTabs", { screen: "CartTab" });
            }
          }
        } else {
          if (isReorderFlow) {
            navigation.navigate("OrderHistory");
          } else {
            navigation.navigate("MainTabs", { screen: "CartTab" });
          }
        }
      } else {
        if (isReorderFlow) {
          navigation.navigate("OrderHistory");
        } else {
          navigation.navigate("MainTabs", { screen: "CartTab" });
        }
      }
    } catch (error) {
      console.error("Check payment status error:", error);
      if (isReorderFlow) {
        navigation.navigate("OrderHistory");
      } else {
        navigation.navigate("MainTabs", { screen: "CartTab" });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Products List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
          {selectedItems?.map((item, index) => {
            const pricingDetail = item?.pricing_detail || null;
            const hasRescue =
              Number(pricingDetail?.discounted_quantity || 0) > 0;
            const displayPrice = hasRescue
              ? pricingDetail?.line_subtotal || item.productUnit.price
              : item.productUnit.price;

            return (
              <View key={`${item.id}-${index}`} style={styles.productItem}>
                <Image
                  source={{
                    uri:
                      item.product.image_url ||
                      "https://via.placeholder.com/80",
                  }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.productUnit}>
                    Đơn vị: {item.unit.name}
                  </Text>
                  <View style={styles.productPriceRow}>
                    {hasRescue ? (
                      <View style={styles.priceWithRescue}>
                        <Text style={styles.originalPrice}>
                          {Number(
                            pricingDetail?.line_original_subtotal ||
                              item.productUnit.price * item.quantity,
                          ).toLocaleString("vi-VN")}
                          đ
                        </Text>
                        <View style={styles.rescuePriceContainer}>
                          <Text style={styles.rescuePrice}>
                            {Number(displayPrice || 0).toLocaleString("vi-VN")}đ
                          </Text>
                          <View style={styles.rescueBadge}>
                            <Text style={styles.rescueBadgeText}>
                              -
                              {Number(
                                pricingDetail?.display_discount_percentage ||
                                  item.rescuePricing?.discountPercentage ||
                                  0,
                              )}
                              %
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.mixedPriceNote}>
                          {Number(pricingDetail?.discounted_quantity || 0)} món
                          giảm, {Number(pricingDetail?.regular_quantity || 0)}{" "}
                          món thường
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.productPrice}>
                        {item.productUnit.price.toLocaleString("vi-VN")}đ
                      </Text>
                    )}
                    <Text style={styles.productQuantity}>x{item.quantity}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>

          {hasExistingAddress ? (
            /* Display existing address (read-only) */
            <View style={styles.addressDisplay}>
              <View style={styles.addressRow}>
                <Ionicons
                  name="home"
                  size={20}
                  color="#4CAF50"
                  style={styles.addressIcon}
                />
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>Số nhà, tên đường</Text>
                  <Text style={styles.addressValue}>{address.street}</Text>
                </View>
              </View>

              <View style={styles.addressRow}>
                <Ionicons
                  name="location"
                  size={20}
                  color="#4CAF50"
                  style={styles.addressIcon}
                />
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>Phường/Xã</Text>
                  <Text style={styles.addressValue}>{address.ward}</Text>
                </View>
              </View>

              <View style={styles.addressRow}>
                <Ionicons
                  name="location"
                  size={20}
                  color="#4CAF50"
                  style={styles.addressIcon}
                />
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>Quận/Huyện</Text>
                  <Text style={styles.addressValue}>{address.district}</Text>
                </View>
              </View>

              <View style={styles.addressRow}>
                <Ionicons
                  name="location"
                  size={20}
                  color="#4CAF50"
                  style={styles.addressIcon}
                />
                <View style={styles.addressTextContainer}>
                  <Text style={styles.addressLabel}>Tỉnh/Thành phố</Text>
                  <Text style={styles.addressValue}>{address.city}</Text>
                </View>
              </View>
            </View>
          ) : (
            /* Input form for new address */
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Số nhà, tên đường <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    addressErrors.street && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="home-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số nhà, tên đường"
                    value={address.street}
                    onChangeText={(text) => {
                      setAddress({ ...address, street: text });
                      setAddressErrors({ ...addressErrors, street: null });
                    }}
                  />
                </View>
                {addressErrors.street && (
                  <Text style={styles.errorText}>{addressErrors.street}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Phường/Xã <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    addressErrors.ward && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập phường/xã"
                    value={address.ward}
                    onChangeText={(text) => {
                      setAddress({ ...address, ward: text });
                      setAddressErrors({ ...addressErrors, ward: null });
                    }}
                  />
                </View>
                {addressErrors.ward && (
                  <Text style={styles.errorText}>{addressErrors.ward}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Quận/Huyện <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    addressErrors.district && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập quận/huyện"
                    value={address.district}
                    onChangeText={(text) => {
                      setAddress({ ...address, district: text });
                      setAddressErrors({ ...addressErrors, district: null });
                    }}
                  />
                </View>
                {addressErrors.district && (
                  <Text style={styles.errorText}>{addressErrors.district}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Tỉnh/Thành phố <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    addressErrors.city && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tỉnh/thành phố"
                    value={address.city}
                    onChangeText={(text) => {
                      setAddress({ ...address, city: text });
                      setAddressErrors({ ...addressErrors, city: null });
                    }}
                  />
                </View>
                {addressErrors.city && (
                  <Text style={styles.errorText}>{addressErrors.city}</Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mã giảm giá</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponInfo}>
                <Ionicons name="pricetag" size={20} color="#4CAF50" />
                <View style={styles.appliedCouponText}>
                  <Text style={styles.appliedCouponCode}>
                    {appliedCoupon.code}
                  </Text>
                  <Text style={styles.appliedCouponDesc}>
                    {appliedCoupon.description}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Ionicons name="close-circle" size={24} color="#f44336" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectCouponButton}
              onPress={() => setShowCouponPicker(true)}
            >
              <Ionicons name="pricetag-outline" size={20} color="#4CAF50" />
              <Text style={styles.selectCouponText}>
                Chọn mã giảm giá ({userCoupons.length} khả dụng)
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          {couponError ? (
            <Text style={styles.couponError}>{couponError}</Text>
          ) : null}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số lượng sản phẩm:</Text>
            <Text style={styles.summaryValue}>
              {selectedItems?.length || 0}
            </Text>
          </View>
          {cartTotal.rescueSavings > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giá gốc:</Text>
              <Text style={styles.summaryValue}>
                {cartTotal.originalSubtotal.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          )}
          {cartTotal.rescueSavings > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.rescueLabel]}>
                🌟 Chương trình giảm giá:
              </Text>
              <Text style={[styles.summaryValue, styles.rescueValue]}>
                -{cartTotal.rescueSavings.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>
              {cartTotal.subtotal.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế:</Text>
            <Text style={styles.summaryValue}>
              {cartTotal.taxAmount.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Giảm giá coupon:</Text>
              <Text style={styles.discountValue}>
                -{discountAmount.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalValue}>
              {finalTotal.toLocaleString("vi-VN")}đ
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "payos" && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod("payos")}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons
                name="card-outline"
                size={24}
                color={paymentMethod === "payos" ? "#4CAF50" : "#666"}
              />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>PayOS</Text>
                <Text style={styles.paymentOptionDesc}>
                  Thanh toán qua QR Code
                </Text>
              </View>
            </View>
            {paymentMethod === "payos" && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "cod" && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod("cod")}
          >
            <View style={styles.paymentOptionLeft}>
              <Ionicons
                name="cash-outline"
                size={24}
                color={paymentMethod === "cod" ? "#4CAF50" : "#666"}
              />
              <View style={styles.paymentOptionText}>
                <Text style={styles.paymentOptionTitle}>
                  Thanh toán khi nhận hàng
                </Text>
                <Text style={styles.paymentOptionDesc}>
                  Thanh toán bằng tiền mặt
                </Text>
              </View>
            </View>
            {paymentMethod === "cod" && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {paymentMethod === "cod"
                  ? "Đặt hàng"
                  : `Thanh toán ${finalTotal.toLocaleString("vi-VN")}đ`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Coupon Picker Modal */}
      <Modal
        visible={showCouponPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCouponPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn mã giảm giá</Text>
              <TouchableOpacity onPress={() => setShowCouponPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {loadingCoupons ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#4CAF50" />
              </View>
            ) : userCoupons.length === 0 ? (
              <View style={styles.noCouponsContainer}>
                <Ionicons name="pricetag-outline" size={64} color="#ccc" />
                <Text style={styles.noCouponsText}>
                  Bạn chưa có mã giảm giá nào
                </Text>
                <Text style={styles.noCouponsSubtext}>
                  Đổi điểm để nhận mã giảm giá
                </Text>
              </View>
            ) : (
              <FlatList
                data={userCoupons}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  const coupon = item.coupon_id;
                  const subtotal = calculateTotal().subtotal;
                  const isEligible = subtotal >= coupon.min_order_value;
                  const now = new Date();
                  const isExpired = now > new Date(coupon.end_date);

                  return (
                    <TouchableOpacity
                      style={[
                        styles.couponItem,
                        (!isEligible || isExpired) && styles.couponItemDisabled,
                      ]}
                      onPress={() => {
                        if (isEligible && !isExpired) {
                          handleSelectCoupon(item);
                        } else if (!isEligible) {
                          Alert.alert(
                            "Không đủ điều kiện",
                            `Đơn hàng tối thiểu ${coupon.min_order_value.toLocaleString("vi-VN")}đ`,
                          );
                        } else {
                          Alert.alert("Hết hạn", "Mã giảm giá đã hết hạn");
                        }
                      }}
                      disabled={!isEligible || isExpired}
                    >
                      <View style={styles.couponItemLeft}>
                        <Ionicons
                          name="pricetag"
                          size={24}
                          color={isEligible && !isExpired ? "#4CAF50" : "#999"}
                        />
                        <View style={styles.couponItemInfo}>
                          <Text style={styles.couponItemCode}>
                            {coupon.code}
                          </Text>
                          <Text style={styles.couponItemDesc} numberOfLines={2}>
                            {coupon.description}
                          </Text>
                          <Text style={styles.couponItemCondition}>
                            Đơn tối thiểu:{" "}
                            {coupon.min_order_value.toLocaleString("vi-VN")}đ
                          </Text>
                        </View>
                      </View>
                      {!isEligible && (
                        <View style={styles.couponBadge}>
                          <Text style={styles.couponBadgeText}>
                            Chưa đủ điều kiện
                          </Text>
                        </View>
                      )}
                      {isExpired && (
                        <View
                          style={[
                            styles.couponBadge,
                            styles.couponBadgeExpired,
                          ]}
                        >
                          <Text style={styles.couponBadgeText}>Hết hạn</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.couponList}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
  },
  rescueLabel: {
    color: "#FF6B00",
    fontWeight: "600",
  },
  rescueValue: {
    color: "#FF6B00",
    fontWeight: "700",
  },
  discountLabel: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  discountValue: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
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
  paymentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#f1f8f4",
  },
  paymentOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: "#666",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  payButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  payButtonDisabled: {
    backgroundColor: "#ccc",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 8,
  },
  productItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceWithRescue: {
    flexDirection: "column",
  },
  originalPrice: {
    fontSize: 11,
    color: "#999",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  rescuePriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rescuePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  mixedPriceNote: {
    marginTop: 2,
    fontSize: 11,
    color: "#666",
  },
  rescueBadge: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rescueBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
  },
  selectCouponButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  selectCouponText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  couponInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  appliedCouponContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  appliedCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedCouponText: {
    marginLeft: 10,
    flex: 1,
  },
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  appliedCouponDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  couponError: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalLoading: {
    padding: 40,
    alignItems: "center",
  },
  noCouponsContainer: {
    padding: 40,
    alignItems: "center",
  },
  noCouponsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  noCouponsSubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
  },
  couponList: {
    padding: 16,
  },
  couponItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  couponItemDisabled: {
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
  },
  couponItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  couponItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  couponItemCode: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  couponItemDesc: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  couponItemCondition: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  couponBadge: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  couponBadgeExpired: {
    backgroundColor: "#f44336",
  },
  couponBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  required: {
    color: "#f44336",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#f44336",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  addressDisplay: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
});
