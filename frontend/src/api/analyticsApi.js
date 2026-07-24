import createApiClient from "./createApiClient";

const analyticsApi = createApiClient(import.meta.env.VITE_ANALYTICS_API);

export const getAnalytics = async () => {
  const { data } = await analyticsApi.get("/analytics");
  return data.data;
};
