const { sendSuccess, sendError } = require("../../../shared/utils/response");
const productService = require("../services/productService");

async function syncProducts(req, res, next) {
  try {
    const result = await productService.syncProducts();

    sendSuccess(res, {
      message: "Products synchronized successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const products = await productService.getProducts();

    sendSuccess(res, { data: products });
  } catch (error) {
    next(error);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return sendError(res, { statusCode: 404, message: "Product not found" });
    }

    sendSuccess(res, { data: product });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  syncProducts,
  getProducts,
  getProduct,
};
