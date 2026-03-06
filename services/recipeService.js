import api from "./api";

const recipeService = {
  getAll: async (params = {}) => {
    const response = await api.get("/customer/recipes", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customer/recipes/${id}`);
    return response.data;
  },
};

export default recipeService;

