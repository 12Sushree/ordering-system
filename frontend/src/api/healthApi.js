import axios from "axios";

const serviceClients = {
  auth: axios.create({
    baseURL: import.meta.env.VITE_AUTH_BASE,
  }),
  order: axios.create({
    baseURL: import.meta.env.VITE_ORDER_BASE,
  }),
  inventory: axios.create({
    baseURL: import.meta.env.VITE_INVENTORY_BASE,
  }),
  notification: axios.create({
    baseURL: import.meta.env.VITE_NOTIFICATION_BASE,
  }),
  analytics: axios.create({
    baseURL: import.meta.env.VITE_ANALYTICS_BASE,
  }),
};

export const getServiceHealth = async (serviceName) => {
  const client = serviceClients[serviceName];
  if (!client) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  const { data } = await client.get("/health");

  return {
    name: serviceName,
    ok: Boolean(data?.success),
    payload: data,
  };
};
