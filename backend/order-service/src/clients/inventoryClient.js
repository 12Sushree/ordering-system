const axios = require("axios");
const logger = require("../../../shared/logger/logger");

const inventoryApi = axios.create({
  baseURL: process.env.INVENTORY_SERVICE_URL,
  timeout: 5000,
});

async function getProduct(productId, token, requestId) {
  try {
    const response = await inventoryApi.get(`/api/products/${productId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "x-request-id": requestId,
      },
    });
    return response.data.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error(`Product not found: ${productId}`);
      }
      throw new Error(`Inventory Service Error: ${status}`);
    }

    if (error.code === "ECONNABORTED") {
      logger.error(`Inventory timeout for product ${productId}`);
      throw new Error("Inventory Service timeout");
    }

    logger.error(`Inventory unavailable :: ${error.message}`);
    throw new Error("Inventory Service unavailable");
  }
}

module.exports = {
  getProduct,
};
