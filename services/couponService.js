import api from "./api";

const couponService = {
  /**
   * Get all currently available coupons for customers
   * @param {Object} params - { page, limit, sort_by, sort_order }
   */
  getAvailable: async (params = {}) => {
    try {
      const response = await api.get("/customer/coupons/available", {
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default couponService;

