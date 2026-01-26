import api from "./api";

const categoryService = {
  /**
   * Get all categories
   */
  getAll: async () => {
    try {
      const response = await api.get("/customer/categories");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get category by ID
   * @param {String} id - Category ID
   * @param {Boolean} includeProducts - Include products in response
   */
  getById: async (id, includeProducts = false) => {
    try {
      const params = includeProducts ? { include_products: true } : {};
      const response = await api.get(`/customer/categories/${id}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get category tree structure
   */
  getTree: async () => {
    try {
      const response = await api.get("/customer/categories/tree/all");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default categoryService;
