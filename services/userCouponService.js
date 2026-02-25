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
};

export default userCouponService;

