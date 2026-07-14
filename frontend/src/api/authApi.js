import api from "./axios";

export const login = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data.data;
};

export const register = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data.data;
};

export const registerAdmin = async (payload) => {
  const response = await api.post("/auth/register/admin", payload);
  return response.data.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

export const getUsers = async (params = {}) => {
  const response = await api.get("/auth/users", { params });
  return response.data.data;
};

export const requestPasswordReset = async (payload) => {
  const response = await api.post("/auth/password/forgot", payload);
  return response.data.data;
};

export const resetPassword = async (payload) => {
  const response = await api.post("/auth/password/reset", payload);
  return response.data.data;
};
