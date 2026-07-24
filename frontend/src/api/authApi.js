import createApiClient from "./createApiClient";

const authApi = createApiClient(import.meta.env.VITE_AUTH_API);

export const login = async (payload) => {
  const { data } = await authApi.post("/auth/login", payload);
  return data.data;
};

export const register = async (payload) => {
  const { data } = await authApi.post("/auth/register", payload);
  return data.data;
};

export const registerAdmin = async (payload) => {
  const { data } = await authApi.post("/auth/register/admin", payload);
  return data.data;
};

export const getMe = async () => {
  const { data } = await authApi.get("/auth/me");
  return data.data;
};

export const getUsers = async (params = {}) => {
  const { data } = await authApi.get("/auth/users", {
    params,
  });

  return data.data;
};

export const requestPasswordReset = async (payload) => {
  const { data } = await authApi.post("/auth/password/forgot", payload);
  return data.data;
};

export const resetPassword = async (payload) => {
  const { data } = await authApi.post("/auth/password/reset", payload);
  return data.data;
};
