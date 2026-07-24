import createApiClient from "./createApiClient";

const orderApi = createApiClient(import.meta.env.VITE_ORDER_API);

export const createOrder = async (payload) => {
  const { data } = await orderApi.post("/orders", payload);
  return data;
};

export const getOrders = async (params = {}) => {
  const { data } = await orderApi.get("/orders", {
    params,
  });
  return data.data;
};
