import api from "./api";

const userCouponService = {
  /**
   * Purchase a coupon using loyalty points
   * @param {string} couponId
   */
  purchase: async (couponId) => {
    try {
      const response = await api.post("/customer/user-coupons/purchase", {
        coupon_id: couponId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all coupons in current user's wallet
   * @param {Object} params - { is_used }
   */
  getMyCoupons: async (params = {}) => {
    try {
      const response = await api.get("/customer/user-coupons", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Validate a coupon code for checkout
   * @param {string} couponCode
   * @param {number} orderAmount
   */
  validateCoupon: async (couponCode, orderAmount) => {
    try {
      const response = await api.post("/customer/user-coupons/validate", {
        coupon_code: couponCode,
        order_amount: orderAmount,
      });
      return response.data;
    } catch (error) {
      // Handle validation errors (HTTP 400)
      if (error.response && error.response.status === 400) {
        return error.response.data;
      }
      throw error;
    }
  },
};

export default userCouponService;

