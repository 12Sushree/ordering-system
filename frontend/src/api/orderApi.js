import api from "./axios";

export const getProducts = async () => {
  const response = await api.get("/products");
  return response.data.data;
};

export const createOrder = async (payload) => {
  const response = await api.post("/orders", payload);
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get("/orders");
  return response.data.data;
};
