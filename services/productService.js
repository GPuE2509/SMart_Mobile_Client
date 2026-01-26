import api from "./api";

const productService = {
  /**
   * Get all products with filters
   * @param {Object} params - { search, category_id, min_price, max_price, sort_by, order, page, limit }
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/customer/products", { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get product by ID
   * @param {String} id - Product ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/customer/products/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get featured products
   * @param {Number} limit - Number of products to return
   */
  getFeatured: async (limit = 10) => {
    try {
      const response = await api.get("/customer/products/featured/list", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get related products
   * @param {String} productId - Product ID
   * @param {Number} limit - Number of products to return
   */
  getRelated: async (productId, limit = 5) => {
    try {
      const response = await api.get(
        `/customer/products/${productId}/related`,
        {
          params: { limit },
        },
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default productService;
