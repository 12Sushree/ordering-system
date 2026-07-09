import axios from "axios";

const analyticsApi = axios.create({
  baseURL: "http://localhost:5003/api",
});

export const getAnalytics = async () => {
  const response = await analyticsApi.get("/analytics");
  return response.data.data;
};
