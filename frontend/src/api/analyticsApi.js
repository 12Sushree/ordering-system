import axios from "axios";

const analyticsApi = axios.create({
  baseURL: "http://localhost:5003/api",
});

analyticsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getAnalytics = async () => {
  const response = await analyticsApi.get("/analytics");
  return response.data.data;
};
