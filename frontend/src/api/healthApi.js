import axios from "axios";

const serviceClients = {
  order: axios.create({
    baseURL: "http://localhost:5000",
  }),
  inventory: axios.create({
    baseURL: "http://localhost:5001",
  }),
  notification: axios.create({
    baseURL: "http://localhost:5002",
  }),
  analytics: axios.create({
    baseURL: "http://localhost:5003",
  }),
};

export const getServiceHealth = async (serviceName) => {
  const client = serviceClients[serviceName];

  if (!client) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  const response = await client.get("/health");

  return {
    name: serviceName,
    ok: Boolean(response.data?.success),
    payload: response.data,
  };
};
