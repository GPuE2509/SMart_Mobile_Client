import api from "./api";

// Create new order
export const createOrder = async (orderData) => {
  const response = await api.post("/customer/orders", orderData);
  return response.data;
};

// Create PayOS payment link
export const createPayOSPayment = async (orderId) => {
  const response = await api.post("/customer/orders/payos/create-payment", {
    orderId,
  });
  return response.data;
};

// Get order by ID
export const getOrderById = async (orderId) => {
  const response = await api.get(`/customer/orders/${orderId}`);
  return response.data;
};

// Get user orders
export const getUserOrders = async (page = 1, limit = 10) => {
  const response = await api.get("/customer/orders", {
    params: { page, limit },
  });
  return response.data;
};

// Check payment status
export const checkPaymentStatus = async (orderId) => {
  const response = await api.get(`/customer/orders/${orderId}/payment-status`);
  return response.data;
};

// ================= CART APIs =================

export const getCart = async () => {
  const response = await api.get("/customer/cart");
  return response.data;
};

export const addToCart = async (productUnitId, quantity = 1) => {
  const response = await api.post("/customer/cart/add", {
    productUnitId,
    quantity,
  });
  return response.data;
};

export const addRecipeToCart = async (recipeId) => {
  const response = await api.post("/customer/cart/add-recipe", {
    recipeId,
  });
  return response.data;
};

export const updateCartQuantity = async (cartItemId, quantity) => {
  const response = await api.put(`/customer/cart/update/${cartItemId}`, {
    quantity,
  });
  return response.data;
};

export const removeFromCart = async (cartItemId) => {
  const response = await api.delete(`/customer/cart/remove/${cartItemId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete("/customer/cart/clear");
  return response.data;
};

