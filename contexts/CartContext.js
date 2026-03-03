import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    saveCart();
  }, [cartItems]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem("cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      // Error loading cart
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem("cart", JSON.stringify(cartItems));
    } catch (error) {
      // Error saving cart
    }
  };

  /**
   * Add item to cart or update quantity if already exists
   * @param {string} productId - Product ID
   * @param {object} productUnit - Product Unit object with price and unit_id
   * @param {object} product - Product object with full details
   * @param {number} quantity - Quantity to add
   */
  const addToCart = (productId, productUnit, product, quantity = 1) => {
    if (!product || !productUnit) {
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_unit_id === productUnit._id,
      );

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((item) =>
          item.product_unit_id === productUnit._id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      } else {
        // Add new item with selected = true by default
        const newItem = {
          id: Date.now(), // Temporary ID for cart item
          product_id: productId,
          product_unit_id: productUnit._id,
          quantity,
          selected: true, // Default selected
          // Include full details for easy access
          product,
          productUnit,
          unit: productUnit.unit_id, // Unit info is populated in productUnit
        };
        return [...prevItems, newItem];
      }
    });
  };

  /**
   * Remove item from cart
   * @param {number} cartItemId - Cart item ID
   */
  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== cartItemId),
    );
  };

  /**
   * Update quantity of a cart item
   * @param {number} cartItemId - Cart item ID
   * @param {number} newQuantity - New quantity
   */
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  /**
   * Clear all items from cart
   */
  const clearCart = () => {
    setCartItems([]);
  };

  /**
   * Get cart item count (total number of items)
   */
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * Calculate cart total with tax
   * @param {boolean} selectedOnly - If true, calculate only for selected items
   */
  const getCartTotal = (selectedOnly = false) => {
    const items = selectedOnly
      ? cartItems.filter((item) => item.selected)
      : cartItems;

    const subtotal = items.reduce((total, item) => {
      return total + item.productUnit.price * item.quantity;
    }, 0);

    // Calculate weighted average tax rate
    const totalTax = items.reduce((total, item) => {
      const itemSubtotal = item.productUnit.price * item.quantity;
      const itemTax = (itemSubtotal * (item.product.tax_percentage || 0)) / 100;
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

  /**
   * Check if a product unit is in cart
   * @param {string} productUnitId
   * @returns {boolean}
   */
  const isInCart = (productUnitId) => {
    return cartItems.some((item) => item.product_unit_id === productUnitId);
  };

  /**
   * Get quantity of a product unit in cart
   * @param {string} productUnitId
   * @returns {number}
   */
  const getCartItemQuantity = (productUnitId) => {
    const item = cartItems.find(
      (item) => item.product_unit_id === productUnitId,
    );
    return item ? item.quantity : 0;
  };

  /**
   * Toggle selection of a cart item
   * @param {number} cartItemId - Cart item ID
   */
  const toggleSelectItem = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  /**
   * Toggle select all items
   */
  const toggleSelectAll = () => {
    const allSelected = cartItems.every((item) => item.selected);
    setCartItems((prevItems) =>
      prevItems.map((item) => ({ ...item, selected: !allSelected })),
    );
  };

  /**
   * Get selected items only
   * @returns {array} Array of selected cart items
   */
  const getSelectedItems = () => {
    return cartItems.filter((item) => item.selected);
  };

  /**
   * Remove selected items from cart
   */
  const removeSelectedItems = () => {
    setCartItems((prevItems) => prevItems.filter((item) => !item.selected));
  };

  /**
   * Get count of selected items
   * @returns {number}
   */
  const getSelectedCount = () => {
    return cartItems.filter((item) => item.selected).length;
  };

  const value = {
    cartItems,
    addToCart,
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
