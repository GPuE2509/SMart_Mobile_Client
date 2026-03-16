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

export const getReorderPreview = async (orderId) => {
  const response = await api.get(`/customer/orders/${orderId}/reorder-preview`);
  return response.data;
};

// Reorder: add order items back to cart
export const reorderOrder = async (orderId) => {
  const response = await api.post(`/customer/orders/${orderId}/reorder`);
  return response.data;
};

// Get user orders với bộ lọc (order_code, date_from, date_to, order_status)
export const getUserOrders = async (page = 1, limit = 10, filters = {}) => {
  const orderCode = typeof filters.order_code === "string" ? filters.order_code.trim() : "";
  const orderStatus = filters.order_status && filters.order_status !== "all" ? String(filters.order_status) : "all";
  const params = {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    order_code: orderCode,
    date_from: filters.date_from || "",
    date_to: filters.date_to || "",
    order_status: orderStatus,
  };
  const res = await api.get("/customer/orders", { params });
  return res.data;
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

