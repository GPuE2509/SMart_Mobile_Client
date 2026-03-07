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

// Search/filter products in cart
export const searchCart = async (filters = {}) => {
  const response = await api.get("/customer/orders/cart/search", {
    params: filters,
  });
  return response.data;
};
