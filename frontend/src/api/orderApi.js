import api from "./axios";

export const getProducts = async (params = {}) => {
  const response = await api.get("/products/public", { params });
  return response.data.data;
};

export const getInventory = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data.data;
};

export const createOrder = async (payload) => {
  const response = await api.post("/orders", payload);
  return response.data;
};

export const getOrders = async (params = {}) => {
  const response = await api.get("/orders", { params });
  return response.data.data;
};
