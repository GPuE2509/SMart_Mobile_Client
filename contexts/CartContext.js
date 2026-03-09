import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as orderService from "../services/orderService";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth(); // Monitor login state

  // Load cart whenever user logs in or app mounts
  useEffect(() => {
    if (user) {
      loadCartAPI();
    } else {
      setCartItems([]); // Clear local state if logged out
    }
  }, [user]);

  /**
   * Fetch cart from database
   */
  const loadCartAPI = async () => {
    try {
      setIsLoading(true);
      const data = await orderService.getCart();
      
      // Inject "selected" property since the backend doesn't track UI selection status
      const mappedItems = (data.data || []).map(item => ({
        ...item,
        id: item._id, // Map for UI compatibility
        selected: true
      }));
      setCartItems(mappedItems);
    } catch (error) {
      console.error("Error loading cart from DB:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add item to cart online
   */
  const addToCart = async (productId, productUnit, product, quantity = 1) => {
    if (!user) {
      Alert.alert("Yêu cầu", "Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return;
    }

    try {
      setIsLoading(true);
      await orderService.addToCart(productUnit._id, quantity);
      await loadCartAPI(); // Reload from server to get accurate IDs and sync
    } catch (error) {
      console.error("Add to cart error:", error);
      Alert.alert("Lỗi", "Không thể thêm vào giỏ hàng");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add recipe ingredients to cart
   */
  const addRecipeToCart = async (recipeId) => {
    if (!user) {
      Alert.alert("Yêu cầu", "Vui lòng đăng nhập để thêm vào giỏ hàng!");
      return false;
    }

    try {
      setIsLoading(true);
      const response = await orderService.addRecipeToCart(recipeId);
      await loadCartAPI(); // Reload from server to get accurate IDs and sync
      
      return response; // Return the full response for caller to handle
    } catch (error) {
      console.error("Add recipe to cart error:", error);
      throw error; // Re-throw for caller to handle
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove item from online cart
   */
  const removeFromCart = async (cartItemId) => {
    try {
      setIsLoading(true);
      await orderService.removeFromCart(cartItemId);
      // Optimistic update for speedy UI
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
    } catch (error) {
      console.error("Remove from cart error:", error);
      await loadCartAPI(); // Revert on failure
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update quantity online
   */
  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      return removeFromCart(cartItemId);
    }

    try {
      // Optimistic update
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
      await orderService.updateCartQuantity(cartItemId, newQuantity);
    } catch (error) {
      console.error("Update quantity error:", error);
      await loadCartAPI(); // Revert to server state on failure
    }
  };

  /**
   * Clear all items from online cart
   */
  const clearCart = async () => {
    try {
      setIsLoading(true);
      await orderService.clearCart();
      setCartItems([]);
    } catch (error) {
      console.error("Clear cart error:", error);
      await loadCartAPI();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Selection Toggles (Local UI only)
   */
  const toggleSelectItem = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleSelectAll = () => {
    const allSelected = cartItems.every((item) => item.selected);
    setCartItems((prevItems) =>
      prevItems.map((item) => ({ ...item, selected: !allSelected }))
    );
  };

  /**
   * Getters
   */
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getSelectedCount = () => {
    return cartItems.filter((item) => item.selected).length;
  };

  const getSelectedItems = () => {
    return cartItems.filter((item) => item.selected);
  };

  const getCartTotal = (selectedOnly = false) => {
    const items = selectedOnly
      ? cartItems.filter((item) => item.selected)
      : cartItems;

    const subtotal = items.reduce((total, item) => {
      // Safety check in case productUnit fails to populate
      const price = item.productUnit?.price || 0;
      return total + price * item.quantity;
    }, 0);

    const totalTax = items.reduce((total, item) => {
      const price = item.productUnit?.price || 0;
      const taxPercent = item.product?.tax_percentage || 0;
      const itemTax = (price * item.quantity * taxPercent) / 100;
      return total + itemTax;
    }, 0);

    const averageTaxRate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;

    return {
      subtotal,
      taxAmount: totalTax,
      taxRate: averageTaxRate.toFixed(2),
      total: subtotal + totalTax,
      itemCount: selectedOnly
        ? items.reduce((sum, item) => sum + item.quantity, 0)
        : getCartItemCount(),
    };
  };

  const isInCart = (productUnitId) => {
    return cartItems.some((item) => item.product_unit_id === productUnitId);
  };

  const getCartItemQuantity = (productUnitId) => {
    const item = cartItems.find((item) => item.product_unit_id === productUnitId);
    return item ? item.quantity : 0;
  };

  const removeSelectedItems = async () => {
    const selected = getSelectedItems();
    for (const item of selected) {
        await removeFromCart(item.id);
    }
  };

  const value = {
    cartItems,
    isLoading, // Export loading state in case UI wants a spinner
    addToCart,
    addRecipeToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemCount: getCartItemCount(),
    cartTotal: getCartTotal(),
    isInCart,
    getCartItemQuantity,
    toggleSelectItem,
    toggleSelectAll,
    getSelectedItems,
    removeSelectedItems,
    getSelectedCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
