import createApiClient from "./createApiClient";

const inventoryApi = createApiClient(import.meta.env.VITE_INVENTORY_API);

export const getProducts = async (params = {}) => {
  const { data } = await inventoryApi.get("/products/public", {
    params,
  });
  return data.data;
};

export const getInventory = async (params = {}) => {
  const { data } = await inventoryApi.get("/products", {
    params,
  });
  return data.data;
};
